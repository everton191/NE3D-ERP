# Contratos de actions

Toda action declara ID, versão, domínio, descrição, READ/PREPARE/WRITE, handler alvo, permissão, confirmação, idempotência, schema, aliases, exemplos, teste e enablement. Argumentos desconhecidos devem ser rejeitados pelo validator antes do handler.

Resultados usam `{success, action, data, warnings, missing, errors, nextActions}`. IDs internos só entram por contexto confiável ou resultado de busca. Perguntas, simulações, negação e dados faltantes não podem virar WRITE.
