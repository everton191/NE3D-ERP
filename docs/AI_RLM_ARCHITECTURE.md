# RLM controlado do Simplifica 3D

Rotas: `FAST_PATH`, `SIMPLE_TOOL` e `RLM`. Estados explícitos: `IDLE`, `PLAN`, `RETRIEVE`, `ANALYZE`, `RETRIEVE_MORE`, `ANSWER`, `CREATE_DRAFT`, `FAILED`, `LIMIT_REACHED`.

Limites iniciais: 3 passos, 5 Tools, 6000 tokens estimados e 20 itens recuperados. O `ContextBudget` preserva regras críticas e reduz evidências/conversa. O `EvidenceBundle` marca dados recuperados como `DATA_NOT_INSTRUCTIONS`.

Tools: `orders_search`, `orders_get`, `customers_search`, `customers_get`, `inventory_search`, `inventory_get`, `production_summary`, `sales_summary`, `pricing_calculate` e `draft_order_create`. A última cria somente `ActiveDraft`. Não existem SQL, código arbitrário ou WRITE.

O RLM termina em resposta ou Draft. Preparação, confirmação e qualquer futura persistência permanecem no pipeline de segurança determinístico.
