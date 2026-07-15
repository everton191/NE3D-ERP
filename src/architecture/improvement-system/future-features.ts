import type { ImprovementRecord } from "./improvement-rules";

export const futureFeatures: ImprovementRecord[] = [
  {
    title: "Monitoramento automatico de impressoras",
    module: "production",
    problem: "Exige agente local, rede e seguranca dedicados.",
    currentRisk: "critical",
    suggestion: "Manter desativado ate existir Agente Local Simplifica com instalador e diagnostico.",
    priority: "future",
    effort: "large",
    dependencies: ["Agente Local Simplifica", "RLS", "diagnostico guiado"],
    status: "waiting_dependency"
  },
  {
    title: "Checkout completo da loja",
    module: "store",
    problem: "Pode aumentar complexidade antes do pedido/orcamento da loja estar estavel.",
    currentRisk: "high",
    suggestion: "Priorizar pedido/orcamento via loja e WhatsApp antes de checkout completo.",
    priority: "future",
    effort: "large",
    dependencies: ["pedido vindo da loja", "pagamentos sandbox"],
    status: "planned"
  }
];
