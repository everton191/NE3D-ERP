# Auditoria de desempenho - Simplifica 3D

Data: 2026-05-17
Versão: 51.0.30

## Gargalos encontrados

- Renderização: `renderApp()` reconstrói a interface inteira; chamadas repetidas também sincronizavam banners em toda renderização.
- Persistência local: `salvarDados()` gravava muitos JSONs no `localStorage` mesmo quando o conteúdo não mudava.
- Logs/diagnóstico: logs silenciosos e `console.info/debug` podiam gerar escrita e ruído em produção.
- Assistente: a busca do manual normalizava keywords em toda pergunta.
- IA local: o modelo local deve ser carregado somente sob ação do usuário, usando manual como fallback rápido.
- Bundle: assets públicos estão leves; o peso maior vem do APK nativo e do runtime Android, não de mídia do PWA.

## Otimizações aplicadas

- Cache de escrita no `localStorage`: só grava quando o valor realmente muda.
- Throttle de diagnósticos silenciosos: em produção, logs silenciosos repetidos são reduzidos; erros importantes continuam registrados.
- Modo debug explícito: `console.info/debug` fica ativo apenas com `localStorage.simplificaDebug = "true"` ou `?debug=1`.
- Índice em memória do manual: keywords e títulos são normalizados uma vez e reutilizados nas buscas.
- Throttle da sincronização de banners: evita chamadas repetidas a AdMob/AdSense a cada render.
- IA Local Média mantida como camada opcional: o Assistente Inteligente responde pelo manual sem carregar modelo.

## Medições

- Build PWA: `npm run vercel-build` aprovado.
- PWA local em `localhost`: carregamento observado ~647 ms, sem erros de console.
- APK debug: build aprovado e APK gerado com 27,79 MB.
- Android emulator cold start: `TotalTime 3045 ms`.
- Memória após abertura no emulador: `TOTAL PSS 142096 KB`.
- Logs debug/info diretos: 15 antes da auditoria, 2 depois, ambos protegidos por modo debug.
- Assets públicos: 18 arquivos, ~1,57 MB.
- TTFT/tokens/s da IA local: ficam disponíveis no diagnóstico nativo quando o modelo estiver instalado e carregado; não foram medidos no emulador sem modelo.

## Riscos e próximos passos

- `renderApp()` ainda é a maior fonte estrutural de custo porque troca grandes blocos de HTML. Uma próxima etapa seria separar render incremental por tela.
- Vulkan/GPU depende do suporte real no plugin nativo/llama.cpp; a UI já registra backend/layers, mas o runtime precisa expor esses dados corretamente.
- A IA local Qwen 1.5B Q8_0 pode ser pesada em aparelhos com pouca RAM; o manual deve continuar como fallback principal.
- O APK de debug passou no emulador; teste real com modelo instalado ainda é necessário para medir TTFT e tokens/s.
