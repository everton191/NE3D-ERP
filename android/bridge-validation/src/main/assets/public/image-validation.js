"use strict";

// Disposable fixture: real browser files, decoding and canvases; no OS picker,
// remote persistence, ERP bootstrap or permission changes.
window.runAndroidImageValidation = async function runAndroidImageValidation() {
  const started = performance.now();
  const prefix = "simplifica-image-validation-";
  const api = window.SimplificaConfigAppearance;
  const presets = window.ANDROID_IMAGE_PERSONALIZATION_PRESETS;
  const failures = [];
  const results = [];
  let assertions = 0;
  let total = 0;
  let serial = 0;
  let decodedOutputs = 0;

  function check(value, message) {
    assertions++;
    if (!value) throw new Error(message);
  }

  function same(actual, expected, message) {
    check(Object.is(actual, expected), message);
  }

  function deadline(promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Synthetic image operation timed out")), 1800);
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

  async function png(color) {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 160;
    const drawing = canvas.getContext("2d");
    check(Boolean(drawing), "Synthetic source canvas must expose 2D drawing");
    drawing.fillStyle = color;
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    const blob = await deadline(new Promise((resolve) => canvas.toBlob(resolve, "image/png")));
    check(blob instanceof Blob && blob.type === "image/png", "Synthetic source must be a real PNG Blob");
    return blob;
  }

  async function inspectOutput(cache, color) {
    check(/^data:image\/(?:webp|png|jpeg);base64,/.test(cache.dataUrl), "Output must be an encoded supported image");
    check(cache.dataUrl.startsWith(`data:${cache.mime};base64,`), "Declared MIME must match the actual data URL");
    const image = await deadline(new Promise((resolve, reject) => {
      const value = new Image();
      value.onload = () => resolve(value);
      value.onerror = () => reject(new Error("Optimized synthetic output failed to decode"));
      value.src = cache.dataUrl;
    }));
    same(image.naturalWidth, cache.width, "Decoded output width must match canonical metadata");
    same(image.naturalHeight, cache.height, "Decoded output height must match canonical metadata");
    const sample = document.createElement("canvas");
    sample.width = 1;
    sample.height = 1;
    const drawing = sample.getContext("2d");
    check(Boolean(drawing), "Output sample must expose a real canvas context");
    drawing.drawImage(image, Math.floor(image.naturalWidth / 2), Math.floor(image.naturalHeight / 2), 1, 1, 0, 0, 1, 1);
    const pixel = drawing.getImageData(0, 0, 1, 1).data;
    const expected = color === "red" ? [240, 16, 16] : [16, 180, 32];
    for (let channel = 0; channel < 3; channel++) {
      check(Math.abs(pixel[channel] - expected[channel]) <= 35, "Decoded pixel must preserve the selected synthetic image");
    }
    same(pixel[3], 255, "Decoded synthetic image must be opaque");
    decodedOutputs++;
  }

  function fixture() {
    const id = `${prefix}${++serial}`;
    const fixedIds = ["personalizationImageHint", "profilePhotoPreview", "companyLogoPreview", "brandLogoPreview"];
    for (const fixed of fixedIds) check(!document.getElementById(fixed), "Canonical preview IDs must not belong to another screen");
    check(!document.getElementById(id), "Disposable image fixture ID must be unused");
    const container = document.createElement("section");
    container.id = `${id}-container`;
    container.hidden = true;
    const input = document.createElement("input");
    input.id = id;
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    container.appendChild(input);
    const hint = document.createElement("output");
    hint.id = "personalizationImageHint";
    hint.hidden = true;
    container.appendChild(hint);
    const profile = document.createElement("div");
    profile.id = "profilePhotoPreview";
    container.appendChild(profile);
    const company = document.createElement("img");
    company.id = "companyLogoPreview";
    container.appendChild(company);
    const brand = document.createElement("img");
    brand.id = "brandLogoPreview";
    container.appendChild(brand);
    document.body.appendChild(container);
    const toasts = [];
    const pending = [];
    const gates = [];
    let allowed = true;
    let loads = 0;
    const context = {
      document, window, Image,
      IMAGE_PERSONALIZATION_PRESETS: presets,
      escaparAttr: escapeAttribute,
      mostrarToast: (...args) => toasts.push(args),
      temAcessoCompleto: () => allowed
    };
    const load = (file) => {
      loads++;
      // This canonical loader owns/revokes each of its own Blob URLs.
      return deadline(api.carregarImagemArquivo(file, context));
    };
    context.carregarImagemArquivo = load;
    context.canvasSuportaMime = (mime) => api.canvasSuportaMime(mime, context);
    context.gerarDataUrlOtimizado = (canvas, mime, quality, maxBytes) => api.gerarDataUrlOtimizado(canvas, mime, quality, maxBytes, context);
    context.tamanhoDataUrlBytes = (value) => api.tamanhoDataUrlBytes(value, context);
    function track(promise) { pending.push(promise); return promise; }
    function select(file, target = input) {
      const transfer = new DataTransfer();
      if (file) transfer.items.add(file);
      target.files = transfer.files;
      same(target.files.length, file ? 1 : 0, "Real file input must reflect the synthetic selection");
      if (file) same(target.files[0], file, "Selection must preserve the real File identity");
    }
    return {
      input, container, hint, profile, company, brand, context, toasts, select,
      file: (blob, name = "synthetic.png") => new File([blob], name, { type: "image/png", lastModified: 123 }),
      invalid: () => new File([new Uint8Array([0, 1, 2, 3])], "invalid-synthetic.png", { type: "image/png", lastModified: 123 }),
      cache: () => window.__personalizationImageCache?.[id],
      loadCount: () => loads,
      access: (value) => { allowed = value; },
      preview: (type = "brand-logo", target = input) => track(api.prepararPreviewImagemPersonalizacao(target, type, context)),
      read: (type = "brand-logo") => track(api.lerImagemConfiguracao(id, "original-synthetic-value", type, context)),
      delay(file) {
        const gate = barrier();
        const loaded = barrier();
        gates.push(gate);
        context.carregarImagemArquivo = async (value) => {
          if (value !== file) return load(value);
          // Decode immediately with the real canonical loader, but defer only
          // delivery (including a real decode failure) until the test releases A.
          let image;
          let failure;
          try { image = await load(value); } catch (error) { failure = error; }
          loaded.release();
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
        check(!document.getElementById(id), "Only the owned fixture must be removed");
        check(!window.__personalizationImageCache?.[id], "Only the owned cache entry must be cleared");
      }
    };
  }

  async function test(name, run) {
    total++;
    let f;
    let failure;
    try {
      check(performance.now() - started < 8500, "Synthetic suite exceeded its bounded execution budget");
      f = fixture();
      await run(f);
    } catch (error) { failure = error; }
    finally {
      if (f) {
        try { await f.close(); } catch (error) { failure = failure || error; }
      }
    }
    if (failure) failures.push({ name, error: String(failure.message || failure) });
    results.push({ name, passed: !failure });
  }

  try {
    check(Boolean(api && presets), "Canonical appearance module and extracted presets must be loaded");
    check(typeof File === "function" && typeof DataTransfer === "function", "Real browser File and DataTransfer support is required");
    const red = await png("rgb(240,16,16)");
    const green = await png("rgb(16,180,32)");
    const types = ["brand-logo", "company-logo", "profile-photo", "pdf-background", "login-background"];
    for (const type of types) {
      await test(`real-decode-${type}`, async (f) => {
        const file = f.file(red);
        f.select(file);
        await f.preview(type);
        const cache = f.cache();
        check(Boolean(cache), "Successful real decode must populate its own cache");
        same(cache.file, file, "Cache must retain the selected File identity");
        same(cache.tipo, type, "Cache must retain the selected image role");
        const preset = presets[type];
        const scale = Math.min(preset.width / 320, preset.height / 160, 1);
        same(cache.width, preset.mode === "cover" ? preset.width : Math.max(1, Math.round(320 * scale)), "Canonical width must follow the extracted preset");
        same(cache.height, preset.mode === "cover" ? preset.height : Math.max(1, Math.round(160 * scale)), "Canonical height must follow the extracted preset");
        const expectedMime = f.context.canvasSuportaMime("image/webp") ? "image/webp" : (preset.preserveAlpha ? "image/png" : "image/jpeg");
        same(cache.mime, expectedMime, "MIME must follow the canonical browser-capability decision");
        check(cache.sizeKb > 0, "Encoded image size must be nonzero");
        check(!f.input.dataset.optimizing, "Processing state must clear after successful completion");
        same(f.hint.hidden, false, "Successful selection must display its own hint");
        same(f.toasts.length, 1, "Successful selection must notify exactly once");
        same(f.toasts[0][1], "sucesso", "Successful selection must not report failure");
        if (type === "brand-logo") same(f.brand.getAttribute("src"), cache.dataUrl, "Brand preview must use the selected image");
        if (type === "company-logo") same(f.company.getAttribute("src"), cache.dataUrl, "Company preview must use the selected image");
        if (type === "profile-photo") same(f.profile.querySelector("img")?.getAttribute("src"), cache.dataUrl, "Profile preview must use the selected image");
        const before = f.loadCount();
        same(await f.read(type), cache.dataUrl, "Read-for-save must return the matching encoded image");
        same(f.loadCount(), before, "Read-for-save must reuse only its matching File cache");
        await inspectOutput(cache, "red");
      });
    }

    await test("A-then-B-with-A-finishing-last", async (f) => {
      const a = f.file(red, "A.png");
      const gate = f.delay(a);
      f.select(a);
      const first = f.preview();
      await gate.decoded;
      const b = f.file(green, "B.png");
      f.select(b);
      await f.preview();
      const saved = f.cache().dataUrl;
      gate.release();
      await first;
      same(f.cache().file, b, "Late A must not replace B in cache");
      same(f.brand.getAttribute("src"), saved, "Late A must not replace B preview");
      same(await f.read(), saved, "Read-for-save must retain B after late A");
      same(f.toasts.length, 1, "Late A must not emit another toast");
      await inspectOutput(f.cache(), "green");
    });

    await test("real-invalid-A-must-not-clear-valid-B", async (f) => {
      const a = f.invalid();
      const gate = f.delay(a);
      f.select(a);
      const first = f.preview();
      await gate.decoded;
      const b = f.file(green, "B.png");
      f.select(b);
      await f.preview();
      gate.release();
      await first;
      same(f.input.files[0], b, "Late real decode failure must not clear B selection");
      same(f.cache().file, b, "Late real decode failure must not clear B cache");
      same(f.toasts.length, 1, "Late real failure must not emit an obsolete error");
      same(f.toasts[0][1], "sucesso", "Only B's success should be visible");
      same(await f.read(), f.cache().dataUrl, "Read-for-save must retain B after late failure");
      await inspectOutput(f.cache(), "green");
    });

    await test("clearing-selection-invalidates-pending-preview", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pending = f.preview();
      await gate.decoded;
      f.select(null);
      await f.preview();
      gate.release();
      await pending;
      same(f.cache(), undefined, "Cleared input must not receive a late cache");
      same(f.brand.getAttribute("src"), null, "Cleared input must not receive a late preview");
      same(f.toasts.length, 0, "Cleared input must not receive an obsolete success");
      check(!f.input.dataset.optimizing, "Clearing must release the processing indicator");
      same(await f.read(), "original-synthetic-value", "Cleared selection must retain the prior save value");
    });

    await test("recreated-input-does-not-receive-old-screen-result", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pending = f.preview();
      await gate.decoded;
      const replacement = document.createElement("input");
      replacement.id = f.input.id;
      replacement.type = "file";
      replacement.accept = f.input.accept;
      f.input.replaceWith(replacement);
      gate.release();
      await pending;
      same(document.getElementById(f.input.id), replacement, "Fixture must contain a genuinely new DOM input");
      same(replacement.files.length, 0, "Replacement must not inherit any selected file");
      same(f.cache(), undefined, "Old screen must not populate replacement cache");
      same(f.brand.getAttribute("src"), null, "Old screen must not change replacement preview");
      same(f.toasts.length, 0, "Old screen must not report success in replacement screen");
    });

    await test("current-real-decode-error-clears-only-current-selection", async (f) => {
      f.select(f.invalid());
      await f.preview();
      same(f.input.files.length, 0, "Current invalid image must clear its own file selection");
      same(f.cache(), undefined, "Invalid bytes must not populate any image cache");
      same(f.toasts.length, 1, "Current decode error must be reported once");
      same(f.toasts[0][1], "erro", "Invalid bytes must report failure, not success");
      check(!f.input.dataset.optimizing, "Current decode failure must release processing state");
      same(await f.read(), "original-synthetic-value", "Invalid selection must preserve the old save value");
    });

    await test("Free-rejects-before-decoding-any-file", async (f) => {
      f.access(false);
      f.select(f.file(red));
      await f.preview();
      same(f.loadCount(), 0, "Free selection must not start image decoding");
      same(f.input.files.length, 0, "Free selection must be cleared");
      same(f.cache(), undefined, "Free selection must not populate a Pro cache");
      same(f.toasts.length, 1, "Free selection must show one access warning");
      same(f.toasts[0][1], "warning", "Free selection must report access restriction");
      same(await f.read(), "original-synthetic-value", "Free selection must preserve the old save value");
    });

    await test("same-name-and-timestamp-different-File-does-not-reuse-cache", async (f) => {
      const a = f.file(red, "same.png");
      f.select(a);
      await f.preview();
      const first = f.cache().dataUrl;
      const b = f.file(green, "same.png");
      same(a.name, b.name, "Fixture names must match");
      same(a.lastModified, b.lastModified, "Fixture timestamps must match");
      check(a !== b, "Fixture must use distinct real Files");
      f.select(b);
      // Read before a new preview to exercise the identity check in the reader.
      const second = await f.read();
      check(second !== first, "A different File with matching metadata must be decoded again");
      same(f.cache().file, b, "Read-for-save must cache the new File identity");
      await inspectOutput(f.cache(), "green");
    });

    await test("access-loss-invalidates-the-pending-Pro-preview", async (f) => {
      const a = f.file(red);
      const gate = f.delay(a);
      f.select(a);
      const pending = f.preview();
      await gate.decoded;
      f.access(false);
      await f.preview();
      gate.release();
      await pending;
      same(f.cache(), undefined, "Invalidated Pro operation must not populate cache");
      same(f.input.files.length, 0, "Revoked selection must be cleared");
      same(f.toasts.length, 1, "Only access warning may remain after invalidation");
      same(f.toasts[0][1], "warning", "Obsolete success must not replace access warning");
      check(!f.input.dataset.optimizing, "Access loss must release processing state");
    });
  } catch (error) {
    failures.push({ name: "fixture-preconditions", error: String(error.message || error) });
  }

  return {
    passed: failures.length === 0,
    total,
    failures,
    assertions,
    results,
    decodedOutputs,
    elapsedMs: Math.round(performance.now() - started),
    selectionMode: "programmatic-real-File-DataTransfer",
    imageProcessingMode: "canonical-real-Image-Canvas-Blob",
    pickerMode: "not-opened",
    persistenceMode: "fixture-memory-only"
  };
};
