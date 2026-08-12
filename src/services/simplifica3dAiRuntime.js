(function attachSimplifica3dAiRuntime(global) {
  "use strict";
  async function interpret(text, context) {
    const plugin = global.Capacitor?.Plugins?.SimplificaLocalAi;
    if (!plugin?.interpret) throw new Error("Motor local compartilhado ainda não está disponível neste aparelho.");
    const result = await plugin.interpret({ text: String(text || ""), context: JSON.stringify(context || {}) });
    const raw = String(result?.text || "").trim();
    const json = raw.match(/\{[\s\S]*\}/)?.[0];
    const action = json ? (() => {
      try { return JSON.parse(json); } catch (_) { return { type: "chat", payload: { answer: raw } }; }
    })() : { type: "chat", payload: { answer: raw } };
    return global.Simplifica3dAiActions.preview(action);
  }
  async function execute(preview, confirmed) {
    if (preview?.requiresConfirmation && confirmed !== true) throw new Error("Confirmação obrigatória antes de alterar dados.");
    return global.Simplifica3dErpBridge.execute(preview);
  }
  global.Simplifica3dAiRuntime = Object.freeze({ interpret, execute });
})(window);
