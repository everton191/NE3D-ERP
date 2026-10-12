const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sourceMigrations = path.join(root, "supabase", "migrations");
const config = path.join(__dirname, "fixtures", "supabase-local-homolog-config.toml");
const destination = process.argv[2] ? path.resolve(process.argv[2]) : "";

if (!destination || fs.existsSync(destination)) {
  throw new Error("Informe uma pasta nova e vazia fora do repositorio para o replay isolado.");
}
const relative = path.relative(root, destination);
if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
  throw new Error("O replay nao pode ser criado dentro do repositorio.");
}
let existingAncestor = path.dirname(destination);
while (!fs.existsSync(existingAncestor)) {
  const parent = path.dirname(existingAncestor);
  if (parent === existingAncestor) throw new Error("Diretorio pai do replay indisponivel.");
  existingAncestor = parent;
}
const realRelative = path.relative(fs.realpathSync(root), fs.realpathSync(existingAncestor));
if (!realRelative.startsWith("..") && !path.isAbsolute(realRelative)) {
  throw new Error("O destino resolve para dentro do repositorio.");
}

const compatibility = new Map([
  ["20260503110117_harden_saas_rpc_execute_privileges.sql", {
    sha256: "de4a49d8ac732b2c4eff3258cfe9fb31145b32f9a56fc148e3d3d02cb08e512a",
    from: "revoke execute on function public.rls_auto_enable() from public, anon, authenticated;",
    to: `do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;`
  }],
  ["20260831232811_harden_legacy_saas_rpc_contracts.sql", {
    sha256: "3d8e2333058d6220f758579f4fa9d73e9c537f20cc5db375c6d1cafcc43c6de3",
    from: `E'begin\\n  if v_user_id is null then',
    $$begin
  if lower(coalesce(nullif(trim(p_plan_slug), ''), 'free')) <> 'free' then`,
    to: `'if v_user_id is null then',
    $$if lower(coalesce(nullif(trim(p_plan_slug), ''), 'free')) <> 'free' then`
  }]
]);

const sqlFiles = fs.readdirSync(sourceMigrations).filter((name) => name.endsWith(".sql"));
const names = sqlFiles.filter((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name)).sort();
if (names.length < 78 || names.length !== sqlFiles.length) {
  throw new Error("Historico de migrations incompleto ou com nomes invalidos; replay recusado.");
}
for (const name of compatibility.keys()) {
  if (!names.includes(name)) throw new Error(`Migration historica ausente: ${name}`);
}

const prepared = names.map((name) => {
  const original = fs.readFileSync(path.join(sourceMigrations, name));
  const patch = compatibility.get(name);
  if (!patch) return { name, contents: original };
  const normalized = original.toString("utf8").replace(/\r\n/g, "\n");
  const digest = crypto.createHash("sha256").update(normalized).digest("hex");
  if (digest !== patch.sha256 || normalized.split(patch.from).length !== 2) {
    throw new Error(`Migration historica divergente; replay recusado: ${name}`);
  }
  return { name, contents: Buffer.from(normalized.replace(patch.from, () => patch.to)) };
});

const targetMigrations = path.join(destination, "supabase", "migrations");
fs.mkdirSync(targetMigrations, { recursive: true });
fs.copyFileSync(config, path.join(destination, "supabase", "config.toml"));
for (const item of prepared) fs.writeFileSync(path.join(targetMigrations, item.name), item.contents);
console.log(JSON.stringify({ destination, migrations: names.length,
  compatibilityCopies: [...compatibility.keys()] }));
