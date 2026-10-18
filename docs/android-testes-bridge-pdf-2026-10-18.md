# K08 — testes físicos isolados e correção de PDF, 18/10/2026

Branch `codex/melhorias-setembro-2026`, base `c400c53`. Usuário autorizou os
testes no ASUS conectado. Continuação local: sem SQL, RPC administrativa,
Supabase CLI, deploy, AAB, publicação, mudança de assinatura ou ativação de IA.
Não foi usada assinatura/cliente real como fixture. OptiCore preservado.
**K08 continua parcial; publicação não liberada.**

## Resultado por ambiente

| Estado | Verificação | Evidência / limite |
| --- | --- | --- |
| PASS | Regressão local | 32 suítes JS reexecutadas; inclui 11 casos novos dos callbacks PDF. Sem backend real. |
| PASS | JUnit Android | 74 testes em 15 suítes, zero falhas/erros/skips; tarefa executada com `--rerun-tasks`, não apenas cache. |
| PASS | Pacote isolado final | Oito instrumentados no ASUS Android 13, API 33: `OK (8 tests)`, 8,939 s. É o roteiro revisado abaixo. |
| PASS | Entrega real PDF/JSON | JS canônico → Bridge Capacitor → plugin canônico → MediaStore; bytes relidos, MIME/IS_PENDING conferidos e PDF aberto com PdfRenderer. |
| PASS controlado | Navegação/caixa no aparelho | Mesmos 16 casos de navegação e 85 assertions existentes do caixa, executados no WebView com estado/navigator sintéticos. Não são navegação visual do ERP ou share sheet/clipboard reais. |
| PASS controlado | Ciclo de vida/recarga | Host descartável em CREATED → RESUMED, token JS preservado, Bridge funcional e reload local. Não é Home/launcher/retorno do ERP com conta real. |
| PASS limitado | Impressão | Diálogo do sistema abriu; job UUID do próprio UID cancelado e host próprio destruído, nenhum job próprio ativo restante. Não certifica impressão física, Voltar manual ou retorno ao mesmo host. |
| PASS | APK principal atualizado | install -r sem limpar dados; hash/build/assinatura conferidos; sessão existente offline e conversão PDF canônica no WebView instalado PASS. |
| PENDENTE | Restante K08 | Impressão física/cancelamento manual, seleção de imagem/câmera, permissões legadas, navegação visual completa, API 24–28 e execução 16 KB. |

## Falha real encontrada e correção

A fábrica `getPdfDocumentDeliveryDeps()` entregava referências cruas de funções
do navegador. Chamadas como `context.btoaRef(binary)` mudavam o receptor exigido
pelo WebView e produziam `TypeError: Illegal invocation` antes da Bridge. A
primeira execução física reproduziu a falha de codificação; a fábrica real em
`app.js` tinha exatamente a mesma referência sem vínculo.

Commit `1869012`: apenas `alert`, `btoa`, `confirm`, `setTimeout` e `clearTimeout`
foram vinculados a `window` nessa fábrica. Sem alterar valores PDF, planos,
permissões, autenticação, histórico comercial ou layouts. Cache do app invalidado
no HTML. Novo teste com fábrica canônica e receptor obrigatório: **RED 0/11 →
GREEN 11/11**; verificações PDF existentes mantidas. O teste de UI só teve o
literal da versão de cache atualizado, sem remover suas assertions.

Na repetição física o fixture passou a extrair a própria fábrica de `app.js`,
sem reconstruir esses callbacks. PDF foi salvo/relido e não houve mais a falha
de codificação. Após atualizar o ERP, seu smoke chama a função global canônica
`arrayBufferParaBase64` com seis bytes sintéticos; resultado `JVBERgD/`, PASS
no WebView instalado. Esse ensaio é somente em memória, sem extrato real.

## Tentativas preservadas e mudança explícita do teste de impressão

| Execução | Resultado real | Interpretação |
| --- | --- | --- |
| 1 | 6/8 PASS, duas falhas | PDF nativo e impressão interrompidos por `Illegal invocation`; não eram falhas de autorização do MediaStore. |
| 2 | 7/8 PASS, uma falha | PDF corrigido; teste de cancelar via Back não encontrou UUID completo na acessibilidade do spooler. Guard bloqueou a ação global. Não é PASS de cancelamento manual. |
| 3, roteiro revisado | 8/8 PASS | Sem qualquer Back/clique/ação global. Novo contrato: abrir impressão, cancelar apenas job próprio pelo PrintManager e destruir apenas o próprio host. |

O terceiro caso de impressão foi renomeado para
`printOpensSystemDialogThenCancelsOwnJobAndDestroysOnlyOwnHost`. Exige ausência
de janela de impressão antes de iniciar, UUID novo, job próprio ativo, spooler
aberto e pausa do host. Confirma host DESTROYED e nenhum job UUID próprio ativo.
Não houve remoção de uma assertion para fingir que o Voltar passou: esse
contrato manual permanece **PENDENTE**, e os logs das falhas anteriores foram
preservados. A revisão independente aprovou eliminar a ação global, não declarar
o roteiro antigo aprovado.

Log observado: `spoolerWindowAfterHostClose=true`. Portanto destruir o host não
comprovou fechamento visual imediato do diálogo. Após remover os pacotes, a
checagem de atividade mostrou o launcher ASUS. Nenhum comando de Back, clique
ou encerramento do spooler foi usado no roteiro final. Não foi selecionada
impressora/destino nem comandada emissão de impressão.
O [PrintManager Android](https://developer.android.com/reference/android/print/PrintManager)
abre a UI a partir de uma Activity; o teste limita sua aprovação à abertura e
à limpeza do job próprio. Os estados controlados usam
[ActivityScenario](https://developer.android.com/reference/androidx/test/core/app/ActivityScenario),
não equivalem à navegação completa da aplicação.

Uma tentativa de executar o invólucro da terceira rodada falhou antes de
instalar/desligar rede por erro PowerShell `return$Matches[1]`. Corrigido no
script local legível; não foi repetida uma instrumentação com esse erro.

## Isolamento, limpeza e ressalva operacional

Módulo irmão opt-in `-PsimplificaBridgeValidation=true`, fora dos projetos
padrão. Pacotes `br.com.ne3d.erp.bridgevalidation` e `.test`, release desabilitada,
host próprio não exportado, sem MainActivity do ERP. Fontes nativas compiladas:
somente `SimplificaFilesPlugin`, `PendingDownloadWriter` e host de validação.
Assets limitados aos módulos PDF/caixa canônicos, seis funções de navegação,
fábrica PDF extraída e fixtures. Nenhum bootstrap ERP, credencial, AdMob, modelo
ou `.so`; manifests compilados sem Internet/contatos/câmera/áudio/storage amplo.
O APK de teste possui REORDER_TASKS transitiva do AndroidX. CSP bloqueia conexão.

Cada arquivo usa nome `simplifica-bridge-validation-<UUID>` comprovadamente
ausente antes da escrita. Limpeza exige URI individual rastreada, nome, pasta
`Download/Simplifica3D/` e OWNER_PACKAGE_NAME exatos. Recuperação de URI após
erro JS pesquisa só UUIDs planejados; nunca apaga coleção/pasta. Teardowns
passaram. Pacotes ausentes antes, hashes instalados conferidos e somente os
pacotes novos removidos após cada execução. Nenhum arquivo anterior foi alvo.

Durante os instrumentados a rede padrão estava ausente, Wi-Fi/dados desligados.
Após a segunda rodada, já com rede restaurada, `pidof br.com.ne3d.erp` retornou
um PID inesperado. Foi encerrado imediatamente. Não foi registrada a identidade
completa/causa desse processo, portanto não é possível atribuí-lo a Activity,
serviço, retomada automática ou alias de nome. Leituras limitadas dos logs não
encontraram marcadores selecionados de backend/sync; isso **não comprova ausência
de tráfego remoto nesse intervalo**. Não houve inspeção/mutação de servidor para
resolver a dúvida. O teste não certifica ausência absoluta de acesso do SDK fora
da janela offline, nem integridade remota de contas.

O invólucro final passou a encerrar o ERP explicitamente antes dos testes e
novamente antes de restaurar a rede. Ao final foram conferidos rede 1/1,
launcher ativo e nenhum processo ERP/bridgevalidation na listagem por nome.
Não foram alterados sessão, datas, permissões do ERP, biometria ou dados
comerciais como atalho de teste. Essa ressalva não foi omitida para aprovar K08.

APKs isolados finais:

| Pacote | Bytes | SHA-256 |
| --- | --- | --- |
| Host | 9297694 | `4e63d8cf6671fb0bf962acbf7d289c3675eedd80ca0f9acfee8837d194b3190e` |
| Instrumentação | 1360466 | `c94fcf24dece8d8482c74bdb923be8b2b97e92a7adce00e7cdda21082c324e4e` |

## APK de teste entregue ao aparelho

- Fonte funcional `1869012`; infraestrutura `6e8f832`; smoke `4bb6739`.
- Build `0.1.0-29e9c1b79666b110`, pacote `br.com.ne3d.erp`, versão/código
  1.0.39/67, API mínimo/alvo/compile 24/36/36; sem mudar assinatura/configuração.
- APK 31.367.653 bytes, SHA-256
  `5a47d1de374e739f54ca32d57240aa3ea1bc731be5f002b58bd1a1a626c25ac4`.
- Certificado SHA-256
  `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- `app.js` empacotado idêntico à fonte. Sem modelos/bibliotecas nativas de IA no APK;
  plugin/atalhos de IA, updater e checkout externo ausentes em runtime.
- Backup binário anterior B53D6AFF… preservado; não é backup integral dos dados.
- install -r Success, hash instalado idêntico, documento/build corretos,
  sessão existente estável em três observações, sem login/progresso/retry/trava,
  zero camadas ativas e zero padrões selecionados de erro fatal.
- PDF 3165 bytes e QR SVG em memória; codificação Base64 canônica PASS.
- MainActivity TotalTime/WaitTime 1448/1457 ms; primeira tela pronta observada
  1019 ms pós-DOMContentLoaded. Não é benchmark nem ganho de velocidade certificado.
- Modelo QAD anterior manteve hash
  `bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`.
- App encerrado antes de restaurar Wi-Fi/dados 1/1; sem processos do projeto
  nem encaminhamentos ADB restantes. Nenhum novo login ou operação comercial.

## Arquivos, comandos e pendências

Alterações de produto: `app.js`, `index.html`. Testes da correção:
`scripts/test-pdf-browser-bindings.js`, `scripts/test-auth-ui.js` e
`scripts/android-capacitor-runtime-smoke.js`.

Infraestrutura: `android/settings.gradle`, `android/bridge-validation/build.gradle`,
os dois manifests do módulo, `ValidationBridgeActivity.java`,
`BridgeMediaDeviceTest.java`, assets `capacitor.plugins.json`, `public/index.html`
e `public/validation.js`. Scripts: `build-android-browser-test-assets.js`,
`test-android-browser-test-assets.js`, `test-android-bridge-validation-isolation.js`,
`fixtures/android-back-navigation-cases.js`, wrapper existente
`test-android-back-navigation.js` e aliases em `package.json`. Casos de navegação
extraídos uma única vez, sem duplicar implementação do ERP. Documentação: este
relatório, Kanban e referência no relatório da atualização anterior.

```text
npm run test:pdf-browser-bindings
npm run test:android-browser-test-assets
npm run test:android-bridge-validation-isolation
android/gradlew.bat --project-dir android --offline :app:testPlayDebugUnitTest --rerun-tasks --console=plain
android/gradlew.bat --project-dir android --offline -PsimplificaBridgeValidation=true :bridge-validation:assembleDebug :bridge-validation:assembleDebugAndroidTest --console=plain
adb -s RBAISCBR000F2X2 shell am instrument -w -r -e class br.com.ne3d.erp.bridgevalidation.BridgeMediaDeviceTest br.com.ne3d.erp.bridgevalidation.test/androidx.test.runner.AndroidJUnitRunner
```

Não executar instrumentação ampla: testes antigos podem abrir ERP/IA. Antes de
repetir, inspecionar hashes/manifests, exigir pacotes ausentes e rede isolada;
encerrar ERP antes de restaurar conexão. Evidências ignoradas em
`artifacts/android-bridge-validation-20261018/`: três logs brutos, observação
do spooler, script local, APK anterior e `erp-updated/`. Captura do ERP pode
conter dados privados; não publicar/commitar.

As 32 suítes são as 29 do relatório anterior mais testes de isolamento Bridge,
adaptação browser e bindings PDF. `test-auth-ui` inicialmente rejeitou o novo
literal de cache; expectativa acompanhou a versão intencional, cobertura mantida.
Sintaxe/diff e builds PASS; avisos Gradle/SDK/AndroidX preexistentes permanecem.

Próximo: K08 manual de impressão/Voltar, seleção/cancelamento de imagem e
permissões, navegação/segundo plano do ERP em perfil descartável; K07 mocks em
dois navegadores; K09 inventário local. API 24–28 e 16 KB não executados; ASUS
usa 4 KB e o emulador segue limitado por espaço, sem novas tentativas/limpezas.
Supabase/staging/sandbox/implantação ficam por último, com ambiente e autorização
próprios. Não há scanner QR implementado nesse fluxo de estoque; não inventar
captura/câmera para declarar teste aprovado. **Não é READY TO PUBLISH.**
