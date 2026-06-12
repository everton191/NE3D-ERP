# Loja V3 e Editor V3 - Implementacao visual aprovada

Checkpoint: 2026-06-11

## Objetivo desta etapa

Transformar a fundacao tecnica da Loja V3 em uma primeira implementacao visual fiel ao Documento Executivo V3, sem ativar pagamento online e sem alterar regras comerciais, banco, planos ou webhooks.

## Implementado agora

- Versao interna `storefront-v3-editor-v3-approved` marcada no DOM da loja.
- Loja publica e editor da loja renderizam em tema claro controlado pela propria storefront.
- Tema da loja fica isolado do ERP e nao depende do tema claro/escuro global do sistema.
- Paleta base aprovada aplicada na storefront:
  - Primaria: `#2F6F73`
  - Hover: `#3B848A`
  - Selecionado: `#4D9CA2`
  - Fundo: `#FFFFFF`
  - Fundo secundario: `#F3F7F7`
  - Borda: `#DDE7E8`
  - Texto: `#1F2D2F`
  - Texto secundario: `#667A7D`
  - Destaque: `#E0A243`
- Pagamento online permanece desativado e observavel:
  - `paymentProvider: disabled`
  - `paymentStatus: disabled`
  - `paymentIntentId: null`
  - `checkoutMode: whatsapp`
  - `onlinePaymentEnabled: false`
- Carrinho e modal de solicitacao carregam marcadores de modo WhatsApp e pagamento desativado sem enviar novos campos ao Supabase.
- Rotas publicas existentes foram preservadas.
- Cache Web/PWA atualizado para a nova fundacao.
- Home publica recebe faixa informativa, busca, categorias, banner amplo, cards responsivos e bottom nav mobile.
- Editor mobile recebe produto em etapas: Basico, Preco/Estoque, Imagens e Publicacao.
- Editor mobile mantem preview compacto fixo do item editado e botoes principais acessiveis.
- Editor mobile agora usa shell proprio em tela cheia no celular, com cabecalho, preview compacto, abas, campos rolaveis e barra inferior com safe area.
- Campos do produto usam protecao de foco para evitar que o teclado cubra o campo ativo.
- A etapa Publicacao exibe checklist contextual do produto antes de salvar/publicar.
- PWA/admin mantem painel lateral dedicado com preview em tempo real.
- Carrinho funciona como solicitacao de orcamento/pedido em revisao antes de abrir WhatsApp.
- Produtos com estoque controlado ou vinculo ERP geram rascunho em revisao; demais itens geram orcamento pendente.
- Teste `npm run test:storefront-v3-approved` criado como alias do contrato V3 aprovado.

## Preservado

- Regras de planos Free, Start e Pro.
- Slugs e rotas publicas existentes.
- Tabelas atuais da loja.
- Fluxo de leads/carrinho atual, com rascunho best-effort para ERP quando possivel.
- Webhook e checkout Mercado Pago.
- Tema do ERP.
- Fallbacks e componentes V2 atuais.

## Ainda pendente

- Pagamento online.
- Alteracao de banco.
- Homologacao fisica em Android real, PWA instalada e APK.
- Integracao profunda com estoque/pedidos reais alem do rascunho best-effort atual.

## Proximas etapas recomendadas

1. Homologar em Android real, PWA instalada e APK.
2. Validar criacao de rascunho remoto com RLS real da loja.
3. Refinar a pagina de produto com quantidade e variacoes se o modelo comercial exigir.
4. Integrar validacao profunda de estoque/pedido em fase propria.
5. Manter pagamento online desligado ate uma fase dedicada de checkout.

## Testes relacionados

- `npm run test:storefront-v3-approved`
- `npm run test:storefront-v3-foundation`
- `npm run test:storefront-light-theme-stability`
- `npm run test:storefront-public-ui`
- `npm run test:storefront-guided-editor`
- `npm run test:ui-overflow`
- `npm run build:web`
