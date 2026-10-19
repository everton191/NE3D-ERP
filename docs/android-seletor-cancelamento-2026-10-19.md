# K08 — abertura e cancelamento reais do seletor Android

19/10/2026. Branch `codex/melhorias-setembro-2026`, base `d2717bb`.
Continuação autorizada pelo usuário, no ASUS conectado. **PASS somente para
abrir/cancelar o seletor e retomar o host isolado. Publicação não liberada.**

## Resultado verificável

| Estado | Verificação | Evidência e limite |
| --- | --- | --- |
| PASS físico | Seletor real | Input HTML → WebView → cliente original do Capacitor → Photo Picker do Android. Uma solicitação e um callback real com `Uri[] == null` após cancelar. Nenhum resultado injetado. |
| PASS físico | Retorno | Mesma instância de Activity, token JS preservado, input vazio, pausa/retomada observadas e chamada real ao plugin de armazenamento respondendo depois do retorno. |
| PASS físico | Repetição/regressão | Método novo isolado: `OK (1 test)`, 2,159 s. Depois nove métodos selecionados: `OK (9 tests)`, 8,858 s. Inclui o mesmo método e oito existentes; nove métodos distintos, não dez. Impressão não selecionada. |
| PASS local | Compilação e contratos | APKs apenas do módulo descartável compilados offline com JDK 21. Seis suítes JS selecionadas PASS; lista abaixo. Não houve mudança no produto que exigisse reconstruir o APK ERP. |
| PASS preservação | Dados e aparelho | ERP não aberto/reinstalado, hashes do ERP e `.test` anterior iguais; Wi-Fi/dados permaneceram 1/1. Somente os dois pacotes temporários novos foram instalados e removidos. Launcher ativo no final. |
| PENDENTE | Seleção e persistência | Não selecionou arquivo, não recebeu URI positiva, não usou câmera e não salvou personalização no ERP/Supabase. Não certifica seleção de fotos, permissões legadas ou persistência. |

O seletor resolvido e aberto foi
`com.google.android.photopicker/com.android.photopicker.PhotopickerGetContentActivity`.
Intent observada na preparação: `android.intent.action.GET_CONTENT`, tipo
`image/jpeg`; parâmetros do input exigidos: JPEG, PNG e WebP, sem captura.
O Capacitor continua responsável pelo filtro final, launcher e parseResult,
sem modificações na dependência ou substituição de seu resultado.

ASUS `RBAISCBR000F2X2`, Android 13/API 33, páginas de 4 KB, mesmo ambiente do
[ensaio canônico de imagens](android-imagens-isoladas-2026-10-19.md).
Os oito métodos anteriores reexecutados cobrem imagens sintéticas, PDF, JSON,
entrada inválida, scoped storage, reload, navegação/caixa sintéticos e ciclo de vida
do host. Não equivalem aos fluxos visuais completos do ERP.

## Alterações e isolamento

- Novo `RealPickerCancelDeviceTest.java`, separado de `BridgeMediaDeviceTest`.
  O cliente `BridgeWebChromeClient` já registrado é observado e recebe a chamada
  delegada; não se constrói outro cliente nem se simula ActivityResult.
- Manifesto apenas de `bridge-validation`: queries GET_CONTENT/OPENABLE para
  conferir previamente o resolvedor. É visibilidade de pacote, não permissão de
  leitura. Sem INTERNET, câmera, contatos, áudio, leitura de mídia ou storage amplo.
- Guardas estáticas adicionais em `test-android-bridge-validation-isolation.js`.
  A proibição de ações externas no teste antigo permanece intacta.
- Este relatório e atualização do `KANBAN-PUBLICACAO.md`.

O toque inicial é entregue diretamente ao WebView próprio, usando os limites
do input do fixture e exigindo pacote/foco corretos. Não há tap global por coordenada.
Para cancelar, exige-se resolvedor conhecido do sistema, janela nova com pacote e
ID exatos, host pausado e callback ainda ausente. Só então um Back é enviado.
Não se lê árvore de filhos, nomes, textos, thumbnails, conteúdo de arquivos ou
galeria; não há screenshot nem seleção.

**Risco residual do próprio teste:** Back é uma ação global; conferir pacote/ID
imediatamente antes reduz, mas não elimina, uma corrida caso alguém troque a
janela simultaneamente. Rodar sem interação simultânea no celular. Se a guarda
falhar, o teardown não tenta Back/clique especulativo: restaura o cliente e fecha
somente o host próprio. Resolvedor desconhecido provoca falha antes de lançar.
Isso não foi descrito como ação atomicamente vinculada à janela.
Referências oficiais: [callback de arquivos/cancelamento](https://developer.android.com/reference/android/webkit/WebChromeClient#onShowFileChooser(android.webkit.WebView,%20android.webkit.ValueCallback%3Candroid.net.Uri%5B%5D%3E,%20android.webkit.WebChromeClient.FileChooserParams))
e [escopo global de Back](https://developer.android.com/reference/android/app/UiAutomation#performGlobalAction(int)).

O ensaio apenas abre a interface do provedor de sistema: a negação de INTERNET
no host não representa isolamento da rede dos demais apps do telefone. Nenhum
rádio ou configuração do provedor de mídia foi alterado.

## Falha inicial mantida e recuperação

Uma execução inicial tentou `input.click()` programático. O WebView não chamou
`onShowFileChooser`, e o teste falhou por timeout antes de abrir o seletor.
Não foi defeito comprovado do ERP. O teste passou a usar o gesto direcionado
ao WebView; todas as exigências de callback, janela e retorno foram preservadas.

Log FAIL: `artifacts/android-picker-20261019/300d89fa-b175-422b-9962-7249e2bccb43-real-picker.log`.
Os pacotes foram removidos também nessa falha; ERP/rede preservados.
Uma consulta preliminar do controlador ao subcomando `dumpsys window windows`
não continha o foco; ele abortou sem instalar. Corrigida para `dumpsys window`,
que informa o launcher. Nenhuma expectativa funcional foi relaxada para passar.

## Evidências e execução

Rodada PASS do controlador ignorado `artifacts/android-picker-20261019/run-device.cjs`:
`54365a00-f6ff-49e2-b72e-13349785370d`, com logs `real-picker`,
`regression-no-print` e `picker-summary`. Eventos nativos dos dois testes:
`74197540-6cf0-464d-b9c4-7e416801d73e` e
`d344d5b4-e33b-4150-9f3d-4740143aa64a`.
Ambos: `requests=1`, `callbacks=1`, `returnedUri=false`, `sameHost=true`,
`bridgeResponsive=true`, `selection=none`.

| Artefato | Bytes | SHA-256 |
| --- | --- | --- |
| Host descartável | 9315632 | `632939b941c7249f93cfe5977bbc1fa02e2b732b4cd1b9bb3feea73d1295ba68` |
| Instrumentação aprovada | 1375946 | `162c840495be278568e8d523efb8b87a193fd68a9566e919c8dd154d555d0b34` |

ERP antes/depois:
`5a47d1de374e739f54ca32d57240aa3ea1bc731be5f002b58bd1a1a626c25ac4`;
pacote ERP `.test` preexistente:
`c8657d3fa5c3dbdc523dba30501e875a9efc0fb3853ef1eda426f154a38630fe`.
ERP continua no build instalado `0.1.0-29e9c1b79666b110`, sem atualização nesta etapa.
Os pacotes de validação estavam ausentes, tiveram IDs/permissões/hash/fontes
canônicas verificados antes de instalar; apenas os mesmos binários novos foram
removidos depois, inclusive nas falhas. Nenhum dado anterior foi alvo de limpeza.

```text
android/gradlew.bat --project-dir android --offline -PsimplificaBridgeValidation=true :bridge-validation:assembleDebug :bridge-validation:assembleDebugAndroidTest --console=plain
```

Suítes JS frescas (arquivos em `scripts/`):
`test-android-bridge-validation-isolation.js`, `test-android-browser-test-assets.js`,
`test-config-image-selection.js`, `test-android-back-navigation.js`,
`test-android-media-validation-isolation.js`, `test-android-file-permission-routing.js`.
JUnit do produto/build web não foram reexecutados: somente teste Android isolado,
manifesto de teste e documentação mudaram. Não herdar PASS antigo como resultado novo.
Warnings de depreciação Java/Gradle e flatDir permanecem, sem falha de compilação.

## Próximos gates

Selecionar somente imagem sintética própria pelo seletor e conferir URI/bytes
positivos; depois validar salvamento/recarga em perfil ERP descartável. Permanecem
câmera quando aplicável, fotografias/EXIF/HEIC, fluxos completos/segundo plano do ERP,
partilha/impressão manuais, API 24–28 e execução em 16 KB. Auth/API no aparelho,
staging e webhook são frentes separadas do Kanban; nenhum foi certificado aqui.

Sem mudança de produto, IA, Supabase, cobrança, OptiCore, assinatura, APK novo do
ERP, AAB, produção, push, deploy ou publicação. Não é READY TO PUBLISH.
