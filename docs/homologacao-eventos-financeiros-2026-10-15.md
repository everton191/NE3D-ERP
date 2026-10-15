# Eventos financeiros e cancelamento — homologação local de 15/10/2026

Branch `codex/melhorias-setembro-2026`, base `a84fbdc`.
Correções: `09790f7` (crédito único/publicação), `ca549a9` (assinaturas e cancelamento).

## Política confirmada pelo proprietário

Em estorno integral ou chargeback, **manter a validade já concedida e encaminhar
para revisão**. A correção preserva essa política: não retira dias nem bloqueia
o acesso pago vigente. Registra `review_required_at/review_reason` no controle
privado e um evento `audit_logs.action=billing_payment_review_required` por
pagamento, com ID, cliente, motivo e política aplicada.

Essa é uma marcação operacional auditada, não uma nova tela ou decisão
automática sobre o resultado da revisão. Registros continuam pendentes até
análise do operador; não são considerados resolvidos por uma nova aprovação.

## Falhas reproduzidas e correções

1. `approved → pending/rejected/cancelled/refunded/charged_back → approved`
   concedia mais 30 dias para o mesmo pagamento. O teste reproduziu o acréscimo.
   `private.payment_license_effects` agora registra um crédito por ID, na mesma
   transação da renovação. Reaprovação resolve a pendência sem mudar plano,
   preço ou prazo; outra cobrança pendente recente continua pendente.
2. Renovação pendente tirava a loja do ar mesmo com Start/Pro ainda válido.
   O teste reproduziu o bloqueio. O gate agora preserva publicação de Start/Pro
   ativo com prazo futuro confirmado; Free, vencidos e bloqueados são negados.
   Não foram alterados produtos, rankings, RLS nem a interface.
3. Cancelamento sobrescrevia datas pagas com `next_payment_date`, fazendo o
   banco, a interface e a loja discordarem. O teste reproduziu a mudança de
   `plan_expires_at` de novembro para outubro. Notificações de assinatura
   deixam de alterar plano, preço, validade e estado de acesso já persistidos.
4. Evento de um contrato antigo podia cancelar o atual. A nova RPC
   `apply_mercadopago_preapproval` confere assinatura, cliente e contrato sob
   bloqueio; o contrato diferente é ignorado e auditado.
5. Autorização antiga podia desfazer cancelamento. A RPC compara o
   `last_modified` do provedor, recusa versões anteriores e rejeita versões
   iguais com estados conflitantes. Uma confirmação ativa comprovadamente
   mais nova pode reativar. Sem versão confirmada, não limpa cancelamento.
6. O endpoint de cancelamento também ignorava erros de gravação e tentava
   persistir `subscription_status=canceling`, rejeitado pela constraint atual.
   Agora usa a mesma RPC transacional, preserva a autorização existente e só
   informa sucesso após confirmar a gravação. Mudança concorrente de contrato
   resulta em conflito para recarregar.
7. Testes concorrentes detectaram deadlock na primeira implementação dos
   bloqueios. Cliente e assinatura agora usam `NO KEY UPDATE`, na mesma ordem,
   compatível com `KEY SHARE` das chaves estrangeiras dos pagamentos.

O campo `last_modified` e o calendário de cobrança são expostos na
[referência oficial de assinaturas](https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/get-preapproval/get).
O calendário não foi tratado como prova de uma nova validade paga.

## Arquivos e migrations

- `supabase/migrations/20261015223452_prevent_repeat_payment_license_credit.sql`
- `supabase/migrations/20261015223848_apply_preapproval_without_changing_paid_access.sql`
- `supabase/migrations/20261015224335_preserve_paid_storefront_during_pending_renewal.sql`
- `supabase/functions/mercadopago-webhook/index.ts`
- `supabase/functions/mercadopago-cancel-subscription/index.ts`
- `scripts/test-payment-plans-supabase-api.js`
- `scripts/test-billing-webhook-supabase-api.js`
- `scripts/test-billing-webhook-runtime.js`
- `scripts/test-billing-webhook.js`
- `scripts/fixtures/payment-license-effects-assertions.sql`
- `scripts/fixtures/preapproval-atomicity-assertions.sql`
- Este relatório.

Migrations históricas preservadas. Aplicar as três novas migrations em ordem
antes de implantar os dois handlers dependentes, após homologação remota.
O controle privado tem RLS e nenhum acesso direto para anon, authenticated ou
service_role; somente o trigger interno protegido o escreve. A RPC nova é
SECURITY INVOKER, `search_path=pg_catalog`, EXECUTE somente service_role.

## Ambiente e evidências

Supabase nativo local em WSL, API `http://127.0.0.1:28065`, esquema completo.
Auth, RPCs, Data API e triggers reais; somente o transporte Mercado Pago é
simulado. Contas e lojas sintéticas `@example.invalid`, com limpeza por IDs
da execução. Fixtures SQL e constraints de falha executam em rollback.

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Crédito único em Start/Pro | PASS | `test:payment-plans-local`: cinco transições intermediárias, retorno approved sem mais dias |
| Estorno/chargeback | PASS | Validade, licença e publicação preservadas; uma marcação de revisão por pagamento |
| Publicação | PASS | Free negado; Start/Pro válido e renovação pendente permitido; bloqueio/vencimento negados |
| Concorrência financeira | PASS | Dois INSERTs com subscription_id explícito adicionam 60 dias; INSERT+licença e UPDATE pending→approved+RPC não abortam |
| Datas de cancelamento | PASS | Start/Pro: calendário anterior e posterior não alteram os quatro campos de prazo nem o cliente |
| Ordem/contrato da assinatura | PASS | Autorização antiga não reativa; mais nova reativa; contrato antigo não muda a assinatura; versão igual conflitante retorna erro |
| Cancelamento autenticado real local | PASS | Handler com Auth/API reais: usuário comum, cliente arbitrário e sessão inválida negados; administrador autorizado cancela com datas preservadas |
| Sem sucesso falso | PASS | Falha simulada da RPC após resposta do gateway produz erro; estado local não muda |
| Atomicidade | PASS | Fixtures SQL comprovam rollback da marker quando falha a licença e rollback de assinatura/cliente/auditoria quando falha o espelho |
| Histórico aprovado | PASS | Pagamento sintético aprovado antes da migration recebeu marker legacy; ciclo posterior não renovou novamente |
| Instalação preserva registros | PASS | Hashes de clients/subscriptions/payments iguais antes/depois na cópia isolada; somente o controle novo recebeu a baseline |
| Fonte final da migration | PASS | Transformação do trigger original reproduz exatamente a função testada; funções finais dos dois bancos têm hash igual `8c15182abd473c2bd87112b8f57975b6` |
| Licenças/persistência/isolamento | PASS | `test:subscription-reconciliation-local` e `test:licensing-supabase-local` |
| Contratos e recuperação existentes | PASS | `test:billing-webhook-runtime`, `test:billing-webhook`, `test:plan-cancellation-flow`, `test:prepublication-p0`, `test:storefront-plan-publication`, `test:phase3-rpc-hardening` |
| Preparação do histórico | PASS | `test:licensing-homolog-replay`: 90 arquivos; não equivale a executar todo o histórico SQL do zero |
| ACL/sintaxe/revisão | PASS | Fixtures, node --check, diff --check, revisão independente e advisors local `results=[]` |
| Staging/runtime Edge/MP sandbox e dispositivos | NÃO VERIFICADO nesta rodada | Nenhum deploy remoto ou chamada ao gateway real |

As migrations foram validadas por psql no banco local principal e em
`s3d_reconciliation_replay_20261014`; isso não atualiza o ledger de migrations.
Uma execução de webhook falhou intermitentemente com `JWT issued at future`
antes dos cenários financeiros. Após conferir os relógios, a mesma suíte
passou sem relaxar autenticação. Windows estava aproximadamente 33s à frente
do WSL; não foi estabelecida a causa da rejeição.

## Limites e próxima rodada

- A garantia de crédito acompanha a existência do registro financeiro. Não
  excluir/recriar pagamentos para corrigir status: a exclusão em cascata remove
  a marker. Toda correção deve preservar a identidade e o histórico.
- Somente pagamentos já `approved` na instalação recebem baseline de crédito.
  Não foi inventado um histórico para registros que já estavam estornados,
  rejeitados ou pendentes; casos antigos ambíguos precisam de revisão isolada.
- Datas legadas já divergentes entre `premium_until`, `plan_expires_at` e
  `current_period_end` não foram saneadas em massa. A mudança impede novos
  cancelamentos de criar essa divergência.
- A ordenação nova é da assinatura/preapproval. Snapshots concorrentes de
  **pagamentos**, principalmente pagamentos distintos com planos diferentes,
  ainda precisam de proteção por versão e validação da projeção financeira.
  A marker impede renovar duas vezes o mesmo ID, mas não é essa proteção.
- Versão antiga inválida ou payload sem `last_modified` para contrato já
  versionado falha fechado e exige investigação; não ignorar o erro para obter
  HTTP 200. Não há garantia de exactly-once dos logs.
- Faltam implantação/homologação controlada no staging, gateway sandbox e
  conferência em dois navegadores/aparelhos. Produção não foi acessada.
- Reversão deve conservar a marker e a auditoria. Não remover seu histórico
  depois de atividade real; preferir correção aditiva. Reverter handlers exige
  avaliar a perda de proteção antes de reverter a RPC/trigger.

Produção, OptiCore, IA, Home e configuração Android preservados; sem deploy,
push, APK ou AAB. **Não READY TO PUBLISH.** As orientações Supabase guiaram o
controle privado, as transações e a correção de concorrência; a política de
estorno segue a decisão expressa do proprietário.
