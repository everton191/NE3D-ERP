# Needle runtime contract

The Android bridge is `SimplificaNeedle -> NeedleProvider -> NeedleNativeBridge -> libneedle.a`. It uses the official pinned `needle.h`, targets only `arm64-v8a`, and accepts no arbitrary native function, URL, or filesystem path from JavaScript.

`NeedleProvider` has one worker because Needle's model is process-global and not thread-safe. The official API has no unload or cancellation call, so `cancelSupported` is false; only a queued download may be cancelled. Model weights are verified by expected size and SHA-256 before native loading. A successful health result requires weights, checksum, native load, init, tool-call probe, and embedding probe.

Needle is lazy-loaded and never changes the existing router or executes ERP actions.
