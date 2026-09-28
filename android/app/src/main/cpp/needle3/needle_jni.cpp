#include <jni.h>
#include <fstream>
#include <mutex>
#include <sstream>
#include <string>
#include <vector>
#include "needle.h"

namespace {
std::mutex gate;
bool loaded = false;
std::string escape(const std::string &value) { std::string out; for (char c : value) { if (c == '\\' || c == '"') out += '\\'; if (c == '\n') out += "\\n"; else if (c != '\r') out += c; } return out; }
jstring envelope(JNIEnv *env, bool ok, const std::string &body = "") { return env->NewStringUTF((std::string("{\"ok\":") + (ok ? "true" : "false") + body + "}").c_str()); }
std::string lastError() { const char *error = needle_last_error(); return error ? error : "UNKNOWN_NATIVE_ERROR"; }
}

extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_NeedleNativeBridge_nativeLoad(JNIEnv *env, jobject, jstring pathValue) {
  std::lock_guard<std::mutex> lock(gate);
  const char *path = env->GetStringUTFChars(pathValue, nullptr); std::ifstream file(path, std::ios::binary); env->ReleaseStringUTFChars(pathValue, path);
  if (!file) return envelope(env, false, ",\"error\":\"MODEL_NOT_INSTALLED\"");
  std::vector<unsigned char> bytes((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
  if (bytes.empty()) return envelope(env, false, ",\"error\":\"MODEL_LOAD_FAILED\"");
  int result = needle_load(bytes.data(), static_cast<unsigned long long>(bytes.size()));
  if (result < 0) return envelope(env, false, ",\"error\":\"" + escape(lastError()) + "\"");
  loaded = true; return envelope(env, true, ",\"bytes\":" + std::to_string(bytes.size()));
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_NeedleNativeBridge_nativeInit(JNIEnv *env, jobject, jstring systemValue, jstring toolsValue) {
  std::lock_guard<std::mutex> lock(gate); if (!loaded) return envelope(env, false, ",\"error\":\"MODEL_NOT_INSTALLED\"");
  const char *system = env->GetStringUTFChars(systemValue, nullptr); const char *tools = env->GetStringUTFChars(toolsValue, nullptr);
  int prefix = needle_init(system, tools, nullptr); env->ReleaseStringUTFChars(systemValue, system); env->ReleaseStringUTFChars(toolsValue, tools);
  if (prefix < 0) return envelope(env, false, ",\"error\":\"" + escape(lastError()) + "\",\"prefixTokens\":" + std::to_string(prefix));
  return envelope(env, true, ",\"prefixTokens\":" + std::to_string(prefix));
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_NeedleNativeBridge_nativeComplete(JNIEnv *env, jobject, jstring inputValue, jint maxTokens) {
  std::lock_guard<std::mutex> lock(gate); const char *input = env->GetStringUTFChars(inputValue, nullptr); std::vector<char> output(8192);
  int result = needle_complete(input, maxTokens, output.data(), static_cast<int>(output.size())); env->ReleaseStringUTFChars(inputValue, input);
  if (result < 0) return envelope(env, false, ",\"error\":\"" + escape(lastError()) + "\"");
  return envelope(env, true, ",\"result\":\"" + escape(std::string(output.data())) + "\",\"tokens\":" + std::to_string(result));
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_NeedleNativeBridge_nativeEmbed(JNIEnv *env, jobject, jstring inputValue) {
  std::lock_guard<std::mutex> lock(gate); const char *input = env->GetStringUTFChars(inputValue, nullptr); int dimension = needle_embed(input, nullptr, 0); if (dimension < 0) { env->ReleaseStringUTFChars(inputValue, input); return envelope(env, false, ",\"error\":\"" + escape(lastError()) + "\""); }
  std::vector<float> values(dimension); int result = needle_embed(input, values.data(), dimension); env->ReleaseStringUTFChars(inputValue, input); if (result < 0) return envelope(env, false, ",\"error\":\"" + escape(lastError()) + "\"");
  std::ostringstream json; json << ",\"dimension\":" << result << ",\"values\":["; for (int i=0; i<result; ++i) { if (i) json << ','; json << values[i]; } json << ']'; return envelope(env, true, json.str());
}
extern "C" JNIEXPORT jstring JNICALL Java_br_com_ne3d_erp_ai_NeedleNativeBridge_nativeReset(JNIEnv *env, jobject) { std::lock_guard<std::mutex> lock(gate); needle_reset(); return envelope(env, true); }
