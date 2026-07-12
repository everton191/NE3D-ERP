# Etapa 1 — remoções seguras

Somente duplicações exatas foram removidas. Não houve remoção de arquivo/import nem de bloco não idêntico.

| Arquivo | Linhas originais | Seletor/bloco | Motivo | Evidência | Dependências verificadas |
|---|---:|---|---|---|---|
| `style.css` | 587–607 | contraste mobile da calculadora (5 regras) | duplicado idêntico | mesmas declarações reaparecem em 47174–47193, no mesmo `@media(max-width:767px)`, após regras dark históricas | busca em `app.js`, testes de calculadora/mobile, cascata e build; regra exclusiva de headings preservada |
| `src/styles/google-expressive-motion.css` | 543–550 | transition de controles com `gxm-force-motion` | duplicado idêntico | regra global idêntica em 570–577 é posterior e prevalece também sob reduced motion | teste de motion, estabilidade mobile e responsividade |
| `src/styles/google-expressive-motion.css` | 552–558 | transition de cards com `gxm-force-motion` | duplicado idêntico | regra global idêntica em 579–585 é posterior e prevalece também sob reduced motion | teste de motion, estabilidade mobile e responsividade |

## Lotes sem remoção

- Arquivos/imports mortos: nenhum comprovado. Todos os CSS vazios: zero.
- Blocos completamente sobrescritos não idênticos: nenhum atingiu evidência suficiente sem validação autenticada. Foram preservados.

Resultado do diff efetivo: 37 linhas removidas e 1 comentário substituído, redução líquida de 36 linhas pela contagem textual.
