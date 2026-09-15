"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const build = fs.readFileSync(path.join(root, "scripts", "prepare-web.js"), "utf8");

assert.match(build, /const publicModelFiles = \["models\/models-manifest\.v1\.json"\]/, "modelos públicos devem usar allowlist");
assert.doesNotMatch(build, /fs\.cpSync\(path\.join\(root, "models"\)/, "não copie models/ recursivamente");
assert.match(build, /assertNoLocalModelArtifactsInWebBuild/, "build deve verificar artefatos proibidos");
assert.match(build, /endsWith\("\.gguf"\)/, "build deve rejeitar GGUF");

console.log("Web build: modelos locais e GGUFs permanecem fora de dist.");
