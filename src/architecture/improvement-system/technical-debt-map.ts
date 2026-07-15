export const technicalDebtMap = [
  {
    module: "global",
    item: "app.js concentra render, regras e fluxos",
    risk: "high",
    recommendation: "Extrair por modulo em fases pequenas, mantendo fallback e testes."
  },
  {
    module: "global",
    item: "style.css concentra muitos estilos legados",
    risk: "high",
    recommendation: "Migrar por contrato de componentes e tokens, sem reescrita global."
  },
  {
    module: "interface",
    item: "Fase 2 criou base visual parcial, mas nem todas as telas usam componentes oficiais",
    risk: "medium",
    recommendation: "Usar Estoque como tela piloto antes de migrar todo o sistema."
  }
];
