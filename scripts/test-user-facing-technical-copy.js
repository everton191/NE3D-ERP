const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`Falha: ${message}`);
    process.exit(1);
  }
}

function getFunctionBody(name) {
  const start = app.indexOf(`function ${name}`);
  assert(start >= 0, `Funcao ${name} nao encontrada`);
  const open = app.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < app.length; index += 1) {
    const char = app[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return app.slice(start, index + 1);
    }
  }
  assert(false, `Nao foi possivel extrair ${name}`);
}

[
  "renderConta",
  "renderMinhaAssinatura",
  "processarParametrosAssinaturaUrl",
  "liberarDiasManualClienteSaas"
].forEach((name) => {
  const body = getFunctionBody(name);
  assert(!/\bweb\s*hook\b|\bwebhook\b/i.test(body), `${name} nao deve expor webhook na interface de usuario`);
});

console.log("OK: textos tecnicos de webhook nao aparecem nas telas de conta/assinatura.");
