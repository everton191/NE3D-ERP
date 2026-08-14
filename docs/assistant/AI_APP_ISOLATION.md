# Isolamento da IA do Simplifica 3D

Data: 2026-08-14

## Regra

O Simplifica 3D possui IA própria. Este repositório não distribui runtime, pack, memória, catálogo ou modelo de Rural e Tec.

## Fronteiras verificáveis

- Identidade web: `appId=modelScope=simplifica-3d`.
- Identidade Android: pacote `br.com.ne3d.erp`.
- Modelo Android: `filesDir/models`, privado do APK.
- Preferências Android: `simplifica_local_ai_v1`.
- Download Android: trabalho `simplifica-3d-local-model-v1`.
- PWA: somente `apps/simplifica/assistant-pack/index.js` entra no HTML, build e cache.
- Memória e cache web: prefixados com `assistant:simplifica-3d`.
- Loja: permanece um domínio do Simplifica 3D, sem IA independente.

## Exclusões

Os packs de Rural, Tec e Editor da Loja, o bootstrap multiapp e o teste que instanciava quatro aplicações foram removidos deste checkout. Cada aplicativo externo deverá manter sua implementação no próprio projeto e pacote Android, sem acessar arquivos privados, preferências ou memória do Simplifica 3D.

## Prova automatizada

`npm.cmd run test:assistant-app-isolation` falha se um pack estrangeiro voltar ao HTML, service worker ou árvore distribuída, se reaparecer uma fábrica multiapp, ou se as identidades privadas do modelo Android forem alteradas.
