# Arquitetura do Simplifica 3D

Aplicação web/PWA em JavaScript, empacotada pelo Capacitor e complementada por Kotlin no Android.

Fluxo operacional da IA:

`UI -> AssistantCore/Simplifica3dAiRuntime -> contexto limitado -> modelo -> ToolRegistry/ações -> validação -> permissão/plano -> confirmação -> serviço determinístico`.

O app já possui arquitetura própria em `src/assistant-core`, `src/ai-3d` e no pacote Android `br.com.ne3d.erp.ai`. Não criar outro `src/ai` nem importar runtime, modelo, memória ou pack de Rural/Tec.

O runtime Android implementado é LiteRT-LM com GPU e fallback de backend para CPU. llama.cpp não está integrado neste checkout; tratá-lo como indisponível até existir biblioteca nativa, catálogo GGUF, teste de ABI e inferência física.
