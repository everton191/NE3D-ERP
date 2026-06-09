# Homologacao fisica Android da Loja Online - 2026-06-09

## Resultado

Homologacao fisica Android nao concluida nesta rodada.

O build local foi gerado, servido pela rede local e validado por HTTP, mas nenhum aparelho Android fisico foi detectado/autorizado via ADB durante a execucao. Por isso, os itens que dependem de toque real, teclado virtual, barra de navegacao Android e PWA/APK instalado permanecem pendentes de validacao fisica.

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
- Estado antes da homologacao: branch local `ahead 4` de `origin/codex/stable-premium-motion`
- Commit base observado antes do relatorio: `b44a905 test(storefront): complete final local visual homologation`

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

## Dispositivo fisico

ADB foi localizado em:

```txt
C:\Users\PAESS\AppData\Local\Android\Sdk\platform-tools\adb.exe
```

Comando executado:

```bash
adb devices -l
```

Resultado:

```txt
List of devices attached
```

Nenhum dispositivo Android foi detectado/autorizado.

## Rotas preparadas

As rotas abaixo foram preparadas para abertura em Android fisico, mas nao foram homologadas em aparelho real nesta rodada:

- ERP/Admin da loja: `/ne3d?admin=1`
- Editor da loja: `/store-admin/ne3d`
- Loja publica: `/ne3d`

## Itens fisicos pendentes

Permanecem pendentes porque exigem aparelho real:

- modelo do aparelho;
- versao Android;
- navegador usado no aparelho;
- modo de navegacao por gestos;
- modo de navegacao por 3 botoes;
- safe area real com barra de navegacao Android;
- teclado virtual real;
- comportamento com campo de senha/PIN;
- botao voltar fisico/virtual;
- gesto lateral de voltar;
- bottom sheets acima dos botoes virtuais;
- FABs da loja acima dos botoes virtuais;
- carrinho da loja acima dos botoes virtuais;
- barra inferior do ERP acima dos botoes virtuais;
- barra inferior da loja acima dos botoes virtuais;
- PWA instalada;
- APK Android instalado;
- orientacao retrato;
- orientacao paisagem;
- overflow perceptivel durante toque real;
- scroll real com dedo no editor e loja publica.

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

Nenhum bug novo de aplicacao foi confirmado pelos testes automatizados ou pela verificacao HTTP local.

Bloqueio encontrado:

- Sem aparelho Android fisico detectado/autorizado via ADB, a homologacao fisica nao pode ser considerada concluida.

## Correcoes aplicadas

Nenhuma correcao de codigo foi aplicada nesta fase.

Alteracao realizada:

- Criacao deste relatorio de homologacao com o status real da validacao.

## Riscos restantes antes de publicacao

- Safe area Android ainda precisa ser confirmada em aparelho com navegacao por 3 botoes.
- Safe area Android ainda precisa ser confirmada em aparelho com navegacao por gestos.
- PWA instalada ainda precisa ser aberta em aparelho real.
- APK ainda precisa ser testado em aparelho real.
- Teclado virtual ainda precisa ser validado em campos de senha/PIN, loja e editor.
- Bottom sheets, FABs e barras inferiores ainda precisam de confirmacao em hardware real.
- Gesto de voltar Android ainda precisa ser validado com popup, editor, loja e rotas publicas.

## Conclusao

A preparacao local para homologacao fisica foi concluida com sucesso: build gerado, servidor LAN validado e testes automatizados aprovados.

A homologacao fisica Android permanece pendente por ausencia de dispositivo detectado/autorizado durante a execucao.
