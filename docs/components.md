# Components - Fase 3B

Data: 2026-05-27

Escopo: fundacao de componentes visuais. Nao e migracao completa da UI.

## Estrutura

```txt
components/
 ├── buttons/contract.css
 ├── cards/contract.css
 ├── inputs/contract.css
 ├── modals/contract.css
 ├── badges/contract.css
 ├── tables/contract.css
 ├── navigation/contract.css
 ├── empty-states/contract.css
 └── loaders/contract.css
```

## Prefixos

- `ds-*`: contrato oficial do design system.
- `app-*`: ponte para uso gradual dentro do app atual.
- Classes antigas como `.btn`, `.card`, `.modal-card` e `.status-badge` continuam funcionando ate migracao tela por tela.

## Componentes definidos

| Componente | Classe base | Variantes iniciais |
| --- | --- | --- |
| Button | `.ds-button` | `primary`, `secondary`, `ghost`, `danger`, `success` |
| Icon button | `.ds-icon-button` | base compacta |
| Card | `.ds-card` | `elevated`, `compact`, `interactive`, `premium` |
| Input | `.ds-input` | base |
| Select | `.ds-select` | base |
| Textarea | `.ds-textarea` | base |
| Modal | `.ds-modal` | header/body/footer |
| Badge | `.ds-badge` | `success`, `warning`, `danger`, `premium` |
| Table | `.ds-table` | base responsiva |
| Navigation | `.ds-nav-item` | `active` |
| Empty state | `.ds-empty-state` | `error` |
| Loader | `.ds-loader`, `.ds-skeleton` | base |

## Migracao controlada

Nesta fase os contratos existem e podem ser usados em novas telas. Migracoes amplas ficam para fases futuras.

Prioridade de migracao futura:

1. App Shell, sidebar, topbar e camadas.
2. Cards principais e estados vazios.
3. Forms simples.
4. Modais leves ja migrados para `modal-layer`.
5. Tabelas/listas nao criticas.

Nao migrar ainda:

- pedidos criticos;
- caixa;
- planos/billing;
- storefront editor;
- autenticaçao.

