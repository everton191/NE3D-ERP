const assert = require("node:assert/strict");
const appearance = require("../src/features/config/config-appearance");

function fixture() {
  const loads = new Map();
  const elements = new Map();
  const toasts = [];
  let allowed = true;
  const hint = { hidden: true, textContent: "" };
  elements.set("personalizationImageHint", hint);
  for (const id of ["brandLogoPreview", "companyLogoPreview", "profilePhotoPreview"]) {
    elements.set(id, { src: "original", innerHTML: "original" });
  }
  const input = { id: "synthetic-image-input", files: [], dataset: {} };
  Object.defineProperty(input, "value", { set(value) {
    assert.equal(value, "");
    input.files = [];
  } });
  elements.set(input.id, input);
  const preset = { mode: "contain", width: 320, height: 160, quality: 0.82, label: "Synthetic" };
  const context = {
    window: {}, document: {
      getElementById: (id) => elements.get(id) || null,
      createElement(tag) {
        assert.equal(tag, "canvas");
        const canvas = {};
        canvas.getContext = () => ({ clearRect() {}, drawImage(image) { canvas.tag = image.tag; } });
        return canvas;
      }
    },
    IMAGE_PERSONALIZATION_PRESETS: Object.fromEntries(
      ["brand-logo", "company-logo", "profile-photo", "pdf-background", "login-background"]
        .map((type) => [type, preset])),
    carregarImagemArquivo(file) {
      if (!loads.has(file)) {
        let resolve, reject;
        const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
        loads.set(file, { promise, resolve, reject });
      }
      return loads.get(file).promise;
    },
    canvasSuportaMime: () => true,
    gerarDataUrlOtimizado: (canvas) => `data:image/webp;base64,${canvas.tag}`,
    tamanhoDataUrlBytes: () => 1024,
    escaparAttr: (value) => value,
    mostrarToast: (...args) => toasts.push(args),
    temAcessoCompleto: () => allowed
  };
  function choose(name, tag = name, lastModified = 123) {
    const file = { name, tag, lastModified, type: "image/png" };
    input.files = [file];
    return file;
  }
  return {
    input, context, elements, toasts, hint, choose,
    preview: (type = "brand-logo") => appearance.prepararPreviewImagemPersonalizacao(input, type, context),
    resolve(file) { loads.get(file).resolve({ tag: file.tag, naturalWidth: 160, naturalHeight: 80 }); },
    reject(file) { loads.get(file).reject(new Error("Synthetic invalid image")); },
    cache: () => context.window.__personalizationImageCache?.[input.id],
    access: (value) => { allowed = value; },
    read: (type = "brand-logo") => appearance.lerImagemConfiguracao(input.id, "old-logo", type, context)
  };
}

async function main() {
  let cases = 0;
  const test = async (name, run) => { await run(); cases++; console.log(`PASS ${name}`); };
  await test("resultado antigo nao substitui a nova previa/cache", async () => {
    const f = fixture();
    const a = f.choose("A.png"); const first = f.preview();
    const b = f.choose("B.png"); const second = f.preview();
    f.resolve(b); await second;
    f.resolve(a); await first;
    assert.equal(f.elements.get("brandLogoPreview").src, "data:image/webp;base64,B.png");
    assert.equal(f.cache().fileName, "B.png");
    assert.equal(await f.read(), "data:image/webp;base64,B.png");
    assert.equal(f.toasts.length, 1);
  });
  await test("erro antigo nao limpa o arquivo novo nem altera a leitura para salvar", async () => {
    const f = fixture();
    const a = f.choose("invalid.png"); const first = f.preview();
    const b = f.choose("valid.png"); const second = f.preview();
    f.resolve(b); await second;
    f.reject(a); await first;
    assert.equal(f.input.files[0], b);
    assert.equal(await f.read(), "data:image/webp;base64,valid.png");
    assert.equal(f.toasts.length, 1);
    assert.equal(f.toasts[0][1], "sucesso");
  });
  for (const result of ["resolve", "reject"]) {
    await test(`conclusao ${result} antiga nao limpa o estado de processamento atual`, async () => {
      const f = fixture();
      const a = f.choose("A.png"); const first = f.preview();
      const b = f.choose("B.png"); const second = f.preview();
      f[result](a); await first;
      assert.equal(f.input.dataset.optimizing, "1");
      assert.equal(f.cache(), undefined);
      assert.equal(f.hint.hidden, true);
      assert.equal(f.toasts.length, 0);
      assert.equal(f.input.files[0], b);
      f.resolve(b); await second;
      assert.equal(f.input.dataset.optimizing, undefined);
    });
  }
  await test("limpar a selecao invalida a operacao pendente", async () => {
    const f = fixture();
    const a = f.choose("A.png"); const task = f.preview();
    f.input.files = [];
    await f.preview();
    assert.equal(f.input.dataset.optimizing, undefined);
    f.resolve(a); await task;
    assert.equal(f.cache(), undefined);
    assert.equal(f.elements.get("brandLogoPreview").src, "original");
    assert.equal(f.toasts.length, 0);
  });
  await test("input recriado com mesmo id nao recebe o resultado da tela anterior", async () => {
    const f = fixture();
    const a = f.choose("A.png"); const task = f.preview();
    f.elements.set(f.input.id, { id: f.input.id, files: [], dataset: {} });
    f.resolve(a); await task;
    assert.equal(f.cache(), undefined);
    assert.equal(f.elements.get("brandLogoPreview").src, "original");
    assert.equal(f.toasts.length, 0);
  });
  await test("arquivo diferente com mesmo nome/data nao reutiliza o cache anterior", async () => {
    const f = fixture();
    const a = f.choose("same.png", "first"); const first = f.preview();
    f.resolve(a); await first;
    const b = f.choose("same.png", "second"); const second = f.preview();
    const reading = f.read();
    f.resolve(b); await second;
    assert.equal(await reading, "data:image/webp;base64,second");
  });
  for (const type of ["brand-logo", "company-logo", "profile-photo", "pdf-background", "login-background"]) {
    await test(`selecao unica ${type} continua funcional`, async () => {
      const f = fixture();
      const file = f.choose("image.png"); const task = f.preview(type);
      f.resolve(file); await task;
      assert.equal(f.cache().tipo, type);
      assert.equal(await f.read(type), "data:image/webp;base64,image.png");
      assert.equal(f.input.dataset.optimizing, undefined);
      assert.equal(f.hint.hidden, false);
      assert.equal(f.toasts.length, 1);
      if (type === "profile-photo") assert.match(f.elements.get("profilePhotoPreview").innerHTML, /image\.png/);
      if (type === "brand-logo") assert.match(f.elements.get("brandLogoPreview").src, /image\.png/);
      if (type === "company-logo") assert.match(f.elements.get("companyLogoPreview").src, /image\.png/);
    });
  }
  await test("erro atual continua informando falha e limpa a propria selecao", async () => {
    const f = fixture();
    const file = f.choose("invalid.png"); const task = f.preview();
    f.reject(file); await task;
    assert.equal(f.input.files.length, 0);
    assert.equal(f.toasts.length, 1);
    assert.equal(f.toasts[0][1], "erro");
    assert.equal(f.input.dataset.optimizing, undefined);
    assert.equal(await f.read(), "old-logo");
  });
  await test("Free nao processa arquivo nem libera recurso Pro", async () => {
    const f = fixture();
    f.context.temAcessoCompleto = () => false;
    f.choose("blocked.png");
    await f.preview();
    assert.equal(f.input.files.length, 0);
    assert.equal(f.cache(), undefined);
    assert.equal(f.toasts[0][1], "warning");
    assert.equal(await f.read(), "old-logo");
  });
  await test("perda de acesso invalida a previa pendente e libera o indicador", async () => {
    const f = fixture();
    const file = f.choose("pending.png"); const task = f.preview();
    f.context.temAcessoCompleto = () => false;
    await f.preview();
    assert.equal(f.input.dataset.optimizing, undefined);
    f.resolve(file); await task;
    assert.equal(f.cache(), undefined);
    assert.equal(f.toasts.length, 1);
    assert.equal(f.toasts[0][1], "warning");
  });
  for (const completion of ["resolve", "reject"]) {
    await test(`leitura antiga ${completion} nao substitui B nem devolve A para salvar`, async () => {
      const f = fixture();
      const a = f.choose("A.png");
      const reading = f.read();
      const rejected = assert.rejects(reading, { code: "PERSONALIZATION_IMAGE_SELECTION_CHANGED" });
      const b = f.choose("B.png"); const preview = f.preview();
      f.resolve(b); await preview;
      f[completion](a);
      await rejected;
      assert.equal(f.cache().file, b);
      assert.equal(f.elements.get("brandLogoPreview").src, "data:image/webp;base64,B.png");
      assert.equal(await f.read(), "data:image/webp;base64,B.png");
      assert.equal(f.toasts.length, 1);
      assert.equal(f.toasts[0][1], "sucesso");
    });
  }
  for (const invalidation of ["clear", "replace"]) {
    await test(`leitura pendente aborta ao ${invalidation} o input sem criar cache`, async () => {
      const f = fixture();
      const file = f.choose("pending.png");
      const reading = f.read();
      const rejected = assert.rejects(reading, { code: "PERSONALIZATION_IMAGE_SELECTION_CHANGED" });
      if (invalidation === "clear") f.input.files = [];
      else f.elements.set(f.input.id, { id: f.input.id, files: [], dataset: {} });
      f.resolve(file); await rejected;
      assert.equal(f.cache(), undefined);
      assert.equal(f.toasts.length, 0);
    });
  }
  await test("leitura pendente aborta se o acesso mudar sem novo onchange", async () => {
    const f = fixture();
    const file = f.choose("pending.png");
    const reading = f.read();
    const rejected = assert.rejects(reading, { code: "PERSONALIZATION_IMAGE_SELECTION_CHANGED" });
    f.access(false);
    f.resolve(file); await rejected;
    assert.equal(f.cache(), undefined);
    assert.equal(f.toasts.length, 0);
  });
  await test("previa pendente nao publica sucesso se o acesso mudar sem onchange", async () => {
    const f = fixture();
    const file = f.choose("pending.png"); const preview = f.preview();
    f.access(false);
    f.resolve(file); await preview;
    assert.equal(f.cache(), undefined);
    assert.equal(f.input.dataset.optimizing, undefined);
    assert.equal(f.elements.get("brandLogoPreview").src, "original");
    assert.equal(f.toasts.length, 0);
  });
  await test("leitura sem previa continua preenchendo cache para o arquivo atual", async () => {
    const f = fixture();
    const file = f.choose("current.png"); const reading = f.read();
    f.resolve(file);
    assert.equal(await reading, "data:image/webp;base64,current.png");
    assert.equal(f.cache().file, file);
    assert.equal(await f.read(), "data:image/webp;base64,current.png");
    assert.equal(f.toasts.length, 0);
  });
  await test("falha de leitura atual preserva valor anterior e informa erro", async () => {
    const f = fixture();
    const file = f.choose("invalid.png"); const reading = f.read();
    f.reject(file);
    assert.equal(await reading, "old-logo");
    assert.equal(f.cache(), undefined);
    assert.equal(f.toasts.length, 1);
    assert.equal(f.toasts[0][1], "erro");
  });
  console.log(`PASS ${cases} cenarios locais de selecao de imagem; sem arquivos, rede ou Supabase.`);
}

const previousWarn = console.warn;
console.warn = () => {};
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => { console.warn = previousWarn; });
