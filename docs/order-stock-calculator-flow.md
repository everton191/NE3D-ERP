# Calculadora, pedidos e estoque

## Responsabilidades

- Calculadora: simula preço, horas/minutos e lote. Não movimenta estoque.
- Pedido: recebe o cálculo e registra os materiais realmente usados.
- Estoque: valida saldo e registra toda entrada, saída, baixa ou devolução.

## Impressão em lote

O campo de quantidade só aparece quando `Impressão em lote` está marcado. Peso e tempo representam o lote completo; apenas o valor total é dividido pelas unidades.

## Materiais do pedido

Cada material guarda `materialId`, `quantidade` e `unidade`. Registros antigos em gramas continuam normalizados para a unidade do item.

## Baixa

Rascunhos e pedidos abertos não baixam estoque. A baixa ocorre ao entrar em estado confirmado, aprovado, em produção ou posterior. Edição aplica somente a diferença e cancelamento pode gerar devolução vinculada ao pedido.

## Contratos visuais

- Check de lote: `.calc-batch-toggle`
- Campo condicional: `.calc-batch-fields`
- Materiais do pedido: `.order-stock-materials-title`
- Ações rápidas do estoque: `.stock-row-quick-actions`
