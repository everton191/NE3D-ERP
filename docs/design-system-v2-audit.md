# Fase 7D - Auditoria do Design System V2

## Checkpoint

- Branch: `codex/stable-premium-motion`
- Base: `d6cb8da104b343a95d1c3682cfe0a59026b51389`
- Rollback: `checkpoint-before-phase-7d-design-system-v2-20260531`
- Cache PWA anterior: `simplifica-3d-v130-estavel-20260531-storefront-light-theme`
- APK atual: `1.0.18-rc`
- Android `versionCode`: `17`

## Mapa atual

| Arquivo | Responsabilidade | Classificacao |
| --- | --- | --- |
| `app.js` | Tema ERP dinamico, tema da vitrine, render de shells e formularios | Manter e migrar gradualmente |
| `style.css` | CSS historico acumulado e correcoes responsivas | Risco visual e mobile |
| `themes/base/tokens.css` | Tokens formais da Fase 3A | Manter |
| `themes/light/tokens.css` | Compatibilidade do tema claro | Manter |
| `themes/dark/tokens.css` | Compatibilidade do tema escuro | Manter |
| `index.html` | Bootstrap, ordem de assets e service worker | Risco de flash de tema |
| `sw.js` | Cache PWA e limpeza de versoes antigas | Risco de asset antigo |
| `manifest.webmanifest` | Splash e cores base PWA | Manter claro |
| `android/app/src/main/java/br/com/ne3d/erp/MainActivity.java` | Barras nativas e fundo WebView | Migrar somente no Lote 9 |
| `android/app/src/main/res/values/styles.xml` | Splash Android e barras nativas | Migrar somente no Lote 9 |

## Indicadores CSS

| Indicador | Quantidade | Classificacao |
| --- | ---: | --- |
| Linhas em `style.css` | 28683 | Risco de manutencao |
| `!important` | 235 | Depreciar gradualmente |
| `body.theme-light` | 619 | Migrar por sublote |
| `overflow-x:hidden` | 16 | Auditar causa real no Lote 6 |
| `width:100vw` | 7 | Auditar overflow no Lote 6 |
| `position:fixed` | 27 | Revisar camadas mobile |
| `position:absolute` | 58 | Revisar sobreposicoes |
| Media queries | 99 | Consolidar por breakpoint |
| `[data-store-theme]` | 18 | Manter e expandir |

## Decisao desta entrega

Os seletores legados permanecem ativos. A camada `themes/base/design-system-v2.css`
adiciona tokens e shells versionados sem remover comportamento validado.

## Classificacao

### Manter

- `app-shell`, layers globais e Storefront V2.
- Tokens existentes usados pelos componentes atuais.
- Compatibilidade `body.theme-light` e `body.theme-dark`.

### Migrar

- Preferencia ERP para `simplifica3d_erp_theme_preference`.
- Preferencia da loja para `simplifica3d_store_theme_preference`.
- `auto` legado para o valor oficial `system`.
- Novos componentes para `.erp-theme-v2` e `.storefront-theme-v2`.

### Depreciar

- Uso direto de `body.theme-light` em componentes novos.
- Cor fixa em novos componentes.
- Cache-bust historico `1.0.24-rc-storefront-light-theme-20260531`.

### Remover depois

- Regras globais de mascaramento de overflow depois da auditoria do Lote 6.
- Overrides historicos duplicados depois da migracao visual por tela.
- Chave local legada `simplifica3d_store_theme` depois de uma janela de compatibilidade.

## Riscos preservados para lotes futuros

- A barra nativa Android ainda nasce escura.
- O CSS historico ainda pode sobrescrever componentes nao migrados.
- O editor da loja ainda usa contraste escuro intencional em parte do shell.
- A remocao de overflow global exige testes tela a tela.
