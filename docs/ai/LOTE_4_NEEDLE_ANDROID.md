# Lote 4 — Needle 3 Android shadow

Needle 3 is integrated only as an opt-in local shadow (`SIMPLIFICA_NEEDLE_SHADOW_ENABLED === true`). The current route completes first; then the CandidateRetriever supplies at most three `READY` tools to the Android provider. `NO_MATCH`, blocked, missing-context, disabled, and degraded candidates do not invoke Needle.

The comparison records tool and argument matches separately, route and Needle confidence separately, latency, and only a bounded local telemetry record without the input text. A returned tool not in the candidate set is marked invalid and never reaches ActionPlan or execution.

Source/build artifacts: Cactus Compute Needle 3, Apache-2.0, revision `b274efcb211a9eef48c9a88da4b43bd569696a39`; model `needle3.cact`, SHA-256 `c9d915eca282ed42d1a09b143b592adb4cc6744ffe2d294adf5cfc5548170c38`; Android engine `android-arm64/libneedle.a`, SHA-256 `5e0a5daaadca1fbe1c518110bee6bbb1cc97a5e53a16a1e964d0af0186eac60a`; ABI `arm64-v8a`. The official `needle.h` Git object is pinned with that revision (local downloaded content SHA-256 `3aa713942528d944598458cecb4a262f2cc49349bec63355f91df0b159964e55`).

The 35 MB model is not in the APK. Install downloads only the pinned official URL to `files/ai/models/needle3/needle3.cact.part`, verifies it, then atomically renames it and records `manifest.json`. Import fallback accepts Android `content://` only.

## Validação real (Lote 4.1)

Em 2026-09-26 no ASUS_I005DA/API 33, a instalação oficial recebeu 35.335.380 bytes e o SHA-256 calculado no aparelho conferiu com o Manifest. Load (144 ms), init (56 ms, 60 tokens), health tool-call, embedding de 3.072 dimensões (42 ms), fila serial, restart e background/foreground passaram. A avaliação PT-BR completa e os bloqueios de promoção estão em `NEEDLE_PTBR_SHADOW_EVAL.md`; o resultado é `RUNTIME_READY_NEEDS_ROUTING_TUNING`, não promoção.
