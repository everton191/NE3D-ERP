# Field Validation v1 — inventário, separação de dados e baseline

## Escopo e conjuntos

Esta fase não altera o runtime, não faz tuning e não altera o corpus legado.

1. **LEGACY TUNING**: 65 casos de `ptbr-80`, preservados.
2. **LEGACY HOLDOUT**: 15 casos de `ptbr-80`, preservados. Este conjunto já foi observado repetidamente durante o desenvolvimento e não deve mais ser tratado como teste cego perfeito.
3. **FIELD VALIDATION**: 60 casos novos de `field-validation-v1` 1.0.0, destinados exclusivamente a extração, normalização e fusão de campos.

Os exemplos de regressão conhecidos aparecem somente no conjunto explicitamente versionado de validação de campos. Eles não foram adicionados ao tuning legado nem usados para alterar o runtime. Um futuro `blind-holdout-v1`, criado e congelado depois das correções motivadas por este baseline, é recomendado; ele não deve ser usado para tuning.

## Inventário do contrato efetivamente exposto

O schema dinâmico expõe todos os parâmetros como opcionais ao modelo (`required: []`). A coluna “negócio” registra o requisito declarado no `IntentRegistry`, que pode usar um identificador resolvido em vez do nome textual aceito pelo modelo.

| Campo | Tool/intenção | Tipo | Obrigatoriedade | Validação e normalização | Exemplos válidos / inválidos | Origem possível |
| --- | --- | --- | --- | --- | --- | --- |
| `target` | `navigation.open` | string | Modelo: opcional; negócio: `tela` obrigatória | Sem normalizador dedicado; schema rejeita chaves extras | `estoque`, `caixa` / texto vazio | Needle; fusão |
| `materialName` | `inventory.get_stock` | string | Modelo: opcional; negócio: `materialId` obrigatório após resolução | Regex aceita PLA/PETG/ABS após `de` ou `tem`; binding material→`materialId` | `PLA preto` / material ausente | deterministic extractor; Needle; fusão; resolver de entidade |
| `query` | `inventory.search` | string | Modelo e negócio: query necessária | Sem normalização de valor dedicada no extractor; schema string | `PLA preto` / texto vazio | Needle; fusão |
| `orderNumber` | `orders.get` | string numérica | Modelo: opcional; negócio: `orderId` obrigatório após resolução | Determinístico: `pedido #?N`; fusão aceita somente `^#?\d+$`; binding order→`orderId` | `123`, `#44` / `da Maria`, `abc` | deterministic extractor; Needle; fusão; resolver de entidade |
| `customerName` | `orders.create`; determinístico também alcança `orders.get` | string | Modelo: opcional; negócio: `customerId` obrigatório em create | Reconhece `pra/para Nome` e `pedido da/do Nome`; binding customer→`customerId` em create | `Maria`, `João` / verbo após preposição | deterministic extractor; Needle; fusão; resolver de entidade |
| `description` | `orders.create` | string | Modelo: opcional; negócio: obrigatório | Regex de item após quantidade; remove `s` final | `chaveiro`, `suporte` / unidade de tempo ou contexto do pedido | deterministic extractor; Needle; fusão |
| `quantity` | `orders.create` | number | Modelo: opcional; negócio: obrigatório | Converte o primeiro número do padrão de item com `Number`; não há limite positivo no schema dinâmico | `3`, `12` / número de duração ou valor financeiro | deterministic extractor; Needle; fusão |
| `unitPrice` | `orders.create` | number | Modelo: opcional; negócio: obrigatório | Aceita número com `R$`, `reais` ou `cada`; campo financeiro inferido sem fonte confiável é removido | `12`, `12.50` / valor inventado pelo modelo | deterministic extractor; fusão com proveniência; Needle apenas se confirmado por fonte confiável |
| `weightGrams` | `calculator.calculate` | number | Modelo: opcional; negócio: obrigatório | Converte kg para g e vírgula decimal para ponto | `120g`, `1kg` / texto sem número/unidade | deterministic extractor; Needle; fusão |
| `timeMinutes` | `calculator.calculate` | number | Modelo: opcional; negócio: obrigatório | Converte horas/minutos para minutos totais | `2h30`→150, `45 minutos`→45 / duração ausente | deterministic extractor; Needle; fusão |

O extractor também produz `hours` e `minutes`. Esses dois campos são derivados internos de duração, aparecem na telemetria/fusão, mas não pertencem a `MODEL_ARGS` e não são parâmetros de nenhuma tool dinâmica. Por isso não entram nos dez campos-alvo do `field-validation-v1`.

## Construção do field-validation-v1

Foram criados 60 casos. O número deriva de seis famílias reais de tools, mantendo pelo menos oito casos avaliados por campo. Campos combináveis têm cobertura maior para exercitar posição, preposição, ausência, ambiguidade e colisões:

| Campo | Cobertura legado (`expectedFields`) | Cobertura field-validation-v1 (avaliado / esperado) |
| --- | ---: | ---: |
| `target` | 0 | 8 / 6 |
| `materialName` | 4 | 8 / 6 |
| `query` | 0 | 8 / 6 |
| `orderNumber` | 2 | 12 / 4 |
| `customerName` | 11 | 26 / 18 |
| `description` | 7 | 14 / 10 |
| `quantity` | 8 | 14 / 10 |
| `unitPrice` | 8 | 14 / 6 |
| `weightGrams` | 6 | 10 / 7 |
| `timeMinutes` | 8 | 10 / 7 |

Todos os 60 casos possuem `evaluatedFields`, inclusive negativos sem `expectedFields`. Isso permite medir ausência correta e falso positivo sem fingir que todo campo extraído em um caso legado não anotado é necessariamente errado.

## Métrica adicional compatível

As métricas antigas permanecem inalteradas. A seção adicional `fieldValidation` contém:

- casos anotados e cobertura;
- exact match por caso;
- totais esperados, extraídos e corretos;
- micro precision = corretos / extraídos;
- micro recall = corretos / esperados;
- micro F1;
- falsos positivos e falsos negativos;
- as mesmas contagens, razões e IDs de caso por campo.

## Auditoria dos 80 casos legados

A auditoria usa três classes para extrações sem anotação: A = verdadeiro positivo sem anotação; B = falso positivo; C = ambíguo/revisão humana.

- `orderNumber`: `other-007`, valor `12`, classe A. O texto contém explicitamente `pedido 12`.
- `materialName`: `inv-003`, `inv-008`, `inv-013` e `other-014`, classe A. Todos contêm material explícito.
- `customerName`: quatro extrações sem anotação, todas classe B (`começar`, `Adiciona`, `começar`, `produzir`).
- `description`: seis extrações sem anotação, todas classe B; duração, preço, caixa ou contexto foram confundidos com item.
- `quantity`: cinco extrações sem anotação, todas classe B; duração, preço ou saque foram confundidos com quantidade de item.
- `query`: cinco ocorrências classe C porque não existe oracle determinístico independente e algumas strings são parciais.
- `target`: três ocorrências classe C pelo mesmo motivo.

O relatório completo e cada ocorrência ficam em `reports/ai/field-validation/legacy-field-audit-f3b8e7f.json`. Nenhuma dessas classificações foi aplicada automaticamente ao corpus.

## Baseline físico sem tuning

Configuração comum: commit de runtime `f3b8e7f75b8d78b82f6344ba97d54cc483fb4de4`, app 1.0.39, build `0.1.0-057065dad07ccffe`, LFM `lfm2.5-1.2b-q4_0`, modo C, Top-K 3, `writeExposed=0`, ASUS_I005DA / Android API 33.

| Conjunto | Casos | Intent | Tool | Schema | Exact field | Micro precision | Micro recall | Micro F1 | Falhas técnicas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Legacy tuning | 65 | 98,46% | 87,69% | 100% | 19/29 — 65,52% | 42/47 — 89,36% | 42/54 — 77,78% | 83,17% | 0 |
| Legacy holdout | 15 | 93,33% | 93,33% | 93,33% | 1/1 — 100% | 1/1 — 100% | 1/1 — 100% | 100% | 0 |
| Field validation v1 | 60 | 75% | 70% | 96,67% | 39/60 — 65% | 59/72 — 81,94% | 59/80 — 73,75% | 77,63% | 0 |

### Resultado por campo no field-validation-v1

| Campo | Precision | Recall | FP | FN |
| --- | ---: | ---: | ---: | ---: |
| `target` | 0/0 — sem extrações | 0/6 — 0% | 0 | 6 |
| `materialName` | 5/6 — 83,33% | 5/6 — 83,33% | 1 | 1 |
| `query` | 2/4 — 50% | 2/6 — 33,33% | 2 | 4 |
| `orderNumber` | 4/4 — 100% | 4/4 — 100% | 0 | 0 |
| `customerName` | 17/19 — 89,47% | 17/18 — 94,44% | 2 | 1 |
| `description` | 5/9 — 55,56% | 5/10 — 50% | 4 | 5 |
| `quantity` | 6/9 — 66,67% | 6/10 — 60% | 3 | 4 |
| `unitPrice` | 6/6 — 100% | 6/6 — 100% | 0 | 0 |
| `weightGrams` | 7/7 — 100% | 7/7 — 100% | 0 | 0 |
| `timeMinutes` | 7/8 — 87,5% | 7/7 — 100% | 1 | 0 |

O caso combinado `pedido 123 da Maria` preservou `orderNumber=123`, mas não extraiu `customerName=Maria`; o schema de `orders.get` expõe somente `orderNumber`, enquanto a extração determinística de cliente não cobre nome após o número. Isso é uma deficiência real do contrato atual, não uma razão para alterar o caso de validação.

## Decisão

**NO-GO para iniciar o próximo tuning do LFM 2.5.**

O bloqueio não é o evaluator: ele agora mede todos os campos com denominadores explícitos. O bloqueio é a qualidade de extração/fusão do runtime atual: `target` tem recall 0/6, `query` 2/6, `description` 5/10 e `quantity` 6/10, com 13 falsos positivos e 21 falsos negativos no total. Tuning de intent antes de separar e corrigir esses contratos tornaria a atribuição de melhorias ambígua.

Antes do ciclo LFM, corrigir e validar os campos abaixo sem usar o legacy holdout como tuning:

1. extração de `target` em navegação determinística;
2. contrato e normalização de `query`;
3. limites do regex compartilhado de `description`/`quantity`;
4. combinação `orderNumber` + `customerName` em `orders.get`;
5. criar e congelar um futuro blind holdout depois dessas correções.
