# Design System V2 - matriz de migracao do legado

## Escopo desta rodada

Fase 7D, lotes 4A e 4B. A migracao permanece aditiva e reversivel: as classes historicas continuam no markup enquanto as classes `s3d-*` assumem a autoridade visual das superficies aprovadas.

| Componente | Classe V2 aplicada | Regra legada ainda utilizada | Motivo | Pode remover agora? | Remover em qual lote? |
| --- | --- | --- | --- | --- | --- |
| Login e cadastro | `.s3d-auth-page`, `.s3d-auth-card`, `.s3d-form`, `.s3d-field`, `.s3d-input`, `.s3d-button` | `.auth-page`, `.auth-card`, `.auth-field`, `.auth-primary` | Preservar validacao visual e rollback das telas de entrada | Nao | Apos homologacao completa da entrada |
| Onboarding | `.s3d-onboarding`, `.s3d-card` | `.onboarding-card`, `.actions`, `.progress-steps` | Etapas e estados existentes continuam funcionais | Nao | Lote de limpeza posterior |
| Shell desktop | `.s3d-shell`, `.s3d-shell-main` | `.desktop-shell`, `.desktop-main` | Estrutura atual controla scroll central e compatibilidade do ERP | Nao | Apos migracao dos modulos operacionais |
| Header ERP | `.s3d-toolbar`, `.s3d-header` | `.topbar`, `.app-topbar` | Busca e menu de perfil continuam usando handlers atuais | Nao | Apos homologacao do shell |
| Sidebar desktop e drawer | `.s3d-sidebar`, `.s3d-nav-item` | `.side-menu`, `.side-nav-button`, `.side-drawer` | Rotas, permissoes e gesto mobile permanecem iguais | Nao | Apos homologacao de navegacao |
| Bottom navigation | `.s3d-bottom-nav`, `.s3d-nav-item` | `.mobile-bottom-nav`, `.mobile-bottom-nav-button` | Navegacao e safe-area existentes seguem ativos | Nao | Apos validacao Android |
| Dashboard | `.s3d-dashboard`, `.s3d-page`, `.s3d-card` | `.dashboard-*`, `.desktop-dashboard-*`, `.card` | Cards e analytics existentes nao devem ser reescritos nesta fase | Nao | Lote de polimento do dashboard |
| Loja publica | `.storefront-theme-v2`, `.store-layout-zone`, `.layout-storefront` | `.store-public-*` | Preservar render atual e assumir tokens apenas no shell marcado | Nao | Apos homologacao da loja |
| Editor e preview da loja | `.storefront-theme-v2`, `.store-editor-zone`, `.store-preview-zone` | `.storefront-admin-*`, `.store-preview-*` | Isolar contraste e responsividade sem alterar handlers | Nao | Apos homologacao autenticada |
| Tela de Planos | `.s3d-plans-v2` | `.plans-modern-screen`, `.plan-tier-*` | Vencer hotfix escuro legado no tema claro sem tocar em regras comerciais | Nao | Apos homologacao claro/escuro |

## Riscos catalogados

- `style.css` permanece grande e possui regras historicas com `!important`.
- Existem media queries legadas que ainda participam do comportamento mobile.
- A camada V2 evita `width:100vw` e aplica `min-width:0` nos filhos flex/grid migrados.
- O CSS V2 foi carregado depois do legado para assumir somente as superficies marcadas.
- A rota direta `/store-admin/ne3d` continua exigindo rewrite SPA e permanece no backlog da Loja Online.
- A barra nativa Android continua com cores escuras fixas e permanece planejada para o Lote 9.
- Os modelos da loja sao exemplos locais filtrados da vitrine publica e nao equivalem a produtos reais.
- Cinco categorias demonstrativas ainda usam placeholders locais ate haver fotos licenciadas adequadas.

## Regra de limpeza

Nenhum seletor legado deve ser removido ate que as telas dependentes estejam migradas, homologadas em claro/escuro e verificadas no Web, PWA e APK.
