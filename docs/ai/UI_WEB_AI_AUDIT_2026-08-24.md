# Auditoria de interface e IA Web — 2026-08-24

## Resultado

As alterações ficaram somente no checkout local. Nenhuma publicação foi executada.

```ini
WEB_UI_AUDIT = PASS
ANDROID_UI_AUDIT = PASS_WITH_MANUAL_LOGIN_PENDING
FUNCTIONGEMMA_WEB_Q8 = PASS
MODEL_MODE = shadow
WRITE_EXPOSED = 0
GEMMA_E2B = preservado
```

## Bugs encontrados e corrigidos

1. O cabeçalho da Home no Android sobrepunha a saudação com busca, notificações e avatar. A grade agora reserva largura automática para as ações e possui teste de regressão.
2. O vídeo introdutório podia cobrir o APK com uma tela escura por até 14 segundos. Ele foi desativado apenas no Android; a Web preserva a apresentação. O HTML inicial agora possui estado visual de abertura.
3. O service worker PWA era registrado também dentro do WebView e duplicava o carregamento do shell. No APK, registros antigos agora são removidos e nenhum novo service worker é registrado.
4. O texto acessível do assistente dizia que ele estava trabalhando durante download/preparação do modelo. Agora informa o estado correto.
5. O download Web gravava cada bloco do GGUF abrindo e fechando um writer OPFS, causando lentidão severa. A cópia agora usa um stream único, mantém retomada e continua verificando tamanho e SHA-256.
6. O service worker tentava armazenar o GGUF também no Cache Storage. O arquivo de 291 MB agora permanece somente no armazenamento de modelos com checksum.
7. FunctionGemma continuava gerando `function_response` repetido depois do primeiro tool call válido. A geração agora é interrompida no primeiro `end_function_call`.
8. Intenções WRITE conhecidas eram rejeitadas somente depois da inferência. Agora são bloqueadas antes de chegar ao modelo.
9. A IA Web exigia WebGPU mesmo usando CPU/WASM e não possuía runtime real. Foi integrado `@wllama/wllama` 3.6.0, fixado no projeto e copiado com sua licença para o build Web.
10. O menu complementar de clientes no Superadmin aparecia apenas como reticências. O controle voltou a exibir o rótulo curto `Mais`, mantendo nome acessível e teste automatizado.

## FunctionGemma real na Web

```yaml
CHECKPOINT: google/functiongemma-270m-it
REVISION: 39eccb091651513a5dfb56892d3714c1b5b8276c
QUANTIZATION: Q8_0 GGUF
BYTES: 291557856
SHA256: 595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47
RUNTIME: wllama 3.6.0 / llama.cpp WebAssembly CPU
RUNTIME_SOURCE: empacotado localmente; sem CDN em execução
THREADS: 2
LOAD: 3351 ms
WARMUP: 1046 ms
SMOKE_3: PASS
WRITE_EXPOSED: 0
```

Resultados observados no navegador real:

| Comando | Resultado | TTFT | Total |
| --- | --- | ---: | ---: |
| `abre os pedidos` | `navigation.open`, `tela=pedidos` | 4629 ms | 6491 ms |
| `quanto tenho de PLA preto?` | `inventory.search`, `query=PLA preto` | 7445 ms | 10408 ms |
| `se eu cancelar esse pedido o que acontece?` | `NO_TOOL / WRITE_INTENT_BLOCKED` | sem inferência | imediato |

O primeiro smoke, antes do corte de geração e do bloqueio antecipado, levou 48,7 s para os três casos. O fluxo corrigido levou 22,2 s, incluindo load, warmup e duas inferências CPU. Quatro threads não trouxeram ganho mensurável; duas foram preservadas para reduzir contenção.

## Validação de interface

- Web desktop: login renderizado sem overflow horizontal.
- Web móvel: login renderizado sem overflow horizontal e com controles acessíveis.
- Zenfone 8: APK instalado, abriu sem erro de ABI/dlopen, crash ou ANR.
- Zenfone 8: a tela preta de até 14 s não reapareceu; splash nativo é seguido pela tela do aplicativo.
- Zenfone 8: Home autenticada foi inspecionada antes da expiração da sessão e o cabeçalho não apresentou mais sobreposição.
- A sessão do aparelho expirou durante a validação final. Por isso, o login real e a navegação manual por todas as telas precisam ser repetidos pelo usuário com suas credenciais.

## Builds e testes

- `npm run lint`
- `npm run test:functiongemma-web`
- `npm run test:functiongemma-shadow`
- `npm run test:functiongemma-native-shadow`
- `npm run test:assistant-pwa-model-storage`
- `npm run test:assistant-app-isolation`
- `npm run test:assistant-ui-components`
- `npm run test:auth-ui`
- `npm run test:ui-overflow`
- `npm run test:ui-contrast`
- `npm run test:mobile-render-stability`
- `npm run test:mobile-visual-stability`
- `npm run test:ui-responsive-balance`
- `npm run build:web`
- `npm run android:sync`
- `android/gradlew.bat :app:assembleDebug`
- instalação ADB no Zenfone 8

O APK contém as sete bibliotecas ARM64 esperadas, não contém GGUF e não contém o runtime WebAssembly redundante. O build Web contém o GGUF verificado e os arquivos locais do wllama. `npm audit --omit=dev` retornou zero vulnerabilidades de produção.

## Riscos e verificações manuais restantes

1. Entrar novamente no Zenfone e confirmar que sessão com menos de 12 horas vai direto à Home e que sessão mais antiga solicita biometria/senha.
2. Percorrer Pedidos, Estoque, Caixa e Produção no aparelho usando dados reais e confirmar rolagem, teclado e retorno.
3. O runtime Web é CPU-only e permanece em shadow; as latências de 6,5–10,4 s por consulta ainda são altas em comparação com o Android nativo.
4. O teste de recarga com o servidor de origem completamente desligado ficou inconclusivo. O runtime está empacotado e o GGUF está em OPFS, mas o comportamento offline completo deve ser validado no PWA instalado.
