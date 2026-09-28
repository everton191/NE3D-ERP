package br.com.ne3d.erp.ai

/** Exact JNI boundary for the pinned Needle 3 header. Native state is global. */
class NeedleNativeBridge {
    external fun nativeLoad(path: String): String
    external fun nativeInit(systemPrompt: String, toolsJson: String): String
    external fun nativeComplete(input: String, maxTokens: Int): String
    external fun nativeEmbed(input: String): String
    external fun nativeReset(): String
    companion object { init { System.loadLibrary("needle_jni") } }
}
