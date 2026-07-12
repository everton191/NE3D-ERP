# Auditoria estrutural da interface

## Estrutura encontrada

- SPA sem framework de UI: `index.html`, `app.js` e `style.css`.
- Capacitor 8 fornece o invólucro Android; o build web é preparado por `scripts/prepare-web.js`.
- O shell central é `#app-shell`, com conteúdo em `#app`, camadas próprias de overlay, drawer e modal.
- A navegação desktop é renderizada em `.desktop-shell`; no mobile, `.mobile-bottom-nav` é fixa.
- O tema é controlado por atributos no `body` e tokens em `themes/**` e `style.css`.
- Componentes compartilhados existem em `src/shared/design-system/components` e contratos CSS em `components/**`.

## Largura, altura e rolagem

O documento é o proprietário da rolagem vertical das páginas. Somente overlays, drawers, modais e painéis de detalhe possuem rolagem interna. `#app`, shell, grids e seus filhos agora possuem limites e `min-width: 0` explícitos. A altura usa `100dvh` com fallback `100vh`.

## Navegação e overlays

As camadas seguem os tokens `--z-overlay`, `--z-drawer`, `--z-modal`, `--z-toast` e `--z-critical`. A navegação inferior usa safe area e o conteúdo reserva sua altura. Modais e drawers são limitados pela viewport dinâmica.

## Tokens e duplicações

Havia medidas equivalentes sob nomes diferentes (`--desktop-max-width`, `--page-max-width`, `--content-max-width` e alturas da navegação). Os tokens `--layout-*` passam a ser o contrato estrutural sem remover aliases legados, preservando compatibilidade. Regras específicas de PWA/APK foram mantidas porque controlam densidade e capacidade, não regras de negócio.

## Riscos

`style.css` é extenso e possui regras tardias por perfil. A fundação foi inserida junto ao shell para reduzir especificidade, mas a inspeção visual autenticada continua necessária para conteúdo dependente de dados.
