const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FALHOU: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

const servicePath = "src/services/smartLoaderService.js";
const serviceSource = read(servicePath);
const app = read("app.js");
const index = read("index.html");
const sw = read("sw.js");
const prepareWeb = read("scripts/prepare-web.js");
const css = read("style.css");

delete require.cache[require.resolve(path.join(root, servicePath))];
const SmartLoader = require(path.join(root, servicePath));

assert(typeof SmartLoader.start === "function", "SmartLoader inicia operações reais");
assert(typeof SmartLoader.update === "function", "SmartLoader atualiza etapa e progresso");
assert(typeof SmartLoader.updateUpload === "function", "SmartLoader calcula progresso de upload");
assert(typeof SmartLoader.track === "function", "SmartLoader acompanha promises sem atraso artificial");
assert(typeof SmartLoader.skeleton === "function", "SmartLoader fornece skeleton reutilizável");
assert(["dashboard", "pedidos", "clientes", "estoque", "relatorios", "loja", "produtos"].every((key) => SmartLoader.skeletonPresets[key]), "telas obrigatórias possuem preset de skeleton");

const operationId = SmartLoader.start({ name: "test-operation", steps: ["A", "B"], progress: 10 });
assert(SmartLoader.getActiveOperations().some((operation) => operation.id === operationId), "operação fica observável enquanto ativa");
SmartLoader.update(operationId, { stepIndex: 1, progress: 80 });
SmartLoader.success(operationId, "Concluído");
assert(!SmartLoader.getActiveOperations().some((operation) => operation.id === operationId), "operação é removida ao concluir");

const skeleton = SmartLoader.skeleton("pedidos");
assert(skeleton.includes('data-smart-skeleton="pedidos"'), "skeleton identifica a tela");
assert(skeleton.includes('aria-busy="true"'), "skeleton informa carregamento à acessibilidade");

assert(serviceSource.includes("2000") && serviceSource.includes("5000") && serviceSource.includes("10000"), "limites de 2s, 5s e 10s estão configurados");
assert(!/\bawait\s+new\s+Promise\s*\([^)]*setTimeout/i.test(serviceSource), "serviço não cria espera artificial");
assert(index.indexOf("smartLoaderService.js") < index.indexOf("app.js"), "SmartLoader carrega antes do app.js");
assert(index.includes('id="smart-loader-layer"'), "camada global do SmartLoader existe");
assert(prepareWeb.includes(servicePath), "build copia o SmartLoader para dist");
assert(sw.includes("./src/services/smartLoaderService.js"), "PWA pré-carrega o SmartLoader");
assert(sw.includes("simplifica-3d-v184-security-mobile-release-20260622"), "cache PWA foi atualizado");

[
  "uploadStorefrontAsset",
  "alternarStatusLojaOnline",
  "salvarProdutoLojaOnline",
  "sincronizarSupabase",
  "salvarPedidoRapidoOperacional",
  "salvarCaixaRapidoOperacional",
  "salvarEstoqueRapidoOperacional",
  "gerarPDF",
  "cadastrarClienteSaas",
  "loginUsuario"
].forEach((functionName) => {
  const start = app.indexOf(`function ${functionName}`);
  const asyncStart = app.indexOf(`async function ${functionName}`);
  const position = start >= 0 ? start : asyncStart;
  const block = position >= 0 ? app.slice(position, position + 9000) : "";
  assert(position >= 0 && /iniciarOperacaoUX|atualizarOperacaoUX|atualizarUploadOperacaoUX/.test(block), `${functionName} usa feedback de desempenho`);
});

assert(css.includes(".smart-loader-panel"), "painel contextual possui estilo global");
assert(css.includes(".smart-skeleton-screen"), "skeleton possui estilo global");
assert(css.includes("@media(max-width:767px)"), "feedback possui adaptação mobile");
assert(!css.slice(css.indexOf("/* Perceived performance")).includes("linear-gradient"), "camada nova não introduz gradiente visual");
assert(!/function gerarPdfCalculadora[\s\S]{0,260}setTimeout/.test(app), "geração de PDF não usa atraso artificial");
assert(/function renderStoreGuidedProductsList[\s\S]{0,260}renderSmartScreenSkeleton\(\"produtos\"\)/.test(app), "catálogo de produtos usa skeleton real");

if (process.exitCode) process.exit(process.exitCode);
console.log("Todos os checks de desempenho percebido passaram.");
