# Manual interno do Simplifica 3D

O Simplifica 3D organiza a gestão de negócios de impressão 3D com pedidos, estoque, caixa, calculadora, PDFs, sincronização e personalização.

## Pedidos
- Um pedido guarda cliente, telefone, itens, quantidades, subtotais, total geral, status e observações.
- A edição de pedido permite revisar itens adicionados, removidos ou alterados antes de salvar.
- A sincronização deve acontecer somente depois da confirmação das alterações.

## Estoque
- O estoque registra materiais, quantidade, tipo e custo.
- Materiais podem ser usados pela calculadora para calcular custo da peça.
- O app pode alertar quando materiais estiverem abaixo do estoque mínimo configurado.

## Caixa
- O caixa registra entradas, saídas e histórico financeiro.
- Movimentos do caixa devem ser revisados antes de remoção ou alteração sensível.

## Calculadora
- A calculadora calcula preço usando material, peso, horas, quantidade, energia, margem e taxa extra.
- Peso, horas e taxa extra são campos variáveis e devem começar limpos em novo cálculo.
- O valor calculado pode ser revisado antes de virar item de pedido.

## Impressoras
- Impressoras podem compor o cálculo e ajudar a organizar produção.
- O app pode manter configurações fixas como impressora padrão quando isso estiver configurado.

## Planos
- O app possui controle de acesso por plano, incluindo recursos gratuitos e PRO.
- Recursos pagos não devem ser liberados sem validação de plano.

## Anúncios
- Anúncios podem aparecer em fluxos permitidos do plano gratuito.
- O app usa integração nativa quando disponível no Android.

## Sincronização
- A sincronização pode usar Supabase ou backups configurados.
- Sincronizações não devem forçar retorno para a tela inicial.
- Dados locais devem ser preservados quando offline.

## Personalização
- A personalização permite ajustar dados visuais e informações usadas em PDFs.
- Logo e fundo de PDF podem ser removidos ou restaurados.

## PDF
- PDFs podem ser gerados para pedidos e orçamentos.
- O PDF deve usar os dados revisados antes da geração.

## Segurança e superadmin
- Ações sensíveis podem exigir senha administrativa ou biometria no Android.
- A biometria libera ações por uma janela curta e a senha continua como fallback.
- O superadmin gerencia usuários, planos e estados de acesso quando aplicável.
