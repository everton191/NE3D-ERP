# Roteiro de teste no emulador — melhorias operacionais

Data: 2026-07-23

## Pré-condições

- Instalar o APK gerado nesta rodada.
- Usar uma conta de teste com acesso a Pedidos, Estoque, Produção e Caixa.
- Cadastrar pelo menos um material e uma impressora manual.
- Não usar dados indispensáveis: cancelamento e baixa de estoque fazem alterações reais na conta conectada.

## 1. Histórico operacional

1. Criar um pedido com cliente, item, prazo, material, tempo e entrada.
2. Abrir o detalhe do pedido.
3. Confirmar a seção **Histórico operacional**.
4. Verificar os eventos de criação e recebimento.
5. Alterar o status e abrir novamente o detalhe.
6. Confirmar o evento com status anterior e novo.
7. Liberar o pedido para produção.
8. Confirmar eventos de estoque e produção no mesmo histórico.

Resultado esperado: eventos aparecem do mais recente para o mais antigo, com data,
descrição e origem visual distinta.

## 2. Rentabilidade

1. No detalhe do pedido, localizar receita, custo estimado, lucro e margem.
2. Comparar a receita com o total do pedido.
3. Alterar peso, tempo ou preço do item e salvar após a revisão.
4. Confirmar que os indicadores são recalculados.

Resultado esperado: valores internos são atualizados, mas não são incluídos no PDF
ou na mensagem enviada ao cliente.

## 3. Capacidade produtiva

1. Abrir Produção.
2. Confirmar os indicadores de fila, carga estimada, capacidade e atrasos.
3. Adicionar ou desativar uma impressora e revisar a capacidade.
4. Criar tarefas com prazo passado e futuro.

Resultado esperado: a carga considera tarefas ativas e a capacidade divide as horas
pelas impressoras disponíveis, ignorando máquinas inativas ou em manutenção.

## 4. Tempo estimado versus real

1. Atribuir uma impressora a uma tarefa.
2. Alterar o status para **Em impressão**.
3. Depois, alterar para pós-processamento, controle de qualidade ou pronto.
4. Conferir os campos **Tempo estimado** e **Tempo real**.

Resultado esperado: o tempo real é calculado entre início e conclusão e mostra a
variação percentual. Pausas não são descontadas nesta versão.

## 5. Regressões

- Criar e editar pedido.
- Gerar PDF.
- Abrir WhatsApp.
- Cancelar um pedido de teste e conferir estorno/devolução quando aplicável.
- Verificar scroll do detalhe em retrato e paisagem.
- Fechar e reabrir o aplicativo para confirmar persistência local.
- Testar offline e, depois, reconectar para observar a fila de sincronização.

## Evidências a registrar

- Captura do histórico operacional.
- Captura da rentabilidade.
- Captura da capacidade produtiva.
- Captura do tempo estimado versus real.
- Mensagens de erro, caso ocorram.
