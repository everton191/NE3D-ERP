"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const commands = require("../src/features/production/production-commands.js");

assert.equal(Object.keys(commands).length, 23, "production-commands deve exportar as 23 funções (workflow + codegen/material)");
for (const name of Object.keys(commands)) {
  assert.equal(typeof commands[name], "function", `export deve ser função: ${name}`);
}

{
  const ctx = { productionJobs: [], hojeIsoData: () => "2026-09-21" };
  assert.equal(commands.gerarCodigoProducao(undefined, ctx), "PROD-2026-09-21-001", "Código de produção usa data e sequência do dia");
  assert.equal(
    commands.getProductionCodeSequence("2026-09-21", { productionJobs: [
      { productionCode: "PROD-2026-09-21-001" },
      { production_code: "PROD-2026-09-21-002" },
      { productionCode: "PROD-2026-09-20-009" }
    ] }),
    3,
    "Sequência conta apenas códigos do mesmo dia (camel e snake)"
  );
}
{
  const material = commands.getProductionItemMaterial({ pesoGramas: 12, cor: "azul" }, {
    getMateriaisItem: () => [{ materialId: "m1", gramas: 30, nome: "PLA" }],
    getMaterialEstoque: () => ({ nome: "PLA Black", custoUnitario: 120, unidade: "kg" })
  });
  assert.deepEqual(material, { id: "m1", name: "PLA", color: "azul", grams: 30, unit: "kg", unitCost: 120 });
}

assert.deepEqual(
  commands.validarPedidoParaProducao({}, {
    clienteDoPedido: () => "",
    normalizarItensPedido: () => [],
    getProductionItemMaterial: () => ({ name: "" })
  }),
  ["cliente", "item", "prazo de entrega"]
);
assert.deepEqual(
  commands.validarPedidoParaProducao({ prazo: "2026-10-01" }, {
    clienteDoPedido: () => "Ana",
    normalizarItensPedido: () => [{ qtd: 2, tipoImpressao: "fdm" }],
    getProductionItemMaterial: () => ({ name: "PLA" })
  }),
  [],
  "Pedido completo não pode reportar faltas"
);
assert.deepEqual(
  commands.validarPedidoParaProducao({ prazo: "2026-10-01" }, {
    clienteDoPedido: () => "Ana",
    normalizarItensPedido: () => [{ qtd: 1, tipoImpressao: "resina" }],
    getProductionItemMaterial: () => ({ name: "" })
  }),
  ["material"]
);

assert.equal(commands.pedidoTemPagamentoLiberadoProducao({ statusPagamento: "pago" }, { calcularResumoFinanceiroPedido: () => ({ restante: 99 }) }), true);
assert.equal(commands.pedidoTemPagamentoLiberadoProducao({}, { calcularResumoFinanceiroPedido: () => ({ restante: 0 }) }), true);
assert.equal(commands.pedidoTemPagamentoLiberadoProducao({ productionPaymentAuthorized: true }, { calcularResumoFinanceiroPedido: () => ({ restante: 50 }) }), true);
assert.equal(commands.pedidoTemPagamentoLiberadoProducao({}, { calcularResumoFinanceiroPedido: () => ({ restante: 50 }) }), false);

const cmpCtx = { hojeIsoData: () => "2026-09-20" };
assert.ok(commands.compararTarefasProducao({ dueDate: "2026-09-19" }, { dueDate: "2026-09-25" }, cmpCtx) < 0, "Atrasado vem antes do futuro");
assert.ok(commands.compararTarefasProducao({ dueDate: "2026-09-20" }, { dueDate: "2026-09-21" }, cmpCtx) < 0, "Hoje vem antes de amanhã");
assert.ok(commands.compararTarefasProducao({ dueDate: "2026-09-20", priority: "urgente" }, { dueDate: "2026-09-20", priority: "normal" }, cmpCtx) < 0, "Urgente quebra empate de prazo");

const fila = [
  { id: "futuro", status: "na_fila", priority: "normal", dueDate: "2026-10-05", created_at: "2026-09-01T00:00:00.000Z" },
  { id: "hoje", status: "na_fila", priority: "normal", dueDate: "2026-09-20", created_at: "2026-09-02T00:00:00.000Z" }
];
const ordenada = commands.reordenarFilaProducao({ productionJobs: fila, hojeIsoData: () => "2026-09-20" });
assert.deepEqual(ordenada.map((job) => job.id), ["hoje", "futuro"]);
assert.equal(ordenada[0].queuePosition, 1);
assert.equal(ordenada[0].status, "proximo", "Primeiro da fila deve virar proximo");
assert.equal(ordenada[1].queuePosition, 2);
assert.equal(ordenada[1].status, "na_fila");

{
  const job = { id: "j1", status: "na_fila", priority: "normal", dueDate: "2026-10-01" };
  const calls = { toast: [], events: [], saves: 0, renders: 0 };
  commands.alterarPrioridadeTarefaProducao("j1", "alta", {
    getProductionJob: () => job,
    prompt: () => "",
    mostrarToast: (msg) => calls.toast.push(msg),
    renderizarPreservandoScroll: () => calls.renders++,
    registrarEventoProducao: (...args) => calls.events.push(args),
    salvarProducaoManual: () => calls.saves++,
    productionJobs: [job],
    hojeIsoData: () => "2026-09-20"
  });
  assert.equal(job.priority, "normal", "Sem justificativa a prioridade não muda");
  assert.ok(calls.toast.includes("A prioridade só pode ser alterada com justificativa."));
  assert.equal(calls.saves, 0);
}
{
  const job = { id: "j1", status: "na_fila", priority: "normal", dueDate: "2026-10-01" };
  const calls = { events: [], saves: 0 };
  commands.alterarPrioridadeTarefaProducao("j1", "alta", {
    getProductionJob: () => job,
    prompt: () => " cliente urgente ",
    mostrarToast: () => {},
    renderizarPreservandoScroll: () => {},
    registrarEventoProducao: (...args) => calls.events.push(args),
    salvarProducaoManual: () => calls.saves++,
    productionJobs: [job],
    hojeIsoData: () => "2026-09-20"
  });
  assert.equal(job.priority, "alta");
  assert.equal(job.priorityReason, "cliente urgente");
  assert.equal(calls.events[0][1], "prioridade_alterada");
  assert.equal(calls.saves, 1);
}

{
  const job = { id: "j1", status: "na_fila", orderId: "o1" };
  const calls = { toast: [], saves: 0 };
  const ok = commands.atualizarStatusTarefaProducao("j1", "em_impressao", {
    PRODUCTION_STATUS_META: { em_impressao: {} },
    getProductionJob: () => job,
    getProductionPrinter: () => null,
    mostrarToast: (msg) => calls.toast.push(msg),
    renderizarPreservandoScroll: () => {},
    confirm: () => false,
    prompt: () => "",
    getDataEventoOperacionalPedido: () => null,
    getPesoPlanejadoTarefaProducao: () => 0,
    registrarEventoProducao: () => {},
    salvarProducaoManual: () => calls.saves++,
    productionJobs: [job],
    hojeIsoData: () => "2026-09-20",
    encontrarPedidoPorId: () => null,
    marcarRegistroLocalAlteradoParaSync: () => {}
  });
  assert.equal(ok, false, "Em impressão sem impressora deve ser bloqueado");
  assert.equal(job.status, "na_fila");
  assert.ok(calls.toast.includes("Selecione uma impressora antes de iniciar a impressão."));
  assert.equal(calls.saves, 0);
}
{
  const printer = { id: "p1", status: "disponivel" };
  const job = { id: "j1", status: "na_fila", orderId: "o1", printerId: "p1" };
  const calls = { events: [], saves: 0 };
  const ok = commands.atualizarStatusTarefaProducao("j1", "em_impressao", {
    PRODUCTION_STATUS_META: { em_impressao: {} },
    getProductionJob: () => job,
    getProductionPrinter: () => printer,
    mostrarToast: () => {},
    renderizarPreservandoScroll: () => {},
    confirm: () => false,
    prompt: () => "",
    getDataEventoOperacionalPedido: () => null,
    getPesoPlanejadoTarefaProducao: () => 0,
    registrarEventoProducao: (...args) => calls.events.push(args),
    salvarProducaoManual: () => calls.saves++,
    productionJobs: [job],
    hojeIsoData: () => "2026-09-20",
    encontrarPedidoPorId: () => null,
    marcarRegistroLocalAlteradoParaSync: () => {}
  });
  assert.equal(ok, true);
  assert.equal(job.status, "em_impressao");
  assert.equal(printer.status, "ocupada");
  assert.equal(calls.events[0][1], "status_alterado");
  assert.equal(calls.saves, 1);
}

{
  const job = { id: "j1", status: "em_impressao", orderId: "o1", productionCode: "PROD-1" };
  const productionJobs = [job];
  const events = [];
  let uuidSeq = 0;
  commands.criarReimpressaoProducao("j1", {
    getProductionJob: () => job,
    gerarUuidProducao: () => `nova-${++uuidSeq}`,
    gerarCodigoProducao: () => "PROD-2",
    productionJobs,
    registrarEventoProducao: (...args) => events.push(args),
    renderizarPreservandoScroll: () => {},
    salvarProducaoManual: () => {},
    hojeIsoData: () => "2026-09-20"
  });
  assert.equal(productionJobs.length, 2, "Reimpressão deve entrar na fila");
  assert.equal(productionJobs[1].parentJobId, "j1");
  assert.equal(productionJobs[1].status, "proximo", "Reimpressão entra como cabeça da fila");
  assert.equal(productionJobs[1].priority, "alta");
  assert.equal(productionJobs[1].productionCode, "PROD-2");
  assert.equal(job.status, "falhou");
  assert.equal(events.length, 2);
}

{
  const job = { id: "j1", status: "controle_qualidade", orderId: "o1", printerId: "p1" };
  const calls = { saves: 0 };
  commands.avaliarQualidadeProducao("j1", "aprovado", {
    getProductionJob: () => job,
    PRODUCTION_STATUS_META: { pronto_para_entrega: {}, controle_qualidade: {} },
    getProductionPrinter: () => null,
    mostrarToast: () => {},
    renderizarPreservandoScroll: () => {},
    confirm: () => false,
    prompt: () => "",
    getDataEventoOperacionalPedido: () => null,
    getPesoPlanejadoTarefaProducao: () => 0,
    registrarEventoProducao: () => {},
    salvarProducaoManual: () => calls.saves++,
    productionJobs: [job],
    hojeIsoData: () => "2026-09-20",
    encontrarPedidoPorId: () => null,
    marcarRegistroLocalAlteradoParaSync: () => {}
  });
  assert.equal(job.status, "pronto_para_entrega", "Qualidade aprovada deve levar a pronto_para_entrega");
}

{
  const titles = [];
  const popup = { innerHTML: "" };
  const base = {
    PRODUCTION_PRINTER_STATUS: { disponivel: "Disponível" },
    document: { getElementById: () => popup },
    escaparAttr: String,
    escaparHtml: String,
    getProductionPrinter: () => null,
    promoverPopupParaDialogUiV3: (_el, options) => titles.push(options.title)
  };
  commands.abrirCadastroImpressoraProducao("", base);
  commands.abrirCadastroImpressoraProducao("p1", { ...base, getProductionPrinter: () => ({ name: "Ender 3" }) });
  assert.deepEqual(titles, ["Cadastrar impressora", "Editar impressora"], "Título do modal deve seguir o id (correção do bug printerId)");
}

{
  const printer = { id: "p1", name: "Ender", status: "ocupada" };
  let saves = 0;
  commands.desativarImpressoraProducao("p1", {
    confirm: () => false,
    getProductionPrinter: () => printer,
    renderizarPreservandoScroll: () => {},
    salvarProducaoManual: () => saves++
  });
  assert.equal(printer.status, "ocupada", "Cancelar o confirm não pode desativar");
  commands.desativarImpressoraProducao("p1", {
    confirm: () => true,
    getProductionPrinter: () => printer,
    renderizarPreservandoScroll: () => {},
    salvarProducaoManual: () => saves++
  });
  assert.equal(printer.status, "inativa");
  assert.equal(printer.isActive, false);
  assert.equal(saves, 1);
}

{
  const pedido = { id: "o9" };
  const job = { id: "j1", orderId: "o9", status: "na_fila" };
  const calls = { events: [], saves: 0, tela: "" };
  const doc = {
    getElementById: () => ({ value: "material" })
  };
  commands.enviarPedidoPendenciaProducao("o9", {
    encontrarPedidoPorId: () => pedido,
    document: doc,
    productionJobs: [job],
    registrarEventoProducao: (...args) => calls.events.push(args),
    PRODUCTION_PENDING_REASONS: { material: "Falta material" },
    gerarUuidProducao: () => "uuid-x",
    getProductionCompanyId: () => "c1",
    normalizarItensPedido: () => [{ nome: "Peça" }],
    clienteDoPedido: () => "Ana",
    salvarProducaoManual: () => calls.saves++,
    fecharPopup: () => {},
    trocarTela: (tela) => (calls.tela = tela),
    window: {}
  });
  assert.equal(job.status, "pendente");
  assert.equal(job.blockedReason, "material");
  assert.equal(pedido.production_status, "pendente");
  assert.equal(calls.events[0][1], "pendencia_registrada");
  assert.equal(calls.saves, 1);
  assert.equal(calls.tela, "producao");
}

{
  const events = [];
  let capped = null;
  const base = {
    gerarUuidProducao: () => "11111111-1111-4111-8111-111111111111",
    getProductionCompanyId: () => "c1",
    getUsuarioAtual: () => ({ email: "operador@empresa.com" }),
    productionEvents: events,
    setProductionEvents: (valor) => { capped = valor; }
  };
  commands.registrarEventoProducao("j1", "status_alterado", "na_fila", "em_impressao", "  iniciada  ", base);
  assert.equal(events.length, 1);
  assert.equal(events[0].productionJobId, "j1");
  assert.equal(events[0].eventType, "status_alterado");
  assert.equal(events[0].note, "iniciada");
  assert.equal(events[0].createdBy, "operador@empresa.com");
  assert.equal(capped.length, 1, "Cap de 800 eventos aplicado via setter");
}

const source = fs.readFileSync(path.join(__dirname, "../src/features/production/production-commands.js"), "utf8");
assert.ok(source.includes('title: id ? "Editar impressora" : "Cadastrar impressora"'), "Modal de impressora não pode depender de printerId livre");

console.log("Production commands: validação, pagamento, fila, prioridade, status, reimpressão, qualidade, impressora, pendência, eventos, código e material validados.");
