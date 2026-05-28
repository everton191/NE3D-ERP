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
