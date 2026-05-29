# AI Foundation - Fase 5B

Data: 2026-05-29

Escopo: criar a fundacao tecnica para recursos futuros de inteligencia artificial no Simplifica 3D, mantendo tudo desativado para usuarios finais.

## O que foi criado

- Tabelas idempotentes em `supabase/migrations/20260529141000_ai_foundation_disabled.sql`: `app_ai_settings`, `app_ai_usage_logs`, `app_ai_context_snapshots` e `app_ai_feature_flags`.
- RLS ativado nas quatro tabelas novas, sem policy publica aberta.
- Provider adapter em `src/services/aiProviderAdapter.js`.
- Service central em `src/services/aiService.js`.
- Service de quota e plano em `src/services/aiQuotaService.js`.
- Service de feature flags em `src/services/aiFeatureFlagService.js`.
- Builders de contexto seguro em `src/services/aiContextService.js`.
- Estimativa/custo placeholder em `src/services/aiCostService.js`.
- Teste anti-regressao em `scripts/test-ai-foundation.js`.
- Script `npm run test:ai-foundation`.

## O que esta desativado

- Nenhuma IA esta ativa.
- Nenhuma API externa e chamada.
- Nenhum provider real esta conectado.
- Nenhuma chave de API foi adicionada.
- Nenhum botao, menu, tela, card ou tooltip de IA foi criado.
- Nenhum plano ganhou beneficio visual de IA.
- Nenhum fluxo de loja, pedido, caixa, estoque, clientes, checkout ou assinatura foi alterado.

O retorno padrao do service central nesta fase e:

```js
{
  ok: false,
  reason: "AI_DISABLED",
  message: "Recurso de IA ainda nao disponivel."
}
```

Providers futuros diferentes de `disabled` retornam erro controlado:

```js
{
  ok: false,
  reason: "AI_PROVIDER_NOT_CONFIGURED"
}
```

## Como ativar futuramente

1. Escolher provider.
2. Implementar o adapter real do provider escolhido em ambiente seguro.
3. Criar endpoint/backend seguro, como Vercel API Route, backend Node ou Supabase Edge Function.
4. Configurar variaveis de ambiente somente no backend.
5. Ativar `AI_ENABLED_GLOBAL`.
6. Ativar `ai_enabled` para Superadmin/beta.
7. Definir `monthly_limit`.
8. Liberar feature flag especifica.
9. Testar logs e custo real.
10. Liberar para plano pago.
11. Monitorar uso real.
12. Ajustar preco e limite.

## Variaveis futuras previstas

```txt
AI_ENABLED_GLOBAL=false
AI_PROVIDER=disabled
AI_API_KEY=
AI_MODEL=
AI_DEFAULT_MONTHLY_LIMIT=0
AI_LOG_LEVEL=blocked_only
AI_ALLOW_SUPERADMIN_TEST=false
```

Essas variaveis nao devem ser expostas no frontend. Segredos devem ficar apenas no backend.

## Providers futuros previstos

- OpenAI.
- Groq.
- Gemini.
- Anthropic.
- Local/Ollama.

## Feature flags futuras

Todas nascem desligadas:

- `ai_orders_summary`
- `ai_inventory_summary`
- `ai_cash_summary`
- `ai_pricing_helper`
- `ai_whatsapp_message_helper`
- `ai_client_analysis`

## Contextos seguros preparados

- `orders_summary`
- `inventory_summary`
- `cash_summary`
- `pricing_helper`
- `whatsapp_message_helper`
- `client_analysis`

Os builders exigem `ownerId`, filtram dados por owner, limitam listas e retornam resumos. Eles nao permitem SQL livre, nao consultam banco diretamente por texto gerado e nao retornam chaves, senhas ou dados sensiveis desnecessarios.

## Riscos evitados

- Chave de API no frontend.
- SQL livre.
- Acesso cruzado entre usuarios ou empresas.
- Custo inesperado.
- IA alterando dados operacionais.
- IA aparecendo antes da hora.
- Dependencia prematura de provider.
- Complexidade antes de ter ativacao comercial validada.

## Observacao sobre legado

O projeto ja possuia trechos legados/local-only relacionados a IA em `app.js`, mantidos desligados por flags existentes. A Fase 5B nao remove nem refatora esse legado para evitar regressao ampla. A fundacao nova fica isolada em `src/services/ai*.js` e nao e carregada pela interface.

## Arquivos alterados

- `src/services/aiService.js`
- `src/services/aiProviderAdapter.js`
- `src/services/aiQuotaService.js`
- `src/services/aiContextService.js`
- `src/services/aiFeatureFlagService.js`
- `src/services/aiCostService.js`
- `supabase/migrations/20260529141000_ai_foundation_disabled.sql`
- `scripts/test-ai-foundation.js`
- `package.json`
- `docs/ai-foundation.md`
- `docs/render-flow.md`
- `docs/reestruturacao-profissional-checks.md`
- `sw.js`
- assets de marca e abertura em `assets/` e `android/app/src/main/res/`
