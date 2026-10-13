const assert = require("node:assert/strict");

const STAGING_REF = "sgcsgudgaxzysqyqxnik";

function getTarget(target = "local", env = process.env) {
  assert(["local", "staging"].includes(target), "Alvo de homologacao invalido");
  const prefix = target === "staging" ? "S3D_STAGING" : "S3D_LOCAL";
  const url = env[`${prefix}_SUPABASE_URL`] || "";
  const anonKey = env[`${prefix}_SUPABASE_ANON_KEY`] || "";
  const serviceKey = env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`] || "";
  const parsed = new URL(url);
  assert(!parsed.username && !parsed.password && !parsed.search && !parsed.hash
    && parsed.pathname === "/", "URL de homologacao deve conter apenas a origem");
  const allowed = target === "local"
    ? ["http:", "https:"].includes(parsed.protocol)
      && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
    : [ `https://${STAGING_REF}.supabase.co`, `https://${STAGING_REF}.supabase.co/` ].includes(url)
      && env.S3D_STAGING_CONFIRM_REF === STAGING_REF;
  assert(allowed && anonKey && serviceKey, "Alvo nao autorizado ou credenciais ausentes");
  return { target, url: parsed.origin, anonKey, serviceKey };
}

function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

// Only IDs returned by this run's successful Auth creates enter this ledger.
function createFixtures(service, runId) {
  const users = [];
  const sessions = new Set();
  return {
    user(user) {
      assert(user?.id && user.email?.includes(runId) && user.email.endsWith("@example.invalid"),
        "Fixture deve ser sintetica e pertencer a esta execucao");
      users.push({ id: user.id, email: user.email });
    },
    session(client) { sessions.add(client); return client; },
    async cleanup() {
      const errors = [];
      const attempt = async (action) => { try { await action(); } catch (error) { errors.push(error); } };
      // Revoke administrative authority before any other potentially failing cleanup.
      for (const user of users) await attempt(async () => {
        must(await service.from("superadmins").delete().eq("user_id", user.id), "revogar superadmin sintetico");
      });
      for (const client of sessions) await attempt(async () => {
        must(await client.auth.signOut({ scope: "global" }), "revogar sessoes sinteticas");
      });
      for (const user of users) await attempt(async () => {
        const clients = must(await service.from("clients").select("id,email,company_id")
          .eq("email", user.email), "localizar cliente sintetico");
        assert(clients.length <= 1, "Cliente sintetico ambiguo");
        const owned = must(await service.from("companies").select("id")
          .eq("owner_user_id", user.id), "localizar empresa sintetica");
        // Current signup links companies through clients; owner_user_id can be null.
        const companyIds = [...new Set([...owned.map((item) => item.id),
          ...clients.map((item) => item.company_id).filter(Boolean)])];
        const companies = companyIds.length ? must(await service.from("companies")
          .select("id,name,owner_user_id").in("id", companyIds), "reler empresas sinteticas") : [];
        for (const company of companies) {
          assert(company.name.includes(runId) && (!company.owner_user_id
            || users.some((item) => item.id === company.owner_user_id)), "Empresa fora da execucao");
          const members = must(await service.from("company_members").select("user_id")
            .eq("company_id", company.id), "verificar membros sinteticos");
          assert(members.every((member) => users.some((item) => item.id === member.user_id)),
            "Empresa possui membro fora desta execucao; limpeza bloqueada");
          const linkedClients = must(await service.from("clients").select("id")
            .eq("company_id", company.id), "verificar clientes da empresa");
          assert(linkedClients.every((item) => clients.some((client) => client.id === item.id)),
            "Empresa possui cliente fora desta execucao; limpeza bloqueada");
          let deletion = service.from("companies").delete().eq("id", company.id).eq("name", company.name);
          deletion = company.owner_user_id ? deletion.eq("owner_user_id", company.owner_user_id)
            : deletion.is("owner_user_id", null);
          assert.equal(must(await deletion.select("id"), "remover empresa sintetica").length, 1);
          assert.equal(must(await service.from("companies").select("id").eq("id", company.id),
            "verificar empresa removida").length, 0);
        }
        for (const client of clients) {
          must(await service.from("clients").delete().eq("id", client.id).eq("email", user.email),
            "remover cliente sintetico");
          assert.equal(must(await service.from("clients").select("id").eq("id", client.id),
            "verificar cliente removido").length, 0);
        }
        must(await service.auth.admin.deleteUser(user.id), "remover Auth sintetico");
        const gone = await service.auth.admin.getUserById(user.id);
        assert(gone.error?.status === 404, "Auth sintetico ainda existe ou verificacao falhou");
        assert.equal(must(await service.from("stores").select("id").eq("owner_id", user.id),
          "verificar lojas removidas").length, 0);
        assert.equal(must(await service.from("superadmins").select("user_id").eq("user_id", user.id),
          "verificar revogacao administrativa").length, 0);
      });
      await attempt(async () => {
        assert.equal(must(await service.from("companies").select("id").like("name", `% ${runId}`),
          "verificar empresas remanescentes").length, 0, "Empresa sintetica remanescente");
      });
      if (errors.length) throw new AggregateError(errors,
        `Limpeza incompleta: ${errors.map((error) => error.message).join("; ")}`);
      console.log(`PASS limpeza: ${users.length} usuarios sinteticos removidos; auditoria preservada.`);
    }
  };
}

async function snapshotPlan(service, slug) {
  const original = must(await service.from("plans").select("id,metadata,price")
    .eq("slug", slug).single(), "snapshot do card");
  let expected = null;
  let writtenAt = null;
  return {
    original,
    prepare(changes) {
      expected = { ...(original.metadata || {}),
        presentation: { ...(original.metadata?.presentation || {}), ...changes } };
    },
    saved(result) {
      assert.deepEqual(result.presentation, expected.presentation,
        "Card foi modificado concorrentemente antes da gravacao");
      writtenAt = result.updated_at;
    },
    async restore() {
      if (!expected) return;
      const current = must(await service.from("plans").select("metadata,price")
        .eq("id", original.id).single(), "reler card para restauracao");
      assert.equal(current.price, original.price, "Preco comercial mudou; restauracao bloqueada");
      if (JSON.stringify(current.metadata) === JSON.stringify(original.metadata)) return;
      assert.deepEqual(current.metadata, expected, "Conflito no card; nao sobrescrever alteracao concorrente");
      let update = service.from("plans").update({ metadata: original.metadata })
        .eq("id", original.id).eq("price", original.price).eq("metadata", JSON.stringify(expected));
      if (writtenAt) update = update.eq("updated_at", writtenAt);
      assert.equal(must(await update.select("id"), "restaurar card com compare-and-swap").length, 1,
        "Conflito durante restauracao do card");
      const restored = must(await service.from("plans").select("metadata,price")
        .eq("id", original.id).single(), "verificar card restaurado");
      assert.deepEqual(restored.metadata, original.metadata);
      assert.equal(restored.price, original.price);
      console.log("PASS card restaurado exatamente; preco comercial preservado.");
    }
  };
}

async function runWithCleanup(work, cleanups) {
  const errors = [];
  try { await work(); } catch (error) { errors.push(error); }
  for (const cleanup of cleanups) {
    try { await cleanup(); } catch (error) { errors.push(error); }
  }
  if (errors.length) throw new AggregateError(errors, errors.map((error) => error.message).join("; "));
}

module.exports = { getTarget, createFixtures, snapshotPlan, runWithCleanup, STAGING_REF };
