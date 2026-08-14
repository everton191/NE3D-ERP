# Modelo de contexto

## Atual

O bridge envia tela, oito pedidos recentes, até doze itens de estoque baixo, resumo do caixa e as últimas doze mensagens (700 caracteres cada). Quarenta mensagens são persistidas por escopo de conta. Não há resumo, budget por tokens, draft, slots, entidades resolvidas ou resultados de Tools.

## Alvo

L0 regras; L1 usuário/empresa/permissões; L2 tela/seleção; L3 tarefa; L4 draft; L5 slots; L6 mensagens recentes; L7 resultados relevantes. Prioridade: tarefa, draft, faltantes, entidades, mensagens, tools e resumo. Business data sempre sob consulta de Tool/UseCase, nunca despejado no prompt.

Separar Conversation Memory, Operational Memory e Business Data. Chaves devem incluir usuário/empresa e versão do schema; não compartilhar com outros aplicativos.

## Fase 1 implementada

`ContextBuilder` V2 envia regras essenciais, ator/permissões mínimas, tela, tarefa, draft, slots faltantes, entidades resolvidas, até oito mensagens relevantes e cinco resultados recentes. A memória operacional é persistida separadamente em `simplifica:ai-operational:v2:<escopo>`.
