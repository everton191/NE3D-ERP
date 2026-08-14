# Máquina de estados da IA 3D

Estado atual: `idle -> infer -> preview -> confirm opcional -> execute -> resposta/erro`; não persiste operação.

Estados alvo: `IDLE`, `CONVERSING`, `COLLECTING_INFORMATION`, `RESOLVING_ENTITY`, `RUNNING_SUBTASK`, `WAITING_CONFIRMATION`, `EXECUTING`, `COMPLETED`, `CANCELLED`, `FAILED_RECOVERABLE`.

Slots: `MISSING`, `PROVIDED`, `RESOLVED`, `AMBIGUOUS`, `INVALID`. Toda mensagem passa primeiro pelo `ContinuationResolver`. `sim/não/confirmo/cancela` usa fast path apenas com estado inequívoco. Conversa consultiva não muta draft; task update explícito muta.

Fundação implementada na Fase 1 para `IDLE`, `COLLECTING_INFORMATION`, `CANCELLED`, classificação de mensagem, slots e fast path seguro. Estados de confirmação/escrita continuam deliberadamente fora do escopo.

Fase 2A implementa `WAITING_CONFIRMATION`, `EXECUTING` e `DRY_RUN_EXECUTED` somente para validação sem efeitos. Estados persistentes da operação: `PREPARED`, `CONFIRMATION_PENDING`, `EXECUTING`, `DRY_RUN_EXECUTED`, `FAILED`, `CANCELLED`, `STALE` e `EXPIRED`. `LIVE` permanece fail-closed.

O RLM possui máquina separada `IDLE → PLAN → RETRIEVE → ANALYZE → ANSWER | CREATE_DRAFT`, com `RETRIEVE_MORE`, `FAILED` e `LIMIT_REACHED` reservados. `CREATE_DRAFT` devolve controle imediatamente à máquina operacional; nunca alcança executor.
