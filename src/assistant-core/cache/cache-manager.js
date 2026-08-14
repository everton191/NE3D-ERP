(function attachAssistantCache(global) {
  "use strict";
  class AssistantCacheManager {
    constructor({ storage, prefix = "assistant:cache", now = () => Date.now() } = {}) { this.storage = storage; this.prefix = prefix; this.now = now; this.runtime = new Map(); }
    key(kind, id) { return `${this.prefix}:${kind}:${id}`; }
    put(kind, id, value, ttlMs = 0) { const record = { value, createdAt: this.now(), expiresAt: ttlMs > 0 ? this.now() + ttlMs : 0 }; this.storage?.setItem(this.key(kind, id), JSON.stringify(record)); return value; }
    get(kind, id) { try { const key = this.key(kind, id); const record = JSON.parse(this.storage?.getItem(key) || "null"); if (!record) return null; if (record.expiresAt && record.expiresAt <= this.now()) { this.storage?.removeItem(key); return null; } return record.value; } catch (_) { return null; } }
    remove(kind, id) { this.storage?.removeItem(this.key(kind, id)); }
    clearRuntime() { this.runtime.clear(); }
    deleteConversation(conversationId, attachmentIds = []) { ["summary", "facts", "messages", "embeddings", "references"].forEach((kind) => this.remove(kind, conversationId)); attachmentIds.forEach((id) => this.remove("attachment", id)); }
  }
  const api = Object.freeze({ AssistantCacheManager });
  global.UniversalAssistantCache = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
