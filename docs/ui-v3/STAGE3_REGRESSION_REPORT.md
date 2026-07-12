# Relatório de regressões da Etapa 3

## Resultado

- Build web aprovado em todos os lotes.
- Testes dedicados de Configurações, leitura, Operacional e Financeiro aprovados.
- Testes de estoque, calculadora/pedido e produção manual aprovados após a remoção do CSS.
- Uma asserção textual obsoleta do teste de calculadora foi atualizada para o contrato atual de `CalculatorDomain`; nenhuma lógica de cálculo foi alterada.
- O ocultamento do assistente flutuante no Estoque móvel foi transferido para o seletor V3 antes da retirada da regra antiga.

## Verificação visual real

Em sessão autenticada de superusuário, a 412 px, Dashboard e Caixa foram abertos e verificados sem overflow horizontal. Configurações, Perfil, Segurança, modo em Dialog e Relatórios foram abertos e verificados nos lotes correspondentes. A matriz de 320 a 1920 px foi coberta por contratos/testes responsivos; não é declarada como captura manual individual para cada rota.

Não houve deploy, push ou publicação.

