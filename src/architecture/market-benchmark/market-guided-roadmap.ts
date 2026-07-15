export type MarketRoadmapPhase = {
  phase: string;
  title: string;
  focus: string[];
};

export const marketGuidedRoadmap: MarketRoadmapPhase[] = [
  {
    phase: "phase-1",
    title: "Essencial operacional",
    focus: ["pedido completo", "estoque por rolo", "caixa simples", "producao manual", "loja publica estavel", "planos e permissoes auditados", "dashboard funcional"]
  },
  {
    phase: "phase-2",
    title: "Profissionalizacao",
    focus: ["historico completo", "relatorios basicos", "alertas", "reserva de estoque", "falha/reimpressao", "pedido vindo da loja", "logs"]
  },
  {
    phase: "phase-3",
    title: "Escala",
    focus: ["funcionarios", "multiplas sessoes", "relatorios avancados", "backup melhorado", "superadmin editavel", "feature flags", "integracao fiscal futura"]
  },
  {
    phase: "phase-4",
    title: "Avancado",
    focus: ["monitoramento de impressora", "integracoes externas", "automacoes avancadas", "BI", "marketplace", "marketing automatizado"]
  }
];
