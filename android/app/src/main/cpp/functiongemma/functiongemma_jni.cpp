#include <jni.h>
#include <android/log.h>
#include <atomic>
#include <chrono>
#include <climits>
#include <cstdio>
#include <mutex>
#include <string>
#include <sys/auxv.h>
#include <asm/hwcap.h>
#include <vector>
#include "ggml-backend.h"
#include "llama.h"

namespace {
std::mutex gate;
llama_model * model = nullptr;
llama_context * context = nullptr;
std::atomic_bool cancelled = false;
std::atomic_bool backendInitialized = false;
long long loadMs = 0, warmupMs = 0, lastTtftMs = 0, lastTotalMs = 0;
long long lastPrefillMs = 0;
int lastTokens = 0, lastPromptTokens = 0;
std::string selectedBackend = "none";
int32_t contextSize = 1024;
// Tool prompts are intentionally compact. 64 cuts the CPU work buffer roughly
// in half while keeping the common 59-token navigation prompt in one prefill.
int32_t batchSize = 64;
// Keep two cores free for WebView/render/input work. On the Zenfone 8 the
// dot-product backend remains comfortably sub-second for warm tool calls with
// two inference threads, while sustained calls contend less with the UI.
int32_t threadCount = 2;

jstring result(JNIEnv * env, const std::string & value) { return env->NewStringUTF(value.c_str()); }
std::string errorResult(const char * code, bool wasCancelled = false) {
    return std::string("{\"ok\":false,\"text\":\"\",\"tokensGenerated\":0,\"ttftMs\":0,\"totalMs\":0,\"cancelled\":") + (wasCancelled ? "true" : "false") + ",\"error\":\"" + code + "\"}";
}
std::string jsonEscape(const std::string & value) {
    std::string out;
    for (unsigned char c : value) {
        switch (c) { case '\\': out += "\\\\"; break; case '"': out += "\\\""; break; case '\n': out += "\\n"; break; case '\r': out += "\\r"; break; case '\t': out += "\\t"; break;
            default: if (c < 0x20) { char b[7]; std::snprintf(b, sizeof(b), "\\u%04x", c); out += b; } else out += static_cast<char>(c); }
    }
    return out;
}
void freeContextLocked() { if (context) { llama_free(context); context = nullptr; } }
void freeModelLocked() { if (model) { llama_model_free(model); model = nullptr; } }
bool abortCallback(void *) { return cancelled.load(std::memory_order_relaxed); }
void llamaLogCallback(enum ggml_log_level level, const char * text, void *) {
    if (level == GGML_LOG_LEVEL_WARN) __android_log_print(ANDROID_LOG_WARN, "FunctionGemma", "%s", text);
    else if (level == GGML_LOG_LEVEL_ERROR) __android_log_print(ANDROID_LOG_ERROR, "FunctionGemma", "%s", text);
}
bool decodeTokens(const std::vector<llama_token> & tokens) {
    __android_log_print(ANDROID_LOG_INFO, "FunctionGemma", "decoding prompt tokens=%zu", tokens.size());
    for (size_t offset = 0; offset < tokens.size(); offset += batchSize) {
        const int32_t count = static_cast<int32_t>(std::min<size_t>(batchSize, tokens.size() - offset));
        llama_batch batch = llama_batch_init(count, 0, 1);
        batch.n_tokens = count;
        for (int32_t i = 0; i < count; ++i) { batch.token[i] = tokens[offset + i]; batch.pos[i] = static_cast<llama_pos>(offset + i); batch.n_seq_id[i] = 1; batch.seq_id[i][0] = 0; batch.logits[i] = offset + i + 1 == tokens.size(); }
        const int32_t decoded = llama_decode(context, batch); llama_batch_free(batch);
        if (decoded != 0 || cancelled.load(std::memory_order_relaxed)) {
            __android_log_print(ANDROID_LOG_WARN, "FunctionGemma", "prompt decode stopped code=%d cancelled=%d", decoded, cancelled.load() ? 1 : 0);
            return false;
        }
    }
    __android_log_print(ANDROID_LOG_INFO, "FunctionGemma", "prompt decode complete");
    return true;
}
} // namespace

extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeInit(JNIEnv * env, jobject, jstring apkPathValue) {
    std::lock_guard<std::mutex> lock(gate);
    if (backendInitialized.load()) return result(env, "{\"ok\":true,\"backend\":\"" + selectedBackend + "\"}");
    const char * path = env->GetStringUTFChars(apkPathValue, nullptr); if (!path) return result(env, errorResult("APK_PATH_INVALID"));
    llama_log_set(llamaLogCallback, nullptr);
    const bool hasDotprod = (getauxval(AT_HWCAP) & HWCAP_ASIMDDP) != 0;
    const std::string apkPath(path);
    env->ReleaseStringUTFChars(apkPathValue, path);
    const std::string dotprodPath = apkPath + "!/lib/arm64-v8a/libggml-cpu-android_armv8.2_1.so";
    const std::string fallbackPath = apkPath + "!/lib/arm64-v8a/libggml-cpu-android_armv8.0_1.so";
    ggml_backend_reg_t registration = nullptr;
    if (hasDotprod) {
        __android_log_print(ANDROID_LOG_INFO, "FunctionGemma", "loading CPU backend armv8.2+dotprod from APK");
        registration = ggml_backend_load(dotprodPath.c_str());
        if (registration) selectedBackend = "armv8.2+dotprod";
    }
    if (!registration) {
        __android_log_print(ANDROID_LOG_INFO, "FunctionGemma", "loading CPU backend armv8.0 fallback from APK");
        registration = ggml_backend_load(fallbackPath.c_str());
        if (registration) selectedBackend = "armv8.0";
    }
    if (!registration) return result(env, errorResult("CPU_BACKEND_LOAD_FAILED"));
    llama_backend_init(); backendInitialized = true;
    return result(env, "{\"ok\":true,\"backend\":\"" + selectedBackend + "\"}");
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeLoadModel(JNIEnv * env, jobject, jstring pathValue, jint requestedContextSize, jint requestedBatchSize, jint requestedThreads) {
    std::lock_guard<std::mutex> lock(gate); if (!backendInitialized.load()) return result(env, errorResult("BACKEND_NOT_INITIALIZED"));
    const char * path = env->GetStringUTFChars(pathValue, nullptr); if (!path) return result(env, errorResult("MODEL_PATH_INVALID"));
    if (requestedContextSize < 256 || requestedContextSize > 16384 || requestedBatchSize < 0 || requestedBatchSize > 1024 || requestedThreads < 0 || requestedThreads > 8) return result(env, errorResult("MODEL_CONFIG_INVALID"));
    contextSize = requestedContextSize;
    batchSize = requestedBatchSize > 0 ? requestedBatchSize : 64;
    threadCount = requestedThreads > 0 ? requestedThreads : 2;
    __android_log_print(ANDROID_LOG_INFO, "LocalLlama", "loading GGUF from %s context=%d batch=%d threads=%d", path, contextSize, batchSize, threadCount);
    freeContextLocked(); freeModelLocked(); cancelled = false; const auto started = std::chrono::steady_clock::now(); model = llama_model_load_from_file(path, llama_model_default_params()); env->ReleaseStringUTFChars(pathValue, path);
    loadMs = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - started).count();
    return result(env, model ? "{\"ok\":true,\"loadMs\":" + std::to_string(loadMs) + "}" : errorResult("MODEL_LOAD_FAILED"));
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeWarmup(JNIEnv * env, jobject) {
    std::lock_guard<std::mutex> lock(gate); if (!model) return result(env, errorResult("MODEL_NOT_LOADED")); freeContextLocked();
    auto params = llama_context_default_params();
    params.n_ctx = contextSize;
    params.n_batch = batchSize;
    params.n_ubatch = batchSize;
    params.n_threads = threadCount;
    params.n_threads_batch = threadCount;
    context = llama_init_from_model(model, params); if (context) llama_set_abort_callback(context, abortCallback, nullptr);
    if (!context) return result(env, errorResult("CONTEXT_INIT_FAILED"));
    const llama_vocab * vocab = llama_model_get_vocab(model);
    const llama_token warmToken = llama_vocab_bos(vocab);
    if (warmToken == LLAMA_TOKEN_NULL) return result(env, errorResult("WARMUP_TOKEN_MISSING"));
    cancelled = false;
    const auto started = std::chrono::steady_clock::now();
    llama_batch batch = llama_batch_get_one(const_cast<llama_token *>(&warmToken), 1);
    const int32_t decoded = llama_decode(context, batch);
    llama_synchronize(context);
    llama_memory_clear(llama_get_memory(context), true);
    warmupMs = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - started).count();
    if (decoded != 0 || cancelled.load()) return result(env, errorResult(cancelled.load() ? "CANCELLED" : "WARMUP_FAILED", cancelled.load()));
    __android_log_print(ANDROID_LOG_INFO, "LocalLlama", "warmup complete ms=%lld", warmupMs);
    return result(env, "{\"ok\":true,\"contextTokens\":" + std::to_string(contextSize) + ",\"batchTokens\":" + std::to_string(batchSize) + ",\"threads\":" + std::to_string(threadCount) + ",\"warmupMs\":" + std::to_string(warmupMs) + "}");
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeGenerate(JNIEnv * env, jobject, jstring systemValue, jstring promptValue, jstring grammarValue, jint maxTokens, jfloat temperature, jfloat topP) {
    std::lock_guard<std::mutex> lock(gate);
    if (!model || !context) return result(env, errorResult("MODEL_NOT_READY"));
    if (maxTokens < 1 || maxTokens > 128 || temperature < 0.0f || temperature > 2.0f || topP <= 0.0f || topP > 1.0f) return result(env, errorResult("INVALID_GENERATION_PARAMS"));
    const char * chars = env->GetStringUTFChars(promptValue, nullptr); if (!chars) return result(env, errorResult("PROMPT_INVALID")); const std::string userPrompt(chars); env->ReleaseStringUTFChars(promptValue, chars); if (userPrompt.empty()) return result(env, errorResult("PROMPT_EMPTY"));
    const char * systemChars = env->GetStringUTFChars(systemValue, nullptr); if (!systemChars) return result(env, errorResult("SYSTEM_PROMPT_INVALID")); const std::string systemPrompt(systemChars); env->ReleaseStringUTFChars(systemValue, systemChars);
    const char * grammarChars = env->GetStringUTFChars(grammarValue, nullptr); if (!grammarChars) return result(env, errorResult("GRAMMAR_INVALID")); const std::string grammar(grammarChars); env->ReleaseStringUTFChars(grammarValue, grammarChars);
    try {
        const char * templateName = llama_model_chat_template(model, nullptr);
        if (!templateName) return result(env, errorResult("CHAT_TEMPLATE_MISSING"));
        const llama_chat_message messages[] = { { "system", systemPrompt.c_str() }, { "user", userPrompt.c_str() } };
        const llama_chat_message * activeMessages = systemPrompt.empty() ? &messages[1] : messages;
        const size_t messageCount = systemPrompt.empty() ? 1 : 2;
        const int32_t formattedLength = llama_chat_apply_template(templateName, activeMessages, messageCount, true, nullptr, 0);
        if (formattedLength <= 0) return result(env, errorResult("CHAT_TEMPLATE_FAILED"));
        std::vector<char> formatted(static_cast<size_t>(formattedLength) + 1, '\0');
        if (llama_chat_apply_template(templateName, activeMessages, messageCount, true, formatted.data(), static_cast<int32_t>(formatted.size())) != formattedLength) return result(env, errorResult("CHAT_TEMPLATE_FAILED"));
        const std::string prompt(formatted.data(), static_cast<size_t>(formattedLength));
        const llama_vocab * vocab = llama_model_get_vocab(model); const int32_t required = llama_tokenize(vocab, prompt.c_str(), static_cast<int32_t>(prompt.size()), nullptr, 0, false, true);
        if (required >= 0 || required == INT32_MIN) return result(env, errorResult("TOKENIZE_FAILED")); const int32_t count = -required;
        if (count + maxTokens >= static_cast<int32_t>(llama_n_ctx(context))) return result(env, errorResult("PROMPT_TOO_LONG"));
        std::vector<llama_token> tokens(count); if (llama_tokenize(vocab, prompt.c_str(), static_cast<int32_t>(prompt.size()), tokens.data(), count, false, true) != count) return result(env, errorResult("TOKENIZE_FAILED"));
        __android_log_print(ANDROID_LOG_INFO, "LocalLlama", "chat template applied messages=%zu grammar=%s chars=%zu tokens=%d maxTokens=%d", messageCount, grammar.empty() ? "off" : "on", prompt.size(), count, maxTokens);
        cancelled = false; lastTtftMs = 0; lastTotalMs = 0; lastPrefillMs = 0; lastTokens = 0; lastPromptTokens = count; llama_memory_clear(llama_get_memory(context), false); const auto started = std::chrono::steady_clock::now();
        if (!decodeTokens(tokens)) return result(env, errorResult(cancelled.load() ? "CANCELLED" : "PROMPT_DECODE_FAILED", cancelled.load()));
        lastPrefillMs = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - started).count();
        llama_sampler * sampler = nullptr;
        if (!grammar.empty() || temperature > 0.0f) {
            sampler = llama_sampler_chain_init(llama_sampler_chain_default_params());
            if (!grammar.empty()) {
                llama_sampler * grammarSampler = llama_sampler_init_grammar(vocab, grammar.c_str(), "root");
                if (!grammarSampler) { llama_sampler_free(sampler); return result(env, errorResult("GRAMMAR_INIT_FAILED")); }
                llama_sampler_chain_add(sampler, grammarSampler);
            }
            if (temperature <= 0.0f) {
                llama_sampler_chain_add(sampler, llama_sampler_init_greedy());
            } else {
            llama_sampler_chain_add(sampler, llama_sampler_init_top_k(20));
            llama_sampler_chain_add(sampler, llama_sampler_init_top_p(topP, 1));
            llama_sampler_chain_add(sampler, llama_sampler_init_temp(temperature));
            llama_sampler_chain_add(sampler, llama_sampler_init_dist(42));
            }
        } else {
            sampler = llama_sampler_init_greedy();
        }
        std::string output;
        for (int generated = 0; generated < maxTokens; ++generated) {
            if (cancelled.load()) { llama_sampler_free(sampler); return result(env, errorResult("CANCELLED", true)); }
            const llama_token token = llama_sampler_sample(sampler, context, -1);
            if (!lastTtftMs) lastTtftMs = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - started).count();
            if (llama_vocab_is_eog(vocab, token)) break;
            char piece[256]; const int32_t size = llama_token_to_piece(vocab, token, piece, sizeof(piece), 0, true); if (size < 0 || size > static_cast<int32_t>(sizeof(piece))) { llama_sampler_free(sampler); return result(env, errorResult("TOKEN_TO_PIECE_FAILED")); } output.append(piece, size);
            ++lastTokens;
            // The bundled llama.cpp revision throws after accepting a token that
            // completes a grammar. LFM uses grammar only for one closed JSON
            // object, so stop at its final delimiter before that broken accept.
            if (!grammar.empty() && !output.empty() && output.back() == '}') break;
            llama_sampler_accept(sampler, token);
            const size_t functionStop = output.find("<end_function_call>");
            const size_t turnStop = output.find("<end_of_turn>");
            if (functionStop != std::string::npos || turnStop != std::string::npos) {
                const bool isFunction = functionStop != std::string::npos;
                const size_t stopAt = isFunction ? functionStop : turnStop;
                const size_t markerSize = isFunction ? std::string("<end_function_call>").size() : std::string("<end_of_turn>").size();
                output.resize(stopAt + markerSize);
                __android_log_print(ANDROID_LOG_INFO, "FunctionGemma", "generation stop marker reached tokens=%d", lastTokens);
                break;
            }
            llama_batch batch = llama_batch_init(1, 0, 1); batch.n_tokens = 1; batch.token[0] = token; batch.pos[0] = count + generated; batch.n_seq_id[0] = 1; batch.seq_id[0][0] = 0; batch.logits[0] = 1; const int32_t decoded = llama_decode(context, batch); llama_batch_free(batch);
            if (decoded != 0) { llama_sampler_free(sampler); return result(env, errorResult(cancelled.load() ? "CANCELLED" : "GENERATION_DECODE_FAILED", cancelled.load())); }
        }
        llama_sampler_free(sampler); lastTotalMs = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - started).count();
        return result(env, "{\"ok\":true,\"text\":\"" + jsonEscape(output) + "\",\"promptTokens\":" + std::to_string(lastPromptTokens) + ",\"tokensGenerated\":" + std::to_string(lastTokens) + ",\"prefillMs\":" + std::to_string(lastPrefillMs) + ",\"ttftMs\":" + std::to_string(lastTtftMs) + ",\"totalMs\":" + std::to_string(lastTotalMs) + ",\"chatMessages\":" + std::to_string(messageCount) + ",\"grammarApplied\":" + (grammar.empty() ? "false" : "true") + ",\"cancelled\":false,\"error\":null}");
    } catch (const std::exception & error) { __android_log_print(ANDROID_LOG_ERROR, "LocalLlama", "generation exception: %s", error.what()); return result(env, errorResult("NATIVE_EXCEPTION")); }
      catch (...) { __android_log_print(ANDROID_LOG_ERROR, "LocalLlama", "generation exception: unknown"); return result(env, errorResult("NATIVE_EXCEPTION")); }
}
extern "C" JNIEXPORT void JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeCancel(JNIEnv *, jobject) { cancelled = true; }
extern "C" JNIEXPORT void JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeUnload(JNIEnv *, jobject) { std::lock_guard<std::mutex> lock(gate); cancelled = true; freeContextLocked(); freeModelLocked(); cancelled = false; }
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_LlamaCppBackend_nativeGetMetrics(JNIEnv * env, jobject) { std::lock_guard<std::mutex> lock(gate); return result(env, "{\"backend\":\"" + selectedBackend + "\",\"loadMs\":" + std::to_string(loadMs) + ",\"warmupMs\":" + std::to_string(warmupMs) + ",\"promptTokens\":" + std::to_string(lastPromptTokens) + ",\"prefillMs\":" + std::to_string(lastPrefillMs) + ",\"ttftMs\":" + std::to_string(lastTtftMs) + ",\"totalMs\":" + std::to_string(lastTotalMs) + ",\"tokensGenerated\":" + std::to_string(lastTokens) + ",\"contextTokens\":" + std::to_string(contextSize) + ",\"batchTokens\":" + std::to_string(batchSize) + ",\"threads\":" + std::to_string(threadCount) + ",\"loaded\":" + (model ? "true" : "false") + "}"); }
