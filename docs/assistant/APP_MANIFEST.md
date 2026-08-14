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
| Simplifica 3D | `simplifica-3d` | integração ativa e runtime universal disponível |
| Simplifica Rural | `simplifica-rural` | runtime isolado pronto para adapters do app |
| Simplifica Tec | `simplifica-tec` | runtime isolado pronto para adapters do app |
| Editor da Loja | `simplifica-store-editor` | runtime isolado somente leitura pronto para adapters |

Para incluir outra aplicação, não copie o pack do ERP inteiro. Crie manifest mínimo, namespace exclusivo e adapters do domínio conforme `ADD_NEW_APP_ADAPTER.md`.

O bootstrap exige `modelScope === manifest.appId`. Assim, conversa, cache, configuração do modelo, artifacts e identidade da UI permanecem separados mesmo quando vários assistentes são carregados no mesmo dispositivo.
