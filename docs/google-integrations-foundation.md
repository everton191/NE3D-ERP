# Google Integrations Foundation

Data: 2026-05-29

## Estado

A fundacao futura para integracoes Google existe, mas esta totalmente desativada.

Nao ha:

- login Google ativo;
- botao Google na interface;
- OAuth funcional;
- SDK Google instalado;
- chamada para API externa Google;
- Client ID ou Client Secret no frontend;
- token real salvo;
- alteracao no login atual por e-mail/senha.

## Estrutura local

```txt
src/integrations/google
 ├── README.md
 ├── google.config.example.js
 ├── googleIntegrationService.js
 ├── auth
 ├── calendar
 ├── drive
 ├── gmail
 └── sheets
```

`googleIntegrationService.js` retorna `GOOGLE_INTEGRATIONS_DISABLED` para todos os metodos de conexao/sync.

## Edge Functions futuras

```txt
supabase/functions/google-oauth
supabase/functions/google-calendar-sync
supabase/functions/google-drive-backup
supabase/functions/google-gmail-send
supabase/functions/google-sheets-sync
```

Essas pastas possuem apenas README. Nenhuma funcao esta implementada.

## Banco

Migration:

```txt
supabase/migrations/20260529193000_google_integrations_foundation_disabled.sql
```

Tabelas:

- `external_integrations`;
- `integration_tokens`;
- `integration_sync_jobs`;
- `integration_logs`;
- `app_integration_feature_flags`.

Flags futuras:

- `google_integrations_enabled=false`;
- `google_auth_enabled=false`;
- `google_calendar_enabled=false`;
- `google_drive_enabled=false`;
- `google_gmail_enabled=false`;
- `google_sheets_enabled=false`.

## Seguranca de tokens

`integration_tokens` e propositalmente mais restrita:

- sem policy de leitura para usuario autenticado;
- sem grant de leitura/escrita para `authenticated` ou `anon`;
- manipulacao futura apenas por backend seguro, Edge Function ou `service_role`;
- `encrypted_token_placeholder` e apenas marcador/documentacao, nao token real.

Tokens futuros nunca devem aparecer em UI, logs, diagnosticos ou relatorios.

## RLS

As tabelas usam RLS com isolamento por:

```sql
owner_id = auth.uid()
```

Superadmin segue o helper existente:

```sql
public.erp_is_superadmin()
```

Nao ha policy `using (true)` ou `with check (true)`.

## Validacao remota

Script:

```bash
npm run supabase:google-integrations:validate
```

O script valida em transacao com rollback:

- tabelas existem;
- RLS ativo;
- policies seguras;
- `integration_tokens` sem acesso frontend;
- flags continuam desligadas;
- usuario comum nao acessa outro owner;
- usuario comum nao cria token;
- superadmin le integracoes permitidas sem ler tokens;
- nada fica salvo como dado de teste.

## Ativacao futura

Somente em fase futura:

1. Criar projeto OAuth no Google Cloud.
2. Configurar secrets em backend/Vercel/Supabase, nunca no frontend.
3. Implementar Edge Function especifica.
4. Ativar `google_integrations_enabled`.
5. Ativar uma flag especifica por beta/superadmin.
6. Validar RLS, criptografia, logs e rollback.
7. Criar UI apenas depois do backend estar seguro.

Variaveis futuras:

```txt
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_ENCRYPTION_KEY
```

## Deploy e bundle publico - Fase 6D

No deploy `dpl_GWXFJVvQxrGJtX2Zqyb9SkL5gu8z`, a fundacao Google continuou desativada e fora do bundle publico.

Correcao aplicada na fase:

- `scripts/prepare-web.js` deixou de copiar o `src` inteiro para `dist`;
- o build web agora usa allowlist apenas para services publicos realmente carregados;
- `dist/src/integrations/google` nao e gerado;
- `/src/integrations/google/googleIntegrationService.js` no remoto retorna o fallback HTML da SPA, nao o arquivo JavaScript do service;
- `index.html` remoto nao contem `googleIntegrationService`, `Entrar com Google` ou `Login com Google`.

Validacoes:

- `npm run test:google-integrations-foundation`;
- `npm run test:restructuring-checks`;
- `npm run supabase:google-integrations:validate`;
- HTTP 200 para assets/PWA essenciais e ausencia dos markers Google no HTML.

Estado final da fase:

```txt
Google estruturado: sim
Google ativo: nao
OAuth ativo: nao
SDK instalado: nao
Service no bundle publico: nao
Botao/menu visivel: nao
Tokens frontend: nao
```
