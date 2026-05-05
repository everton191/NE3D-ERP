# Plano de testes - Auth, Superadmin e Sincronizacao

Data: 2026-05-04
Branch: `fix/stability-auth-superadmin-onboarding`

## Estado atual

Etapa 1 foi somente diagnostico e documentacao. Na Etapa 2 foram executadas validacoes locais de sintaxe, build e migrations. Producao nao foi alterada.

Comandos executados na preparacao/diagnostico:

- `git status -sb`
- `git branch --show-current`
- backup completo via PowerShell
- retencao dos 2 ultimos backups
- `Get-ChildItem` para mapear arquivos
- `Select-String` para mapear auth, superadmin, sync e migrations
- `node --check app.js`
- `npm run supabase:test:migrations`
- `npm run build:web`

Observacao: `rg` falhou com "Acesso negado" nesta instalacao do Windows, entao o diagnostico usou fallback PowerShell.

## Resultados locais da Etapa 2

Passaram:

- `node --check app.js`
- `npm run supabase:test:migrations`
- `npm run build:web`
- busca de segredos no frontend (`service_role`, `supabase_service`, `SERVICE_ROLE`, `sb_secret`)
- validacao local da Etapa 5 apos ajustes de superadmin

Cobertura nova do teste de migrations:

- RLS de `companies`
- RLS de `company_members`
- RLS de `sync_settings`
- trigger de signup criando membro dono
- RPC pos-login retornando `company_id`
- tabela `sync_settings`

Nao executado ainda:

- `npm run supabase:test:rest`
- `supabase migration list`
- `supabase db push --dry-run`
- `supabase db lint`
- teste real de cadastro/login contra Supabase staging/remoto
- teste real de fechar/reabrir navegador e APK mantendo login
- teste visual de busca no superadmin em mobile sem fechar teclado
- teste real de bloquear/desbloquear/alterar plano salvando no Supabase remoto

## Ambiente de teste necessario

Antes de validar as correcoes:

- criar `.env.test` com dados de Supabase de teste/staging;
- confirmar que nenhuma chave `service_role` entra em arquivo frontend;
- rodar Supabase local/staging antes de mexer em dados reais;
- criar usuarios ficticios.

Usuarios ficticios:

- superadmin teste;
- dono de empresa teste;
- funcionario teste;
- cliente bloqueado teste;
- cliente trial teste;
- usuario de teste para exclusao.

## Testes obrigatorios por etapa

Auth/cadastro:

- Criar conta nova pelo app/site.
- Confirmar usuario em `auth.users`.
- Confirmar `clients`.
- Confirmar `profiles`.
- Confirmar `erp_profiles`.
- Confirmar `subscriptions`.
- Confirmar empresa em `companies` quando a migration nova existir.
- Confirmar vinculo de dono em `company_members` quando a migration nova existir.
- Confirmar que registros existentes nao duplicam.

Sessao:

- Fazer login.
- Atualizar pagina.
- Fechar e abrir navegador/PWA/APK.
- Confirmar que permanece logado.
- Fazer logout.
- Confirmar que so sai quando clica em logout.
- Confirmar que superadmin tambem permanece logado.

Superadmin:

- Listar clientes sem cadastro manual no Supabase.
- Distinguir falta de token, erro de rede, erro RLS e lista vazia real.
- Pesquisar cliente sem perder foco.
- Testar pesquisa no mobile sem fechar teclado.
- Alterar plano/status com confirmacao.
- Bloquear cliente com confirmacao.
- Desbloquear cliente com confirmacao.
- Excluir/anonimizar usuario de teste com confirmacao.
- Preservar scroll, aba e filtro apos acao.

Seguranca:

- Cliente comum nao acessa superadmin.
- Dono da conta nao vira superadmin global.
- Funcionario nao acessa dados de outra empresa.
- Cliente bloqueado nao usa o sistema.
- Superadmin consegue executar acoes administrativas.
- Confirmar RLS para dados com `company_id`.

Backup/sincronizacao:

- Login carrega dados associados a `user_id`/e-mail.
- Alteracao importante dispara sincronizacao ou marca pendente.
- Botao "Sincronizar agora" funciona.
- Exportar backup gera JSON apenas do usuario/empresa atual.
- Nome do arquivo segue `backup-simplifica3d-email-data.json`.
- Offline mostra estado "Offline" e sincroniza depois.
- Google Drive nao aparece para usuario final enquanto desativado.

## Etapa 7 - Backup e sincronizacao simplificados

Executado localmente:

- `node --check app.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- varredura frontend por `service_role`, `supabase_service`, `SERVICE_ROLE`, `sb_secret` - OK.
- `git diff --check` - OK, apenas avisos esperados de LF/CRLF no Windows.
- `npm run supabase:test:migrations` - OK.
- varredura frontend por `service_role`, `supabase_service`, `SERVICE_ROLE`, `sb_secret` - OK.
- `git diff --check` - OK, apenas avisos esperados de LF/CRLF no Windows.

Verificacoes por codigo:

- `autoBackupTarget` padrao alterado para `supabase`.
- `ENABLE_GOOGLE_DRIVE_BACKUP = false` bloqueia as funcoes antigas de Drive.
- Tela `Backup` nao renderiza URL/token/chave/senha nem configuracao manual de Drive.
- Exportacao local usa `backup-simplifica3d-EMAIL-DATA.json`.
- `salvarBackupSupabase()` usa snapshot com escopo da conta atual.

Nao executado ainda:

- Teste real de upload/download do backup no Supabase staging/remoto.
- Teste visual do botao "Sincronizar agora" no navegador e APK.
- Teste offline/online real.
- Teste de importacao/exportacao com usuario comum e superadmin.

Onboarding:

- Conta nova abre onboarding.
- Concluir onboarding grava `onboarding_completed`.
- Fechar no meio volta para etapa correta.
- Pular vai para painel.
- Refazer introducao pelas configuracoes.
- Superadmin interno nao recebe onboarding.
- Funcionario criado pelo dono nao passa pelo onboarding da empresa.

## Etapa 8 - Onboarding inicial

Executado localmente:

- `node --check app.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- varredura frontend por `service_role`, `supabase_service`, `SERVICE_ROLE`, `sb_secret` - OK.
- `git diff --check` - OK, apenas avisos esperados de LF/CRLF no Windows.

Verificacoes por codigo:

- `profiles` e `erp_profiles` recebem `onboarding_completed` e `onboarding_step`.
- `companies` recebe `setup_completed`, `print_type` e `default_material`.
- Onboarding e bloqueado para superadmin.
- Onboarding e exibido apenas para usuario com papel `dono` e `onboardingCompleted=false`.
- Progresso local e salvo antes de mudar de etapa.
- Botao `Refazer introducao` reseta o progresso.

Nao executado ainda:

- Criar conta nova e percorrer onboarding no navegador.
- Fechar app no meio e voltar na etapa correta.
- Criar primeiro pedido pelo onboarding e confirmar conclusao automatica.
- Validar PATCH real em `profiles`, `erp_profiles` e `companies` no Supabase.

Validacao tecnica:

- `node --check app.js`
- `npm run build:web`
- `npm run supabase:test:migrations`
- `npm run supabase:test:rest`
- `npm run lint`, se existir
- `npm test`, se existir
- `supabase migration list`
- `supabase db push --dry-run`
- `supabase db lint`

## Etapa 9 - Otimizacao de contexto e listas

Executado localmente:

- `node --check app.js` - OK.
- `npm run build:web` - OK.

Verificacoes por codigo:

- Assistente limita mensagens a 20.
- Contexto do assistente nao carrega banco inteiro.
- Contexto do assistente limita resultados relevantes a 10.
- Superadmin renderiza pagina de 50 clientes.
- Supabase remoto usa `limit=50` para cargas administrativas principais.
- Pedidos renderizam 50 por vez.

Nao executado ainda:

- Teste visual no navegador/mobile.
- Teste com massa grande real de clientes e pedidos.
- Teste de teclado mobile na busca do superadmin apos paginação.

## Criterio de conclusao

So considerar pronto quando:

- usuario novo cria estrutura completa automaticamente;
- login persiste ate logout manual;
- superadmin lista clientes e salva acoes no Supabase;
- backup/sync nao pede configuracao tecnica ao cliente;
- RLS isola dados por empresa;
- nenhum `service_role` fica exposto no frontend;
- build e testes obrigatorios passam.

## Etapa 10 - Validacao tecnica executada

Preparacao:

- `.env.test` criado localmente com placeholders, sem credenciais reais.
- `.gitignore` passou a ignorar `.env` e `.env.*`.
- `npm install` executado: dependencias atualizadas, 0 vulnerabilidades.
- `npx.cmd supabase --version`: `2.98.0`.

Scripts do projeto:

- Existe `build:web`.
- Existem scripts Supabase de teste/validacao.
- Nao existem `lint`, `typecheck` ou `test` neste `package.json`.

Comandos que passaram:

- `node --check app.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- Varredura frontend por segredos Supabase sensiveis - OK.
- `git diff --check` - OK, apenas avisos LF/CRLF do Windows.

Detalhe do `npm run supabase:test:rest`:

- `plans` anonimo respondeu 200 com 3 linhas.
- `profiles` anonimo respondeu 200 com 0 linhas.
- `clients` anonimo respondeu 200 com 0 linhas.
- `get_saas_license` anonimo bloqueado com 401, esperado.
- `register_saas_client` anonimo bloqueado com 401, esperado.
- Configuracoes de Auth responderam 200.
- Senha invalida bloqueada com 400.
- Funcoes de pagamento/assinatura exigiram JWT com 401, esperado.

Supabase CLI remoto:

- `npx.cmd supabase migration list --linked` - OK.
- Migrations pendentes no remoto:
  - `20260504111204`;
  - `20260504120234`.
- `npx.cmd supabase db lint --linked` - OK, com avisos nao bloqueantes de parametros antigos nao usados.
- `npx.cmd supabase db push --dry-run --linked` - OK na ultima tentativa; confirmou somente as duas migrations pendentes.
- Tentativa anterior com `--debug` falhou por `ECIRCUITBREAKER` no pooler remoto.
- `npx.cmd supabase status` - falhou porque Docker local nao esta rodando/acessivel.
- Docker/Docker Desktop nao foi encontrado neste computador, entao Supabase local nao foi iniciado.

Testes ainda pendentes para considerar pronto:

- Preencher `.env.test` com um Supabase de staging.
- Criar usuarios ficticios em staging:
  - superadmin;
  - dono;
  - funcionario;
  - bloqueado;
  - trial.
- Aplicar migrations novas em staging.
- Validar cadastro real criando `auth.users`, `clients`, `profiles`, `erp_profiles`, `companies`, `company_members`, `subscriptions` e `sync_settings`.
- Validar login persistente fechando e abrindo navegador/PWA/APK.
- Validar superadmin com dados reais:
  - busca;
  - alteracao de plano;
  - bloqueio/desbloqueio;
  - confirmacoes;
  - feedback visual.
- Validar onboarding em navegador/mobile/APK.
- Validar backup/exportacao/sincronizacao por usuario.

Ultima bateria repetida:

- `node --check app.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- `npx.cmd supabase db push --dry-run --linked` - OK.
- `npx.cmd supabase db lint --linked` - OK com avisos nao bloqueantes.
- Varredura frontend por segredos Supabase sensiveis - OK.
- `git diff --check` - OK.

## Smoke test web local

Ambiente:

- Build testado a partir de `dist/`.
- Servidor local temporario: `http://127.0.0.1:5180/`.
- Navegador: in-app browser do Codex.

Passou:

- App carregou com titulo `Simplifica 3D`.
- Tela inicial/login renderizou sem erro de console.
- Validação nativa do cadastro impediu envio vazio.
- Tela `Sobre` abriu e mostrou identidade/versao.
- Tela `Planos` abriu sem erro de console.
- Tela `Dados e Backup` negou acesso para visitante, esperado sem login.
- Tela `Calculadora 3D` abriu.
- Calculo com peso `100g`, tempo `2h`, material `R$150/kg`, quantidade `1` retornou:
  - custo do material `R$ 15,00`;
  - custo de energia `R$ 0,20`;
  - custo total `R$ 17,20`;
  - preco sugerido `R$ 34,41`.

Nao executado neste smoke:

- Criacao de conta real.
- Login real.
- Persistencia de sessao autenticada.
- Onboarding autenticado.
- Superadmin autenticado.
- Teste APK/mobile real.

## Telemetria e feedback

Comandos executados:

- `node --check app.js` - OK.
- `node --check src\services\errorTelemetry.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK, incluindo checks de telemetria.
- `npm run supabase:test:rest` - OK nos testes existentes.
- Varredura frontend por `service_role`, `supabase_service`, `SERVICE_ROLE`, `sb_secret` - OK.
- `git diff --check` - OK, com avisos LF/CRLF do Windows.

Teste automatizado local do servico:

- Sanitizacao removeu `password` e `token`.
- Throttle impediu envio duplicado do mesmo erro em 30s.
- Fila offline salvou 1 erro quando `navigator.onLine=false`.
- `flushPendingErrorLogs()` enviou a fila quando voltou online.

Smoke web:

- App carregou em `http://127.0.0.1:5180/` sem erro de console.
- Calculadora continuou funcionando apos a telemetria.

Supabase remoto:

- `npx.cmd supabase db lint --linked` - OK com avisos antigos nao bloqueantes.
- `npx.cmd supabase db push --dry-run --linked` - falhou nesta rodada por `password authentication failed` e `ECIRCUITBREAKER` no pooler.

APK:

- `npm run android:apk` executou `android:sync` com sucesso.
- O arquivo `src/services/errorTelemetry.js` foi copiado para `android/app/src/main/assets/public/src/services/errorTelemetry.js`.
- A etapa `gradlew.bat assembleDebug` falhou porque `JAVA_HOME` nao esta configurado e nao existe `java` no PATH.
- Nenhum APK novo foi gerado nesta rodada.

## Telemetria remota - Supabase real

Ambiente:

- Projeto Supabase linkado: `everton191's Project`.
- Project ref: `qsufnnivlgdidmjuaprb`.
- Migrations remotas alinhadas ate `20260504180540`.

Comandos executados:

- `npx.cmd supabase migration list --linked` - OK, local/remoto alinhados.
- `npx.cmd supabase db push --dry-run --linked` - OK antes da ultima migration de ajuste; depois voltou a falhar por `ECIRCUITBREAKER` no pooler.
- `npx.cmd supabase db push --linked --yes` - OK, aplicou as migrations pendentes.
- `npx.cmd supabase db lint --linked` - OK com avisos antigos nao bloqueantes.
- `node --check app.js` - OK.
- `node --check src\services\errorTelemetry.js` - OK.
- `node --check scripts\test-telemetry-rest.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- `npm run supabase:test:telemetry` - OK.

Resultado do teste real `npm run supabase:test:telemetry`:

- `register_app_error` criou log remoto.
- Repeticao do mesmo erro 3x agregou no mesmo registro.
- Segundo usuario simulado aumentou usuarios afetados.
- Ultimo registro de teste:
  - `logId=abe9ec38-9997-4dbe-8bde-1549463a181e`;
  - `occurrenceCount=4`;
  - `affectedUserCount=2`;
  - `severity=medium`.
- Feedback manual inserido em `app_feedback_reports` com `HTTP 201`.
- Leitura anonima de `app_error_logs` retornou `0` linhas visiveis.

Correcao feita durante o teste:

- `salvarFeedbackManualSupabase()` passou de `Prefer: return=representation` para `Prefer: return=minimal`.
- Motivo: com RLS ativo, inserir feedback e tentar retornar a linha exige policy de SELECT. O envio nao precisa retornar o registro, entao `return=minimal` preserva seguranca e evita erro `new row violates row-level security policy`.

Nao validado completamente:

- TESTE 4, offline real no navegador com envio ao Supabase: fila local validada com stub, pendente com banco real no navegador.
- TESTE 6, superadmin listando relatorios reais: pendente de login superadmin autorizado/manual nesta sessao.
- APK/mobile real: adiado conforme orientacao atual.

## AdMob e monetizacao

Comandos executados:

- `node --check app.js` - OK.
- `node --check src\services\adMobService.js` - OK.
- `node --check src\services\monetizationLimits.js` - OK.
- `node --check scripts\test-monetization.js` - OK.
- `npm run test:monetization` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- `npm run supabase:test:telemetry` - OK.
- `npm run android:sync` - OK, plugin AdMob reconhecido.
- `npm run android:apk` - OK usando `JAVA_HOME` temporario.

Casos cobertos pelo teste automatizado:

- Usuario premium nao ve anuncios.
- Usuario gratuito dentro do limite cria pedido.
- Usuario gratuito no limite bloqueia pedido.
- Rewarded simulado libera pedidos temporariamente.
- Primeiro PDF diario gratuito libera.
- Segundo PDF diario bloqueia.
- Rewarded simulado libera PDF extra.
- Reset diario de PDF funciona.
- Falha simulada do SDK nao concede recompensa.
- Interstitial so aparece apos 20 minutos e 2 acoes completas.
- Interstitial nao aparece em tela critica.
- Persistencia local de desbloqueio funciona.

Smoke web:

- `http://127.0.0.1:5180/` carregou com titulo `Simplifica 3D`.
- Console do navegador sem erros no carregamento.
- Tela inicial/login renderizou.

APK:

- `downloads/NE3D-ERP.apk` gerado com sucesso.
- `downloads/update.json` gerado com versao `2026.05.04-admob-test` e `versionCode=31`.

## Politica, termos, planos e APK

Comandos executados:

- `node --check app.js` - OK.
- `node --check sw.js` - OK.
- `node --check src\services\adMobService.js` - OK.
- `node --check src\services\monetizationLimits.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- `npm run supabase:test:telemetry` - OK.
- `npm run test:monetization` - OK.
- `npm run android:apk` - OK usando `JAVA_HOME` temporario.

Smoke web:

- `http://127.0.0.1:5180/` carregou com titulo `Simplifica 3D`.
- Console do navegador sem erros no carregamento.
- Tela inicial/login renderizou.

APK:

- `downloads/NE3D-ERP.apk` gerado com sucesso.
- `downloads/update.json` gerado com versao `2026.05.04-legal-ads` e `versionCode=32`.

## Superadmin busca e usuários de teste

Comandos executados:

- `node --check app.js` - OK.
- `node --check sw.js` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run supabase:test:rest` - OK.
- `npm run supabase:test:telemetry` - OK.
- `git diff --check` - OK, apenas avisos de LF/CRLF do Windows.
- `npx.cmd supabase migration list --linked` - OK, migration nova aparece pendente no remoto.
- `npx.cmd supabase db push --dry-run --linked` - timeout/pooler após conectar ao banco remoto.

Smoke web:

- `http://127.0.0.1:5180/` carregou com titulo `Simplifica 3D`.
- Console do navegador sem erros no carregamento.
- Sessão atual estava na tela de entrada, então o clique real em cliente no Superadmin precisa ser validado com superadmin logado.

Não aplicado no remoto:

- A migration `20260504232433_superadmin_test_user_cleanup.sql` está pronta, mas ainda não foi enviada ao Supabase remoto porque altera permissões/funções administrativas e o dry-run ficou travado no pooler.

## Planos, anúncios, roles e sugestões

Comandos executados em 2026-05-05:

- `node --check app.js` - OK.
- `node --check src\services\adMobService.js` - OK.
- `node --check src\services\monetizationLimits.js` - OK.
- `node --check scripts\test-monetization.js` - OK.
- `npm run test:monetization` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:rest` - OK.
- `npm run supabase:test:telemetry` - OK.
- `npx.cmd supabase migration list --linked` - OK; migrations `20260504232433` e `20260505125834` aparecem pendentes no remoto.
- `git diff --check` - OK, apenas avisos LF/CRLF do Windows.

Casos cobertos por teste automatizado:

- Premium não vê anúncios.
- Trial ativo libera limites premium.
- Free no limite continua bloqueado.
- `pending` não libera limites premium.
- `pending` não desliga anúncios do Free.
- Trial não vê anúncios.
- Pago não vê anúncios.
- Login não mostra interstitial.
- Interstitial só aparece após intervalo/ações completas.
- Rewarded continua liberando pedidos/PDF temporariamente.

Verificações por código:

- Cadastro local usa papel `user` por padrão.
- `owner/dono` legado normaliza para `user`.
- Superadmin por bootstrap de e-mail foi removido do frontend.
- Superadmin altera `active_plan`, limpa `pending_plan` e trava `plan_price` para plano pago.
- `app_suggestions` tem tabela, RLS e listagem no Superadmin.
- Limpeza de pending >24h está na migration.
- `get_saas_license` retorna `active_plan`, `pending_plan`, `payment_status`, `subscription_status`, preço e flags de trial/anúncios.

Ainda pendente:

- `npx.cmd supabase db push --dry-run --linked` com senha válida do banco.
- Aplicar migrations no Supabase remoto.
- Teste real com superadmin logado: pesquisar cliente, abrir edição, alterar plano/status, marcar teste, excluir teste.
- Teste real de sugestão/NF-e salvando no Supabase remoto.
- Gerar APK atualizado.

Bloqueio:

- `npx.cmd supabase db push --dry-run --linked` falhou com autenticação inválida do banco (`SUPABASE_DB_PASSWORD`) e bloqueio temporário do pooler (`ECIRCUITBREAKER`).
- Nenhuma migration foi aplicada no remoto nesta tentativa.

## Hotfix Superadmin e 2FA WhatsApp

Comandos executados em 2026-05-05:

- `node --check app.js` - OK.
- `node --check scripts\test-auth-hotfix.js` - OK.
- `npm run test:auth-hotfix` - OK.
- `npm run test:monetization` - OK.
- `npm run supabase:test:migrations` - OK.
- `npm run build:web` - OK.
- `npm run supabase:test:rest` - OK.
- `npm run supabase:test:telemetry` - OK.
- `git diff --check` - OK, apenas avisos LF/CRLF do Windows.

Casos cobertos por `test:auth-hotfix`:

- `normalizePhoneBR()` normaliza telefones BR para E.164.
- Links WhatsApp usam número sem `+`.
- 2FA WhatsApp fica desligado sem backend real.
- `precisa2FA()` não bloqueia login sem backend.
- `abrirWhats2FA()` não abre `wa.me` de 2FA sem backend.
- Superadmin valida RPC `erp_is_superadmin()` e perfis pelo próprio `user_id`.
- Login Supabase não usa fallback `operador/admin`.
- OAuth não cria admin por fallback.
- Superadmin redireciona para o painel `superadmin`.
- Configuração pública não reativa 2FA sem backend.

Verificações remotas no Supabase:

- `public.erp_is_superadmin()` existe.
- `public.superadmins` ainda não existe no remoto.
- `paessilvae@gmail.com` está com e-mail confirmado.
- `erp_profiles.role = superadmin`.
- `erp_profiles.status = active`.
- Cliente vinculado existe e está ativo.
- Assinatura vinculada existe (`trialing`).
- Simulação da claim JWT do `user_id` retornou `is_superadmin = true`.

Não executado:

- Login real com senha no app, porque a senha de autenticação do usuário não foi informada nesta sessão.
- APK, conforme pedido.

## Tela pública de autenticação

Comandos executados em 2026-05-05:

- `npm run test:auth-hotfix` - OK antes de alterar a UI.
- `npm run supabase:test:rest` - OK antes de alterar a UI.
- Consulta remota Supabase: superadmin `paessilvae@gmail.com` confirmado em `erp_profiles` como `superadmin/active`.
- `node --check app.js` - OK.
- `node --check scripts\test-auth-ui.js` - OK.
- `npm run test:auth-ui` - OK.
- `npm run test:monetization` - OK.
- `npm run build:web` - OK.

Casos cobertos por `test:auth-ui`:

- Tela pública contém marca, abas `Entrar`/`Criar conta` e frase curta.
- Aba Entrar contém e-mail, senha, manter conectado, recuperar senha e link discreto de planos.
- Aba Criar conta contém todos os campos obrigatórios e aceite legal.
- DOM público não contém Google, acesso local, manutenção local, senha salva/digital, `adminSenha` ou `loginAdminBtn`.
- Assistente e calculadora flutuante dependem de usuário autenticado.
- Header some na tela pública de auth.

Verificação visual/DOM:

- Edge headless abriu `http://127.0.0.1:5181/`.
- DOM deslogado confirmou `Entrar` e `Criar conta`.
- DOM deslogado confirmou ausência de `Acesso local`, `Google`, `Senha salva/digital`, `.assistant-fab`, `.calc-float-ball` e `#introOverlay`.
- CDP mobile 390x844 confirmou aba Entrar sem scroll relevante e sem flutuantes.
- CDP mobile 390x844 confirmou aba Criar conta com scroll leve e sem flutuantes.

Não executado:

- Login real com senha e criação real de conta, porque credenciais/dados reais de teste não foram informados nesta sessão.
- APK, conforme pedido anterior.

## Publicação site/APK - validação real

Comandos executados em 2026-05-05:

- `npx supabase db push --linked --dry-run` - OK.
- `npx supabase db push --linked --yes` - OK para migrations pendentes.
- `npm run supabase:migrations` - OK, local e remoto alinhados até `20260505230616`.
- `npm run supabase:test:rest` - OK após correção das policies.
- `npm run supabase:test:migrations` - OK.
- `npm run test:auth-hotfix` - OK.
- `npm run test:auth-ui` - OK.
- `npm run test:monetization` - OK.

Teste manual no navegador local:

- `http://127.0.0.1:5181/` carregou a build de `dist`.
- Login real do Superadmin concluído e abriu painel sem 2FA WhatsApp.
- Superadmin carregou dashboard e clientes remotos.
- Busca por e-mail filtrou a lista.
- Clique na linha inteira do cliente abriu edição.
- `Alterar plano` abriu o fluxo e foi cancelado sem alteração.
- `Sugestões e Feedback` carregou sem erro e exibiu contadores/feedbacks.
- Logout retornou para a tela `Entrar`.
- Assistente e calculadora flutuante ficaram ocultos após logout.

Correção adicional validada:

- `REST plans active`: `200`.
- `REST profiles RLS anon`: `200`, `rows=0`.
- `REST clients RLS anon`: `200`, `rows=0`.
- RPCs e Edge Functions protegidas continuaram retornando `401` para chamadas anônimas quando esperado.

## Hotfix rolagem da lista de clientes

Comandos executados em 2026-05-05:

- `node --check app.js` - OK.
- `node --check scripts\test-auth-hotfix.js` - OK.
- `npm run test:auth-hotfix` - OK.
- `npm run test:auth-ui` - OK.
- `npm run test:monetization` - OK.
- `npm run build:web` - OK.

Caso coberto por teste automatizado:

- Simulação de toque + movimento vertical na linha de cliente não chama seleção/edição.
- Simulação de tap curto na linha continua chamando seleção/edição.
- Linha de cliente usa handlers de movimento/cancelamento e `touch-action: pan-y`.
