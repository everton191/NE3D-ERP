const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "supabase", "migrations");
const script = path.join(__dirname, "prepare-supabase-homolog-replay.js");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "s3d-homolog-replay-test-"));
const target = path.join(temp, "project");
const hash = (contents) => crypto.createHash("sha256")
  .update(contents.toString("utf8").replace(/\r\n/g, "\n")).digest("hex");

try {
  const result = JSON.parse(execFileSync(process.execPath, [script, target], { encoding: "utf8" }));
  const expected = fs.readdirSync(source).filter((name) => name.endsWith(".sql")).sort();
  const actual = fs.readdirSync(path.join(target, "supabase", "migrations")).sort();
  assert.deepEqual(actual, expected);
  assert.equal(result.migrations, expected.length);
  assert.equal(result.compatibilityCopies.length, 2);
  assert(fs.existsSync(path.join(target, "supabase", "config.toml")));

  const outputs = {
    "20260503110117_harden_saas_rpc_execute_privileges.sql": "b8fa169c49d698240c393e6a30e8d815a9a5ed36484f34dacbd9eeb1c18df8a0",
    "20260831232811_harden_legacy_saas_rpc_contracts.sql": "977fb299040fb53c6f0bd8ee11a59784e81fc738af462a7f6c925e8fa799a172"
  };
  for (const [name, digest] of Object.entries(outputs)) {
    const original = fs.readFileSync(path.join(source, name));
    const prepared = fs.readFileSync(path.join(target, "supabase", "migrations", name));
    assert.equal(hash(prepared), digest, `${name}: copia inesperada`);
    assert.notEqual(hash(prepared), hash(original), `${name}: compatibilidade nao aplicada`);
  }

  const denied = spawnSync(process.execPath, [script, path.join(root, "replay-should-not-exist")],
    { encoding: "utf8" });
  assert.notEqual(denied.status, 0);
  assert.equal(fs.existsSync(path.join(root, "replay-should-not-exist")), false);
  console.log(`Replay isolado: ${expected.length} migrations, 2 adaptacoes e protecao do repositorio PASS`);
} finally {
  fs.rmSync(temp, { recursive: true });
}
