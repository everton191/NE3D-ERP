# Modelo local do Simplifica 3D

## Estado auditado

| Campo | Evidência atual |
|---|---|
| Nome declarado | `Gemma 4 E2B` |
| Arquivo/localização/tamanho/hash | não presentes e não verificáveis neste checkout |
| Formato/quantização | não verificáveis |
| Runtime | ContentProvider externo `content://br.com.simplifica.ai.provider` |
| Backend declarado | `GPU_FIRST_CPU_FALLBACK` recebido do provider |
| Context length/temperature/top_k/top_p/threads | não expostos |
| Inicialização | `SimplificaLocalAiPlugin.load()` agenda `ensure_model` em executor único |
| Carregamento | provider externo decide; lifecycle/destruição não visíveis |

O repositório contém fonte/vendor de `llama.cpp`, porém o `build.gradle` atual não declara runtime nativo de IA e o plugin auditado não chama JNI; logo isso não prova que esse checkout execute llama.cpp.

## Requisito alvo

Provider exclusivo do 3D atrás de `AiProvider`, com `BUNDLED` ou `MANAGED_LOCAL`; o restante do core recebe identificador/stream, nunca caminho físico. Status deve expor modelo, versão, bytes, hash, runtime, backend real e parâmetros efetivos. Lazy load ou prewarm em background; fechamento explícito; modo degradado.
