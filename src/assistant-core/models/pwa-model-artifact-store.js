(function attachPwaModelArtifactStore(global) {
  "use strict";

  const STORE_STATE = Object.freeze({
    NOT_INSTALLED: "NOT_INSTALLED",
    CHECKING: "CHECKING",
    DOWNLOADING: "DOWNLOADING",
    VERIFYING: "VERIFYING",
    INSTALLING: "INSTALLING",
    STORED: "STORED",
    READY: "READY",
    FAILED: "FAILED"
  });
  const ERROR_COPY = Object.freeze({
    STORAGE_UNAVAILABLE: "O armazenamento de modelos não está disponível neste navegador.",
    NO_SPACE: "Não há espaço suficiente neste navegador para instalar este modelo.",
    DOWNLOAD_FAILED: "O download do modelo foi interrompido. Você pode tentar novamente para continuar.",
    DOWNLOAD_INCOMPLETE: "O download não terminou. O progresso foi guardado para continuar depois.",
    CHECKSUM_MISMATCH: "A verificação do modelo falhou. O arquivo incompleto foi removido.",
    CHECKSUM_REQUIRED: "Este navegador não consegue verificar com segurança um arquivo desse tamanho.",
    MODEL_NOT_READY: "O modelo ainda não está pronto para uso neste navegador."
  });

  class PwaModelStorageError extends Error {
    constructor(code, details = {}) {
      super(ERROR_COPY[code] || "Não foi possível preparar a IA local neste navegador.");
      this.name = "PwaModelStorageError";
      this.code = code;
      this.details = details;
    }
  }

  function safeName(value, fallback = "assistant") {
    return String(value || fallback).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
  }

  class IndexedDbMetadataStore {
    constructor({ indexedDBRef = global.indexedDB, dbName = "assistant-model-artifacts-v2" } = {}) {
      this.indexedDB = indexedDBRef;
      this.dbName = dbName;
      this.dbPromise = null;
    }
    open() {
      if (this.dbPromise) return this.dbPromise;
      if (!this.indexedDB) return Promise.reject(new PwaModelStorageError("STORAGE_UNAVAILABLE"));
      this.dbPromise = new Promise((resolve, reject) => {
        const request = this.indexedDB.open(this.dbName, 2);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("artifacts")) db.createObjectStore("artifacts", { keyPath: "id" });
          const chunks = db.objectStoreNames.contains("chunks")
            ? request.transaction.objectStore("chunks")
            : db.createObjectStore("chunks", { keyPath: "key" });
          if (!chunks.indexNames.contains("artifactId")) chunks.createIndex("artifactId", "id", { unique: false });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new PwaModelStorageError("STORAGE_UNAVAILABLE"));
      });
      return this.dbPromise;
    }
    async get(id) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const request = db.transaction("artifacts", "readonly").objectStore("artifacts").get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
    async put(record) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("artifacts", "readwrite");
        tx.objectStore("artifacts").put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      });
    }
    async remove(id) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("artifacts", "readwrite");
        tx.objectStore("artifacts").delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    async list() {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const request = db.transaction("artifacts", "readonly").objectStore("artifacts").getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    }
  }

  class IndexedDbArtifactAdapter {
    constructor({ metadataStore, chunkBytes = 8 * 1024 * 1024 } = {}) {
      this.store = metadataStore;
      this.chunkBytes = chunkBytes;
    }
    async rows(id) {
      const db = await this.store.open();
      return new Promise((resolve, reject) => {
        const chunks = db.transaction("chunks", "readonly").objectStore("chunks");
        const request = chunks.indexNames.contains("artifactId") ? chunks.index("artifactId").getAll(id) : chunks.getAll();
        request.onsuccess = () => resolve((request.result || []).filter((row) => row.id === id).sort((a, b) => a.position - b.position));
        request.onerror = () => reject(request.error);
      });
    }
    async size(id) {
      const rows = await this.rows(id);
      let contiguous = 0;
      for (const row of rows) {
        const length = Number(row.bytes?.byteLength || 0);
        if (row.position > contiguous) break;
        contiguous = Math.max(contiguous, row.position + length);
      }
      return contiguous;
    }
    async append(id, bytes, offset) {
      const db = await this.store.open();
      const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      for (let start = 0; start < data.byteLength; start += this.chunkBytes) {
        const part = data.slice(start, Math.min(data.byteLength, start + this.chunkBytes));
        const position = offset + start;
        await new Promise((resolve, reject) => {
          const tx = db.transaction("chunks", "readwrite");
          tx.objectStore("chunks").put({ key: `${id}:${String(position).padStart(16, "0")}`, id, position, bytes: part });
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      }
    }
    async truncate(id, length = 0) {
      const db = await this.store.open();
      const rows = await this.rows(id);
      await new Promise((resolve, reject) => {
        const tx = db.transaction("chunks", "readwrite");
        const chunks = tx.objectStore("chunks");
        rows.forEach((row) => {
          const end = row.position + Number(row.bytes?.byteLength || 0);
          if (row.position >= length) chunks.delete(row.key);
          else if (end > length) chunks.put({ ...row, bytes: new Uint8Array(row.bytes).slice(0, length - row.position) });
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }
    async readAll(id) {
      const rows = await this.rows(id);
      const size = await this.size(id);
      const result = new Uint8Array(size);
      let contiguous = 0;
      for (const row of rows) {
        if (row.position > contiguous) throw new PwaModelStorageError("DOWNLOAD_INCOMPLETE", { downloadedBytes: contiguous });
        const bytes = new Uint8Array(row.bytes);
        result.set(bytes.slice(0, Math.max(0, size - row.position)), row.position);
        contiguous = Math.max(contiguous, row.position + bytes.byteLength);
      }
      return result.buffer;
    }
    async open(id) { return new Blob([await this.readAll(id)], { type: "application/octet-stream" }); }
    async remove(id) {
      const db = await this.store.open();
      const rows = await this.rows(id);
      await new Promise((resolve, reject) => {
        const tx = db.transaction("chunks", "readwrite");
        const chunks = tx.objectStore("chunks");
        rows.forEach((row) => chunks.delete(row.key));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  class OpfsArtifactAdapter {
    constructor({ navigatorRef = global.navigator } = {}) { this.navigator = navigatorRef; this.writers = new Map(); }
    async directory() {
      const root = await this.navigator?.storage?.getDirectory?.();
      if (!root) throw new PwaModelStorageError("STORAGE_UNAVAILABLE");
      return root.getDirectoryHandle("assistant-models", { create: true });
    }
    name(id) { return `${safeName(id, "model")}.artifact`; }
    async handle(id, create = true) { return (await this.directory()).getFileHandle(this.name(id), { create }); }
    async size(id) {
      try { return (await (await this.handle(id, false)).getFile()).size; }
      catch (_) { return 0; }
    }
    async beginAppend(id, offset = 0) {
      await this.endAppend(id);
      const writable = await (await this.handle(id, true)).createWritable({ keepExistingData: true });
      await writable.seek(offset);
      this.writers.set(id, writable);
    }
    async append(id, bytes, offset) {
      const active = this.writers.get(id);
      if (active) {
        await active.write(bytes);
        return;
      }
      const writable = await (await this.handle(id, true)).createWritable({ keepExistingData: true });
      try { await writable.seek(offset); await writable.write(bytes); }
      finally { await writable.close(); }
    }
    async endAppend(id) {
      const writable = this.writers.get(id);
      if (!writable) return;
      this.writers.delete(id);
      await writable.close();
    }
    async truncate(id, length = 0) {
      try {
        const writable = await (await this.handle(id, false)).createWritable({ keepExistingData: true });
        try { await writable.truncate(length); }
        finally { await writable.close(); }
      } catch (_) { }
    }
    async readAll(id) { return (await (await this.handle(id, false)).getFile()).arrayBuffer(); }
    async open(id) { return (await this.handle(id, false)).getFile(); }
    async remove(id) {
      await this.endAppend(id).catch(() => {});
      try { await (await this.directory()).removeEntry(this.name(id)); }
      catch (_) { }
    }
  }

  function toHex(buffer) {
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function validArtifactUrl(value) {
    try {
      const url = new URL(String(value || ""), global.location?.href || "https://localhost/");
      return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    } catch (_) { return false; }
  }
  function validDescriptor(item) {
    return item && String(item.id || "") && String(item.version || "") && Number(item.downloadBytes) > 0
      && /^[a-f0-9]{64}$/i.test(String(item.sha256 || "")) && validArtifactUrl(item.url);
  }
  function contentRangeStart(response) {
    const value = response?.headers?.get?.("content-range") || "";
    const match = String(value).match(/^bytes\s+(\d+)-/i);
    return match ? Number(match[1]) : null;
  }

  class PwaModelArtifactStore {
    constructor({ scope = "assistant", navigatorRef = global.navigator, indexedDBRef = global.indexedDB, fetchRef = global.fetch?.bind(global), cryptoRef = global.crypto, metadataStore = null, adapter = null, checksumVerifier = null, maxWebCryptoBytes = 384 * 1024 * 1024, safetyBytes = 256 * 1024 * 1024 } = {}) {
      this.scope = safeName(scope);
      this.navigator = navigatorRef;
      this.fetch = fetchRef;
      this.crypto = cryptoRef;
      this.metadata = metadataStore || new IndexedDbMetadataStore({ indexedDBRef });
      this.adapter = adapter || (navigatorRef?.storage?.getDirectory
        ? new OpfsArtifactAdapter({ navigatorRef })
        : new IndexedDbArtifactAdapter({ metadataStore: this.metadata }));
      this.checksumVerifier = checksumVerifier;
      this.maxWebCryptoBytes = maxWebCryptoBytes;
      this.safetyBytes = safetyBytes;
    }
    key(id) { return `${this.scope}:${safeName(id, "model")}`; }
    async storageProfile({ requestPersistence = false } = {}) {
      const estimate = await this.navigator?.storage?.estimate?.().catch?.(() => null);
      let persisted = await this.navigator?.storage?.persisted?.().catch?.(() => false);
      if (requestPersistence && !persisted) persisted = await this.navigator?.storage?.persist?.().catch?.(() => false);
      const quota = Number(estimate?.quota || 0);
      const usage = Number(estimate?.usage || 0);
      return {
        quota,
        usage,
        freeBytes: Math.max(0, quota - usage),
        persisted: persisted === true,
        backend: this.adapter instanceof OpfsArtifactAdapter ? "OPFS" : "INDEXED_DB",
        scope: this.scope
      };
    }
    async status(descriptor) {
      const key = this.key(descriptor.id);
      const record = await this.metadata.get(key);
      const downloadedBytes = await this.adapter.size(key);
      const current = record && record.version === descriptor.version
        && String(record.sha256 || "").toLowerCase() === String(descriptor.sha256 || "").toLowerCase();
      return {
        state: current ? record.state : STORE_STATE.NOT_INSTALLED,
        downloadedBytes: current ? downloadedBytes : 0,
        totalBytes: Number(descriptor.downloadBytes) || 0,
        verified: current && record.verified === true,
        verification: current ? record.verification || "" : "",
        record: current ? { ...record, modelId: descriptor.id } : null
      };
    }
    async ensureCapacity(descriptor, downloadedBytes = 0) {
      const profile = await this.storageProfile({ requestPersistence: true });
      const remaining = Math.max(0, descriptor.downloadBytes - downloadedBytes);
      const reserve = Math.min(this.safetyBytes, Math.round(descriptor.downloadBytes * 0.1));
      if (profile.quota > 0 && profile.freeBytes < remaining + reserve) {
        throw new PwaModelStorageError("NO_SPACE", { profile, remaining, reserve });
      }
      return profile;
    }
    async openArtifact(descriptor, { requireReady = true } = {}) {
      if (requireReady) await this.requireReady(descriptor);
      const key = this.key(descriptor.id);
      return this.adapter.open ? this.adapter.open(key) : this.adapter.readAll(key);
    }
    async verify(descriptor) {
      const key = this.key(descriptor.id);
      if (typeof this.checksumVerifier === "function") {
        const result = await this.checksumVerifier({ descriptor, key, adapter: this.adapter, openArtifact: () => this.openArtifact(descriptor, { requireReady: false }) });
        return typeof result === "boolean" ? { verified: result, reason: result ? "RUNTIME_SHA256" : "CHECKSUM_MISMATCH" } : result;
      }
      if (descriptor.downloadBytes > this.maxWebCryptoBytes || !this.crypto?.subtle?.digest) {
        return { verified: false, reason: "RUNTIME_REQUIRED" };
      }
      const digest = toHex(await this.crypto.subtle.digest("SHA-256", await this.adapter.readAll(key)));
      return { verified: digest.toLowerCase() === descriptor.sha256.toLowerCase(), digest };
    }
    async install(descriptor, { signal, onProgress = () => {}, onStateChange = () => {} } = {}) {
      if (!validDescriptor(descriptor) || !this.fetch) throw new PwaModelStorageError("STORAGE_UNAVAILABLE");
      const key = this.key(descriptor.id);
      const previous = await this.metadata.get(key);
      const sameArtifact = previous?.version === descriptor.version
        && String(previous?.sha256 || "").toLowerCase() === String(descriptor.sha256).toLowerCase();
      const existingBytes = await this.adapter.size(key);
      if (!sameArtifact && (previous || existingBytes > 0)) {
        await this.adapter.remove(key);
        if (previous) await this.metadata.remove(key);
      }
      let offset = sameArtifact ? existingBytes : 0;
      if (offset > descriptor.downloadBytes) {
        await this.adapter.remove(key);
        offset = 0;
      }
      const profile = await this.ensureCapacity(descriptor, offset);
      const base = {
        id: key,
        appScope: this.scope,
        modelId: descriptor.id,
        version: descriptor.version,
        sha256: String(descriptor.sha256).toLowerCase(),
        url: descriptor.url,
        totalBytes: descriptor.downloadBytes,
        storageBackend: profile.backend,
        persisted: profile.persisted
      };
      const save = async (state, details = {}) => {
        const record = { ...base, state, downloadedBytes: offset, verified: false, updatedAt: new Date().toISOString(), ...details };
        await this.metadata.put(record);
        onStateChange({ state, downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
        return record;
      };
      if (sameArtifact && previous.state === STORE_STATE.READY && previous.verified === true && offset === descriptor.downloadBytes) {
        onProgress({ downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
        onStateChange({ state: STORE_STATE.READY, downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
        return { ...previous, modelId: descriptor.id };
      }
      if (offset < descriptor.downloadBytes) {
        await save(STORE_STATE.DOWNLOADING);
        onProgress({ downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
        let response;
        try {
          response = await this.fetch(descriptor.url, { signal, headers: offset > 0 ? { Range: `bytes=${offset}-` } : {} });
          const invalidResume = offset > 0 && (response?.status !== 206 || contentRangeStart(response) !== offset);
          if (invalidResume) {
            await this.adapter.remove(key);
            offset = 0;
            await save(STORE_STATE.DOWNLOADING, { resumed: false });
            response = await this.fetch(descriptor.url, { signal });
          }
          if (!response?.ok || !response.body?.getReader) throw new Error("download");
          const reader = response.body.getReader();
          let lastSaved = offset;
          await this.adapter.beginAppend?.(key, offset);
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!value?.byteLength) continue;
              if (offset + value.byteLength > descriptor.downloadBytes) {
                throw new PwaModelStorageError("DOWNLOAD_FAILED", { reason: "SIZE_MISMATCH" });
              }
              await this.adapter.append(key, value, offset);
              offset += value.byteLength;
              onProgress({ downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
              if (offset - lastSaved >= 16 * 1024 * 1024) {
                await save(STORE_STATE.DOWNLOADING);
                lastSaved = offset;
              }
            }
          } finally {
            await this.adapter.endAppend?.(key);
          }
        } catch (error) {
          if (error instanceof PwaModelStorageError && error.details?.reason === "SIZE_MISMATCH") {
            await this.adapter.remove(key);
            offset = 0;
            await save(STORE_STATE.FAILED, { errorCode: "DOWNLOAD_FAILED" });
            throw error;
          }
          const aborted = signal?.aborted === true || error?.name === "AbortError";
          await save(STORE_STATE.DOWNLOADING, { errorCode: aborted ? "DOWNLOAD_INTERRUPTED" : "DOWNLOAD_FAILED" });
          throw new PwaModelStorageError(aborted ? "DOWNLOAD_INCOMPLETE" : "DOWNLOAD_FAILED", { downloadedBytes: offset, aborted });
        }
        const actualSize = await this.adapter.size(key);
        offset = actualSize;
        if (actualSize !== descriptor.downloadBytes) {
          await save(STORE_STATE.DOWNLOADING, { errorCode: "DOWNLOAD_INCOMPLETE" });
          throw new PwaModelStorageError("DOWNLOAD_INCOMPLETE", { downloadedBytes: actualSize });
        }
      } else {
        onProgress({ downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
      }
      await save(STORE_STATE.VERIFYING);
      const verification = await this.verify(descriptor);
      if (verification?.verified !== true) {
        if (verification?.reason === "RUNTIME_REQUIRED") {
          return save(STORE_STATE.STORED, { verified: false, verification: verification.reason });
        }
        await this.adapter.remove(key);
        offset = 0;
        await save(STORE_STATE.FAILED, { errorCode: "CHECKSUM_MISMATCH", verification: verification?.digest || verification?.reason || "" });
        throw new PwaModelStorageError("CHECKSUM_MISMATCH");
      }
      await save(STORE_STATE.INSTALLING, { verification: verification.digest || verification.reason || "SHA256" });
      const ready = {
        ...base,
        state: STORE_STATE.READY,
        downloadedBytes: offset,
        verified: true,
        verification: verification.digest ? "SHA256" : (verification.reason || "RUNTIME_SHA256"),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      };
      await this.metadata.put(ready);
      onStateChange({ state: STORE_STATE.READY, downloadedBytes: offset, totalBytes: descriptor.downloadBytes });
      return { ...ready, modelId: descriptor.id };
    }
    async requireReady(descriptor) {
      const status = await this.status(descriptor);
      if (status.state !== STORE_STATE.READY || !status.verified) {
        throw new PwaModelStorageError(status.state === STORE_STATE.STORED ? "CHECKSUM_REQUIRED" : "MODEL_NOT_READY");
      }
      return status;
    }
    async touch(descriptor) {
      const key = this.key(descriptor.id);
      const record = await this.metadata.get(key);
      if (record) await this.metadata.put({ ...record, lastUsedAt: new Date().toISOString() });
    }
    async list() {
      const prefix = `${this.scope}:`;
      return (await this.metadata.list()).filter((record) => String(record.id || "").startsWith(prefix));
    }
    async remove(id) {
      const key = this.key(id);
      await this.adapter.remove(key);
      await this.metadata.remove(key);
      return { status: "REMOVED", id, scope: this.scope };
    }
    async evictExcept(keepIds = []) {
      const keep = new Set(keepIds.map((id) => this.key(id)));
      const records = await this.list();
      const removed = [];
      for (const record of records) {
        if (keep.has(record.id)) continue;
        await this.remove(record.modelId || String(record.id).slice(this.scope.length + 1));
        removed.push(record.modelId || record.id);
      }
      return removed;
    }
  }

  const api = Object.freeze({
    STORE_STATE,
    ERROR_COPY,
    PwaModelStorageError,
    IndexedDbMetadataStore,
    IndexedDbArtifactAdapter,
    OpfsArtifactAdapter,
    PwaModelArtifactStore
  });
  global.UniversalAssistantPwaModelStore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
