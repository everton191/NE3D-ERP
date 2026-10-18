# K09 — confirmação e cancelamento de exclusão sem sucesso falso

Data: 18/10/2026. Branch `codex/melhorias-setembro-2026`, base `d9153bb`.
Checkpoint da implementação e testes: `d4b4997`.
Correção local; **não aplicada no Supabase local completo, staging ou produção**.
Sem purga de contas, dados reais, APK/AAB, push ou deploy. `apps/opticore`
permaneceu com sua alteração anterior, fora deste trabalho.

## Resultado e causa

| Estado | Resultado verificável |
| --- | --- |
| PASS local | Confirmação/cancelamento agora exigem retorno de gravação confirmado; falha ou resposta incompleta não gera mensagem de sucesso. |
| PASS local | Empresa, solicitação, sessão de segurança, consumo do desafio e auditoria de sucesso são gravados pela mesma função SQL. Falha ou ausência de linha em qualquer etapa desfaz todas essas gravações. |
| PASS local | Execução da RPC reservada a `service_role`; usuário comum/anon não pode chamá-la. Vínculo entre proprietário, empresa, desafio e finalidade é revalidado no servidor. |
| PASS local | Alteração direta dos campos de exclusão da empresa por `anon`/`authenticated` é rejeitada; edição normal da empresa é preservada conforme RLS existente. |
| PENDENTE | Auth/PostgREST reais com OTP, esquema completo, duas conexões concorrentes e disputa com o processador agendado. |
| FAIL/PENDENTE separado | O processador existente ainda faz desativação lógica, não eliminação comprovada de dados. Esta correção não conclui K09 nem libera publicação. |

Antes, a Edge Function executava várias gravações independentes sem conferir
os respectivos `.error`. Podia devolver sucesso com empresa e solicitação
divergentes. A interface fechava o diálogo e confirmava a operação mesmo com
retorno incompleto. A atualização direta de `companies` também precisava de
proteção para não substituir o consentimento por e-mail.

## Alteração mínima

- Nova migration `20261018173758_atomic_account_deletion_confirmation.sql`,
  criada pela CLI e sem editar migrations históricas. Não altera registros
  anteriores, cron, retenção, planos ou assinaturas.
- RPC `apply_account_deletion_action`: `SECURITY INVOKER`, nomes qualificados,
  `search_path=pg_catalog`, `EXECUTE` revogado de PUBLIC/anon/authenticated e
  concedido somente a `service_role`. Ela não é um endpoint público de OTP.
- A Edge deriva usuário, empresa e e-mail do contexto autenticado e a sessão da
  resposta Auth. IDs enviados pelo navegador não autorizam a operação. Código,
  usuário da sessão, sub, session_id e validade são verificados antes da RPC.
- Bloqueio de empresa primeiro, como no processador existente; depois desafio
  e solicitações. Desafio é conferido novamente após os locks, inclusive prazo.
- Confirmação mantém a carência existente de 15 dias. Cancelamento exige uma
  única solicitação confirmada coerente com a empresa e não reativa uma empresa
  já processada. Enquanto ainda pendente, preserva a regra anterior de permitir
  cancelamento, sem inventar novo prazo de negócio.
- Repetição não cria outra solicitação, não estende datas e não duplica evento.
  Depois de cancelar, um novo pedido mantém o histórico anterior.
- Estado legado ausente/duplicado/divergente é rejeitado para revisão, sem
  consertar dados reais automaticamente.
- Frontend valida `persisted`, ação, IDs, prazo ou cancelamento e, quando
  presente, sessão. Evita envio duplo pelo mesmo formulário. Se a gravação
  confirmou mas a atualização da tela falhou, informa essa distinção e impede
  repetir a operação já confirmada.
- Fingerprint web inclui o módulo de segurança da conta, para que a correção
  invalide a versão do cache/PWA. Não houve mudança de CSS ou layout.

A atomicidade é da transação PostgreSQL; uma exceção desfaz as mudanças dessa
chamada. [Documentação de funções Supabase](https://supabase.com/docs/guides/database/functions).
A verificação HTTP do OTP no Auth ocorre **antes** da transação e não pode ser
desfeita por ela. Uma falha pode consumir o código/criar sessão Auth sem concluir
a ação. Após resposta ambígua, consultar a situação da conta e solicitar outro
código se necessário; não interpretar erro de transporte como prova de rollback.

## Testes desta rodada

Somente fixtures sintéticas e processos locais, sem credenciais de clientes.

| Estado | Teste | Evidência e limite |
| --- | --- | --- |
| PASS | `test:account-deletion-frontend` | 34 cenários do módulo real com DOM/rede simulados: erro HTTP, resposta incompleta/malformada, sessão inválida, cancelamento, prazo, duplo envio, recuperação e falha após confirmação. Não é ensaio visual em navegador/aparelho. |
| PASS | `test:account-deletion-edge` | 42 cenários executando o TypeScript real em VM, com Auth/RPC simulados e nenhuma rede real. Nega usuário/empresa/finalidade/sessão indevidos; erro SQL, zero proof e falha de transporte não reportam sucesso. |
| PASS | `test:account-deletion-postgres-isolated` | 80 grupos no PostgreSQL PGlite em memória. Usa definições históricas reais das tabelas e aplica a nova migration integralmente, com Auth/RLS de fixture. Não é replay de todo o histórico ou stack Supabase. |
| PASS | Rollback/recuperação | Falha injetada e trigger que retorna zero linhas, nos cinco conjuntos de gravação, tanto na confirmação quanto no cancelamento. Snapshots das tabelas antes/depois idênticos na falha; recuperação funciona com desafio SQL ainda pendente. Não prova reutilização do mesmo OTP Auth. |
| PASS | Autorização/consistência | Duas empresas, usuário sem propriedade, desafio de outro usuário/empresa/finalidade, vencimento, tentativas, replay, empresa inativa/completed, pedido ausente/duplicado/divergente e escrita direta bloqueada. |
| PASS | Regressão | 28 suítes JS selecionadas, listadas abaixo, e `npm run build:web`. Build web `0.1.0-6b07ee6d8df6c5ca`. Sem reexecutar Android/JUnit nesta rodada. |
| PENDENTE | Integração completa | Stack local anterior sem portas ativas; Docker/psql/CLI Supabase não disponíveis no PATH do ambiente de execução. Não foi reinstalada nem reiniciada infraestrutura. Sem novo teste remoto. |

RED preservado na execução: frontend antigo apresentou 20 falhas; Edge de
`d9153bb` apresentou 21 falhas nos 30 cenários iniciais. Os testes não foram
desabilitados. Casos adicionais foram incluídos depois desses baselines.

Suítes executadas nesta rodada (arquivos em `scripts/`):

```text
test-account-deletion-frontend.js
test-account-deletion-edge.js
test-account-deletion-postgres-isolated.js
test-config-image-selection.js
test-android-file-permission-routing.js
test-android-media-validation-isolation.js
test-android-bridge-validation-isolation.js
test-android-back-navigation.js
test-pdf-delivery-resources.js
test-pdf-browser-bindings.js
test-theme-account-ui.js
test-theme-isolation.js
test-theme-backup-authority.js
test-ui-theme-consistency.js
test-light-theme-no-gradient.js
test-play-ai-disabled.js
test-play-no-self-update.js
test-play-no-external-checkout.js
test-play-account-deletion.js
test-account-security-inventory-foundation.js
test-account-security-activation.js
test-phase3-privacy-analytics.js
test-prepublication-p0.js
test-google-integrations-foundation.js
test-auth-ui.js
test-web-build-appearance-fingerprint.js
test-web-build-no-local-model-artifacts.js
test-licensing-postgres-isolated.js
```

## Arquivos

- `supabase/migrations/20261018173758_atomic_account_deletion_confirmation.sql`
- `supabase/functions/account-security/index.ts`
- `src/features/account/account-security.js`
- `scripts/test-account-deletion-{frontend,edge,postgres-isolated}.js`
- `scripts/prepare-web.js`, `scripts/test-web-build-appearance-fingerprint.js`
- `package.json`: três entradas de teste, sem dependência nova.
- Este relatório, `docs/privacidade-inventario-local-2026-10-18.md` e
  `docs/KANBAN-PUBLICACAO.md`.

## Homologação e implantação posterior — não executadas

1. Recuperar stack Auth/PostgREST isolada com esquema completo e fixtures novas.
   Aplicar migration somente nela; inspecionar ACLs/RLS/triggers reais.
2. Exercitar solicitação, OTP, confirmação, cancelamento, recarga e novo login
   pelos clientes autenticados. Negar usuário comum e empresa alheia. Testar
   ausência de conexão antes e depois de commit/resposta.
3. Testar duas conexões e corrida com `process_due_account_deletions`, falhas de
   gravação, desafio vencido durante espera e expiração das sessões. Confirmar
   que o trigger não afeta provisionamento/edição legítima ou rotinas de servidor.
4. Repetir em staging isolado com função/segredos próprios e contas sintéticas;
   sem cobrança nem purga de conta real. Não usar wrappers vinculados à produção.
5. Implantação futura coordenada: **migration → Edge → frontend/web**. O cliente
   novo rejeita a Edge antiga, que não devolve o contrato `persisted`. Não publicar
   somente a interface. Conferir o estado instalado antes de qualquer operação.
6. Rollback: restaurar versões compatíveis de cliente/Edge e só então retirar RPC
   e trigger, sem apagar histórico de solicitações/auditoria. Restaurar a Edge
   antiga reintroduz o risco original; usar apenas como contingência controlada.

Riscos ainda abertos: exclusão/anonimização real, retenção, conta pessoal de
membro, cron efetivo, SDKs/backup e declarações/canais públicos. Outros fluxos
legados de ativar/desativar 2FA e suas escritas não foram integralmente auditados
ou corrigidos aqui. **Não declarar READY TO PUBLISH. Webhook/sandbox por último.**
