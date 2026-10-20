"use strict";

const assert = require("node:assert/strict");
const appearance = require("../src/features/config/config-appearance.js");

const TARGET_BYTES = 500 * 1024;

// A deliberately small encoder fixture. It records the canvas actually passed
// to encoding, rather than duplicating any optimization/resizing algorithm.
// Pixel alpha is a contract marker, not evidence of native browser encoding.
function decodeFixture(dataUrl) {
  assert.equal(typeof dataUrl, "string");
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  assert(match, "the public generator must retain its string Data URL API");
  const encoded = JSON.parse(Buffer.from(match[2], "base64").toString("utf8"));
  assert.equal(match[1], encoded.mime);
  return encoded;
}

function fixture({ size = "small", webp = true, alpha = 255, nullContextCanvas = -1 } = {}) {
  const encodings = [];
  const canvases = [];
  const contextRequests = [];
  class SyntheticImage {
    constructor() {
      this.naturalWidth = 512;
      this.naturalHeight = 512;
      this.alpha = alpha;
    }
  }
  const document = {
    createElement(tag) {
      assert.equal(tag, "canvas", "this fixture must create only isolated canvases");
      const canvasIndex = canvases.length;
      const canvas = {
        width: 0,
        height: 0,
        alpha: 0,
        getContext(type) {
          assert.equal(type, "2d");
          contextRequests.push({ canvasIndex, width: canvas.width, height: canvas.height });
          if (canvasIndex === nullContextCanvas) return null;
          return {
            clearRect() { canvas.alpha = 0; },
            drawImage(source) { canvas.alpha = source.alpha; }
          };
        },
        toDataURL(mime, quality) {
          // Unsupported WebP encoding behaves like browser PNG fallback.
          const actualMime = mime === "image/webp" && !webp ? "image/png" : mime;
          const large = size === "always-large" || (size === "fit-after-reduction" && canvas.width > 400);
          const encoded = {
            width: canvas.width,
            height: canvas.height,
            mime: actualMime,
            quality,
            alpha: actualMime === "image/jpeg" ? 255 : canvas.alpha,
            padding: large ? "x".repeat(600 * 1024) : ""
          };
          encodings.push({ width: canvas.width, height: canvas.height, mime: actualMime, quality });
          return `data:${actualMime};base64,${Buffer.from(JSON.stringify(encoded)).toString("base64")}`;
        }
      };
      canvases.push(canvas);
      return canvas;
    }
  };
  const logo = { mode: "contain", width: 512, height: 512, quality: 0.85, preserveAlpha: true, label: "Synthetic logo" };
  const profile = { mode: "cover", width: 512, height: 512, quality: 0.84, preserveAlpha: false, label: "Synthetic profile" };
  const context = {
    document,
    Image: SyntheticImage,
    IMAGE_PERSONALIZATION_PRESETS: { "brand-logo": logo, "profile-photo": profile },
    carregarImagemArquivo: async () => new SyntheticImage()
  };
  context.canvasSuportaMime = (mime) => appearance.canvasSuportaMime(mime, context);
  // Pass optional arguments explicitly: the canonical helper has defaults
  // before its final context parameter.
  context.gerarDataUrlOtimizado = (canvas, mime, quality, maxBytes) => appearance.gerarDataUrlOtimizado(canvas, mime, quality, maxBytes, context);
  context.tamanhoDataUrlBytes = (value) => appearance.tamanhoDataUrlBytes(value, context);
  return {
    context,
    encodings,
    canvases,
    contextRequests,
    canvas() {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      canvas.alpha = alpha;
      return canvas;
    },
    optimize: (mime = "image/png", type = "brand-logo") => appearance.otimizarImagemPersonalizacao({ type: mime }, type, context)
  };
}

async function main() {
  let total = 0;
  const failures = [];
  async function test(name, run) {
    total++;
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push({ name, error });
      console.error(`FAIL ${name}: ${error.message}`);
    }
  }

  await test("generator preserves string API and dimensions without reduction", () => {
    const f = fixture();
    const dataUrl = appearance.gerarDataUrlOtimizado(f.canvas(), "image/jpeg", 0.82, TARGET_BYTES, f.context);
    const encoded = decodeFixture(dataUrl);
    assert.equal(encoded.width, 512);
    assert.equal(encoded.height, 512);
    assert.equal(f.encodings.length, 1);
    assert(appearance.tamanhoDataUrlBytes(dataUrl) < TARGET_BYTES);
  });

  await test("generator returns last 325px encoding after its attempt budget, even above soft target", () => {
    const f = fixture({ size: "always-large" });
    const dataUrl = appearance.gerarDataUrlOtimizado(f.canvas(), "image/jpeg", 0.82, TARGET_BYTES, f.context);
    const encoded = decodeFixture(dataUrl);
    assert.equal(encoded.width, 325);
    assert.equal(encoded.height, 325);
    assert.equal(f.encodings.length, 8);
    assert.deepEqual(f.encodings.at(-1), { width: 325, height: 325, mime: "image/jpeg", quality: 0.55 });
    assert(appearance.tamanhoDataUrlBytes(dataUrl) > TARGET_BYTES,
      "500 KB is an optimization target, not permission to reject an exhausted valid encoding");
  });

  await test("generator rejects a missing drawing context on its first smaller canvas", () => {
    const f = fixture({ size: "always-large", nullContextCanvas: 1 });
    assert.throws(
      () => appearance.gerarDataUrlOtimizado(f.canvas(), "image/jpeg", 0.82, TARGET_BYTES, f.context),
      /Não foi possível preparar a imagem neste aparelho\./,
      "an undrawable reduced canvas must not yield a successful Data URL"
    );
    assert.equal(f.contextRequests.length, 1);
    assert.equal(f.contextRequests[0].canvasIndex, 1, "failure must occur on a new smaller canvas, not optimizer initialization");
    assert(f.contextRequests[0].width < 512);
    assert.equal(f.encodings.at(-1).width, 512, "the unpainted smaller canvas must never be encoded");
  });

  await test("generator rejects a missing context while copying encoded pixels back to the original canvas", () => {
    const f = fixture({ size: "always-large", nullContextCanvas: 0 });
    assert.throws(
      () => appearance.gerarDataUrlOtimizado(f.canvas(), "image/jpeg", 0.82, TARGET_BYTES, f.context),
      /Não foi possível preparar a imagem neste aparelho\./,
      "failed copy-back must reject instead of reporting synchronized metadata as success"
    );
    assert.equal(f.encodings.at(-1).width, 325, "a valid reduced encoding must exist before the copy-back failure");
    assert.deepEqual(f.contextRequests.at(-1), { canvasIndex: 0, width: 325, height: 325 });
    assert(f.contextRequests.slice(0, -1).every((request) => request.canvasIndex !== 0),
      "the original canvas must be consulted only for the final copy-back in this direct-generator test");
  });

  await test("optimizer metadata matches actual 325px encoding after all attempts", async () => {
    const f = fixture({ size: "always-large", webp: false });
    const result = await f.optimize("image/jpeg", "profile-photo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(encoded.width, 325, "fixture must exercise the reduction branch, not only the preset canvas");
    assert.equal(encoded.height, 325);
    assert.equal(result.width, encoded.width, "returned width must describe the encoded canvas, not original 512px canvas");
    assert.equal(result.height, encoded.height, "returned height must describe the encoded canvas, not original 512px canvas");
    assert.equal(result.mime, encoded.mime);
    assert.equal(result.sizeKb, Math.round(appearance.tamanhoDataUrlBytes(result.dataUrl) / 1024));
    assert(result.sizeKb > 500, "exhausting attempts must not create a new arbitrary rejection ceiling");
  });

  await test("optimizer metadata matches the first smaller encoding that meets target", async () => {
    const f = fixture({ size: "fit-after-reduction", webp: false });
    const result = await f.optimize("image/jpeg", "profile-photo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(encoded.width, 378, "fixture must stop when a real encoded candidate meets target");
    assert.equal(encoded.height, 378);
    assert.equal(result.width, encoded.width);
    assert.equal(result.height, encoded.height);
    assert(appearance.tamanhoDataUrlBytes(result.dataUrl) <= TARGET_BYTES);
  });

  await test("optimizer metadata remains unchanged when no resizing is needed", async () => {
    const f = fixture({ webp: false });
    const result = await f.optimize("image/jpeg", "profile-photo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(result.width, 512);
    assert.equal(result.height, 512);
    assert.equal(result.width, encoded.width);
    assert.equal(result.height, encoded.height);
    assert.equal(result.mime, "image/jpeg");
  });

  await test("alpha-preserving WebP input falls back to PNG, never JPEG", async () => {
    const f = fixture({ webp: false, alpha: 96 });
    const result = await f.optimize("image/webp", "brand-logo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(result.mime, "image/png", "preserveAlpha applies to WebP input too when WebP encoding is unavailable");
    assert.equal(encoded.mime, "image/png");
    assert.equal(encoded.alpha, 96, "fallback encoder must not flatten the injected alpha contract");
  });

  await test("alpha-preserving PNG input retains its PNG fallback", async () => {
    const f = fixture({ webp: false, alpha: 96 });
    const result = await f.optimize("image/png", "brand-logo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(result.mime, "image/png");
    assert.equal(encoded.mime, "image/png");
    assert.equal(encoded.alpha, 96);
  });

  await test("opaque profile keeps JPEG fallback without a new alpha requirement", async () => {
    const f = fixture({ webp: false, alpha: 255 });
    const result = await f.optimize("image/webp", "profile-photo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(result.mime, "image/jpeg");
    assert.equal(encoded.mime, "image/jpeg");
    assert.equal(encoded.alpha, 255);
  });

  await test("JPEG logo input keeps its conventional JPEG fallback", async () => {
    const f = fixture({ webp: false, alpha: 255 });
    const result = await f.optimize("image/jpeg", "brand-logo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(result.mime, "image/jpeg", "a JPEG source does not acquire an alpha channel requirement");
    assert.equal(encoded.mime, "image/jpeg");
    assert.equal(encoded.alpha, 255);
  });

  await test("supported WebP remains the preferred alpha-preserving encoder", async () => {
    const f = fixture({ webp: true, alpha: 96 });
    const result = await f.optimize("image/webp", "brand-logo");
    const encoded = decodeFixture(result.dataUrl);
    assert.equal(result.mime, "image/webp");
    assert.equal(encoded.mime, "image/webp");
    assert.equal(encoded.alpha, 96);
  });

  console.log(`${failures.length ? "FAIL" : "PASS"} ${total - failures.length}/${total} image encoding contracts; injected Canvas/Image only, no browser, device, files or network.`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
