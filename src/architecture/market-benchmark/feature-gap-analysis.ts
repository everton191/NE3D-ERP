import type { ImprovementEffort, ImprovementPriority, ImprovementRisk, SuggestedPhase } from "./improvement-priority";

export type FeatureGapItem = {
  module: string;
  capability: string;
  marketExpected: boolean;
  simplificaStatus: "exists" | "partial" | "missing" | "future" | "not_recommended";
  priority: ImprovementPriority;
  risk: ImprovementRisk;
  effort: ImprovementEffort;
  suggestedPhase: SuggestedPhase;
  affectedModules: string[];
  dependencies: string[];
  rationale: string;
};

export const initialFeatureGapAnalysis: FeatureGapItem[] = [
  {
    module: "orders",
    capability: "pedido como centro do fluxo",
    marketExpected: true,
    simplificaStatus: "partial",
    priority: "essential",
    risk: "high",
    effort: "large",
    suggestedPhase: "now",
    affectedModules: ["orders", "stock", "production", "cash"],
    dependencies: ["status padronizados", "historico", "permissoes por plano"],
    rationale: "Pedidos precisam ligar orcamento, estoque, producao e caixa sem baixar estoque na calculadora."
  },
  {
    module: "stock",
    capability: "reserva, consumo e devolucao por rolo/material",
    marketExpected: true,
    simplificaStatus: "partial",
    priority: "essential",
    risk: "high",
    effort: "large",
    suggestedPhase: "now",
    affectedModules: ["stock", "orders", "production"],
    dependencies: ["pedido confirmado", "movimentacao com motivo"],
    rationale: "A fundacao de rolo/lote e movimentacoes existe; falta fechar reserva, consumo e devolucao pelo pedido/producao, nunca pela simulacao da calculadora."
  },
  {
    module: "production",
    capability: "capacidade, prazo e custo real na fila manual",
    marketExpected: true,
    simplificaStatus: "partial",
    priority: "essential",
    risk: "high",
    effort: "medium",
    suggestedPhase: "next",
    affectedModules: ["production", "orders", "stock"],
    dependencies: ["status de pedido", "estoque por rolo", "eventos de producao"],
    rationale: "A fila manual ja possui fundacao; o proximo ganho e prever capacidade e comparar custo estimado com o realizado."
  },
  {
    module: "store",
    capability: "pedido ou orcamento vindo da loja",
    marketExpected: true,
    simplificaStatus: "partial",
    priority: "important",
    risk: "high",
    effort: "large",
    suggestedPhase: "next",
    affectedModules: ["store", "orders", "plans"],
    dependencies: ["checklist de publicacao", "permissoes Start/Pro", "isolamento da loja"],
    rationale: "Loja deve receber pedido/orcamento sem virar e-commerce complexo nesta fase."
  },
  {
    module: "plans",
    capability: "feature gates auditaveis",
    marketExpected: true,
    simplificaStatus: "partial",
    priority: "essential",
    risk: "critical",
    effort: "large",
    suggestedPhase: "now",
    affectedModules: ["all"],
    dependencies: ["backend/RLS", "matriz Free/Start/Pro"],
    rationale: "Modo avancado nao pode liberar recurso pago; plano precisa seguir validacao central e backend."
  },
  {
    module: "production",
    capability: "monitoramento remoto de impressora",
    marketExpected: true,
    simplificaStatus: "future",
    priority: "future",
    risk: "critical",
    effort: "large",
    suggestedPhase: "later",
    affectedModules: ["production", "stock", "local-agent"],
    dependencies: ["Agente Local Simplifica", "rede local", "seguranca"],
    rationale: "Fica preparado, mas desativado, por exigir agente local e regras de rede/seguranca."
  }
];
