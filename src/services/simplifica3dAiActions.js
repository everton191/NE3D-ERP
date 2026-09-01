(function attachSimplifica3dAiActions(global) {
  "use strict";

  const ACTIONS = Object.freeze({
    "chat": Object.freeze({ requiresConfirmation: false, fields: ["answer"] }),
    "pedido.criar": Object.freeze({ requiresConfirmation: true, fields: ["cliente", "itens"] }),
    "pedido.status": Object.freeze({ requiresConfirmation: true, fields: ["pedidoId", "status"] }),
    "estoque.entrada": Object.freeze({ requiresConfirmation: true, fields: ["material", "quantidade"] }),
    "estoque.consultar": Object.freeze({ requiresConfirmation: false, fields: ["consulta"] }),
    "caixa.lancar": Object.freeze({ requiresConfirmation: true, fields: ["tipo", "valor", "descricao"] }),
    "caixa.consultar": Object.freeze({ requiresConfirmation: false, fields: [] }),
    "producao.status": Object.freeze({ requiresConfirmation: false, fields: ["consulta"] }),
    "navegar": Object.freeze({ requiresConfirmation: false, fields: ["tela"] }),
    "navigation.open": Object.freeze({ requiresConfirmation: false, fields: ["tela"] }),
    "orders.search": Object.freeze({ requiresConfirmation: false, fields: ["query", "status", "customer"] }),
    "orders.get": Object.freeze({ requiresConfirmation: false, fields: ["order_id"] }),
    "customers.search": Object.freeze({ requiresConfirmation: false, fields: ["query"] }),
    "inventory.search": Object.freeze({ requiresConfirmation: false, fields: ["query", "status"] }),
    "cash.get_summary": Object.freeze({ requiresConfirmation: false, fields: ["period"] }),
    "production.list_queue": Object.freeze({ requiresConfirmation: false, fields: ["status"] }),
    "calculator.quote": Object.freeze({ requiresConfirmation: false, fields: ["weight_grams", "time_minutes", "quantity"] }),
    "products.search": Object.freeze({ requiresConfirmation: false, fields: ["query"] }),
    "printers.search": Object.freeze({ requiresConfirmation: false, fields: ["query", "status"] }),
    "reports.open": Object.freeze({ requiresConfirmation: false, fields: [] })
  });

  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(String(value).replace(",", ".")); return Number.isFinite(parsed) ? parsed : NaN; }
  function normalize(action) {
    const type = text(action?.type).toLowerCase();
    if (!ACTIONS[type]) throw new Error("Ação de IA não autorizada.");
    const payload = action?.payload && typeof action.payload === "object" ? { ...action.payload } : {};
    if (type === "chat") {
      payload.answer = text(payload.answer);
      if (!payload.answer) throw new Error("A IA não retornou uma resposta.");
    }
    if (type === "caixa.lancar") {
      payload.tipo = text(payload.tipo).toLowerCase();
      payload.valor = number(payload.valor);
      payload.descricao = text(payload.descricao);
      if (!["entrada", "saida"].includes(payload.tipo) || !(payload.valor > 0) || !payload.descricao) throw new Error("Lançamento de caixa incompleto.");
    }
    if (type === "estoque.entrada") {
      payload.material = text(payload.material); payload.quantidade = number(payload.quantidade);
      if (!payload.material || !(payload.quantidade > 0)) throw new Error("Entrada de estoque incompleta.");
    }
    if (type === "pedido.criar") {
      payload.cliente = text(payload.cliente); payload.itens = Array.isArray(payload.itens) ? payload.itens.filter(Boolean) : [];
      if (!payload.cliente || !payload.itens.length) throw new Error("Pedido precisa de cliente e pelo menos um item.");
    }
    return Object.freeze({ type, payload, requiresConfirmation: ACTIONS[type].requiresConfirmation });
  }

  function preview(action) {
    const command = normalize(action);
    let summary = "";
    switch (command.type) {
      case "chat": summary = command.payload.answer; break;
      case "pedido.criar": summary = `Criar pedido para ${command.payload.cliente} com ${command.payload.itens.length} item(ns)`; break;
      case "pedido.status": summary = `Alterar status do pedido ${text(command.payload.pedidoId)} para ${text(command.payload.status)}`; break;
      case "estoque.entrada": summary = `Adicionar ${command.payload.quantidade} ao estoque de ${command.payload.material}`; break;
      case "estoque.consultar": summary = `Consultar estoque: ${text(command.payload.consulta) || "geral"}`; break;
      case "caixa.lancar": summary = `${command.payload.tipo === "saida" ? "Registrar saída" : "Registrar entrada"} de R$ ${command.payload.valor.toFixed(2)}: ${command.payload.descricao}`; break;
      case "caixa.consultar": summary = "Consultar resumo do caixa"; break;
      case "producao.status": summary = `Consultar produção: ${text(command.payload.consulta) || "geral"}`; break;
      case "navegar": summary = `Abrir ${text(command.payload.tela)}`; break;
      case "navigation.open": summary = `Abrir ${text(command.payload.tela)}`; break;
      case "orders.search": summary = "Consultar pedidos"; break;
      case "orders.get": summary = `Consultar pedido ${text(command.payload.order_id)}`; break;
      case "customers.search": summary = "Consultar clientes"; break;
      case "inventory.search": summary = "Consultar estoque"; break;
      case "cash.get_summary": summary = "Consultar resumo do caixa"; break;
      case "production.list_queue": summary = "Consultar fila de produção"; break;
      case "calculator.quote": summary = "Calcular orçamento"; break;
      case "products.search": summary = "Consultar produtos"; break;
      case "printers.search": summary = "Consultar impressoras"; break;
      case "reports.open": summary = "Abrir relatórios"; break;
      default: throw new Error("Ação de IA não autorizada.");
    }
    return Object.freeze({ ...command, summary });
  }

  global.Simplifica3dAiActions = Object.freeze({ actions: ACTIONS, normalize, preview });
})(window);
