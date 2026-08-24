# Capability bundles

Bundles por tela ficam em `src/ai/capability-bundles.json`. Eles priorizam candidatos, mas não concedem permissão nem tornam action disponível. A busca cruza texto, aliases, domínio, tela e bundle e limita o resultado a Top-K de no máximo 10.

O contexto permitido contém tela/rota, entidade selecionada, permissões, bundle e referências recentes compactas. DOM, estado global inteiro, tokens e registros sensíveis ficam fora.
