# Auditoria de teclado e foco

## Sistemas encontrados

- `src/services/safeAreaManager.js` mede/aplica insets globais.
- `app.js` contém focos programáticos, scrolls e listeners ligados a renderizações/fluxos.
- CSS global reage a `.keyboard-visible` e muda a bottom-nav.
- editor V3 mantém estado próprio (`data-store-editor-keyboard-open`, inset e `visualViewport`) e scroll padding.
- vários overlays e rerenders de SPA não compartilham política de preservação de foco.

## Causas prováveis

| Sintoma | Causa técnica provável |
|---|---|
| tela sobe | resize do `visualViewport` + ajuste automático do navegador + mudança simultânea de inset/padding |
| tela treme | listeners de resize e renderizações recalculam altura/scroll em sequência |
| input perde foco | substituição de `innerHTML`, re-render completo, chave/etapa dinâmica ou fechamento/reabertura de overlay |
| conteúdo reposiciona | alternância de classe de teclado, `100vh/100dvh`, fixed/sticky e `scrollIntoView` concorrentes |
| campo sob bottom-nav | padding aplicado em container diferente do scroller real ou nav não ocultada no estado correto |

## Risco por tela piloto

Novo pedido combina etapas, barra final e possíveis rerenders de cálculo; é o maior risco de perda de foco. Segurança/Usuário usam subscreens e cards com ações, podendo esconder a nav mas manter offsets antigos. Store editor tem tratamento próprio mais completo, porém não deve ser usado como política global sem isolamento.

## Contrato necessário

Uma única fonte deve publicar `--keyboard-inset`, sem executar scroll durante cada evento intermediário do viewport. O elemento focado deve sobreviver a alterações de estado; quando isso não for possível, restauração deve ser explícita. O scroller oficial recebe `scroll-padding-bottom = nav + safe-area + keyboard`, e overlays tratam seu próprio scroller. Listeners devem ser registrados uma vez e removidos simetricamente.
