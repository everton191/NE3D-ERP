# Validação final da Etapa 3

## Comandos aprovados

- `npm run lint`
- `npm run typecheck`
- `npm run test:ui-v3-foundation`
- `npm run test:ui-v3-reading`
- `npm run test:ui-v3-operational`
- `npm run test:ui-v3-finance`
- `npm run test:order-stock-calculator-flow`
- `npm run test:stock-stage-1`
- `npm run test:stock-batch-compact-ui`
- `node scripts/test-manual-production-ui.js`
- `npm run build`

O lint executa a validação sintática do monólito e o typecheck usa `tsconfig.ui-v3.json`, isolado das tipagens Node incompatíveis que já existiam no projeto. `git diff --check` também foi aprovado.

## Critérios

- telas selecionadas possuem raiz isolada `data-ui-version="v3"`;
- grid oficial é consumido por Configurações, leitura, Operacional e Financeiro;
- Relatórios usa área rolável para tabela e container de gráfico;
- Pedido mantém Manual/Calcular somente em Itens e usa barra de ação V3;
- CSS novo não foi anexado ao fim de `style.css`;
- CSS estrutural antigo equivalente saiu junto com cada lote;
- build aprovado e nenhum deploy realizado.

## Teste manual recomendado antes de publicar

Repetir em aparelho físico o teclado do Novo pedido, abrir edição/cancelamento do Caixa com autenticação sensível e capturar individualmente todas as larguras de 320 a 1920 px. Essas verificações dependem de dispositivo/sessão e não são substituídas pelos testes estáticos.
