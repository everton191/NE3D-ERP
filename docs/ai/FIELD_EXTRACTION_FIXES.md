# Field extraction fixes after field-validation-v1

Datasets remain frozen: legacy 80 cases and `field-validation-v1` 1.0.0 with 60 cases. No LFM tuning is performed in this sequence.

## Block 1 — navigation target

Root cause: `navigation.open` exposed `target`, but Needle returned an empty argument object. There was no deterministic target extractor, and CandidateRetriever only recognized a narrow `abre/abrir` prefix. Explicit navigation phrases therefore lost the field or were routed to domain intents.

Fix: `navigation-target-resolver.js` derives destinations exclusively from `ScreenRegistry`. It requires an explicit navigation command and accepts only registered screen IDs, titles or aliases. The same resolver feeds the deterministic extractor and CandidateRetriever. Generic copying after “abre” is not used.

Field-validation-v1 before → after:

- target recall: 0/6 → 6/6;
- target precision: 0/0 → 6/6;
- exact match: 39/60 (65%) → 45/60 (75%);
- micro precision: 59/72 (81.94%) → 65/78 (83.33%);
- micro recall: 59/80 (73.75%) → 65/80 (81.25%);
- micro F1: 77.63% → 82.28%;
- intent: 75% → 80%; tool: 70% → 73.33%; schema: unchanged at 96.67%;
- technical failures: 0; `writeExposed=0`.

Negative target cases remained negative.
