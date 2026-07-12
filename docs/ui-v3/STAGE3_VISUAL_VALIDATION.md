# Validação visual da Etapa 3

Data: 2026-07-12. Navegador: navegador integrado do Codex. Sessão: ERP autenticado como superusuário. Viewport realmente observado: 412×911.

| Lote | Rota | Resultado | Captura |
|---|---|---|---|
| 1 | Conta/Perfil | sem overflow horizontal; ações e “Alterar” visíveis | `evidence/stage3/lote-1/after/412x911-conta.png` |
| 2 | Relatórios | `#app-content` chegou de 0 a 2.616px; nenhum scroller vertical concorrente | `evidence/stage3/lote-2/after/412x911-relatorios.png` |
| 3 | Pedidos | raiz V3 visível e sem overflow horizontal | `evidence/stage3/lote-3/after/412x911-pedidos.png` |
| 3 | Produção | raiz V3 visível e sem overflow horizontal | `evidence/stage3/lote-3/after/412x911-producao.png` |
| 4 | Caixa | raiz V3 visível e sem overflow horizontal | `evidence/stage3/lote-4/after/412x911-caixa.png` |
| final | Dashboard | raiz V3 visível e sem overflow horizontal | `evidence/stage3/final/412x911-dashboard.png` |

Também foram observados no runtime: Dialog de confirmação do Caixa com Escape e restauração de foco; Dialog de foto do Perfil com `aria-modal`; Drawer do Pedido rápido com foco inicial em Cliente e `#popup` vazio.

As larguras 320, 360, 375, 390, 480, 768, 1024, 1280, 1440 e 1920 foram verificadas pelos contratos/testes responsivos, mas não receberam captura manual nesta sessão porque a superfície integrada permaneceu fixa em 412px. Chrome desktop e APK/WebView não estavam disponíveis. Essas condições não são declaradas como validação visual real.

