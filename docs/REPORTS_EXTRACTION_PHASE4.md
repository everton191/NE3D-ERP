# Reports extraction — Phase 4

Initial SHA: `6fdf234`. The Reports visual renderer was mapped before moving code. Its data is read-only and remains a consumer of canonical ERP helpers: period state (`getUiTab`), analytics aggregation, order/category helpers, permission checks and formatters.

## Dependency map

- PURE: percentage, period and chart formatting already present in the Reports helper block.
- SHARED_HELPER: escaping, currency, icons, sparkline and navigation helpers remain in `app.js` because other screens use them.
- SERVICE/BUSINESS_RULE: analytics and order calculations remain canonical; Reports never duplicates them.
- GLOBAL_STATE: period state and suggestions are passed as a compact dependency object.
- DOM: only existing inline UI actions remain; no new global listeners or timers were introduced.

## Final feature shape

`ReportsController -> reports-renderer -> reports-data -> canonical helpers/services`.

`reports-data.js` creates a compact snapshot. `reports-renderer.js` owns the complete Reports page template. `reports-controller.js` owns mount/update/unmount. `app.js` now keeps only `getReportsFeatureDeps()` and a small `renderRelatorios()` bridge for ScreenRegistry compatibility. `renderRelatoriosLegacy()` was removed.

## Measured result

`app.js`: 2,628,306 bytes / 53,310 lines before; 2,619,899 bytes / 53,178 lines after. The removal is 8,407 bytes and 132 lines. The remaining bridge supplies explicit shared dependencies and returns the existing loading skeleton until the lazy Reports module is ready.

## Feature template / PATTERN_FOR_QWEN

1. Audit one LOW-risk read-only screen.
2. Keep domain calculations in canonical services/helpers.
3. Pass an explicit, compact dependency object into data and renderer.
4. Put page markup in `*-renderer`, data collection in `*-data`, and lifecycle in the controller.
5. Register one lazy feature entry, unmount on route exit and test re-entry.
6. Remove the legacy renderer only after static and lifecycle equivalence checks pass.

## Remaining review boundary

Reports helper functions remain in `app.js` because they are shared or intentionally retained as low-risk compatibility helpers. Moving those helpers is not required for the renderer extraction and should be audited separately.

SAFE_FOR_QWEN: repeat this feature pattern only after a LOW-risk screen audit.
NEEDS_STRONG_REVIEW: Clientes, Impressoras and Configurações remain HIGH coupling.
DO_NOT_TOUCH_YET: Home/carousel, operational domains, Supabase/RLS, AI WRITE and release metadata.
