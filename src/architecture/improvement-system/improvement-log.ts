import type { ImprovementRecord } from "./improvement-rules";

export const improvementLog: ImprovementRecord[] = [
  {
    title: "Auditoria da interface fase 2",
    module: "interface",
    problem: "Componentes e telas existem parcialmente, mas nem tudo segue a mesma governanca.",
    currentRisk: "medium",
    suggestion: "Auditar telas principais, escolher tela piloto e migrar gradualmente.",
    priority: "essential",
    effort: "medium",
    dependencies: ["docs/quality/interface-phase-2-audit.md", "docs/quality/screen-inventory.md"],
    status: "planned"
  }
];
