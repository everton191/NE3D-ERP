# Continuação local — webhook por último

Data: 18/10/2026. Branch `codex/melhorias-setembro-2026`, HEAD inicial
`95745db`. Alteração preexistente de `apps/opticore` preservada.
Usuário determinou continuar as outras correções e deixar webhook/sandbox para
o fim. Isso adia a homologação externa, não a aprova nem autoriza implantação.

Checkpoints funcionais após testes PASS: `2468ae5` (callbacks Android) e
`fbb9cf3` (seleção de imagens, fingerprint e atalhos de teste).

## Correções gravadas

### Permissão de armazenamento no Android 24–28

`SimplificaFilesPlugin.savePdf` e `saveFile` usavam o mesmo callback, que
escolhia o gravador pela extensão do nome. Uma chamada válida de PDF sem nome,
depois de conceder permissão, podia usar o nome JSON e MIME genérico padrão.
Com permissão prévia, a mesma chamada usava corretamente PDF. O conteúdo não
era convertido para JSON; o erro era de rota, nome e MIME.

Agora cada operação retoma seu próprio callback/gravador. Negativa continua
rejeitando a chamada; API 29+ continua usando armazenamento com escopo. Sem
estado global ou mudança de contatos, Downloads, layout ou permissões pedidas.

Regressão `test-android-file-permission-routing.js`: RED no código anterior,
GREEN depois. É contrato da fonte Java, não simulação do diálogo Android.
Gradle offline recompilou o Java e reexecutou `:app:testPlayDebugUnitTest`:
**15 suítes, 74 testes, zero falhas/erros/skips**, 84 tarefas executadas.
Não foram executadas tarefas de empacotamento APK/AAB.

### Seleção concorrente de imagens nas configurações

Em `config-appearance.js`, escolher A e depois B antes de A terminar permitia
que o sucesso antigo substituísse a prévia/cache de B. Pior: uma falha antiga
limpava a seleção atual de B, fazendo a leitura posterior manter o logo antigo.

A correção identifica a operação por input e aceita apenas o arquivo/elemento
atual. Sucesso, erro e finalização obsoletos não alteram seleção, prévia,
indicador ou mensagens novos. Limpar a seleção, recriar a tela ou passar de
acesso Pro para Free invalida a operação anterior. O cache agora compara a
identidade do arquivo e o tipo, não somente nome/data potencialmente iguais.
Arquivo e token ficam somente em memória; não foi adicionada persistência.

`test-config-image-selection.js`: RED antes, **15 cenários GREEN** depois,
executando o módulo canônico com loader/canvas/elementos sintéticos. Inclui
sucesso/erro fora de ordem, processamento pendente, seleção limpa, input
recriado, arquivos diferentes com mesmo nome/data, cinco tipos de imagem,
erro atual e barreira Free/Pro. Não certifica galeria/câmera/WebView reais nem
gravação remota de imagens.

### Identificação do build web/PWA

O fingerprint do build não incluía `config-appearance.js`: a correção acima
sozinha ainda gerava `0.1.0-29e9c1b79666b110`. O arquivo foi acrescentado aos
inputs existentes, sem reescrever o sistema de build ou alterar o CSS.

`test-web-build-appearance-fingerprint.js`: RED antes; depois verifica o cálculo
canônico, determinismo e mudança do ID quando apenas esse arquivo muda em
memória. Build web final **PASS**, ID `0.1.0-4718b10a8c334d08`; fonte copiada e
ID no service worker conferidos. Não certifica atualização de um PWA instalado
ou corrige automaticamente inputs de outros módulos fora desta alteração.

### Testes antigos de Google OAuth

A regressão encontrou uma expectativa antiga de Google ativo e um extrator
que confundia a chave de um parâmetro desestruturado com o corpo da função.
O estado já existia no HEAD inicial; o commit `eacf02a` de 30/07 desativou
intencionalmente Google OAuth até configuração/verificação oficial.

Foram corrigidos apenas os dois testes, preservando o produto desligado.
Agora renderizam login/cadastro/verificação com dependências sintéticas,
conferem campos/termos/privacidade e ausência de Google, e verificam o helper
habilitado somente em VM isolada e zero redirecionamentos com gate desligado.
Ambos eram RED e passaram GREEN. Nenhuma autenticação real foi executada.

## Validação final

**24 suítes JS PASS**, mais os 74 JUnit frescos acima. Nomes executados:

```text
test-config-image-selection.js
test-android-file-permission-routing.js
test-android-media-validation-isolation.js
test-android-bridge-validation-isolation.js
test-android-back-navigation.js
test-pdf-delivery-resources.js
test-pdf-browser-bindings.js
test-theme-account-ui.js
test-theme-isolation.js
test-theme-backup-authority.js
test-ui-theme-consistency.js
test-light-theme-no-gradient.js
test-play-ai-disabled.js
test-play-no-self-update.js
test-play-no-external-checkout.js
test-play-account-deletion.js
test-account-security-inventory-foundation.js
test-account-security-activation.js
test-phase3-privacy-analytics.js
test-prepublication-p0.js
test-google-integrations-foundation.js
test-auth-ui.js
test-web-build-appearance-fingerprint.js
test-web-build-no-local-model-artifacts.js
```

Sintaxe JS, JSON do package e `git diff --check` PASS. Várias dessas suítes são
contratos estáticos: não transformar 24 suítes em aprovação de runtime remoto.
Não houve Supabase local/remoto, chamadas ao Mercado Pago, deploy, push,
migrations, APK/AAB ou instalação. `adb devices` apenas confirmou que o ASUS
estava autorizado/conectado; nenhum app, permissão ou rádio foi manipulado.

## Arquivos desta rodada

- `android/app/src/main/java/br/com/ne3d/erp/SimplificaFilesPlugin.java`
- `src/features/config/config-appearance.js`
- `scripts/test-android-file-permission-routing.js`
- `scripts/test-config-image-selection.js`
- `scripts/prepare-web.js`
- `scripts/test-web-build-appearance-fingerprint.js`
- `scripts/test-account-security-inventory-foundation.js`
- `scripts/test-google-integrations-foundation.js`
- `package.json` (somente três atalhos de testes)
- Este relatório, o inventário K09 e `docs/KANBAN-PUBLICACAO.md`.

## Próximas validações, sem webhook nesta frente

1. Aparelho/emulador descartável API 24–28: permitir/negar/repetir Downloads,
   PDF/arquivo sem nome e com extensões não convencionais. ASUS atual é API 33;
   compilação/JUnit não substituem esse ensaio.
2. Navegador/WebView descartáveis: selecionar/cancelar imagem, trocar A→B e
   navegar durante otimização; conferir leitura para salvar. Não usar conta
   real nem afirmar persistência remota por teste em memória.
3. K09: tratar as pendências concretas do [inventário de privacidade](privacidade-inventario-local-2026-10-18.md),
   sem remover dados/contratos reais ou inventar prazos de retenção.
4. K07 e demais fluxos Android/16 KB continuam pendentes nos seus ambientes.
5. Webhook/Edge/Mercado Pago sandbox ficam como última frente de homologação
   externa, antes de qualquer implantação de cobrança em produção.

**Não é READY TO PUBLISH.** As correções desta rodada ainda não estão no APK
instalado. K10/produção e K11/AAB/publicação exigem autorização própria.
