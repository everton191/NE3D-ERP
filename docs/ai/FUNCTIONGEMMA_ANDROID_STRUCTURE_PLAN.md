# Estrutura do FunctionGemma no Android

## Arquitetura fixada

```text
FunctionGemma 270M Q8_0 GGUF -> llama.cpp ARM64 CPU -> tool calling em shadow
Gemma E2B .litertlm          -> LiteRT-LM          -> assistente avançado/fallback
WRITE_EXPOSED                -> 0
```

O checkpoint operacional é exclusivamente `google/functiongemma-270m-it`, revisão `39eccb091651513a5dfb56892d3714c1b5b8276c`. O Mobile Actions fine-tuned não faz parte do Simplifica.

## Caminho da decisão

```text
Tela atual
  -> Capability Bundle / Action Search
  -> Top-K de 1 a 3 actions READY e não-WRITE
  -> contrato wire estreito
  -> FunctionGemmaAdapter
  -> Capacitor plugin
  -> FunctionGemmaToolRuntime
  -> LlamaCppBackend (worker único)
  -> JNI
  -> llama.cpp armv8.2+dotprod ou armv8.0 fallback
  -> parser + FunctionGemmaToolPolicy
  -> Shadow Result, sem execução ERP
```

Negação, pergunta hipotética e ausência de correspondência semântica são rejeitadas antes da JNI. Saída malformada, argumentos ausentes, tool fora do Top-K ou intenção de WRITE são rejeitados depois do modelo.

## Ciclo de vida

- O app inicia sem carregar o GGUF.
- O primeiro shadow elegível verifica tamanho, SHA-256 e manifest; depois faz load e warmup no worker.
- Há uma inferência por vez, cancelamento idempotente e timeout.
- `unload` é serializado com geração e é seguro em chamadas repetidas.
- Erro nativo retorna envelope estruturado e degrada apenas o assistente; o ERP manual continua.
- FunctionGemma pode permanecer residente; Gemma E2B continua preservado e não infere simultaneamente.

## Modelo e instalação

- Arquivo: `functiongemma-270m-it-39eccb091651513a5dfb56892d3714c1b5b8276c-Q8_0.gguf`
- Bytes: `291557856`
- SHA-256: `595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47`
- Destino: `noBackupFilesDir/models/functiongemma/0.2.0-q8_0/`
- Importação: `content://` ou arquivo autorizado, streaming para `.part`, hash durante a cópia e rename atômico.

## APK ARM64

As bibliotecas necessárias são:

- `libfunctiongemma_jni.so`
- `libllama.so`
- `libggml.so`
- `libggml-base.so`
- `libggml-cpu-android_armv8.2_1.so`
- `libggml-cpu-android_armv8.0_1.so`
- `liblitertlm_jni.so` permanece apenas para Gemma E2B

O runtime usa NDK `28.2.13676358`, API 28+, CPU-only, contexto 512, batch 64 e 2 threads. Vulkan/OpenCL permanecem desativados.

## Política de evolução

1. Manter shadow e WRITE bloqueado.
2. Corrigir contratos, aliases e Top-K com evidência do baseline.
3. Tornar Produção READY somente após contract test e caminho UseCase real.
4. Revisar/anotar os 560 casos, ampliar grupos semânticos e congelar splits por hash.
5. Comparar opcionalmente o mesmo checkpoint oficial convertido para `.litertlm`, usando exatamente os mesmos contratos e casos; não usar Mobile Actions como atalho.
6. Considerar fine-tuning somente sobre erros residuais atribuíveis ao modelo.

Não alterar quantização, ativar GPU ou carregar os dois modelos simultaneamente antes de uma nova medição justificar isso.
