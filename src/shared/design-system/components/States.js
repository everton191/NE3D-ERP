import { escapeHtml } from "./html.js";

export function EmptyState({ title = "Nada por aqui", description = "", action = "" } = {}) {
  return `<div class="ds-empty-state app-empty-state" data-ui-component="EmptyState"><strong>${escapeHtml(title)}</strong>${description ? `<span>${escapeHtml(description)}</span>` : ""}${action || ""}</div>`;
}

export function LoadingState({ label = "Carregando..." } = {}) {
  return `<div class="ds-loading-state app-loading-state" data-ui-component="LoadingState"><span class="sync-spinner" aria-hidden="true"></span><strong>${escapeHtml(label)}</strong></div>`;
}

export function ErrorState({ title = "Não foi possível carregar", description = "", action = "" } = {}) {
  return `<div class="ds-error-state app-error-state" data-ui-component="ErrorState"><strong>${escapeHtml(title)}</strong>${description ? `<span>${escapeHtml(description)}</span>` : ""}${action || ""}</div>`;
}
