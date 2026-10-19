# K08 — imagens e regressão no WebView físico, 19/10/2026

Branch `codex/melhorias-setembro-2026`, base `17c31b9`. Usuário conectou o
celular e autorizou continuar os testes. **PASS no recorte isolado abaixo;
K08 e publicação continuam pendentes.**
Checkpoint dos testes: `1060d22`.

## Ambiente e resultado

ASUS `RBAISCBR000F2X2`/ASUS_I005DA, Android 13/API 33, páginas de memória de
4096 bytes. WebView `com.google.android.webview` 155.0.8059.43. A tela inicial
era o launcher; o ERP estava parado e não foi aberto durante esta rodada.

| Estado | Verificação | Evidência e limite |
| --- | --- | --- |
| PASS físico | Imagens no WebView | 13 cenários, 324 assertions, 8 saídas otimizadas decodificadas com dimensões, MIME e pixels centrais conferidos. Execução inicial isolada e repetição na regressão passaram. |
| PASS físico | Regressão selecionada | 8 métodos instrumentados, zero falhas, `OK (8 tests)` em 8,612 s. Inclui o método de imagens e sete métodos existentes; não são nove métodos únicos nem a classe inteira. |
| PASS físico | PDF/JSON | JS canônico → Bridge → plugin nativo → MediaStore, bytes/MIME/publicação conferidos e PDF aberto com PdfRenderer. Fixtures UUID próprias removidas no teardown. |
| PASS controlado | Navegação/caixa/ciclo de vida | 16 cenários de navegação e 85 assertions de caixa em WebView físico com contexto/navigator sintéticos. Host próprio em CREATED→RESUMED e reload local. Não equivale à navegação visual/segundo plano do ERP real. |
| PASS local | Regressão JS/build | 21 suítes selecionadas e build web `0.1.0-6b07ee6d8df6c5ca`. Lista abaixo. |
| PASS local | JUnit Android | `:app:testPlayDebugUnitTest --rerun-tasks`: 84 tarefas executadas; 15 suítes/74 testes, zero falhas/erros/skips. Não foi aprovação de instrumentação ampla do ERP. |
| PASS preservação | APKs existentes e rede | ERP e seu pacote `.test` anterior mantiveram os mesmos hashes. Wi-Fi/dados permaneceram 1/1; nenhum rádio foi alterado. Somente dois pacotes novos de validação foram instalados e removidos. |
| PENDENTE | Seletor/câmera/persistência reais | Não abriu seletor Android, não escolheu fotos pessoais, não usou câmera nem salvou personalização no ERP/backend. |
| PENDENTE | Demais gates | API 24–28, execução 16 KB, impressão/cancelamento manual, fotografias grandes/EXIF/HEIC, fluxos visuais completos e Auth/API isolados no aparelho. |

## O que o novo teste exercita

O módulo `config-appearance.js` é copiado integralmente da fonte canônica para
o host descartável. Os cinco presets são extraídos de `app.js` pelo builder
existente, sem carregar o bootstrap do ERP ou manter outra tabela de presets.
O APK foi inspecionado e a cópia canônica comparada byte a byte antes da instalação.

Arquivos PNG vermelhos/verdes de 320×160 são criados com canvas, Blob e File
reais. `DataTransfer` atribui a seleção a inputs DOM reais, sem abrir o seletor
do sistema. Image, Blob URL, decode, canvas e exportação executam no WebView do
ASUS. Os métodos de otimização/preview/leitura são os canônicos.

Os 13 cenários são:

1. Cada um dos cinco tipos: marca, empresa, perfil, fundo PDF e fundo login.
2. A→B, com A terminando por último e B preservado.
3. Imagem A realmente inválida falhando depois de B válido, sem limpar B.
4. Limpeza programática da seleção durante processamento, sem resultado tardio.
5. Input DOM recriado com mesmo ID, sem receber resultado da tela anterior.
6. Falha atual de decode, preservando o valor anterior para leitura.
7. Bloqueio Free antes de decodificar.
8. Files distintos com mesmo nome/data não reutilizam o cache antigo.
9. Perda de acesso durante operação Pro não produz sucesso tardio.

Nos testes de corrida, somente a entrega do resultado A é retida por uma barreira
controlada, após o decode real. A rotina de otimização não foi reimplementada.
O acesso Free/Pro é uma dependência injetada: não é prova da licença no aparelho.
Leitura para salvar significa retorno/cache em memória, não persistência remota.

Os PNGs pequenos e sólidos não comprovam EXIF/orientação, transparência,
qualidade visual do recorte de fotografias, JPEG/HEIC, limite de compressão ou
fallback de MIME não suportado. Limpar input programaticamente não é cancelar
o seletor Android. Esses limites não foram convertidos em PASS.

Resumo JS registrado nas duas execuções: `total=13`, `assertions=324`,
`decodedOutputs=8`, `failures=[]`, `pickerMode=not-opened`,
`persistenceMode=fixture-memory-only`; 482/537 ms dentro do fixture. Não é
benchmark de abertura do aplicativo ou ganho de desempenho certificado.

## Isolamento, instalação e limpeza

Reutilizado somente o módulo opt-in `-PsimplificaBridgeValidation=true`, release
desabilitada, Activity não exportada, sem MainActivity do ERP. Host e instrumentação
sem INTERNET, ACCESS_NETWORK_STATE, contatos, câmera, áudio ou storage amplo;
CSP `connect-src 'none'`. Nenhum modelo/GGUF/biblioteca `.so`, credencial ou bootstrap
ERP empacotado. O módulo de aparência contém helpers remotos como fonte, mas o
teste chama apenas funções de imagem; não há sessão/configuração real e a rede é
bloqueada pelo manifesto/CSP.

Os pacotes `br.com.ne3d.erp.bridgevalidation` e `.test` estavam ausentes antes.
IDs/permissões/entries/fontes e hashes conferidos antes de instalar; hashes dos
binários instalados conferidos. A limpeza removeu somente esses IDs e exigiu
o mesmo hash antes de desinstalar. O pacote preexistente `br.com.ne3d.erp.test`
foi preservado e não foi instrumentado.

| APK isolado | Bytes | SHA-256 |
| --- | --- | --- |
| Host | 9315632 | `5fc7e256f7c07cb107afd2c2fb29c84c6c94ac949149355d09067a791fa3757b` |
| Instrumentação | 1361190 | `58be20f913de7fce11f145b004744b15e6b61d1d65b1d663c4aacfae590f84ab` |

ERP instalado: versão/código 1.0.39/67, hash antes/depois
`5a47d1de374e739f54ca32d57240aa3ea1bc731be5f002b58bd1a1a626c25ac4`,
o mesmo APK documentado em 18/10, build `0.1.0-29e9c1b79666b110`. **Não foi
atualizado para o código web atual.** Não houve limpeza de dados, login/logout,
biometria, operação comercial, consulta Supabase ou ação sobre conta real.

Ao final: apenas ERP e seu `.test` anterior presentes, nenhum processo ERP,
launcher ativo e rede 1/1 inalterada. O isolamento foi do pacote de teste; não
se afirma ausência de tráfego de outros apps do telefone conectado.

O novo fixture limpa somente container/cache próprios depois de aguardar as
operações. Os testes de PDF/JSON mantêm a limpeza MediaStore por URI/UUID,
diretório e UID próprios já documentada em 18/10; nenhum arquivo anterior foi alvo.

O método de impressão continua no código e **não foi selecionado**: esta rodada
não abriu o spooler, não enviou Back/cliques a janelas externas e não imprimiu.
Seleção explícita de métodos segue o filtro do
[AndroidJUnitRunner](https://developer.android.com/studio/test/command-line).

Evidências ignoradas em `artifacts/android-images-20261019/`: controlador local
`run-device.cjs` e logs `7c1b1c86-0530-43f5-ba4a-a4a3b33b6f55-{images,regression-no-print,image-summary}.log`.
Duas tentativas iniciais do invólucro pararam antes de instalar: `pidof` e `pm path`
retornam status 1 quando ausentes. O invólucro passou a aceitar ausência somente
nessas consultas exatas com saída/erro vazios; erros reais continuam abortando.
Nenhum teste funcional foi desabilitado para obter aprovação.

## Arquivos e comandos

Somente infraestrutura de teste/documentação, sem mudança de produto/CSS:

- `android/bridge-validation/build.gradle`.
- `android/bridge-validation/src/main/assets/public/{index.html,image-validation.js}`.
- `android/bridge-validation/src/androidTest/java/br/com/ne3d/erp/bridgevalidation/BridgeMediaDeviceTest.java`.
- `scripts/build-android-browser-test-assets.js`.
- `scripts/test-android-browser-test-assets.js`.
- `scripts/test-android-bridge-validation-isolation.js`.
- Este relatório e `docs/KANBAN-PUBLICACAO.md`.

```text
android/gradlew.bat --project-dir android --offline -PsimplificaBridgeValidation=true :bridge-validation:assembleDebug :bridge-validation:assembleDebugAndroidTest --console=plain
android/gradlew.bat --project-dir android --offline :app:testPlayDebugUnitTest --rerun-tasks --console=plain
```

Instrumentação: primeiro somente
`BridgeMediaDeviceTest#canonicalImageSelectionUsesRealWebViewDecodeCanvasAndFiles`;
depois ele e os sete métodos existentes de PDF/JSON/entrada inválida/storage/reload/
navegação/pausa-retorno. Não executar classe ampla ou testes antigos ERP/IA.

As 21 suítes JS foram `test-config-image-selection`, `test-android-file-permission-routing`,
`test-android-media-validation-isolation`, `test-android-bridge-validation-isolation`,
`test-android-browser-test-assets`, `test-android-back-navigation`, `test-pdf-delivery-resources`,
`test-pdf-browser-bindings`, `test-pdf-document-delivery`, `test-theme-account-ui`,
`test-theme-isolation`, `test-theme-backup-authority`, `test-ui-theme-consistency`,
`test-light-theme-no-gradient`, `test-play-ai-disabled`, `test-play-no-self-update`,
`test-play-no-external-checkout`, `test-play-account-deletion`,
`test-web-build-appearance-fingerprint`, `test-web-build-no-local-model-artifacts`
e `test-cash-renderer` (arquivos `.js` em `scripts/`).

Warnings Gradle/Java/Kotlin preexistentes permanecem; builds/testes PASS.
OptiCore preservado. Sem AAB, APK novo do ERP, push, deploy, ativação de IA,
produção ou webhook. Os demais gates do Kanban não foram dispensados.
