# Interface da Assistente

Componentes compartilhados:

- `AssistantLauncher`: botão global arrastável e persistente;
- `AssistantPanel`: painel sobre a tela atual;
- `AssistantComposer`: texto e envio;
- `AssistantContextChip`: entidade/contexto removível;
- `AssistantResultCard`: resultado persistente e ação controlada;
- `AssistantConfirmation`: autorização explícita;
- `AssistantAttachment`: miniatura e remoção.

O pacote visual recebe `appId`, nome, identidade, escaping e handlers. Não conhece pedidos, estoque ou caixa. O adapter do produto produz conteúdo e executa ações.

Estados visuais incluem aguardando, trabalhando, ouvindo, analisando imagem, preparando modelo e indisponível. Ações contextuais variam pela tela e preferem tools determinísticas.

A câmera continua visível como affordance quando o assistente está pronto, mas consulta `supportsVision`: sem suporte, não abre seletor e explica o requisito. O launcher respeita safe areas, barra inferior, limites da tela e posição por usuário.
