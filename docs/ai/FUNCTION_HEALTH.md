# Saúde das actions

Estados: READY (exposta), DEGRADED (implementação parcial, não exposta), DISABLED (handler ausente/política deliberada) e BROKEN (contrato inseguro/inválido). `npm run ai:validate-actions` falha para BROKEN. `generated/ai-actions.health.json` registra o relatório completo.

Após a Fase B de Pedidos: 12 READY, 8 DEGRADED e 8 DISABLED; 0 BROKEN. `orders.update` e `orders.cancel` estão funcionalmente READY, porém `exposedToModel=false`; nenhuma WRITE está exposta.
