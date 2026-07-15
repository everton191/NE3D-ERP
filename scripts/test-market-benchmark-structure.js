const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredFiles = [
  "src/architecture/market-benchmark/market-systems.registry.ts",
  "src/architecture/market-benchmark/market-capabilities.ts",
  "src/architecture/market-benchmark/feature-gap-analysis.ts",
  "src/architecture/market-benchmark/improvement-priority.ts",
  "src/architecture/market-benchmark/simplifica3d-maturity-map.ts",
  "src/architecture/market-benchmark/market-guided-roadmap.ts",
  "src/architecture/feature-analysis/feature-impact-checklist.ts",
  "src/architecture/improvement-system/improvement-rules.ts",
  "src/architecture/improvement-system/improvement-log.ts",
  "src/architecture/improvement-system/technical-debt-map.ts",
  "src/architecture/improvement-system/future-features.ts",
  "docs/benchmark/erp-benchmark.md",
  "docs/benchmark/ecommerce-benchmark.md",
  "docs/benchmark/printshop-benchmark.md",
  "docs/benchmark/3dprint-benchmark.md",
  "docs/benchmark/simplifica3d-gap-report.md",
  "docs/quality/interface-phase-2-audit.md",
  "docs/quality/screen-inventory.md"
];

requiredFiles.forEach((file) => assert(fs.existsSync(file), `Arquivo estrutural ausente: ${file}`));

const systems = read("src/architecture/market-benchmark/market-systems.registry.ts");
["Odoo", "Zoho Inventory", "Bling", "Printavo", "SimplyPrint", "Shopify"].forEach((marker) => {
  assert(systems.includes(marker), `Referencia de mercado ausente: ${marker}`);
});

const capabilities = read("src/architecture/market-benchmark/market-capabilities.ts");
["orders", "stock", "production", "cash", "store", "plans", "superadmin"].forEach((marker) => {
  assert(capabilities.includes(marker), `Modulo de capacidade ausente: ${marker}`);
});

const inventory = read("docs/quality/screen-inventory.md");
["Dashboard", "Pedidos", "Estoque", "Caixa", "Produ", "Superadmin"].forEach((marker) => {
  assert(inventory.includes(marker), `Tela nao listada no inventario: ${marker}`);
});

const audit = read("docs/quality/interface-phase-2-audit.md");
[
  "Design System existe, mas nao esta 100% aplicado",
  "Tela piloto recomendada",
  "Nao padronizar tudo de uma vez"
].forEach((marker) => {
  assert(audit.includes(marker), `Auditoria sem decisao esperada: ${marker}`);
});

const gap = read("docs/benchmark/simplifica3d-gap-report.md");
[
  "Baixa de estoque deve acontecer pelo pedido/producao",
  "Superadmin deve tratar clientes SaaS como empresas",
  "Monitoramento remoto de impressoras"
].forEach((marker) => {
  assert(gap.includes(marker), `Relatorio de lacunas sem item esperado: ${marker}`);
});

console.log("Estrutura de benchmark, auditoria de telas e lacunas validada.");
