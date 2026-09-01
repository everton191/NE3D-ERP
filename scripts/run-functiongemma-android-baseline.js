"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const evaluationPath = path.join(root, "training", "functiongemma", "evaluation.v1.jsonl");
const defaultOutput = path.join(root, "training", "functiongemma", "android-q8-predictions.v1.jsonl");
const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const port = Number(arg("--port", "9222"));
const outputPath = path.resolve(arg("--output", defaultOutput));
const chunkSize = Math.max(1, Math.min(40, Number(arg("--chunk", "20")) || 20));
const allRows = fs.readFileSync(evaluationPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const categories = new Set(String(arg("--categories", "")).split(",").map((value) => value.trim()).filter(Boolean));
const rows = categories.size ? allRows.filter((row) => categories.has(row.category)) : allRows;

if (allRows.length !== 560 || new Set(allRows.map((row) => row.id)).size !== allRows.length || rows.length === 0) {
  throw new Error(`Evaluation inválida: casos=${allRows.length}, ids=${new Set(allRows.map((row) => row.id)).size}, selecionados=${rows.length}`);
}

async function openCdp() {
  const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
  const page = pages.find((item) => item.type === "page") || pages[0];
  if (!page?.webSocketDebuggerUrl) throw new Error("WebView CDP não encontrada.");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return socket;
}

function evaluate(socket, expression, id) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`CDP timeout no lote ${id}`)), 10 * 60 * 1000);
    const listener = (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== id) return;
      socket.removeEventListener("message", listener);
      clearTimeout(timeout);
      if (message.result?.exceptionDetails) return reject(new Error(message.result.exceptionDetails.text || "Runtime.evaluate falhou"));
      resolve(message.result?.result?.value);
    };
    socket.addEventListener("message", listener);
    socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
  });
}

function chunkExpression(chunk) {
  const encoded = Buffer.from(JSON.stringify(chunk), "utf8").toString("base64");
  return `(async()=>{
    const bytes=Uint8Array.from(atob(${JSON.stringify(encoded)}),c=>c.charCodeAt(0));
    const cases=JSON.parse(new TextDecoder().decode(bytes));
    const output=[];
    const invalidReasons=new Set(["MALFORMED_OUTPUT","MULTIPLE_TOOL_CALLS","UNKNOWN_ARGUMENT","MISSING_REQUIRED_ARGUMENT","INVALID_ARGUMENT_VALUE"]);
    const clarification=/\\?|preciso|fornec|informe|diga|qual |quais |falt/i;
    const outside=/não posso|nao posso|limited|limitad|weather|previsão do tempo|previsao do tempo|fora do/i;
    for(const item of cases){
      const started=performance.now();
      let prediction;
      try{prediction=await window.Simplifica3dAiRuntime.predictToolShadow(item.input,{screen:item.screen});}
      catch(error){prediction={kind:"NO_TOOL",reason:"RUNTIME_EXCEPTION",diagnostics:{rawText:String(error&&error.message||error),metrics:{}}};}
      const diagnostics=prediction.diagnostics||{};
      const metrics=diagnostics.metrics||window.SimplificaFunctionGemmaNativeRuntime.runtime.getMetrics()||{};
      const action=prediction.kind==="TOOL_CALL"?prediction.tool:null;
      const reason=prediction.reason||diagnostics.reason||"";
      const rawText=String(diagnostics.rawText||"");
      const disposition=action?"CALL":outside.test(rawText)?"OUT_OF_DOMAIN":clarification.test(rawText)?"ASK_CLARIFICATION":"NO_CALL";
      const schemaValid=action?true:!(diagnostics.rawTool&&invalidReasons.has(reason));
      output.push({
        id:item.id,action,arguments:prediction.arguments||{},disposition,
        schemaValid,missing:disposition==="ASK_CLARIFICATION"?["unspecified"]:[],
        invalidToolCall:invalidReasons.has(reason),outOfTopK:reason==="TOOL_OUTSIDE_TOP_K",
        operationType:action?(window.SimplificaActionRegistry.get(action)?.operationType||null):null,
        reason,rawTool:diagnostics.rawTool||null,wireTool:diagnostics.wireTool||null,
        latencyMs:Math.round(performance.now()-started),ttftMs:Number(metrics.ttftMs)||0,
        totalMs:Number(metrics.totalMs)||0,tokensGenerated:Number(metrics.tokensGenerated)||0,
        promptTokens:Number(metrics.promptTokens)||0,backend:metrics.backend||null,threads:Number(metrics.threads)||null
      });
    }
    return output;
  })()`;
}

(async () => {
  const socket = await openCdp();
  const predictions = [];
  try {
    await evaluate(socket, "window.__simplificaAiBenchmark=true", 1);
    for (let offset = 0, requestId = 2; offset < rows.length; offset += chunkSize, requestId += 1) {
      const chunk = rows.slice(offset, offset + chunkSize);
      const result = await evaluate(socket, chunkExpression(chunk), requestId);
      if (!Array.isArray(result) || result.length !== chunk.length) throw new Error(`Lote incompleto em ${offset}: ${result?.length}`);
      predictions.push(...result);
      process.stdout.write(`FunctionGemma Android baseline: ${predictions.length}/${rows.length}\n`);
    }
  } finally {
    try { await evaluate(socket, "window.__simplificaAiBenchmark=false", 1000000); } catch (_) {}
    socket.close();
  }
  fs.writeFileSync(outputPath, `${predictions.map((row) => JSON.stringify(row)).join("\n")}\n`);
  process.stdout.write(`${JSON.stringify({ cases: predictions.length, output: outputPath }, null, 2)}\n`);
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
