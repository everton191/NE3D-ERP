# Fase 7D.2 - Auditoria de tema claro, PWA e loja

## Escopo

- Definir `light` como fallback de ERP, PWA e Storefront.
- Preservar escolha manual `dark`.
- Preservar acompanhamento do sistema por escolha explicita `system`.
- Remover misturas de tema e sobreposicoes confirmadas em homologacao local.

## Correcoes

### Autoridade de tema

- `themeAuthorityV2` normaliza preferencia ausente ou invalida para `light`.
- O bootstrap antecipado do `index.html` aplica o mesmo fallback antes de
  carregar a aplicacao.
- Defaults e resets do `app.js` usam `light`.
- O cache PWA foi atualizado para
  `simplifica-3d-v134-theme-default-light-20260601`.
- O cache-bust web foi atualizado para
  `1.0.28-rc-theme-default-light-20260601`.

### Shell estrutural

Uma regra legada ampla do tema claro atingia classes terminadas em `-shell`.
Isso aplicava `backdrop-filter` em `#app-shell`, `#app-content` e
`.store-public-shell`.

Efeitos observados:

- bottom navigation mobile fixada no meio da tela durante scroll;
- badge `Online` da vitrine preso ao conteudo e sobrepondo cards.

Correcoes:

- shell do ERP nao herda vidro, sombra ou backdrop dos cards;
- shell publico V2 nao herda vidro ou sombra;
- status `Online` da Storefront V2 entra no fluxo da pagina, sem encobrir
  conteudo no desktop ou mobile.

### Planos no tema claro

- Free: fundo claro com verde suave.
- Start: fundo claro com roxo suave.
- Pro: fundo claro com dourado suave.
- CTAs habilitados acompanham a cor do plano.

## Homologacao local autenticada

Conta de teste autorizada pelo usuario e usada apenas no ambiente local.

Validado:

- Dashboard mobile claro em `390x844`;
- drawer mobile claro;
- Aparencia mobile com `Claro`, `Escuro` e `Seguir sistema`;
- bottom navigation mobile com gap final de `7px`;
- Pedidos mobile claro;
- Caixa mobile claro;
- Producao mobile claro;
- Planos mobile claro;
- Dashboard desktop claro em `1440x900`;
- loja publica clara desktop e mobile;
- admin da loja claro desktop e mobile;
- ausencia de overflow horizontal nas superfícies medidas.

## Risco funcional fora do escopo visual

A conta de teste mostra badge `Pro`, plano atual `Pro Ativo` e loja publica
liberada, mas a tela Producao ainda exibe bloqueio e CTA `Pagar agora`.
Essa divergencia deve ser tratada em uma fase de permissoes/assinatura, sem
mascarar o problema com CSS.

## Promocao

Esta fase atualiza arquivos web e cache local para homologacao. Nao publica
PWA e nao gera APK.
