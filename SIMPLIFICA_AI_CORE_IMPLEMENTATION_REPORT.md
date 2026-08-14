# Simplifica AI Core — Relatório final de implementação

Data: 2026-08-14

Versão entregue: `1.0.36` (`versionCode 64`)

Escopo: Simplifica 3D — Home, Pedidos, Estoque, Calculadora, Caixa/Financeiro e Simplifica IA.

## Resultado

A causa da divergência financeira foi confirmada: o frontend persistia Pedido e Caixa apenas nas coleções locais/`erp_records`, enquanto a fundação financeira atômica do Supabase não recebia os eventos do pedido. Home e gráficos também recalculavam vendas diretamente dos pedidos com filtros diferentes.

A correção criou uma ponte local-first idempotente entre o commit do pedido e as RPCs financeiras, além de uma projeção comum consumida por Caixa, Home e gráficos. Venda e movimento de caixa permanecem conceitos diferentes: pedido elegível aumenta vendas; somente valor recebido cria entrada no caixa.

## Implementação funcional

- `simplifica3dFinancialCore`: valores em centavos, UUID/hash determinísticos, evento de criação/cancelamento, projeção única e reconciliação.
- Após o commit do pedido, um evento financeiro é enfileirado e sincronizado por `register_sale_financial_operation`.
- Cancelamento cria chave própria e usa `register_order_financial_cancellation`, com estorno por movimento original, mesma sessão/meio de pagamento e idempotência.
- Home, gráficos e consultas da IA usam a projeção financeira comum; o fallback local legado é explícito durante a migração.
- `TaskResolver`, `DraftEngine`, `RequirementEngine`, `EntityResolver` e `LoopGuard` foram consolidados sobre o núcleo existente.
- `ORDER.CREATE` aceita vários itens, “Sem peso”, preparação imutável, confirmação humana única, executor transacional compartilhado e abertura do pedido criado.
- “Fazer orçamento” abre a Calculadora mesmo com tarefa antiga ativa e sem peso; cálculos com peso/tempo usam `CalculatorDomain` e a configuração de filamento existente.
- Home, Pedidos, Estoque, Calculadora e Caixa possuem roteamento determinístico e cards/atalhos contextuais.
- O botão da IA preserva o arrasto por ponteiro, limites da área segura e posição por usuário.
- O checkout foi mantido exclusivo do Simplifica 3D; packs/runtimes de outros aplicativos não são carregados.

## Banco e segurança

- Migrations aplicadas no projeto Supabase vinculado:
  - `20260814230410_order_financial_cancellation_atomic.sql`
  - `20260814231901_normalize_financial_uuid_array_initializers.sql`
- Execução de RPCs financeiras foi revogada de `public`/`anon` e mantida para `authenticated`/`service_role`.
- O linter remoto não reporta problema nas RPCs de venda/cancelamento após a normalização.
- Permanecem fora deste escopo avisos antigos em `register_saas_client`, `redeem_promotional_token` e erro antigo em `storefront_publication_allowed` (`subscriptions.plan_slug`).

## Evals e builds

Passaram:

- lint JavaScript e TypeScript;
- E2E Gecinaldo: 10 chaveiros + 10 suportes, R$ 80, sem peso, uma tarefa, uma confirmação e uma execução;
- preparação, parity, shadow, live gate, idempotência, concorrência, rollback, persistência e compensação de crédito do pedido;
- roteamento de Home, Pedidos, Estoque, Calculadora e Caixa;
- Financial Core com R$ 10, R$ 80 e R$ 150, criação/cancelamento e reconciliação;
- fundação financeira/migrations, CalculatorDomain, taxa/tempo/lote, Pedido–Estoque–Calculadora, Caixa e UI V3;
- isolamento, Assistant Core, componentes e UX do botão arrastável;
- `npm run build:web` e `npm run android:apk`.

## Publicação e evidências

- PWA produção: `https://erpne3d.vercel.app`
- Deployment Vercel: `dpl_A1GS2itymGeM6EQqdqjy9Sk1vK5d`, estado `READY`.
- APK: `br.com.ne3d.erp`, `versionName 1.0.36`, `versionCode 64`.
- APK instalado via ADB no ASUS `RBAISCBR000F2X2` com sucesso.
- APK SHA-256: `4EA67D61EA5300371E6FE14F3E0F569168098B32527D4474AA75F065598E10A5`.
- Feed público Android: commit `6b9805d` em `everton191/NE3D-ERP.apk`, manifesto remoto `1.0.36/64` e APK de `36.755.417` bytes.

## Limites e teste manual

- O aparelho estava com Keyguard/tela bloqueada. A WebView confirmou pacote Android, módulos da IA e chat corretos, mas `document.visibilityState` permaneceu oculto; por isso o toque/arrasto visual e a conversa completa no display ainda precisam de confirmação manual com o aparelho desbloqueado.
- Não foram liberadas pela IA operações críticas de escrita em Estoque, Caixa, clientes, edição ou cancelamento. Elas permanecem `BLOCKED` no Capability Map; somente `ORDER.CREATE` usa o pipeline WRITE confirmado.
- O fallback de pedidos legados continua necessário até todos os dados históricos possuírem operação financeira canônica; o diagnóstico de reconciliação identifica faltas/divergências sem corrigir valores automaticamente.

## Documentos

- `SIMPLIFICA_AI_FUNCTIONAL_AUDIT.md`
- `SIMPLIFICA_AI_CAPABILITY_MAP.md`
- `SIMPLIFICA_AI_CORE_IMPLEMENTATION_REPORT.md`
- `docs/releases/1.0.36.md`
