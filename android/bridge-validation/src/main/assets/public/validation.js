"use strict";
// Test fixture plumbing only: all actual file and PDF delivery logic is canonical.
window.validation = (() => {
  const events = [];
  const plugin = () => window.Capacitor?.Plugins?.SimplificaFiles;
  const requiredName = (name) => {
    if (!/^simplifica-bridge-validation-[0-9a-f-]+\.(pdf|json)$/.test(name)) throw new Error("Not a synthetic UUID fixture");
    return name;
  };
  const bytesFor = (base64) => Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const documentFor = (base64) => {
    const bytes = bytesFor(base64);
    return { output: (type) => type === "arraybuffer" ? bytes.buffer : new Blob([bytes], { type: "application/pdf" }) };
  };
  const canonicalContext = () => createCanonicalPdfDepsForValidation({
    alertRef: (text) => events.push({ kind: "alert", text }),
    logHistory: (...args) => events.push({ kind: "history", args }),
    logDiagnostic: (...args) => events.push({ kind: "diagnostic", args })
  });
  async function saveCanonicalPdf(name, base64) {
    requiredName(name);
    const actual = plugin();
    let nativeResult = null;
    // Transparent observation of the real bridge response; not a simulated plugin.
    const tracked = {
      requestStoragePermission: (...args) => actual.requestStoragePermission(...args),
      savePdf: async (...args) => { nativeResult = await actual.savePdf(...args); return nativeResult; }
    };
    const context = canonicalContext();
    context.windowRef = { Capacitor: { Plugins: { SimplificaFiles: tracked } } };
    const ok = await SimplificaPdfDocumentDelivery.savePdfAndroidNative(documentFor(base64), name, context);
    return { ok, nativeResult, events: events.slice() };
  }
  async function saveJson(name, base64) {
    return plugin().saveFile({ fileName: requiredName(name), mimeType: "application/json", base64 });
  }
  async function rejectInvalid(name, base64, method) {
    requiredName(name);
    if (!["savePdf", "saveFile"].includes(method)) throw new Error("Unsupported fixture method");
    try {
      await plugin()[method]({ fileName: name, mimeType: "application/json", base64 });
      return { rejected: false };
    } catch (error) { return { rejected: true, message: String(error.message || error) }; }
  }
  async function printCanonical(name, base64) {
    requiredName(name);
    const context = canonicalContext();
    const ok = await SimplificaPdfDocumentDelivery.printPdfAndroidNative(documentFor(base64), name, name, context);
    return { ok, events: events.slice() };
  }
  function capabilities() {
    return {
      ready: Boolean(plugin()?.savePdf && window.SimplificaPdfDocumentDelivery && window.SimplificaCashRenderer
        && typeof window.createCanonicalPdfDepsForValidation === "function"),
      url: location.href,
      share: typeof navigator.share,
      clipboardWrite: typeof navigator.clipboard?.writeText,
      imageCount: document.getElementById("fixtureImage").files.length
    };
  }
  document.getElementById("status").textContent = "Fixture local preparada";
  return Object.freeze({ saveCanonicalPdf, saveJson, rejectInvalid, printCanonical, capabilities,
    storage: () => plugin().requestStoragePermission() });
})();
