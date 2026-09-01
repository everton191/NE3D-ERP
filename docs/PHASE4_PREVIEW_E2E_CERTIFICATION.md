# Fase 4 — certificação Preview/E2E controlada

Data da verificação: 2026-08-31.

## Fase 4A — restauração de staging

```text
STAGING_OLD_PROJECT=dcaqiatgftkjxyewlhgi
STAGING_OLD_STATUS=UNAVAILABLE
STAGING_NEW_PROJECT=Simplifica 3D Staging
STAGING_PROJECT_REF=sgcsgudgaxzysqyqxnik
PRODUCTION_PROJECT_REF=qsufnnivlgdidmjuaprb
VERCEL_PREVIEW_CONFIG=BLOCKED
PREVIEW_FAIL_CLOSED=BLOCKED
PREVIEW_PRODUCTION_GUARD=BLOCKED
PREVIEW_DATABASE_ISOLATION=PARTIAL
MIGRATIONS_APPLIED=BLOCKED
FIXTURES_CREATED=NO
PREVIEW_DEPLOY=BLOCKED
```

O ref antigo foi classificado como **OBSOLETE**: consta somente em arquivos de histórico, scripts de guarda e no detector de staging. A URL não resolve DNS e o projeto não está acessível na conta atual.

Um novo projeto isolado foi criado na organização atual, em região `sa-east-1`, sem importar dados do principal. Ele ainda não recebeu schema, usuários ou fixtures.

### Bloqueio operacional

O CLI exige a senha de banco para vincular o novo projeto e aplicar migrações. A senha usada na criação não foi preservada no cofre/arquivo local antes do comando. Não foi feita tentativa de adivinhação, nem foi usado o banco principal como substituto.

Para retomar, no Dashboard do projeto **Simplifica 3D Staging** (`sgcsgudgaxzysqyqxnik`), redefina a senha do banco e grave a nova senha exclusivamente em `.env.staging` como `SUPABASE_STAGING_DB_PASSWORD`. Depois será possível vincular, aplicar migrações e configurar as variáveis Preview sem usar Production.

## Decisão de ambiente

Nenhum dado de teste, deploy ou alteração comercial foi realizado nesta fase.

- O workspace está ligado ao Supabase principal `qsufnnivlgdidmjuaprb`.
- Há referência local a staging `dcaqiatgftkjxyewlhgi`, mas ela não resolve DNS e não aparece na lista de projetos acessíveis pela sessão atual.
- O projeto Vercel `erp_ne3d` não possui variáveis de ambiente configuradas para Preview.
- O código possui fallbacks explícitos para a URL e a chave publicável do Supabase principal. Assim, um Preview criado agora poderia atingir o banco principal.

Por segurança, a certificação E2E foi interrompida antes de criar `OWNER_A`, `OWNER_B`, `STORE_A`, `STORE_B`, eventos ou leads.

## Resultado

```text
PREVIEW_DEPLOY=BLOCKED
PREVIEW_NOINDEX=BLOCKED
HTTP_HEADERS=BLOCKED
404_E2E=BLOCKED
ROBOTS_E2E=BLOCKED
SITEMAP_E2E=BLOCKED
SEO_SERVER_E2E=BLOCKED
OPEN_GRAPH=BLOCKED
JSON_LD=BLOCKED
STORE_PUBLICATION=BLOCKED
CACHE_INVALIDATION_E2E=BLOCKED
SERVICE_WORKER_E2E=BLOCKED
CROSS_USER_ISOLATION=BLOCKED
CROSS_STORE_ISOLATION=BLOCKED
ANALYTICS_CONSENT_DENY=BLOCKED
ANALYTICS_CONSENT_ALLOW=BLOCKED
ANALYTICS_RLS=BLOCKED
PII_STORAGE=PASS (Fase 3, teste local)
MOBILE_360=BLOCKED
MOBILE_390=BLOCKED
MOBILE_412=BLOCKED
AUTH_PASSWORD_PROTECTION=BLOCKED_MANUAL
SERVICE_ROLE_SCAN=PASS (Fase 3, varredura local)
BUILD=NOT_RUN
REGRESSIONS=NOT_RUN
```

## Evidências coletadas

- `supabase projects list --output json`: somente o projeto principal está acessível.
- `npm run supabase:staging:status`: staging configurado como `dcaqiatgftkjxyewlhgi`, mas o workspace segue ligado ao principal.
- `https://dcaqiatgftkjxyewlhgi.supabase.co/rest/v1/`: falha de resolução DNS.
- `vercel env ls`: não há variáveis no projeto Vercel.

## Próximo passo necessário

Escolher uma das alternativas antes de retomar a Fase 4:

1. Restaurar/criar um projeto Supabase de staging e conceder acesso à conta atual; ou
2. Informar um projeto de desenvolvimento já existente, separado do principal.

Depois, configurar no Preview apenas `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e URL pública do Preview, ajustar o build para injetá-las no cliente e só então criar fixtures controladas.

## Restrições preservadas

- Nenhum deploy Production.
- Nenhuma loja ou usuário real publicado.
- Nenhum dado comercial alterado.
- `SAFE_TO_PUBLISH=FALSE`.
