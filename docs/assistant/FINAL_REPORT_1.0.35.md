# Relatório final — Simplifica 3D 1.0.35

Data: 2026-08-14

## Resultado

A versão 1.0.35 adiciona o bootstrap universal por aplicativo sem alterar o comportamento operacional já validado da Assistente do Simplifica 3D. Simplifica 3D, Rural, Tec e Editor da Loja agora possuem manifestos, ferramentas, rotas e namespaces independentes.

## Isolamento entre aplicativos

- `modelScope` precisa ser exclusivo e igual ao `manifest.appId`.
- Conversas usam chaves `assistant:<appId>:conversations:v1`.
- Cache usa prefixo `assistant:<appId>:cache`.
- Configuração web do modelo usa `<appId>:assistant-web-model:v1`.
- UI, privacidade, tools e navegação recebem a identidade do pack.
- Editor da Loja não declara capability nem tool WRITE.

## Validação automatizada

- `test:assistant-multi-app-runtime` aprovado para os quatro apps simultaneamente.
- `test:assistant-core-foundation`, `test:assistant-ui-components`, `test:assistant-model-policy` e `test:assistant-pwa-model-storage` aprovados.
- `test:simplifica3d-ai`, contexto V2 e UX da Assistente aprovados.
- `typecheck` e `build:web` aprovados.
- Build Android concluído com 160 tarefas Gradle e assinatura validada.

## Android real

- Pacote: `br.com.ne3d.erp`.
- Versão: `1.0.35`.
- Código: `63`.
- Instalação: `adb install -r` concluída no aparelho `RBAISCBR000F2X2`.
- Modelo antes/depois: 2.588.147.712 bytes, sem novo download.
- Harness: WebView, chat, Core 3D e `UniversalAssistantAppRuntime` carregados.

## Publicação

- Aplicação/PWA: commit `8bcb785` em `origin/main`.
- APK público: commit `9ee931d`.
- APK público: 36.748.221 bytes.
- SHA-256: `8C131820FBC6601F1BE051769C26CB2DCCC20E16F0B9D3337EF08E77D1792A5C`.
- PWA pública: `APP_VERSION=1.0.35`, `APP_VERSION_CODE=63` e novo service worker confirmados.
- Manifesto público: `version=1.0.35`, `versionCode=63` confirmado após propagação.

## Limitações preservadas

- Rural, Tec e Editor da Loja ainda precisam ligar os adapters aos serviços reais dentro de seus próprios projetos.
- A PWA não anuncia inferência local quando não existe runtime/artifact WebGPU compatível publicado.
- IA Leve e IA Avançada permanecem indisponíveis até existir artifact validado.
- Testes físicos de remoção integral do modelo e abertura manual dos dois seletores de imagem continuam pendentes para não apagar a evidência atual nem simular interação humana.
