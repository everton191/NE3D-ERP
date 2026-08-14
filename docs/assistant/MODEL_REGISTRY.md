# Registro de modelos

O catálogo versionado fica em `models/models-manifest.v1.json` e possui `modelId`, versão, plataforma, provider, runtime, URL imutável, bytes, SHA-256, versão mínima do app e capabilities.

Perfis atuais do Android:

| Perfil | Modelo | Estado | Capacidades declaradas |
|---|---|---|---|
| IA Leve | `qwen2.5-1.5b-instruct` | em validação, sem artifact | texto/tools |
| IA Equilibrada | `gemma-4-e2b-it` | disponível | texto/visão/tools |
| IA Avançada | `gemma-4-e4b-it` | em validação, sem artifact | texto/visão/tools |

Capabilities efetivas são a interseção do descriptor com plataforma/runtime. Nome comercial não prova visão ou tools.

No modo Automático, o provider escolhe entre modelos instalados, verificados e compatíveis. Se o escolhido falhar, pode usar outro já instalado; não baixa nada. O fallback físico E4B → E2B só poderá ser aceito quando houver artifact E4B disponível.

Cada app possui namespace de artifact próprio. Um APK não acessa diretamente `filesDir` de outro aplicativo.
