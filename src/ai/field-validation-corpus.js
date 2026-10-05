(function attachFieldValidationCorpus(global) {
  "use strict";

  const make = (prefix, fields, rows) => rows.map((row, index) => Object.freeze({
    id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
    rawInput: row[0],
    expectedIntent: row[1],
    expectedTool: row[2] || "",
    expectedFields: Object.freeze(row[3] || {}),
    evaluatedFields: Object.freeze(fields),
    context: Object.freeze(row[4] || {}),
    activeWorkflow: row[5] || "",
    split: "field-validation"
  }));

  const cases = Object.freeze([
    ...make("field-target", ["target"], [
      ["abre estoque", "navigation.open", "navigation.open", { target: "estoque" }],
      ["vai para o caixa", "navigation.open", "navigation.open", { target: "caixa" }],
      ["quero abrir produção", "navigation.open", "navigation.open", { target: "producao" }],
      ["mostra a tela de pedidos", "navigation.open", "navigation.open", { target: "pedidos" }],
      ["abre o início", "navigation.open", "navigation.open", { target: "inicio" }],
      ["navega pra calculadora", "navigation.open", "navigation.open", { target: "calculadora" }],
      ["consulta pedido 321", "orders.get", "orders.get", {}],
      ["o estoque está baixo", "inventory.low_stock", "", {}]
    ]),
    ...make("field-material", ["materialName"], [
      ["quanto tem de PLA preto", "inventory.get_stock", "inventory.get_stock", { materialName: "PLA preto" }],
      ["de PETG branco tem quanto", "inventory.get_stock", "inventory.get_stock", { materialName: "PETG branco" }],
      ["vc tem ABS vermelho", "inventory.get_stock", "inventory.get_stock", { materialName: "ABS vermelho" }],
      ["consulta o estoque de PLA azul", "inventory.get_stock", "inventory.get_stock", { materialName: "PLA azul" }],
      ["tem pla cinza aí", "inventory.get_stock", "inventory.get_stock", { materialName: "pla cinza aí" }],
      ["quanto tenho de petg natural?", "inventory.get_stock", "inventory.get_stock", { materialName: "petg natural" }],
      ["tem plástico preto", "inventory.search", "inventory.search", {}],
      ["pedido da Pla", "orders.get", "orders.get", {}]
    ]),
    ...make("field-query", ["query"], [
      ["procura PLA preto", "inventory.search", "inventory.search", { query: "PLA preto" }],
      ["busca por PETG azul", "inventory.search", "inventory.search", { query: "PETG azul" }],
      ["pesquisa ABS natural no estoque", "inventory.search", "inventory.search", { query: "ABS natural" }],
      ["encontra filamento branco", "inventory.search", "inventory.search", { query: "filamento branco" }],
      ["quero localizar resina cinza", "inventory.search", "inventory.search", { query: "resina cinza" }],
      ["no estoque procura nylon", "inventory.search", "inventory.search", { query: "nylon" }],
      ["qual a previsão do tempo", "", "", {}],
      ["abre a busca", "navigation.open", "navigation.open", {}]
    ]),
    ...make("field-order", ["orderNumber", "customerName"], [
      ["abre pedido da Maria", "orders.get", "orders.get", { customerName: "Maria" }],
      ["abre pedido do João", "orders.get", "orders.get", { customerName: "João" }],
      ["abre o pedido da Maria", "orders.get", "orders.get", { customerName: "Maria" }],
      ["pedido para Roberta", "orders.get", "orders.get", { customerName: "Roberta" }],
      ["mostra o pedido da Ana", "orders.get", "orders.get", { customerName: "Ana" }],
      ["consulta pedido do José", "orders.get", "orders.get", { customerName: "José" }],
      ["abre pedido 123", "orders.get", "orders.get", { orderNumber: "123" }],
      ["pedido #44", "orders.get", "orders.get", { orderNumber: "44" }],
      ["consulta o pedido 9001", "orders.get", "orders.get", { orderNumber: "9001" }],
      ["pedido 123 da Maria", "orders.get", "orders.get", { orderNumber: "123", customerName: "Maria" }],
      ["abre pedido abc", "orders.get", "orders.get", {}],
      ["abre pedido da impressora", "orders.get", "orders.get", {}]
    ]),
    ...make("field-order-create", ["customerName", "description", "quantity", "unitPrice"], [
      ["faz 3 chaveiros pra Maria 12 cada", "orders.create", "orders.create", { customerName: "Maria", description: "chaveiro", quantity: 3, unitPrice: 12 }],
      ["quero 5 suportes para João a 15 reais", "orders.create", "orders.create", { customerName: "João", description: "suporte", quantity: 5, unitPrice: 15 }],
      ["2 vasos por 20 cada pra Ana", "orders.create", "orders.create", { customerName: "Ana", description: "vaso", quantity: 2, unitPrice: 20 }],
      ["para Carla faz 4 miniaturas a 8 reais", "orders.create", "orders.create", { customerName: "Carla", description: "miniatura", quantity: 4, unitPrice: 8 }],
      ["novo pedido Maria 6 chaveiros 10 reais", "orders.create", "orders.create", { customerName: "Maria", description: "chaveiro", quantity: 6, unitPrice: 10 }],
      ["pedido pra Roberta com 2 porta escovinha de 18 reais", "orders.create", "orders.create", { customerName: "Roberta", description: "porta escovinha", quantity: 2, unitPrice: 18 }],
      ["faz um suporte pra Bia", "orders.create", "orders.create", { customerName: "Bia", description: "suporte", quantity: 1 }],
      ["faz 12 peças para Luís", "orders.create", "orders.create", { customerName: "Luís", description: "peça", quantity: 12 }],
      ["faz pedido pra Maria", "orders.create", "orders.create", { customerName: "Maria" }],
      ["adiciona mais 2 nesse pedido", "orders.create", "orders.create", { quantity: 2 }, {}, "orders.create"],
      ["faz zero chaveiros pra Maria", "orders.create", "orders.create", { customerName: "Maria", description: "chaveiro", quantity: 0 }],
      ["faz chaveiros por doze reais", "orders.create", "orders.create", { description: "chaveiro" }],
      ["pedido da Maria custa caro", "orders.get", "orders.get", { customerName: "Maria" }],
      ["Maria tem 3 pedidos", "orders.list", "orders.list", {}]
    ]),
    ...make("field-calculation", ["weightGrams", "timeMinutes"], [
      ["calcula 120g por 2h", "calculator.calculate", "calculator.calculate", { weightGrams: 120, timeMinutes: 120 }],
      ["150 gramas e 45 minutos", "calculator.calculate", "calculator.calculate", { weightGrams: 150, timeMinutes: 45 }],
      ["faz o cálculo com 1kg e 3 horas", "calculator.calculate", "calculator.calculate", { weightGrams: 1000, timeMinutes: 180 }],
      ["200g por 1h30", "calculator.calculate", "calculator.calculate", { weightGrams: 200, timeMinutes: 90 }],
      ["leva 30min e pesa 80g", "calculator.calculate", "calculator.calculate", { weightGrams: 80, timeMinutes: 30 }],
      ["peso 0g tempo 0min", "calculator.calculate", "calculator.calculate", { weightGrams: 0, timeMinutes: 0 }],
      ["calcula 2 horas", "calculator.calculate", "calculator.calculate", { timeMinutes: 120 }],
      ["calcula 500 gramas", "calculator.calculate", "calculator.calculate", { weightGrams: 500 }],
      ["o pedido pesa muito", "orders.get", "orders.get", {}],
      ["demorou bastante tempo", "", "", {}]
    ])
  ]);

  const api = Object.freeze({ datasetId: "field-validation-v1", version: "1.0.0", cases });
  global.SimplificaFieldValidationCorpus = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
