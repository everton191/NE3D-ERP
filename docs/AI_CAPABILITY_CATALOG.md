# Catálogo de capabilities

| Capability | Estado atual | Motivo |
|---|---|---|
| CUSTOMER.SEARCH | READY na Fase 1 | Tool e adapter para `CustomerSuggestionManager` |
| ORDER.HISTORY | READY na Fase 1 | consulta focada, limitada e somente leitura |
| PRICE.CALCULATE | READY na Fase 1 | simulação pelo `CalculatorDomain` real |
| STOCK.SEARCH | READY na Fase 1 | consulta read-only pelo `InventoryService` |
| CASH.SUMMARY | PARCIAL | leitura direta do estado global |
| PRODUCTION.SEARCH | UNAVAILABLE | action retorna pedidos recentes, não produção |
| ORDER.CREATE | UNAVAILABLE para IA; executor manual isolado | preparação e núcleo transacional são compartilháveis, mas LIVE permanece sem Tool e sem flag de ativação |
| ORDER.CREATE.SHADOW | READY sem persistência | payload canônico passa pelo adapter, preparação manual compartilhada e `ShadowPersistence`, `sideEffects = 0` |
| RLM.READ | READY controlado | Tools READ específicas, EvidenceBundle e limites rígidos |
| ORDER.DRAFT | READY controlado | RLM pode criar somente `ActiveDraft`; não prepara/confirma/executa |
| ORDER.UPDATE | BROKEN/UNAVAILABLE | `pedido.status` anunciado, sem executor |
| STOCK.ADD | BROKEN/UNAVAILABLE | anunciado, sem executor |
| CASH.ADD | BROKEN/UNAVAILABLE | anunciado, sem executor |
| NAVIGATE | FUNCIONAL | chama `trocarTela`; validar rotas permitidas |

Regra aplicada: somente `READY` pode executar em `ToolRegistry`. Na Fase 2A, `ORDER.CREATE` continua `UNAVAILABLE` como WRITE; apenas o pipeline isolado `DRY_RUN` prepara e valida uma representação determinística com `sideEffects = 0`.
