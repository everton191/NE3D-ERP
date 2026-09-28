# Needle 3 — avaliação real PT-BR (ASUS_I005DA)

Data da execução: 2026-09-26. Dispositivo ASUS_I005DA, Android 13/API 33, ABI `arm64-v8a`. Modelo instalado a partir de `Cactus-Compute/needle3@b274efcb211a9eef48c9a88da4b43bd569696a39`.

## Runtime

| Verificação | Resultado |
|---|---|
| Download oficial | PASS |
| Bytes | 35.335.380 / 35.335.380 |
| SHA-256 no aparelho | PASS (`c9d915eca282ed42d1a09b143b592adb4cc6744ffe2d294adf5cfc5548170c38`) |
| Instalação atômica | PASS (`.part` validado antes de `needle3.cact`) |
| Load | PASS, 144 ms |
| Init | PASS, 56 ms, prefixo 60 tokens |
| Health tool-call | PASS |
| Embedding | PASS, 3.072 dimensões, 42 ms |
| Fila única | PASS: tool → embedding → tool, 1.082 ms total, sem crash/deadlock |
| Background/foreground | PASS: health e tool-call voltaram READY |
| Restart | PASS: arquivo persistiu como INSTALLED e não houve novo download |
| Fallback sem Needle | PASS: shadow retornou `NATIVE_UNAVAILABLE`; o router atual retornou `navigation.open` normalmente |

O runtime oficial informou `peak_ram_mb: 404.9` durante inferências. É uma métrica do próprio Needle, não uma medição independente de RSS Android.

## Corpus controlado

Foram executados 14 casos com CandidateRetriever antes do Needle e no máximo uma tool por caso. Houve 10 chamadas Needle possíveis: 9 escolheram a tool candidata, 1 foi suprimida pelo modelo. Dos argumentos avaliados estritamente contra o caso esperado, somente `procura PETG branco` foi correto por completo.

| Caso | Candidata / resultado | Achado |
|---|---|---|
| abre estoque | `navigation.open` | Tool correta; `tela=esto` truncado. |
| quanto tenho de PLA preto | `inventory.get_stock` | Tool correta; retornou `materialId=PLA`, ID não resolvido e perdeu `preto`. |
| qnt tem de pla preto | NO_MATCH | Falha do CandidateRetriever: abreviação não roteada. |
| procura PETG branco | `inventory.search` | Tool e `query=PETG branco` corretos. |
| mostra meus pedidos | `orders.list` | Tool correta; adicionou `query` não solicitado. |
| pedido 123 | `orders.get` | Tool correta; retornou `orderId` em vez de `orderNumber`, tratado como ID não validado. |
| faz pedido pra Maria | `orders.create` | Modelo suprimiu a call; não inventou valor final. |
| faz 3 chaveiros pra Maria 12 cada | NO_MATCH | Falha do CandidateRetriever: forma elíptica sem `pedido`. |
| calcula 120g 2h | `calculator.calculate` | Tool correta; `timeMinutes=2` é semanticamente incorreto para 2h. |
| saldo do caixa | `cash.get_status` | Tool correta; adicionou `period=caixa`. |
| abre o caixa | `navigation.open` | Tool correta; chave `tela` diverge do contrato esperado `target`. |
| abre o caixa para começar o dia | UNAVAILABLE | Intent `cash.open` correto; tool permanece indisponível e não foi chamada. |
| mostra fila de produção | `production.list` | Tool correta; adicionou `status=produção`. |
| manda esse pedido no zap | BLOCKED | Intent correto; indisponibilidade foi preservada, sem substituição. |

## Métricas

- Total: 14 casos; chamadas Needle: 10.
- Tool match: 9/10 entre chamadas elegíveis (90%).
- Argument match estrito: 1/9 ferramentas retornadas (11%).
- No-tool / não invocado corretamente por indisponibilidade: 2/2 (`cash.open`, compartilhamento bloqueado).
- Falhas de CandidateRetriever: 2 (`qnt`, pedido elíptico); 1 call suprimida pelo Needle.
- IDs alucinados/não resolvidos: 2 (`materialId`, `orderId`), ambos bloqueados no comparador shadow.
- Valores financeiros alucinados: 0; `unitPrice` não foi fabricado.
- Latência média: 547 ms; P50: 465 ms; P95: 899 ms.
- Confidence média das 10 chamadas: 0,858; valores altos também ocorreram com argumentos errados, logo não é calibrável ainda para promoção.

## Falhas que bloqueiam promoção

1. **SCHEMA / tool description:** nomes de argumentos expostos ao Needle induzem `materialId`, `orderId`, `timeMinutes` e chaves divergentes sem EntityResolver.
2. **ROUTER / CandidateRetriever:** falta a cobertura de `qnt` e de criação de pedido em forma elíptica.
3. **NEEDLE / schema:** campos opcionais são preenchidos sem necessidade (`query`, `period`, `status`) e `2h` foi lido como 2 minutos.
4. **Parser corrigido nesta validação:** o envelope real usa `function_calls`; o normalizador agora o lê e marca `*Id` como não validado.

Classificação: **C — RUNTIME_READY_NEEDS_ROUTING_TUNING**. Needle continua exclusivamente em SHADOW e não possui autoridade de execução.

## Lote 4.2

O hardening adicionou normalização de abreviações, extração determinística e schemas mínimos. A validação no dispositivo confirmou correção de cobertura para `qnt` e pedido natural, com preço/quantidade/duração preservados como `USER`. A classificação permanece conservadora até reexecutar o corpus expandido de 60 casos.
