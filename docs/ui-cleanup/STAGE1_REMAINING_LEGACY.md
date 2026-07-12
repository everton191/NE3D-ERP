# Etapa 1 — legado restante

## Mantido deliberadamente

- grids locais ativos;
- todos os estilos de Novo pedido e Relatórios;
- cadeia estrutural de scroll/viewport;
- teclado, foco, safe area e bottom-nav;
- modais, popup legado, drawers e bottom sheets usados;
- formulários e componentes autenticados;
- breakpoints que não possuem corpo idêntico;
- regras `legacy`, hotfix e overrides com dependência incerta;
- tokens/contratos não carregados diretamente, mas usados por testes/documentação;
- CSS isolado da Loja pública e Editor.

## Dívida classificada

| Grupo | Estado | Próxima prova necessária |
|---|---|---|
| 46 duplicações de regra-folha detectadas pelo scanner simples | mistura de keyframes, contextos diferentes e candidatos | parser com contexto completo de `@media/@supports` e comparação de cascata |
| 2.236 usos de `!important` após limpeza (6 CSS carregados) | ativos/legados/patches | migração por tela e screenshot antes/depois |
| 189 media queries após limpeza | ativas e parcialmente concorrentes | matriz de viewport por rota |
| 45 breakpoints distintos em media queries | candidatos à consolidação | alinhar JS e CSS antes de alterar |
| contratos não importados | categoria 7, não mortos | decidir se continuam gates ou entram no bundle |
| regras tardias de Superadmin/calculadora/perfis | 4/8/11 | sessão autenticada e comparação PWA/APK |

Nenhuma dessas categorias é autorização para remoção automática na etapa seguinte.
