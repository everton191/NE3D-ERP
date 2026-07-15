# Diagnóstico das telas piloto

## Novo pedido

O fluxo é renderizado no monólito `app.js`, com container, etapas, cartões e barra final próprios; não consome uma grade global. Resumo, abas, conteúdo e ações combinam grids/flex locais, o que explica recuos, alturas e espaços vazios diferentes. Cards aninhados duplicam padding/borda. A barra Total/Finalizar compete com o scroller e a bottom-nav.

**Manual e Calcular na etapa Financeiro:** as ações pertencem ao bloco de itens/cálculo, mas são montadas fora do contêiner condicionado pela etapa (ou o wrapper de visibilidade abrange somente parte do conteúdo). A mudança de etapa oculta o painel de Itens, não o bloco irmão de ações; por isso ele permanece no DOM/fluxo e aparece em Financeiro. A correção futura deve mover a condição/atributo de etapa para o ancestral comum, não esconder botões individualmente por CSS.

## Usuário

As linhas não têm trilhos globais de ícone/conteúdo/ação. Em larguras pequenas, conteúdo textual ocupa o espaço disponível e a ação “Alterar” é o item sacrificável por `min-width`, nowrap, overflow ou coluna `auto` sem reserva. Cards e grupos têm paddings/larguras locais, agravando o corte. “Sessão” participa da mesma cadeia de scroll/nav. A Zona de perigo não forma uma seção completa e consistente em todos os estados/permissões; parte do fluxo está na Segurança/conta e parte é condicionada por autorização/plano.

## Segurança

A tela combina header/subscreen, `account-security-panel`, `security-online-grid` e `security-settings-card`, com várias regras mobile tardias. O conteúdo pode iniciar sob o cabeçalho quando offsets sticky/fixed não são incorporados ao scroller. Cards externos e internos duplicam superfície/padding. Alterar senha, PIN e segurança online têm condicionais e overlays próprios. O CSS oculta bottom-nav/FAB em certos estados de subscreen, mas a reserva de espaço e o scroller podem continuar no estado anterior.

## Prioridade causal

1. Resolver autoridade de scroll/container.
2. Corrigir pertencimento semântico das ações do wizard.
3. Definir trilhos responsivos para linhas de configuração.
4. Migrar overlays das três telas para uma API única.
5. Só então ajustar espaçamento/visual.
