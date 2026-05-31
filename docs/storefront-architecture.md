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

## Fase 4G - Reducao segura do app.js

Os modulos do editor agora expoem versao interna:

- `version = "4G"`;
- `moduleVersion = "store-editor-4g"`;
- `isStoreEditorModuleReady()`.

Classificacao dos trechos nesta fase:

- `KEEP_IN_APP_ORCHESTRATOR`: `renderStorefrontView`, decisao `public/editor/preview`, integracao com estado global e fallback;
- `ACTIVE_IN_MODULE`: wrapper das abas, decisao de preview por aba, preview automatico e helpers visuais de produtos;
- `FALLBACK_REQUIRED`: `renderStoreEditorTabContent` local, agora reduzido para fallback minimo;
- `LEGACY_DUPLICATED`: titulos/preview automatico que existiam dentro do fallback e foram removidos do `app.js`;
- `SAFE_TO_REMOVE_LATER`: fallback minimo, apenas depois de validar PWA/deploy por mais ciclos.

O fallback minimo ainda abre o editor e mostra o conteudo da aba, mas nao tenta reproduzir todo o preview automatico do modulo. Isso reduz duplicacao real no `app.js` sem retirar a protecao contra cache antigo ou falha parcial de scripts.

## Fase 4H - Validacao final do editor modular

A fase 4H nao altera arquitetura nem regras de negocio. Ela valida o caminho modular ja consolidado antes de avancar para planos, assinatura ou pagamentos.

Validacoes realizadas:

- editor autenticado abre pelo caminho `data-store-editor-renderer="module"`;
- `data-store-editor-modules-ready="true"` e `data-store-editor-module-version="store-editor-4g"` permanecem no DOM;
- abas Visao geral, Aparencia, Produtos, Categorias, Banner, Leads/Pedidos, Compartilhamento e Configuracoes renderizam sem duplicar `store-editor-shell`;
- Produtos mantem `storefrontProductForm`, CTA de adicionar e preview;
- loja publica renderiza `data-storefront-render="public"` com `data-storefront-source="v2"` e sem vazamento de UI administrativa;
- service worker ativo usa cache `simplifica-3d-v116-estavel-20260528-store-editor-4g`;
- os quatro scripts `modules/store-editor/*.js` retornam HTTP 200 no build servido de `dist/`;
- fallback controlado foi simulado localmente com falha de modulo, retornando `data-store-editor-renderer="fallback"` e `data-store-editor-modules-ready="false"` sem erro fatal.

Pendencias antes de remover o fallback:

- repetir a validacao em PWA instalado/celular fisico;
- validar uma conta de teste real criando e descartando rascunho de produto;
- manter ao menos mais um ciclo de deploy/cache com fallback preservado.

## Fase 7C - Editor visual guiado

O modo administrativo da loja publica agora usa a propria vitrine como superficie de edicao:

- desktop: painel contextual fixo a esquerda e loja real no centro;
- mobile: loja real em primeiro plano, botao flutuante `Editar` e painel inferior controlado;
- clique em produto publicado: abre o painel contextual do item, sem troca silenciosa de rota;
- edicao detalhada: continua disponivel pelo admin modular para campos avancados;
- link publico: exibe abrir, copiar e compartilhar conforme a permissao atual do plano;
- contatos: normalizam WhatsApp com DDI brasileiro quando necessario e codificam a mensagem antes de abrir `wa.me`.

O fluxo preserva a persistencia atual de produtos, publicacao e compartilhamento. Nao altera Supabase, RLS, webhooks, pagamentos ou regras comerciais.

Os limites de produtos da vitrine usam o registry central por `getPlanLimits()`: Gratis permanece sem produtos publicados, Start permanece com ate `100` produtos na loja e Pro permanece ilimitado.

### Fase 7C.2 - Mobile nativo

Em telas de ate `860px`, o editor guiado remove a topbar administrativa e a barra extensa de contexto para priorizar a loja real em tela cheia. O rodape legado foi removido: identidade e produtos ficam acessiveis pelo botao flutuante `Editar` e pelo toque direto na vitrine. O painel inferior usa limite de altura, fechamento explicito e campos com altura minima de toque.

No desktop, a vitrine guiada usa uma toolbar administrativa unica, compacta e nomeada. A barra contextual duplicada deixou de ser renderizada e as acoes operacionais ficaram concentradas em `Voltar ao painel`, abertura da loja publica ou preview, copia de link e publicacao controlada pelo plano.

### Fase 7C.3 - Loja publica premium

A Storefront V2 recebeu uma camada final de composicao sem alterar Supabase, publicacao, planos ou checkout:

- loja publica clara por padrao, com fundo branco/cinza suave, texto escuro e acento controlado pelo tema da loja;
- home reorganizada em banner compacto, beneficios, categorias, produtos e contato;
- remocao de blocos promocionais genericos da home para reduzir ruido;
- cards com imagem quadrada, titulo limitado a duas linhas e grid de ate quatro colunas no desktop;
- contato publico com uma unica grade reutilizavel e um CTA de WhatsApp;
- pagina de produto com galeria, resumo, especificacoes e chips de personalizacao com wrap seguro;
- carrinho flutuante reduzido para icone e contador;
- editor guiado preservado com sidebar escura no desktop e bottom sheet no mobile.

Os limites visuais passam a ser: titulo do banner `40`, subtitulo `100`, CTA `24`, nome do produto `60` e descricao `180`. Produtos de demonstracao continuam restritos a preview local/staging e nao sao publicados como catalogo real.
