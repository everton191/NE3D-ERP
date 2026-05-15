# Manual interno do Simplifica 3D

O Simplifica 3D organiza pequenos negócios de impressão 3D com pedidos, cálculo de preços, estoque, caixa, PDFs, sincronização, segurança, anúncios e personalização.

## Início e busca
- A tela inicial mostra indicadores de pedidos, faturamento, caixa, produção, estoque baixo e clientes.
- A busca pela lupa encontra pedidos, clientes e materiais.
- O assistente básico fica na lupa. A IA local fica separada e só aparece quando o recurso estiver disponível.

## Pedidos
- Um pedido guarda cliente, WhatsApp, itens, quantidades, subtotais, total geral, status e observações.
- A edição de pedido é feita em etapas: resumo, lista de itens, cálculo/adicionar item e revisão final.
- Ao calcular um item, o app deve mostrar o valor antes de adicionar ao pedido.
- A alteração só deve ser salva depois da confirmação em "Revise as alterações do pedido".
- Status visuais: aberto, produção, aguardando, pago e cancelado.

## Clientes
- Clientes podem ser cadastrados e usados nos pedidos.
- O Free é funcional para pequenos usuários e tem limite recomendado de clientes.
- O PRO libera clientes ilimitados e experiência sem anúncios.

## Calculadora
- A calculadora calcula preço usando peso, horas, material, impressora, quantidade, energia, margem e taxa extra.
- Peso, horas e taxa extra são variáveis e começam limpos em novo cálculo.
- Material, impressora, energia e margem podem ser mantidos como preferências.
- O botão "Novo cálculo" limpa os campos variáveis.
- A calculadora pode virar widget flutuante; no celular, duplo toque fora pode minimizar para evitar toque acidental.

## Estoque e materiais
- O estoque registra tipo, cor, quantidade em kg e custo do material.
- Materiais podem ser vinculados ao cálculo e aos itens do pedido.
- O app alerta estoque baixo quando a quantidade fica abaixo do mínimo.
- Ao editar pedido, a baixa de estoque deve considerar diferença para evitar descontar duas vezes.

## Impressoras e produção
- Impressoras entram no cálculo pelo consumo, custo/hora e tipo de impressão.
- A produção organiza pedidos por status e ajuda a acompanhar o andamento.
- Materiais e impressora aparecem como informação secundária nos itens.

## Caixa
- O caixa registra entradas, saídas, saldo e histórico financeiro.
- Pedidos salvos geram entrada no caixa.
- Cancelamentos podem gerar estorno e devolução de estoque quando aplicável.

## PDF e orçamentos
- PDFs podem ser gerados para pedidos e orçamentos.
- O PDF usa os dados revisados do pedido.
- No Free, o PDF pode ser simples ou limitado; no PRO, a exportação é completa.

## Planos
- Free: app funcional com pedidos, calculadora, clientes, estoque, caixa, backup básico e anúncios leves.
- Limites do Free: quantidade recomendada de pedidos por mês, clientes e relatórios básicos.
- PRO: pedidos e clientes ilimitados, relatórios completos, PDF completo, IA local offline, automações, backup/sincronização avançada e sem anúncios.
- Pagamento pendente não deve prender o usuário; enquanto pending, o Free continua funcionando.
- Trial não libera IA local.

## Anúncios
- O Free usa anúncios leves e discretos.
- Anúncios não devem aparecer em telas críticas, durante edição de pedido, cálculo, login, pagamento, exportação de PDF ou digitação.
- Rewarded ads são opcionais e podem liberar bônus temporários, como pedidos extras ou PDF premium.
- Se o vídeo não carregar, o app deve permitir tentar novamente e manter o uso básico.

## IA local
- IA local é exclusiva de usuário PRO pago ativo no Android.
- Free e Trial podem visualizar a funcionalidade, mas não podem baixar, instalar, iniciar runtime ou usar o chat local.
- O modelo padrão é Qwen2.5 0.5B Instruct Q8_0 GGUF.
- A IA deve responder com base no contexto/manual do sistema e, quando não souber, dizer: "Não encontrei essa informação no manual do sistema."
- A IA deve focar em uso do Simplifica 3D e impressão 3D FDM, como Bambu Lab, OrcaSlicer, PLA, PETG, TPU, custos, manutenção e pequenos negócios.

## Sincronização e backup
- O app pode sincronizar com Supabase e manter fila local quando estiver offline.
- Sincronização não deve forçar retorno para a tela inicial.
- Backup básico fica disponível; backup/sincronização avançada é benefício PRO.

## Personalização
- Permite ajustar nome do app, empresa, WhatsApp, logo, cores, fundo de login, PDF, Pix, escala de tela e modo compacto.
- Recursos visuais avançados são PRO quando exigido pelo plano.

## Segurança
- Ações sensíveis podem exigir senha administrativa ou biometria no Android.
- Biometria tem validade curta e a senha continua como fallback.
- Senhas não devem ser armazenadas em texto puro.

## Aprendizado local de uso
- O app pode registrar localmente eventos simples, como tela aberta, calculadora aberta, pedido criado, item adicionado, orçamento finalizado, material usado e impressora usada.
- Esse aprendizado não treina modelo, não coleta senhas e pode ficar oculto.
- Ele serve para pré-selecionar sugestões e melhorar fluxo sem enviar dados sensíveis.

## Restrições da IA
- A IA não deve orientar ações de Super Admin.
- A IA não deve inventar telas, preços, regras ou funções.
- A IA deve responder em português brasileiro simples e direto.
