(function attachInventoryHandlers(global) {
  "use strict";
  async function saveQuickInventory(event, deps = {}) {
    event?.preventDefault?.();
    if (deps.locked()) {
      deps.toast("Atualização de estoque em andamento. Aguarde concluir.", "info", 2200);
      return;
    }
    deps.setLocked(true);
    let operation = "";
    try {
      if (deps.quantity() <= 0) {
        deps.toast("Informe uma quantidade maior que zero para atualizar o estoque.", "aviso", 3200);
        deps.focus("matQtd");
        return;
      }
      operation = deps.startOperation(event);
      const before = deps.snapshot();
      await deps.addMaterial();
      if (deps.snapshot() !== before) {
        deps.closePopup();
        deps.updateOperation(operation, { message: "Estoque atualizado.", progress: 100 });
        deps.completeOperation(operation, "Estoque atualizado");
        deps.toast("Estoque atualizado.", "sucesso", 2600);
      } else deps.completeOperation(operation, "Nenhuma alteração");
    } catch (error) {
      deps.failOperation(operation, error, "Erro ao atualizar");
      deps.toast("Não foi possível atualizar o estoque agora.", "erro", 4200);
      deps.diagnose(error);
    } finally {
      deps.setLocked(false);
    }
  }
  async function addMaterial(deps = {}) {
    if (!deps.permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar estoque.")) return;
    const nome = String(deps.documentRef.getElementById("matNome")?.value || "").trim();
    const tipo = String(deps.documentRef.getElementById("matTipo")?.value || "Geral").trim();
    const qtd = deps.documentRef.getElementById("matQtd")?.value;

    try {
      if (!nome) throw new deps.AppError("Nome obrigatório", { code: "INVENTORY_NAME_REQUIRED", userMessage: "Informe o nome do item." });
      if (!await deps.consumirCreditoAcaoFree("salvar_estoque", "salvar estoque")) return;
      deps.InventoryService.addMaterial({
        nome,
        categoria: tipo,
        tipo,
        tipoItem: deps.documentRef.getElementById("matItemType")?.value || "Matéria-prima",
        unidade: deps.documentRef.getElementById("matUnidade")?.value || "un",
        qtd,
        estoqueMinimo: deps.documentRef.getElementById("matMinimo")?.value || 0,
        custoUnitario: deps.documentRef.getElementById("matCusto")?.value || 0,
        fornecedor: deps.documentRef.getElementById("matFornecedor")?.value || "",
        observacoes: deps.documentRef.getElementById("matObservacoes")?.value || "",
        ativo: deps.documentRef.getElementById("matAtivo")?.value !== "false",
        isBatchControlled: deps.podeUsarControleRolosEstoque() && deps.documentRef.getElementById("matBatchControlled")?.checked === true,
        batchControlType: deps.documentRef.getElementById("matBatchType")?.value || "rolo",
        cor: ""
      });
      deps.registrarEventoUsoLocal("material_usado", { materialNome: nome, materialId: tipo, cor: "" });
      deps.agendarSyncSilenciosoDados("estoque-adicionado");
      deps.fecharPopup();
      deps.renderizarPreservandoScroll();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Estoque", action: "Adicionar material" });
    }
  }

  const api = Object.freeze({ saveQuickInventory, addMaterial });
  global.SimplificaInventoryHandlers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
