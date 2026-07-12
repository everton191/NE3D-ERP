# Contratos dos componentes UI V3

- `AppShell`: viewport isolada e três linhas.
- `ContentScroller`: único scroll vertical da página.
- `PageContainer`, `PageHeader`, `PageSection`, `ContentStack`: composição de página.
- `ResponsiveGrid`, `GridItem`: 4/8/12, span, início e largura total.
- `SettingsList`, `SettingsRow`: trilhos ícone/conteúdo/ação.
- `Card`: superfície com altura preenchível.
- `FormField`, `Button`: controles acessíveis e dimensionados.
- `Dialog`, `BottomSheet`, `Drawer`, `ConfirmationDialog`: Portal explícito; modal nunca vira sheet implicitamente.
- `StickyActionBar`, `BottomNavigation`: ações persistentes e safe area.
- `DangerZone`: ações destrutivas isoladas.
- `ScrollableTableArea`, `ChartContainer`: visualização densa delimitada.

Todo consumidor deve estar dentro de `[data-ui-version="v3"]`.
