# K08 — correções locais de imagens, 20/10/2026

Branch `codex/melhorias-setembro-2026`, base `6c3eeca`. Continuação solicitada
pelo usuário. **Três defeitos locais corrigidos; homologação Android desta versão
e publicação continuam PENDENTES.** O celular não apareceu nas duas consultas
USB da rodada. Nenhum aplicativo foi instalado, aberto ou modificado no aparelho.

## Causa, correção e prova

| Estado | Defeito | Correção e evidência |
| --- | --- | --- |
| PASS local | Leitura pendente A substituía B | Só o preview tinha guarda de seleção. O leitor usado para salvar aguardava o decode e publicava A sem revalidar input/File/acesso. Agora compartilha a guarda de identidade e rejeita leitura obsoleta com `PERSONALIZATION_IMAGE_SELECTION_CHANGED`, sem substituir cache ou emitir erro da seleção antiga. Preview também revalida acesso depois do processamento. |
| PASS local | Dimensões incorretas após compactar | O encoder usava canvas menor, mas retornava string e deixava o canvas original em 512×512. O otimizador declarava essas dimensões antigas. Agora o canvas fornecido reflete o último candidato realmente codificado; não se cria uma redução não utilizada após a oitava tentativa. |
| PASS local/Chrome | Transparência no fallback | Logo WebP podia virar JPEG quando o navegador decodificava WebP, mas a decisão de capacidade negava seu encoder. Presets com `preserveAlpha` agora usam PNG para entradas não JPEG nesse ramo. JPEG convencional/perfil e preferência WebP permanecem. |

O leitor atual com erro de decode continua preservando o valor anterior e
mostrando a mensagem existente. Apenas resultados obsoletos rejeitam em vez de
devolver um arquivo antigo ou fallback para salvar. O chamador
`salvarPersonalizacao()` já possui catch/finally antes dos uploads; sua estrutura
não foi alterada. Não foram mudados presets, crop, layouts ou regras comerciais.

**Limite importante:** a guarda protege a leitura enquanto ela está pendente.
Não é um snapshot transacional de todo `salvarPersonalizacao()`: uma leitura que
já resolveu pode ficar antiga enquanto outra das cinco leituras ou um upload
ainda aguarda. A validação desse fluxo completo e persistência fica na próxima
rodada; não se afirma que toda concorrência do salvamento esteja resolvida.

O helper de codificação mantém retorno string, oito tentativas e o alvo suave
de 500 KB. Não foi criada rejeição de PNG/arquivo válido por um teto arbitrário.
Ausência de contexto 2D durante redução/cópia provoca erro, não sucesso com canvas
vazio. O helper agora atualiza dimensões/pixels do canvas temporário recebido;
os chamadores existentes foram inspecionados. Fora deste recorte,
`otimizarFotoItemEstoque()` ainda declara 420×420 literais após compactação;
não foi alterado nem aprovado como metadado correto para todos os ramos.

## Testes e limites de evidência

- Seleção: 23 cenários Node PASS, oito novos. Incluem A tardio com sucesso/erro
  depois de B, limpar input, recriar input, perda de acesso sem novo onchange,
  leitura atual sem preview e erro atual preservando fallback.
- Codificação: 12 cenários Node PASS com Canvas/Image injetados, incluindo
  contexto 2D nulo na redução e na cópia final. A baseline imutável
  `70d6ee5`, carregada em memória, reproduziu três falhas: 512 versus 325,
  512 versus 378 e WebP transparente virando JPEG. Não houve checkout/reset para
  reproduzir a baseline. Os dois ramos de contexto nulo foram acrescentados
  depois dessa comparação inicial de dez contratos.
- Chrome headless 155, perfil novo: JPEG com ruído sintético realmente codificado
  e decodificado a 325×325, canvas com as mesmas dimensões e saída de 21.393 bytes
  para alvo propositalmente baixo de 1 KB. Demonstra limite suave e metadados,
  não uma nova regra de tamanho do produto.
- WebP real com transparência decodificado pelo navegador, decisão de encoder WebP
  forçada para indisponível, PNG de saída real decodificado: alfa do canto 0 e do
  centro 128 preservados. Não se afirma que o Chrome utilizado careça de encoder
  WebP; somente essa decisão de capacidade foi injetada.
- Regressão canônica no mesmo Chrome: 13 cenários, 324 assertions e oito saídas
  decodificadas PASS. Seleção programática File/DataTransfer, sem seletor do
  sistema e sem persistência. Não é nova execução no WebView do ASUS.
- Sintaxe do módulo, app e teste novo PASS. Build web sem downloads PASS:
  `0.1.0-3652db5ee4677f06`; fingerprint e exclusão de GGUFs conferidos.

22 suítes JS selecionadas PASS no estado final: `test-config-image-selection`,
`test-config-image-encoding`, `test-android-browser-test-assets`,
`test-android-bridge-validation-isolation`, `test-android-file-permission-routing`,
`test-theme-account-ui`, `test-theme-isolation`, `test-theme-backup-authority`,
`test-ui-theme-consistency`, `test-light-theme-no-gradient`,
`test-web-build-appearance-fingerprint`, `test-web-build-no-local-model-artifacts`,
`test-pdf-browser-bindings`, `test-pdf-delivery-resources`,
`test-pdf-document-delivery`, `test-play-ai-disabled`, `test-play-no-self-update`,
`test-play-no-external-checkout`, `test-play-account-deletion`,
`test-android-back-navigation`, `test-android-media-validation-isolation` e
`test-cash-renderer` (arquivos `.js` em `scripts/`). As suítes Play são contratos
locais do código, não certificação do artefato final ou da Play Console.

Evidência do navegador retida em `artifacts/image-encoding-20261020/` (ignorado):
`browser.html`, `run-browser.cjs` e execução
`5daac7c7-c4d3-4026-be94-2ef9185a4726-{summary.json,browser.html,stderr.log}`.
Fixture carrega apenas o módulo canônico, presets extraídos e ensaio sintético
de imagens; CSP sem conexão, sem bootstrap ERP, conta, modelos ou credenciais.
Perfil exclusivo, extensões/sync/background networking desativados e proxy
inacessível para requisições de rede. O processo foi encerrado; perfil de teste
e evidências permanecem nos artefatos, sem reutilizar o perfil pessoal do Chrome.

## Arquivos e checkpoints

- `src/features/config/config-appearance.js`: correções funcionais locais.
- `scripts/test-config-image-selection.js`: casos de leitura obsoleta.
- `scripts/test-config-image-encoding.js`: contrato de codificação/fallback.
- `package.json`: comando `test:config-image-encoding`, sem dependência nova.
- Este relatório e `docs/KANBAN-PUBLICACAO.md`.

Checkpoints funcionais: `70d6ee5` — leitura pendente obsoleta;
`f67e6f9` — dimensões/alpha e 12 contratos de codificação. Documentação em
commit separado após os testes. OptiCore preexistente preservado.

## Próxima validação

Reconectar o telefone e repetir no pacote isolado com fonte atual; os PASS de
19/10 são históricos e não certificam esta alteração. Seleção positiva por URI,
salvamento/recarga e concorrência do fluxo completo exigem perfil descartável.
Não navegar por fotos pessoais. Câmera/EXIF/HEIC, UI completa, impressão/partilha,
API 24–28, execução 16 KB e demais cartões do Kanban continuam pendentes.

Sem Supabase/Auth/API, webhook, cobrança real, IA, OptiCore, deploy, push,
produção, APK/AAB, assinatura ou publicação nesta rodada. JUnit/compilação Java
não reexecutados: não houve mudança Java/Gradle. Não é READY TO PUBLISH.
