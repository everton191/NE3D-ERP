const assert = require("node:assert/strict");
const { getTarget, createFixtures, snapshotPlan, runWithCleanup, STAGING_REF } = require("./supabase-homolog-test-utils");

function environment(url, target = "staging") {
  const prefix = target === "staging" ? "S3D_STAGING" : "S3D_LOCAL";
  return { [`${prefix}_SUPABASE_URL`]: url, [`${prefix}_SUPABASE_ANON_KEY`]: "synthetic-anon",
    [`${prefix}_SUPABASE_SERVICE_ROLE_KEY`]: "synthetic-service", S3D_STAGING_CONFIRM_REF: STAGING_REF };
}

function planService() {
  const original = { id: "synthetic-plan", metadata: { retained: true, presentation: { name: "Original" } }, price: 29 };
  const state = { row: structuredClone(original), writes: 0, beforeWrite: null };
  return { original, state, service: { from(table) {
    assert.equal(table, "plans");
    let changes;
    const filters = [];
    const result = () => {
      if (!changes) return { data: structuredClone(state.row), error: null };
      state.beforeWrite?.();
      const matches = filters.every(([key, value]) => key === "metadata"
        ? JSON.stringify(state.row[key]) === value : state.row[key] === value);
      if (!matches) return { data: [], error: null };
      state.row = { ...state.row, ...structuredClone(changes) };
      state.writes++;
      return { data: [{ id: state.row.id }], error: null };
    };
    const query = { select() { return query; }, eq(key, value) { filters.push([key, value]); return query; },
      update(value) { changes = value; return query; }, single: async () => result(),
      then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); } };
    return query;
  } } };
}

async function main() {
  for (const url of [`https://${STAGING_REF}.supabase.co`, `https://${STAGING_REF}.supabase.co/`]) {
    assert.equal(getTarget("staging", environment(url)).target, "staging");
  }
  for (const url of ["https://qsufnnivlgdidmjuaprb.supabase.co", "https://dcaqiatgftkjxyewlhgi.supabase.co",
    `http://${STAGING_REF}.supabase.co`, `https://${STAGING_REF}.supabase.co.evil.test`,
    `https://${STAGING_REF}.supabase.co/rest/v1`, `https://${STAGING_REF}.supabase.co?x=1`,
    `https://user:pass@${STAGING_REF}.supabase.co`, "http://127.0.0.1:54321"]) {
    assert.throws(() => getTarget("staging", environment(url)));
  }
  const stagingEnv = environment(`https://${STAGING_REF}.supabase.co`);
  assert.throws(() => getTarget("staging", { ...stagingEnv, S3D_STAGING_CONFIRM_REF: "" }));
  assert.throws(() => getTarget("staging", { ...stagingEnv, S3D_STAGING_SUPABASE_SERVICE_ROLE_KEY: "" }));
  assert.throws(() => getTarget("production", stagingEnv));
  for (const url of ["http://127.0.0.1:54321", "http://localhost:54321", "http://[::1]:54321"]) {
    assert.equal(getTarget("local", environment(url, "local")).target, "local");
  }
  assert.throws(() => getTarget("local", environment(`https://${STAGING_REF}.supabase.co`, "local")));
  assert.throws(() => createFixtures({}, "run-id").user({ id: "id", email: "real@example.com" }));
  assert.throws(() => createFixtures({}, "run-id").user({ id: "id", email: "other@example.invalid" }));

  const cleanupOrder = [];
  await assert.rejects(runWithCleanup(async () => { throw new Error("work failed"); }, [
    async () => { cleanupOrder.push(1); throw new Error("cleanup failed"); },
    async () => { cleanupOrder.push(2); }
  ]), (error) => error.errors.length === 2 && /work failed/.test(error.message) && /cleanup failed/.test(error.message));
  assert.deepEqual(cleanupOrder, [1, 2]);

  for (const conflict of ["none", "metadata", "price", "race"]) {
    const { original, state, service } = planService();
    const snapshot = await snapshotPlan(service, "start");
    const changes = { name: "Synthetic" };
    snapshot.prepare(changes);
    state.row.metadata.presentation = changes;
    state.row.updated_at = "synthetic-version-1";
    snapshot.saved({ presentation: changes, updated_at: state.row.updated_at });
    if (conflict === "metadata") state.row.metadata.presentation.name = "Concurrent edit";
    if (conflict === "price") state.row.price++;
    if (conflict === "race") state.beforeWrite = () => { state.row.updated_at = "synthetic-version-2"; };
    if (conflict === "none") {
      await snapshot.restore();
      assert.deepEqual(state.row.metadata, original.metadata);
      assert.equal(state.row.price, original.price);
      assert.equal(state.writes, 1);
    } else {
      await assert.rejects(snapshot.restore());
      assert.equal(state.writes, 0, "Conflitos nunca devem sobrescrever o card");
    }
  }
  console.log("PASS homologacao segura: alvos exatos, producao bloqueada, limpeza apos falhas e restauracao sem sobrescrever concorrencia.");
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
