# Etapa 1 — classificação do CSS histórico

Data: 2026-07-12. Branch: `codex/css-safe-cleanup-stage1`. Método: ordem de carga do `index.html`, busca em HTML/JS/TS/templates, renderizadores, scripts de build/teste e análise conservadora da cascata.

## Classificação por família

| Família/arquivo | Classificação | Decisão nesta etapa |
|---|---|---|
| `style.css` — shell, navegação, formulários, rotas ERP | 1 ativo e necessário; 2 legado utilizado; 9 ERP; 11 consolidação | preservar |
| `style.css` — Loja/editor ainda presentes | 2 legado utilizado; 10 Loja; 11 consolidação | preservar; renderizadores e testes ainda referenciam classes |
| `themes/base/design-system-v2.css` | 1 ativo e necessário | preservar; carregado e precacheado |
| `src/storefront/styles/{tokens,components,layouts}.css` | 1 ativo; 10 Loja | preservar; carregados, copiados e testados |
| `src/styles/google-expressive-motion.css` | 1 ativo; 3 duplicado idêntico; 11 consolidação | remover apenas duas regras repetidas |
| `themes/{base,dark,light,premium}/tokens.css` | 7 não importado diretamente; 11 consolidação | preservar: testes e autoridade de tema os leem |
| `components/**/contract.css` | 7 não importado diretamente; 11 consolidação | preservar: contratos documentais/testados, não arquivos mortos |
| `modules/**/contract.css` | 7 não importado diretamente; 10 Loja; 11 consolidação | preservar: contratos de arquitetura/testes |
| blocos finais marcados “Final”, “Hotfix”, “override” | 4 parcialmente sobrescrito; 8 patch temporário | preservar quando há diferença ou dependência incerta |
| scroll, viewport, bottom-nav, teclado, overlays | 1/2/4 | preservação obrigatória pelo escopo |
| Novo pedido, Relatórios, formulários | 1/2/4/9 | preservação obrigatória pelo escopo |

## Classes sem referência literal

Nenhuma foi removida somente por ausência em HTML estático. `app.js` monta nomes e markup por template strings, rotas condicionais e perfis (`mobile-mode`, `viewport-*`, `data-ui-profile`); Loja e Editor possuem renderizadores separados. Classes sem ocorrência direta ficaram na categoria 6 até uma validação autenticada e instrumentada provar que são inalcançáveis.

## Candidatos futuros

- regras repetidas com corpos diferentes: 4/11, não removíveis;
- pares 760/767/768 e 860/900: 11, exigem contrato antes de consolidação;
- contratos não importados: 7, mas não 12, pois funcionam como artefatos de arquitetura e gates;
- patches finais: 8/11, dependem de comparação visual antes de mover/remover.
