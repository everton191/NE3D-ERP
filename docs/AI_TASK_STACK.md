# Pilha de tarefas

Não existe TaskStack atualmente. O array de mensagens não representa tarefa.

Contrato alvo: uma `ActiveTask` possui `taskId`, intent, draft, slots e pending action. Subtarefas são empilhadas com `parentTaskId`, executam leitura/cálculo e retornam resultado estruturado sem substituir o draft pai.

Exemplo: `CREATE_ORDER -> ORDER.HISTORY -> PRICE.CALCULATE -> STOCK.SEARCH -> CREATE_ORDER`. Cancelar subtarefa retorna ao pedido; cancelar tarefa principal limpa pending action/draft após confirmação adequada.

Fase 1: a pilha executa e remove `ORDER.HISTORY`, `PRICE.CALCULATE` e `STOCK.SEARCH`, guarda resultados recentes e restaura `ORDER.CREATE`. Nenhuma subtarefa escreve no ERP.
