# Generic llama.cpp runtime — Phase 5B.3

Before: `FunctionGemmaToolRuntime -> LlamaCppBackend`.

After: `FunctionGemmaToolRuntime (compatibility adapter) -> LlamaCppBackend (generic local runtime contract)`; a future LFM adapter uses the same backend.

`LlamaCppBackend` now exposes `ModelConfig`, `GenerateRequest`, `loadModel`, generic `generate`, `status` and lifecycle states `UNLOADED`, `LOADING`, `LOADED`, `WARMING`, `READY`, `GENERATING`, `CANCELLING`, `FAILED`. Existing `load(file, sha)` and `generate(prompt, ...)` remain compatibility bridges for FunctionGemma.

The single worker remains the owner of load, warmup, generation and unload. The generic configuration validates a nonempty accessible file and optional SHA before JNI model loading. Grammar is carried by `GenerateRequest` but is intentionally not applied in JNI during this subphase.

The vendored llama.cpp revision `c060ca9` recognizes `lfm2`. Both validated LFM GGUFs contain their own chat template. No desktop CLI binary is currently built in this checkout, so desktop smoke remains pending a separate local build; no Android LFM import or inference was performed here.
