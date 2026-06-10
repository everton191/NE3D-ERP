# Homologacao fisica Android da Loja Online - 2026-06-09

## Resultado

Homologacao fisica Android retomada em 2026-06-10 e executada parcialmente em aparelho real.

O build local foi gerado, servido pela rede local e validado por HTTP. Um aparelho Android fisico foi detectado e autorizado via ADB. A loja publica, a rota admin contextual e parte do editor guiado foram abertas no navegador Android real.

Resultado geral desta retomada:

- Android fisico em navegador: validado parcialmente.
- Navegacao por gestos: validada no ASUS real.
- Teclado virtual real: validado em campo de nome da loja.
- Safe area em gestos: validada visualmente sem sobreposicao da barra inferior do sistema.
- Botao Voltar: bug fisico encontrado e corrigido nesta rodada.
- Navegacao por 3 botoes: setting alterado para teste, mas a interface visual continuou exibindo comportamento de gestos; manter como inconclusivo.
- PWA instalada: pendente.
- APK Android: pendente.

## Escopo respeitado

Nao foram feitas alteracoes em:

- banco de dados;
- planos;
- checkout;
- regras de slug;
- autenticacao;
- Service Worker;
- cache PWA;
- manifest;
- versionamento de PWA;
- versionCode/versionName;
- APK;
- deploy;
- push remoto.

## Branch e commits

- Branch: `codex/stable-premium-motion`
- Estado antes da retomada fisica: branch local `ahead 5` de `origin/codex/stable-premium-motion`
- Commit base observado antes da retomada: `0f0b033 docs(storefront): record Android physical homologation`

## Build local

Comando executado:

```bash
npm.cmd run build:web
```

Resultado: build concluido com sucesso e arquivos preparados em `dist/`.

## Servidor local pela rede

Foi usado servidor HTTP local apontando para `dist/`, com fallback de SPA e cache desativado por cabecalho `Cache-Control: no-store`.

- Host: `0.0.0.0`
- IP LAN detectado: `192.168.3.16`
- Porta: `5268`

URLs preparadas para teste em Android fisico:

- `http://192.168.3.16:5268/ne3d?admin=1`
- `http://192.168.3.16:5268/store-admin/ne3d`
- `http://192.168.3.16:5268/ne3d`

Verificacoes HTTP realizadas:

- `http://127.0.0.1:5268/ne3d?admin=1` retornou HTTP 200.
- `http://192.168.3.16:5268/ne3d?admin=1` retornou HTTP 200.
- `http://192.168.3.16:5268/store-admin/ne3d` retornou HTTP 200.
- `http://192.168.3.16:5268/ne3d` retornou HTTP 200.

## Dispositivo fisico

ADB foi localizado em:

```txt
C:\Users\PAESS\AppData\Local\Android\Sdk\platform-tools\adb.exe
```

Comando executado:

```bash
adb devices -l
```

Resultado inicial em 2026-06-09:

```txt
List of devices attached
```

Nenhum dispositivo Android foi detectado/autorizado.

Resultado da retomada em 2026-06-10:

```txt
RBAI********2X2        device product:WW_I005D model:ASUS_I005DA device:ASUS_I005_1
```

O numero de serie completo foi mascarado no relatorio.

Dados do aparelho:

- Fabricante: `asus`
- Modelo: `ASUS_I005DA`
- Android: `13`
- SDK: `33`
- Tamanho fisico reportado: `1080x2448`
- Densidade fisica reportada: `420`
- Densidade override reportada: `460`
- Navegador: Brave `1.91.171`
- Pacote em foco: `com.brave.browser`
- Modo de navegacao original: `navigation_mode=2` (gestos)
- Modo de navegacao restaurado ao final: `navigation_mode=2`

## Rotas preparadas

As rotas abaixo foram abertas no Android fisico:

- ERP/Admin da loja: `/ne3d?admin=1`
- Editor/entrada administrativa: `/store-admin/ne3d`
- Loja publica: `/ne3d`

Observacoes:

- `/ne3d?admin=1` abriu autenticada e exibiu controles de edicao.
- `/store-admin/ne3d` abriu a abertura do app; apos tocar em `Pular`, entrou no ERP autenticado, mas nao permaneceu diretamente no workspace do editor.
- `/ne3d` abriu a vitrine publica sem controles administrativos visiveis.

## Itens fisicos pendentes

Permanecem pendentes ou inconclusivos:

- confirmacao visual real de navegacao por 3 botoes;
- PWA instalada;
- APK Android instalado;
- orientacao retrato;
- orientacao paisagem;
- comportamento com campo de senha/PIN fora do editor da loja;
- carrinho completo da loja;
- fluxo completo de produto no editor guiado;
- fluxo completo de contato no editor guiado;
- rolagem real com dedo em toda a extensao da loja publica;
- rolagem real com dedo em toda a extensao do editor administrativo.

## Validacoes fisicas realizadas

### Navegacao por gestos

Validado no ASUS com `navigation_mode=2`.

Resultado:

- A loja abriu no Brave.
- A barra inferior do navegador/sistema nao cobriu a barra de acoes da loja.
- O bottom sheet do editor abriu acima da area inferior.
- O teclado virtual abriu e manteve o campo de nome da loja visivel.
- A rota `/ne3d?admin=1` permaneceu aberta durante o fluxo corrigido do botao Voltar.

### Navegacao por 3 botoes

Foi tentado alternar o aparelho via:

```bash
adb shell settings put secure navigation_mode 0
```

O valor passou de `2` para `0`, mas a captura visual continuou exibindo comportamento de gestos/pilula. Por isso, a homologacao de 3 botoes fica marcada como inconclusiva e precisa ser repetida manualmente nas configuracoes do Android ou em aparelho que mostre claramente a barra de tres botoes.

O valor original foi restaurado ao final:

```bash
adb shell settings put secure navigation_mode 2
```

### Teclado virtual real

Campo testado:

- Nome da loja, dentro do painel `Identidade`.

Resultado:

- Teclado abriu.
- Campo permaneceu focado e visivel.
- O painel subiu o necessario.
- O texto digitado apareceu no campo.
- O primeiro Voltar fechou o teclado.
- O valor de teste foi removido antes de sair.

### Editor contextual

Itens validados:

- Vitrine admin visivel e tocavel.
- Botao `Editar loja`.
- Abertura do bottom sheet.
- Selecao de `Identidade`.
- Campo de nome da loja com teclado real.
- Selecao de `Banner`.
- Destaque visual da area editada.
- Confirmacao de alteracoes nao salvas quando houve digitacao.
- Fechamento do painel por Voltar apos correcao.

Itens nao concluidos:

- Selecao completa de Produto.
- Selecao completa de Contato.
- Mini-card de progresso abrindo Checklist.
- Item pendente abrindo secao correspondente.

### Vitrine publica

Validado em `/ne3d`:

- Rota abriu no Android real.
- Nao foram vistos controles administrativos na captura publica.
- Secao de atendimento, botao WhatsApp e botao compartilhar ficaram visiveis.
- Carrinho flutuante apareceu sem cobrir a barra de gestos.
- Nao foi identificado overflow horizontal perceptivel na captura analisada.

### Store admin

Validado em `/store-admin/ne3d`:

- Rota retornou HTTP 200.
- No Android real, abriu tela de abertura do app.
- Apos tocar em `Pular`, entrou no ERP autenticado.
- Apareceu dialogo nativo de biometria/PIN, cancelado para continuar.
- A rota nao foi validada como workspace completo do editor nesta rodada.

## Testes automatizados executados

Todos os comandos abaixo passaram nesta rodada:

```bash
node --check app.js
node --check scripts/test-storefront-contextual-mobile-flow.js
node --check scripts/test-storefront-visual-simple-editor.js
npm.cmd run test:storefront-contextual-mobile-flow
npm.cmd run test:storefront-guided-editor
npm.cmd run test:storefront-publish-validation
npm.cmd run test:storefront-visual-simple-editor
npm.cmd run test:storefront-mobile-resilience
npm.cmd run test:storefront-desktop-upscale
npm.cmd run test:storefront-mobile-actions
npm.cmd run test:storefront-mobile-real
npm.cmd run test:storefront-public-ui
npm.cmd run test:storefront-light-theme-stability
npm.cmd run test:storefront-theme-v2
npm.cmd run test:theme-isolation
npm.cmd run test:storefront-visual-balance
npm.cmd run test:storefront-final-polish
npm.cmd run test:storefront-demo-products
npm.cmd run test:storefront-idempotency
npm.cmd run test:storefront-persistence-sync
npm.cmd run test:storefront-offline-recovery
npm.cmd run test:storefront-share-links
npm.cmd run test:storefront-performance-lite
npm.cmd run test:storefront-pwa-upgrade
npm.cmd run build:web
git diff --check
git diff --cached --check
```

Marcador final da bateria local:

```txt
ANDROID_PHYSICAL_PREP_TESTS_OK
```

## Bugs encontrados

Bug fisico confirmado:

- No navegador Android real, apos abrir o painel de Identidade e fechar o teclado com Voltar, o segundo Voltar saiu do navegador/foi para a tela de apps em vez de fechar primeiro o subcontexto/painel mantendo `/ne3d?admin=1`.

Impacto:

- O usuario poderia sair acidentalmente da loja durante a edicao mobile.
- O comportamento violava a ordem esperada: teclado, subcontexto, painel, rota.

## Correcoes aplicadas

Correcoes aplicadas nesta retomada:

- Adicionado historico interno para o painel guiado da loja.
- Adicionado fechamento do painel via `popstate` antes do render/volta da rota publica.
- Ajustado `fecharPainelEdicaoGuiadaLoja` para aceitar fechamento vindo do historico sem recriar loop.
- Atualizado teste de contrato contextual mobile para exigir o novo fluxo.

Reteste fisico:

- Com alteracao pendente: Voltar abriu confirmacao `Deseja sair sem salvar?`, sem sair do navegador.
- Sem alteracao pendente: Voltar fechou o painel e permaneceu na vitrine.

## Riscos restantes antes de publicacao

- Safe area Android ainda precisa ser confirmada em aparelho com navegacao por 3 botoes.
- PWA instalada ainda precisa ser aberta em aparelho real.
- APK ainda precisa ser testado em aparelho real.
- Teclado virtual ainda precisa ser validado em campos de senha/PIN fora da loja.
- Produto, Contato e Checklist do editor guiado ainda precisam de ciclo fisico completo.
- Store admin dedicado ainda precisa abrir diretamente no workspace do editor em sessao real.
- Paisagem ainda precisa ser validada.
- PWA/APK ainda precisam confirmar a mesma correcao do Voltar fora do Brave.

## Conclusao

A preparacao local para homologacao fisica foi concluida com sucesso: build gerado, servidor LAN validado e testes automatizados aprovados.

A retomada em Android real confirmou funcionamento parcial da loja e revelou um bug real no botao Voltar do editor contextual. O bug foi corrigido e retestado no aparelho ASUS com Android 13 em navegador Brave.

A etapa ainda nao deve ser considerada liberada para release final porque PWA instalada, APK Android, navegacao por 3 botoes visualmente confirmada, paisagem e ciclos completos de Produto/Contato/Checklist permanecem pendentes.
