const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260710163343_stock_roll_core_foundation.sql", "utf8");
const runtimeFeatures = fs.readFileSync("src/config/runtimeFeatures.js", "utf8");

assert.match(app, /spool_stock:\s*\{[^}]*requiredPlan:\s*"start"/, "Rolos devem ser liberados a partir do Start.");
assert.match(app, /function podeUsarControleRolosEstoque/, "Acesso aos rolos deve usar capacidade central.");
assert.match(app, /function exigirControleRolosEstoque/, "Acoes de rolo devem validar a capacidade.");
assert.match(app, /manufacturer_lot/, "Rolo local deve preservar lote do fabricante.");
assert.match(app, /spool_tare_weight_g/, "Rolo local deve preservar tara do carretel.");
assert.match(app, /INVENTORY_BATCH_CODE_DUPLICATE/, "Codigo local do rolo deve ser unico.");
assert.match(app, /INVENTORY_BATCH_INITIAL_WEIGHT_INVALID/, "Peso inicial deve ser positivo.");

[
  "create table if not exists public.filament_products",
  "create table if not exists public.filament_product_colors",
  "create table if not exists public.filament_rolls",
  "create table if not exists public.filament_roll_reservations",
  "create table if not exists public.filament_roll_movements",
  "remaining_weight_g >= 0",
  "unique (company_id, internal_code)",
  "unique (company_id, idempotency_key)",
  "alter table public.filament_rolls enable row level security",
  "public.erp_current_client_id()",
  "public.erp_stock_rolls_enabled"
].forEach((marker) => assert.ok(migration.includes(marker), `Nucleo SQL ausente: ${marker}`));

assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i, "RLS de rolos nao pode ser aberta.");
assert.doesNotMatch(migration, /grant\s+all[^;]+to\s+authenticated/i, "Authenticated nao deve receber grant total.");
assert.match(runtimeFeatures, /stockScannerEnabled:\s*false/, "Leitor deve permanecer preparado e inativo.");
assert.match(runtimeFeatures, /stockReservationsEnabled:\s*false/, "Reservas nao devem ser ativadas sem transacao remota.");
assert.match(runtimeFeatures, /stockMovementRpcEnabled:\s*false/, "RPC de movimento nao deve ser ativado antes da revisao remota.");

console.log("Estoque por rolos: capacidade, invariantes, RLS e idempotencia validados.");
