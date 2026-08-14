# App Manifest

Cada aplicativo descreve somente o que sua assistente pode conhecer e solicitar:

```js
createAppManifest({
  appId,
  appName,
  domains,
  routes,
  entities,
  relationships,
  capabilities
})
```

`routes` exige `id` e `path` únicos. `capabilities` declara `READ`, `NAVIGATION`, `CALCULATE`, `MEDIA` ou `WRITE`; declarar uma capacidade não concede execução automaticamente. O Tool Registry ainda exige schema, adapter testado e permissão.

Packs atuais:

| Produto | appId / modelScope | Situação |
|---|---|---|
| Simplifica 3D | `simplifica-3d` | integração ativa |
| Simplifica Rural | `simplifica-rural` | pack isolado |
| Simplifica Tec | `simplifica-tec` | pack isolado |
| Editor da Loja | `simplifica-store-editor` | pack somente leitura preparado |

Para incluir outra aplicação, não copie o pack do ERP inteiro. Crie manifest mínimo, namespace exclusivo e adapters do domínio conforme `ADD_NEW_APP_ADAPTER.md`.
