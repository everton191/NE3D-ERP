# Progresso Codex - Auth, Superadmin e Sincronizacao

Data: 2026-05-04
Branch de trabalho: `fix/stability-auth-superadmin-onboarding`
Backup criado: `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-stability-auth-superadmin-20260504-080352`

## Escopo consolidado

O pedido foi consolidado para trabalhar em etapas curtas, sem alterar producao diretamente e sem refazer a parte de planos, que ja foi simplificada antes. A parte de planos so sera tocada quando for dependencia direta de auth, superadmin ou permissoes.

Objetivo pratico desta rodada:

- Conta criada pelo app/site deve criar automaticamente os registros SaaS no Supabase.
- Login deve permanecer salvo ate logout manual.
- Dados devem ficar vinculados a `user_id`, e-mail e futuramente `company_id`.
- Superadmin deve listar clientes sem pedir configuracao manual de Supabase para o usuario final.
- Superadmin deve bloquear, desbloquear, alterar assinatura e remover teste com confirmacao e feedback.
- Backup/sincronizacao deve ser simples: usuario logou, o app sabe onde salvar.
- Google Drive e campos tecnicos de backup devem ficar ocultos/desativados enquanto nao estiverem completos.
- Dono da conta nao deve ser chamado de superadmin.
- Onboarding deve aparecer apenas uma vez para cliente novo.
- Assistente/listas devem limitar contexto para evitar excesso de dados.

## Etapa 0 - Preparacao

Concluido:

- Backup completo confirmado.
- Apenas os 2 backups mais recentes foram preservados.
- Branch separada criada/confirmada: `fix/stability-auth-superadmin-onboarding`.
- Projeto principal nao foi alterado em producao.
- `node_modules`, `dist`, `build`, `.git`, `.env` e diretorios gerados foram tratados como fora do diagnostico funcional.

Observacao: `rg` falhou no Windows com "Acesso negado"; foi usado fallback com `Get-ChildItem` e `Select-String`.

## Etapa 1 - Diagnostico

Arquivos principais identificados:

- `app.js`: auth, cadastro, superadmin, sync, backup, onboarding futuro e assistente local.
- `style.css`: estados visuais, login, superadmin, backup e futuro onboarding.
- `index.html`, `manifest.webmanifest`, `sw.js`: entrada web/PWA.
- `package.json`: scripts de build, Supabase e APK.
- `supabase/migrations/*.sql`: tabelas, RLS, triggers, RPCs e backfill.
- `supabase/functions/mercadopago-*`: funcoes Edge ja existentes para cobranca.
- `scripts/check-supabase-migrations.js` e `scripts/test-supabase-rest.js`: validacoes existentes.

Tabelas/migrations ja encontradas:

- `public.erp_profiles`
- `public.erp_backups`
- `public.clients`
- `public.profiles`
- `public.subscriptions`
- `public.plans`
- `public.payments`
- logs/auditoria em migrations existentes

Nao foram encontradas tabelas dedicadas para:

- `companies`
- `company_members`
- `sync_settings`

Fluxo atual de auth/cadastro:

- Cadastro usa `/auth/v1/signup`.
- Metadados enviados hoje: nome, empresa, telefone e aceite.
- Se o Supabase retorna sessao, o app chama `register_saas_client`.
- Se o Supabase exige confirmacao de e-mail e nao retorna sessao, o app marca pendente e depende do trigger `handle_new_saas_auth_user`.
- Apos login, o app chama `sync_saas_user_after_login` e depois verifica RLS em `erp_profiles`, `profiles` e `get_saas_license`.

Fluxo atual de sessao:

- `usuarioAtualEmail` e `adminLogado` usam `sessionStorage`.
- Tokens Supabase sensiveis sao guardados em `sessionStorage`.
- O cache em `localStorage` guarda apenas e-mail/user_id/expiracao, sem refresh token.
- Isso melhora seguranca, mas impede persistencia real apos fechar navegador/app se a sessao sensivel sumir.

Fluxo atual do superadmin:

- `renderClientesSaas()` lista clientes locais mesclados com clientes remotos.
- `carregarSaasSupabaseSilencioso()` busca `clients`, `subscriptions`, `payments`, `plans`, `profiles` e `erp_profiles`.
- A listagem remota exige `syncConfig.supabaseAccessToken`; quando nao existe, mostra pedido para entrar com conta Supabase.
- Busca chama `renderApp()` a cada digito, o que pode fechar teclado no mobile e resetar scroll.
- Bloquear, desbloquear, alterar plano, anonimizar e excluir atuam principalmente no estado local.

Fluxo atual de backup/sincronizacao:

- Tela atual mostra URL de nuvem, token, URL/chave Supabase, email/senha Supabase e Google Drive.
- Supabase usa `erp_backups` com `user_id`.
- Exportacao local existe, mas o nome atual e `backup-erp-3d.json`.
- Google Drive ainda aparece na interface mesmo estando incompleto para uso final simples.

Fluxo atual de permissoes/tenant:

- Existem papeis antigos em `profiles` e `erp_profiles`: `superadmin`, `admin`, `operador`, `visualizador` e similares.
- Nao existe modelo formal de empresa/conta com `companies` e `company_members`.
- Cliente comum hoje tende a virar `admin` do cliente, mas isso nao equivale ao novo papel "dono da conta".

Onboarding:

- Nao foi encontrado fluxo persistente com `onboarding_completed`, `onboarding_step` ou `setup_completed`.

Otimizacao de contexto:

- Assistente local ja limita mensagens para os ultimos 20 itens.
- Superadmin ainda usa `limit=1000` nas consultas remotas; deve passar para paginacao/filtro com limite menor.

## Arquivos previstos para alteracao nas proximas etapas

- `app.js`
- `style.css`
- `supabase/migrations/*.sql`
- possivel nova Edge Function/RPC administrativa em `supabase/functions/*`
- `docs/PROGRESSO_CODEX.md`
- `docs/BUGS.md`
- `docs/TESTES.md`

## Proxima etapa

Etapa 2: corrigir auth e criacao automatica, preservando o que ja funciona:

- criar/garantir `companies` e `company_members`;
- vincular usuario novo como dono da propria empresa;
- completar `clients`, `profiles`, `erp_profiles`, `subscriptions` sem duplicar;
- manter superadmin separado;
- preparar migracao idempotente e testavel.

## Etapa 2 - Auth e criacao automatica

Concluido localmente:

- Criada migration `supabase/migrations/20260504111204_account_companies_members_sync.sql`.
- Adicionadas tabelas `companies`, `company_members` e `sync_settings`.
- Adicionados vinculos `company_id` em `clients`, `profiles`, `erp_profiles` e `subscriptions`.
- Atualizado o trigger `handle_new_saas_auth_user` para criar empresa, membro dono, perfil, cliente, assinatura e configuracao de sync.
- Atualizada a RPC `sync_saas_user_after_login` para completar registros faltantes e retornar `company_id`.
- Incluido backfill idempotente para clientes/usuarios existentes.
- Mantido o papel global `superadmin` separado do papel `owner` da empresa.
- Frontend passou a enviar `owner_name` e `company_name` no signup.
- Frontend passou a guardar `companyId` separado de `clientId`.
- Teste local de migrations foi ampliado para cobrir `companies`, `company_members` e `sync_settings`.

Arquivos alterados nesta etapa:

- `app.js`
- `scripts/check-supabase-migrations.js`
- `supabase/migrations/20260504111204_account_companies_members_sync.sql`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`

Validado localmente:

- `node --check app.js`
- `npm run build:web`
- `npm run supabase:test:migrations`
- varredura frontend por segredos Supabase sensiveis
- `git diff --check`
- `npm run supabase:test:migrations`
- `npm run build:web`

Ainda nao validado nesta etapa:

- Aplicacao da migration em Supabase staging/remoto.
- Criacao real de usuario em `auth.users`.
- Teste real de RLS com usuario comum, dono e superadmin.
- Listagem do superadmin apos aplicar a migration no banco.

## Etapa 3 - Sessao persistente

Concluido localmente:

- Cache local de sessao passou a guardar `supabaseRefreshToken`, mas continua sem persistir `supabaseAccessToken`.
- Ao abrir o app, `restaurarCacheSessaoLocal()` tenta renovar a sessao Supabase com refresh token antes de restaurar o usuario.
- Se o refresh falhar, o app mostra "Sua sessao expirou. Faca login novamente.".
- Login nao e mais encerrado automaticamente por inatividade; a sessao fica ate logout manual.
- `companyId` tambem e preservado no `billingConfig` ao concluir login.
- Nenhuma chave `service_role` foi encontrada no frontend.

Arquivos alterados nesta etapa:

- `app.js`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`

Validado localmente:

- `node --check app.js`
- `npm run build:web`
- busca local por `service_role`, `supabase_service`, `SERVICE_ROLE` e `sb_secret` em frontend.

Ainda nao validado nesta etapa:

- Fechar/reabrir navegador real com usuario Supabase autenticado.
- Fechar/reabrir APK/PWA com refresh token salvo.
- Refresh token expirado/revogado contra Supabase real.

## Etapa 5 - Superadmin estabilidade

Concluido localmente:

- Busca de clientes no superadmin deixou de chamar `renderApp()` a cada tecla.
- Filtros de nome/e-mail/plano/status agora aplicam direto nas linhas renderizadas, com debounce de 300ms.
- A lista permanece renderizada durante a pesquisa, reduzindo perda de foco/teclado no mobile.
- Ações sensiveis ganharam confirmacao modal:
  - bloquear cliente;
  - desbloquear cliente;
  - alterar plano;
  - anonimizar cliente;
  - excluir cliente local/de teste;
  - marcar inativos.
- Alterar plano usa dropdown com os planos permitidos.
- Bloquear/desbloquear tenta salvar no Supabase via RLS com JWT do superadmin, sem `service_role` no frontend.
- Alterar plano tenta atualizar `clients` e `subscriptions` no Supabase via RLS com JWT do superadmin.
- Quando nao ha sessao Supabase de superadmin, a alteracao fica local e o app mostra aviso claro.
- Feedback visual incluido: "Salvando...", sucesso, erro e aviso de sessao remota ausente.

Arquivos alterados nesta etapa:

- `app.js`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`
- `docs/BUGS.md`

Validado localmente:

- `node --check app.js`
- `npm run build:web`
- `npm run supabase:test:migrations`
- busca local por segredos no frontend.

Ainda nao validado nesta etapa:

- Teste visual no navegador/mobile real.
- PATCH remoto real em `clients`, `profiles`, `erp_profiles` e `subscriptions`.
- Exclusao real de usuario no Supabase Auth. Isso ainda precisa de Edge Function/RPC backend com `service_role` fora do frontend.

## Etapa 7 - Backup e sincronizacao simplificados

Concluido localmente:

- Tela `Backup` virou `Dados e Backup`, com e-mail da conta, status, ultima sincronizacao e dispositivo.
- Removidos da experiencia do cliente os campos tecnicos de URL, token, URL/chave Supabase, senha Supabase, destino automatico e Google Drive.
- Google Drive ficou mantido no codigo antigo, mas desativado por `ENABLE_GOOGLE_DRIVE_BACKUP = false`.
- Sincronizacao automatica agora assume Supabase como destino padrao.
- Usuarios antigos com `autoBackupTarget = "drive"` sao migrados em memoria para `supabase`.
- Exportacao local passou a usar nome `backup-simplifica3d-EMAIL-DATA.json`.
- Backup enviado ao Supabase e exportacao local passam a usar snapshot com escopo da conta atual quando o usuario nao e superadmin.
- Sincronizacao manual mostra estado `Salvando...`, `Sincronizado`, `Offline` ou `Erro ao sincronizar`.
- A engrenagem `Config` continua mostrando Seguranca e Atualizacoes, sem recolocar configuracao tecnica de backup.

Arquivos alterados nesta etapa:

- `app.js`
- `docs/PROGRESSO_CODEX.md`
- `docs/BUGS.md`
- `docs/TESTES.md`

Validado localmente:

- `node --check app.js`

Ainda nao validado nesta etapa:

- Sincronizacao real contra Supabase staging/remoto.
- Exportacao/importacao visual em navegador e APK.
- Estado offline/online em navegador real.

## Etapa 8 - Onboarding inicial

Concluido localmente:

- Criada migration `supabase/migrations/20260504120234_onboarding_initial_flow.sql`.
- Migration garante campos `onboarding_completed` e `onboarding_step` em `profiles` e `erp_profiles`.
- Migration garante `setup_completed`, `print_type` e `default_material` em `companies`.
- Usuario criado localmente pelo cadastro passa a ser `dono` da conta, nao superadmin.
- Roles remotas `owner`, `attendant`, `production`, `finance` e `read_only` sao mapeadas para perfis locais equivalentes.
- Onboarding com 5 etapas:
  - boas-vindas;
  - tipo de impressao;
  - material padrao;
  - primeiro pedido;
  - finalizacao.
- Onboarding aparece somente para `dono` da conta que ainda nao concluiu.
- Superadmin nao recebe onboarding.
- Progresso e conclusao sao salvos localmente e tentam sincronizar em `profiles`, `erp_profiles` e `companies`.
- Botao `Refazer introducao` adicionado na tela de configuracoes.
- Ao iniciar primeiro pedido pelo onboarding, o fluxo abre `Novo pedido`; ao salvar o pedido, a introducao e concluida.

Arquivos alterados nesta etapa:

- `app.js`
- `style.css`
- `scripts/check-supabase-migrations.js`
- `supabase/migrations/20260504120234_onboarding_initial_flow.sql`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`
- `docs/BUGS.md`

Validado localmente ate agora:

- `node --check app.js`
- `npm run build:web`
- `npm run supabase:test:migrations`
- varredura frontend por segredos Supabase sensiveis
- `git diff --check`
- `npm run supabase:test:migrations`
- varredura frontend por segredos Supabase sensiveis
- `git diff --check`

Ainda nao validado nesta etapa:

- Fluxo visual completo em navegador/mobile/APK.
- Sincronizacao real dos campos de onboarding no Supabase staging/remoto.

## Etapa 9 - Otimizacao de contexto e listas

Concluido localmente:

- Adicionados limites centrais:
  - `ASSISTANT_MAX_MESSAGES = 20`;
  - `ASSISTANT_MAX_CONTEXT_RESULTS = 10`;
  - `LIST_PAGE_SIZE = 50`;
  - `SUPERADMIN_PAGE_SIZE = 50`.
- Assistente local agora monta contexto enxuto com tela atual, plano, pedido atual e ate 10 materiais baixos.
- Assistente limita mensagens recentes a 20 e registra estimativa local de tokens no console.
- Adicionado botao de limpar conversa do assistente.
- Superadmin renderiza clientes em paginas de 50.
- Busca do superadmin atualiza apenas o container de resultados, preservando foco/teclado dos inputs.
- Carga remota do superadmin usa `limit=50` em clientes, assinaturas, pagamentos e perfis.
- Lista de pedidos mostra 50 por vez com botao `Carregar mais`.

Arquivos alterados nesta etapa:

- `app.js`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`

Validado localmente ate agora:

- `node --check app.js`
- `npm run build:web`

Ainda nao validado nesta etapa:

- Teste visual de busca no superadmin em mobile.
- Teste com mais de 50 clientes/pedidos reais.
- Teste do assistente em navegador real.

## Etapa 10 - Validacao tecnica e staging

Concluido localmente:

- Criado `.env.test` local com placeholders para Supabase de teste/staging.
- `.gitignore` atualizado para ignorar `.env` e `.env.*`, preservando exemplos versionaveis.
- Dependencias conferidas com `npm install`.
- Scripts disponiveis conferidos em `package.json`.
- Nao existem scripts `lint`, `typecheck` ou `test` neste projeto neste momento.
- Supabase CLI validado em `2.98.0`.
- Ajuda do CLI consultada antes dos comandos remotos:
  - `npx.cmd supabase migration list --help`;
  - `npx.cmd supabase db push --help`;
  - `npx.cmd supabase db lint --help`;
  - `npx.cmd supabase status --help`.

Validacoes executadas:

- `node --check app.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- Varredura frontend por `service_role`, `supabase_service`, `SERVICE_ROLE` e `sb_secret` - OK.
- `git diff --check` - OK, com avisos esperados de LF/CRLF no Windows.

Supabase remoto:

- `npx.cmd supabase migration list --linked` executou e mostrou que o remoto ainda nao recebeu:
  - `20260504111204_account_companies_members_sync.sql`;
  - `20260504120234_onboarding_initial_flow.sql`.
- `npx.cmd supabase db lint --linked` executou e retornou somente avisos antigos:
  - `register_saas_client`: variavel/parametro de trial nao usados;
  - `redeem_promotional_token`: parametro `p_codigo` nao usado.
- `npx.cmd supabase db push --dry-run --linked` ficou em timeout na primeira tentativa.
- A segunda tentativa com `--debug` falhou por `ECIRCUITBREAKER` no pooler remoto, com mensagem para configurar `SUPABASE_DB_PASSWORD`.
- Nova tentativa posterior de `npx.cmd supabase db push --dry-run --linked` passou e confirmou que seriam enviadas somente:
  - `20260504111204_account_companies_members_sync.sql`;
  - `20260504120234_onboarding_initial_flow.sql`.
- `npx.cmd supabase status` falhou porque o Docker local nao esta acessivel/rodando; isso afeta apenas o stack local.
- Docker/Docker Desktop nao foi encontrado neste computador, entao nao foi possivel subir Supabase local.

Ainda nao validado completamente:

- Supabase local/staging real, porque `.env.test` ainda esta sem credenciais de teste.
- Criacao real de usuarios ficticios em ambiente separado.
- Fluxo visual completo em navegador desktop, mobile/PWA e APK.
- Acoes administrativas reais em banco remoto, porque as migrations novas ainda nao foram aplicadas.

Decisao tecnica:

- Nao foi aplicado `db push` real.
- Nao foi feito merge para branch principal.
- Nao foi gerado APK final nesta etapa, pois ainda faltam validacoes reais de staging.

Ultima bateria executada:

- `node --check app.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- `npx.cmd supabase db push --dry-run --linked` - OK.
- `npx.cmd supabase db lint --linked` - OK com avisos nao bloqueantes.
- Varredura frontend por segredos sensiveis - OK.
- `git diff --check` - OK.

Smoke test web local:

- Servidor estatico temporario aberto em `http://127.0.0.1:5180/`.
- Tela inicial carregou sem tela branca.
- Console do navegador sem erros/warnings no carregamento inicial.
- Tela `Sobre` abriu e mostrou logo, versao e informacoes do app.
- Tela `Planos` abriu sem erro de console.
- Tela `Dados e Backup` bloqueou visitante com mensagem de acesso negado, como esperado para usuario sem login.
- `Calculadora 3D` abriu, aceitou valores e calculou orçamento:
  - material: `R$ 15,00`;
  - energia: `R$ 0,20`;
  - custo total: `R$ 17,20`;
  - venda sugerida: `R$ 34,41`.

Nao validado no smoke test web:

- Cadastro real, para nao criar usuario no Supabase remoto/producao.
- Login real, pois ainda falta Supabase de staging/teste.
- Onboarding autenticado.
- Superadmin autenticado.

## Etapa - Telemetria de erros e feedback

Backup de arquivos criado:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-telemetry-files-20260504-142607`

Implementado:

- Migration `supabase/migrations/20260504172615_app_telemetry_feedback.sql`.
- Tabelas novas:
  - `app_error_logs`;
  - `app_error_log_users`;
  - `app_feedback_reports`.
- RPC publica `register_app_error`, chamando implementacao privilegiada em schema `private`.
- Deduplicacao por `error_key`, `screen_name`, `action_name`, `app_version` e janela de 6 horas.
- Contagem de ocorrencias e usuarios afetados.
- Severidade automatica: `critical`, `high`, `medium`, `low`.
- RLS para impedir usuarios comuns de lerem logs globais.
- Servico web `src/services/errorTelemetry.js`.
- Throttle local de 30s por erro/usuario.
- Fila offline simples em `localStorage`.
- Sanitizacao de `senha`, `password`, `token`, `authorization`, `apikey`, `secret`, `card` e similares.
- Integracao com `ErrorService`, reaproveitando `registrarDiagnostico`.
- Logs nos fluxos principais:
  - login;
  - cadastro;
  - carregamento de perfil;
  - RLS;
  - clientes superadmin;
  - pedidos abrir/salvar/atualizar/excluir;
  - calculadora;
  - sync Supabase;
  - assinatura/pagamento.
- Tela `Feedback` complementada com formulario estruturado.
- Superadmin recebeu abas:
  - `Relatorios automaticos`;
  - `Sugestoes e Feedback`.
- `index.html` carrega o servico de telemetria.
- `scripts/prepare-web.js` copia `src/` para `dist/`.
- `scripts/check-supabase-migrations.js` valida a estrutura nova.

Observacao:

- A migration ainda nao foi aplicada no Supabase remoto.
- `db push --dry-run --linked` falhou por autenticacao/pooler (`password authentication failed` e depois `ECIRCUITBREAKER`).
- Testes reais de RPC/tabelas dependem de aplicar a migration em staging/remoto.
- `npm run android:apk` sincronizou os assets Android, mas nao gerou APK porque `JAVA_HOME` nao esta configurado neste ambiente.
