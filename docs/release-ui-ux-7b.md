# Fase 7B - UI/UX, tema claro e estabilizacao pre-release

Data: 2026-05-30

## Escopo

Esta fase ficou limitada a ajustes visuais, responsividade, cache PWA e estabilidade de feedback visual. Nao foram alteradas regras de negocio, Supabase, Mercado Pago, IA futura, integracoes Google, webhooks ou migrations.

## Correcoes aplicadas

- Tema claro recebeu camada final de contraste para cards, inputs, placeholders, tabelas/painels, pedidos, planos, perfil, loja/admin e Superadmin.
- Modulo de pedidos recebeu reforco visual para lista, detalhe, resumo financeiro, barra inferior, filtros, chips, calculadora integrada e estados em mobile.
- Menu lateral recebeu ajuste de alinhamento, area clicavel, contraste dos icones e labels com truncamento seguro.
- Avatares e indicadores de plano mantem cores visuais por plano: Free verde, Start roxo e Pro preto/dourado.
- Tela de planos recebeu reforco de contraste, bordas, wrapping de textos e responsividade sem alterar preco ou regra comercial.
- Toasts de salvamento/loading agora possuem timeout de seguranca para nao ficarem presos se a limpeza manual falhar.
- PWA/cache foi atualizado para `simplifica-3d-v123-estavel-20260530-ui-ux-7b`.

## Arquivos alterados

- `app.js`
- `style.css`
- `index.html`
- `sw.js`
- `scripts/test-restructuring-checks.js`
- `scripts/test-project-saneamento.js`
- `scripts/test-storefront-pwa-upgrade.js`
- `docs/release-ui-ux-7b.md`

## Validacao visual

Checklist manual recomendado para homologacao final:

- Tema claro: Dashboard, Pedidos, Clientes, Estoque, Caixa, Relatorios, Loja Online, Perfil, Planos, Producao, Calculadora 3D e Super Admin.
- Pedidos: lista, novo pedido, edicao, visualizacao, popup de itens, cliente, totais, descontos, status e formas de pagamento.
- Toast de salvamento: salvar pedido, perfil, configuracoes e loja.
- Responsividade: 320, 360, 390, 412, 768, 1024, 1366, 1440 e 1920 px.
- Loja Online: criacao, edicao, preview e publicacao sem alteracao funcional.

## Screenshots

- Smoke local do app servido a partir de `dist/`: `docs/screenshots/phase7b-auth-smoke.png`.
- As telas autenticadas devem ser conferidas manualmente no ambiente com sessao real. A validacao automatizada local fica limitada ao carregamento, ausencia de overflow e consistencia de tema.

## Riscos restantes

- Areas autenticadas dependem de sessao real para inspecao visual completa.
- O APK final deve ser regenerado na etapa de release final se esta fase for distribuida em Android.
- As correcoes sao visuais e nao substituem homologacao em aparelho fisico.

## Checklist de aprovacao para Release Final

- [ ] Tema claro legivel nas telas principais.
- [ ] Pedidos sem textos invisiveis ou botoes cortados.
- [ ] Toast "Salvando" nao fica preso.
- [ ] Menu lateral alinhado no desktop.
- [ ] Mobile sem overflow horizontal nas larguras-alvo.
- [ ] Loja/editor visualmente estaveis.
- [ ] PWA carregando cache `v123`.
- [ ] Build web concluido.
