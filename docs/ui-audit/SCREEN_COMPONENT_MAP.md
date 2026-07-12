# Mapa de telas e componentes

```text
Aplicação autenticada
├── AppShell (#app-shell)
│   ├── DesktopShell / SideMenu / Topbar
│   ├── AppContent (#app)
│   ├── MobileBottomNavigation
│   └── Overlay / Drawer / Modal layers
├── Dashboard
│   ├── Page header / search
│   ├── Dashboard metrics
│   ├── Quick actions
│   ├── Recent orders
│   └── Analytics cards
├── Caixa
│   ├── Financial summary
│   ├── Action controls
│   ├── Movement list/table
│   └── Cash edit modal/form
├── Pedidos / Produção / Estoque / Clientes
│   ├── Shared page shell
│   ├── Filters and actions
│   ├── Tables/lists/cards
│   └── Detail overlays
└── Administração / Perfil
    ├── Shared page shell
    ├── Forms
    └── Modal/drawer layers
```

Os dados e comandos continuam únicos em `app.js`; não foram criadas rotas ou implementações paralelas por dispositivo.
