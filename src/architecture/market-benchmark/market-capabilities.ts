export type MarketCapabilityModule =
  | "dashboard"
  | "orders"
  | "stock"
  | "production"
  | "cash"
  | "store"
  | "plans"
  | "profile"
  | "reports"
  | "superadmin";

export type MarketCapabilityMap = Record<MarketCapabilityModule, string[]>;

export const marketCapabilities: MarketCapabilityMap = {
  dashboard: [
    "resumo operacional",
    "atalhos principais",
    "alertas",
    "indicadores do dia",
    "estado do caixa",
    "pedidos recentes"
  ],
  orders: [
    "orcamento",
    "aprovacao",
    "pedido confirmado",
    "status",
    "prazo",
    "pagamento",
    "historico",
    "anexos",
    "observacoes internas",
    "duplicar pedido",
    "ligacao com estoque",
    "ligacao com producao",
    "ligacao com caixa",
    "pos-venda"
  ],
  stock: [
    "saldo atual",
    "movimentacoes",
    "historico",
    "lote ou rolo",
    "material",
    "cor",
    "custo",
    "ponto de reposicao",
    "alerta de estoque baixo",
    "reserva para pedido",
    "ajuste manual com motivo",
    "relatorio de consumo",
    "inventario"
  ],
  production: [
    "fila de producao",
    "impressora",
    "responsavel",
    "prioridade",
    "status",
    "tempo estimado",
    "tempo real",
    "falha",
    "reimpressao",
    "consumo de material",
    "historico",
    "relatorio de eficiencia"
  ],
  cash: [
    "entrada parcial",
    "pagamento total",
    "valor pendente",
    "formas de pagamento",
    "sangria",
    "suprimento",
    "fechamento",
    "historico",
    "relatorio diario",
    "conciliacao futura"
  ],
  store: [
    "vitrine publica",
    "produtos",
    "categorias",
    "fotos",
    "preco",
    "produto indisponivel",
    "botao WhatsApp",
    "pedido ou orcamento vindo da loja",
    "checklist de publicacao",
    "compartilhamento",
    "historico de visualizacao",
    "tema claro",
    "SEO basico"
  ],
  plans: [
    "limites por plano",
    "feature gates",
    "bloqueio de publicacao",
    "tela de upgrade",
    "anuncio no plano gratuito",
    "recursos Start",
    "recursos Pro",
    "fallback para Free ao cancelar",
    "auditoria de acesso"
  ],
  profile: [
    "dados pessoais",
    "troca de senha",
    "modo de uso da interface",
    "seguranca",
    "exclusao de conta",
    "sessoes e dispositivos",
    "preferencias"
  ],
  reports: [
    "resumo diario",
    "periodos",
    "filtros",
    "exportacao",
    "indicadores de pedidos",
    "indicadores de caixa",
    "consumo de estoque",
    "relatorios avancados por plano"
  ],
  superadmin: [
    "gestao de empresas",
    "gestao de planos",
    "metricas gerais",
    "configuracao de limites",
    "logs",
    "usuarios",
    "controle de recursos ativos",
    "feature flags"
  ]
};
