# Simplifica AI — Auditoria funcional

Data da auditoria: 2026-08-14

Escopo: Simplifica 3D (`erpNE3d`), exclusivamente os fluxos Home, Pedidos, Estoque, Calculadora, Caixa/Financeiro e Simplifica IA.

## 1. Arquivos e módulos encontrados

- `app.js`: estado local, persistência, sincronização, telas, pedidos, estoque, caixa, Home, gráficos e ligação da IA.
- `src/ai-3d/core.js`: sessão, tarefa, rascunho, classificação, contexto, capabilities e tools.
- `src/ai-3d/orchestrator.js`: roteamento conversacional, subtarefas, prévia e confirmação.
- `src/ai-3d/operation-safety.js`: gate de escrita, operação preparada, confirmação, idempotência e trava de execução.
- `src/ai-3d/canonical-order.js`, `order-create-preparation.js` e `order-create-executor.js`: contrato, preparação e execução transacional do pedido.
- `src/ai-3d/rlm/rlm-core.js`: consultas compostas com orçamento de contexto.
- `src/services/simplifica3dAiActions.js` e `simplifica3dAiRuntime.js`: contrato legado e provider local.
- `apps/simplifica/assistant-pack/index.js`: manifesto isolado do Simplifica 3D.
- `supabase/migrations/20260525120000_erp_cash_fiscal_foundation.sql` até `20260525170000_erp_financial_worker_orchestration.sql`: fundação financeira, atomicidade, reconciliação e worker.
- `supabase/migrations/20260512120542_dashboard_analytics_profile_customization.sql`: snapshots da Home/gráficos.

As migrations `20260525120000`, `20260525133000`, `20260525143000`, `20260525153000`, `20260525163000` e `20260525170000` constam como aplicadas no projeto remoto. Consulta de catálogo remoto confirmou as tabelas `erp_financial_operations`, `sale_payments`, `cash_movements`, `cash_sessions`, `analytics_snapshots` e as funções `register_sale_financial_operation`, `register_cash_movement`, `get_or_create_cash_session`, `upsert_dashboard_analytics_snapshot` e `get_dashboard_analytics`.

## 2. Arquitetura funcional atual

O aplicativo é local-first. As coleções `pedidos`, `caixa` e `estoque` são carregadas e persistidas no armazenamento local. A sincronização envia cada registro para `erp_records` por `upsert_erp_record_if_newer`, usando a coleção como discriminador.

Existe em paralelo uma arquitetura financeira mais forte no Supabase, com sessão, pagamento, movimento, operação idempotente e reconciliação. Essa arquitetura está publicada, mas não é a autoridade usada pelo frontend operacional.

Consequência: há duas arquiteturas que não fecham o mesmo ciclo. O pedido e o caixa visíveis trabalham com arrays locais; as tabelas financeiras canônicas ficam sem os eventos produzidos pelo aplicativo.

## 3. Fluxo de Pedidos

1. A UI prepara o pedido com `OrderCreatePreparationUseCase`.
2. `OrderCreateTransactionExecutor` valida/aplica estoque, grava o pedido local, cria opcionalmente um recebimento local e persiste as coleções.
3. O recebimento criado por `criarLancamentoRecebimentoPedido` corresponde ao valor efetivamente recebido (`down_payment`), não necessariamente ao total da venda.
4. `agendarSyncSilenciosoDados` sincroniza pedido e caixa como registros JSON de `erp_records`.
5. Alteração de status aplica a diferença de estoque, mas não cria uma operação financeira especializada.
6. Cancelamento marca o pedido como cancelado, pode devolver estoque e cria estorno somente no array local `caixa`.

Pontos positivos reutilizáveis: preparação única, rollback do executor, chave de requisição do cliente, bloqueio de concorrência local, baixa por diferença e estorno explícito.

Problemas:

- não há chamada a `register_sale_financial_operation` após o commit;
- o modelo financeiro usa `number` decimal no JavaScript, sem contrato em centavos de ponta a ponta;
- a associação de movimento legado ao pedido aceita heurística por descrição e valor, podendo confundir registros;
- edição/status/cancelamento não possuem uma máquina financeira canônica completa.

## 4. Fluxo do Caixa e Financeiro

`caixaModoSimplesAtivo()` retorna sempre `true`. `abrirSessaoCaixaAutomatica` cria uma sessão local com identificador textual e `calcularTotaisCaixa` soma o array local. Essa sessão não é `cash_sessions` e os movimentos não são `cash_movements`.

A RPC `register_sale_financial_operation` já implementa no banco:

- autorização por empresa;
- trava transacional;
- idempotência por `operation_uuid`, `client_request_id` e `request_hash`;
- criação de `erp_financial_operations`;
- criação de `sale_payments`;
- criação de `cash_movements` apenas para pagamentos aprovados;
- atualização dos totais da sessão.

O frontend não chama essa RPC. Portanto, o problema não é falta de schema: é falta do adaptador entre o commit do pedido e o contrato financeiro publicado.

Regra de negócio que deve permanecer explícita:

- receita de vendas representa a venda elegível;
- saldo do caixa representa dinheiro/pagamentos efetivamente movimentados;
- pedido sem recebimento pode aumentar vendas/a receber, mas não o saldo do caixa;
- não se deve corrigir o saldo somando pedidos artificialmente.

## 5. Fluxo do Estoque

`InventoryService` é a autoridade funcional local. Ele normaliza materiais, valida saldos, aplica diferenças, registra histórico e usa chaves idempotentes para baixas/devoluções por pedido.

`diffConsumoPedido` só considera consumo quando o status do pedido é elegível. `aplicarEstoquePedido` evita desconto duplicado em edição e `devolverEstoquePedido` produz a diferença inversa.

Lacunas:

- a IA só consulta estoque; capabilities de escrita estão registradas como indisponíveis;
- o rascunho da IA não representa vários itens/materiais de forma operacional;
- pedidos sem peso/material devem poder declarar esses campos como não aplicáveis, sem inventar consumo.

## 6. Fluxo da Calculadora

`Simplifica3dAiReadFacade.calculatePrice` reaproveita `CalculatorDomain.calculate` e as configurações reais do aplicativo. Isso deve permanecer como única regra de cálculo usada pela IA.

Falha confirmada no direcionamento:

- `PRICE.CALCULATE` exige `weightGrams > 0`;
- `abrirCalculadoraPelaAssistenteIa` retorna sem navegar quando não há peso;
- dentro de uma tarefa ativa, uma solicitação genérica de orçamento pode cair no provider ou pedir peso/preço em vez de abrir a Calculadora;
- o rascunho de pedido força `weightGrams` como requisito universal, mesmo para itens cujo peso não se aplica.

A correção deve separar “abrir/preencher calculadora” de “executar cálculo completo”. Navegação pode ocorrer sem peso; cálculo somente executa quando seus requisitos reais estiverem disponíveis.

## 7. Fluxo da Home e dos gráficos

`getDashboardStats`, `pedidoContaParaAnalytics`, `calcularAgregadoAnalytics` e `gerarSeriesDashboardAnalytics` calculam vendas diretamente de `pedidos`. O saldo vem de `caixa`.

Inconsistências encontradas:

- `getDashboardStats` inclui pedidos do dia sem excluir de forma consistente cancelados/rascunhos/estados não elegíveis;
- outras rotinas excluem apenas cancelados, mas ainda contam pedidos abertos como venda;
- as regras de elegibilidade não são compartilhadas entre cards, relatórios e séries;
- `enviarAnalyticsDashboardSilencioso` publica no Supabase um snapshot já calculado pelo cliente;
- `get_dashboard_analytics` lê esse snapshot e, portanto, não corrige a origem divergente.

Causa confirmada dos gráficos divergentes: múltiplas fontes e regras de elegibilidade, somadas à ausência da operação financeira canônica. Não é apenas cache de UI.

## 8. Fluxo atual da IA

Estruturas existentes e reutilizáveis:

- `ConversationTaskManager` e `TaskStack`;
- `ConversationSession` com persistência por conta;
- rascunho com estado por campo;
- `ContinuationResolver`;
- `ContextBuilder`;
- `CapabilityRegistry` e `ToolRegistry`;
- `PrepareOperation`, confirmação, idempotência e `ExecutionGuard`;
- `OrderCreateTransactionExecutor`;
- navegação por rotas e telemetria de latência;
- isolamento do manifesto, memória e modelo do Simplifica 3D.

Estruturas ausentes ou incompletas:

- rascunho de pedido com múltiplos itens;
- estado de campo `NOT_APPLICABLE`;
- `RequirementEngine` separado das regras de conversa;
- `EntityResolver` genérico com desambiguação persistente;
- `TaskResolver` que priorize continuação antes de nova intenção;
- `LoopGuard` com assinatura de estado/pergunta;
- operação preparada genérica para os cinco domínios;
- memória operacional de curto prazo explícita;
- reconciliação pedido/operação/pagamento/movimento/sessão;
- capabilities WRITE reais além de `ORDER.CREATE`.

## 9. Bugs e severidade

### BLOCKER

- A UI não registra vendas/pagamentos pela RPC financeira já publicada. Consequência: banco financeiro, Caixa e análises não compartilham uma autoridade.

### HIGH

- Home e gráficos usam estados de pedido inconsistentes para faturamento.
- Cancelamentos/edições podem ficar corretos localmente e ausentes na camada financeira remota.
- O fluxo E2E de vários itens e campo sem peso não é representável pelo rascunho atual.

### MEDIUM

- Heurística legada de vínculo caixa↔pedido por descrição/valor pode associar movimento errado.
- Teste `test-erp-cash-fiscal-foundation.js` valida marcadores estáticos e já não acompanha a preparação compartilhada atual; ele falha sem executar integração real.
- Datas locais/ISO são normalizadas por funções úteis, mas a autoridade remota precisa definir timezone e corte de período de forma única.

### LOW

- Alguns nomes de capability existem em mais de uma camada (Assistant Core universal e AI Context V2), aumentando risco de deriva.

## 10. Fontes de verdade propostas

| Dado | Autoridade proposta | Cache/projeção |
|---|---|---|
| Pedido e itens | registro de pedido local sincronizado, com identificador estável | UI e `erp_records` |
| Venda elegível | `erp_financial_operations` concluída | resumo de vendas/Home |
| Pagamento | `sale_payments` | situação financeira do pedido |
| Saldo/movimento | `cash_movements` + `cash_sessions` | array local de caixa para offline |
| Estoque | `InventoryService` e registros sincronizados | cards/resumo da IA |
| Cálculo | `CalculatorDomain` | rascunho/calculadora |
| Home/gráficos | projeção de dados canônicos com uma regra de período | `analytics_snapshots` somente como cache |

No modo offline, a operação local deve ficar `pending_sync` e usar as mesmas chaves idempotentes; ao reconectar, a RPC confirma a autoridade remota sem duplicar.

## 11. Plano incremental

1. Criar contrato/adaptador financeiro de frontend e serviço de reconciliação somente leitura.
2. Integrar o commit de pedido à fila financeira idempotente, preservando rollback local e modo offline.
3. Definir estados de venda/pagamento/cancelamento e conversão monetária determinística.
4. Fazer Caixa consultar projeção canônica com fallback local explícito.
5. Unificar elegibilidade e períodos de Home, gráficos e relatórios.
6. Evoluir o rascunho da IA para múltiplos itens e `NOT_APPLICABLE`.
7. Separar `RequirementEngine`, `TaskResolver`, `EntityResolver` e `LoopGuard` aproveitando as classes atuais.
8. Validar o caso Gecinaldo Júnior e os valores R$ 10, R$ 80 e R$ 150.
9. Executar testes web, PWA, Android/ADB e somente depois versionar/publicar.

## 12. Linha de base de testes

Passaram antes das mudanças estruturais:

- `npm run lint`
- `npm run typecheck`
- `npm run test:simplifica3d-ai-context-v2`
- `npm run test:simplifica3d-ai-operation-safety`
- `npm run test:simplifica3d-ai-order-transaction`
- `npm run test:order-stock-calculator-flow`
- `npm run test:assistant-app-isolation`

Falhou na linha de base:

- `npm run test:erp-cash-fiscal-foundation`: teste estático espera uma chamada textual antiga de metadados financeiros. A falha confirma que ele não é um teste E2E do fluxo financeiro e precisa ser substituído/complementado por cenários comportamentais.
