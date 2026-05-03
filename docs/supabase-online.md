# Supabase Online

Projeto usado:

- URL: `https://qsufnnivlgdidmjuaprb.supabase.co`
- Project ref: `qsufnnivlgdidmjuaprb`

## Aplicar tabelas

No terminal normal, depois de autenticar:

```powershell
npm run supabase:login
npm run supabase:link
npx supabase db push
```

Isso aplica a migration em `supabase/migrations/20260428103000_create_erp_online_tables.sql`.

## Segurança

O app usa a chave pública do Supabase no frontend. Isso é esperado para apps web/mobile, mas a proteção real fica nas políticas RLS.

As tabelas criadas são:

- `erp_profiles`: perfil do usuário autenticado.
- `erp_backups`: snapshot JSON do ERP por usuário.
- `erp_records`: tabela genérica preparada para migração por registro no futuro.

Cada linha fica ligada a `auth.uid()`. Um superadmin do Supabase pode ver todos os dados se o perfil dele em `erp_profiles` tiver `role = 'superadmin'`.

Para promover o usuário principal depois do primeiro login:

```sql
update public.erp_profiles
set role = 'superadmin'
where email = 'SEU_EMAIL_AQUI';
```

## Como o app sincroniza

O ERP ainda mantém `localStorage` funcionando. A sincronização Supabase envia/restaura um backup JSON completo pela tabela `erp_backups`, sem apagar a lógica local.

Fluxo recomendado:

1. Criar/entrar na conta Supabase pela tela `Backup`.
2. Enviar backup Supabase no computador principal.
3. Entrar com a mesma conta no Android.
4. Sincronizar Supabase no Android para mesclar os dados.

## Testes e diagnostico

Testes que nao precisam de token privado:

```powershell
npm run supabase:test:rest
npm run supabase:test:migrations
```

Testes que precisam da CLI autenticada com uma conta Supabase:

```powershell
npm run supabase:login
npm run supabase:link
npm run supabase:migrations
npm run supabase:advisors
npm run supabase:lint
```

Para testes locais com `supabase start`, `supabase test db` ou `supabase migration list --local`, o Windows precisa ter Docker Desktop instalado e em execucao.

## Bloqueios conhecidos

- `supabase db advisors --linked`, `db lint --linked` e `test db --linked` exigem login na CLI ou `SUPABASE_ACCESS_TOKEN`.
- O projeto remoto atualmente responde `external_google_enabled=false` em `/auth/v1/settings`; portanto, login Google precisa ser ativado no painel Supabase antes de funcionar.
- `register_saas_client` deve retornar `Usuário não autenticado` para chamadas anonimas. Esse bloqueio e esperado e protege o cadastro SaaS.
