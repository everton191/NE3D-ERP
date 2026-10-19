# K09 — homologação local real da confirmação de exclusão

Data: 19/10/2026. Branch `codex/melhorias-setembro-2026`, base `6cf8141`.
Checkpoint dos testes: `803f5f5`.
Continuação da [correção transacional](exclusao-conta-confirmacao-atomica-2026-10-18.md).
**Homologação local, não staging ou produção. Publicação continua bloqueada.**

## Ambiente e aplicação efetiva

Foi recuperada a stack nativa preservada em WSL `Ubuntu-24.04`, executada como
`functiongemma`: CLI 2.120.0, PostgreSQL 17.11 e Auth v2.197.0. Ela estava parada,
não ausente; executável e estado ficavam fora do PATH padrão. Não houve instalação
de Docker, upgrade de dependências do ERP ou criação de projeto remoto.

| Componente | Alvo real e limite |
| --- | --- |
| PostgreSQL/Auth/Data API | Stack local `s3d-prelaunch-8poijm`, SQL `127.0.0.1:21308`, API `127.0.0.1:28065`. Banco `postgres` com esquema completo e dados anteriores de homologação. |
| Migration | `20261018173758_atomic_account_deletion_confirmation.sql` executada integralmente via psql com `ON_ERROR_STOP=1` no banco local. Definição/ACL/trigger verificados depois, sem fabricar entradas no histórico remoto de migrations. |
| SMTP | Mailpit real em `127.0.0.1:32338`. O padrão local entregava somente link, incompatível com o campo de seis dígitos do app. |
| Auth com template de OTP | Processo Auth local separado, mesma versão/configuração de assinatura e banco isolado da stack; apenas porta e `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK` sobrescritos. Template canônico `supabase/templates/magic_link.html` servido por HTTP loopback. Proxy HTTP temporário encaminhou Auth para esse processo e REST para a stack original. |
| Handler | TypeScript canônico da Edge Function executado em Node VM com `createClient` real; Auth, SMTP e RPC/PostgREST reais. **Não foi execução Deno/Edge publicada.** |
| Concorrência SQL | Banco novo `s3d_deletion_20261019_a`, clone do esquema completo preservado `s3d_reconciliation_replay_20261014`, com 114 tabelas públicas e a nova migration aplicada integralmente. Não compartilha as fixtures Auth/API do banco `postgres`. |

O modo nativo não oferece o mesmo suporte a templates locais por `content_path`
do Docker; por isso foi usado o Auth auxiliar, sem alterar o template/código do
produto nem simular a verificação do OTP. A variável de template HTTP é o mecanismo
[oficial do Auth self-hosted](https://supabase.com/docs/guides/self-hosting/custom-email-templates).
Os processos auxiliares e o proxy foram encerrados após o ensaio.
A stack nativa recuperada também foi parada normalmente ao final, preservando
os bancos e a migration local. Nenhuma stack de outro diretório foi encerrada.

Scripts auxiliares desta máquina, sem credenciais gravadas, em
`artifacts/account-deletion-20261019/` (ignorado pelo Git): `local-runtime.cjs`,
`smtp-preflight.cjs` e `run-api-with-smtp-template.cjs`. Eles recuperam as chaves
locais somente em memória; não são um instalador ou configuração de produção.

O changelog foi consultado antes da retomada. Não houve upgrade/reindexação ou
alteração de TLS nesta rodada. O cron automático da CLI nativa 2.120 tem limitação
conhecida; os testes abaixo chamam o processador explicitamente, não certificam
agendamento diário. [Limitações do runtime nativo](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes).

## Testes e resultados

| Estado | Teste | Evidência e limite |
| --- | --- | --- |
| PASS local | `test:account-deletion-supabase-api` | 7 grupos com quatro usuários sintéticos: proprietário A/B, membro comum e usuário sem empresa. Login/Auth, falta de sessão, autorização e rejeição de empresa/finalidade indevidas. |
| PASS local | OTP e persistência | Envio real ao SMTP local, leitura do código recebido e verificação real pelo Auth. Confirmação/carência de 15 dias, solicitação, desafio consumido, sessão MFA e auditoria relidos pelo REST; outro tenant não enxerga o pedido. |
| PASS local | Cancelamento/recuperação | Cancelamento com novo OTP, outra sessão de login, logout, replay sem duplicação/novo prazo e falha de transporte antes da RPC sem sucesso falso. Recuperação usa novo OTP, respeitando intervalo de reenvio; não usa `generateLink` como atalho. |
| PASS local | ACL/trigger reais | RPC negada com SQLSTATE 42501 a anon e autenticados; usuário proprietário não altera diretamente campos de exclusão. Edição legítima do nome da empresa continua funcionando. |
| PASS local | `test:account-deletion-postgres-concurrency` | 9 grupos em conexões psql independentes, com bloqueios observados por `pg_stat_activity`/`pg_blocking_pids`, não ordem presumida por sleeps. |
| PASS local | Corridas de confirmação/cancelamento | Mesmo desafio, dois desafios válidos na mesma empresa e dois canceladores: uma operação vencedora, sem duplicação de pedidos/eventos ou extensão de prazo. |
| PASS local | Revalidação após espera | Desafio vence enquanto aguarda empresa bloqueada: `CODE_EXPIRED`, sem escrita parcial. Mudança de proprietário ou empresa inativa durante bloqueio é rejeitada. A empresa B conclui enquanto a empresa A está bloqueada. |
| PASS local | Corrida com processador | Cancelamento primeiro faz o processador ignorar a linha bloqueada e depois manter cancelada. Processador primeiro faz o cancelamento rejeitar `DELETION_COMPLETED`, sem ressuscitar a empresa. Testa a desativação lógica existente, não eliminação definitiva. |
| PASS local | Regressão de licenças | `test-licensing-supabase-api.js`: Free/Start/Pro, validade/renovação/concorrência/vencimento, autoridade, bloqueio de contrato Mercado Pago sintético, RLS, persistência dos cards e falha de conexão. Cinco usuários sintéticos removidos, card restaurado e preço comercial intacto. Nenhum gateway foi chamado. |
| PASS local | Guardrails | `test:account-deletion-homolog-guards`: 32 checks puros, sem I/O. Recusa alvo remoto, banco padrão/sem confirmação, parâmetros de conexão, caminhos inválidos e OTP ausente/ambíguo. Importar os harnesses não inicia testes. |
| PASS local | Regressão/build | 31 suítes JS selecionadas e `npm run build:web` PASS. São as 28 listadas no relatório de 18/10, mais os guardrails novos, `test-supabase-homolog-test-utils.js` e `test-supabase-homolog-replay.js`. Preparação de cópia de replay: 96 migrations, duas adaptações históricas; não equivale a novo replay integral no servidor. Build `0.1.0-6b07ee6d8df6c5ca`, sem alteração de código do produto nesta rodada. |
| PENDENTE | Edge/Deno/staging/UI | Falta executar a função no runtime real Deno/Edge e repetir o fluxo no navegador/aparelho contra staging autorizado com configuração própria. Novo login por cliente API não equivale a dois navegadores. |
| PENDENTE | Agendamento e exclusão real | Sem comprovação do cron diário, procedimento final de eliminação/anonimização, retenções, conta pessoal de membro, Storage/backup e formulários/canais públicos. |

Os testes SQL exigem URL loopback, banco com prefixo `s3d_deletion_`, confirmação
do nome exato e usuário local autorizado. A CLI encaminha a conexão SQL loopback
para um PostgreSQL com socket Unix: o teste exige também o diretório exato do
cluster quando o servidor não informa endereço TCP. Não se permite um banco
remoto ou `postgres` como alvo desse harness concorrente.

Somente a criação das fixtures `auth.users` do clone SQL usa uma transação curta
com `session_replication_role=replica`, para evitar provisionamento automático
fora do ledger. Volta a `origin` antes das operações testadas; RPC/processador
rodam como `service_role`, com funções, gatilhos, RLS e permissões reais intactos.
Esse preparo não substitui o cadastro/Auth/API real, coberto no outro harness.

## Falhas encontradas nos próprios testes

- O parser SMTP inicialmente confundiu a cor CSS `#071617` do template com outro
  código. Passou a ignorar blocos style/script; ambiguidade real continua sendo erro.
- O baseline de integridade com ledger vazio usava `NOT IN (NULL)`, excluindo todas
  as empresas do hash inicial. Corrigido para `TRUE` nesse caso. Não era mudança
  nos dados anteriores. Erros de cenário e limpeza agora são preservados juntos.
- A primeira janela de lock de 15 segundos terminou antes do ensaio de expiração.
  Foram ampliados limites finitos e removida uma conexão intermediária. A expectativa
  permaneceu `CODE_EXPIRED` — lock timeout não foi aceito como aprovação. Na execução
  final, bloqueio→expiração→rejeição ocorreu em cerca de 1,5 segundo.

Nenhum teste foi removido/desabilitado e nenhum código comercial foi alterado
para obter PASS. Os demais testes selecionados e o build web foram reexecutados
conforme o fechamento desta rodada.

## Preservação e limpeza

Comparadores MD5 abaixo servem apenas para detectar alterações nos snapshots
locais, não como assinatura de segurança. Mesma ordenação/serialização antes e
depois da migration e dos testes no banco `postgres`:

| Dados anteriores | Quantidade | MD5 antes/depois |
| --- | --- | --- |
| Empresas | 11 | `32e783485f89996078822132a22735c3` |
| Clientes | 11 | `82acac8d6d1a3e93f8d63b5b91e0bb31` |
| Assinaturas | 11 | `f3866f148e288bf64743117026bda110` |

Quatro usuários do ensaio Auth/API, cinco da regressão de licenças e um do
preflight SMTP removidos pelos respectivos ledgers. A primeira execução SMTP
incompleta também limpou seus quatro usuários. Desafios/sessões/pedidos ligados
às fixtures tiveram a remoção conferida; a auditoria API foi preservada com FKs
anuladas, conforme o schema. Mensagens sintéticas permanecem no coletor SMTP local.

No clone SQL, somente IDs gerados pelo harness foram removidos. Hashes de empresas,
clientes e assinaturas anteriores e os objetos monitorados de schema/RLS
permaneceram iguais: seis tabelas/ACLs, três funções, triggers de três tabelas e
políticas public/auth. Não é comparação de todo objeto existente no banco.
O banco descartável foi preservado, não apagado. Nenhuma conta
real foi desativada/excluída. O processador foi chamado somente nesse clone,
recusando execução se houvesse pendência anterior/fora do ledger.

`db advisors --local --type security` retornou `results=[]`/`message=db advisors`,
sem detalhes de cobertura; não tratar isso como auditoria completa. As permissões
da nova RPC foram comprovadas por consultas e tentativas autenticadas reais.

## Arquivos e repetição controlada

- `scripts/test-account-deletion-supabase-api.js`.
- `scripts/test-account-deletion-postgres-concurrency.js`.
- `scripts/test-account-deletion-homolog-guards.js`.
- `package.json`: três comandos de teste; sem dependência nova.
- Este relatório, o relatório da correção e `docs/KANBAN-PUBLICACAO.md`.

Os comandos de integração são opt-in e recusam credenciais/alvos ausentes. Não
carregam `.env`, vínculo CLI padrão ou configuração do app instalado. Fornecer
somente em memória `S3D_LOCAL_SUPABASE_URL`, `S3D_LOCAL_SUPABASE_ANON_KEY`,
`S3D_LOCAL_SUPABASE_SERVICE_ROLE_KEY`, `S3D_LOCAL_MAIL_URL`; para concorrência,
`S3D_LOCAL_DB_URL`, `S3D_LOCAL_DISPOSABLE_DB`, `S3D_LOCAL_WSL_PSQL`,
`S3D_LOCAL_WSL_DISTRO`, `S3D_LOCAL_WSL_USER` e, no modo Unix nativo,
`S3D_LOCAL_NATIVE_DATA_DIR`. Nunca incluir valores secretos em relatórios.

```text
npm run test:account-deletion-homolog-guards
npm run test:account-deletion-supabase-api
npm run test:account-deletion-postgres-concurrency
```

Os dois últimos precisam do ambiente isolado preparado; sem ele devem falhar,
não escolher staging/produção automaticamente. Nesta máquina o adaptador ignorado
recuperou o estado por `stack status --output-format json` e injetou somente chaves
locais no processo. A configuração versionada do app não foi substituída.

## Próximos limites

A parte transacional está homologada localmente nas camadas acima. Ainda não
autoriza implantação em produção: inventariar o instalado e repetir em staging
com Edge real, SMTP próprio, recuperação/concorrência e UI. Ordem futura
coordenada permanece migration → Edge → cliente; o cliente novo rejeita Edge
antiga sem prova `persisted`.

Antes de implementar eliminação destrutiva, definir e aprovar escopo de conta
pessoal vs empresa, retenções e dados de terceiros/arquivos/backups. Não apagar
dados reais ou modificar contratos para homologar. Webhook/sandbox continuam por
último; K07/K08/K09/K10/K11 continuam com gates pendentes. Sem produção, push,
deploy, APK/AAB, tuning ou alteração do OptiCore nesta execução.
