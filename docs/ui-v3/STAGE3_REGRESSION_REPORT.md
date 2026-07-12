# Relatório de regressões da Etapa 3

## Resultado

- Build web aprovado em todos os lotes.
- Testes dedicados de Configurações, leitura, Operacional e Financeiro aprovados.
- Testes de estoque, calculadora/pedido e produção manual aprovados após a remoção do CSS.
- Uma asserção textual obsoleta do teste de calculadora foi atualizada para o contrato atual de `CalculatorDomain`; nenhuma lógica de cálculo foi alterada.
- O ocultamento do assistente flutuante no Estoque móvel foi transferido para o seletor V3 antes da retirada da regra antiga.
- Relatórios ainda usava `.mobile-panel-content` como segundo scroller por duas regras tardias com `!important`; as regras foram limitadas às rotas não V3 e o runtime passou a mostrar somente `#app-content`, alcançando 2.616px.
- Os testes de overflow e shell ainda exigiam seletores/classes V2 removidos; foram atualizados para os contratos genéricos de busca e Dashboard V3.
- Listagem/detalhes de Pedidos não tinham raiz V3 apesar de o editor já estar migrado; as variantes mobile e PWA receberam PageContainer e grid oficial.
- Formulários de Perfil, Pedido, Produção, Estoque e Caixa ainda escreviam visualmente em `#popup`; agora são promovidos para Dialog/Drawer Portal e o nó legado fica vazio.
- O projeto não tinha gate reproduzível de typecheck para a UI V3 e o TypeScript instalado era incompatível com as tipagens Node atuais; foi criado `tsconfig.ui-v3.json` isolado, corrigindo tipagens DOM reais da fundação.

## Verificação visual real

Em sessão autenticada de superusuário, a 412×911, Dashboard, Perfil, Pedidos, Produção, Relatórios e Caixa foram abertos e capturados sem overflow horizontal. A matriz de 320 a 1920 px foi coberta por contratos/testes responsivos; não é declarada como captura manual individual para cada rota.

Não houve deploy, push ou publicação.
