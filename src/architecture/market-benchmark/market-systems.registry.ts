export type MarketReferenceSystem = {
  id: string;
  name: string;
  category: string;
  usefulFor: string[];
  keyCapabilities: string[];
  complexityRisk: string;
  simplificaAdaptation: string;
};

export const marketSystemsRegistry: Record<string, MarketReferenceSystem> = {
  odoo: {
    id: "odoo",
    name: "Odoo",
    category: "ERP completo",
    usefulFor: ["pedidos", "estoque", "producao", "financeiro", "loja", "relatorios"],
    keyCapabilities: ["ordens de trabalho", "estoque", "manufatura", "ponto de venda", "e-commerce", "relatorios"],
    complexityRisk: "Copiar fluxo completo de manufatura pode deixar o Simplifica pesado para pequenos negocios.",
    simplificaAdaptation: "Usar como referencia de maturidade para pedido, estoque, producao manual e relatorios, mantendo fluxos curtos."
  },
  zohoInventory: {
    id: "zohoInventory",
    name: "Zoho Inventory",
    category: "Estoque e pedidos",
    usefulFor: ["estoque", "pedidos", "movimentacoes", "alertas"],
    keyCapabilities: ["saldo", "historico", "ponto de reposicao", "multicanal", "embalagem", "envio"],
    complexityRisk: "Recursos logisticos avancados podem ser exagerados para a fase atual.",
    simplificaAdaptation: "Priorizar historico de estoque, alertas, reserva por pedido e ajuste manual com motivo."
  },
  blingTinyOlist: {
    id: "blingTinyOlist",
    name: "Bling, Tiny e Olist",
    category: "ERP brasileiro",
    usefulFor: ["pedidos", "estoque", "financeiro", "loja", "planos"],
    keyCapabilities: ["pedidos", "estoque", "financeiro", "nota fiscal", "loja virtual", "integracoes"],
    complexityRisk: "Integracao fiscal e marketplace devem ficar para fases futuras.",
    simplificaAdaptation: "Usar como referencia nacional para fluxo simples de pedido, caixa, estoque e loja."
  },
  printavo: {
    id: "printavo",
    name: "Printavo",
    category: "Gestao de grafica/oficina",
    usefulFor: ["orcamentos", "pedidos", "producao", "pagamentos", "agenda"],
    keyCapabilities: ["orcamento", "aprovacao", "agenda", "faturas", "pagamentos", "status de producao"],
    complexityRisk: "Agenda e aprovacao completa podem criar etapas demais se aplicadas sem faseamento.",
    simplificaAdaptation: "Aproveitar pedido como centro do fluxo: orcamento, aprovacao, pagamento, producao e entrega."
  },
  simplyPrint: {
    id: "simplyPrint",
    name: "SimplyPrint",
    category: "Impressao 3D",
    usefulFor: ["producao", "fila", "impressoras", "monitoramento"],
    keyCapabilities: ["fila de impressao", "status", "monitoramento", "arquivos", "impressoras"],
    complexityRisk: "Integracao automatica com impressoras exige agente/local network e deve permanecer futura.",
    simplificaAdaptation: "Comecar com fila manual, status de producao, impressora usada e historico."
  },
  shopifyNuvemshop: {
    id: "shopifyNuvemshop",
    name: "Shopify e Nuvemshop",
    category: "Loja virtual",
    usefulFor: ["lojaPublica", "lojaAdmin", "produtos", "categorias", "pedidosOnline"],
    keyCapabilities: ["vitrine", "produtos", "categorias", "fotos", "estoque", "checkout", "compartilhamento"],
    complexityRisk: "Checkout complexo, marketplace e marketing automatizado podem fugir do publico atual.",
    simplificaAdaptation: "Manter loja clara com produtos, fotos, categorias, WhatsApp, checklist e pedido/orcamento vindo da vitrine."
  }
};
