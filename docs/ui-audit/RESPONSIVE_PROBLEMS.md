# Problemas responsivos

| Tela | Largura | Problema | Causa provável | Arquivo/componente | Prioridade |
|---|---:|---|---|---|---|
| Global | 320 px | risco de overflow horizontal | filhos Grid/Flex sem contrato comum de encolhimento | `style.css`, shell | crítica |
| Global | mobile | último conteúdo sob navegação | altura real e safe area fragmentadas | `.mobile-bottom-nav`, `#app` | crítica |
| Dashboard | 768 px | métricas comprimidas | grade tardia fixa em quatro colunas | `.desktop-dashboard-metrics` | alta |
| Dashboard | 320 px | áreas de 12 colunas preservadas | spans desktop sem normalização mobile | `.desktop-dashboard-span-*` | alta |
| Caixa/Formulários | mobile + teclado | ação/campo pode ficar encoberto | ausência de margem e padding de foco globais | campos e áreas roláveis | alta |
| Modais | 320x568 | conteúdo pode exceder viewport | limites baseados em `100vh` e pixels | `.app-modal-stage`, `.modal-card` | alta |
| Desktop amplo | 1920+ px | conteúdo PWA se estende sem limite | regra tardia `max-width:none` | `.desktop-shell`, `#app` | média |

As correções foram feitas no contrato compartilhado. Tabelas analíticas continuam com rolagem horizontal intencional; ocultação de colunas exige validação de prioridade por módulo.
