# K08 — Downloads reais em pacote isolado, 18/10/2026

Branch `codex/melhorias-setembro-2026`, base desta rodada `a7daa63`.
Continuação exclusivamente local, conforme pedido do usuário. Sem Supabase
local/remoto, Auth/API real, pagamentos, deploy, push ou AAB. OptiCore preservado.
**K08 parcial; publicação não liberada.**

## Resultado e checkpoints

| Estado | Corte | Evidência e limite |
| --- | --- | --- |
| PASS simulado | `b034248` | Extrato não informa mais “copiado” quando Clipboard API não existe. Dez cenários novos no teste existente, incluindo rejeição e Promise pendente. Ainda não instalado no ERP do aparelho. |
| PASS estático/build | `9363b98` | Módulo de validação opt-in, com IDs próprios, sem Internet, assets ERP ou bibliotecas nativas; release desativado. Fora da lista padrão de projetos Gradle. |
| PASS físico | ASUS / Android 13 | 12 testes de escrita/leitura de Downloads reais via implementação nativa canônica; PDF também aberto com PdfRenderer. Somente arquivos sintéticos do pacote de validação. |
| PASS regressão local | JS/JUnit | 29 suítes JS locais e 74 testes JUnit em 15 suítes; zero falhas na execução final. Não são testes de backend remoto. |
| FAIL ambiente / PENDENTE validação | Emulador 16 KB | Primeiro boot ficou offline; segunda tentativa encerrou por falta de espaço. Nenhum teste executado nem tamanho de página confirmado nesse emulador. |

## Correção pequena no extrato

`await navigator.clipboard?.writeText(texto)` podia resolver sem fazer nada
quando a API estivesse ausente. O código então informava sucesso e retornava
`true`, apesar de não ter copiado o extrato.

Agora exige `writeText` como função e aguarda a gravação antes do sucesso.
Ausência/rejeição usa o fallback de texto já existente e retorna `false`.
Não houve mudança financeira, de licença, layout ou dependência. Cancelamento
do compartilhamento nativo mantém o contrato anterior, sem cópia automática.
Teste reproduziu o sucesso falso antes e passou depois da alteração.

Arquivos do commit `b034248`:

- `src/features/cash/cash-renderer.js` — confirmação efetiva de cópia.
- `scripts/test-cash-renderer.js` — API ausente/inválida, permissão negada,
  Promise pendente, cópia confirmada, compartilhamento/cancelamento/fallback e
  plano sem permissão.
- `index.html` — versão do módulo para invalidar cache web.

## Isolamento do teste nativo

O módulo `media-validation` só entra no Gradle com
`-PsimplificaMediaValidation=true`. Compila os mesmos
`SimplificaFilesPlugin.java` e `PendingDownloadWriter.java` do ERP por whitelist,
sem duplicar suas implementações nem depender do módulo `:app`.

Pacote alvo `br.com.ne3d.erp.validation`, instrumentação
`br.com.ne3d.erp.validation.test`. Mínimo API 29, alvo/compile API 36, Java 21;
IA, atualizador e checkout externo desativados. APK alvo sem Activity/launcher.
O APK de instrumentação contém três Activities auxiliares AndroidX e a permissão
`REORDER_TASKS` transitiva; não são telas do ERP e não foram abertas. Ambos os
APKs compilados foram inspecionados: sem `INTERNET`, assets ou `.so`/modelos.

Antes de cada escrita, o teste exige IDs exatos, ausência de Internet nos dois
pacotes, flags false e alvo sem Activity. Não abre o ERP, WebView, conta real ou
serviços remotos. A chamada do plugin usa contexto/captura de resposta de teste:
**não certifica o transporte JavaScript → Bridge nem o fluxo visual de download**.
O empacotamento separado segue o mecanismo de
[testes instrumentados Android](https://developer.android.com/training/testing/instrumented-tests);
a inclusão opt-in e o bloqueio de release preservam o build normal do ERP.

Arquivos do commit `9363b98`:

- `android/settings.gradle` — inclusão opt-in.
- `android/media-validation/build.gradle` — pacote isolado e fontes canônicas.
- `android/media-validation/src/main/AndroidManifest.xml`.
- `android/media-validation/src/androidTest/AndroidManifest.xml`.
- `android/media-validation/src/androidTest/java/br/com/ne3d/erp/MediaStoreDownloadDeviceTest.java`.
- `scripts/test-android-media-validation-isolation.js` — contratos estáticos.
- `package.json` — alias da suíte estática, sem novas versões de dependências.

## Testes físicos e preservação do aparelho

ASUS_I005DA, Android 13/API 33, páginas de 4 KB. Os dois pacotes de validação
estavam ausentes antes da instalação. Somente eles foram instalados e removidos
nesta rodada; o ERP principal não foi reinstalado nem aberto.

| Cobertura real no MediaStore | Resultado |
| --- | --- |
| PDF sintético: bytes idênticos, MIME, publicação e PdfRenderer com uma página | PASS |
| JSON sintético: bytes idênticos, MIME e publicação | PASS |
| Entrada vazia, base64 inválido e sanitização de nomes | PASS |
| Entrada pendente: stream fechado antes da publicação de uma linha | PASS |
| Falhas injetadas de abertura, escrita, fechamento e publicação, incluindo retorno zero | PASS |
| Arquivo anterior preservado após falha de outra tentativa e próxima gravação funcional | PASS |

As falhas são injetadas em torno de URIs reais recém-criadas. Não equivalem ao
provider real negando acesso, a um diálogo de permissão ou a disco cheio real.
Os 12 testes passaram; saída observada `OK (12 tests)`, 1,704 s,
`INSTRUMENTATION_CODE: -1` (conclusão normal da instrumentação).

Cada fixture usa nome `simplifica-validation-<UUID>` em `Download/Simplifica3D/`.
O teardown confirma URI rastreada, nome exato, diretório e pacote proprietário
antes de excluir só aquela entrada. As verificações de limpeza passaram; nunca
há exclusão da coleção/pasta ou busca ampla por arquivos anteriores.

Após o teste, hashes dos APKs instalados foram conferidos e somente os dois
pacotes novos desinstalados com sucesso. Ausência de ambos confirmada. Hash do
APK principal idêntico antes/depois:
`f99f3c77a5c54be9472ac544321309b49ecf2d3ea3346cc0f62cfef9fa2a6bbb`.
Sessão, rádio, datas, permissões do ERP e dados pessoais não foram manipulados.
Isso comprova isolamento desses ensaios, não uma nova atualização do ERP.

APKs de teste produzidos (não são release):

| Artefato | Bytes | SHA-256 |
| --- | --- | --- |
| `media-validation-debug.apk` | 9247956 | `c142d5d1de9048d93901334d62dbae894393701f32746cb1b4ebe253e08145af` |
| `media-validation-debug-androidTest.apk` | 1330019 | `38d64b3b984876acc3e21d2fbf3ff6448e240046ecba4fddd0f952a0fdbbaae1` |

## Execução reproduzível e resultados locais

JDK 21. As 27 suítes listadas no
[relatório anterior](android-correcoes-locais-2026-10-17.md) foram repetidas,
acrescidas de `node scripts/test-cash-renderer.js` e
`npm run test:android-media-validation-isolation`: 29 PASS. São contratos
locais/VM/mocks; a suíte de isolamento é estática, não os 12 testes físicos.
Sintaxe dos JS alterados e `git diff --check`: PASS.

```text
android/gradlew.bat --project-dir android --offline projects --console=plain
android/gradlew.bat --project-dir android --offline :app:testPlayDebugUnitTest --console=plain
android/gradlew.bat --project-dir android --offline -PsimplificaMediaValidation=true :media-validation:assembleDebug :media-validation:assembleDebugAndroidTest --console=plain
```

Lista padrão de projetos sem `media-validation`: PASS. JUnit normal do ERP:
15 suítes, 74 testes, zero falhas/erros/skips. Não somar novamente os 12 testes
unitários antigos do writer; integram os 74. Os 12 instrumentados são separados.

Primeiro build offline falhou por três artefatos transitivos existentes ainda
não armazenados em cache; foram baixados dos repositórios Maven configurados,
sem upgrade. Depois, corrigido somente no teste o uso de `PdfDocument`, que não
é AutoCloseable: fechamento explícito em finally. Build final offline PASS.
Avisos de flatDir/deprecações e remoção defensiva de permissões no manifesto
permanecem; não foram suprimidos para obter aprovação.

Após verificar os dois APKs e instalá-los no dispositivo isoladamente, executar
**somente esta classe**:

```text
adb -s RBAISCBR000F2X2 shell am instrument -w -r -e class br.com.ne3d.erp.MediaStoreDownloadDeviceTest br.com.ne3d.erp.validation.test/androidx.test.runner.AndroidJUnitRunner
```

O comando seleciona a classe pelo filtro oficial de
[instrumentação Android](https://developer.android.com/studio/test/command-line).
Não executar `connectedAndroidTest` indiscriminadamente: outros testes antigos
do repositório podem abrir o ERP real. A repetição exige confirmar novamente
pacotes ausentes/isolamento, inspecionar APKs e remover só os pacotes novos.

## 16 KB: limite do ambiente, sem aprovação presumida

Foi criado um AVD descartável novo `S3D_Media_16k_20261018` sob os artefatos
desta rodada, com imagem SDK x86_64 37.1 `google_apis_playstore_ps16k`. O AVD
pessoal existente não foi iniciado/modificado e seus dados não foram usados.
Primeira execução permaneceu offline; encerrada pelo console depois de confirmar
o nome exato. Segunda execução terminou com:

```text
Not enough space to create userdata partition.
Available: 11342.34 MB ... need 12288.00 MB.
```

Não houve terceira tentativa, ajuste de disco nem limpeza de arquivos pessoais.
Nenhum processo desse emulador ficou ativo. A remoção dos arquivos temporários
do novo AVD foi bloqueada pela ferramenta antes de executar; permanecem nos
artefatos ignorados, com limpeza manual pendente. Não contornar esse bloqueio.
Os pacotes/fixtures do celular, por outro lado, foram limpos com sucesso.

**Execução 16 KB PENDENTE.** A imagem selecionada não prova tamanho de página
em execução; é preciso obter boot, conferir `PAGE_SIZE=16384` e executar testes.
Mesmo esse teste nativo em x86_64 não certificaria sozinho o ERP arm64 completo
nem o artefato final de publicação. O PASS ZIP/ELF anterior continua só estático.

Evidências locais ignoradas em `artifacts/android-media-validation-20261018/`:
`physical-result.json` é resumo curado das saídas observadas, não log bruto
integral; APKs permanecem nos outputs Gradle e logs do emulador em `emulator/`.
Não publicar artefatos/capturas de conta.

## Pendências e próxima sequência

1. K08: execução real 16 KB após resolver espaço/ambiente sem apagar dados;
   navegação/segundo plano, impressão/partilha, câmera e permissões no cenário
   descartável. API 24–28 e transporte WebView/Bridge seguem sem nova validação.
2. K07: dois navegadores/perfis descartáveis com mocks; distinguir esses ensaios
   de persistência Auth/API real entre aparelhos.
3. K09: inventário local de dados/SDKs/permissões e documentação. Console,
   exclusão remota e páginas públicas exigem verificação própria.
4. Por último, com ambiente/acesso próprios: Supabase, staging/sandbox,
   persistência remota, login/renovação/digital e implantação autorizada.

Não existe leitor de QR implementado no fluxo de estoque inspecionado: geração,
download e entrada manual não comprovam scanner; não criar essa funcionalidade
para completar um teste. A cópia do extrato ainda requer validação visual em
contexto descartável e eventual atualização autorizada do ERP no dispositivo.
Sem liberação de publicação, mudanças em IA ou assinatura Android.

Continuação após reconexão do telefone: a correção foi instalada no ERP com
dados preservados e smoke offline; ver
[atualização do dispositivo em 18/10](android-atualizacao-dispositivo-2026-10-18.md).
O registro acima descreve o corte anterior, no qual somente os pacotes isolados
haviam sido instalados. Não confundir os dois ensaios nem seus APKs.
