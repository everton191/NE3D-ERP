const assert = require("assert");
const E = require("../src/ai-3d/order-create-executor.js");

function fixture(options = {}) {
  const state = { orders: [], cash: [], stock: 10, history: [] };
  let persisted = 0;
  let rollbackPersisted = 0;
  let releaseStock;
  const stockWait = options.waitStock ? new Promise((resolve) => { releaseStock = resolve; }) : null;
  const executor = new E.OrderCreateTransactionExecutor({
    captureState: () => JSON.parse(JSON.stringify(state)),
    restoreState: (snapshot) => Object.assign(state, snapshot),
    applyStock: async () => {
      if (stockWait) await stockWait;
      if (options.stockRejected) return false;
      state.stock -= 1;
      state.history.push("stock");
      return true;
    },
    commitOrder: (order) => {
      if (options.orderFailure) throw new Error("order failure");
      state.orders.push(order);
    },
    createCashReceipt: () => options.withCash === false ? null : ({ id: "cash-1", value: 4 }),
    commitCashReceipt: (receipt) => state.cash.push(receipt),
    persist: () => {
      if (options.persistFailure) throw new Error("persist failure");
      persisted += 1;
    },
    persistRollback: () => { rollbackPersisted += 1; },
    isCommitted: (key) => state.orders.some((order) => order.client_request_id === key)
  });
  return { state, executor, releaseStock, counters: () => ({ persisted, rollbackPersisted }) };
}

(async () => {
  const success = fixture();
  const command = { transactionKey: "order:1", order: { id: 1, client_request_id: "order:1" } };
  const committed = await success.executor.execute(command);
  assert.strictEqual(committed.status, E.STATUS.COMMITTED);
  assert.deepStrictEqual({ orders: success.state.orders.length, cash: success.state.cash.length, stock: success.state.stock }, { orders: 1, cash: 1, stock: 9 });
  assert.deepStrictEqual(success.counters(), { persisted: 1, rollbackPersisted: 0 });

  const duplicate = await success.executor.execute(command);
  assert.strictEqual(duplicate.status, E.STATUS.ALREADY_COMMITTED);
  assert.deepStrictEqual({ orders: success.state.orders.length, cash: success.state.cash.length, stock: success.state.stock }, { orders: 1, cash: 1, stock: 9 });

  const noCash = fixture({ withCash: false });
  assert.strictEqual((await noCash.executor.execute(command)).status, E.STATUS.COMMITTED);
  assert.strictEqual(noCash.state.cash.length, 0);

  for (const option of ["stockRejected", "orderFailure", "persistFailure"]) {
    const failed = fixture({ [option]: true });
    const before = JSON.stringify(failed.state);
    const result = await failed.executor.execute(command);
    assert.strictEqual(result.status, E.STATUS.ROLLED_BACK, option);
    assert.strictEqual(JSON.stringify(failed.state), before, `${option} deve restaurar todo o estado local`);
    assert.strictEqual(failed.counters().rollbackPersisted, 1, `${option} deve persistir a compensação`);
  }

  const concurrent = fixture({ waitStock: true });
  const first = concurrent.executor.execute(command);
  await Promise.resolve();
  const second = await concurrent.executor.execute(command);
  assert.strictEqual(second.status, E.STATUS.BLOCKED);
  assert.strictEqual(second.reason, "EXECUTION_IN_PROGRESS");
  concurrent.releaseStock();
  assert.strictEqual((await first).status, E.STATUS.COMMITTED);

  await assert.rejects(() => new E.OrderCreateTransactionExecutor().execute(command), /Executor indisponível/);
  console.log("ORDER.CREATE transaction executor: commit, idempotência, concorrência e rollback validados.");
})().catch((error) => { console.error(error); process.exit(1); });
