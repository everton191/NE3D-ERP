(function attachReportsFormatters(global) {
  "use strict";

  function formatDelta(value = 0) {
    const number = Number(value) || 0;
    const arrow = number < 0 ? "↓" : "↑";
    return `${arrow} ${Math.abs(number).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  function formatShortPeriod(date = new Date()) {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  function calculatePercentageDelta(current = 0, previous = 0) {
    const currentValue = Number(current) || 0;
    const previousValue = Number(previous) || 0;
    if (!previousValue) return currentValue > 0 ? 100 : 0;
    return Number((((currentValue - previousValue) / Math.abs(previousValue)) * 100).toFixed(1));
  }

  const api = Object.freeze({ formatDelta, formatShortPeriod, calculatePercentageDelta });
  global.SimplificaReportsFormatters = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
