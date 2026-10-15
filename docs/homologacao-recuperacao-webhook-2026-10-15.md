# Recuperação controlada de webhook — 15/10/2026

Branch `codex/melhorias-setembro-2026`; base `12c3d90`.

## Resultado e limite

Eventos `billing_webhook_events.status=received` podem ficar presos se a
execução terminar e também falhar a gravação do erro. O handler já recusa
confirmar essas entregas como concluídas, mas faltava um caminho auditado
para liberá-las depois de comprovar que a execução anterior terminou.

A RPC `recover_billing_webhook_event` faz exclusivamente `received → error`.
A próxima entrega válida pode então usar a retomada existente do webhook.
Ela não processa pagamentos, não consulta o gateway e não muda licenças.

Recuperação automática baseada somente em idade foi descartada: como as
escritas atuais usam várias transações, um processo antigo poderia retomar e
sobrescrever o pagamento/assinatura depois de outro assumir. Um token apenas
na finalização não impediria essas escritas financeiras. A solução adicionada
é uma ferramenta operacional controlada, não um lease nem fencing automático.

## Contrato e segurança

Parâmetros obrigatórios:

- `p_event_key`: chave exata de um único evento Mercado Pago.
- `p_expected_updated_at`: versão relida do registro, sem arredondar a data.
- `p_reason`: motivo de 3 a 1000 caracteres.
- `p_quiescence_reference`: referência de 3 a 1000 caracteres à verificação
  operacional, contendo identificação do operador/ticket.
- `p_workers_stopped`: deve ser `true`; registra a declaração do operador.

Somente `service_role` tem EXECUTE. Sessões comuns, anônimas e inclusive o
superadmin do frontend são recusados. A função é SECURITY INVOKER, com
`search_path=pg_catalog` e tabelas qualificadas. Não amplia privilégios RLS.

A função bloqueia a linha, confere a versão e o estado e exige pelo menos
15 minutos desde `updated_at`, usando o relógio do banco. Os 15 minutos são
somente triagem; não comprovam que o processo terminou. Não existe parâmetro
para ignorar idade, estado ou versão.

Reset e `audit_logs.action=billing_webhook_recovered` pertencem à mesma
transação. Falha de auditoria desfaz o reset. O registro contém ator
`service_role`, chave, estado anterior/novo, versão anterior, motivo,
referência operacional e data do banco. Sucesso devolve `audit_id`.

## Procedimento operacional futuro

Executar primeiro no staging, após implantação controlada da migration.
Nenhum passo abaixo foi executado em produção nesta rodada.

1. Abrir janela de manutenção aprovada, registrar operador e ambiente exato.
2. Suspender novas entregas e replays ao endpoint em todas as regiões,
   revisões e instâncias. Confirmar que os workers antigos terminaram e
   que requisições já iniciadas ao banco/gateway concluíram ou encerraram.
   Timeout de uma resposta, sozinho, não comprova encerramento da gravação.
3. Reler o evento exato: confirmar `received`, horário e versão. Registrar no
   ticket a evidência da quiescência. Não usar payload sanitizado como fonte
   para fabricar um pagamento ou reconstituir a assinatura do gateway.
4. Em ferramenta de servidor com credencial protegida, chamar:

```javascript
const result = await serverSupabase.rpc('recover_billing_webhook_event', {
  p_event_key: event.event_key,
  p_expected_updated_at: event.updated_at,
  p_reason: recoveryReason,
  p_quiescence_reference: operatorTicketReference,
  p_workers_stopped: true
});
if (result.error) throw result.error;
```

5. Confirmar `recovered=true`, `audit_id` e estado `error` persistido antes de
   reabrir as entregas. Se houver conflito de versão, reler e investigar;
   não repetir cegamente nem sobrescrever a nova versão.
6. Permitir uma nova entrega assinada pelo provedor. O handler consulta o
   estado atual no gateway. Não reutilizar assinatura vencida nem fabricar
   assinatura para tentar conservar uma chave.
7. Conferir pagamento, validade, evento e auditoria. A chave usa `event.id` ou,
   quando ausente, `x-request-id`: um novo identificador pode criar outro
   evento. Nesse caso, correlacionar ambos pelo pagamento; o evento recuperado
   pode permanecer em `error`, com o novo evento em `processed`.

`p_workers_stopped=true` não faz detecção automática de processos nem protege
contra uma declaração incorreta. Se ainda existir worker antigo, a operação
não deve ser executada. Essa condição exige validação operacional real.

## Arquivos e validação

- `supabase/migrations/20261015222551_add_controlled_webhook_recovery.sql`
- `scripts/test-billing-webhook-supabase-api.js`
- `scripts/test-billing-webhook-runtime.js`
- `scripts/fixtures/webhook-recovery-assertions.sql`
- Este relatório/procedimento.

Ambiente: Supabase local nativo em WSL, API `http://127.0.0.1:28065`, esquema
completo das rodadas anteriores. Auth, Data API e triggers SQL reais; gateway
simulado. TypeScript real do handler executado pelo harness Node, não no Deno
hospedado. Contas somente `@example.invalid`, removidas após os testes.

| Verificação | Status | Evidência |
| --- | --- | --- |
| Falha na finalização e também no registro do erro | PASS | `test:billing-webhook-local`: reserva permanece received após handler encerrar |
| Autorização de recuperação | PASS | API rejeita anon, usuário comum e superadmin do frontend; service_role permitido |
| Motivo/referência/encerramento obrigatórios | PASS | API rejeita campos vazios, versão nula e confirmação false/null |
| Idade e estado | PASS | API rejeita evento recente, inexistente, processed, ignored e error |
| Versão e concorrência | PASS | API rejeita versão antiga; duas recuperações simultâneas geram um vencedor e uma auditoria |
| Retomada Start e Pro | PASS | Recuperação e entrega nova mantêm uma linha por pagamento e a validade anterior, sem dias extras |
| Novo ID de notificação | PASS | Mesmo pagamento em uma notificação nova não acrescenta validade |
| Idade não significa takeover | PASS | Runtime e API mantêm HTTP 500 para received antigo sem recuperação operacional |
| Falha de auditoria | PASS | Fixture SQL provoca falha, verifica evento integralmente intacto e ausência de auditoria; DDL/fixtures em rollback |
| Integridade da instalação | PASS | Na cópia isolada, hashes de eventos, auditoria, clientes e assinaturas iguais antes/depois |
| Regressões | PASS | `test:billing-webhook-runtime`, `test:billing-webhook`, `test:payment-plans-local`, `test:subscription-reconciliation-local`, `test:prepublication-p0` |
| Preparação do histórico | PASS | `test:licensing-homolog-replay`: 87 arquivos; não comprova replay SQL integral do zero |
| Segurança e sintaxe | PASS | Advisors local: results=[]; fixture verifica ACL/invoker/search_path; node --check e git diff --check |
| Revisão independente | PASS | Revisão somente leitura confirmou o mecanismo controlado e os requisitos operacionais |
| Staging/Edge hospedado/gateway real | NÃO VERIFICADO nesta rodada | Nenhum deploy ou chamada ao gateway real |

Migration aplicada por psql apenas no banco local principal e em
`s3d_reconciliation_replay_20261014`; isso não atualiza o ledger nem significa
implantação remota. Instalar a função não altera registros existentes.
Auditoria sintética local é preservada; fixtures e pagamentos auxiliares dos
testes são limpos por IDs exatos desta execução.

## Pendências e reversão

- Repetir o procedimento no staging e no runtime Edge hospedado, incluindo
  observação das execuções e reentrega real de sandbox autorizada.
- Houve uma falha intermitente `JWT issued at future` na repetição final da
  suíte local, antes de começar os cenários financeiros. Após conferir os
  relógios, a mesma suíte passou integralmente sem alterar o teste ou relaxar
  a autenticação. Windows estava aproximadamente 33 segundos à frente do WSL;
  isso é evidência de diferença temporal, não prova da causa da rejeição.
  A estabilidade do ambiente de autenticação continua pendente.
- Eventos fora de ordem, estorno/chargeback e datas divergentes do gateway
  continuam exigindo rodada própria. Não há garantia de exactly-once dos logs.
- Recuperação automática exigiria proteção transacional das escritas contra
  workers antigos. Não foi introduzida nem apresentada como pronta.
- Reversão: remover somente a RPC nova com o `drop function` documentado na
  migration. A auditoria anterior permanece e o handler continua recusando
  received sem recuperação; não reescrever pagamentos/contratos.

Estado: caminho de recuperação controlada homologado localmente. Produção,
OptiCore, IA e configuração Android preservados; sem push, deploy, APK ou AAB.
As orientações Supabase de menor privilégio e transações curtas guiaram a RPC.
Publicação e implantação remota permanecem pendentes.
