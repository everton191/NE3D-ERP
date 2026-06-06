# Validacao complementar de menus expansveis - 2026-06-06

## Menus que usam popup ou flyout sobreposto

| Menu | Implementacao | Arquivo |
|---|---|---|
| Mais acoes do editor da loja | `details.ui-context-menu` + painel absoluto | `app.js` |
| Mais acoes da visao geral da loja | `details.ui-context-menu` + painel absoluto | `app.js` |
| Mais acoes de produto no desktop | `details.ui-context-menu` + painel absoluto, com abertura para cima quando necessario | `app.js` |
| Acoes de produto no mobile | drawer/bottom sheet por toque | `app.js` e `style.css` |
| Perfil da topbar | popup/modal existente | `app.js` |

Os paineis `.ui-context-menu-panel` usam `position:absolute` no desktop e
`position:fixed` em dispositivos touch. Eles ficam sobrepostos e nao alteram
largura ou altura do layout principal.

## Menus que permaneceram no modelo anterior

- Sidebar desktop: continua como navegacao primaria com grupos expansivos.
  Converter para flyout mudaria o fluxo principal e prejudicaria leitura.
- Drawer mobile: continua sendo navegacao primaria por toque.
- Barra inferior mobile: continua com acesso direto as funcoes principais.
- Menu publico mobile da loja: continua como navegacao principal do header.
- Perfil da topbar: continua usando o sistema de popup/modal existente.

## Contrato desktop

Para `.ui-context-menu`:

- hover somente com `(hover: hover) and (pointer: fine)`;
- abertura apos 100ms;
- fechamento apos 180ms;
- `focusin` abre;
- foco ou mouse dentro preservam o popup aberto;
- Escape fecha e devolve foco ao gatilho;
- clique fora fecha;
- troca de rota fecha;
- painel usa scroll interno e nao bloqueia scroll da pagina.

## Contrato mobile/touch

- primeiro toque no `summary` abre pelo comportamento nativo de `details`;
- nao exige toque continuo;
- opcoes executam a acao normal;
- toque fora fecha;
- troca de rota fecha;
- botao voltar fecha o popup antes de navegar;
- painel touch usa `position:fixed`, Safe Area e itens com minimo de 44px;
- barra inferior mobile permanece navegacao direta.

## Acessibilidade

O gerenciador sincroniza dinamicamente:

- `aria-expanded`;
- `aria-controls`;
- `aria-haspopup="menu"`;
- `role="menu"`;
- `role="menuitem"`.

Os popups contextuais podem ser usados por mouse, teclado e toque. A estrutura
semantica e os atributos permitem interpretacao por leitor de tela, mas a
homologacao com leitor de tela real permanece pendente.

## Validacao Web/PWA local

- o build `dist/` foi gerado e carregou corretamente em servidor local limpo;
- a tela de acesso abriu sem regressao estrutural;
- os menus internos exigem sessao autenticada, portanto a interacao visual real
  deles continua pendente;
- os contratos de hover, foco, toque, acessibilidade, rota, voltar e Safe Area
  foram validados pelo teste `test:context-menu-contract`.

## Pendencias de homologacao real

- Samsung com botoes virtuais;
- Asus com botoes virtuais;
- Android com navegacao por gestos;
- APK com teclado aberto;
- PWA instalada;
- barra inferior;
- gesto de voltar;
- popup aberto;
- orientacao retrato e paisagem;
- leitor de tela real.
