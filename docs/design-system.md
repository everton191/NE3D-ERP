# Design System - Fase 3A

Data: 2026-05-27

Escopo: fundacao visual global. Esta fase nao reescreve componentes completos.

## Objetivo

Criar um contrato visual unico para ERP, PWA/APK e storefront:

- temas controlados;
- tokens globais;
- spacing system;
- radius system;
- shadow system;
- tipografia base;
- layout tokens.

## Arquitetura

```txt
themes/
 ├── base/tokens.css
 ├── dark/tokens.css
 ├── light/tokens.css
 └── premium/tokens.css
```

`style.css` continua sendo o arquivo ativo da aplicacao nesta fase. Os arquivos em `themes/` documentam e preparam a separacao futura sem mudar o pipeline.

## Regras

Novo CSS deve preferir tokens:

- `var(--bg-primary)` em vez de cor direta de fundo;
- `var(--card-bg)` para superficies;
- `var(--text-primary)` e `var(--text-secondary)` para textos;
- `var(--space-*)` para gaps, paddings e margins;
- `var(--radius-*)` para cards, botoes, inputs e modais;
- `var(--shadow-*)` para profundidade;
- `var(--accent-primary)` e `var(--accent-secondary)` para acoes e destaques.

## Areas cobertas nesta fase

- App Shell;
- sidebar base;
- topbar base;
- overlay/modal/drawer layers;
- tokens globais criticos.

## Fora do escopo desta fase

- reescrever componentes;
- modularizar storefront/editor;
- refatorar planos;
- dividir `app.js`;
- limpar todos os hardcodes antigos.

