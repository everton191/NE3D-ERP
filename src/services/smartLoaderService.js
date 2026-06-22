(function initSmartLoader(globalScope) {
  "use strict";

  const operations = new Map();
  const screenLoading = new Set();
  const thresholds = [
    { ms: 2000, level: "warning", message: "Operação acima de 2 segundos" },
    { ms: 5000, level: "high", message: "Possível gargalo de desempenho" },
    { ms: 10000, level: "error", message: "Operação acima de 10 segundos" }
  ];
  const skeletonPresets = Object.freeze({
    dashboard: { cards: 4, rows: 3 },
    pedidos: { cards: 2, rows: 5 },
    clientes: { cards: 1, rows: 6 },
    estoque: { cards: 2, rows: 5 },
    relatorios: { cards: 4, rows: 3 },
    loja: { cards: 3, rows: 4 },
    produtos: { cards: 6, rows: 0 }
  });

  let operationSequence = 0;

  function now() {
    return globalScope.performance?.now?.() || Date.now();
  }

  function getDocument() {
    return globalScope.document || null;
  }

  function resolveButton(buttonOrId) {
    const documentRef = getDocument();
    if (!documentRef || !buttonOrId) return null;
    return typeof buttonOrId === "string" ? documentRef.getElementById(buttonOrId) : buttonOrId;
  }

  function getLayer() {
    const documentRef = getDocument();
    if (!documentRef) return null;
    let layer = documentRef.getElementById("smart-loader-layer");
    if (!layer && documentRef.body) {
      layer = documentRef.createElement("div");
      layer.id = "smart-loader-layer";
      layer.className = "smart-loader-layer";
      layer.setAttribute("aria-live", "polite");
      layer.setAttribute("aria-atomic", "true");
      documentRef.body.appendChild(layer);
    }
    return layer;
  }

  function sanitizeText(value, fallback = "") {
    return String(value ?? fallback).replace(/[<>]/g, "").slice(0, 180);
  }

  function normalizeProgress(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  function formatDuration(ms) {
    const seconds = Math.max(0, Number(ms || 0) / 1000);
    if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min ${Math.round(seconds % 60)}s`;
  }

  function formatBytesPerSecond(value) {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB/s`;
    return `${Math.round(bytes)} B/s`;
  }

  function setButtonState(buttonOrId, state = "idle", text = "") {
    const button = resolveButton(buttonOrId);
    if (!button) return null;
    if (!button.dataset.smartLoaderOriginalHtml) {
      button.dataset.smartLoaderOriginalHtml = button.innerHTML;
    }
    button.classList.remove("is-processing", "is-success", "is-error");
    button.removeAttribute("aria-busy");

    if (state === "loading") {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.classList.add("is-processing");
      button.innerHTML = `<span class="smart-loader-button-spinner" aria-hidden="true"></span><span>${sanitizeText(text || "Processando...")}</span>`;
    } else if (state === "success") {
      button.disabled = true;
      button.classList.add("is-success");
      button.innerHTML = `<span aria-hidden="true">✓</span><span>${sanitizeText(text || "Concluído")}</span>`;
    } else if (state === "error") {
      button.disabled = false;
      button.classList.add("is-error");
      button.innerHTML = `<span aria-hidden="true">!</span><span>${sanitizeText(text || "Tentar novamente")}</span>`;
    } else {
      button.innerHTML = button.dataset.smartLoaderOriginalHtml || button.innerHTML;
      button.disabled = false;
      delete button.dataset.smartLoaderOriginalHtml;
    }
    return button;
  }

  function dispatchPerformance(operation, threshold) {
    const detail = {
      id: operation.id,
      name: operation.name,
      context: operation.context,
      elapsedMs: Math.round(now() - operation.startedAt),
      thresholdMs: threshold.ms,
      level: threshold.level,
      message: threshold.message
    };
    if (typeof globalScope.CustomEvent === "function" && typeof globalScope.dispatchEvent === "function") {
      globalScope.dispatchEvent(new globalScope.CustomEvent("smartloader:performance", { detail }));
    }
    if (globalScope.APP_DEBUG_MODE === true) {
      console.warn("[SmartLoader]", threshold.message, detail);
    }
  }

  function renderTimeline(operation) {
    if (!operation.steps.length) return "";
    return `
      <ol class="smart-loader-timeline">
        ${operation.steps.map((step, index) => {
          const state = index < operation.stepIndex ? "done" : index === operation.stepIndex ? "active" : "pending";
          return `<li class="${state}"><span aria-hidden="true">${state === "done" ? "✓" : state === "active" ? "•" : ""}</span>${sanitizeText(step)}</li>`;
        }).join("")}
      </ol>
    `;
  }

  function renderUpload(operation) {
    const upload = operation.upload;
    if (!upload) return "";
    const speed = formatBytesPerSecond(upload.speed);
    const eta = Number.isFinite(upload.etaMs) && upload.etaMs >= 0 ? formatDuration(upload.etaMs) : "";
    return `
      <div class="smart-loader-upload-meta">
        <strong>${sanitizeText(upload.label || `Enviando arquivo ${upload.current || 1} de ${upload.total || 1}`)}</strong>
        <span>${[speed, eta ? `restante ${eta}` : ""].filter(Boolean).join(" • ")}</span>
      </div>
    `;
  }

  function renderOperation(operation) {
    if (!operation.visible || operation.finished) return;
    const layer = getLayer();
    if (!layer) return;
    let node = layer.querySelector(`[data-smart-operation="${operation.id}"]`);
    if (!node) {
      node = getDocument().createElement("section");
      node.className = "smart-loader-panel";
      node.dataset.smartOperation = operation.id;
      node.setAttribute("role", "status");
      layer.appendChild(node);
    }
    const progress = normalizeProgress(operation.progress);
    node.innerHTML = `
      <div class="smart-loader-panel-head">
        <span class="smart-loader-spinner" aria-hidden="true"></span>
        <div>
          <strong>${sanitizeText(operation.title || "Processando")}</strong>
          <p>${sanitizeText(operation.message || "Aguarde enquanto concluímos esta etapa.")}</p>
        </div>
      </div>
      ${progress === null ? "" : `
        <div class="smart-loader-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <span style="width:${progress}%"></span>
        </div>
        <small class="smart-loader-progress-label">${progress}%</small>
      `}
      ${renderUpload(operation)}
      ${renderTimeline(operation)}
    `;
  }

  function scheduleTimers(operation) {
    operation.visibilityTimer = globalScope.setTimeout?.(() => {
      if (operation.finished) return;
      operation.visible = true;
      renderOperation(operation);
    }, 1000);
    operation.thresholdTimers = thresholds.map((threshold) => globalScope.setTimeout?.(() => {
      if (!operation.finished) dispatchPerformance(operation, threshold);
    }, threshold.ms));
  }

  function start(options = {}) {
    const id = `smart-operation-${Date.now().toString(36)}-${++operationSequence}`;
    const steps = Array.isArray(options.steps) ? options.steps.filter(Boolean).map(String) : [];
    const operation = {
      id,
      name: sanitizeText(options.name || options.title || "operation", "operation"),
      title: sanitizeText(options.title || "Processando"),
      message: sanitizeText(options.message || options.loadingText || "Processando..."),
      context: sanitizeText(options.context || ""),
      button: resolveButton(options.button),
      buttonLoadingText: sanitizeText(options.buttonLoadingText || options.loadingText || "Processando..."),
      buttonSuccessText: sanitizeText(options.buttonSuccessText || "Concluído"),
      buttonErrorText: sanitizeText(options.buttonErrorText || "Tentar novamente"),
      steps,
      stepIndex: Math.max(0, Math.min(steps.length - 1, Number(options.stepIndex || 0))),
      progress: normalizeProgress(options.progress),
      upload: null,
      startedAt: now(),
      visible: false,
      finished: false,
      thresholdTimers: [],
      visibilityTimer: null
    };
    operations.set(id, operation);
    if (operation.button) setButtonState(operation.button, "loading", operation.buttonLoadingText);
    scheduleTimers(operation);
    return id;
  }

  function update(id, patch = {}) {
    const operation = operations.get(id);
    if (!operation || operation.finished) return false;
    if (patch.title !== undefined) operation.title = sanitizeText(patch.title);
    if (patch.message !== undefined) operation.message = sanitizeText(patch.message);
    if (patch.progress !== undefined) operation.progress = normalizeProgress(patch.progress);
    if (patch.stepIndex !== undefined) {
      operation.stepIndex = Math.max(0, Math.min(operation.steps.length - 1, Number(patch.stepIndex || 0)));
    }
    if (patch.step) {
      const index = operation.steps.indexOf(String(patch.step));
      if (index >= 0) operation.stepIndex = index;
    }
    if (patch.upload) operation.upload = { ...(operation.upload || {}), ...patch.upload };
    renderOperation(operation);
    return true;
  }

  function updateUpload(id, upload = {}) {
    const operation = operations.get(id);
    if (!operation || operation.finished) return false;
    const loaded = Math.max(0, Number(upload.loaded || 0));
    const totalBytes = Math.max(0, Number(upload.totalBytes || upload.bytesTotal || 0));
    const elapsedMs = Math.max(1, now() - operation.startedAt);
    const speed = Number(upload.speed) || (loaded ? loaded / (elapsedMs / 1000) : 0);
    const remaining = Math.max(0, totalBytes - loaded);
    const etaMs = speed > 0 ? (remaining / speed) * 1000 : null;
    const progress = upload.progress !== undefined
      ? normalizeProgress(upload.progress)
      : totalBytes > 0
        ? normalizeProgress((loaded / totalBytes) * 100)
        : null;
    return update(id, {
      progress,
      message: upload.message || operation.message,
      upload: {
        current: Number(upload.current || 1),
        total: Number(upload.total || 1),
        label: upload.label || "",
        loaded,
        totalBytes,
        speed,
        etaMs
      }
    });
  }

  function clearTimers(operation) {
    if (operation.visibilityTimer) globalScope.clearTimeout?.(operation.visibilityTimer);
    operation.thresholdTimers.forEach((timer) => globalScope.clearTimeout?.(timer));
  }

  function removePanel(operation) {
    const layer = getLayer();
    const node = layer?.querySelector(`[data-smart-operation="${operation.id}"]`);
    node?.remove();
  }

  function finish(id, state = "success", options = {}) {
    const operation = operations.get(id);
    if (!operation || operation.finished) return false;
    operation.finished = true;
    clearTimers(operation);
    removePanel(operation);
    if (operation.button) {
      const text = state === "success"
        ? options.message || operation.buttonSuccessText
        : options.message || operation.buttonErrorText;
      setButtonState(operation.button, state, text);
      globalScope.setTimeout?.(() => setButtonState(operation.button, "idle"), state === "success" ? 900 : 1600);
    }
    operations.delete(id);
    return true;
  }

  function success(id, message = "") {
    return finish(id, "success", { message });
  }

  function error(id, errorValue, message = "") {
    const operation = operations.get(id);
    if (operation && !operation.finished) {
      operation.error = sanitizeText(errorValue?.message || errorValue || "");
    }
    return finish(id, "error", { message });
  }

  async function track(options, task) {
    const id = start(options);
    try {
      const result = await task({
        id,
        update: (patch) => update(id, patch),
        updateUpload: (payload) => updateUpload(id, payload)
      });
      success(id, options.successText || "");
      return result;
    } catch (caughtError) {
      error(id, caughtError, options.errorText || "");
      throw caughtError;
    }
  }

  function setScreenLoading(screen, loading = true) {
    const key = String(screen || "").trim().toLowerCase();
    if (!key) return;
    if (loading) screenLoading.add(key);
    else screenLoading.delete(key);
  }

  function isScreenLoading(screen) {
    return screenLoading.has(String(screen || "").trim().toLowerCase());
  }

  function skeleton(screen = "dashboard", options = {}) {
    const key = String(screen || "dashboard").toLowerCase();
    const preset = skeletonPresets[key] || skeletonPresets.dashboard;
    const cards = Math.max(0, Number(options.cards ?? preset.cards));
    const rows = Math.max(0, Number(options.rows ?? preset.rows));
    return `
      <section class="smart-skeleton-screen" data-smart-skeleton="${sanitizeText(key)}" aria-label="Carregando conteúdo" aria-busy="true">
        <div class="smart-skeleton-header">
          <span class="smart-skeleton-line wide"></span>
          <span class="smart-skeleton-line medium"></span>
        </div>
        <div class="smart-skeleton-grid">
          ${Array.from({ length: cards }, () => `
            <article class="smart-skeleton-card">
              <span class="smart-skeleton-block"></span>
              <span class="smart-skeleton-line wide"></span>
              <span class="smart-skeleton-line short"></span>
            </article>
          `).join("")}
        </div>
        ${rows ? `
          <div class="smart-skeleton-table">
            ${Array.from({ length: rows }, () => `
              <div class="smart-skeleton-row">
                <span class="smart-skeleton-line medium"></span>
                <span class="smart-skeleton-line short"></span>
                <span class="smart-skeleton-line short"></span>
              </div>
            `).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }

  const api = Object.freeze({
    version: "smart-loader-1",
    start,
    update,
    updateUpload,
    success,
    error,
    finish,
    track,
    setButtonState,
    setScreenLoading,
    isScreenLoading,
    skeleton,
    skeletonPresets,
    getActiveOperations: () => Array.from(operations.values()).map((operation) => ({
      id: operation.id,
      name: operation.name,
      context: operation.context,
      elapsedMs: Math.round(now() - operation.startedAt),
      visible: operation.visible
    }))
  });

  globalScope.SmartLoader = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
