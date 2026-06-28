const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const progress = fs.readFileSync(path.join(root, "docs", "superadmin-planos-progresso-2026-06-28.md"), "utf8");

function includesAll(source, items, label) {
  for (const item of items) {
    assert(source.includes(item), `${label}: faltando ${item}`);
  }
}

function bodyOfFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `funcao ausente: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`nao foi possivel ler funcao: ${name}`);
}

function bodyOfObjectMethod(source, name) {
  const start = source.indexOf(`${name}(`);
  assert(start >= 0, `metodo ausente: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`nao foi possivel ler metodo: ${name}`);
}

includesAll(app, [
  "const PLAN_REGISTRY = Object.freeze",
  "function getPlanRegistryEntry",
  "function getPlanEntitlements",
  "function getPlanLimits",
  "function getPlanCapabilityContract",
  "function getPlanUpgradeOptions",
  "storefrontProductLimit",
  "actionCreditLimit",
  "backupLimitMb",
], "contrato central de planos");

const contract = bodyOfFunction(app, "getPlanCapabilityContract");
includesAll(contract, [
  "entitlements",
  "limits",
  "isPro",
  "isStart",
  "isPaid",
  "isFree",
  "adsEnabled",
  "upgrades",
], "getPlanCapabilityContract");

const policy = bodyOfObjectMethod(app, "getPolicy");
includesAll(policy, [
  "getPlanCapabilityContract",
  "publicStore: entitlements.publicStore === true",
  "shareStore: entitlements.shareLink === true",
  "customThemes: entitlements.premiumThemes === true",
  "reports: contrato.isPaid",
], "PlanService.getPolicy deve derivar do contrato");

includesAll(app, [
  "free: Object.freeze",
  "publicStore: false",
  "storefrontProducts: FREE_STORE_PRODUCT_LIMIT",
  "start: Object.freeze",
  "publicStore: true",
  "storefrontProducts: START_STORE_PRODUCT_LIMIT",
  "pro: Object.freeze",
  "premiumThemes: true",
  "products: Number.POSITIVE_INFINITY",
], "matriz Free Start Pro");

assert(pkg.scripts["test:plan-capabilities"], "package.json deve expor test:plan-capabilities");
assert(progress.includes("Fase PL-01.5 - Contrato central de capacidades"), "progresso deve registrar a fase PL-01.5");

console.log("Plan capability contract tests OK");
