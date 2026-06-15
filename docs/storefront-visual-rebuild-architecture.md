# Arquitetura visual da Loja V3 rebuilt

## Objetivo do rebuild

A Loja V3 e o editor usam uma camada visual própria, clara e isolada do ERP. As funções existentes de persistência, upload, produtos, categorias, banner, contatos, carrinho e orçamento por WhatsApp permanecem responsáveis pelas regras e dados.

O rebuild substitui a autoridade visual misturada por três folhas centrais e dois renderizadores exclusivos:

- `src/storefront/styles/tokens.css`
- `src/storefront/styles/components.css`
- `src/storefront/styles/layouts.css`
- `src/storefront/renderers/publicV3.js`
- `src/storefront/renderers/editorV3.js`

## Arquivos visuais removidos

- `storefront-v3.css`: folha antiga com seletores V2/V3 misturados.
- `modules/store-editor/storeEditorRenderer.js`
- `modules/store-editor/storeEditorTabs.js`
- `modules/store-editor/storeEditorPreview.js`
- `modules/store-editor/storeEditorProducts.js`

Os módulos antigos do editor também foram retirados do `index.html`, do `prepare-web` e do precache do Service Worker. Não existe fallback visual antigo carregado por baixo da nova interface.

## Visual histórico neutralizado

O `style.css` global ainda contém seletores históricos exclusivos de classes como `.store-public-shell`, `.store-guided-editor-*` e `.store-editor-tab-panel`. Eles permanecem temporariamente porque o arquivo também atende o ERP e uma remoção mecânica de blocos mistos pode apagar regras compartilhadas.

Esses seletores estão neutralizados: nenhum renderer ativo, rota pública, editor rebuilt, `index.html`, build ou precache cria ou carrega essas raízes. Os checks anti-regressão falham se a UI antiga voltar a ser renderizada ou se `storefront-v3.css` e `modules/store-editor` voltarem ao carregamento.

Esta neutralização não é fallback visual: os seletores históricos não possuem DOM correspondente e não participam da interface em execução.

## Funções preservadas

As funções de leitura e persistência, upload, produtos, categorias, banner, contatos, carrinho, orçamento por WhatsApp, publicação e regras dos planos continuam no orquestrador existente. O rebuild altera somente renderização, componentes e estilos.

## Rotas preservadas

- `/ne3d`: loja pública.
- `/ne3d/produtos`: catálogo público.
- `/ne3d/categorias`: categorias públicas.
- `/ne3d/produto/:slug`: detalhe público.
- `/ne3d/categoria/:slug`: produtos de uma categoria.
- `/ne3d?admin=1`: editor visual no contexto autenticado.
- `/store-admin/ne3d`: editor administrativo.

## Sistema visual e componentes reutilizáveis

### Tokens

Os tokens `--store-*` controlam cores, tipografia, espaçamento, bordas, sombras, alturas de botões e campos, largura do editor, header e barra inferior. O petróleo claro `--store-primary` substitui o roxo dos mockups.

### Componentes

- Botões: base, secundário, fantasma, perigo e botão de ícone.
- Campos: input, textarea, select, foco e mensagens auxiliares.
- Cards: produto, categoria, contato, resumo, preview e modais.
- Navegação: header público, cabeçalho do editor, abas por etapa e barra inferior.
- Feedback: upload, checklist, estado vazio e estados de publicação.

Todos os botões, campos e cards da raiz `.storefront-app`, `.storefront-editor` ou `.storefront-modal` recebem o mesmo contrato. Novas variações devem reutilizar tokens e componentes existentes; não devem usar `style=""` nem criar correções isoladas por rota.

### Exemplos de uso

- Botão principal: `<button class="btn">Salvar</button>`.
- Botão secundário: `<button class="btn secondary">Voltar</button>`.
- Card: `<article class="store-ui-card">...</article>`.
- Upload: `<label class="store-ui-upload">...</label>`.

## Layouts

- Loja pública: raiz `.storefront-app.storefront-public.storefront-v3.sfv3`.
- Editor: raiz `.storefront-app.storefront-editor.sfe-shell`.
- Editor mobile: `.storefront-mobile-editor.sfe-shell--mobile` com preview compacto fixo, abas, campos roláveis e ações inferiores.
- Modais de carrinho e solicitação: `.storefront-modal`.

## Editor mobile

Produto usa as etapas Básico, Preço/Estoque, Imagens e Publicação. Banner e contatos reutilizam o mesmo cabeçalho e preview compacto. Quando o teclado abre, o preview reduz e o campo ativo é mantido visível pela função existente `manterCampoEditorGuiadoVisivel`.

## Tema

A loja e o editor são `light-only`. Não seguem `data-theme` do ERP, `prefers-color-scheme`, Android ou navegador. Os formulários persistem `storeThemeMode=light` apenas para manter compatibilidade com o contrato de dados existente.

## Regras de manutenção

- Alterar cores, tamanhos ou espaçamentos somente em tokens.
- Alterar botões, campos, cards, abas e uploads somente no componente-base.
- Alterar organização de tela somente nos layouts-base.
- Não reativar CSS visual V2, dark mode ou herança do ERP.
- Não carregar novamente `modules/store-editor` nem `storefront-v3.css`.
- Não alterar serviços e regras de negócio durante manutenção visual.

## Checklist de validação

- Loja pública, produtos, categorias, detalhe e contatos.
- Editor de produto, categoria, banner e contatos.
- Preview compacto e teclado aberto.
- Carrinho e orçamento via WhatsApp.
- Salvar rascunho, checklist e publicação.
- Mobile sem overflow e com safe area.
- Build Web/PWA e testes storefront.

## Publicação e limites desta etapa

- Cache PWA: `simplifica-3d-v174-storefront-visual-rebuild-light-only-20260614`.
- O build Web publica os três estilos e os dois renderers rebuilt em `dist/src/storefront`.
- APK Android não foi alterado nesta etapa.
- Backend, banco, autenticação, APIs, storage e regras comerciais não foram alterados.
- A homologação manual do editor com sessão real de proprietário continua obrigatória; sem propriedade válida, as rotas administrativas não devem expor controles de edição.
