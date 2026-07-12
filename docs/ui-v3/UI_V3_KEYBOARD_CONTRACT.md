# Contrato de teclado UI V3

`src/ui-v3/hooks/keyboard.js` é a autoridade única. `visualViewport` publica `--ui3-keyboard-inset` e `data-keyboard-open`. Durante teclado aberto, bottom-nav e FAB são ocultados e não há transição de viewport.

`focusin` mantém o campo visível somente no scroller mais próximo. Chamadas são limitadas por tempo e usam `behavior:auto`, evitando animação e `scrollIntoView` repetitivo. Overlays preservam/restauram foco separadamente.
