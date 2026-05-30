# Storefront Fase 3.9 - Hardening, Storage e Beta Fechado

Data: 2026-05-22

## Escopo executado

- Substituido o controle principal por `canAccessStorefrontAdmin(user, plan, flags)`.
- `localStorage` continua somente como override de desenvolvimento em `localhost`, `127.0.0.1` ou `file://`.
- Criada allowlist remota `storefront_beta_users`.
- Criado bucket `storefront-assets` para logos, banners e imagens de produtos.
- Upload real preparado no painel administrativo para Supabase Storage.
- CRUD do painel passa a usar endpoints reais quando houver sessão Supabase e loja remota salva.
- Fallback local mantido apenas para preview/desenvolvimento.

## Migration

Arquivo:

- `supabase/migrations/20260522203000_storefront_phase39_hardening_storage.sql`

Inclui:

- tabela `storefront_beta_users`;
- função defensiva `storefront_is_admin()`;
- policies RLS para beta fechado;
- bucket `storefront-assets`;
- policies de leitura/escrita para assets por `owner_id`;
- limite de arquivo em 3 MB no bucket;
- tipos permitidos: JPG, PNG e WebP.

## Staging

Projeto staging usado:

- `dcaqiatgftkjxyewlhgi`

Executado:

- `npm run supabase:staging:link`
- `npm run supabase:staging:apply-admin`

Status:

- migration 3.8 aplicada no staging;
- migration 3.9 aplicada no staging;
- tabela `storefront_beta_users` confirmada;
- bucket `storefront-assets` confirmado com `public=true` e limite `3145728`;
- policies da allowlist confirmadas.

## Principal

Projeto principal:

- `qsufnnivlgdidmjuaprb`

Status:

- nenhuma migration 3.8/3.9 foi aplicada automaticamente no principal nesta etapa;
- principal foi apenas relinkado para validação controlada;
- teste `test:storefront-production-controlled` passou com a estrutura da Fase 3 ja existente;
- script preparado para aplicação futura: `npm run supabase:production:apply-storefront-admin`.

Antes de aplicar no principal:

- criar backup atualizado;
- confirmar `PRODUCTION_CONTROLLED_CONFIRM=true`;
- confirmar ref `qsufnnivlgdidmjuaprb`;
- manter `STORE_FRONT_ENABLED=false` para usuarios reais;
- nao aplicar seed fake.

## Segurança

Regras aplicadas no app:

- menu Loja Online aparece somente com feature flag real, beta remoto, superadmin autorizado ou override local de desenvolvimento;
- usuario comum nao consegue habilitar pelo console/localStorage fora de ambiente local;
- rota admin usa o mesmo gate centralizado;
- services nao carregam para usuario nao autorizado;
- `owner_id` e paths de Storage sao validados por RLS/policies.

## Storage

Paths previstos:

- `storefront-assets/{owner_id}/{store_id}/logo/`
- `storefront-assets/{owner_id}/{store_id}/banner/`
- `storefront-assets/{owner_id}/{store_id}/products/{product_id}/`

Limites no painel:

- logo: ate 1 MB;
- banner: ate 3 MB;
- produto: ate 3 MB;
- formatos: JPG, PNG, WebP.

## Testes executados

- `node --check app.js`
- `npm run test:storefront-phase3`
- `npm run test:storefront-phase3-5`
- `npm run test:storefront-rls-simulation`
- `npm run test:storefront-staging`
- `npm run build:web`
- `cd storefront-preview && npm run build`
- `cd storefront-preview && npm run lint`
- `npm run test:storefront-production-controlled`
- `git diff --check`

## Riscos restantes

- upload real precisa de teste manual com usuario beta logado e produto remoto salvo;
- o bucket esta `public=true` para permitir URL direta em storefront publico; as policies seguem versionadas, mas a revisao final de exposicao deve ser feita antes do beta aberto;
- migration 3.8/3.9 ainda precisa de backup e aplicacao controlada no principal;
- beta fechado ainda depende de popular `storefront_beta_users` com usuarios reais permitidos.

## Recomendacao

Pode avancar para beta fechado somente depois de:

- aplicar 3.8/3.9 no principal com backup atualizado;
- inserir usuarios permitidos em `storefront_beta_users`;
- testar upload de logo, banner e produto no principal;
- confirmar que `STORE_FRONT_ENABLED` segue desligado para usuarios fora do beta.
