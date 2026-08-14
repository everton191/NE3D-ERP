# Matriz de testes

| Área | Automático | Web/Android real | Estado |
|---|---|---|---|
| Core, manifest, contexto e memória | `test:assistant-core-foundation`, `test:simplifica3d-ai-context-v2` | WebView Android | passou |
| Funções Home/Pedidos/Estoque/Calculadora/Caixa | contratos + contexto | Zenfone via ADB/CDP | passou |
| Orçamento 20 g / 3 h | contrato e tool | calculadora real, R$ 20,32 | passou |
| UI reutilizável | `test:assistant-ui-components`, UX | launcher/painel/composer no Zenfone | passou |
| Modelo Android | lifecycle e policy | download, SHA, GPU, reabertura | passou para E2B |
| Fallback de modelo | policy + PWA provider | Android E4B indisponível | parcial |
| PWA storage/provider | `test:assistant-pwa-model-storage` | login shell sem console error | parcial: sem artifact/runtime publicados |
| Imagem | UX/contrato/capability | imagem real e sem-visão simulado | parcial: seletores manuais finais pendentes |
| Segurança/WRITE | contexto, operation safety, transaction/parity | confirmação de pedido | passou nos cenários registrados |
| Privacidade | `test:assistant-model-policy` | provider local Android | passou |
| Build | typecheck, `build:web`, Gradle | APK instalado | passou no checkpoint atual |

Antes de release executar ao menos: sintaxe dos arquivos alterados, testes da Assistente, typecheck, build web, sync Android, `assembleRelease`/`assembleDebug` conforme entrega, `git diff --check`, instalação/upgrade e smoke autenticado no aparelho. Publicação, feed e URL pública precisam de verificação separada; push sozinho não comprova entrega.
