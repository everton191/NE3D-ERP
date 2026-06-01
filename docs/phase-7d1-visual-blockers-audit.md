# Fase 7D.1 - Auditoria dos bloqueadores visuais

## Escopo aprovado

Esta fase corrige somente Loja Online, modelos demonstrativos, Tela de Planos,
tema, contraste, tokens, responsividade e assets. Nao altera persistencia,
permissoes, checkout, cobranca, Supabase ou regras comerciais.

## Diagnostico

### Loja Online

- A loja publica ja possuia shell V2 parcial, mas preview e editor ainda
  herdavam regras visuais antigas.
- Os tokens da loja nao cobriam todas as superficies usadas por cards,
  formularios, estados online, banner e rodape.
- Os modelos demonstrativos antigos eram genericos e poderiam ser confundidos
  com itens reais no ambiente local.

### Planos

- Uma regra legada tardia com `!important` forçava cards escuros mesmo no tema
  claro.
- A tela moderna nao tinha uma classe de autoridade visual isolada para vencer
  o legado sem removê-lo.

## Mapa de herancas corrigidas

| Componente | Classe aplicada | Token esperado | Regra legada concorrente | Arquivo e linha aproximada | Correcao |
| --- | --- | --- | --- | --- | --- |
| Loja publica | `.storefront-theme-v2` | `--store-bg`, `--store-text` | Cores condicionadas por `body.theme-light` | `style.css:23667` | Shell marcado recebe tokens isolados |
| Header e rodape | `.store-public-header`, `.store-public-footer` | `--store-header-bg`, `--store-footer-bg` | Superficies historicas compartilhadas | `style.css:21431` | Superficies V2 resolvem o tema da loja |
| Preview | `.store-preview-zone.storefront-theme-v2` | Tokens da loja | Preview dependia de heranca externa | `app.js:16003` | Tema resolvido anexado ao container |
| Editor | `.store-editor-zone.storefront-theme-v2` | Tokens da loja | Painel usava componentes mistos | `app.js:18687` | Tema resolvido anexado ao workspace |
| Produtos | `.store-public-product-card` | `--store-card`, `--store-border` | Cards legados variavam por body | `style.css:21431` | Card V2 claro/escuro isolado |
| Planos | `.s3d-plans-v2 .plan-tier-card` | Tokens ERP V2 | Hotfix tardio escurecia cards claros | `style.css:25335` | Autoridade V2 clara vence legado somente nessa tela |

## Correcoes isoladas

- `storefront-theme-v2` passou a marcar loja publica, preview e editor.
- A loja publica filtra itens `__demo` e `__template`.
- O editor vazio apresenta seis modelos locais com CTA explicito:
  `Usar este exemplo como modelo`.
- O uso de modelo abre rascunho invisivel e nao publica automaticamente.
- `s3d-plans-v2` fornece autoridade visual isolada para a Tela de Planos.
- O tema claro dos planos usa cards claros e mantém diferenciacao visual entre
  Gratis, Start e Pro.
- O modo escuro da loja passou a resolver navegacao, descricoes, categorias e
  rodape pelos tokens isolados da Storefront V2.

## Cache

- Cache PWA local atualizado para
  `simplifica-3d-v133-visual-blockers-20260531`.
- Cache-bust web atualizado para
  `1.0.27-rc-visual-blockers-20260531`.

## Rollback

Checkpoint anterior a esta fase:

```txt
checkpoint-before-phase7d1-visual-blockers-20260531
```

O legado permanece no projeto. A nova autoridade visual e aditiva e pode ser
revertida sem remover seletores antigos.

## Validacao visual executada

A sessao automatizada do navegador integrado ficou indisponivel durante esta
rodada. Foi usado Chrome local com DevTools Protocol contra o build `dist/`,
sem publicar Web, PWA ou APK.

Capturas da loja publica:

```txt
C:\Users\PAESS\.codex\artifacts\phase7d1\public-light-desktop-1366-cdp.png
C:\Users\PAESS\.codex\artifacts\phase7d1\public-light-mobile-390x844-cdp.png
C:\Users\PAESS\.codex\artifacts\phase7d1\public-dark-final-desktop-1366-cdp.png
C:\Users\PAESS\.codex\artifacts\phase7d1\public-dark-final-mobile-390x844-cdp.png
```

Capturas da Tela de Planos:

```txt
C:\Users\PAESS\.codex\artifacts\phase7d1\plans-all-light-desktop-1366-cdp.png
C:\Users\PAESS\.codex\artifacts\phase7d1\plans-all-light-mobile-390x844-cdp.png
C:\Users\PAESS\.codex\artifacts\phase7d1\plans-all-dark-final-desktop-1366-cdp.png
C:\Users\PAESS\.codex\artifacts\phase7d1\plans-all-dark-final-mobile-390x844-cdp.png
```

A loja publica foi medida sem overflow horizontal em `320`, `360`, `390`,
`412`, `430`, `768`, `1024`, `1366`, `1440`, `1920` e `2560` px.

## Validacao visual ainda pendente

- Editor autenticado da loja em claro e escuro.
- Dashboard ERP autenticado em claro e escuro.
- Modais autenticados da loja e dos planos.

O acesso automatizado ao editor encontrou bloqueio de autenticacao. Nao foi
contornado. Esta fase fica salva como checkpoint local e nao autoriza avancar
para o Lote 4C nem publicar Web, PWA ou APK antes da homologacao manual dessas
superficies.
