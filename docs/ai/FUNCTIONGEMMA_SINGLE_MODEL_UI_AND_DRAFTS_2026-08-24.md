# FunctionGemma único, abertura e rascunhos padrão — 2026-08-24

## Resultado

- Android e Web expõem somente o FunctionGemma 270M Q8_0 como modelo de IA.
- Gemma E2B, LiteRT-LM, perfis avançados e seleção de modelos foram removidos do produto.
- O login comum segue diretamente para `dashboard`; a gestão de usuários permanece apenas como tela aberta por ação explícita.
- A restauração local não aguarda sincronizações de licença/fila. A confirmação por biometria ou senha continua obrigatória após 12 horas.
- O assistente não grava Pedidos, Estoque ou Caixa. Ele preenche o formulário operacional padrão; o usuário revisa e salva.
- `WRITE_EXPOSED = 0` permanece obrigatório.

## Correção do pedido em várias mensagens

O analisador preserva preço, peso, cliente e produto entre mensagens. O caso reportado foi coberto por regressão:

1. `criar pedido novo de 100 g R$ 25 para Gessinaldo Júnior`
2. `Chaveiro`

Resultado esperado e validado: rascunho completo, preço preservado e abertura do formulário padrão de Pedido sem chamar gravação.

Estoque e Caixa seguem a mesma regra: comandos compatíveis geram dados de rascunho e abrem os formulários operacionais existentes, sem persistência automática.

## Validação executada

- Testes Node de sintaxe, contexto, Top-K, lifecycle, autenticação, UX e handoff dos rascunhos: PASS.
- Android `:app:testDebugUnitTest :app:assembleDebug`: PASS.
- Web `build:web:ai-smoke`: PASS.
- APK final instalado no aparelho conectado `ASUS_Z01KD`: PASS.
- Abertura medida por `am start -W`: 2.288 ms.
- Tela inicial observada: Login, sem tela de outros usuários.
- Erros `UnsatisfiedLinkError`, `dlopen failed`, crash nativo ou ANR: 0.

## FunctionGemma Web real

- Origem: `google/functiongemma-270m-it`.
- Revisão: `39eccb091651513a5dfb56892d3714c1b5b8276c`.
- SHA-256: `595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47`.
- Tamanho: 291.557.856 bytes.
- Load: 3.312 ms.
- Warmup: 1.056 ms.
- `abre os pedidos`: tool correta, 6.491 ms total.
- `quanto tenho de PLA preto?`: tool e argumento corretos, 10.415 ms total.
- `se eu cancelar esse pedido o que acontece?`: NO_TOOL seguro, sem inferência e sem WRITE.

## Bibliotecas nativas no APK

- `libggml-base.so`
- `libggml-cpu-android_armv8.0_1.so`
- `libggml-cpu-android_armv8.2_1.so`
- `libggml.so`
- `libfunctiongemma_jni.so`
- `libllama.so`

Não há dependência LiteRT-LM nem artefato Gemma E2B no APK.

## Validação física no Zenfone 8

- Aparelho: `ASUS_I005DA`, Android 13, `arm64-v8a`.
- Reinstalação com dados preservados: PASS.
- Abertura fria: 1.035 a 1.474 ms.
- Sessão restaurada diretamente na Home, sem tela de outros usuários: PASS.
- GGUF privado: 291.557.856 bytes e SHA-256 esperado: PASS.
- Estado mostrado no assistente: `FunctionGemma pronto`.
- `abre os pedidos`: abriu a tela Pedidos.
- `quanto tenho de PLA preto`: respondeu `PLA preto: 1 rolo`.
- `se eu cancelar esse pedido o que acontece`: nenhuma ação executada.
- Pedido em duas mensagens usando `por 25 reais`: abriu o formulário padrão com cliente, Chaveiro, quantidade 1, 100 g e R$ 25,00.
- O botão `Salvar pedido` ficou disponível para o usuário e não foi acionado pela automação.
- Total de pedidos persistidos antes/depois: 3; nenhum WRITE ocorreu.
- Crash, ANR, erro ABI/JNI/dlopen do processo: 0.
- Temperatura observada: 32,6 a 32,7 °C.
- RSS na Home sem modelo: 360.548 KB.
- RSS com FunctionGemma residente: 986.516 KB; delta aproximado de 626 MB.
- CPU após estabilização: 0% no instante medido.

## Smoke oficial de 18 casos no Zenfone 8

- Resultado: 18/18, `failures=0`.
- Unsafe WRITE: 0.
- Backend: `armv8.2+dotprod`, CPU-only, 2 threads.
- Load nativo: 1.202 ms.
- Warmup: 18 ms.
- TTFT observado: 127 a 368 ms.
- Tempo total observado: 272 a 726 ms.
- PSS ao final do teste isolado: 687.265 KB.
- Temperatura ao final: 32,3 °C.
- Chamadas inválidas, ambíguas ou WRITE foram rejeitadas pela política mesmo quando o texto bruto do modelo sugeriu uma tool READ inadequada.

## Compositor do assistente

- Corrigida a grade que ainda reservava uma coluna para o botão de anexos removido.
- Campo de texto no Zenfone: 656 px de largura.
- Botão `Enviar`: 164 px, sem ocupar o espaço do campo.
- Microfone, teclado e área segura inferior permanecem funcionais.

## Pendências

- Validar em uso manual a trava de biometria/senha após 12 horas, pois esse teste exige aguardar ou manipular deliberadamente o estado de autenticação.
- O consumo residente próximo de 1 GB é funcional no Zenfone 8, mas deve continuar sendo acompanhado em chamadas sequenciais e em aparelhos com menos RAM.
- O runner oficial de instrumentação removeu o aplicativo e seus dados privados ao terminar o smoke. O APK e o GGUF foram reinstalados e o hash foi revalidado, mas a sessão de login foi apagada pelo runner; o usuário precisa entrar novamente para recuperar a sessão/sincronização normal. Os testes seguintes usam CDP sem reinstalação destrutiva.
