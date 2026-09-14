# Modularization Phase 3

Initial SHA: `a332a68`. Home and its carousel were frozen; no Home/carousel source or CSS was changed.

## Candidate matrix

| Screen | Dependencies | Risk | Decision |
|---|---|---|---|
| Clientes | orders aggregate, customer navigation, SaaS/Supabase administration | HIGH | not selected |
| Impressoras | device monitoring, Bambu integration, registration, overlays | HIGH | not selected |
| Relatórios | read-only local aggregation and existing report helpers | LOW | selected |
| Configurações | sync, backup, theme, billing and assistant settings | HIGH | not selected |

Only Reports was selected. It receives a controller lifecycle (`mount`, `update`, `unmount`) and compact view-model module. `app.js` retains `renderRelatoriosLegacy` as an explicit rendering bridge while `renderRelatorios` delegates lifecycle ownership to `SimplificaReportsFeature`. No business logic, report aggregation, export behavior, permissions or popup flow was changed.

`trocarTela` unmounts the Reports feature when leaving the screen. The controller owns cleanup callbacks and prevents duplicate mounting. The ScreenRegistry renderer metadata now points to that controller.

## Pattern for Qwen

1. Audit coupling and choose only a proven LOW-risk screen.
2. Add only needed feature files: controller, view-model, renderer/events when actual code is moved.
3. Keep the legacy bridge short; do not duplicate business logic.
4. Register the feature controller in ScreenRegistry and unmount on exit.
5. Pass compact dependencies/view-models, never global state wholesale.
6. Test render, empty/partial data, mount/update/unmount and repeated navigation.
7. Do not move Home, orders, cash, stock, production, auth, billing, Supabase or AI WRITE paths.

## Metrics

Before: `app.js` 2,627,670 bytes / 53,301 lines. This controlled first extraction adds an explicit bridge and lifecycle, so no artificial byte reduction is claimed yet. It creates two reports modules, one lifecycle contract and one Home-freeze regression test. Bootstrap remains 31 active scripts.

SAFE_FOR_QWEN: mechanical report view-model expansion and additional LOW-risk read-only screen audits.

NEEDS_STRONG_REVIEW: moving the report legacy renderer itself, Clients, Impressoras, Config, and any persistence/overlay extraction.

DO_NOT_TOUCH_YET: Home/carousel, launcher-3d, orders, cash, stock, production, Supabase/RLS, AI WRITE, release metadata.
