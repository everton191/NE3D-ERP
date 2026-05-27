# Spacing System - Fase 3A

Data: 2026-05-27

## Escala oficial

```css
--space-xxs: 2px
--space-xs:  4px
--space-sm:  8px
--space-md:  12px
--space-lg:  16px
--space-xl:  22px
--space-2xl: 30px
```

## Uso recomendado

- `--space-xs`: icones, gaps internos pequenos.
- `--space-sm`: botoes compactos, linhas de lista.
- `--space-md`: formularios, cards pequenos.
- `--space-lg`: secoes, modais e paineis.
- `--space-xl`: separacao entre blocos.
- `--space-2xl`: respiro de paginas e overlays.

## Radius

```css
--radius-sm
--radius-md
--radius-lg
--radius-xl
--radius-pill
```

## Shadows

```css
--shadow-xs
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

## Regra

Evitar novos valores como `padding:7px`, `margin:13px` ou `border-radius:11px`. Se o valor for recorrente, ele deve virar token.

