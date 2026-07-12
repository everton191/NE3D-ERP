# Matriz de testes UI V3

| Viewport | Grid esperado | Verificar |
|---:|---:|---|
| 320, 360, 390, 412, 480 | 4 | texto longo, formulário, nav, dialog central, sheet, drawer |
| 768 | 8 | spans e tabela |
| 1024, 1280, 1440, 1920 | 12 | max-width, cards e sticky actions |

Em todos: um scroller, sem overflow horizontal da página, foco preso/restaurado, Escape/voltar, safe area, fonte 125%, estados vazio/erro/loading e console sem erros. A execução real deve ser registrada no relatório da etapa.

## Execução de 2026-07-12

Todos os dez viewports retornaram exatamente 1 proprietário de scroll, overflow horizontal 0 e colunas 4/8/12 nas faixas previstas. Em 390x844: dialog alinhado ao centro e foco inicial em “Fechar”; sheet alinhado ao fim; drawer alinhado ao início; Escape fechou cada overlay; fonte ampliada resultou em 20px (125%). Console sem erros. Screenshot: `%TEMP%/erpne3d-ui-v3-390.png`.

Teclado virtual real e botão voltar Android ainda exigem aparelho físico; o contrato automatizado cobre `visualViewport`, debounce, histórico, foco e Escape.

Gate regressivo: 21 testes selecionados passaram, incluindo shell, overflow, scroll, safe area, rotas públicas da Loja e Editor. `build:web`, `node --check` e `git diff --check` passaram. O projeto não define comandos `lint` ou `typecheck` no `package.json`; essa ausência foi registrada, não simulada.
