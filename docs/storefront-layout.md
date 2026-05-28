# Storefront Layout - Fases 4A/4B

Data: 2026-05-27

## Objetivo

Padronizar zonas e grids para reduzir regressao mobile/desktop.

## Zonas oficiais

```txt
store-header
store-sidebar
store-content
store-products
store-filters
store-cart
store-footer
```

## Grid de produtos

Contrato inicial:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
```

Regras:

- mobile: 1 coluna;
- tablet: 2 colunas;
- desktop: auto-fit com minimo controlado;
- ultrawide: expansao progressiva sem layout mobile centralizado.

## Scroll

- storefront publica segue o scroller principal do App Shell;
- preview possui scroll proprio controlado;
- editor nao deve usar scroll do preview;
- drawers/modais usam camadas globais.

## Aplicacao inicial na Fase 4B

- header publico recebeu `store-header`;
- hero/secao de conteudo recebeu `store-content`;
- barra de categorias recebeu `store-filters`;
- grid publico recebeu `store-products`;
- rodape recebeu `store-footer`;
- painel admin recebeu `store-editor-zone`, `store-editor-panel` e `store-editor-content`;
- preview recebeu `store-preview-zone`, `store-preview-frame` e `store-preview-scroll`.

Essas classes sao pontes de migracao. A estrutura visual antiga continua existindo para evitar ruptura.

## Fase 4C - Layout do editor

O editor da loja usa um shell proprio:

- desktop: `store-editor-sidebar` + `store-editor-workspace`, com preview lateral quando a aba possui preview;
- tablet: workspace em uma coluna e preview empilhado quando a largura nao comporta o painel lateral;
- mobile: navegacao interna horizontal, acoes compactas e preview em bloco separado.

Preview lateral:

```css
.store-preview-panel {
  width: min(420px, 32vw);
  min-width: 360px;
  max-width: 480px;
}
```

Em larguras menores que o ponto seguro, o preview remove `sticky`, ocupa `100%` e deixa o scroll principal no App Shell.

As acoes do topo sao separadas em:

- primarias: abrir loja e ver como cliente;
- secundarias: sincronizar e copiar link;
- sistema: voltar ao resumo ERP.

Quando falta espaco, as acoes secundarias/sistema entram em `Mais acoes`.

## Fase 4D - Painel por aba

Cada aba do editor e encapsulada por:

```txt
store-editor-tab-panel
 ├── store-editor-tab-main
 └── store-preview-panel
```

Abas com preview proprio, como `overview`, `appearance` e `banner`, continuam usando o preview interno ja existente. As demais recebem `store-preview-panel` automaticamente para manter consistencia visual.

O preview agora preserva proporcao de device e evita scroll duplo:

- `store-preview-device` funciona como moldura;
- `store-preview-scroll` e o unico scroller interno do preview;
- tablet/mobile empilham preview em largura total.
