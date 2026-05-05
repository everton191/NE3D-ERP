const assert = require("assert");

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear()
  };
}

global.localStorage = createMemoryStorage();
global.Capacitor = { Plugins: {} };

const AdMobService = require("../src/services/adMobService.js");
const MonetizationLimits = require("../src/services/monetizationLimits.js");

let now = Date.parse("2026-05-04T12:00:00.000Z");
let interstitialShows = 0;
let rewardedShows = 0;
let failRewarded = false;

const mockPlugin = {
  initialize: async () => ({ ok: true }),
  prepareRewardVideoAd: async () => {
    if (failRewarded) throw new Error("rewarded failed");
    return { ok: true };
  },
  showRewardVideoAd: async () => {
    if (failRewarded) throw new Error("rewarded failed");
    rewardedShows += 1;
    return { rewarded: true };
  },
  prepareInterstitial: async () => ({ ok: true }),
  showInterstitial: async () => {
    interstitialShows += 1;
    return { ok: true };
  }
};

function configure({ premium = false, orders = 0, production = false, random = 0.1, shouldShowAdsResolver = null } = {}) {
  global.localStorage.clear();
  AdMobService.configure({
    now: () => now,
    random: () => random,
    productionEnabledOverride: production,
    getPlugin: () => mockPlugin,
    isPremiumResolver: () => premium,
    shouldShowAdsResolver,
    telemetry: () => {},
    toast: () => {}
  });
  MonetizationLimits.configure({
    now: () => now,
    getOrderCount: () => orders,
    isPremiumResolver: () => premium
  });
  AdMobService.resetForTests();
  MonetizationLimits.resetForTests();
  interstitialShows = 0;
  rewardedShows = 0;
  failRewarded = false;
}

async function run() {
  configure({ premium: true, orders: 999 });
  assert.equal(AdMobService.isAdsAllowed({}), false, "premium nao deve ver anuncios");
  assert.equal(MonetizationLimits.canCreateOrder({}), true, "premium cria pedido direto");
  assert.equal(MonetizationLimits.canExportPDF({}), true, "premium exporta PDF direto");

  const shouldShowAds = (user = {}, context = {}) => {
    const screen = String(context.screenName || context.screen || "").toLowerCase();
    if (["login", "pagamento", "assinatura", "admin"].includes(screen) || context.isTyping || context.hasError || context.isEditingOrder) return false;
    const plan = String(user.activePlan || user.active_plan || "free").toLowerCase();
    return plan === "free";
  };

  configure({ premium: false, shouldShowAdsResolver: shouldShowAds });
  assert.equal(AdMobService.isAdsAllowed({ activePlan: "free", paymentStatus: "pending" }), true, "pending nao desliga anuncios do free");
  assert.equal(AdMobService.isAdsAllowed({ activePlan: "premium_trial", subscriptionStatus: "trialing" }), false, "trial nao deve ver anuncios");
  assert.equal(AdMobService.isAdsAllowed({ activePlan: "premium", subscriptionStatus: "active" }), false, "pago nao deve ver anuncios");
  assert.equal(AdMobService.canShowInterstitial({ activePlan: "free" }, { screenName: "login" }).allowed, false, "login nunca mostra anuncio");

  MonetizationLimits.configure({
    now: () => now,
    getOrderCount: () => 999,
    isPremiumResolver: null
  });
  assert.equal(MonetizationLimits.canCreateOrder({
    activePlan: "premium_trial",
    subscriptionStatus: "trialing",
    trialExpiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  }), true, "trial ativo libera limites");
  assert.equal(MonetizationLimits.canCreateOrder({
    activePlan: "free",
    pendingPlan: "premium",
    paymentStatus: "pending",
    subscriptionStatus: "free",
    orderCount: 999
  }), false, "pending nao libera limites premium");

  configure({ premium: false, orders: 4 });
  assert.equal(MonetizationLimits.canCreateOrder({ email: "free@example.com" }), true, "free dentro do limite cria pedido");
  assert.equal(MonetizationLimits.getRemainingFreeOrders({ email: "free@example.com" }), 1, "resta um pedido gratuito");

  configure({ premium: false, orders: 5 });
  assert.equal(MonetizationLimits.canCreateOrder({ email: "limit@example.com" }), false, "free no limite bloqueia pedido");
  await AdMobService.showRewardedAd({
    rewardType: "orders",
    onReward: () => MonetizationLimits.unlockOrdersByAd({ email: "limit@example.com" })
  });
  assert.equal(rewardedShows, 1, "rewarded simulado exibido");
  assert.equal(MonetizationLimits.canCreateOrder({ email: "limit@example.com" }), true, "rewarded libera pedidos temporariamente");

  configure({ premium: false, orders: 0 });
  const pdfUser = { email: "pdf@example.com" };
  assert.equal(MonetizationLimits.canExportPDF(pdfUser), true, "primeiro PDF do dia liberado");
  MonetizationLimits.registerPdfExport(pdfUser);
  assert.equal(MonetizationLimits.canExportPDF(pdfUser), false, "segundo PDF do dia bloqueado");
  MonetizationLimits.unlockPdfByAd(pdfUser);
  assert.equal(MonetizationLimits.canExportPDF(pdfUser), true, "rewarded libera PDF extra");

  configure({ premium: false, orders: 0 });
  const resetUser = { email: "reset@example.com" };
  MonetizationLimits.registerPdfExport(resetUser);
  assert.equal(MonetizationLimits.canExportPDF(resetUser), false, "PDF usado no dia");
  now += 24 * 60 * 60 * 1000;
  assert.equal(MonetizationLimits.canExportPDF(resetUser), true, "PDF reseta no dia seguinte");

  configure({ premium: false, orders: 5 });
  failRewarded = true;
  const failedReward = await AdMobService.showRewardedAd({ rewardType: "orders" });
  assert.equal(failedReward.rewarded, false, "falha no SDK nao concede recompensa");
  assert.equal(MonetizationLimits.canCreateOrder({ email: "fail@example.com" }), false, "falha no SDK mantem bloqueio");

  now = Date.parse("2026-05-04T12:00:00.000Z");
  configure({ premium: false, orders: 0, production: true, random: 0.1 });
  await AdMobService.maybeShowInterstitialAfterCompletedAction({}, { screenName: "pedidos", actionName: "order_saved" });
  assert.equal(interstitialShows, 0, "interstitial nao aparece com menos de duas acoes");
  now += 21 * 60 * 1000;
  await AdMobService.maybeShowInterstitialAfterCompletedAction({}, { screenName: "pedidos", actionName: "order_saved" });
  assert.equal(interstitialShows, 1, "interstitial aparece depois de 20min e 2 acoes");

  configure({ premium: false, orders: 0, production: true, random: 0.1 });
  now += 21 * 60 * 1000;
  AdMobService.registerCompletedAction();
  AdMobService.registerCompletedAction();
  const critical = await AdMobService.maybeShowInterstitialAfterCompletedAction({}, { screenName: "login", actionName: "order_saved" });
  assert.equal(critical.shown, false, "interstitial nao aparece em tela critica");
  assert.equal(interstitialShows, 0, "tela critica nao chama SDK");

  configure({ premium: false, orders: 5 });
  MonetizationLimits.unlockOrdersByAd({ email: "persist@example.com" });
  assert.equal(MonetizationLimits.canCreateOrder({ email: "persist@example.com" }), true, "unlock persistiu em localStorage");

  console.log("Monetization tests OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
