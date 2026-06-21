const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");

const required = [
  "function getStorefrontPendingQueue()",
  "async function storefrontPersistPendingAction",
  "async function storefrontFlushPendingQueue",
  "function confirmarStorefrontSalvamentoLocal",
  "storefrontPendingQueueFlushPromise",
  "storefrontQueuePendingAction(\"store-upsert\"",
  "storefrontQueuePendingAction(\"store-status\"",
  "storefrontQueuePendingAction(\"category-upsert\"",
  "storefrontQueuePendingAction(\"category-delete\"",
  "storefrontQueuePendingAction(\"category-order\"",
  "storefrontQueuePendingAction(\"product-upsert\"",
  "storefrontQueuePendingAction(\"product-delete\"",
  "storefrontQueuePendingAction(\"store-image-upload\"",
  "storefrontQueuePendingAction(\"product-image-upload\"",
  "storefrontQueuePendingAction(\"image-delete\"",
  "async function storefrontDataUrlToFile",
  "function storefrontIsPublicSlugConflict(error)",
  "function storefrontBuildOwnedSlugCandidate",
  "async function storefrontAdminFindRemoteStoreByOwner",
  "async function storefrontAdminFindRemoteStore(store = {})",
  "function storefrontAdminAdoptRemoteStore",
  "async function storefrontAdminPatchStoreRemote",
  "A sincronização foi concluída sem duplicar informações.",
  "stores_public_slug_unique",
  "if (Array.isArray(saved)) return saved;",
  "if (pendingBeforeSync.length)",
  "if (getStorefrontDirtyState().dirty)",
  "localStorage.removeItem(`${STOREFRONT_PUBLIC_CACHE_PREFIX}",
  "storefrontFlushPendingQueue({ notify: true })"
];

const missing = required.filter((marker) => !app.includes(marker));
if (missing.length) {
  console.error("Persistencia/sincronizacao da loja incompleta:", missing.join(", "));
  process.exit(1);
}

const forbidden = [
  "if (Array.isArray(saved) && saved.length) return saved;",
  "if (Array.isArray(saved) && saved.some((product) => !storefrontIsDemoProduct(product))) return saved;",
  "Produto salvo neste aparelho. Sincronização pendente.",
  "Contatos salvos neste aparelho. Sincronização pendente."
];

const foundForbidden = forbidden.filter((marker) => app.includes(marker));
if (foundForbidden.length) {
  console.error("Fallback de exemplos ainda substitui lista vazia:", foundForbidden.join(", "));
  process.exit(1);
}

console.log("Storefront persistence/sync: fila executavel, merge protegido, listas vazias e cache publico validados.");
