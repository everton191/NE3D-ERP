# Arquitetura alvo do núcleo 3D

Documento de decisão; não implementado nesta auditoria.

`UI ou IA -> UseCase/serviço operacional comum -> regras -> persistência`.

Pipeline alvo: `ConversationTaskManager -> ConversationSession -> ContinuationResolver -> DomainRouter -> CapabilityRegistry -> ActionPlanner -> ActionCompiler -> EntityResolver -> ActionValidator -> PermissionGuard -> ConfirmationManager -> ToolExecutor -> UseCaseAdapter -> operação real`.

Regras: núcleo exclusivo do 3D; nenhuma dependência Rural/TEC; LLM interpreta, código decide; capability só é anunciada quando Tool, Adapter, operação e dependências passam readiness; `AI_CORE_READY` é separado de `LLM_READY`; falha do modelo nunca bloqueia o ERP.

Migração incremental: (1) provider/storage próprios, (2) sessão/continuação, (3) leituras, (4) draft de pedido, (5) subtarefas, (6) write com confirmação/idempotência, (7) paridade.
