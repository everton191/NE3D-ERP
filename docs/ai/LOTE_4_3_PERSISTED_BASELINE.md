# Lote 4.3 persisted baseline

## Status

`INFRA_READY_FOR_REAL_BASELINE = COMPLETED_SHADOW_BASELINE`

The persisted evaluation bridge, resume, duplicate rejection, incomplete summary, and APK overlay preservation are validated. The normal lazy IA runtime reported ready and the real shadow baseline completed on ASUS in run `run-e03b932f-316b-4a87-a02e-466ee8308402`: 80/80 total, 65 tuning and 15 holdout. This is a measurement only; it does not promote Needle.

## Baseline result

- Tuning intent accuracy: 69.23%; holdout intent accuracy: 46.67%.
- Tuning tool match: 70.77%; holdout tool match: 60.00%.
- Unresolved ID attempts: 0; hallucinated financial values: 1 total.
- Classification: `B — ROUTING_READY_NEEDLE_NOT_READY`.

## Update evidence

- Current build ID is generated deterministically by `scripts/prepare-web.js`.
- `dist` and Android copied assets must have equal hashes before an APK overlay install.
- Android does not use the PWA service worker; Capacitor serves the current APK assets and preserves app-private data.
- Needle model and existing evaluation runs are not build assets and remain in app-private storage.
