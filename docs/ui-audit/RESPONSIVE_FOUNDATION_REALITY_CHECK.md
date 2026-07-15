# Reality check da fundação responsiva

Auditoria estática de 2026-07-12. Escopo: `index.html`, `app.js`, CSS efetivamente carregado e documentação existente. Nenhuma correção foi aplicada.

## Resultado executivo

A fundação existe, mas não é autoridade única. O shell, tokens de layout, camadas e componentes compartilhados foram implementados; as telas continuam majoritariamente geradas por `app.js` e estilizadas por um `style.css` monolítico, com regras posteriores que alteram o contrato. Os componentes de `src/shared/design-system` e os contratos em `components/**` existem, porém não governam a maior parte do HTML legado.

## Documentação versus runtime

| Regra documentada | Estado real | Evidência/observação |
|---|---|---|
| `#app-content` é o scroller principal | implementada parcialmente e sobrescrita | `docs/layout-zones.md` define essa autoridade; `UI_STRUCTURE_AUDIT.md` diz que o documento rola; `style.css` contém várias autoridades posteriores para `#app-content`, `desktop-main` e telas |
| tokens `--layout-*` são o contrato | implementados, mas não exclusivos | definidos perto do bloco de fundação em `style.css`; aliases e medidas locais continuam ativos |
| largura máxima compartilhada | implementada parcialmente | `--layout-shell-max`, `--desktop-content-max`, `--desktop-max-width`, `--content-max-width` e limites locais coexistem |
| grid responsivo global | apenas documentado/inexistente como contrato consumido | não há grade 4/8/12 aplicada às rotas; cada tela cria seus próprios `grid-template-columns` |
| bottom-nav reserva espaço e safe area | implementada parcialmente | há `--app-safe-bottom` e padding; regras tardias mudam posição/visibilidade e teclado |
| overlays usam camadas oficiais | implementada parcialmente | `#modal-layer/#drawer-layer/#toast-layer` existem, mas `#popup` e backdrops locais permanecem |
| novos modais usam `openModal()` | implementada, mas não universal | fluxos legados escrevem diretamente no popup/DOM |
| somente um scroll vertical por tela | apenas documentada | containers locais, modais, editor e páginas criam scroll próprio |
| DS compartilhado controla cards/forms | implementado, mas pouco utilizado | SPA continua montando grande volume de HTML e classes locais em `app.js` |
| safe area/teclado centralizados | implementada parcialmente | `safeAreaManager.js` existe; editor e CSS global mantêm lógicas próprias |

## Fontes de verdade atuais

| Comportamento | Fonte efetiva | Conflito |
|---|---|---|
| largura/padding de página | `style.css`, especialmente regras finais por perfil/viewport | múltiplos tokens e limites locais |
| breakpoints | `style.css`, `themes/base/design-system-v2.css`, CSS da storefront | 359/360/420/430/520/560/640/720/760/767/768/820/860/900/1020/1100/1180/1280/1320/1360/1400/1500 etc. |
| colunas e gaps | regras específicas de cada classe em `style.css` | sem contrato de grade transversal |
| cards | `style.css` e classes de tela; contratos/DS apenas onde explicitamente usados | largura, padding e altura locais |
| cabeçalho mobile | renderizadores em `app.js` + regras `.mobile-*` tardias | cabeçalhos de subscreen e storefront próprios |
| navegação inferior | `app.js`, `.mobile-bottom-nav` em `style.css`, perfil/teclado | várias regras de visibilidade e posição |
| scroll | `#app-content`, documento e containers locais | autoridade contraditória |
| modal | camadas do `index.html`, helpers de `app.js`, `#popup`, DS Modal e storefront | quatro famílias |
| bottom sheet/drawer | classes globais, operational/store drawers e DS BottomSheet | implementações paralelas |
| toast | `mostrarToast`, `#toast-layer/#toastArea` | menos fragmentado, ainda com estilos locais |
| foco/teclado | browser, `safeAreaManager.js`, listeners em `app.js`/editor e CSS `.keyboard-visible` | mais de uma política |
| safe areas | `safeAreaManager.js`, variáveis CSS e regras Android/storefront | duplicação por contexto |
| z-index | tokens globais + números locais no CSS/storefront | escala não é universal |
| FABs | regras específicas em `style.css` e renderização em `app.js` | competem com nav e subscreens |
| mobile/desktop | classes `mobile-mode`, `viewport-*`, `data-ui-profile` e media queries | quatro sinais podem divergir |

## Conclusão

A próxima fase deve consolidar autoridade antes de corrigir telas: um scroller, um contrato de container, uma escala de breakpoints e uma API de overlay. Corrigir sintomas com novas regras tardias ampliaria a colisão existente.
