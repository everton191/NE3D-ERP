(function attachAndroidBackCases(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SimplificaAndroidBackCases = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createAndroidBackCases() {
  "use strict";

  // compile(context) may install functions in place or return their named references.
  async function run({ assert, compile }) {
    if (typeof assert?.equal !== "function" || typeof assert?.deepEqual !== "function" || typeof compile !== "function") {
      throw new TypeError("Android back cases require assert.equal, assert.deepEqual and compile(context)");
    }

    function createHarness({ screen = "pedidos", stack = [], detail = null, layer = false, store = false, native = false } = {}) {
      const calls = [];
      let clock = 10000;
      let layerOpen = layer;
      const context = {
        telaAtual: screen,
        telaAnterior: "dashboard",
        navigationStack: [...stack],
        pedidoVisualizandoId: detail,
        telas: { dashboard: true, pedidos: true, conta: true, config: true, preferencias: true, lojaPublica: true },
        window: {},
        Date: { now: () => clock },
        androidBackConfirmOpen: false,
        lastAndroidBackHandledAt: 0,
        lastDashboardBackPromptAt: 0,
        fecharCamadaAtualSeExistir: () => {
          if (!layerOpen) return false;
          layerOpen = false;
          calls.push(["close-layer"]);
          return true;
        },
        navegarVoltarLojaSeguroInterno: () => {
          if (!store) return false;
          calls.push(["store-back"]);
          return true;
        },
        trocarTela: (destination, options) => {
          calls.push(["navigate", destination, options]);
          context.telaAtual = destination;
          context.pedidoVisualizandoId = null;
          if (options?.resetStack) context.navigationStack = [];
        },
        atualizarHistoricoBrowserApp: (replace) => calls.push(["history", replace]),
        renderizarPreservandoScroll: () => calls.push(["close-detail-render"]),
        renderAppComTransicaoNavegacao: (direction) => calls.push(["transition", direction]),
        resetarScrollTelaAtiva: () => calls.push(["scroll"]),
        isAndroidNativeApp: () => native,
        solicitarConfirmacaoSaidaAndroid: async () => { calls.push(["confirm-exit"]); return false; },
        sairAplicativoAndroidConfirmado: () => { calls.push(["exit"]); return true; },
        mostrarToast: (message) => calls.push(["toast", message]),
        fetch: () => { throw new Error("No network is allowed in this test"); }
      };
      Object.assign(context, compile(context) || {});
      return { context, calls, advance: (ms) => { clock += ms; } };
    }

    const tests = [];
    const test = (name, run) => tests.push({ name, run });
    const snapshot = (value) => JSON.parse(JSON.stringify(value));

    for (const stack of [[], ["dashboard"], ["config", "pedidos"], ["missing-screen"]]) {
      test(`order detail closes before history, stack=${JSON.stringify(stack)}`, () => {
        const h = createHarness({ detail: "synthetic-order", stack });
        assert.equal(h.context.navegarVoltarSeguroInterno(), true);
        assert.equal(h.context.telaAtual, "pedidos");
        assert.equal(h.context.pedidoVisualizandoId, null);
        assert.equal(h.context.window.__pedidoDetalheFechado, true);
        assert.deepEqual(snapshot(h.context.navigationStack), stack, "closing detail must not consume history");
        assert.deepEqual(h.calls, [["close-detail-render"]]);
      });
    }

    test("a visible layer closes before the order detail", () => {
      const h = createHarness({ layer: true, detail: "synthetic-order", stack: ["dashboard"] });
      assert.equal(h.context.navegarVoltarSeguroInterno(), true);
      assert.equal(h.context.pedidoVisualizandoId, "synthetic-order");
      assert.deepEqual(h.calls, [["close-layer"], ["history", true]]);
      h.calls.length = 0;
      assert.equal(h.context.navegarVoltarSeguroInterno(), true);
      assert.equal(h.context.pedidoVisualizandoId, null);
      assert.deepEqual(h.calls, [["close-detail-render"]]);
    });

    test("storefront keeps its own back handler before generic history", () => {
      const h = createHarness({ screen: "lojaPublica", store: true, stack: ["config"] });
      assert.equal(h.context.navegarVoltarSeguroInterno(), true);
      assert.equal(h.context.telaAtual, "lojaPublica");
      assert.deepEqual(snapshot(h.context.navigationStack), ["config"]);
      assert.deepEqual(h.calls, [["store-back"]]);
    });

    test("dashboard root is not navigated by the internal back helper", () => {
      const h = createHarness({ screen: "dashboard" });
      assert.equal(h.context.navegarVoltarSeguroInterno(), false);
      assert.deepEqual(h.calls, []);
    });

    test("a valid screen history still consumes exactly one entry", () => {
      const h = createHarness({ stack: ["dashboard", "config"] });
      assert.equal(h.context.navegarVoltarSeguroInterno(), true);
      assert.equal(h.context.telaAtual, "config");
      assert.deepEqual(snapshot(h.context.navigationStack), ["dashboard"]);
      assert.deepEqual(h.calls, [["history", true], ["transition", "back"], ["scroll"]]);
    });

    for (const stack of [[], ["missing-screen"], ["preferencias"]]) {
      test(`missing or unusable history keeps parent fallback, stack=${JSON.stringify(stack)}`, () => {
        const h = createHarness({ screen: "preferencias", stack });
        assert.equal(h.context.navegarVoltarSeguroInterno(), true);
        assert.equal(h.context.telaAtual, "config");
        assert.deepEqual(snapshot(h.calls), [["navigate", "config", { resetStack: true, skipStack: true, replaceHistory: true }]]);
      });
    }

    test("closing a detail then going back consumes history only on the second action", () => {
      const h = createHarness({ detail: "synthetic-order", stack: ["dashboard"] });
      h.context.navegarVoltarSeguroInterno();
      h.context.navegarVoltarSeguroInterno();
      assert.equal(h.context.telaAtual, "dashboard");
      assert.deepEqual(snapshot(h.context.navigationStack), []);
      assert.deepEqual(h.calls, [["close-detail-render"], ["history", true], ["transition", "back"], ["scroll"]]);
    });

    test("repeated detail open/close cycles preserve route and stack", () => {
      const h = createHarness({ stack: ["dashboard"] });
      for (let index = 0; index < 5; index += 1) {
        h.context.pedidoVisualizandoId = `synthetic-order-${index}`;
        assert.equal(h.context.navegarVoltarSeguroInterno(), true);
        assert.equal(h.context.pedidoVisualizandoId, null);
        assert.equal(h.context.telaAtual, "pedidos");
        assert.deepEqual(snapshot(h.context.navigationStack), ["dashboard"]);
      }
      assert.deepEqual(h.calls, Array.from({ length: 5 }, () => ["close-detail-render"]));
    });

    test("native back closes detail without starting an exit confirmation", async () => {
      const h = createHarness({ native: true, detail: "synthetic-order" });
      let prevented = 0;
      assert.equal(await h.context.handleAndroidBackPress({ source: "native-main-activity", event: { preventDefault: () => { prevented += 1; } } }), true);
      assert.equal(prevented, 1);
      assert.equal(h.context.telaAtual, "pedidos");
      assert.equal(h.context.pedidoVisualizandoId, null);
      assert.deepEqual(h.calls, [["close-detail-render"]]);
      h.calls.length = 0;
      assert.equal(await h.context.handleAndroidBackPress({ source: "capacitor-back" }), true);
      assert.deepEqual(h.calls, [], "duplicate native delivery must remain throttled");
      h.advance(500);
      await h.context.handleAndroidBackPress({ source: "capacitor-back" });
      assert.equal(h.context.telaAtual, "dashboard");
      assert.deepEqual(snapshot(h.calls), [["navigate", "dashboard", { resetStack: true, skipStack: true, replaceHistory: true }]]);
    });

    test("native dashboard still asks before exiting and honors cancellation", async () => {
      const h = createHarness({ screen: "dashboard", native: true });
      assert.equal(await h.context.handleAndroidBackPress({ source: "native-main-activity" }), true);
      assert.equal(h.context.telaAtual, "dashboard");
      assert.deepEqual(h.calls, [["history", true], ["confirm-exit"], ["toast", "Saída cancelada."], ["history", true]]);
    });

    test("web dashboard does not ask to exit the native app", async () => {
      const h = createHarness({ screen: "dashboard" });
      assert.equal(await h.context.handleAndroidBackPress({ source: "popstate" }), true);
      assert.deepEqual(h.calls, [["history", true]]);
    });

    const failures = [];
    for (const { name, run: runCase } of tests) {
      try { await runCase(); }
      catch (error) { failures.push({ name, message: String(error?.message || error).split("\n")[0] }); }
    }
    return { passed: tests.length - failures.length, total: tests.length, failures };
  }

  return Object.freeze({ run });
});
