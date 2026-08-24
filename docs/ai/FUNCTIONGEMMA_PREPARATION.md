# Preparação para FunctionGemma

FunctionGemma 270M é um adapter futuro, não uma dependência do domínio. A entrada futura será derivada do registry, schemas, aliases, exemplos e casos revisados, com treino/validação/teste separados.

Gate para treino: 100% das prioritárias registradas; todo WRITE com schema/validator/permissão/confirmação/idempotência; zero BROKEN exposta; contract tests e paridade UI/IA; dataset final congelado. O estado atual não satisfaz o gate, portanto não baixar, integrar nem treinar modelo.

O adapter de desenvolvimento está em `src/ai/functiongemma-adapter.js`, atrás de `AI_TOOL_MODEL=functiongemma|legacy|disabled` e com `shadow=true` por padrão. Ele aceita somente actions READY recebidas no Top-K e rejeita WRITE mesmo que o runtime tente retorná-la. Ainda não há runtime LiteRT/modelo real ligado; este adapter é apenas a fronteira testável para a integração posterior.
