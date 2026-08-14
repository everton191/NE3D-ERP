# Matriz de testes da IA

| Área | Cobertura atual | Teste necessário |
|---|---|---|
| Action normalize/preview | contrato estático | schemas e resultados estruturados |
| Chat/contexto recente | regex | conversa real e persistência por sessão |
| Provider/modelo | nenhuma nesta auditoria | startup, download/hash, inferência, falha/degraded |
| Continuação/slots/draft | ausente | unitários e cenário principal |
| TaskStack/subtarefas | ausente | push/pop/retorno/cancelamento |
| Confirmação | `PendingConfirmation` em dry-run | Fase 2B deve validar confirmação antes do adapter real |
| Permissão/planos | testes manuais gerais | IA com mesmos guards |
| Idempotência | persistente na Fase 2A | repetir com callback/Activity reais antes de LIVE |
| Paridade | 4/4 canônica e 30/30 na preparação compartilhada | ainda falta diferencial transacional completo UI x IA |
| Falhas | erro livre | provider/tool/UseCase/error mapper |

Fase 2A cobre: confirmação duplicada/concorrente, stale após alteração, migração de Draft legado, restauração sem autoexecução, troca de conta, mudança de permissão/plano, expiração, cancelamento, nova tarefa, provider fora do fast path, gate OFF/DRY_RUN/LIVE e ausência estática de caminhos para persistência.

Executor transacional cobre: commit com/sem caixa, replay idempotente, execução concorrente, rejeição de estoque, falha ao incluir pedido, falha de persistência detectável e restauração integral do snapshot.

Fase 2D cobre: compensação condicional de crédito Free, recusa de recibo stale, releitura verificável do cache persistido, flag LIVE falsa e sandbox diferencial 4/4 sem storage real.

Validação física no Zenfone: preparação 120 × R$ 7, confirmação dry-run e repetição idempotente; pedidos, caixa e estoque permaneceram inalterados.

ORDER.CREATE canônico: paridade estrutural 4/4, SHA-256 determinístico, 30/30 cenários de preparação e shadow passando pelo mesmo preparo do modo manual sem efeitos. RLM: rotas Fast/Simple/RLM, orçamento, injection como DATA, ausência de SQL/WRITE e geração exclusiva de Draft.

Fase 2E no Zenfone: pedido manual real descartável produziu exatamente +1 pedido e +1 caixa; restauração integral retornou a 2/4/5; fault injection antes e depois da persistência fez rollback; reinício preservou assinatura; após 12 s não houve reintrodução remota. Evidência visual em `output/ai-order-manual-disposable.png`. A IA permaneceu `DRY_RUN`, `order_create=UNAVAILABLE` e sem executor LIVE.
