# Etapa 1 — relatório de testes

## Resultado

- `node --check app.js`: passou.
- `npm.cmd run build:web`: passou.
- `git diff --check`: passou; apenas avisos de conversão LF/CRLF.
- 21 comandos da suíte selecionada passaram.
- `node scripts/test-manual-production-ui.js`: passou (o script existe, mas não possui alias npm).
- `test:order-stock-calculator-flow`: falhou por marcador preexistente ausente `id="calcBatchFields" hidden`; nenhum arquivo JS/HTML ou regra desse fluxo foi alterado.

Cobertura aprovada: Design System V2, shell, overflow, tema, responsividade, scroll técnico, safe area, estabilidade/render mobile, navegação, modos de interface, conta, Estoque, Produção, Loja pública, isolamento da Loja, Editor mobile/teclado/ações, saneamento e reestruturação.

## Verificação visual

A build foi servida em origem nova `http://127.0.0.1:4317`. O navegador abriu a tela de acesso, encontrou formulário de login e não reportou falha de carga. Screenshot: `%TEMP%/erpne3d-css-stage1-login.png`.

| Rota solicitada | Estado visual |
|---|---|
| Dashboard | não aberta: sessão autenticada indisponível |
| Novo pedido | não aberta: sessão autenticada indisponível |
| Usuário | não aberta: sessão autenticada indisponível |
| Segurança | não aberta: sessão autenticada indisponível |
| Relatórios | não aberta: sessão autenticada indisponível |
| Caixa | não aberta: sessão autenticada indisponível |
| Estoque | não aberta visualmente; contrato automatizado passou |
| Produção | não aberta visualmente; contrato automatizado passou |
| Loja pública | não aberta visualmente com uma loja publicada identificável; contratos automatizados passaram |
| Editor da Loja | não aberto: requer contexto/sessão; contratos automatizados passaram |

Não se declara ausência completa de regressão visual. A alteração removeu apenas declarações finais equivalentes e os testes relevantes passaram, mas a homologação autenticada/manual continua pendente.

## Publicação

Nenhum deploy, push ou alteração em Vercel/GitHub foi executado.
