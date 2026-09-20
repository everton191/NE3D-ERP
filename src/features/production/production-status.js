(function attachProductionStatus(global) {
  "use strict";
  const meta = Object.freeze({ novo_pedido: { label: "Novo pedido", group: "preparacao" }, em_analise: { label: "Em análise", group: "preparacao" }, pendente: { label: "Pendente", group: "pendencias" }, liberado_para_producao: { label: "Liberado", group: "fila" }, na_fila: { label: "Na fila", group: "fila" }, proximo: { label: "Próximo", group: "fila" }, aguardando_impressora: { label: "Aguardando impressora", group: "fila" }, em_impressao: { label: "Em impressão", group: "impressao" }, pausado: { label: "Pausado", group: "impressao" }, falhou: { label: "Falhou", group: "pendencias" }, reimpressao_necessaria: { label: "Reimpressão necessária", group: "pendencias" }, pos_processamento: { label: "Pós-processamento", group: "finalizacao" }, controle_qualidade: { label: "Controle de qualidade", group: "finalizacao" }, pronto_para_entrega: { label: "Pronto para entrega", group: "prontos" }, entregue: { label: "Entregue", group: "prontos" }, cancelado: { label: "Cancelado", group: "prontos" } });
  const getLabel = status => meta[status]?.label || "Em análise";
  const formatMinutes = (minutes = 0) => {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return hours ? `${hours}h${remainder ? ` ${remainder}min` : ""}` : `${remainder}min`;
  };
  const api = Object.freeze({ meta, getLabel, formatMinutes });
  global.SimplificaProductionStatus = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
