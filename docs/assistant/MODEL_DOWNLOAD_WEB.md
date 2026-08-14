# Modelo local na PWA

## Estado atual

A PWA usa o mesmo contrato de `ModelProvider` do Android, mas com implementação própria em `WebLocalModelProvider`. O aplicativo continua carregando normalmente quando WebGPU, runtime ou artifact web não estiverem disponíveis.

Nenhum modelo Android `.litertlm` é oferecido como modelo web. Um artifact só pode aparecer para download quando existir uma combinação realmente compatível de:

- runtime web carregado;
- WebGPU com adapter disponível;
- descriptor versionado para `web`, `pwa` ou `webgpu`;
- URL HTTPS imutável;
- tamanho e SHA-256 conhecidos;
- capacidade de verificar o checksum antes da ativação.

Enquanto o projeto não publicar esse conjunto, a interface informa que a IA local não está disponível no navegador. Isso é intencional e evita download inútil de gigabytes.

## Isolamento do Simplifica 3D

Este checkout publica somente o `assistant-pack` do Simplifica 3D, com `appId` e `modelScope` fixos em `simplifica-3d`. Rural e Tec mantêm IA, runtime, memória, catálogo e artefatos nos respectivos projetos; seus packs não entram no HTML, service worker, build web ou APK deste produto.

O Editor da Loja é um domínio interno do Simplifica 3D e usa a mesma IA privada do ERP. Ele não cria outro runtime nem outro modelo dentro do aplicativo.

## Armazenamento

O `PwaModelArtifactStore` prefere OPFS quando `navigator.storage.getDirectory()` existe. Caso contrário, usa IndexedDB em blocos. O modelo nunca entra no cache comum do service worker.

Antes do download são verificados:

- quota e uso estimados;
- bytes restantes;
- margem de segurança;
- solicitação de armazenamento persistente, quando o navegador permite.

O status registra backend, persistência, versão, bytes baixados, SHA-256 esperado e estado de instalação.

## Download e retomada

O fluxo é:

1. salvar estado `DOWNLOADING`;
2. continuar do tamanho realmente armazenado;
3. solicitar `Range` quando há parcial;
4. validar o início de `Content-Range`;
5. reiniciar do zero se o servidor ignorar a retomada;
6. preservar o parcial em cancelamento ou perda de conexão;
7. exigir exatamente o tamanho publicado;
8. mudar para `VERIFYING`;
9. verificar SHA-256;
10. passar por `INSTALLING` e publicar `READY` somente depois da integridade comprovada.

Para artifacts pequenos, WebCrypto pode verificar o buffer. Artifacts grandes exigem um verificador incremental fornecido pelo runtime web. Sem esse verificador, o estado fica `STORED`, nunca `READY`.

## Contrato do runtime web

O runtime deve ser injetado como `SimplificaWebAiRuntime` ou `__SIMPLIFICA_WEB_AI_RUNTIME__` e oferecer, no mínimo:

```js
{
  capabilities(),
  load({ descriptor, artifact, contextWindow }),
  send(request),
  unload()
}
```

Para modelos grandes, deve oferecer também `verifyArtifactChecksum(args)` ou `verifyChecksum(args)`. `benchmark()` é opcional.

Os descriptors web são injetados por `SimplificaWebAiArtifacts` ou `__SIMPLIFICA_WEB_AI_ARTIFACTS__`. Não há download automático; a instalação só começa após confirmação do usuário na configuração de IA.

## Limitações reais

- Ainda não existe runtime web de inferência publicado neste checkout.
- Ainda não existe artifact web compatível publicado no catálogo.
- WebGPU, OPFS e persistência variam entre navegadores.
- O teste automatizado valida o contrato com runtime, rede e armazenamento controlados; o aceite em navegadores reais permanece na Etapa 45.
