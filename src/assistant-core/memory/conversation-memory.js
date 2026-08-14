(function attachAssistantMemory(global) {
  "use strict";
  const PRIORITY = Object.freeze({ P0: 0, P1: 1, P2: 2, P3: 3 });
  const uid = () => `conversation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  class ConversationMemory {
    constructor(data = {}) {
      this.conversationId = data.conversationId || uid();
      this.summary = String(data.summary || "");
      this.facts = { ...(data.facts || {}) };
      this.decisions = [...(data.decisions || [])];
      this.corrections = [...(data.corrections || [])];
      this.currentEntities = [...(data.currentEntities || [])];
      this.unresolvedQuestions = [...(data.unresolvedQuestions || [])];
      this.recentMessages = [...(data.recentMessages || [])].slice(-24);
    }
    addMessage(role, text, metadata = {}) { this.recentMessages.push({ id: uid(), role, text: String(text || ""), attachments: metadata.attachments || [], timestamp: new Date().toISOString(), metadata }); this.recentMessages = this.recentMessages.slice(-24); return this; }
    setFact(key, value, priority = "P2") {
      const previous = this.facts[key];
      if (previous && previous.value !== value) this.corrections.push({ key, previous: previous.value, current: value, at: new Date().toISOString() });
      this.facts[key] = { value, priority: PRIORITY[priority] == null ? "P2" : priority, updatedAt: new Date().toISOString() };
      return this;
    }
    compact(maxFacts = 40) {
      const entries = Object.entries(this.facts).sort((a, b) => PRIORITY[a[1].priority] - PRIORITY[b[1].priority] || String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)));
      this.facts = Object.fromEntries(entries.slice(0, maxFacts));
      this.recentMessages = this.recentMessages.slice(-12);
      return this;
    }
    snapshot() { return JSON.parse(JSON.stringify(this)); }
  }

  class ConversationStore {
    constructor({ storage, key = "assistant:conversations:v1" } = {}) { this.storage = storage; this.key = key; this.items = this.load(); }
    load() { try { return JSON.parse(this.storage?.getItem(this.key) || "{}") || {}; } catch (_) { return {}; } }
    save(memory) { this.items[memory.conversationId] = memory.snapshot(); this.storage?.setItem(this.key, JSON.stringify(this.items)); return memory; }
    get(id) { return this.items[id] ? new ConversationMemory(this.items[id]) : null; }
    delete(id) { delete this.items[id]; this.storage?.setItem(this.key, JSON.stringify(this.items)); }
  }

  const api = Object.freeze({ PRIORITY, ConversationMemory, ConversationStore });
  global.UniversalAssistantMemory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
