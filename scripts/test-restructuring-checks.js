const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

function warn(condition, message) {
  if (!condition) console.warn(`WARN: ${message}`);
  else console.log(`OK: ${message}`);
}

const app = read("app.js");
const css = read("style.css");
const sw = read("sw.js");
const index = read("index.html");
const pkg = JSON.parse(read("package.json"));

[
  "docs/reestruturacao-profissional-checks.md",
  "docs/module-dependencies.md",
  "docs/render-flow.md",
  "docs/css-risk-map.md",
  "docs/layout-zones.md"
].forEach((file) => assert(exists(file), `documento de reestruturacao presente: ${file}`));

[
  "core/.gitkeep",
  "layouts/.gitkeep",
  "components/.gitkeep",
  "themes/.gitkeep",
  "legacy/.gitkeep"
].forEach((file) => assert(exists(file), `pasta-base preparada: ${file}`));

assert(/const APP_VERSION = "1\.0\.16-estavel"/.test(app), "app.js esta na versao 1.0.16-estavel");
assert(/const APP_VERSION_CODE = 15/.test(app), "app.js possui versionCode 15");
assert(sw.includes("simplifica-3d-v116-estavel-20260526-plan-profile-rings"), "service worker possui cache versionado atual");
assert(sw.includes("caches.keys()"), "service worker limpa caches antigos");
assert(index.includes("1.0.16-estavel-plan-profile-rings"), "index.html usa cache-bust atual");

[
  "--bg-primary",
  "--bg-secondary",
  "--card-bg",
  "--text-primary",
  "--text-secondary",
  "--accent-primary",
  "--accent-secondary",
  "--space-xs",
  "--space-sm",
  "--space-md",
  "--radius-card",
  "--radius-button",
  "--shadow-soft"
].forEach((token) => assert(css.includes(token), `token global presente: ${token}`));

assert(css.includes(".side-drawer"), "CSS possui drawer mobile");
assert(css.includes(".mobile-bottom-nav"), "CSS possui bottom navigation mobile");
assert(app.includes("function renderMobileBottomNav"), "app.js renderiza bottom navigation mobile");
assert(app.includes("function renderDrawerLateral"), "app.js renderiza drawer lateral");

assert(exists("src/storefront/services/storefront-public.service.ts"), "servico publico de storefront existe");
assert(exists("src/storefront/services/storefront-admin.service.ts"), "servico admin de storefront existe");
assert(exists("src/storefront/adapters/product.adapter.ts"), "adapter de produto de storefront existe");
assert(exists("src/storefront/plans/storefrontPlanRules.ts"), "regras de planos de storefront existem");

[
  "activePlan",
  "subscriptionStatus",
  "expiresAt",
  "normalizarSlugPlano",
  "checkout_opened",
  "setPlansModernTab"
].forEach((marker) => assert(app.includes(marker), `marcador de planos/assinatura presente: ${marker}`));

[
  "test:storefront-pwa-upgrade",
  "test:ui-theme-consistency",
  "test:storefront-desktop-upscale",
  "test:plans-saas-structure",
  "test:project-saneamento"
].forEach((script) => assert(Boolean(pkg.scripts?.[script]), `script npm ativo: ${script}`));

warn(css.includes("--z-sidebar"), "tokens de z-index ainda devem ser formalizados");
warn(exists("modules"), "pasta modules existe, mas permanece ignorada e sem reorganizacao nesta fase");
warn(app.includes("enableNewStorefront") || app.includes("enableNewPlans"), "feature flags oficiais ainda devem ser formalizadas");

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Checks de reestruturacao concluidos.");
