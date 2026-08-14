(function attachAssistantUiComponents(global) {
  "use strict";

  const COMPONENTS = Object.freeze([
    "AssistantLauncher",
    "AssistantPanel",
    "AssistantComposer",
    "AssistantContextChip",
    "AssistantResultCard",
    "AssistantConfirmation",
    "AssistantAttachment"
  ]);

  function defaultEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  function safeHandler(value, fallback = "") {
    const handler = String(value || "").trim();
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(handler) ? handler : fallback;
  }
  function safeState(value, fallback = "idle") {
    const state = String(value || fallback).toLowerCase();
    return /^[a-z0-9_-]+$/.test(state) ? state : fallback;
  }

  class AssistantUiComponents {
    constructor({ appId = "assistant", appName = "Aplicativo", assistantName = "Assistente", brand = {}, escapeHtml = defaultEscape, escapeAttr = defaultEscape } = {}) {
      this.appId = safeState(appId, "assistant");
      this.appName = String(appName || "Aplicativo");
      this.assistantName = String(assistantName || "Assistente");
      this.brand = Object.freeze({ primary: String(brand.primary || ""), icon: String(brand.icon || "") });
      this.escapeHtml = escapeHtml;
      this.escapeAttr = escapeAttr;
    }
    launcher({ state = "idle", description = "Abrir assistente", iconHtml = "", onActivate = "", onDrag = "" } = {}) {
      const activate = safeHandler(onActivate);
      const drag = safeHandler(onDrag);
      return `<button class="ai-assistant-status ai-assistant-status-${safeState(state)}" type="button"${activate ? ` onclick="${activate}(event)"` : ""}${drag ? ` onpointerdown="${drag}(event)"` : ""} title="${this.escapeAttr(description)}" aria-label="${this.escapeAttr(description)}" data-assistant-component="AssistantLauncher" data-assistant-app="${this.escapeAttr(this.appId)}"><span class="ai-assistant-status-icon" aria-hidden="true">${iconHtml}</span><span class="ai-assistant-status-dot" aria-hidden="true"></span></button>`;
    }
    panel({ state = "idle", headerHtml = "", contextActionsHtml = "", bodyHtml = "", footerHtml = "" } = {}) {
      return `<section class="ai-chat-dialog${contextActionsHtml ? " has-context-actions" : ""}" data-assistant-state="${safeState(state)}" data-assistant-component="AssistantPanel" data-assistant-app="${this.escapeAttr(this.appId)}">${headerHtml}${contextActionsHtml}${bodyHtml}${footerHtml}</section>`;
    }
    composer({ inputId = "assistantInput", placeholder = "Escreva sua mensagem...", disabled = false, busy = false, onSubmit = "", leadingHtml = "", trailingHtml = "" } = {}) {
      const submit = safeHandler(onSubmit);
      return `<form class="ai-chat-form"${submit ? ` onsubmit="${submit}(event)"` : ""} data-assistant-component="AssistantComposer">${leadingHtml}<input id="${this.escapeAttr(inputId)}" autocomplete="off" placeholder="${this.escapeAttr(placeholder)}" aria-label="Mensagem para ${this.escapeAttr(this.assistantName)}"${disabled ? " disabled" : ""}>${trailingHtml}<button class="btn ai-chat-send" type="submit"${disabled ? " disabled" : ""}>${busy ? "Aguarde" : "Enviar"}</button></form>`;
    }
    contextChip(context = {}, { onRemove = "" } = {}) {
      const type = String(context.type || "").slice(0, 60);
      const id = String(context.id || "").slice(0, 100);
      if (!type || !id) return "";
      const remove = safeHandler(onRemove);
      const label = String(context.label || `${type} #${id}`);
      return `<button class="ai-context-chip" type="button"${remove ? ` onclick="${remove}('${this.escapeAttr(type)}','${this.escapeAttr(id)}')"` : ""} data-assistant-component="AssistantContextChip">${this.escapeHtml(label)} ×</button>`;
    }
    contextActionButtons(actions = [], { disabled = false, onAction = "" } = {}) {
      const handler = safeHandler(onAction);
      return (Array.isArray(actions) ? actions : []).filter((action) => action?.id && action?.label).map((action) => `<button type="button"${handler ? ` onclick="${handler}('${this.escapeAttr(action.id)}')"` : ""}${disabled ? " disabled" : ""}>${this.escapeHtml(action.label)}</button>`).join("");
    }
    resultCard(card = {}, { messageId = "", onOpen = "" } = {}) {
      const kind = safeState(card.kind, "result");
      const title = String(card.title || "Resultado");
      const status = String(card.status || "");
      const subtitle = String(card.subtitle || "");
      const lines = (Array.isArray(card.lines) ? card.lines : []).filter(Boolean).slice(0, 8).map((line) => `<li>${this.escapeHtml(line)}</li>`).join("");
      const handler = safeHandler(onOpen);
      const action = card.action?.routeId && handler
        ? `<button class="btn secondary ai-result-card-action" type="button" data-message-id="${this.escapeAttr(messageId)}" onclick="${handler}(this.dataset.messageId)">${this.escapeHtml(card.action.label || "Abrir")}</button>`
        : "";
      return `<section class="ai-result-card ai-result-card-${kind}" data-assistant-component="AssistantResultCard"><div class="ai-result-card-head"><strong>${this.escapeHtml(title)}</strong>${status ? `<span>${this.escapeHtml(status)}</span>` : ""}</div>${subtitle ? `<p>${this.escapeHtml(subtitle)}</p>` : ""}${lines ? `<ul>${lines}</ul>` : ""}${action}</section>`;
    }
    confirmation({ title = "Somente você pode autorizar", message = "Confira antes de continuar.", confirmLabel = "Confirmar", cancelLabel = "Alterar", onConfirm = "", onCancel = "", disabled = false } = {}) {
      const confirm = safeHandler(onConfirm);
      const cancel = safeHandler(onCancel);
      return `<div class="ai-chat-confirmation" data-assistant-component="AssistantConfirmation"><strong>${this.escapeHtml(title)}</strong><p>${this.escapeHtml(message)}</p><div><button class="btn" type="button"${confirm ? ` onclick="${confirm}()"` : ""}${disabled ? " disabled" : ""}>${this.escapeHtml(confirmLabel)}</button><button class="btn secondary" type="button"${cancel ? ` onclick="${cancel}()"` : ""}${disabled ? " disabled" : ""}>${this.escapeHtml(cancelLabel)}</button></div></div>`;
    }
    attachment({ previewUrl = "", label = "Imagem pronta", details = "", onRemove = "" } = {}) {
      const remove = safeHandler(onRemove);
      return `<div class="ai-chat-attachment-preview" data-assistant-component="AssistantAttachment">${previewUrl ? `<img src="${this.escapeAttr(previewUrl)}" alt="Prévia da imagem escolhida">` : ""}<span><strong>${this.escapeHtml(label)}</strong>${details ? `<small>${this.escapeHtml(details)}</small>` : ""}</span>${remove ? `<button type="button" onclick="${remove}()" aria-label="Remover imagem">✕</button>` : ""}</div>`;
    }
  }

  const api = Object.freeze({ COMPONENTS, AssistantUiComponents, defaultEscape, safeHandler, safeState });
  global.UniversalAssistantUi = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
