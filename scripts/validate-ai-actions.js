"use strict";
const registry = require("../src/ai/action-registry.js");
const orderUseCases = require("../src/ai-3d/order-shared-usecases.js");
const operationalUseCases = require("../src/ai-3d/operational-usecases.js");
const report = registry.validateRegistry();
const officialHandlers = {
  "EditOrderUseCase.prepare": typeof orderUseCases.EditOrderUseCase?.prototype?.prepare === "function",
  "EditOrderUseCase.commit": typeof orderUseCases.EditOrderUseCase?.prototype?.commit === "function",
  "CancelOrderUseCase.prepare": typeof orderUseCases.CancelOrderUseCase?.prototype?.prepare === "function",
  "CancelOrderUseCase.commit": typeof orderUseCases.CancelOrderUseCase?.prototype?.commit === "function"
};
for (const name of ["InventoryReserveUseCase", "InventoryReleaseUseCase", "InventoryConsumeUseCase", "CashWithdrawalUseCase", "CashDepositUseCase", "CashCloseSessionUseCase", "ProductionPrepareUseCase", "ProductionChangeStatusUseCase"]) {
  officialHandlers[`${name}.prepare`] = typeof operationalUseCases[name]?.prototype?.prepare === "function";
  officialHandlers[`${name}.commit`] = typeof operationalUseCases[name]?.prototype?.commit === "function";
}
for (const action of report.actions) {
  const symbol = action.state === registry.HEALTH.READY ? "✓" : action.state === registry.HEALTH.BROKEN ? "✗" : "-";
  console.log(`${symbol} ${action.id} [${action.state}]${action.errors.length ? ` ${action.errors.join(", ")}` : ""}`);
}
const totals = report.actions.reduce((all, action) => ({ ...all, [action.state]: (all[action.state] || 0) + 1 }), {});
console.log(`AI actions: ${JSON.stringify(totals)}`);
const missingOfficialHandlers = Object.entries(officialHandlers).filter(([, exists]) => !exists).map(([handler]) => handler);
if (missingOfficialHandlers.length) console.error(`Missing official UseCases: ${missingOfficialHandlers.join(", ")}`);
if (!report.ok || missingOfficialHandlers.length) process.exitCode = 1;
