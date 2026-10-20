# K08 — correções de imagens no aparelho, 20/10/2026

Branch `codex/melhorias-setembro-2026`, base `1666500`. Após o usuário reconectar
o celular, as correções `70d6ee5`/`f67e6f9` foram exercitadas no WebView físico
do pacote descartável. **PASS no recorte abaixo, com falha inicial não localizada
registrada. Não é homologação completa do ERP nem liberação para publicação.**

## Ambiente e resultados

ASUS `RBAISCBR000F2X2`, Android 13/API 33, páginas de 4096 bytes;
WebView `com.google.android.webview` 155.0.8059.43, conferidos nesta rodada.

| Estado | Verificação | Evidência e limite |
| --- | --- | --- |
| PASS físico | Oito casos novos | 145 assertions: redução JPEG, transparência e seis casos de leitura/preview obsoletos; decode/Canvas/File reais. Primeiro método isolado e duas execuções na regressão passaram. |
| PASS físico | Regressão final | `OK (10 tests)` em 10,698 s, dez métodos distintos selecionados. Inclui dois métodos de imagens, seletor/cancelamento e sete métodos anteriores. Sem impressão ou instrumentação ampla do ERP. |
| PASS físico | Imagens anteriores | 13 casos/324 assertions e oito saídas decodificadas. Repetição isolada `OK (1 test)` em 2,369 s; depois PASS na regressão final. Nessa regressão, os dois métodos somam 21 casos/469 assertions, não 21 métodos JUnit. |
| PASS físico | Seletor e demais contratos | Photo Picker real/callback nulo/mesma Activity/Bridge, PDF/JSON via MediaStore, entrada inválida, scoped storage, reload, ciclo de vida próprio e navegação/caixa sintéticos. Não equivale à UI completa do ERP. |
| PASS local | Construção/contratos | Build offline do módulo descartável, sintaxe/diff e seis suítes JS PASS. Não houve build/instalação do ERP principal ou AAB. |
| PENDENTE | Falha inicial do fixture | Primeira regressão: 9/10 PASS, teste anterior retornou `total=0`. Falha de preparo não localizada; não reproduzida após melhorar diagnóstico. Sem atribuir causa ou alterar timeout. |
| PENDENTE | Demais gates | Seleção positiva por URI, save completo/recarga, câmera/EXIF/HEIC, UI/segundo plano ERP, partilha/impressão, API 24–28, 16 KB e Auth/API isolados. |

## Oito cenários novos

1. Ruído JPEG 512×512, alvo de teste 1 KB: saída real 325×325, canvas com mesmas
   dimensões, 21.372 bytes. Mantém alvo suave, não novo teto do produto.
2. WebP real com alpha e somente decisão de capacidade WebP forçada a falso:
   PNG real com alfa do canto 0/centro 128. Não afirma falta de encoder neste WebView.
3. Reader A termina depois de preview B: rejeita A e preserva File/cache/preview B.
4. Imagem A inválida falha depois de B: rejeita A sem toast obsoleto. Exige mensagem
   canônica `Imagem inválida`; timeout do fixture não conta como `Image.onerror`.
5. Limpar input durante leitura: rejeita sem recriar seleção/cache.
6. Trocar input DOM durante leitura: não entrega resultado à tela nova.
7. Alterar acesso injetado durante leitura: rejeita resultado tardio.
8. Alterar acesso no preview sem outro onchange: sem sucesso; libera processamento.

Nas corridas, o decode já ocorreu pelo loader canônico; apenas a entrega é retida
por barreira. Acesso Free/Pro é injetado, não licença remota comprovada. Rejeições
são observadas imediatamente; cleanup libera barreiras, aguarda operações e remove
somente container/cache próprios. Seleção File/DataTransfer e cache são em memória:
não comprovam seleção positiva pelo sistema ou persistência.

## Falha inicial preservada

Rodada `738f9342-2a10-42bb-8048-d2f16ffef7cd`: novos oito casos PASS isolados em
2,035 s e na regressão. Nove dos dez métodos da regressão passaram; o anterior
de imagens falhou esperado 13/obtido 0. Os 12,001 s são da suíte inteira.

`total=0` situa a falha antes do primeiro cenário: APIs/presets, File/DataTransfer,
contexto Canvas ou geração/validação dos PNGs sintéticos. O detalhe JSON dessa
pré-condição não foi retido pelo primeiro coletor. Não há evidência suficiente
para culpar startup, toBlob, produto ou aparelho.

Melhorado apenas o diagnóstico: assert de failures antes da contagem e UUID
`validationRunId` nos logs dos dois testes de imagens e do seletor. O controlador
coleta apenas linhas desse UUID, incluindo a tag anterior de imagens; não limpa
o log global. Nenhum teste removido, timeout aumentado ou resultado FAIL apagado.

Rodada `b9bbb4dd-45e1-43c0-a881-c15200c551f3`: anterior isolado PASS (13/324 em
641 ms no fixture), depois dez métodos PASS (anterior 13/324 em 551 ms; novo
8/145 em 210 ms). Isso não explica a primeira falha nem prova estabilidade
determinística. Se reincidir, capturar fase/tempo/visibilidade da pré-condição.

O controlador também abortou antes de instalar com tela em Dozing/NotificationShade.
Depois de despertar a tela, comprovou o launcher novamente. Não foram forçados
senha/digital, alterado timeout de tela ou enviados Home/Back a janelas desconhecidas.
Back no seletor mantém a [guarda anterior de pacote/ID](android-seletor-cancelamento-2026-10-19.md).

## Preservação e evidências

Pacotes `br.com.ne3d.erp.bridgevalidation` e `.test` ausentes antes de instalar,
sem rede/permissões pessoais/modelos/GGUF/.so/bootstrap ERP. Fontes canônicas e
ambos os fixtures JS comparados byte a byte no APK. IDs/hashes instalados
conferidos; só esses dois binários novos foram desinstalados, inclusive na falha.
Não houve leitura/seleção de fotos pessoais.

| Artefato final | Bytes | SHA-256 |
| --- | --- | --- |
| Host | 9321864 | `91220cfb43c3049abf3337077460cd82b6061c8a1b49ee22a2c29232dc01759d` |
| Instrumentação | 1376730 | `458ef5ffbfa12ad8b65d5fc8d68386822c3eafb082ea05f3fbfffc0b717fa8ae` |

Antes/depois nas duas rodadas: ERP parado/hash
`5a47d1de374e739f54ca32d57240aa3ea1bc731be5f002b58bd1a1a626c25ac4`;
`.test` anterior `c8657d3fa5c3dbdc523dba30501e875a9efc0fb3853ef1eda426f154a38630fe`;
rede 1/1 e launcher no final. Hash comprova APK, não todos os dados pessoais.
ERP não aberto/atualizado: último build conhecido `0.1.0-29e9c1b79666b110`,
sem incorporar automaticamente as fontes atuais.

Evidências ignoradas em `artifacts/android-corrections-20261020/`: controlador
`run-device.cjs`, `{UUID}-metadata.json`, logs da instrumentação e
`current-summary.log` dos dois UUIDs acima. Retêm métodos/hashes/estado antes e
depois/falhas. A coleta final contém quatro linhas só da rodada aprovada.

## Arquivos e validação local

- Novo `image-corrections-validation.js` e inclusão no `index.html` do host.
- `BridgeMediaDeviceTest.java`: novo contrato e diagnóstico do contrato anterior.
- `RealPickerCancelDeviceTest.java`: somente UUID de correlação no log.
- `scripts/test-android-bridge-validation-isolation.js`: guardas do novo fixture.
- Este relatório, link no relatório local e `KANBAN-PUBLICACAO.md`.

Seis suítes JS PASS: `test-config-image-selection` (23 casos),
`test-config-image-encoding` (12), `test-android-browser-test-assets`,
`test-android-bridge-validation-isolation`, `test-android-media-validation-isolation`
e `test-android-file-permission-routing` (arquivos `.js` em `scripts/`).

```text
android/gradlew.bat --project-dir android --offline -PsimplificaBridgeValidation=true :bridge-validation:assembleDebug :bridge-validation:assembleDebugAndroidTest --console=plain
```

JUnit do produto/build web não repetidos: só testes/documentação mudaram. Warnings
preexistentes de depreciação/flatDir permanecem. Preservados os limites de save
global/metadados do estoque do [relatório local](correcao-imagens-local-2026-10-20.md).
Sem Supabase, IA, OptiCore, produção, webhook, assinatura, AAB, push/deploy ou
publicação. K08 continua incompleto.
