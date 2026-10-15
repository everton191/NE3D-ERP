# Webhook Mercado Pago — homologação local de 15/10/2026

## Escopo e ambiente

Branch `codex/melhorias-setembro-2026`, base `7b7e060`. Nenhum acesso a
produção, chamada ao Mercado Pago, deploy, push, APK ou AAB nesta rodada.
OptiCore e sua alteração preexistente foram preservados.

Supabase nativo isolado em WSL, API `http://127.0.0.1:28065`, PostgreSQL
17.11, PostgREST 16.4 e Auth 2.197. Banco com o esquema completo das rodadas
anteriores, não um esquema simplificado. A migration nova foi executada
diretamente por psql em transação para validação local; isso NÃO atualiza
o ledger de migrations nem comprova implantação remota.

O teste executa o TypeScript real do handler e a verificação HMAC real em
Node 24, com `stripTypeScriptTypes`. Somente o transporte do gateway é
simulado. O teste de integração usa supabase-js, Auth e Data API reais locais,
com usuários sintéticos e credenciais exclusivamente de homologação.
Não equivale a executar a Edge Function no runtime Deno hospedado.

## Defeitos reproduzidos e correções

1. A expressão de UUID omitia o grupo final separado por hífen. UUIDs Auth
   válidos eram rejeitados. Corrigida, mantendo rejeição de IDs malformados.
2. Após desbloquear o UUID, falhas de consulta/gravação retornavam HTTP 200.
   Consultas e escritas críticas agora propagam erros; atualizações críticas
   precisam devolver exatamente uma linha. Cliente/plano ausente falha fechado.
3. `erp_payments` tinha apenas índice único parcial. O `ON CONFLICT(payment_id)`
   enviado pelo PostgREST não conseguia inferi-lo. Nova migration adiciona
   índice único integral, sem reescrever registros nem remover o índice antigo.
4. O webhook ainda buscava o plano `premium` e gravava variante legada na
   assinatura. Agora referencia o plano `pro` e grava `pro_monthly` no estado
   canônico; aliases e metadados históricos do pagamento são preservados.
5. `canceling` não é aceito pela constraint de `clients.subscription_status`.
   O cancelamento mantém o estado canônico `active`, a flag de fim do período
   e `status_assinatura=canceling`, sem remover a validade já paga.
6. Uma duplicata em andamento era confirmada como concluída e tentativas
   concorrentes podiam reassumir o mesmo evento com erro. Apenas eventos
   `processed`/`ignored` recebem confirmação de duplicata. Retomada de `error`
   usa compare-and-swap; somente o dono da reserva pode registrar sua falha.

Diagnósticos auxiliares continuam best-effort; falha no log não transforma
assinatura inválida em sucesso nem impede a resposta 401. Registros de
processamento e confirmação do evento são obrigatórios para HTTP 200.

## Arquivos

- `supabase/functions/mercadopago-webhook/index.ts`
- `supabase/migrations/20261015152405_support_erp_payment_upsert.sql`
- `scripts/test-billing-webhook-runtime.js`
- `scripts/test-billing-webhook-supabase-api.js`
- `package.json`
- Este relatório.

## Evidências e resultados

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Falhas de banco não são confirmadas | PASS | `test:billing-webhook-runtime`: consultas, payments, erp_payments, cliente, auditoria, log e finalização; HTTP 500 e retomada |
| UUID, registro ausente e atualização sem linha | PASS | Teste runtime com IDs válidos/malformados, cliente/plano ausente e zero linhas |
| Assinatura HMAC inválida | PASS | HTTP 401 mesmo com falha no log; nenhuma chamada ao provedor |
| Concorrência | PASS | Runtime e API local: um único dono na retomada; execução paralela não libera a reserva de outra execução |
| Persistência Start e Pro | PASS | `test:billing-webhook-local`: pagamento/ERP persistidos, licença efetiva via RPC autenticada |
| Retomada após falha parcial | PASS | Falha HTTP 503 simulada somente na finalização, após pagamento real local; handler retorna 500; retries concorrentes concluem sem acrescentar dias |
| Pagamento único | PASS | Consultas API confirmam uma linha por ID em payments e erp_payments; duplicatas não chamam o gateway simulado |
| Pré-aprovação e cancelamento | PASS | Start/Pro, variante canônica, flag de cancelamento e validade preservada; erros de escrita cobertos no runtime |
| Trigger financeiro e permissões | PASS | `test:payment-plans-local`: bloqueio de escrita comum, aliases, renovação, concorrência e isolamento |
| Reconciliação e identidade | PASS | `test:subscription-reconciliation-local` |
| Licenças e cards remotos entre sessões locais | PASS | `test:licensing-supabase-local`: Auth/API reais, planos, validade, RLS, auditoria e cards; preço comercial restaurado |
| Contratos existentes | PASS | `test:billing-webhook`, `test:plans`, `test:checkout-payment-states`, `test:prepublication-p0` |
| Preparação do histórico | PASS | `test:licensing-homolog-replay`: 85 arquivos e duas adaptações; este teste não executa todas as migrations em PostgreSQL |
| Índice e segurança local | PASS | Catálogo confirma índice integral; `db advisors --local --type security --level warn`: results=[] |
| Sintaxe e diferenças | PASS | `node --check` dos dois scripts, parse do handler TypeScript no teste e `git diff --check` |
| Staging remoto e Edge Deno | NÃO VERIFICADO | Nenhum deploy remoto nesta rodada |
| Gateway real/sandbox do Mercado Pago e dispositivos | NÃO VERIFICADO | Provedor simulado; nenhum contrato real utilizado |

Usuários/empresas sintéticos foram removidos pelo ledger das fixtures. Cards
foram restaurados pelo teste existente; auditoria local é preservada. Três
linhas auxiliares de execuções iniciais foram removidas por IDs exatos após
verificar que estavam desvinculadas; o teste agora também limpa essas linhas.

## Riscos e próximos passos

- **PENDENTE:** reserva que permaneça `received` após encerramento abrupto ou
  falha também na marcação de erro exige reconciliação controlada. Não há
  expiração automática/lease nesta correção. Novas entregas retornam 500, não
  falso sucesso. Teste runtime cobre esse limite explicitamente.
- **PENDENTE:** as etapas são múltiplas transações, não uma transação global.
  Pagamento/renovação são idempotentes nos cenários testados, mas uma retomada
  pode gerar mais de um log de auditoria. Não há garantia de exactly-once dos logs.
- **PENDENTE:** validar respostas JSON de cadastro/login que ainda podem
  divergir da licença paga persistida; assunto separado do processamento do webhook.
- **PENDENTE:** testar eventos fora de ordem, estorno/chargeback e cancelamento
  com datas divergentes do provedor em rodada específica, sem contratos reais.
- **PENDENTE:** repetir no staging e no runtime Edge real, com falhas controladas
  e duas sessões. Nenhuma autorização de produção é presumida.
- **PENDENTE:** implantação controlada, após aprovação: confirmar migrations
  canônicas anteriores, aplicar a migration nova antes do handler e verificar
  o índice/limites de lock. A criação pode bloquear escritas brevemente; os
  timeouts de 5s/60s falham sem alterar dados. Avaliar tamanho da tabela antes.
  O índice histórico é mantido, com pequeno custo adicional de escrita/espaço.
- Reversão: reverter o handler dependente antes de remover exclusivamente o
  índice novo, conforme comentário da migration. Não reverter dados de clientes.

**Status:** correção validada localmente; não READY TO PUBLISH e não implantada
em produção. A skill Supabase orientou a confirmação de erros/linhas afetadas;
a referência de índices PostgreSQL orientou a correção aditiva do índice.
