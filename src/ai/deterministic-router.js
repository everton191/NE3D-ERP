(function attachSimplificaDeterministicRouter(global) {
  "use strict";

  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const has = (text, pattern) => pattern.test(text);
  const numberFrom = (match) => match ? Number(String(match[1]).replace(",", ".")) : null;
  const result = (intent, functionId, args = {}, missing = []) => Object.freeze({
    kind: "TOOL_CALL", tool: functionId, arguments: Object.freeze(args), intent,
    confidence: 1, reason: "DETERMINISTIC_INTENT", missing: Object.freeze(missing),
    diagnostics: Object.freeze({ backend: "deterministic-router", modelInvoked: false })
  });

  const NAVIGATION = Object.freeze([
    ["pedidos", /\bpedidos?\b/], ["estoque", /\b(?:estoque|inventario)\b/], ["caixa", /\bcaixa\b/],
    ["producao", /\b(?:producao|fila de impressao)\b/], ["clientes", /\bclientes?\b/],
    ["calculadora", /\bcalculadora\b/], ["impressoras", /\bimpressoras?\b/],
    ["relatorios", /\brelatorios?\b/], ["home", /\b(?:home|inicio|tela principal)\b/]
  ]);

  function navigation(text) {
    if (!/^(?:abre|abrir|abra|ir|vai|va|navega|navegar|me leva)(?:-me)?\b/.test(text)) return null;
    const targets = NAVIGATION.filter(([, pattern]) => pattern.test(text));
    return targets.length === 1 ? result("navigation.open", "navigation.open", { tela: targets[0][0] }) : null;
  }

  function quoteArguments(text) {
    const weight = numberFrom(text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gramas?)\b/));
    const hours = numberFrom(text.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hora|horas)\b/));
    const minutes = numberFrom(text.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minuto|minutos)\b/));
    const quantity = numberFrom(text.match(/\b(\d+)\s*(?:pecas?|unidades?|itens?)\b/));
    const args = {};
    if (weight !== null) args.weight_grams = weight;
    if (hours !== null || minutes !== null) args.time_minutes = Math.round((hours || 0) * 60 + (minutes || 0));
    if (quantity !== null) args.quantity = quantity;
    else args.quantity = 1;
    return { args, missing: ["weight_grams", "time_minutes", "quantity"].filter((key) => args[key] == null) };
  }

  function resolve(input, context = {}) {
    const text = normalize(input)
      .replace(/^vi\s+pr\b/, "vai pro")
      .replace(/\bqunto\s+cust\b/, "quanto custa")
      .replace(/\bdus\s+hors\b/, "2 horas");
    if (!text) return null;
    const directNavigation = navigation(text);
    if (directNavigation) return directNavigation;

    if (has(text, /\b(?:saldo|resumo|quanto (?:tem|ha))\b.*\bcaixa\b|\bcaixa\b.*\b(?:saldo|hoje|entradas?|saidas?)\b/)) {
      return result("cash.summary", "cash.get_summary", { period: /\bhoje\b/.test(text) ? "today" : "all" });
    }
    if (has(text, /\b(?:fila|producao|impressao pendente|o que imprimir)\b/) && has(text, /\b(?:mostra|mostrar|lista|listar|qual|quais|o que|status|tem)\b/)) {
      return result("production.queue", "production.list_queue", { status: /pendente/.test(text) ? "pending" : "all" });
    }
    if (has(text, /\bimpressoras?\b/) && has(text, /\b(?:busca|buscar|procura|procurar|qual|quais|status|imprimindo|rodando)\b/)) {
      return result("printers.search", "printers.search", { query: text, status: /imprimindo|rodando/.test(text) ? "printing" : "" });
    }
    if (has(text, /\b(?:calcula|calcular|orcamento|quanto custa|preco)\b/)) {
      if (/^(?:faz|fazer)?\s*(?:um\s+)?orcamento\??$/.test(text)) return null;
      const quote = quoteArguments(text);
      return result("calculator.quote", "calculator.quote", quote.args, quote.missing);
    }
    const orderId = text.match(/\b(?:pedido|ordem|encomenda)\s*#?\s*(\d+)\b/);
    if (orderId && has(text, /\b(?:mostra|mostrar|ver|abre|abrir|busca|buscar|procura|procurar|status|detalhes?)\b/)) {
      return result("orders.get", "orders.get", { order_id: orderId[1] });
    }
    if (has(text, /\b(?:pedido|pedidos|ordem|ordens|encomenda|encomendas)\b/) && has(text, /\b(?:busca|buscar|procura|procurar|mostra|mostrar|lista|listar|atrasad)\w*\b/)) {
      return result("orders.search", "orders.search", { query: text });
    }
    if (has(text, /\bclientes?\b/) && has(text, /\b(?:busca|buscar|procura|procurar|mostra|mostrar|dados|telefone)\b/)) {
      return result("customers.search", "customers.search", { query: text.replace(/^.*?\bcliente\b/, "").trim() || text });
    }
    if (has(text, /\b(?:estoque|inventario|filamento|material|pla|abs|rolo)\b/) && has(text, /\b(?:busca|buscar|procura|procurar|mostra|mostrar|quanto|tem|baixo|acabando)\b/)) {
      return result("inventory.search", "inventory.search", { query: text });
    }
    if (has(text, /\bprodutos?\b/) && has(text, /\b(?:busca|buscar|procura|procurar|mostra|mostrar)\b/)) {
      return result("products.search", "products.search", { query: text.replace(/^.*?\bproduto\b/, "").trim() || text });
    }
    if (has(text, /\brelatorios?\b/) && has(text, /\b(?:abre|abrir|ver|mostra|mostrar)\b/)) {
      return result("reports.open", "reports.open", {});
    }
    if (/^(?:status|situacao)\b/.test(text)) {
      const screen = normalize(context.screen || "");
      if (screen.includes("produc")) return result("production.queue", "production.list_queue", { status: "all" });
      if (screen.includes("caixa")) return result("cash.summary", "cash.get_summary", { period: "all" });
    }
    return null;
  }

  const api = Object.freeze({ normalize, resolve, quoteArguments });
  global.SimplificaDeterministicRouter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
