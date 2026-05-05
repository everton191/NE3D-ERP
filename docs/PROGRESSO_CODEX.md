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

Ativacao remota em 2026-05-04:

- Projeto Supabase linkado: `everton191's Project` (`qsufnnivlgdidmjuaprb`, `us-west-2`).
- Migrations aplicadas no remoto:
  - `20260504111204_account_companies_members_sync.sql`;
  - `20260504120234_onboarding_initial_flow.sql`;
  - `20260504172615_app_telemetry_feedback.sql`;
  - `20260504180540_fix_telemetry_severity_volatility.sql`.
- Backfill remoto reportado pela migration:
  - `auth.users=8`;
  - `clients=8`;
  - `companies=8`;
  - `company_members=8`;
  - `profiles=8`;
  - `erp_profiles=8`;
  - `subscriptions=8`;
  - `sync_settings=8`.
- Teste real da RPC `register_app_error` passou:
  - 4 envios do mesmo erro agregaram em um unico `app_error_logs`;
  - `occurrence_count=4`;
  - `affected_user_count=2`;
  - `severity=medium`.
- Feedback manual via REST passou com `HTTP 201`.
- Leitura anonima de logs globais retornou `0` linhas, preservando RLS.
- Ajustado o envio de feedback para `Prefer: return=minimal`, evitando erro RLS ao tentar retornar linha sem policy de SELECT anonima.
- Novo script repetivel: `npm run supabase:test:telemetry`.
- `npx.cmd supabase db lint --linked` nao aponta mais aviso novo da telemetria; restam avisos antigos nao bloqueantes em `register_saas_client` e `redeem_promotional_token`.

Pendencia observada:

- Uma tentativa posterior de `db push --dry-run --linked` falhou por `ECIRCUITBREAKER` no pooler. Como as migrations ja estavam aplicadas e os testes REST/RPC passaram, a falha foi classificada como conexao temporaria do pooler, nao erro de schema.
- Superadmin autenticado ainda precisa validacao visual com login manual/credencial autorizada na sessao.
- APK ficou para depois, conforme orientacao atual.

## Etapa - AdMob preparado com IDs de teste

Backup de arquivos criado:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-admob-files-20260504-152115`

Implementado:

- Servico `src/services/adMobService.js`.
- Servico `src/services/monetizationLimits.js`.
- AdMob real desligado por `ADS_PRODUCTION_ENABLED = false`.
- IDs reais mantidos como placeholders:
  - `COLOCAR_APP_ID_REAL_DEPOIS`;
  - `COLOCAR_REWARDED_ID_REAL_DEPOIS`;
  - `COLOCAR_INTERSTITIAL_ID_REAL_DEPOIS`.
- IDs de teste configurados:
  - rewarded `ca-app-pub-3940256099942544/5224354917`;
  - interstitial `ca-app-pub-3940256099942544/1033173712`;
  - Android app id de teste `ca-app-pub-3940256099942544~3347511713`.
- Sem banner fixo.
- Sem anuncio na abertura.
- Interstitial preparado, mas bloqueado enquanto `ADS_PRODUCTION_ENABLED` for `false`.
- Regras de interstitial:
  - 20 minutos;
  - 2 acoes completas;
  - 50% de chance;
  - bloqueio em contexto critico.
- Recompensado opcional com modal antes de tentar carregar.
- Limites free:
  - 5 pedidos ativos;
  - 1 PDF diario;
  - desbloqueio por anuncio por 30 minutos.
- Usuarios premium/assinantes usam `canUsePremiumFeatures()` e nao entram em fluxo de anuncios.
- Plugin Android instalado: `@capacitor-community/admob@8.0.0`.
- Google Mobile Ads Android SDK definido em `android/variables.gradle`: `playServicesAdsVersion = '25.2.0'`.
- APK gerado:
  - `downloads/NE3D-ERP.apk`;
  - `downloads/update.json`;
  - versao `2026.05.04-admob-test`;
  - versionCode `31`.

Observacao:

- Foi usado `JAVA_HOME` temporario apontando para `C:\Users\PAESS\.jdks\temurin-24.0.2` apenas durante o build.

## Etapa - Politica, termos e planos sem credenciais

Backup de arquivos criado:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-legal-planos-20260504-195821`

Implementado:

- Politica de Privacidade atualizada para o texto vigente do Simplifica 3D, incluindo coleta, uso, anuncios Google AdMob, compartilhamento, seguranca, direitos LGPD, retencao e contato.
- Termos de Uso atualizados com responsabilidade de uso, limitacao de responsabilidade, conta do usuario, plano pago, anuncios, suspensao e contato.
- Guia de planos deixou de exibir campos de e-mail e senha.
- Acoes de conta na guia de planos agora direcionam para a area de login/cadastro existente.
- Inicio do teste gratis agora exige conta autenticada ou e-mail ja associado, sem pedir credencial dentro da guia de planos.
- Versao atualizada para `2026.05.04-legal-ads`.
- APK gerado:
  - `downloads/NE3D-ERP.apk`;
  - `downloads/update.json`;
  - versao `2026.05.04-legal-ads`;
  - versionCode `32`.

## Etapa - Superadmin busca e usuários de teste

Backup de arquivos criado:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-superadmin-busca-teste-20260504-202055`

Implementado:

- Resultado de busca de clientes SaaS agora é selecionável pela linha inteira.
- Adicionado suporte a `click`, `pointerdown`, `touchstart` e teclado (`Enter`/espaço) para abrir edição do cliente.
- Ao tocar no resultado no mobile, o campo ativo perde foco para fechar o teclado antes de abrir a edição.
- Linha selecionada fica destacada visualmente.
- Adicionada flag local/remota `is_test_user`.
- Superadmin pode marcar/desmarcar cliente como “Usuário de teste”.
- Clientes marcados recebem badge “Teste”.
- Ação “Excluir usuário de teste” aparece apenas quando `is_test_user = true`.
- Exclusão exige digitar `EXCLUIR TESTE`.
- Usuários reais deixam de ter exclusão direta; fluxo mantém exportação/anonimização.
- Anonimização passa a marcar o cliente como `anonymized` e remover dados pessoais.

Migration criada:

- `supabase/migrations/20260504232433_superadmin_test_user_cleanup.sql`

Essa migration adiciona:

- `clients.is_test_user`;
- `clients.anonymized_at`;
- `profiles.is_test_user`;
- `erp_profiles.is_test_user`;
- status `anonymized` em `clients`;
- tabela `deleted_test_user_audit`;
- RPC pública `delete_test_user_client`;
- implementação privada `private.delete_test_user_client_impl`.

Observação:

- A migration ainda não foi aplicada no Supabase remoto. `supabase migration list --linked` mostra a migration local pendente e o `db push --dry-run --linked` ficou em timeout/pooler.

## Etapa - Planos, anúncios, roles e sugestões

Data: 2026-05-05

Backup de arquivos criado antes das alterações:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-planos-ads-sugestoes-20260505-095211`

Etapa 3 concluída - Migration local:

- Criada migration `supabase/migrations/20260505125834_plans_ads_roles_suggestions.sql`.
- Adicionados campos definitivos de plano: `active_plan`, `pending_plan`, `payment_status`, `subscription_status`, `plan_expires_at`, `plan_price`, `price_locked`.
- Adicionados campos de trial: `trial_started_at`, `trial_expires_at`, `is_trial_active`.
- Adicionado controle de anúncios: `last_ad_shown_at`.
- Criada tabela `app_suggestions` para sugestões, bugs e features.
- Criada tabela `superadmins` para superadmin por `user_id`.
- Criado preço progressivo: R$19,90 até 100 clientes, R$24,90 de 101 a 200, R$29,90 acima de 200.
- Adicionado trigger de pagamentos: `pending` só avisa, `approved` ativa, `rejected/cancelled` limpa pendência.
- Adicionada limpeza automática de `pending` com mais de 24h.
- Backfill corrige `pending` travado, trials expirados e admins indevidos.

Etapa 4 concluída - App:

- `activePlan` passou a ser a referência única para liberar acesso.
- `pendingPlan/paymentStatus=pending` não ativa plano, não bloqueia usuário e não muda anúncios.
- Novas contas locais entram como `user` com trial de 7 dias.
- Papel `owner/dono` foi neutralizado para `user`; `admin` só é criado sob demanda.
- Superadmin local por e-mail foi desativado no frontend; acesso global depende do banco por `user_id`.
- Criada função central `shouldShowAds(user)`.
- Anúncios ficam apenas no Free, com intervalo mínimo de 20 minutos e fora de login, pagamento, edição, digitação, modal e erro.
- Superadmin ao alterar plano grava `active_plan`, limpa `pending_plan` e trava `plan_price` quando pago.

Etapa 5 concluída - Sugestões:

- Adicionado botão rápido “Quero emissão de NF-e”.
- Adicionado envio “Sugerir melhoria”.
- Sugestões são salvas localmente e enviadas para `app_suggestions` quando Supabase estiver disponível.
- Superadmin lista sugestões, filtra por status/categoria e destaca quantidade de pedidos de NF-e.

Arquivos alterados nesta etapa:

- `app.js`
- `src/services/adMobService.js`
- `src/services/monetizationLimits.js`
- `scripts/test-monetization.js`
- `scripts/check-supabase-migrations.js`
- `supabase/migrations/20260505125834_plans_ads_roles_suggestions.sql`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`

Validado localmente até aqui:

- `node --check app.js`
- `node --check src\services\adMobService.js`
- `node --check src\services\monetizationLimits.js`
- `node --check scripts\test-monetization.js`
- `npm run test:monetization`
- `npm run supabase:test:migrations`
- `npm run build:web`
- `npm run supabase:test:rest`
- `npm run supabase:test:telemetry`
- `git diff --check` sem erros, apenas avisos LF/CRLF do Windows.
- `npx.cmd supabase migration list --linked`

Ainda não executado nesta etapa:

- Aplicar migrations no Supabase remoto.
- Validar fluxo real com superadmin logado.
- Gerar APK atualizado.

Bloqueio remoto:

- `npx.cmd supabase db push --dry-run --linked` falhou antes de aplicar qualquer SQL.
- Erro retornado: senha do banco inválida em `SUPABASE_DB_PASSWORD` para o usuário temporário `cli_login_postgres`.
- O pooler entrou em bloqueio temporário por muitas falhas de autenticação (`ECIRCUITBREAKER`).
- Migrations pendentes no remoto:
  - `20260504232433_superadmin_test_user_cleanup`
  - `20260505125834_plans_ads_roles_suggestions`

## Etapa - Hotfix Superadmin e 2FA WhatsApp

Data: 2026-05-05

Backup criado antes das alterações:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-hotfix-superadmin-auth-20260505-145723`

Etapa 1 concluída - Login e permissão:

- Auditado fluxo de login por e-mail/senha, hidratação de perfil Supabase, role e redirecionamento.
- Superadmin agora é redirecionado diretamente para `superadmin` após login válido.
- Usuário comum/admin sai da tela de login e volta para `dashboard`.
- Login Supabase não cria mais usuário local com fallback `operador`; o padrão fica `user`.
- Fallback OAuth também não cria `admin`; usa `user`.
- Checagem de superadmin consulta a RPC `erp_is_superadmin()` e, se necessário, os perfis do próprio `user_id` em `erp_profiles` e `profiles`.

Etapa 2 concluída - 2FA WhatsApp:

- Confirmado que não existe Edge Function/backend de 2FA WhatsApp no projeto.
- Funções existentes do Supabase são apenas Mercado Pago.
- 2FA WhatsApp foi desativado temporariamente com `WHATSAPP_2FA_BACKEND_ENABLED = false`.
- `precisa2FA()` não bloqueia login quando não houver backend real.
- `abrirWhats2FA()` não abre `wa.me` para autenticação sem backend.
- Configuração pública não reativa 2FA enquanto o backend real não existir.
- Aviso interno registrado: `2FA WhatsApp desativado temporariamente`.

Etapa 3 concluída - Telefone:

- Criada função única `normalizePhoneBR(phone)`.
- Telefones aceitos: `85999999999`, `5585999999999`, `+5585999999999`, `(85) 99999-9999`.
- Normalização de cadastro/configuração/perfis para E.164 (`+55DDDNÚMERO`).
- Links WhatsApp continuam usando número sem `+`.

Etapa 4 concluída - Verificação remota e testes:

- Banco remoto consultado via Supabase linkado.
- `paessilvae@gmail.com` possui `auth.users` confirmado, `erp_profiles.role = superadmin`, `erp_profiles.status = active`, cliente ativo e assinatura existente.
- RPC `erp_is_superadmin()` retornou `true` para o `user_id` do superadmin quando simulada com a claim JWT.
- Tabela `public.superadmins` ainda não existe no remoto porque a migration de planos/roles continua pendente; acesso atual depende de `erp_profiles.role = superadmin`.
- Nenhuma migration foi aplicada e nenhum APK foi gerado nesta etapa.

Arquivos alterados nesta etapa:

- `app.js`
- `package.json`
- `scripts/test-auth-hotfix.js`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`

Validado localmente:

- `node --check app.js`
- `node --check scripts\test-auth-hotfix.js`
- `npm run test:auth-hotfix`
- `npm run test:monetization`
- `npm run supabase:test:migrations`
- `npm run build:web`
- `npm run supabase:test:rest`
- `npm run supabase:test:telemetry`
- `git diff --check` sem erros, apenas avisos LF/CRLF do Windows.

## Etapa - Tela pública de autenticação

Data: 2026-05-05

Backup criado antes das alterações:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-auth-ui-20260505-152339`

Confirmado antes de alterar:

- `npm run test:auth-hotfix` passou.
- `npm run supabase:test:rest` passou.
- Consulta remota confirmou `paessilvae@gmail.com` com e-mail confirmado, `erp_profiles.role = superadmin` e `erp_profiles.status = active`.

Implementado:

- Tela pública centralizada com marca Simplifica 3D e frase “Organize seus pedidos sem complicação”.
- Fluxos separados por abas: `Entrar` e `Criar conta`.
- Aba Entrar padrão com e-mail, senha, botão de mostrar/ocultar, “Manter-me conectado”, recuperar senha e link discreto de planos.
- Aba Criar conta com nome, e-mail, senha, confirmação, negócio, telefone opcional e aceite legal obrigatório.
- Removidos do DOM público: Google, acesso/manutenção local, senha salva/digital e botões duplicados/sem função.
- Assistente e calculadora flutuante agora só aparecem com usuário autenticado e fora de telas públicas.
- Intro de abertura não cobre mais a tela deslogada.
- Adicionado teste `scripts/test-auth-ui.js`.

Arquivos alterados nesta etapa:

- `app.js`
- `style.css`
- `package.json`
- `scripts/test-auth-ui.js`
- `docs/PROGRESSO_CODEX.md`
- `docs/TESTES.md`

Validado:

- `node --check app.js`
- `node --check scripts\test-auth-ui.js`
- `npm run test:auth-ui`
- `npm run test:auth-hotfix`
- `npm run test:monetization`
- `npm run build:web`
- Verificação DOM com Edge headless: sem `Acesso local`, Google, senha salva/digital, assistente, calculadora flutuante ou intro na tela deslogada.
- Verificação visual por CDP mobile 390x844 nas abas Entrar e Criar conta.

## Etapa - Publicação site/APK e validação real

Data: 2026-05-05

Backup criado antes das alterações geradas/publicação:

- `C:\Users\PAESS\OneDrive\Desktop\erpNE3d-backup-prepublish-site-apk-20260505-195903`

Banco remoto:

- Aplicadas no Supabase remoto as migrations:
  - `20260504232433_superadmin_test_user_cleanup.sql`
  - `20260505125834_plans_ads_roles_suggestions.sql`
  - `20260505230205_restore_public_rest_grants.sql`
  - `20260505230616_split_anon_auth_rest_policies.sql`
- Criadas duas migrations de estabilização REST/RLS para corrigir `401` em `plans` e `clients` sem liberar dados de clientes para `anon`.
- `plans` agora permite leitura pública apenas de planos ativos.
- `clients` permite consulta anônima com RLS retornando zero linhas, mantendo dados protegidos.

Validação real com Superadmin:

- Login real com o superadmin informado entrou sem bloqueio de 2FA WhatsApp.
- Painel Superadmin abriu corretamente.
- Lista remota de clientes carregou.
- Filtro por e-mail funcionou após debounce.
- Clique na linha inteira do cliente abriu o modal de edição.
- Ação `Alterar plano` abriu o fluxo e foi cancelada sem alterar dados.
- Aba `Sugestões e Feedback` carregou contadores, pedidos NF-e e feedbacks.
- Logout com segurança voltou para a tela pública e ocultou assistente/calculadora flutuante.

Versão:

- `APP_VERSION`: `2026.05.05-superadmin-auth-plans`
- Android `versionCode`: `33`
- Android `versionName`: `2026.05.05-superadmin-auth-plans`
