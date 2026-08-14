(function attachUniversalAssistantCore(global) {
  "use strict";
  const Context = global.UniversalAssistantContext;
  const Memory = global.UniversalAssistantMemory;
  const Tools = global.UniversalAssistantTools;
  const Navigation = global.UniversalAssistantNavigation;
  const Search = global.UniversalAssistantSearch;
  const Cache = global.UniversalAssistantCache;
  class AssistantCore {
    constructor({ manifest, storage, permissionGuard, writePipeline, navigate, back, attachmentStore = null } = {}) {
      this.manifest = manifest;
      this.context = new Context.AssistantContextProvider({ manifest, contextWindow: 8192 });
      this.store = new Memory.ConversationStore({ storage, key: `assistant:${manifest.appId}:conversations:v1` });
      this.activeKey = `assistant:${manifest.appId}:active-conversation:v1`;
      const activeId = storage?.getItem(this.activeKey);
      this.memory = (activeId && this.store.get(activeId)) || new Memory.ConversationMemory();
      this.tools = new Tools.ToolRegistry({ permissionGuard, writePipeline });
      this.navigation = new Navigation.NavigationRegistry({ routes: manifest.routes, navigate, back });
      this.search = new Search.EntitySearchEngine();
      this.cache = Cache ? new Cache.AssistantCacheManager({ storage, prefix: `assistant:${manifest.appId}:cache` }) : null;
      this.attachmentStore = attachmentStore;
    }
    newConversation() { this.memory = new Memory.ConversationMemory(); this.store.storage?.setItem(this.activeKey, this.memory.conversationId); return this.store.save(this.memory).snapshot(); }
    save() { this.store.storage?.setItem(this.activeKey, this.memory.conversationId); return this.store.save(this.memory).snapshot(); }
    deleteConversation(id = this.memory.conversationId) { const attachments = (this.memory.recentMessages || []).flatMap((message) => message.attachments || []).map((item) => item.id).filter(Boolean); this.store.delete(id); this.cache?.deleteConversation(id, attachments); this.attachmentStore?.deleteMany?.(attachments).catch?.(() => {}); if (id === this.memory.conversationId) this.newConversation(); return this.memory.snapshot(); }
    buildRequest(text, attachments = []) {
      this.memory.addMessage("user", text, { attachments }); this.save();
      return { session: this.memory.snapshot(), context: this.context.snapshot(), manifest: this.context.selectManifest(text), text: String(text || ""), attachments, tools: [...this.tools.items.keys()] };
    }
  }
  const api = Object.freeze({ AssistantCore });
  global.UniversalAssistantCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
