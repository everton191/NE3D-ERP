# Storefront Layout - Fase 4A

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
