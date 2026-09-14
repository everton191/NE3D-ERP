# AI LFM migration handoff

## Checkpoint and scope

The pre-phase checkpoint is `01cb133` (`checkpoint: preserve local home carousel work`). It contains the local Home/carousel work and was not pushed. Restore only this checkpoint with normal Git review; do not reset or discard the unrelated untracked workspace material.

This phase keeps the canonical Action Registry, deterministic router, domain executors and the WRITE boundary intact. No Supabase migration or production change was made.

## Architecture now

`command -> deterministic router -> WorkflowToolGraph -> tool mask -> ActionSearch Top-K <= 3 -> LocalToolModelAdapter -> strict adapter validation -> READ/PREPARE -> confirmation boundary -> WRITE blocked`

`src/ai/workflow-tool-graph.js` is generic. It uses the action metadata (`requires`, `produces`, `allowedNext`, `terminal`, `permission`, `operationType`) and compact `AiOperationalContext`-style data. It masks unhealthy, unauthorized, unsatisfied and WRITE actions before `ActionSearch` runs. `action-registry.js` remains the source of canonical action definitions and only adds declarative graph metadata.

`src/ai/local-tool-model-adapter.js` provides the generic local adapter contract. Existing `FunctionGemmaAdapter` remains the verified fallback. `Simplifica3dAiRuntime` exposes generic selection: `functiongemma-270m-it-q8_0`, `lfm2.5-1.2b-q6_k`, or `disabled` through `SIMPLIFICA_AI_TOOL_MODEL` / `__SIMPLIFICA_AI_TOOL_MODEL__`.

## Model state

FunctionGemma remains the only loadable fallback and has zero WRITE exposure. LFM2.5 1.2B Q6_K appears as `experimental-unavailable` only. No URL, SHA-256, revision, size, GGUF or tokenizer template was invented. Explicit LFM selection fails closed with `LFM_ARTIFACT_UNVERIFIED` until a real artifact is supplied and verified.

When a real GGUF is provided, add verified provenance to `models/models-manifest.v1.json`, implement the generic Android/Web loader without FunctionGemma prompt tokens, use strict JSON/constrained grammar, and then run the same fixed dataset. Do not alter expected cases to improve a score.

## Tests and commands

Run `npm.cmd run test:ai-action-registry`, `npm.cmd run test:ai-workflow-tool-graph`, `npm.cmd run test:functiongemma-shadow`, `npm.cmd run test:functiongemma-native-shadow`, `npm.cmd run test:functiongemma-web`, `npm.cmd run test:ui-v3-security-offline`, `npm.cmd run typecheck`, and `npm.cmd run build:web`.

For Android sync/build use `npm.cmd run android:sync` followed by the existing Gradle debug command. A connected device is still required for LFM load time, warmup, median/P95 latency, RSS, crashes/timeouts and tokens/sec. Do not claim a comparative benchmark before that device run.

## Safe Qwen tasks

1. Locate a real LFM2.5 1.2B Q6_K GGUF locally; verify hash, byte size, revision and license before recording metadata.
2. Add a generic llama.cpp model installer/runtime that obeys the existing `READ`/`PREPARE` allow-list and strict JSON parser.
3. Extend `training/functiongemma/evaluation.v1.jsonl` runner without mutating it: collect accuracy, NO_TOOL, mask escapes, latency, load/warmup, RSS and tokens/sec per model.
4. Run physical Android validation. Keep LFM experimental if any safety, parser, masking or stability condition fails.

## Requires strong review

Android native plugin generalization, GGUF chat-template handling, constrained decoding, model artifact distribution, and any WRITE pipeline change require human review. WRITE remains out of model candidates even after LFM validation.
