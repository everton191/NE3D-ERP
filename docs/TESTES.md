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

## Criterio de conclusao

So considerar pronto quando:

- usuario novo cria estrutura completa automaticamente;
- login persiste ate logout manual;
- superadmin lista clientes e salva acoes no Supabase;
- backup/sync nao pede configuracao tecnica ao cliente;
- RLS isola dados por empresa;
- nenhum `service_role` fica exposto no frontend;
- build e testes obrigatorios passam.
