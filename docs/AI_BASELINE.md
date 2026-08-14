# Baseline da IA do Simplifica 3D

Data: 2026-08-12. Escopo: somente `C:\Users\PAESS\OneDrive\Documentos\erpNE3d`.

## Git

- Branch: `main`.
- Commit: `1fc404b26054ea650ebb58852a69bed7f8c940cb`.
- Working tree inicial: já continha arquivos não rastreados, preservados: `.codex-remote-attachments/`, `docs/bambu-printer-pilot.md`, `docs/diagnostico-espaco-disco-c-2026-07-23.md`, `document.documentElement.clientWidth`, `output/`, scripts de piloto, `tmp/` e `training/`.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `node --check app.js` | OK |
| `npm.cmd run build:web` | OK; `dist/` preparado |
| `npm.cmd run typecheck` | OK |
| `npm.cmd run test:simplifica3d-ai` | OK; contrato estático atual |
| `test:order-stock-calculator-flow` | OK |
| `test:calculator-domain` | OK |
| `test:operational-core-phase2` | OK |
| `test:stock-stage-1` | OK |
| `test:plan-capabilities` | OK |
| `test:sensitive-action-guards` | OK |

Não existe comando agregado `npm test`. O ADB foi consultado, mas não havia device/emulador conectado. O APK, a instalação, a abertura real e a inferência em aparelho não foram executados nesta auditoria. Logo, “modelo responde” não está comprovado ao vivo.

## Comportamento atual

O chat abre apenas no Android quando o plugin externo informa `modelReady`. Ele conserva até 40 mensagens no `localStorage`, envia só as últimas 12 ao modelo e aceita uma única ação JSON. Leituras de caixa, estoque baixo e produção funcionam sobre snapshots do estado global. Qualquer escrita aceita pelo registro termina no erro “Executor de alteração ainda precisa ser conectado...”.

## Warnings e lacunas

- O teste de IA é predominantemente contratual/regex; não prova provider, modelo, conversa contínua ou escrita.
- O modelo está fora deste checkout, atrás de um ContentProvider externo.
- O app chama o modelo de “Gemma 4 E2B”, mas formato, hash, quantização e parâmetros não são verificáveis aqui.
