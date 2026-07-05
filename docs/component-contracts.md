# Component Contracts - Fase 3B

Data: 2026-05-27

## Regras globais

Todo componente novo deve:

- usar tokens de `docs/theme-tokens.md`;
- seguir `docs/ui-component-standards.md` para botoes, cards, fontes, icones e scroll;
- consultar `docs/icon-system-registry.md` antes de escolher ou criar icone;
- usar spacing oficial;
- usar radius oficial;
- usar shadows oficiais;
- respeitar `max-width:100%` e `min-width:0`;
- funcionar em mobile e desktop;
- nao criar `z-index` numerico novo;
- nao escrever em `#popup`.

## Button

Classe base:

```css
.ds-button
```

Variantes:

- `.primary`
- `.secondary`
- `.ghost`
- `.danger`
- `.success`

Estados esperados:

- hover/focus: realce leve;
- active: resposta curta;
- disabled: opacidade reduzida e sem sombra forte.
- reduced motion: sem animacao obrigatoria.

## Card

Classe base:

```css
.ds-card
```

Variantes:

- `.elevated`
- `.compact`
- `.interactive`
- `.premium`

Regra: card nunca deve criar overflow horizontal.

## Input

Classes:

```css
.ds-input
.ds-select
.ds-textarea
.ds-field
```

Estados:

- focus;
- error;
- disabled;
- placeholder legivel em dark/light.

## Modal

Classe base:

```css
.ds-modal
```

Estrutura:

```txt
ds-modal
 ├── ds-modal-header
 ├── ds-modal-body
 └── ds-modal-footer
```

Regra: modais novos usam `openModal()` e `#modal-layer`.

## Badge

Classe base:

```css
.ds-badge
```

Variantes:

- `.success`
- `.warning`
- `.danger`
- `.premium`

## Table

Classe base:

```css
.ds-table
```

Regra: tabelas complexas devem ter wrapper proprio em fases futuras para mobile.

## Navigation

Classes:

```css
.ds-nav-item
.ds-topbar-action
```

Regra: item ativo deve usar `accent-primary` e nao cor hardcoded.

## Empty/Loading

Classes:

```css
.ds-empty-state
.ds-error-state
.ds-skeleton
.ds-loader
```

Regra: loaders devem usar animaçoes leves e respeitar `prefers-reduced-motion` nas fases de polimento.

## Motion

Tokens:

```css
--transition-fast
--transition-base
--transition-slow
```

Contratos:

- hover usa transform/box-shadow/border-color;
- active usa escala discreta;
- focus usa `--effect-focus-ring`;
- animacoes de entrada usam distancia curta;
- skeleton usa varredura discreta;
- todos os novos componentes respeitam `prefers-reduced-motion`.

## Densidade

Regras:

- botoes novos usam `.s3d-button` com `data-ui-size="compact|standard|large"`;
- cards novos usam `.s3d-card` com `data-ui-size="compact|standard|large"`;
- os tamanhos oficiais ficam em `UI_COMPONENT_SIZE_RELATIONS` e nos tokens `--s3d-button-*` / `--s3d-card-*`;
- mobile e desktop usam os mesmos nomes de variante, mudando apenas os valores dos tokens;
- cards e grids usam `clamp()` apenas em gaps, nao em fonte fluida;
- botoes mantem area minima de toque;
- empty states usam texto curto e CTA claro;
- tabelas devem preservar leitura e evitar linhas comprimidas.
