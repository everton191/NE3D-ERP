(function attachNavigationTargetResolver(global) {
  "use strict";
  const screenModule = global.SimplificaScreenRegistry || (typeof require === "function" ? require("../navigation/screen-registry.js") : null);
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const NAVIGATION_COMMAND = /\b(?:abre|abrir|quero\s+abrir|vai\s+para|ir\s+para|navega(?:r)?\s+(?:para|pra)|mostra(?:r)?\s+(?:a\s+)?tela\s+de)\b/;
  function destinations() {
    return (screenModule?.registry?.list?.() || []).flatMap((screen) => {
      const aliases = [...(screen.aliases || [])];
      return [screen.id, ...aliases, screen.title].map((label) => ({ label: normalize(label), value: aliases.map(normalize).includes(normalize(label)) ? normalize(label) : screen.id }));
    }).filter((item, index, all) => item.label && all.findIndex((candidate) => candidate.label === item.label) === index).sort((a, b) => b.label.length - a.label.length);
  }
  function resolveNavigationTarget(rawInput = "") {
    const input = normalize(rawInput).replace(/\bpra\b/g, "para");
    if (!NAVIGATION_COMMAND.test(input)) return null;
    const match = destinations().find((item) => new RegExp(`(?:^|\\s)${item.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(input));
    return match ? Object.freeze({ target: match.value, matched: match.label, canonical: screenModule.registry.resolve(match.value)?.id || match.value }) : null;
  }
  const api = Object.freeze({ resolveNavigationTarget, destinations });
  global.SimplificaNavigationTargetResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
