# Respostas de cadastro/login — homologação local de 15/10/2026

Branch `codex/melhorias-setembro-2026`; base `1fa7f23`.

## Problema e resultado

`register_saas_client` e `sync_saas_user_after_login` preservavam a assinatura
existente, mas retornavam `active_plan/plan_slug=free`, usando a variável do
catálogo escolhida para provisionar uma conta nova. O consumidor de login
copia `plan_slug` e `status` para o estado do aplicativo; isso podia mostrar
Free mesmo quando a assinatura persistida era Start/Pro.

O teste de integração reproduziu as duas divergências antes da correção:
`'free' !== 'start'` e `'free' !== 'pro'`.

A migration nova mantém o objeto de resposta legado e mescla os campos de
`get_effective_license(v_user_id::text)` à direita. Os IDs do provisionamento
(`user_id`, `client_id`, `subscription_id`) são excluídos dessa mescla para
permanecerem os originais. `company_id`, `client_code`, `clienteId`, `ok`,
`erp_profile_id` e `member_role` continuam presentes onde já existiam.

Plano, status, vencimento, trial, bloqueio e pagamento pendente vêm da mesma
autoridade de licença já utilizada pelo aplicativo. O alvo explícito evita
trocar a assinatura comercial de um superadmin pelo seu acesso administrativo
Pro. `status` permanece no vocabulário minúsculo esperado pelo frontend;
`effective_status` permanece separado.

Não há um segundo classificador de licenças, mudanças de preço ou alteração
dos contratos Mercado Pago. A resolução da licença passa a ocorrer antes
da resposta, incluindo a reconciliação existente de concessões manuais vencidas.

## Arquivos alterados

- `supabase/migrations/20261015212527_return_effective_license_from_saas_rpcs.sql`
- `scripts/test-subscription-reconciliation-api.js`
- Este relatório.

Não foram alteradas migrations históricas, frontend, IA, Android ou OptiCore.

## Ambiente e evidências

Supabase local nativo em WSL; Auth/API reais em `http://127.0.0.1:28065`.
Os testes criam exclusivamente contas `@example.invalid` identificadas por
execução, usam sessões autenticadas e removem suas fixtures ao terminar.
Esquema completo das rodadas anteriores, não um esquema simplificado.

Migration aplicada por psql apenas no banco local principal e na cópia
`s3d_reconciliation_replay_20261014`. Aplicação direta para validação não
atualiza o ledger nem comprova implantação em staging ou produção.

Na cópia isolada, hashes de todas as linhas de `clients`, `subscriptions` e
`plans`, e das ACL/configurações/SECURITY DEFINER das duas RPCs, foram iguais
antes e depois da instalação. Instalar a migration não altera esses dados
nem as permissões; altera somente a expressão de resposta das duas funções.

| Verificação | Status | Evidência |
| --- | --- | --- |
| Reprodução anterior | PASS | Novas asserções falharam para Start e Pro antes da migration |
| Free e transporte legado Premium/trial | PASS | Cadastro continua Free, sem trial novo; IDs e chaves legadas preservados |
| Start/Pro e vencimento | PASS | Ambas RPCs retornam os mesmos campos comerciais de `get_effective_license` com identidade explícita |
| Pagamento pendente | PASS | Retorna `pending`, sem conceder plano pago |
| Bloqueio | PASS | Retorna `blocked`, sem sobrescrever com `active` |
| Superadmin com empresa Free | PASS | RPC comercial retorna Free; consulta administrativa sem alvo continua Pro |
| Vencimento manual | PASS | Start/Pro em ambas RPCs retornam Free após expiração e geram uma única auditoria, inclusive em repetição |
| Isolamento e identidade | PASS | `test:subscription-reconciliation-local`: outro cliente intacto; e-mail de terceiro, vínculos forjados e chamadas anônimas negados |
| Persistência/licenças/cards | PASS após repetição | `test:licensing-supabase-local`; ressalva ambiental descrita abaixo |
| Pagamentos | PASS | `test:payment-plans-local` e `test:billing-webhook-local` |
| Contratos frontend/legados | PASS | `test:plan-legacy-contract`, `test:plans`, `test:commercial-plan-ui`, `test:auth-hotfix` |
| Preparação do histórico | PASS | `test:licensing-homolog-replay`: 86 arquivos; não equivale a replay SQL integral em banco vazio |
| Segurança da instalação | PASS | ACL: anon negado, authenticated/service_role mantidos; SECURITY DEFINER e search_path preservados; advisors local: `results=[]` |
| Sintaxe e patch | PASS | `node --check scripts/test-subscription-reconciliation-api.js` e `git diff --check` |
| Revisão independente do patch | PASS | Revisão somente leitura não identificou regressão concreta na fusão JSON/contratos |
| Staging remoto, dois navegadores/dispositivos | NÃO VERIFICADO nesta rodada | Nenhum deploy remoto efetuado |

## Limites e pendências

- A primeira execução da suíte geral de licenças falhou ao reler um card com
  `JWT issued at future`; as fixtures foram limpas e o card restaurado. Foi
  observada diferença de aproximadamente 33 segundos entre os relógios do
  Windows e WSL/banco. Isso não prova a causa da rejeição. A mesma suíte,
  sem alteração nem relaxamento da autenticação, passou na execução seguinte.
  A estabilidade temporal do ambiente local continua uma pendência ambiental.
- O teste novo valida as respostas pela API e compara o banco; a experiência
  visual após login/novo login ainda exige homologação em navegador/aparelho.
  As datas novas da resposta não são consumidas diretamente pelo cache atual;
  ele continua a receber a validade pela consulta posterior da licença.
- A migration depende da autoridade canônica de outubro e da reconciliação
  por cliente. Ela aborta diante de um corpo de função inesperado em vez de
  substituir lógica desconhecida. Validar a definição implantada no staging.
- A chamada ao resolvedor participa da transação da RPC e usa seus locks já
  existentes. Testes de concorrência e isolamento passaram no ambiente local.
- Do webhook, permanece a reconciliação de reservas `received` abandonadas e
  os testes específicos de eventos fora de ordem/estorno, conforme o relatório
  `homologacao-webhook-2026-10-15.md`. Esta etapa não altera esse processamento.
- Preparar e executar a homologação remota controlada antes da implantação
  em produção. Nenhuma migration, gateway real, deploy, push, APK ou AAB foi
  executado contra produção nesta rodada.

## Reversão

Guardar as definições implantadas antes da aplicação. Para reverter somente
esta mudança, restaurar a expressão final anterior das duas RPCs ou remover
a mescla `|| (public.get_effective_license(v_user_id::text) - array[...])`
do retorno, mantendo o restante da definição e suas ACL. Isso não exige
reverter dados de clientes, mas faz a resposta voltar à divergência anterior.

**Estado:** respostas corrigidas e homologadas localmente. Implantação remota
e publicação continuam pendentes. As orientações Supabase foram usadas para
preservar a autorização e testar pelas APIs reais; a autoridade comercial
existente foi reutilizada integralmente.
