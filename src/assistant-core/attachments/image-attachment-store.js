(function attachAssistantImageStore(global) {
  "use strict";

  class ImageAttachmentStore {
    constructor({ dbName = "simplifica-assistant-attachments-v1" } = {}) {
      this.dbName = dbName;
      this.dbPromise = null;
      this.urls = new Map();
    }

    open() {
      if (this.dbPromise) return this.dbPromise;
      if (!global.indexedDB) return Promise.reject(new Error("Armazenamento de imagens indisponível."));
      this.dbPromise = new Promise((resolve, reject) => {
        const request = global.indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          const store = db.objectStoreNames.contains("images") ? request.transaction.objectStore("images") : db.createObjectStore("images", { keyPath: "id" });
          if (!store.indexNames.contains("conversationId")) store.createIndex("conversationId", "conversationId", { unique: false });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Não foi possível abrir o armazenamento de imagens."));
      });
      return this.dbPromise;
    }

    async put(record) {
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("images", "readwrite");
        transaction.objectStore("images").put({ ...record, createdAt: record.createdAt || new Date().toISOString() });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("Não foi possível guardar a imagem."));
        transaction.onabort = () => reject(transaction.error || new Error("O armazenamento da imagem foi interrompido."));
      });
      return record;
    }

    async get(id) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const request = db.transaction("images", "readonly").objectStore("images").get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("Não foi possível ler a imagem."));
      });
    }

    async objectUrl(id, variant = "thumbnail") {
      const key = `${id}:${variant}`;
      if (this.urls.has(key)) return this.urls.get(key);
      const record = await this.get(id);
      const blob = variant === "original" ? record?.blob : record?.thumbnailBlob;
      if (!blob) return "";
      const url = URL.createObjectURL(blob);
      this.urls.set(key, url);
      return url;
    }

    async deleteMany(ids = []) {
      const unique = [...new Set(ids.filter(Boolean))];
      if (!unique.length) return;
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("images", "readwrite");
        unique.forEach((id) => transaction.objectStore("images").delete(id));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("Não foi possível remover os anexos."));
      });
      for (const [key, url] of this.urls) {
        if (unique.some((id) => key.startsWith(`${id}:`))) { URL.revokeObjectURL(url); this.urls.delete(key); }
      }
    }

    async deleteConversation(conversationId) {
      const db = await this.open();
      const ids = await new Promise((resolve, reject) => {
        const found = [];
        const request = db.transaction("images", "readonly").objectStore("images").index("conversationId").openCursor(IDBKeyRange.only(conversationId));
        request.onsuccess = () => { const cursor = request.result; if (!cursor) return resolve(found); found.push(cursor.primaryKey); cursor.continue(); };
        request.onerror = () => reject(request.error || new Error("Não foi possível localizar os anexos."));
      });
      await this.deleteMany(ids);
    }
  }

  const api = Object.freeze({ ImageAttachmentStore });
  global.UniversalAssistantAttachments = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
