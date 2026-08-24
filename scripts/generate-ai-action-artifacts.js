"use strict";
const fs = require("fs");
const path = require("path");
const registry = require("../src/ai/action-registry.js");
const root = path.resolve(__dirname, "..");
const generated = path.join(root, "generated");
fs.mkdirSync(generated, { recursive: true });
fs.writeFileSync(path.join(generated, "ai-actions.manifest.json"), `${JSON.stringify(registry.compactManifest(), null, 2)}\n`);
const health = registry.actions.map((action) => ({ ...registry.health(action), operationType: action.operationType, domain: action.domain, version: action.version }));
fs.writeFileSync(path.join(generated, "ai-actions.health.json"), `${JSON.stringify({ generatedFrom: "src/ai/action-registry.js", actions: health }, null, 2)}\n`);
const escapeCell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const rows = registry.actions.map((action) => {
  const item = registry.health(action);
  return {
    action: action.id,
    status: item.state,
    blocker: item.errors.join(", ") || "-",
    handler: action.handler || "-",
    useCase: /UseCase|Pipeline|Service|Domain/.test(action.handler || "") ? action.handler : "adapter pendente",
    schema: action.inputSchema ? "sim" : "não",
    validator: action.validator || "-",
    permission: action.permission || "-",
    contractTest: action.tested ? "sim" : "não",
    readyForFunctionGemma: item.exposed ? "sim" : "não"
  };
});
const header = ["action", "status", "blocker", "handler", "UseCase", "schema", "validator", "permission", "contract test", "ready_for_functiongemma"];
const markdown = [
  "# Matriz pré-migração FunctionGemma",
  "",
  "Gerada de `src/ai/action-registry.js`. `ready_for_functiongemma` exige action READY e exposição permitida; WRITE permanece não exposta.",
  "",
  `| ${header.join(" | ")} |`,
  `| ${header.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${[row.action, row.status, row.blocker, row.handler, row.useCase, row.schema, row.validator, row.permission, row.contractTest, row.readyForFunctionGemma].map(escapeCell).join(" | ")} |`),
  ""
].join("\n");
fs.writeFileSync(path.join(root, "docs", "ai", "FUNCTIONGEMMA_PREMIGRATION_MATRIX.md"), markdown);
console.log(`Generated ${health.length} action records.`);
