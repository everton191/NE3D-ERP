# Auditoria de overlays

| Família | Arquivo/origem | Pai/Portal | posição/camada | scroll/bloqueio/foco/voltar |
|---|---|---|---|---|
| modal oficial do shell | `app.js`, `#modal-layer` em `index.html` | DOM layer (não React Portal) | stage/backdrop fixed; token modal | painel pode rolar; bloqueio depende do helper; restauração de foco e voltar não são contrato universal |
| popup legado | `app.js`, `#popup` | filho direto do documento | `.popup/.modal-backdrop`, regras locais | comportamento varia por fluxo; sobrescrita entre popups possível |
| DS Modal | `src/shared/design-system/components/Modal.js` | retorna HTML/contrato, não Portal de framework | depende das classes globais | só vale para consumidores explícitos |
| DS BottomSheet | `src/shared/design-system/components/BottomSheet.js` | HTML/contrato | bottom fixed | não substitui sheets legados |
| drawer mobile | `app.js`, `#drawer-layer/#overlay-layer` | camadas do shell | fixed, token drawer | scroll interno; bloqueio quando `app-layer-open` é aplicado |
| drawers operacionais | `app.js` + `.operational-drawer-*` | DOM local/camada variável | fixed | política varia |
| storefront modal/cart | renderizadores V3 + `src/storefront/styles/layouts.css` | dentro do renderer | fixed, z-index 300/80 | painel rola; política própria |
| menus/dropdowns/perfil | `app.js` | popup ou DOM próximo | absolute/fixed e z-index local | normalmente sem foco restaurado/voltar |
| toast | `mostrarToast`, `#toast-layer/#toastArea` | camada de toast | fixed/token toast | não bloqueia página |

## “Modo de uso” próximo à barra inferior

A causa provável é uso de uma família bottom-sheet/popup contextual em vez do stage central oficial, combinado com pai/containing block e regras mobile tardias. Como o projeto mantém `#popup`, `.bottom-sheet`, backdrops de perfil e modais oficiais simultaneamente, o mesmo seletor pode receber posicionamento de sheet no mobile. Se renderizado dentro de um container transformado/posicionado, `position:fixed` também pode se comportar relativamente a esse ancestral. O fluxo deve ser rastreado até o helper que escreve o seletor; apenas trocar `align-items` não resolve a origem.

## Lacunas transversais

Não há garantia comum de: Portal para `document.body`, trap/restauração de foco, Escape/back Android, bloqueio idempotente de scroll, `aria-modal`, título associado e pilha de overlays. Esses itens precisam entrar na API única antes da migração visual.
