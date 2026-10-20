"use strict";

// Additional correction contracts in the disposable WebView, using only
// synthetic files. All image processing and selection checks remain canonical.
window.runAndroidImageCorrectionsValidation = async function runAndroidImageCorrectionsValidation() {
  const api = window.SimplificaConfigAppearance;
  const presets = window.ANDROID_IMAGE_PERSONALIZATION_PRESETS;
  const started = performance.now();
  const failures = [];
  const results = [];
  const prefix = "simplifica-image-corrections-";
  let total = 0;
  let assertions = 0;
  let serial = 0;

  function check(condition, message) {
    assertions++;
    if (!condition) throw new Error(message);
  }

  function equal(actual, expected, message) {
    check(Object.is(actual, expected), message);
  }

  function bounded(promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Synthetic image correction operation timed out")), 1800);
      Promise.resolve(promise).then((value) => {
        clearTimeout(timer);
        resolve(value);
      }, (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  function barrier() {
    let release;
    const promise = new Promise((resolve) => { release = resolve; });
    return { promise, release };
  }

  function escapeAttribute(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function canvas(width, height) {
    const value = document.createElement("canvas");
    value.width = width;
    value.height = height;
    const drawing = value.getContext("2d");
    check(Boolean(drawing), "Synthetic canvas must expose a real 2D drawing context");
    return { value, drawing };
  }

  async function blob(value, mime) {
    const result = await bounded(new Promise((resolve) => value.toBlob(resolve, mime)));
    check(result instanceof Blob && result.type === mime, "Synthetic input must be encoded using the requested real MIME");
    return result;
  }

  async function decode(source) {
    return bounded(new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Synthetic encoded output could not be decoded"));
      image.src = source;
    }));
  }

  async function solidPng(color) {
    const source = canvas(64, 64);
    source.drawing.fillStyle = color;
    source.drawing.fillRect(0, 0, 64, 64);
    return blob(source.value, "image/png");
  }

  function fixture() {
    const id = `${prefix}${++serial}`;
    for (const fixed of ["personalizationImageHint", "brandLogoPreview"]) {
      check(!document.getElementById(fixed), "Canonical preview IDs must not belong to another screen");
    }
    check(!document.getElementById(id), "Owned correction fixture ID must be unused");
    const container = document.createElement("section");
    container.id = `${id}-container`;
    container.hidden = true;
    const input = document.createElement("input");
    input.id = id;
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    const hint = document.createElement("output");
    hint.id = "personalizationImageHint";
    hint.hidden = true;
    const preview = document.createElement("img");
    preview.id = "brandLogoPreview";
    container.append(input, hint, preview);
    document.body.appendChild(container);
    const pending = [];
    const gates = [];
    const toasts = [];
    let allowed = true;
    const context = {
      document, window, Image,
      IMAGE_PERSONALIZATION_PRESETS: presets,
      escaparAttr: escapeAttribute,
      mostrarToast: (...args) => toasts.push(args),
      temAcessoCompleto: () => allowed
    };
    // The canonical loader owns and revokes each Blob URL on load or error.
    const load = (file) => bounded(api.carregarImagemArquivo(file, context));
    context.carregarImagemArquivo = load;
    context.canvasSuportaMime = (mime) => api.canvasSuportaMime(mime, context);
    context.gerarDataUrlOtimizado = (source, mime, quality, maxBytes) => api.gerarDataUrlOtimizado(source, mime, quality, maxBytes, context);
    context.tamanhoDataUrlBytes = (source) => api.tamanhoDataUrlBytes(source, context);

    function observe(promise) {
      // Attach both handlers immediately: an obsolete save may reject before
      // the test releases/awaits its result, and must never become unhandled.
      const observed = Promise.resolve(promise).then(
        (value) => ({ resolved: true, value }),
        (error) => ({ resolved: false, error })
      );
      pending.push(observed);
      return observed;
    }

    function select(file, target = input) {
      const transfer = new DataTransfer();
      if (file) transfer.items.add(file);
      target.files = transfer.files;
      equal(target.files.length, file ? 1 : 0, "Real file input must contain only the requested synthetic file");
      if (file) equal(target.files[0], file, "Programmatic selection must preserve its real File identity");
    }

    return {
      input, hint, preview, context, toasts, select,
      file: (source, name = "synthetic.png") => new File([source], name, { type: source.type, lastModified: 123 }),
      invalid: () => new File([new Uint8Array([0, 1, 2, 3])], "invalid-synthetic.png", { type: "image/png", lastModified: 123 }),
      cache: () => window.__personalizationImageCache?.[id],
      access: (value) => { allowed = value; },
      read: () => observe(api.lerImagemConfiguracao(id, "original-synthetic-value", "brand-logo", context)),
      showPreview: () => observe(api.prepararPreviewImagemPersonalizacao(input, "brand-logo", context)),
      replaceInput() {
        const replacement = document.createElement("input");
        replacement.id = id;
        replacement.type = "file";
        replacement.accept = input.accept;
        input.replaceWith(replacement);
        return replacement;
      },
      delay(file) {
        const gate = barrier();
        const loaded = barrier();
        gates.push(gate);
        context.carregarImagemArquivo = async (value) => {
          if (value !== file) return load(value);
          let image;
          let failure;
          try { image = await load(value); } catch (error) { failure = error; }
          // Only delivery is controlled. Decode/rejection and Blob URL cleanup
          // above already occurred through the real canonical Image loader.
          loaded.release({ decoded: !failure, failureMessage: failure ? String(failure.message || failure) : "" });
          await gate.promise;
          if (failure) throw failure;
          return image;
        };
        return { decoded: loaded.promise, release: gate.release };
      },
      async close() {
        for (const gate of gates) gate.release();
        await Promise.allSettled(pending);
        if (window.__personalizationImageCache) delete window.__personalizationImageCache[id];
        container.remove();
        check(!document.getElementById(id), "Owned correction input must be removed");
        check(!window.__personalizationImageCache?.[id], "Owned correction cache entry must be removed");
      }
    };
  }

  function rejectedSelection(outcome) {
    equal(outcome.resolved, false, "Obsolete reader must reject instead of yielding a successful value or fallback");
    equal(outcome.error?.code, "PERSONALIZATION_IMAGE_SELECTION_CHANGED", "Obsolete reader must expose the canonical abort code");
  }

  function noObsoleteResult(f) {
    equal(f.cache(), undefined, "Obsolete selection must not populate its cache");
    equal(f.toasts.length, 0, "Obsolete selection must not emit success or failure toasts");
    equal(f.preview.getAttribute("src"), null, "Obsolete selection must not change preview pixels");
    equal(f.hint.hidden, true, "Obsolete selection must not display a success hint");
  }

  async function test(name, run) {
    total++;
    let f;
    let failure;
    let details;
    try {
      check(performance.now() - started < 8500, "Synthetic correction suite exceeded its bounded budget");
      f = fixture();
      details = await run(f);
    } catch (error) { failure = error; }
    finally {
      if (f) {
        try { await f.close(); } catch (error) { failure = failure || error; }
      }
    }
    if (failure) failures.push({ name, error: String(failure.message || failure) });
    results.push({ name, passed: !failure, ...(details || {}) });
  }

  try {
    check(Boolean(api && presets), "Canonical appearance module and extracted presets must be present");
    check(typeof File === "function" && typeof DataTransfer === "function", "Real File and DataTransfer support must be available");
    const red = await solidPng("rgb(240,16,16)");
    const green = await solidPng("rgb(16,180,32)");

    await test("real-JPEG-reduction-synchronizes-encoded-dimensions", async () => {
      const source = canvas(512, 512);
      const noise = source.drawing.createImageData(512, 512);
      let seed = 12345;
      for (let index = 0; index < noise.data.length; index += 4) {
        for (let channel = 0; channel < 3; channel++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
          noise.data[index + channel] = seed >>> 24;
        }
        noise.data[index + 3] = 255;
      }
      source.drawing.putImageData(noise, 0, 0);
      const encoded = api.gerarDataUrlOtimizado(source.value, "image/jpeg", 0.82, 1024, { document });
      check(typeof encoded === "string" && encoded.startsWith("data:image/jpeg;base64,"), "Canonical generator must preserve the string JPEG API");
      const actual = await decode(encoded);
      equal(actual.naturalWidth, 325, "Last real JPEG candidate must decode to 325 pixels wide");
      equal(actual.naturalHeight, 325, "Last real JPEG candidate must decode to 325 pixels high");
      equal(source.value.width, actual.naturalWidth, "Caller canvas width must match actual encoded pixels");
      equal(source.value.height, actual.naturalHeight, "Caller canvas height must match actual encoded pixels");
      const bytes = api.tamanhoDataUrlBytes(encoded);
      check(bytes > 1024, "The soft optimization target must not reject a valid exhausted JPEG candidate");
      return { width: actual.naturalWidth, height: actual.naturalHeight, bytes };
    });

    await test("real-WebP-alpha-survives-forced-PNG-fallback", async (f) => {
      const source = canvas(64, 64);
      source.drawing.fillStyle = "rgba(0,180,20,0.5)";
      source.drawing.fillRect(16, 16, 32, 32);
      const encodedWebp = await blob(source.value, "image/webp");
      const file = f.file(encodedWebp, "synthetic-alpha.webp");
      // Force only the capability decision; WebP input, decode, PNG encoding
      // and alpha pixels are all real native WebView operations.
      f.context.canvasSuportaMime = () => false;
      const output = await api.otimizarImagemPersonalizacao(file, "brand-logo", f.context);
      equal(output.mime, "image/png", "Alpha-preserving WebP source must fall back to PNG, not JPEG");
      check(output.dataUrl.startsWith("data:image/png;base64,"), "Output bytes must actually declare PNG");
      const actual = await decode(output.dataUrl);
      equal(actual.naturalWidth, 64, "Contain preset must not upscale this synthetic image");
      equal(actual.naturalHeight, 64, "Contain preset must retain this image's height");
      equal(output.width, actual.naturalWidth, "PNG metadata width must match decoded output");
      equal(output.height, actual.naturalHeight, "PNG metadata height must match decoded output");
      source.drawing.clearRect(0, 0, 64, 64);
      source.drawing.drawImage(actual, 0, 0);
      const cornerAlpha = source.drawing.getImageData(0, 0, 1, 1).data[3];
      const centerAlpha = source.drawing.getImageData(32, 32, 1, 1).data[3];
      equal(cornerAlpha, 0, "Real PNG pixels must preserve fully transparent corners");
      check(Math.abs(centerAlpha - 128) <= 2, "Real PNG pixels must preserve partial alpha");
      return { mime: output.mime, cornerAlpha, centerAlpha };
    });

    await test("reader-A-finishes-after-B-without-overwriting-B", async (f) => {
      const a = f.file(red, "A.png");
      const gate = f.delay(a);
      f.select(a);
      const pendingA = f.read();
      equal((await gate.decoded).decoded, true, "A must have completed a real decode before being held");
      const b = f.file(green, "B.png");
      f.select(b);
      equal((await f.showPreview()).resolved, true, "B preview must finish normally");
      const saved = f.cache()?.dataUrl;
      check(Boolean(saved), "B preview must produce a real encoded cache entry");
      gate.release();
      rejectedSelection(await pendingA);
      equal(f.input.files[0], b, "Late reader A must not clear B selection");
      equal(f.cache().file, b, "Late reader A must not replace B cache identity");
      equal(f.cache().dataUrl, saved, "Late reader A must not replace B's encoded data");
      equal(f.preview.getAttribute("src"), saved, "Late reader A must not replace B preview");
      equal(f.toasts.length, 1, "Only B preview may emit its success toast");
      equal(f.toasts[0][1], "sucesso", "Obsolete reader must not emit a later failure toast");
      const readingB = await f.read();
      equal(readingB.resolved, true, "Current reader B must remain usable");
      equal(readingB.value, saved, "Current read-for-save must keep B's actual encoded output");
    });

    await test("real-reader-A-decode-failure-after-B-stays-obsolete", async (f) => {
      const a = f.invalid();
      const gate = f.delay(a);
      f.select(a);
      const pendingA = f.read();
      const failedDecode = await gate.decoded;
      equal(failedDecode.decoded, false, "A must fail real image decoding, not an injected synthetic rejection");
      equal(failedDecode.failureMessage, "Imagem inválida", "Only the canonical Image.onerror rejection counts, never a fixture timeout");
      const b = f.file(green, "B.png");
      f.select(b);
      equal((await f.showPreview()).resolved, true, "B preview must still finish normally");
      const saved = f.cache()?.dataUrl;
      check(Boolean(saved), "B must have a real encoded output before A's failure is delivered");
      gate.release();
      rejectedSelection(await pendingA);
      equal(f.input.files[0], b, "Late real decode failure must not clear the new File");
      equal(f.cache().file, b, "Late real decode failure must not replace new cache identity");
      equal(f.cache().dataUrl, saved, "Late real decode failure must not replace the new encoded output");
      equal(f.toasts.length, 1, "Late real failure must not add an obsolete error toast");
      equal(f.toasts[0][1], "sucesso", "Only current B preview success may be visible");
    });

    await test("reader-rejects-when-selection-is-cleared-without-another-preview", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pendingA = f.read();
      equal((await gate.decoded).decoded, true, "Pending reader must use a real decoded image");
      f.select(null);
      gate.release();
      rejectedSelection(await pendingA);
      equal(f.input.files.length, 0, "Late reader must not recreate a cleared selection");
      noObsoleteResult(f);
    });

    await test("reader-rejects-when-the-DOM-input-is-replaced", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pendingA = f.read();
      equal((await gate.decoded).decoded, true, "Old screen reader must complete a real decode");
      const replacement = f.replaceInput();
      gate.release();
      rejectedSelection(await pendingA);
      equal(document.getElementById(f.input.id), replacement, "DOM must contain a different real input with the same ID");
      equal(replacement.files.length, 0, "Replacement input must not inherit the old File");
      noObsoleteResult(f);
    });

    await test("reader-rejects-access-loss-during-real-decoding", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pendingA = f.read();
      equal((await gate.decoded).decoded, true, "Access-loss scenario must retain a real decoded File");
      f.access(false);
      gate.release();
      rejectedSelection(await pendingA);
      equal(f.input.files[0], a, "Reader must not mutate the selected File while rejecting lost access");
      noObsoleteResult(f);
    });

    await test("preview-rechecks-access-without-another-change-event", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pendingA = f.showPreview();
      equal((await gate.decoded).decoded, true, "Preview access-loss scenario must complete a real decode");
      f.access(false);
      gate.release();
      equal((await pendingA).resolved, true, "Obsolete preview must finish silently without an uncaught rejection");
      noObsoleteResult(f);
      check(!f.input.dataset.optimizing, "Obsolete preview must release the processing indicator");
      equal(f.input.files[0], a, "Silent preview rejection must not mutate the real selected File");
    });
  } catch (error) {
    failures.push({ name: "fixture-preconditions", error: String(error.message || error) });
  }

  return {
    passed: failures.length === 0,
    total,
    assertions,
    failures,
    results,
    elapsedMs: Math.round(performance.now() - started),
    selectionMode: "programmatic-real-File-DataTransfer",
    imageProcessingMode: "canonical-real-Image-Canvas-Blob",
    pickerMode: "not-opened",
    persistenceMode: "fixture-memory-only"
  };
};
