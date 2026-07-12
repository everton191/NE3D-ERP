# Legado removido na Etapa 3

Foram removidas 1.672 linhas de `style.css`, sempre por seletor cuja raiz inteira pertencia a uma tela já migrada.

| Família | Seletores-raiz comprovados | Regras | Linhas |
|---|---|---:|---:|
| Configurações | perfil, segurança, notificações e modo de interface migrados | 106 | 621 |
| Leitura | dashboard e relatórios estruturais | 126 | 698 |
| Operacional | `order-edit-screen`, `order-flow-screen`, `order-bottom-bar`, `stock-page`, `production-page`, `clients-compact-screen` | 50 | 322 |
| Financeiro | `cash-screen-card`, `cash-screen-header` | 5 | 31 |

Seletores internos compartilhados, regras de negócio, formulários, overlays ainda consumidos por rotas não migradas e qualquer dependência incerta foram preservados. A remoção foi mecânica com `scripts/remove-migrated-css.js`, que só elimina uma regra quando todos os seletores correspondem às raízes informadas.

