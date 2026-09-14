# Simplifica 3D — Structure Phase 2

Initial SHA: `41803aa`. The prior Home/carousel checkpoint remains `01cb133`; it is retained in history and not redesigned.

## Dependency map

`telaAtual` remains the legacy state holder. `trocarTela` is the compatibility bridge. Main screens are registered by `src/navigation/screen-registry.js`; legacy/special screens (storefront, store-admin, superadmin, login, onboarding and public legal flows) remain outside that progressive registry. `renderTela`, desktop/sidebar and mobile Bottom Nav remain legacy renderers for this phase.

UI V3 components are the official target for new UI work: Button/IconButton/Card/Input/Textarea/Select/Badge/EmptyState/LoadingState. New dialogs/drawers should use V3 layers (`overlay-layer`, `drawer-layer`, `modal-layer`, `toast-layer`); `#popup` remains a documented legacy bridge only.

Theme authority is `themeAuthorityV3.js`, with `THEME_CONTRACT`, canonical ERP storage key, legacy migration, system resolution, DOM attributes and theme-color synchronization. The inline index bootstrap remains intentionally early to prevent a theme flash.

AI is optional at startup: `ai-runtime-loader.js` serially and idempotently loads the existing Phase 1 stack only when the assistant opens. It neither prewarms nor downloads a GGUF. `ensureAiRuntimeLoaded()` shares concurrent callers and clears its promise after an error for recovery.

Release consistency is inspection-only: `npm.cmd run check:release-consistency` compares the frozen Android version/versionCode with `downloads/update.json`; it never changes them.

The Home facade under `src/features/home/` provides a future data-only carousel contract. It does not alter the current local carousel or introduce data access.

## Remaining debt

SAFE_FOR_QWEN: complete remaining ScreenRegistry entries one at a time; migrate new UI to V3 contracts; add regression fixtures; expand the release checker read-only.

NEEDS_STRONG_REVIEW: moving existing renderer ownership from `app.js`; changing Android/plugin AI loading; native LFM support; changing the theme bootstrap; changing navigation permissions.

DO_NOT_TOUCH_YET: Home/carousel UX/physics, launcher-3d, public version metadata/distribution, Supabase, and all AI WRITE paths.
