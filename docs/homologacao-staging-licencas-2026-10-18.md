# Homologação remota — licenças e persistência

Data: 18/10/2026. Branch conferida: `codex/melhorias-setembro-2026`.
HEAD inicial: `d5667bf`. Alteração preexistente em `apps/opticore` preservada.
**Não liberado para publicação nem para implantação em produção.**

## Ambiente e limites

Após autorização para iniciar a etapa Supabase, a CLI autenticada encontrou
`Simplifica 3D Staging` (`sgcsgudgaxzysqyqxnik`), `ACTIVE_HEALTHY`, região
`sa-east-1`. Não foi necessário criar/reativar projeto ou autorizar custo.
A conexão MCP, em outra organização, retornou lista vazia; isso não significava
que o staging estivesse indisponível.

O vínculo da raiz continuou em `qsufnnivlgdidmjuaprb` (produção). Foi criado
somente um contexto CLI separado e ignorado pelo Git:
`.tmp-edge-preview-staging-audit`, explicitamente vinculado ao staging.
Consultas e migrations usaram esse contexto; não houve consulta ao banco,
Auth ou dados de produção. A listagem de projetos incluiu apenas seus metadados.
Não houve deploy de funções/web, push, APK/AAB, acesso ao aparelho ou mudança de IA.

O `.env.staging` existente ainda aponta para o ref obsoleto
`dcaqiatgftkjxyewlhgi`: não foi usado nem modificado. As chaves necessárias
foram obtidas pela CLI com o ref explícito, verificando `ref` e `role` dos JWTs,
e transmitidas aos testes somente no ambiente do processo. Nenhuma chave,
senha ou sessão foi gravada no relatório ou no repositório.

## Migrations efetivamente aplicadas

O histórico remoto inicial tinha 81 versões, até `20261012022301`. As duas
migrations de licenças/cards de 11/10 já estavam instaladas, assim como a
correção de signup e as três proteções da loja de 12/10. Não foram reaplicadas.
O dry-run do executor oficial listou exatamente estas 14 pendências:

```text
20261013214555_scope_subscription_reconciliation_to_client
20261013214645_bind_saas_registration_to_authenticated_identity
20261015012832_canonicalize_payment_subscription_plans
20261015152405_support_erp_payment_upsert
20261015212527_return_effective_license_from_saas_rpcs
20261015222551_add_controlled_webhook_recovery
20261015223452_prevent_repeat_payment_license_credit
20261015223848_apply_preapproval_without_changing_paid_access
20261015224335_preserve_paid_storefront_during_pending_renewal
20261015230259_apply_ordered_payment_snapshot_atomically
20261016104412_preserve_newer_paid_plan_during_late_credit
20261016124127_persist_canonical_subscription_checkout_atomically
20261016124420_order_payment_attempt_status_by_provider_creation
20261016211251_sync_manual_plan_client_expiry
```

Aplicação pelo `db push --linked`, apenas no contexto isolado: **PASS**.
Histórico posterior: **95 versões**, **20 de outubro**, última
`20261016211251`. Novo dry-run: `Remote database is up to date.`
Nenhuma migration histórica foi editada ou criada nesta rodada.

Antes da instalação havia zero pagamentos no staging. Os dois backfills de
fatos privados de pagamento não encontraram histórico para reconstruir.
Não foi executada reconciliação global nem alterada uma assinatura real.

**Risco de implantação identificado:** `20261015152405` emitiu dois avisos
`25P01: SET LOCAL can only be used in transaction blocks`. O índice foi criado,
mas esses limites locais não ficaram ativos nessa execução. Não esconder os
avisos nem editar a migration já aplicada: K10 deve definir timeouts efetivos
no executor/sessão e verificar duplicatas/locks antes da implantação autorizada.

## Testes executados e evidências

| Estado | Verificação | Evidência observada |
| --- | --- | --- |
| PASS | Licenças pela API remota | `test-licensing-supabase-api.js staging`, exit 0; cinco Auths sintéticos, empresas independentes, cliente Supabase com sessões autenticadas. |
| PASS | Free/Start/Pro, datas e renovação | Concessão sem prazo/data passada negada; renovação, repetição, concorrência e retorno Free relidos nos espelhos de cliente/assinatura. |
| PASS | Vencimento e auditoria | Rebaixamento de concessão sintética vencida para Free, limpeza de datas e exatamente uma auditoria de vencimento após releitura repetida. |
| PASS | Autorização e isolamento | Usuário comum não altera plano/card nem concede superadmin por metadata/tabelas; leitura cruzada de assinatura vazia por RLS; vínculo Mercado Pago **sintético** impede rebaixamento manual. |
| PASS | Persistência dos cards | Gravação por RPC superadmin, logout e novo login em cliente independente, releitura remota, preço comercial inalterado. Falha de rede injetada não grava nem produz sucesso. |
| PASS | Pagamentos pela API remota | `test-payment-plans-supabase-api.js staging`, exit 0; duas contas sintéticas. Nenhum gateway externo chamado. |
| PASS | Estados, crédito e concorrência | Start/Pro: pendência não concede; aprovação/renovação; repetição não duplica crédito; dois pagamentos distintos concorrentes somam 60 dias; licença concorrente sem abortar. |
| PASS | Estorno e chargeback | Validade já concedida preservada e revisão registrada uma vez por pagamento, conforme decisão do proprietário. |
| PASS | Escritas financeiras indevidas | Usuário comum não fabrica pagamentos; planos inválidos e assinatura inexistente/cruzada rejeitados sem efeitos; caminho administrativo autorizado permanece. Alias Premium de pagamento reconhecido como Pro sem reescrever histórico. |
| PASS | Segurança do harness | `test-supabase-homolog-test-utils.js`, exit 0: alvos exatos, produção recusada, limpeza após falhas e restauração compare-and-swap. |
| PASS estático | Histórico SQL local | `check-supabase-migrations.js`, 97 verificações textuais. Não equivale a 97 testes remotos nem certifica comportamentos legados mencionados nas strings. |
| PENDENTE | Novas RPCs de cobrança pela API remota | `apply_mercadopago_payment`, `persist_mercadopago_checkout`, `apply_mercadopago_preapproval` e `recover_billing_webhook_event` instaladas; EXECUTE conferido, mas não chamadas por estas duas suítes. Ordenação por timestamps reais do provedor não homologada remotamente. |
| PENDENTE | Dois navegadores/aparelhos | Novos clientes/sessões SDK não são dois navegadores reais; K07 continua aberto. |
| NÃO VERIFICADO | Edge/Deno e Mercado Pago sandbox | Sem funções publicadas e sem segredos de integração no staging. Não confundir testes financeiros sintéticos com cobrança externa. |

As únicas escritas de teste foram em contas/dados sintéticos e no card Start
do staging, temporariamente. Ao final, os sete Auths criados e suas empresas,
clientes e lojas foram removidos por IDs/vínculos conferidos; as sessões foram
revogadas e a autoridade superadmin sintética retirada. Auditoria preservada.
O card teve seus metadados e preço restaurados com compare-and-swap; seu
`updated_at` mudou, portanto o hash integral da linha não é idêntico ao inicial.

A suíte financeira escreve diretamente em `payments` com service_role, sem
`metadata.date_created`/`paid_at`: valida o caminho legado privilegiado do
trigger, não toda a nova ingestão por snapshots. As suítes mais recentes de
snapshot/checkout/ordem continuam LOCAL-only; suas guardas não foram removidas
nem os resultados locais promovidos a PASS remoto. Saídas e exit codes foram
conferidos nesta execução; não foram preservados arquivos de logs brutos.

Hashes agregados de todas as linhas, calculados no banco antes da instalação e
depois da limpeza (sem exportar PII):

| Dados | Antes | Depois | Resultado |
| --- | --- | --- | --- |
| clients | 10; `f01cd4d058d6196330a9d98e1be82ed3` | 10; mesmo hash | PASS, linhas anteriores intactas |
| subscriptions | 10; `836d4eddcae206aef352eca4d7531f79` | 10; mesmo hash | PASS, linhas anteriores intactas |
| payments | 0; `d41d8cd98f00b204e9800998ecf8427e` | 0; mesmo hash | PASS, nenhum pagamento remanescente |
| plans | 7; `3c7af3b6da3567fce4da4d3dbc99f756` | 7; `85a23dc901e57673e40646dd1afb9b6d` | Esperado: apresentação/preço restaurados; timestamp do card atualizado |

## Permissões conferidas no banco remoto

RLS ativo em `plans`, `profiles`, `clients`, `subscriptions`, `payments`,
`superadmins`, `erp_profiles` e `audit_logs`. Grants amplos preexistentes não
foram tratados como autorização por si: as negações acima foram exercitadas
pela API autenticada. Isto não é auditoria exaustiva de todas as policies.

As implementações privadas de concessão e apresentação têm proprietário
`postgres`, `SECURITY DEFINER`, `search_path=pg_catalog, public, private, auth`,
sem EXECUTE anônimo; as fachadas públicas são invoker. A autorização de
superadmin foi testada no servidor. Reconciliação privada/trigger de vínculos
não permitem EXECUTE direto a anon/authenticated/service_role; cleanup global
público permite somente service_role dentre esses três papéis, com
`search_path=pg_catalog`. Não foi chamado para homologar.

As quatro RPCs de cobrança/recuperação citadas acima são invoker,
`search_path=pg_catalog`, EXECUTE negado a anon/authenticated e permitido a
service_role. As tabelas privadas `payment_license_effects` e
`manual_plan_projection_authority` não concedem SELECT direto a nenhum desses
três papéis. Isto confirma ACL instalada, não execução funcional das RPCs.

`erp_is_superadmin` mantém `search_path=public`; `get_effective_license` é
invoker e mantém `public, private`. Esses valores foram registrados, não
declarados vulnerabilidade apenas por aparência nem alterados globalmente.

A revisão seguiu as skills Supabase e Postgres Best Practices: ambiente
explícito, RLS separada dos grants, sessões reais e locks limitados. A mudança
anunciada de grants padrão reforça que novas tabelas precisam de grants
específicos; não justifica conceder acesso global. [Changelog oficial](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## Cobrança: configuração ainda necessária

Listagem explícita no staging: `functions list` retornou **0 funções**;
`secrets list` retornou **0 entradas**. Isso descreve o staging atual, não a
configuração da aplicação web/produção, que não foi consultada ou alterada.
Inventário somente de nomes/presença nos arquivos `.env*` da raiz não encontrou
as variáveis `MERCADOPAGO_SANDBOX_*`; valores não foram exibidos.

Para avançar: disponibilizar configuração de teste por arquivo/cofre seguro,
validar conta e token sandbox sem copiar credencial real, definir URLs isoladas
de retorno/webhook e planos de teste Start/Pro. Preparar e autorizar o deploy
somente das funções de staging; depois verificar assinatura de webhook,
aprovação/rejeição/abandono, duplicação/ordem, contrato recorrente, falha
ambígua e estorno. Não usar wrappers `*-remote-controlled` vinculados à
produção, mesmo quando o comando se chama `dry-run` ou `validate`.

K05 fica **parcial: banco/Auth/API remotos PASS; Edge/sandbox PENDENTE**.
K06 históricos, K07 plataformas distintas, K08 Android completo, K09
privacidade/Console, K10 implantação autorizada e K11 AAB/publicação continuam
separados. Não foi preparado nem autorizado release nesta execução.
