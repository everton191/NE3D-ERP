# Estoque compacto e controle por rolo/lote

## Regra de responsabilidade

- A calculadora calcula peso, tempo, custo e preço.
- Gerar um cálculo ou orçamento não movimenta estoque.
- Os materiais usados são vinculados dentro do pedido.
- A baixa de estoque simples continua ligada ao status do pedido.
- O consumo automático por rolo/lote permanece desativado nesta etapa.
- Para itens por rolo/lote, o pedido mostra uma simulação ordenada pelo menor saldo.

## Tela de estoque

- A lista inicial mostra até seis itens.
- A seta `Ver todos` expande a lista; `Mostrar menos` recolhe.
- Busca mostra todos os resultados correspondentes.
- Entrada, saída, edição e exclusão ficam no menu de três pontos de cada item.
- O botão flutuante `+` abre o cadastro em modal.
- Não há formulário de cadastro rápido nem mensagens técnicas na tela principal.

## Rolos e lotes

- Um item pode ativar controle por rolo, lote, frasco ou pacote.
- Cada unidade mantém código, quantidade inicial, saldo, unidade, custo, data, status e observações.
- Somente um rolo/lote pode ficar marcado como `em_uso`.
- O total do item é a soma dos recipientes ativos com a mesma unidade.
- Alterações de rolo/lote geram registro no histórico local.

## Segurança desta etapa

Se um pedido tentar consumir automaticamente um item que já possui rolos/lotes, a operação é bloqueada com mensagem clara. Isso evita marcar o pedido como baixado sem alterar os rolos. A confirmação transacional por rolo deve ser ativada somente junto do backend, idempotência e logs por rolo.
