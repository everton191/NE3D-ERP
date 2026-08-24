# Relatório da arquitetura operacional de IA

Data: 2026-08-20

1. Arquitetura anterior: monólito local-first em `app.js`, serviços de domínio úteis, dois registries anteriores, pipeline seguro maduro para criação de pedido e contrato legado PT-BR.
2. Problemas: fontes de verdade duplicadas, regras ainda embutidas na UI, contratos sem handler/teste, caixa local versus financeiro canônico e ausência de UseCases compartilhados para vários WRITEs.
3. Funções duplicadas: catálogo legado/CapabilityRegistry/ToolRegistry; cálculo/totais apresentados em mais de uma camada; caixa local como fallback da camada financeira.
4. Funções quebradas: nenhuma action canônica `BROKEN`; nove foram `DISABLED` por handler/teste ausente e não são expostas.
5. Refatorações: criado catálogo canônico de migração, envelope, busca Top-K, interface de modelo e geração de artefatos. Não houve mudança no comportamento operacional da UI.
6. Actions registradas: 28.
7. Tipos: 12 READ, 6 PREPARE, 10 WRITE. Todo WRITE permanece não exposto.
8. Capability bundles: 8 telas/bundles.
9. Testes adicionados: contrato do registry, busca, bloqueio de WRITE, envelope e manifesto.
10. Testes executados: lint, TypeScript, build web, registry/health, 14 suítes funcionais/IA e Gradle `assembleDebug`; todos passaram.
11. Bugs funcionais corrigidos: nenhum comportamento foi alterado nesta fase audit-first; inconsistências foram documentadas para correção na fonte.
12. Pendências: extrair UseCases de edição/cancelamento/caixa/produção, integrar catálogo ao runtime e UI, validators completos por schema, repositories explícitos, renderers/observabilidade e contract/E2E tests dos bloqueados.
13. Actions READY: 12; o manifesto do modelo contém somente READ/PREPARE autorizadas.
14. Actions não prontas: 16 (8 DEGRADED, 8 DISABLED). As 10 WRITE continuam fora do modelo.
15. FunctionGemma: não pronto. Nenhum modelo foi baixado, integrado ou treinado.
16. Próxima etapa: Fase B por verticais, começando em Pedidos (editar/cancelar) e preservando `OrderCreatePreparationUseCase`/executor; depois Estoque, Caixa e Produção. Só então conectar o catálogo ao runtime.

## Atualização Fase B — Pedidos

`EditOrderUseCase` e `CancelOrderUseCase` foram implementados e os fluxos manuais de edição, mudança de status e cancelamento foram migrados. O APK sincronizado foi compilado, instalado e aberto em aparelho; a mutação manual ficou pendente por segurança dos dados. Consulte `PHASE_B_SHARED_USECASES.md`.

## Blockers exatos

- UI e IA ainda não consomem o catálogo canônico em runtime.
- `orders.update`, `customers.get`, `inventory.get_roll`, `inventory.reserve`, `cash.prepare_withdrawal`, `cash.commit_withdrawal`, `cash.close_session`, `production.prepare_job` e `production.change_status` não possuem handler compartilhado completo.
- Nove actions com handler-alvo não possuem contract test registrado no catálogo novo.
- WRITEs prioritários ainda não atingem simultaneamente schema forte, validator, permissão, confirmação, idempotência e paridade manual/IA.
- O dataset gerado precisa revisão humana e congelamento por hash antes de virar avaliação final.

`AI_ACTION_ARCHITECTURE = NOT_READY`
