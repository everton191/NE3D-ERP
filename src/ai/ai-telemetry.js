(function attachSimplificaAiTelemetry(global) {
  "use strict";
  const STORAGE_KEY = "simplifica3d:ai-telemetry:v1";
  const MAX_LOCAL_EVENTS = 500;
  const now = () => new Date().toISOString();
  function load() {
    try { const value = JSON.parse(global.localStorage?.getItem(STORAGE_KEY) || "[]"); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  }
  function record(event = {}) {
    const safe = Object.freeze({
      timestamp: now(), platform: String(event.platform || global.Capacitor?.getPlatform?.() || "web"),
      intent: String(event.intent || "unknown"), route_type: event.route_type === "deterministic" ? "deterministic" : "functiongemma",
      function_id: String(event.function_id || ""), latency_ms: Math.max(0, Math.round(Number(event.latency_ms) || 0)),
      success: event.success === true, fallback: event.fallback === true, error_type: String(event.error_type || "")
    });
    if (global.__simplificaAiBenchmark === true) return safe;
    try { global.localStorage?.setItem(STORAGE_KEY, JSON.stringify([...load(), safe].slice(-MAX_LOCAL_EVENTS))); } catch (_) {}
    Promise.resolve(global.SimplificaAiTelemetryBackend?.record?.(safe)).catch(() => {});
    return safe;
  }
  function percentile(values, ratio) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
  }
  function summary(events = load()) {
    const total = events.length;
    const deterministic = events.filter((item) => item.route_type === "deterministic").length;
    const successes = events.filter((item) => item.success).length;
    const fallbacks = events.filter((item) => item.fallback).length;
    const latencies = events.map((item) => Number(item.latency_ms) || 0);
    return Object.freeze({ total, deterministic, functiongemma: total - deterministic, successRate: total ? successes / total : 0, fallbackRate: total ? fallbacks / total : 0, p50: percentile(latencies, .5), p95: percentile(latencies, .95) });
  }
  const api = Object.freeze({ record, load, summary, STORAGE_KEY });
  global.SimplificaAiTelemetry = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
