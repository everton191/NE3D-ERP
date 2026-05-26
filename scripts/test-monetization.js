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

let now = Date.parse("2026-05-20T12:00:00.000Z");
let interstitialShows = 0;
let failInterstitial = false;

const mockPlugin = {
  initialize: async () => ({ ok: true }),
  prepareInterstitial: async () => {
    if (failInterstitial) throw new Error("interstitial failed");
    return { ok: true };
  },
  showInterstitial: async () => {
    if (failInterstitial) throw new Error("interstitial failed");
    interstitialShows += 1;
    return { ok: true };
  },
  prepareRewardVideoAd: async () => ({ ok: true }),
  showRewardVideoAd: async () => ({ rewarded: true }),
  showBanner: async () => ({ ok: true }),
  hideBanner: async () => ({ ok: true })
};

function configure({ premium = false, platform = "android", production = true } = {}) {
  global.localStorage.clear();
  failInterstitial = false;
  interstitialShows = 0;
  AdMobService.configure({
    now: () => now,
    random: () => 0,
    productionEnabledOverride: production,
    nativePlatformOverride: platform,
    getPlugin: () => mockPlugin,
    isPremiumResolver: () => premium,
    shouldShowAdsResolver: (user = {}, context = {}) => {
      const screen = String(context.screenName || "").toLowerCase();
      return !premium && !["login", "admin", "assinatura"].includes(screen);
    },
    telemetry: () => {},
    toast: () => {}
  });
  MonetizationLimits.configure({
    now: () => now,
    isPremiumResolver: () => premium
  });
  AdMobService.resetForTests();
  MonetizationLimits.resetForTests();
}

async function run() {
  configure({ premium: true });
  const pro = { email: "pro@example.com", activePlan: "pro", subscriptionStatus: "active" };
  assert.equal(MonetizationLimits.canUseAction(pro), true, "PRO nao consome creditos");
  assert.equal(MonetizationLimits.getRemainingFreeActions(pro), Number.POSITIVE_INFINITY, "PRO tem acoes ilimitadas");
  for (let i = 0; i < 40; i += 1) MonetizationLimits.registerAction(pro, "salvar_pedido");
  assert.equal(MonetizationLimits.canUseAction(pro), true, "PRO continua liberado apos varias acoes");

  configure({ premium: false });
  const free = { email: "free@example.com", activePlan: "free", subscriptionStatus: "free" };
  assert.equal(MonetizationLimits.getRemainingFreeActions(free), 5, "GRATIS comeca com 5 pedidos/acoes por dia");
  assert.equal(MonetizationLimits.shouldCountAction("abrir_dashboard"), false, "navegacao nao consome credito");
  MonetizationLimits.registerAction(free, "abrir_dashboard");
  assert.equal(MonetizationLimits.getRemainingFreeActions(free), 5, "acao visual nao altera contador");

  for (let i = 0; i < 5; i += 1) {
    assert.equal(MonetizationLimits.canUseAction(free), true, "FREE usa credito disponivel");
    MonetizationLimits.registerAction(free, "salvar_pedido");
  }
  assert.equal(MonetizationLimits.getRemainingFreeActions(free), 0, "contador chega a zero");
  assert.equal(MonetizationLimits.canUseAction(free), false, "FREE bloqueia nova acao importante quando esgota");

  const ad = await AdMobService.showInterstitialNow({ user: free, context: { screenName: "pedidos", actionName: "free_action_limit" } });
  assert.equal(ad.shown, true, "interstitial abre para liberar credito");
  assert.equal(interstitialShows, 1, "SDK de interstitial chamado");
  MonetizationLimits.resetActionsAfterAd(free);
  assert.equal(MonetizationLimits.getRemainingFreeActions(free), 5, "anuncio concluido libera mais 5 pedidos no dia");
  for (let i = 0; i < 5; i += 1) MonetizationLimits.registerAction(free, "salvar_pedido");
  assert.equal(MonetizationLimits.canUseAction(free), false, "GRATIS bloqueia ao atingir maximo de 10 pedidos/dia");

  configure({ premium: false });
  const fallbackUser = { email: "fallback@example.com", activePlan: "free" };
  for (let i = 0; i < 5; i += 1) MonetizationLimits.registerAction(fallbackUser, "adicionar_item");
  failInterstitial = true;
  const failedAd = await AdMobService.showInterstitialNow({ user: fallbackUser, context: { screenName: "pedido", actionName: "free_action_limit" } });
  assert.equal(failedAd.shown, false, "falha de anuncio nao libera na hora");
  const fallback = MonetizationLimits.scheduleFallbackUnlock(fallbackUser, 30);
  assert.equal(MonetizationLimits.canUseAction(fallbackUser), false, "fallback antes de 30 min ainda aguarda");
  now = fallback.availableAt + 1;
  assert.equal(MonetizationLimits.canUseAction(fallbackUser), true, "fallback libera automaticamente depois de 30 min");
  assert.equal(MonetizationLimits.getRemainingFreeActions(fallbackUser), 5, "fallback libera novo ciclo basico");

  configure({ premium: false });
  const backupFree = MonetizationLimits.getBackupUsageSummary({ usedBytes: 51 * 1024 * 1024, plan: "free" });
  assert.equal(backupFree.limitMb, 50, "FREE tem backup de 50 MB");
  assert.equal(backupFree.full, true, "backup acima de 50 MB fica cheio");
  const backupPro = MonetizationLimits.getBackupUsageSummary({ usedBytes: 900 * 1024 * 1024, plan: "premium" });
  assert.equal(backupPro.limitMb, 1024, "PRO tem backup de 1 GB");
  assert.equal(backupPro.full, false, "900 MB cabe no PRO");
  const backupStart = MonetizationLimits.getBackupUsageSummary({ usedBytes: 120 * 1024 * 1024, plan: "start" });
  assert.equal(backupStart.limitMb, 256, "Start tem backup intermediario");

  const sessions = [
    { id: "old", active: true, lastSeenAt: "2026-05-20T09:00:00.000Z" },
    { id: "middle", active: true, lastSeenAt: "2026-05-20T10:00:00.000Z" },
    { id: "new", active: true, lastSeenAt: "2026-05-20T11:00:00.000Z" }
  ];
  const limitedFree = MonetizationLimits.enforceSessionLimit(sessions, 2, "2026-05-20T12:00:00.000Z");
  assert.equal(limitedFree.find((session) => session.id === "old").active, false, "FREE encerra sessao mais antiga ao passar de 2");
  const limitedPro = MonetizationLimits.enforceSessionLimit(sessions, 4, "2026-05-20T12:00:00.000Z");
  assert.equal(limitedPro.every((session) => session.active), true, "PRO permite ate 4 sessoes");

  assert.equal(MonetizationLimits.canUseCalculator({ email: "calc@example.com", activePlan: "free" }), true, "calculadora continua livre no FREE");
  assert.equal(MonetizationLimits.canExportPDF({ email: "pdf@example.com", activePlan: "free" }), true, "PDF/orcamento usa o mesmo ciclo de acoes");

  console.log("Monetization tests OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
