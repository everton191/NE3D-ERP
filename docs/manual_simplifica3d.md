# Manual interno do Simplifica 3D

## Pedidos
O sistema permite criar pedidos com nome do cliente, lista de itens, quantidade, valor unitario, subtotal por item e total geral. Um pedido so deve ser salvo depois da revisao final. Ao editar, o usuario pode adicionar, alterar ou remover itens e confirmar as mudancas antes de sincronizar.

## Estoque
O estoque registra materiais de impressao 3D e suas quantidades em kg. Acoes de edicao e remocao sao protegidas por biometria quando disponivel ou senha como fallback.

## Caixa
O caixa registra entradas e saidas. Pedidos fechados geram entrada vinculada ao pedido. Movimentos podem ser removidos por usuario autorizado.

## Calculadora
A calculadora estima o custo e o preco de itens impressos em 3D usando peso, filamento, tempo em horas, energia, consumo, custo hora, margem, quantidade e taxa extra. Peso, horas e taxa extra sao campos variaveis e devem ser limpos a cada novo calculo.

## Impressoras
O app possui perfis de impressoras com consumo em watts e custo hora padrao. O usuario pode escolher a impressora para preencher consumo e custo hora na calculadora.

## Planos
O plano gratis mantem a calculadora liberada. O plano completo libera pedidos, estoque, caixa, PDF com Pix, WhatsApp, marca no PDF e sincronizacao entre Android e Windows/navegador.

## Anuncios
O app pode registrar sugestoes e feedbacks locais para orientar melhorias. Esses registros ficam no aparelho e podem entrar no backup.

## Sincronizacao
A sincronizacao pode usar URL de nuvem ou pasta do Google Drive no navegador compativel. O app envia pedidos, estoque, caixa, historico, sugestoes e configuracoes sem salvar token dentro do backup.

## Personalizacao
O usuario pode ajustar nome do app, empresa, WhatsApp, rodape do PDF, Pix, tema, cor principal, marca, escala da interface e valores padrao da calculadora.

## PDF
O PDF do pedido usa dados do cliente, itens, total, marca, rodape e dados de Pix quando configurados. O PDF exige itens no pedido.

## Superadmin
O dono e o admin local podem gerenciar usuarios, dono do sistema, configuracoes comerciais, licenca local e dados sensiveis. A senha atual continua como fallback quando a biometria nao estiver disponivel.
