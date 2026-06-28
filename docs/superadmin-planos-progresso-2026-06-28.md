# Progresso Superadmin e Planos - 2026-06-28

Backup antes de continuar a nova tela de planos:

`C:\Users\PAESS\OneDrive\Documentos\erpNE3d\backups\before-continuing-plans-redesign-20260628-002135`

## Fase SA-01 - Superadmin isolado e navegacao

Status: concluido e validado antes da nova tela de planos.

Arquivos principais:

- `app.js`
- `style.css`

O que faz:

- Isola a interface Superadmin do ERP comum.
- Troca a barra inferior mobile para a navegacao do Superadmin.
- Adiciona menu lateral claro no desktop.
- Adiciona atalho `Entrar no ERP` no menu lateral.
- Adiciona tela `Manutencao` para abrir ERP de cliente temporariamente.
- Mantem a sessao real do Superadmin sem salvar login do cliente.

Validacoes ja feitas:

- `node --check app.js`
- `npm.cmd run build:web`
- `npm.cmd run test:ui-overflow`
- `npm.cmd run test:plans-saas-structure`
- `npm.cmd run test:admin-beta-access`
- Smoke no navegador da tela Manutencao.

## Fase PL-01 - Base de dados visual dos planos

Status: implementada nesta rodada, pendente apenas de validacao manual visual no aparelho real.

Identificadores no codigo:

- `plansPresentationSelectedSlug`
- `getPlanPresentationDefaults`
- `getPlanPresentationOverrides`
- `getPlanPresentationData`
- `selecionarPlanoApresentacao`
- `editarPlanoApresentacaoSuperadmin`
- `editarPrecoExibidoPlanoSuperadmin`
- `renderPlanMiniDashboard`
- `renderPlanMobileTabs`
- `renderPlanSelectedDetails`
- `renderPlanTrustBar`
- `renderPlanFeatureMatrix`

O que ja entrou:

- Estrutura centralizada para dados comerciais dos cards Free, Start e Pro.
- Textos comerciais conforme a referencia enviada.
- Mini dashboards por plano.
- Overrides locais em modo seguro para futura edicao pelo Superadmin.
- Salvamento visual local que nao altera checkout real.
- Novo layout dos cards na tela `renderAssinatura`.
- Selecao visual do plano e bloco de detalhes do plano selecionado.
- Carrossel mobile em scroll horizontal, com um card por tela.
- Barra de confianca e matriz comparativa visual.
- Painel Superadmin de apresentacao dos planos com edicao segura de textos e preco exibido.
- CSS claro/escuro para Free, Start e Pro inspirado na referencia enviada.
- No mobile, os cards de planos do Superadmin e do catalogo remoto usam carrossel horizontal com um plano por vez.

Validacoes feitas nesta rodada:

- `node --check app.js`
- `npm.cmd run test:plans-saas-structure`
- `npm.cmd run test:plans-ui`
- `npm.cmd run test:plans-presentation`
- `npm.cmd run test:plans-theme-v2`
- `npm.cmd run test:ui-overflow`
- `npm.cmd run build:web`

O que ainda falta fazer:

- Conferir visualmente no PWA mobile real o swipe dos cards e o tamanho dos textos.
- Se aprovado no aparelho real, ampliar o teste visual para screenshot/browser smoke do carrossel.
- Na fase seguinte, evoluir a edicao Superadmin para recursos/limites com persistencia em banco.

## Fase PL-01.5 - Contrato central de capacidades

Status: implementada nesta rodada.

Objetivo:

- Preparar a escalabilidade antes de banco/cobranca.
- Reduzir regras duplicadas de Free, Start e Pro espalhadas entre UI, loja e monetizacao.
- Manter compatibilidade com os nomes antigos usados pela interface.

Identificadores no codigo:

- `getPlanCapabilityContract`
- `getPlanRegistryEntry`
- `getPlanEntitlements`
- `getPlanLimits`
- `getPlanUpgradeOptions`
- `PlanService.getPolicy`

O que faz:

- Usa o `PLAN_REGISTRY` como fonte central para limites e recursos.
- Expõe um contrato unico com `entitlements`, `limits`, `isFree`, `isStart`, `isPro`, `isPaid`, `adsEnabled`, limites de backup, aparelhos e produtos.
- Mantem `getPlanPolicy` compatível com o restante do app.
- Adiciona teste `npm.cmd run test:plan-capabilities`.

O que ainda nao faz:

- Nao cria tabelas no Supabase.
- Nao altera checkout.
- Nao altera webhook Mercado Pago.
- Nao muda assinatura real de nenhum cliente.

## Fase PL-02 - Cobranca e Mercado Pago

Status: parcialmente preparada. A persistencia base foi criada em PL-02A, mas checkout/webhook ainda nao foram ligados a ela.

Motivo:

O pedido dos anexos inclui mudancas estruturais de banco, checkout, webhook, tabelas de preco e eventos. A parte de schema foi iniciada de forma aditiva, mas a ligacao com cobranca real deve continuar em fase separada para nao quebrar assinaturas existentes.

O que falta futuramente:

- Tabelas `plans`, `plan_card_stats`, `plan_features`, `plan_prices`.
- Tabelas extras `checkout_sessions`, `payment_transactions`, `webhook_events`, `company_plan_overrides`, `plan_change_schedules`, `company_plan_usage`.
- Checkout usando preco ativo em banco.
- Webhook Mercado Pago generico por IDs e idempotente.
- Logs de auditoria para alteracoes criticas.

## Regra de seguranca

Enquanto PL-02 nao for implementada, qualquer edicao visual de preco/texto no Superadmin deve ser tratada como exibicao local/visual e nao pode alterar cobranca real, assinatura ativa ou webhook.

## Fase PL-02A - Persistencia escalavel de planos

Status: implementada e aplicada no Supabase principal nesta rodada.

Migration:

- `supabase/migrations/20260628110000_plan_catalog_persistence_foundation.sql`

Teste:

- `npm.cmd run test:plan-persistence`
- `npm.cmd run supabase:plan-persistence:status`
- `npm.cmd run supabase:plan-persistence:dry-run`
- `npm.cmd run supabase:plan-persistence:validate`
- `PRODUCTION_CONTROLLED_CONFIRM=true npm.cmd run supabase:plan-persistence:apply`

O que faz:

- Complementa `public.plans` com campos de apresentacao visual, limites e capacidades.
- Cria `plan_card_stats` para mini dashboards dos cards.
- Cria `plan_features` para recursos comparaveis por plano.
- Cria `plan_prices` para preco versionado por provedor.
- Cria `checkout_sessions` para preparar checkout idempotente futuro.
- Cria `payment_transactions` para separar transacao real de pagamento.
- Cria `webhook_events` para eventos genericos idempotentes.
- Cria `company_plan_overrides` para excecoes por empresa/cliente.
- Cria `plan_change_schedules` para upgrades/downgrades agendados.
- Cria `company_plan_usage` para uso por periodo.

Protecoes:

- Todas as tabelas novas usam RLS.
- O frontend `anon` e `authenticated` fica sem acesso direto.
- Acesso fica restrito a `service_role` nesta fundacao.
- Seeds iniciais incluem `checkout_connected=false`.
- O comando `apply` exige `PRODUCTION_CONTROLLED_CONFIRM=true`.
- `dry-run` executa a migration dentro de transacao com `rollback`.

Validacoes remotas feitas:

- `npm.cmd run supabase:plan-persistence:status`
- `npm.cmd run supabase:plan-persistence:dry-run`
- `PRODUCTION_CONTROLLED_CONFIRM=true npm.cmd run supabase:plan-persistence:apply`
- `npm.cmd run supabase:plan-persistence:validate`

Resultado:

- Projeto linkado confirmado: `qsufnnivlgdidmjuaprb`.
- Dry-run retornou `plan_persistence_dry_run_ok`.
- Apply executado com confirmacao controlada.
- Migration `20260628110000` marcada como aplicada no historico remoto.
- Validate retornou `plan_persistence_remote_validation_ok`.

O que ainda nao faz:

- Nao conecta checkout real.
- Nao altera Edge Functions do Mercado Pago.
- Nao atualiza assinaturas existentes.
- Nao muda status ou preco real de clientes.

## Fase PL-02B - Leitura Superadmin do catalogo persistido

Status: implementada e aplicada no Supabase principal nesta rodada.

Migration:

- `supabase/migrations/20260628113000_superadmin_plan_catalog_rpc.sql`

Comandos:

- `npm.cmd run supabase:plan-catalog:dry-run`
- `PRODUCTION_CONTROLLED_CONFIRM=true npm.cmd run supabase:plan-catalog:apply`
- `npm.cmd run supabase:plan-catalog:validate`

O que faz:

- Cria RPC `get_superadmin_plan_catalog`.
- A RPC exige `public.erp_is_superadmin()`.
- Mantem as tabelas novas fechadas para acesso direto.
- Retorna planos, precos versionados, recursos, mini indicadores e metricas iniciais.
- Adiciona painel `Catálogo persistido` em `Superadmin > Planos`.

O que ainda nao faz:

- Nao permite editar remoto.
- Nao troca os cards locais pelo catalogo remoto.
- Nao conecta checkout.
- Nao altera Mercado Pago.

Validacoes remotas feitas:

- Dry-run retornou `plan_catalog_rpc_dry_run_ok`.
- Apply executado com confirmacao controlada.
- Migration `20260628113000` marcada como aplicada no historico remoto.
- Validate retornou `plan_catalog_rpc_remote_validation_ok`.
