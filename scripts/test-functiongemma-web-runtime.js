const assert = require("node:assert/strict");

global.SimplificaFunctionGemmaNativeRuntime = {
  toolSpec(action) {
    return {
      id: action.id,
      wireName: action.wireName,
      operationType: action.operationType || "READ",
      description: action.description || "Ferramenta de teste.",
      properties: action.properties || [],
      requiredAll: action.requiredAll || [],
      requiredAny: action.requiredAny || [],
      fixedArguments: action.fixedArguments || {},
      anchors: action.anchors || []
    };
  }
};

const { FunctionGemmaWebRuntime, buildPrompt, decide } = require("../src/ai/functiongemma-web-runtime.js");

class FakeEngine {
  constructor(output) { this.output = output; this.loaded = false; this.exited = false; this.streamCalls = 0; this.lastSignal = null; }
  async loadModel(blobs, options) { this.loaded = blobs.length === 1 && options.n_gpu_layers === 0; }
  async createCompletion(options) {
    if (!options.stream) return { choices: [{ text: "não" }] };
    this.streamCalls += 1;
    this.lastSignal = options.abortSignal;
    const midpoint = Math.ceil(this.output.length / 2);
    options.onData({ choices: [{ text: this.output.slice(0, midpoint) }] });
    options.onData({ choices: [{ text: this.output.slice(midpoint) }] });
  }
  async exit() { this.exited = true; }
}

(async () => {
  let now = 0;
  const output = "<start_function_call>call:inventory_search{query:<escape>PLA preto<escape>}<end_function_call>";
  const engine = new FakeEngine(output);
  const runtime = new FunctionGemmaWebRuntime({ engineFactory: () => engine, clock: () => (now += 10) });
  const artifact = new Blob([new Uint8Array([1, 2, 3, 4])]);
  await runtime.load({ artifact, descriptor: { downloadBytes: 4 }, contextWindow: 512 });
  await runtime.warmup();
  const inventory = {
    id: "inventory.search", wireName: "inventory_search", operationType: "READ", description: "Busca material.",
    properties: [{ name: "query", type: "STRING", description: "Material procurado." }], requiredAll: ["query"]
  };
  const result = await runtime.generateToolCall({ command: "quanto tenho de PLA preto?", tools: [inventory] });
  assert.equal(result.kind, "TOOL_CALL");
  assert.equal(result.tool, "inventory.search");
  assert.deepEqual(result.arguments, { query: "PLA preto" });
  assert.equal(result.diagnostics.metrics.writeExposed, 0);
  assert.equal(engine.lastSignal.aborted, true, "geracao deve parar ao fechar o primeiro function_call");
  assert.equal((await runtime.capabilities()).webGpuRequired, false);

  const callsBeforeWrite = engine.streamCalls;
  const blocked = await runtime.generateToolCall({ command: "cancelar pedido", tools: [inventory], blockedWriteAliases: ["cancelar pedido"] });
  assert.equal(blocked.reason, "WRITE_INTENT_BLOCKED");
  assert.equal(engine.streamCalls, callsBeforeWrite, "intencao WRITE bloqueada nao deve chegar ao modelo");

  const outside = decide("abre os pedidos", "<start_function_call>call:orders_delete{}<end_function_call>", [inventory], []);
  assert.equal(outside.reason, "TOOL_OUTSIDE_TOP_K");
  const write = decide("cancele o pedido", output, [inventory], ["cancelar pedido"]);
  assert.equal(write.reason, "WRITE_INTENT_BLOCKED");
  assert.match(buildPrompt("quanto tenho de PLA preto?", [inventory]), /<start_function_declaration>declaration:inventory_search/);
  await runtime.unload();
  assert.equal(engine.exited, true);
  console.log("FunctionGemma web runtime: GGUF Blob, prompt, parser, Top-K, WRITE=0 e lifecycle validados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
