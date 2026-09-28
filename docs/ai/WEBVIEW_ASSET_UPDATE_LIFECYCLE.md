# WebView asset update lifecycle

## Root cause

Android Capacitor serves the current APK assets directly. `index.html` deliberately unregisters service workers on native platforms, so an Android WebView is not controlled by the PWA cache. The prior missing IA globals were expected before the lazy `ensureAiRuntimeLoaded()` path, and the manual injection had omitted dependent modules.

## Build identity

`scripts/prepare-web.js` derives a deterministic build ID from the shell and critical IA inputs. It writes `dist/build-info.json` and injects that ID into the built `index.html` and `sw.js`. Equal sources reuse the ID; changed critical assets generate a new one.

## Web PWA

The web service worker uses a cache named with the build ID, precaches the shell plus IA modules, calls `skipWaiting` and `clients.claim`, and deletes only old `simplifica-3d-` caches. Web registration uses `updateViaCache: "none"`. Android keeps service workers disabled to avoid duplicating APK asset loading.

## Runtime gate

`SimplificaAiRuntimeLoader.isAiRuntimeReady()` requires IntentRegistry, ActionPlan, ToolRegistry, CandidateRetriever, Needle shadow, corpus, and persisted evaluation. Evaluation fails closed with `AI_RUNTIME_NOT_READY` when any is absent.

## Offline and user data

The SW never caches `needle3.cact`. The Android model, sessions, drafts, databases, and app-private evaluation files are untouched by build/sync/APK overlay updates.
