# LFM2.5 Phase 5

Initial SHA: `1aac958`.

## Verified runtime facts

The bundled llama.cpp source contains LFM2 support and grammar sampler implementation, plus memory/KV-cache primitives. The current Android Capacitor plugin exposes only the FunctionGemma load/predict/unload surface; it exposes neither a generic LFM loader nor grammar or cache controls. Therefore `CONSTRAINED_DECODING=RUNTIME_NOT_EXPOSED` and `CACHE_SUPPORTED=UPSTREAM_ONLY`, `CACHE_IMPLEMENTED=NO`, `CACHE_NOT_AVAILABLE=AT_APP_BOUNDARY`.

## Artifact state

No LFM2.5-1.2B Q4_0 or Q6_K GGUF was found in the local repository, Downloads or Documents search scope. Both registry descriptors are intentionally `experimental-unavailable` with `UNVERIFIED_SOURCE_REQUIRED`. No filename, size, SHA-256, tokenizer metadata, template or revision was invented.

## Architecture and safety

`deterministic router -> workflow graph -> mask -> Top-K <= 3 -> local adapter -> strict allow-list -> READ/PREPARE -> confirmation boundary`; WRITE stays blocked from the model. FunctionGemma remains the only available fallback/baseline.

## Benchmark

Q4_0 and Q6_K: `BLOCKED_BY_ARTIFACT`. No Android LFM load, warmup, latency, RSS, tokens/sec, accuracy, crash or timeout result exists. No preferred LFM quantization is selected.

## Required next input

Provide each real GGUF and its provenance. Then verify GGUF metadata/template, implement the generic Android plugin API using the existing llama.cpp capability, and run identical Q4/Q6 device benchmarks before selecting a default.
