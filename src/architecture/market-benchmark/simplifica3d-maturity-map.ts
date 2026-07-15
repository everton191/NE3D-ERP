export type MaturityStatus = "initial" | "functional_incomplete" | "mature" | "advanced";

export type ModuleMaturity = {
  module: string;
  score: number;
  status: MaturityStatus;
  rationale: string;
  nextFocus: string[];
};

export function getMaturityStatus(score: number): MaturityStatus {
  if (score <= 30) return "initial";
  if (score <= 60) return "functional_incomplete";
  if (score <= 80) return "mature";
  return "advanced";
}

export const simplifica3dMaturityMap: ModuleMaturity[] = [
  { module: "Dashboard", score: 58, status: "functional_incomplete", rationale: "Funcional, mas ainda precisa virar modelo oficial de template e estados.", nextFocus: ["template oficial", "cards padronizados", "alertas"] },
  { module: "Pedidos", score: 55, status: "functional_incomplete", rationale: "Existe base operacional, mas ainda precisa consolidar status, historico e ligacao segura com estoque/producao/caixa.", nextFocus: ["status", "historico", "materiais do estoque no pedido"] },
  { module: "Estoque", score: 52, status: "functional_incomplete", rationale: "Base de lista e rolo em evolucao, ainda sem historico completo e regras finais por pedido/producao.", nextFocus: ["movimentacoes", "rolo/lote", "alertas", "ajuste com motivo"] },
  { module: "Caixa", score: 56, status: "functional_incomplete", rationale: "Resumo e movimentos existem, mas botoes/acoes precisam de auditoria de funcao e layout.", nextFocus: ["acoes compactas", "historico", "fechamento"] },
  { module: "Producao", score: 45, status: "functional_incomplete", rationale: "Caminho manual existe parcialmente, impressoras automaticas estao desativadas.", nextFocus: ["fila manual", "status", "responsavel", "vinculo com pedido"] },
  { module: "Loja", score: 64, status: "mature", rationale: "Loja/editor receberam isolamento e V3, mas pedido vindo da loja e validacao real ainda precisam fase propria.", nextFocus: ["pedido/orcamento", "checklist", "publicacao por plano"] },
  { module: "Planos", score: 62, status: "mature", rationale: "Regras Start/Pro/Free estao bem mapeadas, mas exigem auditoria continua por feature nova.", nextFocus: ["feature gates", "RLS", "loja por status de assinatura"] },
  { module: "Superadmin", score: 54, status: "functional_incomplete", rationale: "Existe gestao, mas precisa separar empresas/clientes/usuarios e reduzir funcoes que nao sao do contexto.", nextFocus: ["empresas SaaS", "usuarios por tenant", "logs"] },
  { module: "Relatorios", score: 44, status: "functional_incomplete", rationale: "Ha tela e filtros, mas cards/compactacao e relatorios avancados ainda precisam padronizacao.", nextFocus: ["cards compactos", "exportacao", "filtros"] },
  { module: "Perfil", score: 50, status: "functional_incomplete", rationale: "Modo de uso e seguranca existem parcialmente, mas scroll e separacao de conta/admin ainda exigem varredura.", nextFocus: ["scroll", "senha", "modo de uso", "exclusao de conta"] }
];
