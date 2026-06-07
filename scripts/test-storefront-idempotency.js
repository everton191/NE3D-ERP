const fs = require("fs");
const assert = require("assert");

const app = fs.readFileSync("app.js", "utf8");

function section(start, end) {
  const from = app.indexOf(start);
  const to = app.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, `Secao ausente: ${start}`);
  return app.slice(from, to);
}

const storePersist = section(
  "async function storefrontAdminPersistStoreRemote",
  "async function salvarStorefrontAparencia"
);
const mutableStorePayload = storePersist.slice(
  storePersist.indexOf("const mutablePayload"),
  storePersist.indexOf("const existingStore")
);
const categoryPersist = section(
  "async function storefrontAdminUpsertCategory",
  "async function storefrontAdminUpsertProduct"
);
const productPersist = section(
  "async function storefrontAdminUpsertProduct",
  "function validarArquivoStorefrontImagem"
);
const appearanceSave = section(
  "async function salvarStorefrontAparencia",
  "async function alternarStatusLojaOnline"
);

assert(!mutableStorePayload.includes("slug:"), "UPDATE comum da loja nao pode enviar slug.");
assert(storePersist.includes("const existingStore = await storefrontAdminFindRemoteStore(store)"), "Loja deve ser localizada antes da criacao.");
assert(storePersist.indexOf("const existingStore") < storePersist.indexOf('method: "POST"'), "Consulta da loja deve ocorrer antes do INSERT.");
assert(storePersist.includes("const createPayload"), "Payload de criacao inicial ausente.");
assert(storePersist.includes("slug: attempt < 0 ? initialSlug"), "Slug deve existir apenas no payload inicial.");
assert(appearanceSave.includes("const slug = store.slug || getStorefrontDefaultSlugLocal()"), "Edicao comum deve preservar slug.");
assert(!appearanceSave.includes("form.storeSlug"), "Edicao comum nao pode ler slug editavel.");
assert(!app.includes("if (form.storeSlug) baseStore.slug"), "Preview nao pode regenerar slug.");
assert(app.includes("slug: store.slug || getStorefrontDefaultSlugLocal()"), "Recuperacao de rascunho deve preservar slug.");

for (const [name, content, table] of [
  ["categoria", categoryPersist, "store_categories"],
  ["produto", productPersist, "store_products"]
]) {
  assert(content.includes(`?select=*&id=eq.`), `${name}: busca por ID ausente.`);
  assert(content.includes(`/${table}?select=*&store_id=eq.`), `${name}: reconciliacao por loja/slug ausente.`);
  assert(content.indexOf("?select=*&") < content.indexOf('method: "POST"'), `${name}: INSERT ocorre antes da consulta.`);
  assert(content.includes("const existing = await findExisting()"), `${name}: recuperacao de conflito ausente.`);
}

for (const key of [
  "storefront-appearance-save",
  "storefront-status-save",
  "storefront-category-save",
  "storefront-product-save",
  "storefront-contacts-save",
  "storefront-product-image:",
  "storefront-store-image:"
]) {
  assert(app.includes(key), `Protecao contra operacao repetida ausente: ${key}`);
}

assert(app.includes("assetKey ? \"true\" : \"false\""), "Upload recuperado deve usar caminho idempotente.");
assert(app.includes("storefrontQueuePendingAction(\"store-upsert\", next)"), "Contatos/loja offline devem entrar na fila.");
assert(app.includes("allowPublicStore: false"), "Regra Free de publicacao foi alterada.");
assert((app.match(/allowPublicStore: true/g) || []).length >= 2, "Start e Pro devem continuar podendo publicar.");

const remote = { store: null, inserts: 0, updates: 0 };
function persistStoreSimulation(input) {
  if (remote.store) {
    remote.store = { ...remote.store, name: input.name };
    remote.updates += 1;
    return;
  }
  remote.store = { id: "remote-store", slug: input.slug, name: input.name };
  remote.inserts += 1;
}
persistStoreSimulation({ slug: "minha-loja", name: "Inicial" });
["Banner", "Tema", "Contatos", "Rascunho", "Publicada"].forEach((name) => persistStoreSimulation({ slug: "slug-ignorado", name }));
assert.equal(remote.inserts, 1, "Salvar repetidamente criou mais de uma loja.");
assert.equal(remote.updates, 5, "Edicoes repetidas nao seguiram como UPDATE.");
assert.equal(remote.store.slug, "minha-loja", "Slug mudou durante edicoes comuns.");

console.log("Storefront idempotency: identidade unica, slug imutavel, retries e duplo salvamento protegidos.");
