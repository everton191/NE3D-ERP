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

## Block 2 — inventory search query

Root cause: query extraction depended on Needle. It sometimes retained the command verb (`pesquisa`, `procura`) in the value, while CandidateRetriever did not recognize valid search verbs such as `encontra` and `localizar`, preventing `inventory.search` from being selected.

Fix: `inventory-query-resolver.js` requires an explicit search verb, accepts only constrained command prefixes, removes `por` and the terminal `no/do estoque`, and returns the useful search term. It does not run for stock-quantity questions and does not produce `materialName`. CandidateRetriever uses the same resolver to select `inventory.search`.

Field-validation-v1 after block 1 → after block 2:

- query precision: 2/4 → 6/6;
- query recall: 2/6 → 6/6;
- exact match: 45/60 (75%) → 49/60 (81.67%);
- micro precision: 65/78 (83.33%) → 69/80 (86.25%);
- micro recall: 65/80 (81.25%) → 69/80 (86.25%);
- micro F1: 82.28% → 86.25%;
- intent: 80% → 85%; tool: 73.33% → 76.67%; schema: 96.67% → 98.33%;
- technical failures: 0; `writeExposed=0`.

Both query-negative cases remained without a query.

## Block 3 — order description and quantity

Root cause: a generic `number + free text` expression treated any later number as an item quantity. Prices could replace quantities, `reais` could become the description, and unrelated numeric phrases could be classified as order creation.

Fix: `order-item-resolver.js` recognizes only bounded order structures: explicit create verbs, customer-first order phrases, bare item phrases that include a customer destination, and the active-order continuation `adiciona mais N nesse pedido`. It stops descriptions before customer and price clauses. CandidateRetriever uses the same structure, so extraction and routing cannot drift independently.

Field-validation-v1 after block 2 → after block 3:

- description precision/recall: 5/10 → 10/10;
- quantity precision/recall: 6/10 → 10/10;
- exact match: 49/60 (81.67%) → 55/60 (91.67%);
- micro precision: 69/80 (86.25%) → 78/82 (95.12%);
- micro recall: 69/80 (86.25%) → 78/80 (97.5%);
- micro F1: 86.25% → 96.3%;
- technical failures: 0; `writeExposed=0`.

The legacy 65/15 evaluation completed without technical failures. The holdout case `other-013` retained `customerName=Maria`, and order-number extraction remained 2/2 in tuning.

## Block 4 — order customer and combined reference

Root cause: the old customer expression was case-insensitive even inside its uppercase character class. That allowed common nouns and model guesses (`impressora`, `Adiciona`) to become customer names, while the pattern could not read a customer after a numeric order reference.

Fix: `order-customer-resolver.js` accepts only explicit order/customer structures and a genuinely uppercase proper-name token, with reserved material/printer nouns rejected. It supports `pedido 123 da Maria` as `orderNumber=123` plus `customerName=Maria`. The execution contract of `orders.get` remains unchanged: `orderNumber` resolves to the real `orderId`; `customerName` is a parsed qualifier, not an invented action argument. For `orders.create`, customer and description remain declared supported fields but are deterministic-only in the Needle schema, preventing model-only hallucinations when the user did not provide them.

Field-validation-v1 after block 3 → final:

- customerName precision/recall: 17/19 and 17/18 → 18/18 and 18/18;
- description precision/recall: unchanged at 10/10;
- orderNumber precision/recall: unchanged at 4/4;
- exact match: 55/60 (91.67%) → 58/60 (96.67%);
- micro precision: 78/82 (95.12%) → 79/81 (97.53%);
- micro recall: 78/80 (97.5%) → 79/80 (98.75%);
- micro F1: 96.3% → 98.14%;
- technical failures: 0; `writeExposed=0`.

The two remaining non-exact cases are outside these four blocks: `field-material-002` (material value mismatch) and `field-calculation-008` (unexpected `timeMinutes`).
