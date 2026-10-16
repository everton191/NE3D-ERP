# Preparação para publicação — fechamento incremental local

Data: 16/10/2026. Branch `codex/melhorias-setembro-2026`, base `6f20dae`.
Quadro de acompanhamento: [KANBAN-PUBLICACAO.md](KANBAN-PUBLICACAO.md).

## Resultado e limites

**PASS local:** corrigidos o espelho de vencimento e o perfil remanescente após
logout. O primeiro foi validado com Auth/API reais sobre esquema completo local;
o segundo com funções reais de frontend em VM/DOM simulado. Não confundir as duas
camadas de evidência. O relatório do navegador anterior continua como registro da
descoberta; a validação visual posterior ainda deve ser repetida.

Não houve acesso a produção ou staging remoto, deploy, push, alteração de contrato
real, geração de APK/AAB, ativação/tuning da IA ou mudança no OptiCore. O build web
é local e não cria um pacote Android. **Não READY TO PUBLISH.**

## Correções e arquivos

### K01 — espelho de vencimento

Commit `58f2471` — `fix(licensing): synchronize manual plan client expiry`.

- `supabase/migrations/20261016211251_sync_manual_plan_client_expiry.sql`.
- `scripts/test-licensing-postgres-isolated.js`.
- `scripts/test-licensing-supabase-api.js`.

O helper manual atualizava as datas da assinatura, mas omitia
`clients.plan_expires_at`. A migration nova acrescenta somente esse campo ao
UPDATE autorizado existente: validade concedida para Start/Pro e `NULL` para Free.
Usa a definição instalada para não substituir a proteção posterior da autoridade
manual por uma versão antiga. Guardas recusam contrato inesperado ou ausência da
autoridade privada. Não modifica as migrations históricas.

Preservados: owner, ACL, `SECURITY DEFINER`, `search_path`, autenticação,
superadmin efetivo, serialização por empresa, bloqueios, auditoria e recusa de
alteração manual de contratos Mercado Pago. Não houve nova superfície pública.

**Limite:** a instalação não reescreve linhas existentes. Espelhos históricos já
incoerentes exigem inventário e reconciliação comprovável em K06, sob autorização
no ambiente correspondente; não se presume que todos ficam corrigidos só por
instalar esta migration.

### K02 — encerramento de overlays no logout

Commit `13a781f` — `fix(auth): close account overlays on central logout`.

- `app.js`: uma chamada a `fecharPopup()` no início de `logoutUsuario()`.
- `scripts/test-logout-account-overlays.js`: regressão de cinco cenários.
- `package.json`: comando `test:logout-account-overlays`.

Reutiliza o fechamento central de popup, portal UiV3, modal, drawer e scrim.
Mantém os efeitos existentes de sessão/cache. Os testes exercitam os renderizadores
de perfil, a conclusão de login e o controlador de overlays reais; não substituem
a revogação Auth remota nem a conferência em pixels/aparelho.

### K04 — testes antigos atualizados sem mudar o produto

Commit `dd98685` — `test(auth): refresh public bootstrap and appearance route contracts`.

- `scripts/test-auth-session-boundary.js`: o renderer atual lê
  `document.documentElement.dataset`; a fixture anterior não o fornecia. Completa
  a fixture e exerce pré-login/restauração/biometria mantendo o bloqueio de
  dependências privadas antes da autenticação.
- `scripts/test-profile-admin-separation.js`: a Aparência foi habilitada
  intencionalmente no commit `d5e2d22`; a expectativa da flag desativada estava
  antiga. Agora executa controle de acesso, dispatcher e renderer da rota real;
  verifica tema/densidade/salvar e nega visitante, papel sem permissão, licença
  bloqueada e recurso negado. Preserva os asserts anteriores de separação
  administrativa. Desabilitar a flag somente em memória fez o novo teste falhar.

As duas falhas foram reproduzidas no checkpoint anterior. Depois das alterações
apenas nos testes, ambas passaram, junto com auth-ui, auth-hotfix e a nova
regressão de logout. Nenhuma suíte foi removida nem desabilitada.

## Ambiente local e aplicação efetiva

Supabase nativo em WSL `Ubuntu-24.04`: PostgreSQL 17.11, Auth e PostgREST reais,
API `http://127.0.0.1:28065`, SQL `127.0.0.1:21308`. Auth/API apontam para o banco
`postgres`; não para o clone. Credenciais carregadas somente no processo, sem
serem gravadas neste relatório ou em arquivos novos.

A migration nova foi executada integralmente via psql com `ON_ERROR_STOP=1` em:

1. `postgres`, usado pelos testes Auth/API.
2. `s3d_reconciliation_replay_20261014`, segundo esquema completo preservado.

Ambos confirmaram BEGIN/SET/SET/DO/COMMIT. Foram iterações SQL locais; não foi
fabricado ledger de migrations implantadas remotamente nem afirmado replay
integral de banco vazio. A preparação de replay reconheceu 95 migrations e duas
adaptações históricas isoladas, sem editar os arquivos originais.

## Evidências de preservação

Hashes MD5 são apenas comparadores locais de integridade, não assinatura de
segurança. Comparação feita antes da instalação e depois de terminar os testes e
suas limpezas; snapshots durante fixtures ativas não servem como baseline final.

| Banco / linhas anteriores | Antes e depois dos testes |
| --- | --- |
| `postgres`: 11 clientes | `282be9f03109f21c4dd06e997c75ac15` |
| `postgres`: 11 assinaturas | `52878f3f4a48fcff29e48de64300c0e9` |
| clone: 10 clientes | `0aba826d320927b36db82c3d9bf38336` |
| clone: 10 assinaturas | `e2ddab06affa1f992d9a2569ed87795b` |

A definição da função foi de `5597bf2e08e0492388a8098aee5c8dae` para
`d5dd8547226924fed1e185c66d524952`, igual nos dois bancos. Removendo somente a
nova atribuição do espelho, a definição volta exatamente ao hash anterior.
Owner `postgres`, ACL sem PUBLIC/anon, EXECUTE de authenticated/service_role,
`search_path=pg_catalog, public, private, auth`, `prosecdef=true` e marcador privado
de autoridade permaneceram iguais. As permissões de execução não substituem a
autorização, que também foi exercitada e negou usuários comuns.

O advisor de segurança do CLI nativo, explicitamente `--local --type security`,
retornou `No issues found`. Não é auditoria da produção nem de performance.

## Testes desta execução

| Grupo | Resultado / evidência |
| --- | --- |
| Regressão do espelho antes da correção | RED: PostgreSQL isolado encontrou vencimento nulo no cliente após Start; API real também rejeitou a nova assertiva de igualdade antes da migration. |
| PostgreSQL isolado após correção | PASS: concessões, renovação, retorno Free, marcador manual, ACL/owner/configuração/corpo preservados, bloqueios, expiração, RPCs e cards. Esquema reduzido, distinguido dos ensaios completos abaixo. |
| `test:licensing-supabase-local` | PASS: cinco contas sintéticas independentes, RPC autenticada, datas obrigatórias, Start/Pro/Free, renovação, repetição, concorrência, logout/login, auditoria e expiração. Cliente e assinatura relidos pela sessão do próprio cliente; negação Mercado Pago e usuário comum sem efeitos. |
| Persistência remota dos cards via API local | PASS dentro da suíte anterior: gravação, outra sessão autenticada, preço comercial intacto, rejeição de campo comercial/usuário comum/falha de rede, restauração exata. Não é editor completo aprovado por UI. |
| `test:subscription-reconciliation-local` | PASS: isolamento, cadastro/login, bloqueios e reconciliação da licença, inclusive concessões manuais vencidas. |
| `test:payment-plans-local` | PASS na repetição isolada: planos, pagamento único, renovação concorrente, aliases legados, estorno/chargeback mantendo validade para revisão e bloqueio de escrita comum. Primeira tentativa recebeu PGRST303, não o erro RLS esperado; não foi contada como PASS. |
| `test:payment-snapshot-local` | PASS: versões/identidades imutáveis, duplicação, concorrência e efeitos financeiros. |
| `test:payment-plan-order-local` | PASS: pagamentos tardios não substituem plano/autoridade mais recentes; inclusive Free manual autenticado e auditoria comum sem autoridade. |
| `test:payment-attempt-order-local` | PASS: tentativas antigas negativas não substituem intenção atual, versões ambíguas e concorrência. |
| `test:subscription-checkout-local` | PASS: persistência canônica, sessão independente, autoridade/revogação, falhas e concorrência. Gateway sintético na fronteira; não sandbox real. |
| `test:billing-webhook-local` | PASS: trigger real, falha/recuperação, repetição, concorrência e cancelamento preservando validade. Handler em harness Node, não Edge/Deno real. |
| Logout frontend | PASS: painel/topbar × legado/UiV3; remoção das camadas/listeners, logout repetido, nova identidade e preservação de licenças; ausência de popup também coberta. RED anterior reproduzido pelo teste. |
| Contratos/frontend/runtime | PASS: manual-plan-licenses, plan-presentation-persistence, auth-hotfix, theme-account-ui, ui-v3-foundation, prepublication-p0, mercadopago-cancel-authorization, billing-webhook-runtime, subscription-checkout-runtime, licensing-browser-harness e runtime-features. |
| Regressões legadas de autenticação/interface | PASS após atualização comprovada dos testes: auth-session-boundary, profile-admin-separation e auth-ui. Não implicam alteração da regra de personalização ou da autorização no produto. |
| Contratos Play | PASS: play-ai-disabled, play-no-self-update, play-no-external-checkout e play-account-deletion. Estáticos, sem certificar um novo artefato Android. |
| Build e integridade | PASS: build:web, sintaxe de app/testes novos ou alterados, diff --check, licensing-homolog-replay e supabase:test:migrations. |

### Intercorrências de ambiente

A primeira tentativa de integração parou em `JWT issued at future` antes de
exercitar a nova assertiva. Houve também PGRST303 durante uma suíte financeira.
O diagnóstico local encontrou ajuste NTP de cerca de -33 segundos na inicialização
WSL; Auth/HTTP/Postgres usavam o relógio WSL e um ensaio separado confirmou JWT
com iat coerente e RPC imediata/após dois segundos aprovadas. Isso indica uma
intercorrência temporal do ambiente, sem provar a causa de cada PGRST303.

Após estabilização/repetição, as suítes passaram. Não se alterou o relógio global,
NTP, tolerância JWT, regra RLS ou expectativa de erro para forçar aprovação. As
falhas iniciais e limpezas das respectivas fixtures foram preservadas no registro.

Cada suíte confirmou limpeza de suas identidades sintéticas por vínculo/ID,
revogando sessões e preservando auditoria. Nenhuma linha anterior de cliente ou
assinatura mudou, conforme os hashes finais acima. O catálogo editado no teste
foi restaurado exatamente, sem mudar preço cobrado.

A stack iniciada para estes ensaios foi parada ao final com o comando normal do
ambiente nativo, preservando bancos/estado; nenhum reset ou descarte de volumes.

## Próximos gates

K03 continua sem aprovação visual: o editor usa `prompt()`, não suportado no
navegador integrado. Testar navegador compatível ou adaptar ao formulário
existente com os mesmos campos/regras; não declarar persistência UI apenas porque
a API passou. K04 continua parcial por depender dessa validação e da repetição
visual pertinente; as duas falhas antigas dos testes já estão corrigidas.

Staging/Edge/sandbox real, dois navegadores/aparelhos, Android Play atualizado,
históricos divergentes, privacidade/Console, implantação autorizada e assinatura/
AAB permanecem nos cartões K05–K11. Não solicitar nem guardar senhas em documentos.
Não há autorização de publicação derivada deste Kanban.
