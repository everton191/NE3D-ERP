# Auditoria UI / Design System - Simplifica 3D

Data: 2026-05-18

Objetivo: consolidar os padroes globais para evitar ajustes tela por tela e reduzir duplicacao visual.

## Componentes globais ja reutilizaveis

- Botao base: `.btn`, `.compact-action`, `.icon-action-button`.
- Cards: `.card`, `.metric`, `.settings-group`, `.list-row`.
- Header/paginas: `.card-header`, `.organized-page`, headers mobile da home/calculadora.
- Navegacao inferior: `getMobileBottomNavItems()` + `renderMobileBottomNav()`.
- Filtros/chips: `renderPedidoStatusChips()`, `renderEstoqueStatusChips()`, `renderCaixaFiltroChips()`, `.ui-tabs`.
- Busca: `.dashboard-search`, `.stock-search-field`.
- Listas: `.smart-order-row`, `.smart-stock-row`, `.cash-row`, `.client-admin-row`.
- Modais sensiveis: funcoes de popup/confirmacao existentes, com senha/PIN nas acoes criticas.

## Padrao visual oficial em uso

- Identidade principal: teal/azul petroleo (`#0F766E`, `#115E59`, `#134E4A`).
- Fundo: escuro SaaS/mobile (`#0B1120`, `#111827`).
- Status: verde normal, amarelo atencao/baixo, vermelho critico/perigo.
- Tipografia alvo: Inter, titulos 18/20, textos 13/14, labels 11/12.
- Botoes: compactos, maximo 48px, icone pequeno, sem largura total quando houver acoes lado a lado.
- Cards: radius 16px, borda leve, fundo escuro fosco, sombra discreta.

## Duplicacoes e riscos encontrados

- `app.js` ainda possui muitos `class="btn"` e `class="card"` escritos direto no HTML. Devem migrar gradualmente para helpers/componentes globais, sem reescrever telas inteiras.
- Algumas telas antigas ainda usam `settings-group` como card generico; manter por enquanto, mas alinhar padding/tamanho via CSS global.
- A navegacao inferior tinha CSS fixo para 5 itens enquanto o menu atual tem 4. Corrigido para 4 colunas.
- O banner da calculadora tinha seletor de perfil inline e picker paralelo. Isso causava clique piscando/sem abrir. Removido; troca fica somente em Configuracoes da Calculadora.
- Estoque ja tinha regras percentuais e reposicao inteligente, mas precisava encaixe visual no padrao mobile atual.

## Componentes que devem virar fonte unica nas proximas etapas

- `AppButton`: substituir combinacoes soltas de `.btn`, `.secondary`, `.ghost`, `.danger`.
- `AppCard`: encapsular card normal, metric, warning, danger e compact.
- `AppHeader`: padronizar voltar/menu, titulo e acao direita.
- `StatusChip`: unificar pedido, caixa e estoque.
- `FilterChips`: unificar filtros de pedidos, estoque, caixa, clientes e relatorios.
- `SearchBar`: unificar buscas por tela.
- `ConfirmActionModal`: unificar excluir/cancelar/apagar/alterar status.
- `EmptyState`: unificar estados vazios.
- `ListItemCard`: unificar pedidos, estoque, caixa, clientes e notificacoes.

## Ordem segura de migracao

1. Botões e icones compactos.
2. Cards/listas por tela prioritaria: Pedidos, Caixa, Estoque, Perfil/Planos.
3. Headers e bottom navigation.
4. Chips/status/filtros.
5. Inputs e busca.
6. Modais sensiveis.
7. Relatorios e telas secundarias.

## Validacoes obrigatorias

- APK: abrir home, calculadora, configuracoes da calculadora, estoque, pedidos e caixa sem crash.
- PWA: conferir dashboard, pedidos, estoque e caixa sem mistura entre telas.
- Android logcat: sem `FATAL EXCEPTION`, `ANR`, `SIGSEGV`.
- Build: `npm run build:web`, `npm run android:sync`, `npm run android:apk`.
