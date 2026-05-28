# Storefront Architecture - Fases 4A/4B

Data: 2026-05-27

Escopo: desacoplamento arquitetural inicial. Esta fase nao move a logica critica da loja.

## Modulos

```txt
modules/
 ├── storefront
 ├── store-editor
 └── store-preview
```

## Responsabilidades

### `modules/storefront`

Render publico da loja:

- home publica;
- catalogo;
- categorias;
- paginas de produto;
- carrinho publico;
- compartilhamento.

Nao deve conter editor, configuracoes admin ou estado operacional do ERP.

### `modules/store-editor`

Experiencia administrativa da loja:

- configuracoes;
- blocos editaveis;
- produtos/categorias em contexto admin;
- validacao de publicacao;
- feedback de salvamento.

Nao deve renderizar diretamente a loja publica nem controlar o preview.

### `modules/store-preview`

Simulacao visual isolada:

- preview desktop/tablet/mobile;
- render controlado;
- scroll proprio;
- estado visual separado.

Nao deve alterar runtime global, shell principal ou persistencia.

## Regra de camadas

Novas interacoes da loja devem usar:

- `#modal-layer`;
- `#drawer-layer`;
- `#overlay-layer`.

`#popup` permanece apenas como legado temporario fora dos novos fluxos.

## Fase 4B - Migracao controlada

Flag oficial:

```js
enableStorefrontV2
```

Adapter central:

```js
renderStorefrontView({
  mode: "public" | "editor" | "preview",
  source: "legacy" | "v2"
})
```

Estado atual:

- `public/v2`: ativo por padrao, adiciona contrato raiz e zonas oficiais sem mudar carrinho, checkout ou pedidos;
- `editor/v2`: ativo por padrao, usa wrapper do painel existente com zona `store-editor-zone`;
- `preview/v2`: ativo por padrao, usa `store-preview-zone`, `store-preview-frame` e `store-preview-scroll`;
- `legacy`: permanece disponivel para rollback via `source: "legacy"` ou desativando `__ENABLE_STOREFRONT_V2__`.

Ainda legacy:

- checkout/carrinho real;
- handlers de produtos/categorias;
- persistencia e salvamento;
- overlays antigos de paineis visuais ainda migrados depois.

## Fase 4C - Editor profissional

O editor passa a ter um workspace dedicado, sem depender do grid generico da loja publica:

```txt
store-editor-shell
 ├── store-editor-sidebar
 ├── store-editor-workspace
 │    ├── store-editor-header
 │    ├── store-editor-main
 │    └── store-editor-sections
 └── store-preview-panel
```

Responsabilidades atuais:

- `store-editor-sidebar`: navegacao interna, estado da loja e salvamento;
- `store-editor-workspace`: area principal de edicao;
- `store-editor-header`: titulo e acoes agrupadas;
- `store-editor-main`: avisos e conteudo da aba ativa;
- `store-editor-sections`: agrupamento dos cards reais da aba;
- `store-preview-panel`: preview responsivo, lateral no desktop e empilhado em telas menores.

Regras:

- acoes primarias, secundarias e de sistema ficam agrupadas para evitar sobreposicao;
- preview nao deve reduzir o workspace abaixo do minimo util;
- mobile usa navegacao horizontal/abas e preview empilhado, sem desktop comprimido.

## Fase 4D - Refinamento do editor

Todas as abas passam por `renderStoreEditorTabContent(...)`, que aplica:

- `store-editor-tab-panel`;
- variante `has-inline-preview` para abas que ja renderizam preview proprio;
- variante `has-preview-panel` para abas que precisam receber o preview lateral automaticamente;
- `store-editor-tab-main` para separar conteudo administrativo do preview.

Produtos ganharam uma camada de resumo operacional (`store-products-summary`), formulario identificado (`storefrontProductForm`) e lista em `store-product-list-panel`, mantendo a logica de salvar/produtos intacta.

## Fase 4E - Extracao segura do editor para modulos

O editor passou a carregar helpers em `modules/store-editor` antes do `app.js`, sem transformar o build em ES modules e sem remover fallback legado:

- `storeEditorRenderer.js`: renderiza o wrapper `store-editor-tab-panel`.
- `storeEditorTabs.js`: normaliza a aba ativa e define quais abas ja possuem preview proprio;
- `storeEditorPreview.js`: monta o preview automatico das abas que precisam de `has-preview-panel`;
- `storeEditorProducts.js`: concentra helpers visuais/estatisticos de produtos e empty state;

Ordem de carregamento: renderer, tabs, preview, products e depois `app.js`. O renderer busca `tabs` e `preview` somente em tempo de execucao do render, permitindo essa ordem sem acoplamento rigido.

`scripts/prepare-web.js` copia apenas os modulos formais (`modules/store-editor`, `modules/store-preview` e `modules/storefront`) para `dist/modules`, evitando publicar scripts antigos ou experimentais. `app.js` continua sendo o orquestrador principal: decide `renderStorefrontView`, chama o render da aba, injeta estado global e preserva fallback local caso os scripts modulares nao carreguem por cache/PWA. Nenhuma regra de planos, pagamentos, checkout ou salvamento de produto foi movida nesta fase.

## Fase 4F - Cache, PWA e fallback observavel

O service worker inclui os quatro helpers do editor no precache e usa cache versionado `simplifica-3d-v116-estavel-20260528-store-editor-modules`. O `index.html` tambem usa query string propria da fase para `app.js`, `sw.js` e scripts de `modules/store-editor`, evitando combinacao antiga de app/cache com helpers novos.

`app.js` valida se o namespace modular esta completo antes de usar o renderer:

- `renderer.renderTabContent`;
- `tabs.sanitizeTab`;
- `preview.renderPreviewForTab`;
- `products.getStats`.

Se todos existirem, a aba recebe `data-store-editor-renderer="module"` e `data-store-editor-modules-ready="true"`. Se algum helper faltar, o fallback local assume e marca `data-store-editor-renderer="fallback"` e `data-store-editor-modules-ready="false"`. O log de fallback e discreto e restrito a `APP_DEBUG_MODE`.

O fallback ainda nao deve ser removido. Ele protege PWA/cache antigo, deploy parcial, falha de script e rollback.
