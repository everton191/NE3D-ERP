"use strict";

const assert = require("assert");
const { createHash, webcrypto } = require("crypto");

require("../src/assistant-core/models/model-provider.js");
const StoreApi = require("../src/assistant-core/models/pwa-model-artifact-store.js");
const { WebLocalModelProvider } = require("../src/assistant-core/models/web-local-model-provider.js");

class MemoryMetadataStore {
  constructor() { this.records = new Map(); }
  async get(id) { return this.records.get(id) || null; }
  async put(record) { this.records.set(record.id, { ...record }); return record; }
  async remove(id) { this.records.delete(id); }
  async list() { return [...this.records.values()].map((record) => ({ ...record })); }
}

class MemoryArtifactAdapter {
  constructor() { this.files = new Map(); }
  async size(id) { return this.files.get(id)?.byteLength || 0; }
  async append(id, bytes, offset) {
    const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const previous = this.files.get(id) || new Uint8Array(0);
    const next = new Uint8Array(Math.max(previous.byteLength, offset + input.byteLength));
    next.set(previous);
    next.set(input, offset);
    this.files.set(id, next);
  }
  async truncate(id, length = 0) { this.files.set(id, (this.files.get(id) || new Uint8Array(0)).slice(0, length)); }
  async readAll(id) {
    const bytes = this.files.get(id) || new Uint8Array(0);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  async open(id) { return new Blob([await this.readAll(id)], { type: "application/octet-stream" }); }
  async remove(id) { this.files.delete(id); }
}

class MemorySettings {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function descriptor(id, bytes, extra = {}) {
  return {
    id,
    displayName: `Modelo ${id}`,
    version: "1.0.0",
    provider: "web-local",
    runtime: "test-webgpu",
    url: `https://models.example/${id}.bin`,
    downloadBytes: bytes.byteLength,
    sha256: sha256(bytes),
    supportedPlatforms: ["webgpu"],
    capabilities: { text: true, vision: false, audio: false, tools: true },
    ...extra
  };
}
function navigatorFixture({ quota = 1024 * 1024 * 1024, usage = 0, gpu = true } = {}) {
  return {
    gpu: gpu ? { requestAdapter: async () => ({ limits: {} }) } : undefined,
    deviceMemory: 8,
    storage: {
      estimate: async () => ({ quota, usage }),
      persisted: async () => false,
      persist: async () => true
    }
  };
}
function interruptedResponse(part) {
  let readCount = 0;
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    body: { getReader: () => ({ read: async () => {
      if (readCount++ === 0) return { done: false, value: part };
      throw new Error("offline");
    } }) }
  };
}
function abortableResponse(part, signal) {
  let readCount = 0;
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    body: { getReader: () => ({ read: async () => {
      if (readCount++ === 0) return { done: false, value: part };
      if (signal.aborted) throw new DOMException("cancelado", "AbortError");
      return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("cancelado", "AbortError")), { once: true }));
    } }) }
  };
}
function createStore({ scope, metadata, adapter, fetchRef, navigatorRef = navigatorFixture(), checksumVerifier = null, maxWebCryptoBytes, safetyBytes = 0 } = {}) {
  return new StoreApi.PwaModelArtifactStore({
    scope,
    metadataStore: metadata,
    adapter,
    fetchRef,
    navigatorRef,
    cryptoRef: webcrypto,
    checksumVerifier,
    maxWebCryptoBytes,
    safetyBytes
  });
}

(async () => {
  const bytes = Buffer.from("modelo-web-local-seguro-e-isolado");
  const model = descriptor("balanced", bytes);

  const metadata = new MemoryMetadataStore();
  const adapter = new MemoryArtifactAdapter();
  const states = [];
  const progress = [];
  let primaryFetches = 0;
  const store = createStore({ scope: "simplifica-3d", metadata, adapter, fetchRef: async () => { primaryFetches += 1; return new Response(bytes); } });
  const installed = await store.install(model, {
    onStateChange: (event) => states.push(event.state),
    onProgress: (event) => progress.push(event.downloadedBytes)
  });
  assert.strictEqual(installed.state, StoreApi.STORE_STATE.READY);
  assert.strictEqual(installed.verified, true);
  assert(states.includes("VERIFYING") && states.includes("INSTALLING") && states.includes("READY"));
  assert.strictEqual(progress.at(-1), bytes.byteLength);
  assert.strictEqual((await store.status(model)).downloadedBytes, bytes.byteLength);
  assert.strictEqual((await store.openArtifact(model)).size, bytes.byteLength);
  await store.install(model);
  assert.strictEqual(primaryFetches, 1, "artifact READY não deve ser baixado novamente");

  const ruralStore = createStore({ scope: "simplifica-rural", metadata, adapter, fetchRef: async () => new Response(bytes) });
  assert.strictEqual((await ruralStore.status(model)).state, StoreApi.STORE_STATE.NOT_INSTALLED, "cada aplicativo deve ter seu próprio namespace de modelo");
  await ruralStore.install(model);
  await store.remove(model.id);
  assert.strictEqual((await store.status(model)).state, StoreApi.STORE_STATE.NOT_INSTALLED);
  assert.strictEqual((await ruralStore.status(model)).state, StoreApi.STORE_STATE.READY, "remover no 3D não pode apagar o modelo do Rural");

  const interruptedMetadata = new MemoryMetadataStore();
  const interruptedAdapter = new MemoryArtifactAdapter();
  const firstPart = bytes.subarray(0, 11);
  let requestedRange = "";
  let attempt = 0;
  const interruptedStore = createStore({
    scope: "resume-app",
    metadata: interruptedMetadata,
    adapter: interruptedAdapter,
    fetchRef: async (_url, options = {}) => {
      attempt += 1;
      requestedRange = options.headers?.Range || requestedRange;
      if (attempt === 1) return interruptedResponse(firstPart);
      const offset = Number(String(options.headers?.Range || "bytes=0-").match(/bytes=(\d+)/)?.[1] || 0);
      return new Response(bytes.subarray(offset), { status: 206, headers: { "Content-Range": `bytes ${offset}-${bytes.byteLength - 1}/${bytes.byteLength}` } });
    }
  });
  await assert.rejects(() => interruptedStore.install(model), (error) => error.code === "DOWNLOAD_FAILED");
  assert.strictEqual((await interruptedStore.status(model)).downloadedBytes, firstPart.byteLength);
  assert.strictEqual((await interruptedStore.install(model)).state, StoreApi.STORE_STATE.READY);
  assert.strictEqual(requestedRange, `bytes=${firstPart.byteLength}-`);

  const restartMetadata = new MemoryMetadataStore();
  const restartAdapter = new MemoryArtifactAdapter();
  let restartAttempt = 0;
  const restartStore = createStore({
    scope: "restart-app",
    metadata: restartMetadata,
    adapter: restartAdapter,
    fetchRef: async (_url, options = {}) => {
      restartAttempt += 1;
      if (restartAttempt === 1) return interruptedResponse(firstPart);
      if (restartAttempt === 2) {
        assert(options.headers?.Range, "a primeira tentativa de retomada deve usar Range");
        return new Response(bytes, { status: 200 });
      }
      assert(!options.headers?.Range, "servidor sem Range deve reiniciar do zero");
      return new Response(bytes, { status: 200 });
    }
  });
  await assert.rejects(() => restartStore.install(model));
  assert.strictEqual((await restartStore.install(model)).state, StoreApi.STORE_STATE.READY);
  assert.strictEqual(restartAttempt, 3);

  const abortMetadata = new MemoryMetadataStore();
  const abortAdapter = new MemoryArtifactAdapter();
  const abortController = new AbortController();
  const abortStore = createStore({
    scope: "cancel-app",
    metadata: abortMetadata,
    adapter: abortAdapter,
    fetchRef: async (_url, { signal }) => abortableResponse(firstPart, signal)
  });
  await assert.rejects(() => abortStore.install(model, { signal: abortController.signal, onProgress: ({ downloadedBytes }) => { if (downloadedBytes > 0) abortController.abort(); } }), (error) => error.code === "DOWNLOAD_INCOMPLETE" && error.details.aborted === true);
  assert.strictEqual((await abortStore.status(model)).downloadedBytes, firstPart.byteLength, "cancelamento deve preservar o parcial para retomada");

  const mismatchAdapter = new MemoryArtifactAdapter();
  const mismatchStore = createStore({ scope: "mismatch-app", metadata: new MemoryMetadataStore(), adapter: mismatchAdapter, fetchRef: async () => new Response(Buffer.from("conteudo-errado")) });
  const wrongDescriptor = { ...descriptor("wrong", Buffer.from("conteudo-errado")), sha256: "0".repeat(64) };
  await assert.rejects(() => mismatchStore.install(wrongDescriptor), (error) => error.code === "CHECKSUM_MISMATCH");
  assert.strictEqual(await mismatchAdapter.size(mismatchStore.key(wrongDescriptor.id)), 0, "checksum inválido não pode deixar artifact ativável");

  const largeMetadata = new MemoryMetadataStore();
  const largeAdapter = new MemoryArtifactAdapter();
  const storedOnly = createStore({ scope: "large-app", metadata: largeMetadata, adapter: largeAdapter, fetchRef: async () => new Response(bytes), maxWebCryptoBytes: 1 });
  assert.strictEqual((await storedOnly.install(model)).state, StoreApi.STORE_STATE.STORED);
  await assert.rejects(() => storedOnly.requireReady(model), (error) => error.code === "CHECKSUM_REQUIRED");
  const runtimeVerified = createStore({ scope: "large-app", metadata: largeMetadata, adapter: largeAdapter, fetchRef: async () => { throw new Error("não deve baixar novamente"); }, checksumVerifier: async () => ({ verified: true, reason: "RUNTIME_SHA256" }), maxWebCryptoBytes: 1 });
  assert.strictEqual((await runtimeVerified.install(model)).state, StoreApi.STORE_STATE.READY, "runtime incremental deve conseguir ativar artifact já armazenado");

  const noSpaceStore = createStore({ scope: "full-app", metadata: new MemoryMetadataStore(), adapter: new MemoryArtifactAdapter(), navigatorRef: navigatorFixture({ quota: bytes.byteLength, usage: bytes.byteLength }), fetchRef: async () => new Response(bytes) });
  await assert.rejects(() => noSpaceStore.install(model), (error) => error.code === "NO_SPACE");

  const providerMetadata = new MemoryMetadataStore();
  const providerAdapter = new MemoryArtifactAdapter();
  const providerStore = createStore({ scope: "provider-app", metadata: providerMetadata, adapter: providerAdapter, fetchRef: async () => new Response(bytes) });
  const runtimeEvents = [];
  const runtime = {
    capabilities: () => ({ text: true, vision: false, audio: false, tools: true }),
    load: async ({ descriptor: loaded, artifact, contextWindow }) => runtimeEvents.push({ type: "load", id: loaded.id, size: artifact.size, contextWindow }),
    send: async ({ text }) => ({ text: `Resposta local: ${text}` }),
    unload: async () => runtimeEvents.push({ type: "unload" }),
    benchmark: async () => ({ health: "READY", tokensPerSecond: 7 })
  };
  const settings = new MemorySettings();
  const provider = new WebLocalModelProvider({ appId: "provider-app", runtime, artifacts: [model], navigatorRef: navigatorFixture(), storageRef: settings, artifactStore: providerStore });
  let providerStatus = await provider.status();
  assert.strictEqual(providerStatus.available, true);
  assert.strictEqual(providerStatus.enabled, false);
  assert.strictEqual(providerStatus.state, "NOT_INSTALLED");
  await provider.setEnabled(true);
  providerStatus = await provider.installModel(model.id);
  assert.strictEqual(providerStatus.modelReady, true);
  assert.strictEqual(providerStatus.runtimeReady, true);
  assert.deepStrictEqual(runtimeEvents[0], { type: "load", id: model.id, size: bytes.byteLength, contextWindow: 8192 });
  assert.deepStrictEqual(await provider.send({ text: "olá" }), { text: "Resposta local: olá" });
  assert.strictEqual((await provider.benchmarkModel()).health, "READY");
  await provider.setEnabled(false);
  assert(runtimeEvents.some((event) => event.type === "unload"));
  await provider.deleteModel(model.id);
  assert.strictEqual((await provider.status()).state, "NOT_INSTALLED");

  const noGpu = new WebLocalModelProvider({ appId: "no-gpu", runtime, artifacts: [model], navigatorRef: navigatorFixture({ gpu: false }), storageRef: new MemorySettings(), artifactStore: providerStore });
  assert.match((await noGpu.status()).reason, /WebGPU/);
  const noRuntime = new WebLocalModelProvider({ appId: "no-runtime", artifacts: [model], navigatorRef: navigatorFixture(), storageRef: new MemorySettings(), artifactStore: providerStore });
  assert.match((await noRuntime.status()).reason, /runtime/i);
  const noArtifact = new WebLocalModelProvider({ appId: "no-artifact", runtime, artifacts: [], navigatorRef: navigatorFixture(), storageRef: new MemorySettings(), artifactStore: providerStore });
  assert.match((await noArtifact.status()).reason, /Nenhum modelo/);

  const fallbackBytes = Buffer.from("modelo-equilibrado-ja-instalado");
  const advancedBytes = Buffer.from("modelo-avancado-que-falha-ao-carregar");
  const balancedWeb = descriptor("balanced-web", fallbackBytes, { displayName: "IA Equilibrada Web", profile: "BALANCED", rank: 10 });
  const advancedWeb = descriptor("advanced-web", advancedBytes, { displayName: "IA Avançada Web", profile: "ADVANCED", rank: 20 });
  const fallbackStore = createStore({
    scope: "fallback-web",
    metadata: new MemoryMetadataStore(),
    adapter: new MemoryArtifactAdapter(),
    fetchRef: async (url) => new Response(String(url).includes("advanced-web") ? advancedBytes : fallbackBytes)
  });
  await fallbackStore.install(balancedWeb);
  await fallbackStore.install(advancedWeb);
  const fallbackSettings = new MemorySettings();
  fallbackSettings.setItem("fallback-web:assistant-web-model:v1", JSON.stringify({ enabled: true, selection: "automatic" }));
  const fallbackLoads = [];
  const fallbackRuntime = {
    capabilities: () => ({ text: true, vision: false, audio: false, tools: true }),
    load: async ({ descriptor: loaded }) => {
      fallbackLoads.push(loaded.id);
      if (loaded.id === advancedWeb.id) throw new Error("runtime sem memória para avançado");
    },
    unload: async () => {},
    send: async ({ text }) => ({ text: `fallback:${text}` })
  };
  const fallbackProvider = new WebLocalModelProvider({ appId: "fallback-web", runtime: fallbackRuntime, artifacts: [balancedWeb, advancedWeb], navigatorRef: navigatorFixture(), storageRef: fallbackSettings, artifactStore: fallbackStore });
  const fallbackStatus = await fallbackProvider.prewarm();
  assert.strictEqual(fallbackStatus.runtimeReady, true);
  assert.strictEqual(fallbackStatus.activeModelId, balancedWeb.id);
  assert.strictEqual(fallbackStatus.fallbackFromModelId, advancedWeb.id);
  assert.strictEqual(fallbackStatus.fallbackModelId, balancedWeb.id);
  assert.deepStrictEqual(fallbackLoads, [advancedWeb.id, balancedWeb.id]);
  assert.deepStrictEqual(await fallbackProvider.send({ text: "olá" }), { text: "fallback:olá" });
  assert.deepStrictEqual(fallbackLoads, [advancedWeb.id, balancedWeb.id], "fallback retido não deve tentar novamente o modelo que falhou");

  console.log("PWA Model Storage: isolamento, capacidade, download, retomada, checksum, remoção, provider e fallback já instalado validados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
