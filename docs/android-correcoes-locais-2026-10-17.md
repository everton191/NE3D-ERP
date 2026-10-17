# K08 — correções locais de navegação e arquivos, 17/10/2026

Branch `codex/melhorias-setembro-2026`, base `7e8fe46`.
Solicitação: continuar correções independentes de Supabase, deixando as que
exigem backend por último. Nenhum Supabase local/remoto, Auth/API, assinatura
real, staging ou produção foi acessado pelos ensaios desta rodada.

## Resultado e checkpoints

| Estado | Corte | Correção / evidência |
| --- | --- | --- |
| PASS unitário | `71af7fe` | Downloads API 29+: tentativa falha tenta descartar somente a entrada recém-criada; publicação exige uma linha atualizada; sem sucesso falso em retorno zero. 12 testes, zero falhas. |
| PASS simulado | `53fe141` | Voltar fecha o detalhe de pedido antes do fallback mesmo com histórico vazio/inválido, reutilizando a função existente. 16 cenários com funções reais. |
| PASS simulado | `2a8568b` | Falhas de impressão/download PDF limpam timer, iframe, âncora e URL temporária, preservando erro original e caminhos normais. 18 cenários. |
| PASS estático | APK | ZIP alinhado a 16 KB e segmentos ELF da única biblioteca nativa alinhados a 16 KB. Execução em sistema 16 KB ainda PENDENTE. |
| PASS | Regressão/build | 27 suítes JS e 74 testes JUnit em 15 suítes: zero falhas, erros ou testes ignorados. Web sync e PlayDebug compilados. |
| PASS limitado | Aparelho | Atualização sem limpeza, abertura offline estável, painel de etapas ausente na recarga, runtime Play e PDF/QR em memória. Não certifica os novos fluxos físicos de escrita/impressão. |

### Downloads: causa, alvo da limpeza e limite

O plugin inseria uma entrada com `IS_PENDING=1`, mas não a removia se abertura,
gravação, fechamento ou publicação falhassem. Também ignorava o retorno de
`ContentResolver.update`, podendo responder `ok` sem confirmar a publicação.

Somente a transação API 29+ foi isolada no helper package-private
`PendingDownloadWriter`. O adaptador captura `createdUri` retornada pelo insert
da tentativa atual: abrir, publicar e descartar usam exclusivamente essa URI,
sem pesquisar por nome, apagar pasta ou atingir arquivos anteriores. Fecha o
stream antes de publicar; retorno diferente de uma linha rejeita a operação.
Falhas secundárias de fechamento/descarte não substituem o erro original.

RED: helper com a transação anterior extraída, 12 testes/11 falhas; após a
correção, 12/12 PASS. É reprodução unitária da transação, não execução do
MediaStore antigo em dispositivo. Cobertos stream nulo, abertura/gravação/
fechamento/publicação falhos, update 0/2, descarte negado, falhas combinadas e
preservação de outra tentativa. Se o provider recusar a exclusão, a remoção
física não é garantida; o erro secundário fica anexado ao principal.

API 24–28, permissões, impressão e contatos ficaram intactos. O comportamento
legado de escrita por nome não foi redesenhado. API de update conferida na
[referência Android ContentResolver](https://developer.android.com/reference/android/content/ContentResolver),
e fluxo de entrada pendente na
[documentação Android de armazenamento compartilhado](https://developer.android.com/training/data-storage/shared/media).

### Voltar: causa e reprodução

O handler só chamava `voltarTela()` se o histórico tivesse destino utilizável.
O fechamento do detalhe de pedido estava dentro dessa função; sem histórico,
o fallback ia para a Home antes de fechar o detalhe. A correção chama a função
existente `fecharDetalhesPedido()` após tratar camadas e antes de consultar
loja/histórico. Não consome a pilha ao fechar o detalhe.

RED 12/16 antes; GREEN 16/16 depois. Cobertos pilha vazia, destino atual ou
inválido, prioridade de modal, loja, Home, fallback de pai, ciclos de detalhe,
confirmação de saída e proteção de eventos nativos duplicados. É uma reprodução
da máquina de estados em VM; a sequência de toques correspondente no aparelho
continua PENDENTE. Sem alteração em autorização ou navegação comercial.

### PDF: causa e reprodução

Falha em criar/anexar/configurar iframe podia deixar URL temporária ou timer de
carga órfãos. Se o timer rejeitasse uma Promise que ainda não era aguardada,
podia gerar rejeição não tratada. No fallback de download, falha do DOM/clique
deixava URL/âncora sem descarte; uma falha adicional de limpeza podia mascarar
o erro original.

Setup da carga agora integra a Promise aguardada; limpeza de impressão é
idempotente e cancela ambos os timers. O fallback limpa recursos na falha.
Preservados prazo de carga de oito segundos, descarte após 60 segundos no
sucesso, nomes, mensagens e alternativas existentes. RED 10/18 antes, GREEN
18/18 depois. Também cobertos permissão Android negada sem chamar salvamento e
retorno nativo sintético autorizado. Nenhuma impressora, arquivo real ou
permissão do aparelho foi manipulada para esses testes.

## Inspeção de 16 KB e pacote Play

Critérios consultados no
[guia oficial Android de páginas de 16 KB](https://developer.android.com/guide/practices/page-sizes).
AGP 8.13.0, Gradle 8.14.3, NDK 28.2.13676358, mínimo/alvo/compile 24/36/36.
Nenhum upgrade de dependência ou ajuste de assinatura foi necessário.

- `zipalign -c -P 16 -v 4`: Verification successful, antes e depois.
- Única biblioteca empacotada:
  `lib/arm64-v8a/libandroidx.graphics.path.so`, 10.096 bytes, SHA-256
  `41e9a793c43a0f4fddb19e33f346bace464f30f888ba7b9eaf96294ea115bfb6`.
- `llvm-readelf -lW`: três segmentos LOAD com alinhamento `0x4000`. O segmento
  de RELRO ocupa o LOAD de dados somente-leitura, com o LOAD gravável de `.bss`
  em página de 16 KB separada; não se aplica reprovar apenas porque o fim do
  RELRO não é múltiplo de 16 KB. Sem mudança desse binário entre os APKs.
- O ASUS retorna `getconf PAGE_SIZE = 4096`: não é dispositivo de 16 KB.
  AAB final e execução em sistema 16 KB permanecem pendentes; a inspeção do APK
  debug não os substitui.
- Flags Play continuam false para IA, atualizador próprio e checkout externo.
  Sem modelos GGUF/ONNX/safetensors/TFLite ou runtimes Needle/llama/ggml no APK.
  IA mantida no código-fonte, não inicializada.
- Manifesto do APK inspecionado: rede, contatos, biometria, armazenamento legado
  limitado até API 28 e permissões de SDKs de anúncios/serviços. Sem microfone
  nem instalação de pacotes. Nenhuma permissão alterada nesta rodada.

## Testes e comandos

27 suítes locais, sem backend:

```text
test:app-bootstrap
test:bootstrap-background-boundary
test:offline-session-restoration
node scripts/test-auth-session-boundary.js
test:auth-ui
test:auth-hotfix
test:logout-account-overlays
test:profile-admin-separation
test:storefront-offline-recovery
test:manual-plan-licenses
test:plan-presentation-editor
test:prepublication-p0
test:superadmin-control-layout
test:play-ai-disabled
test:play-no-self-update
test:play-no-external-checkout
node scripts/test-app-js-finalization.js
test:android-back-navigation
test:navigation-stage-1
test:mobile-single-screen-navigation
test:storefront-contextual-mobile-flow
test:pdf-delivery-resources
node scripts/test-pdf-document-delivery.js
node scripts/test-company-pdf-info.js
node scripts/test-pdf-standard.js
test:order-editing-pdf
node scripts/test-phone-contacts-order.js
```

Entradas `test:*` executadas com `npm run`. Contratos SQL/leitura de arquivos
locais nessas suítes não são execução Supabase. Sintaxe dos cinco JS alterados,
JSON de package e `git diff --check`: PASS. Build com JDK 21:

```text
npm run android:sync
android/gradlew.bat --project-dir android :app:testPlayDebugUnitTest :app:assemblePlayDebug --console=plain
```

JUnit: 15 arquivos XML, 74 testes, zero falhas/erros/skips. Os 12 testes do helper
integram esse total, não são 12 adicionais. Avisos preexistentes de flatDir e
deprecações Gradle permanecem; não justificaram refatorar dependências.

## Atualização e smoke no aparelho

- ASUS_I005DA, Android 13, `RBAISCBR000F2X2`; pacote `br.com.ne3d.erp`.
- Versão/código 1.0.39/67, mesma assinatura anterior. APK 31.367.653 bytes;
  build `0.1.0-36aba7e81164a1b1`, confirmado no WebView instalado.
- SHA-256 do APK gerado/instalado:
  `f99f3c77a5c54be9472ac544321309b49ecf2d3ea3346cc0f62cfef9fa2a6bbb`.
- Certificado SHA-256:
  `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- `app.js`, módulo PDF, bootstrap e renderer empacotados idênticos às fontes.
  Classe nativa `PendingDownloadWriter` presente no DEX.
- install -r Success; sem desinstalação/limpeza ou mudança de sessão. Backup do
  APK anterior preservado em artefatos; não é backup completo dos dados.
- Antes de abrir, Wi-Fi/dados desligados e ausência de rede padrão confirmada.
  Abertura a frio Status ok, TotalTime 1212 ms/WaitTime 1216 ms. Não são tempo
  total até o uso nem comparação de desempenho.
- Sessão existente offline com seis indicadores locais true, área de trabalho
  estável em três observações, sem trava/progresso/retry, zero camadas ativas e
  zero ocorrências selecionadas de erro fatal no processo.
- Observador pré-scripts na recarga: zero inserções de etapas ou login. Sem
  forçar vencimento, digital, logout ou conta de homologação no app real.
- Runtime Android/App/AdMob disponível; IA/updater/checkout externo ausentes.
  PDF 3165 bytes e QR SVG somente em memória. Não prova anúncios, gravação de
  arquivo, impressão, scanner ou permissões reais.
- App encerrado antes de restaurar Wi-Fi/dados a 1/1; modo avião 0; nenhum
  encaminhamento ADB restante. Modelo QAD anterior preservado, hash
  `bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`.

Evidências ignoradas: `artifacts/android-local-audit-20261017/` (ELF/backup/
readiness), `artifacts/android-downloads-transaction-20261017/` (RED/GREEN
JUnit) e `artifacts/android-quiet-startup-20261017/local-fixes-after/` (histórico
de DOM). Capturas de conta não publicar nem commitar.

## Arquivos alterados e próximos passos

- Nativo: `SimplificaFilesPlugin.java`, novo `PendingDownloadWriter.java`, novo
  `PendingDownloadWriterTest.java`; `android/.gitignore` ignora somente o cache
  gerado `.kotlin/`, sem apagar arquivos.
- Navegação: `app.js`, novo `scripts/test-android-back-navigation.js`.
- PDF: `src/features/company/pdf-document-delivery.js`, novo
  `scripts/test-pdf-delivery-resources.js`.
- Integração/testes: `index.html` invalida caches dos scripts alterados;
  `scripts/test-auth-ui.js` acompanha o identificador; `package.json` registra
  as duas suítes novas, sem dependências novas.
- Este relatório e `docs/KANBAN-PUBLICACAO.md` registram os limites.

PENDENTE sem Supabase: testar navegação/Voltar/retorno do segundo plano em
cenário descartável; gravação/recuperação MediaStore real, impressão/partilha,
câmera/QR e permissões negadas; executar em sistema 16 KB; regressão frontend
em dois navegadores isolados e inventário de privacidade/SDKs. Não manipular
dados ou permissões da conta real como atalho para homologação.

Por último, em fase própria com acesso seguro: Auth/API, renovação/digital e
reconexão que necessitem backend isolado, persistência real entre plataformas,
staging/Edge/Mercado Pago sandbox, históricos e implantação autorizada.
Nenhum teste local substitui esses gates. Sem AAB, publicação, push, deploy,
migrations ou alteração de produção. OptiCore preexistente preservado.
**K08 parcial; publicação não liberada.**
