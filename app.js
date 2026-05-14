// ==========================================================
// Simplifica 3D - layout mobile/desktop corrigido
// ==========================================================

const APP_VERSION = "51.0.14";
const APP_VERSION_CODE = 65;
const SYSTEM_NAME = "Simplifica 3D";
const PROJECT_COVER_IMAGE = "assets/simplifica-brand-cover.jpg";
const PROJECT_ICON_IMAGE = "assets/icon-512.png";
const INTRO_VIDEO_SRC = "assets/intro.mp4";
const INTRO_VIDEO_ASPECT_RATIO = "2160 / 2264";
const INTRO_VIDEO_FRAME_WIDTH = "min(100vw, 95.4064dvh)";
const INTRO_VIDEO_FRAME_HEIGHT = "min(100dvh, 104.8148vw)";
const APP_PUBLIC_URL = String(globalThis?.__APP_PUBLIC_URL__ || "https://erpne3d-everton191s-projects.vercel.app");
const SUPABASE_DEFAULT_URL = String(globalThis?.__SUPABASE_URL__ || "https://qsufnnivlgdidmjuaprb.supabase.co");
const SUPABASE_DEFAULT_ANON_KEY = String(globalThis?.__SUPABASE_ANON_KEY__ || "sb_publishable_lyLrAr-NKPVrnrO5_J-5Ow_WJDyq8t-");
const SUPPORT_EMAIL = "simplifica3d.app@gmail.com";
const SUPERADMIN_BOOTSTRAP_EMAIL = "";
const SUPERADMIN_BOOTSTRAP_HASH = "pbkdf2$120000$7IdXWxbOcEGHYrhsgKxbwQ==$zi+SJZy2LcZmhy0NiWxjIZ43/A9GJZiW0B5/hDSIwJg=";
const SECURITY_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SECURITY_SESSION_WARNING_MS = 2 * 60 * 1000;
const LOGIN_LOCK_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
// TODO: Reativar WhatsApp 2FA somente com Edge Function/backend, provedor oficial, armazenamento com expiração e validação server-side.
const WHATSAPP_2FA_BACKEND_ENABLED = false;
const DEFAULT_SAAS_PLANS = [
  { id: "free", slug: "free", name: "Free", price: 0, maxUsers: 1, maxOrders: null, maxClients: null, maxCalculatorUses: 30, maxStorageMb: 25, active: true, recommended: false, allowPdf: true, allowReports: false, allowPermissions: false, kind: "free", showsAds: true },
  { id: "premium_trial", slug: "premium_trial", name: "Teste gratis", price: 0, maxUsers: 5, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: null, active: true, recommended: false, allowPdf: true, allowReports: true, allowPermissions: true, kind: "trial", durationDays: 7, showsAds: false },
  { id: "premium", slug: "premium", name: "PRO", price: 29.9, maxUsers: 5, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: null, active: true, recommended: true, allowPdf: true, allowReports: true, allowPermissions: true, kind: "paid", showsAds: false }
];
const DEFAULT_TRIAL_DAYS = 7;
const PLAN_ACCESS_STATES = Object.freeze({
  FREE: "FREE",
  TRIAL: "TRIAL",
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  EXPIRED: "EXPIRED",
  BLOCKED: "BLOCKED"
});
const PLAN_DEBUG_ENABLED = false;
const PAID_PRICE_TIERS = [
  { limit: 100, price: 19.9 },
  { limit: 200, price: 24.9 },
  { limit: Infinity, price: 29.9 }
];
const PREMIUM_FIRST_MONTH_PRICE = PAID_PRICE_TIERS[0].price;
const PREMIUM_MONTHLY_PRICE = 29.9;
const AD_MIN_INTERVAL_MS = 45 * 60 * 1000;
const ADSENSE_WEB_DEFAULT_ENABLED = true;
const ADSENSE_WEB_DEFAULT_PUBLISHER_ID = String(globalThis?.__ADSENSE_PUBLISHER_ID__ || "ca-pub-1056970757696623");
const ADSENSE_WEB_DEFAULT_BANNER_SLOT = String(globalThis?.__ADSENSE_BANNER_SLOT__ || "3186212257");
const BILLING_VARIANTS = {
  premium_first_month: { id: "premium_first_month", planId: "premium", amount: PREMIUM_FIRST_MONTH_PRICE },
  premium_monthly: { id: "premium_monthly", planId: "premium", amount: PREMIUM_MONTHLY_PRICE }
};
const ENABLE_GOOGLE_DRIVE_BACKUP = false;
const ONBOARDING_PRINT_TYPES = [
  { id: "fdm", label: "FDM / Filamento" },
  { id: "resina", label: "Resina" },
  { id: "ambos", label: "Ambos" }
];
const ONBOARDING_MATERIALS = ["PLA", "ABS", "PETG", "TPU", "Resina", "Outro"];
const ASSISTANT_MAX_MESSAGES = 20;
const ASSISTANT_MAX_CONTEXT_RESULTS = 10;
const AI_LOCAL_UI_VERSION = "2026-05-13-pro-only-v2";
const AI_OFFLINE_SYSTEM_PROMPT = "Você é o assistente oficial do Simplifica 3D. Responda somente com base nas informações do sistema enviadas no contexto. Não invente funções, telas, preços ou regras. Se não encontrar a informação, diga: 'Não encontrei essa informação no manual do sistema.' Use português brasileiro simples e direto.";
const AI_RUNTIME_TEST_SYSTEM_PROMPT = "Responda somente OK.";
const AI_RUNTIME_TEST_PROMPT = "OK";
const AI_KNOWLEDGE_BASE = Object.freeze({
  telas: ["Dashboard", "Pedidos", "Calculadora", "Estoque", "Caixa", "Relatórios", "Backup", "Configurações", "Planos"],
  fluxos: [
    "Para adicionar material: abra Estoque, toque em Adicionar material, informe nome, tipo, cor e custo.",
    "Para calcular preço: abra Calculadora, escolha material, informe peso, tempo, energia, margem e taxa extra.",
    "Para criar pedido: abra Pedidos, escolha cliente, adicione itens e salve.",
    "Para gerar PDF: abra um pedido ou orçamento e use Gerar PDF.",
    "Para sincronizar: use Backup/Sincronizar ou aguarde o salvamento automático quando online."
  ],
  limites: "A IA local é focada no Simplifica 3D. Ela ajuda no uso do sistema, mas não substitui suporte humano nem tem capacidade equivalente ao ChatGPT."
});
const AI_DEFAULT_MODEL_ID = "qwen25_05b_q8";
const AI_MODELS = Object.freeze([
  {
    id: AI_DEFAULT_MODEL_ID,
    name: "IA Local",
    tier: "standard",
    model: "Qwen2.5 0.5B Instruct Q8_0 GGUF",
    sizeMb: 465,
    minBytes: 300 * 1024 * 1024,
    ramRecommended: "4 GB+",
    recommended: "Modelo padrão único",
    description: "Modelo local padrão do Simplifica 3D para dúvidas do sistema, pedidos, estoque e cálculo.",
    fileName: "Qwen2.5-0.5B-Instruct-Q8_0.gguf",
    officialPage: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF",
    url: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q8_0.gguf"
  }
]);
const AI_INSTALL_STATUS = Object.freeze({
  NOT_INSTALLED: "not_installed",
  DOWNLOADING: "downloading",
  DOWNLOADED: "downloaded",
  VALIDATING: "validating",
  LOADING: "loading",
  INSTALLING: "installing",
  TESTING: "testing",
  INSTALLED_READY: "installed_ready",
  INSTALLED_BUT_FAILED: "installed_but_failed",
  FAILED_DOWNLOAD: "failed_download",
  FAILED_VALIDATION: "failed_validation",
  FAILED_RUNTIME: "failed_runtime",
  REMOVING: "removing",
  REMOVED: "removed"
});
const AI_INSTALL_STATE_ALIASES = Object.freeze({
  installed: AI_INSTALL_STATUS.INSTALLED_READY,
  active: AI_INSTALL_STATUS.INSTALLED_READY,
  failed: AI_INSTALL_STATUS.FAILED_RUNTIME,
  installing: AI_INSTALL_STATUS.INSTALLING,
  ready: AI_INSTALL_STATUS.INSTALLED_READY
});
const AI_PROGRESS_RENDER_INTERVAL_MS = 420;
const LIST_PAGE_SIZE = 50;
const SUPERADMIN_PAGE_SIZE = 50;
const LOCAL_SESSION_CACHE_KEY = "simplifica3dSessionCache";
const PENDING_SYNC_QUEUE_KEY = "pending_sync";
const USER_DATA_CACHE_PREFIX = "erp_data_";
const ACTIVE_DATA_SCOPE_KEY = "erp_data_active_scope";
const USER_SCOPED_LIST_KEYS = Object.freeze([
  "estoque",
  "caixa",
  "pedidos",
  "orcamentos",
  "historico",
  "diagnostics",
  "sugestoes",
  "securityLogs",
  "auditLogs",
  "saasClients",
  "saasSubscriptions",
  "saasPayments",
  "saasSessions"
]);
const BACKEND_LICENSE_CACHE_KEYS = Object.freeze([
  "activePlan",
  "planSlug",
  "pendingPlan",
  "paymentStatus",
  "subscriptionStatus",
  "licenseStatus",
  "licenseBlockLevel",
  "effectiveUserId",
  "effectivePlanCode",
  "effectiveStatus",
  "effectiveIsPremium",
  "effectiveIsTrial",
  "effectiveIsPending",
  "effectiveIsBlocked",
  "effectiveRemainingTrialDays",
  "effectiveLicenseSource",
  "effectiveLicenseUpdatedAt",
  "effectiveLicenseStale",
  "lastOnlineLicenseValidationAt",
  "trialStartedAt",
  "trialExpiresAt",
  "trialConsumedAt",
  "isTrialActive",
  "paidUntil",
  "planExpiresAt",
  "premiumUntil",
  "blockedAt",
  "blockedReason"
]);
const LOCAL_UNLOCK_KEY = "simplifica3dLastLocalUnlockAt";
const LOCAL_UNLOCK_MAX_MS = 12 * 60 * 60 * 1000;
const OFFLINE_LICENSE_STALE_MAX_MS = 3 * 24 * 60 * 60 * 1000;
const LICENSE_MONITOR_INTERVAL_MS = 60 * 1000;
const REALTIME_SYNC_HEARTBEAT_MS = 25 * 1000;
const REALTIME_SYNC_RECONNECT_MS = 5 * 1000;
const REALTIME_SYNC_DEBOUNCE_MS = 1200;
const REALTIME_FALLBACK_FOREGROUND_MS = 15 * 1000;
const REALTIME_FALLBACK_BACKGROUND_MS = 60 * 1000;
const REALTIME_SYNC_ENABLED = false;
const DRAWER_EDGE_SWIPE_ENABLED = false;
const DASHBOARD_RECENT_ACTIVITY_MS = 2 * 60 * 1000;
const TOAST_DEBOUNCE_MS = 4500;
const SYNCABLE_COLLECTIONS = Object.freeze(["pedidos", "estoque", "caixa", "clientes"]);
const BACKUP_REMINDER_START_MIN = 17 * 60 + 30;
const BACKUP_REMINDER_END_MIN = 18 * 60 + 30;
const CLIENT_CODE_PREFIX = "S3D";
const INACTIVE_CLIENT_DAYS = 90;
const ANDROID_PUBLIC_REPO = "everton191/NE3D-ERP.apk";
const ANDROID_RELEASES_URL = `https://raw.githubusercontent.com/${ANDROID_PUBLIC_REPO}/main/NE3D-ERP.apk`;
const ANDROID_UPDATE_MANIFEST_URL = `https://raw.githubusercontent.com/${ANDROID_PUBLIC_REPO}/main/update.json`;
const ANDROID_UPDATE_MANIFEST_FALLBACK_URLS = [
  "https://raw.githubusercontent.com/everton191/NE3D-ERP/main/downloads/update.json"
];

const telas = {
  dashboard: "Início",
  calculadora: "Calculadora 3D",
  pedido: "Novo pedido",
  producao: "Produção",
  estoque: "Estoque",
  pedidos: "Pedidos",
  clientes: "Clientes",
  caixa: "Caixa",
  relatorios: "Relatórios",
  config: "Configurações",
  empresa: "Empresa",
  backup: "Backup",
  preferencias: "Preferências",
  personalizacao: "Personalizar",
  mais: "Mais",
  conta: "Conta",
  assinatura: "Plano",
  minhaAssinatura: "Minha Assinatura",
  usuarios: "Usuários",
  seguranca: "Segurança",
  planos: "Planos",
  admin: "Admin",
  superadmin: "Super Admin",
  onboarding: "Introdução",
  feedback: "Bugs e sugestões",
  sobre: "Sobre",
  privacy: "Política de Privacidade",
  terms: "Termos de Uso",
  acessoNegado: "Acesso negado"
};

let telaAtual = "dashboard";
let telaAnterior = "dashboard";
let ultimoCalculo = null;
let itensPedido = [];
let clientePedido = "";
let clienteTelefonePedido = "";
let pedidoEditando = null;
let pedidoEditandoOriginal = null;
let pedidoSalvando = false;
let ultimoToqueForaCalculadora = 0;
let pedidoVisualizandoId = null;
let modoMobileAtual = window.innerWidth < 768;
let resizeTimer = null;
let adminLogado = sessionStorage.getItem("adminLogado") === "sim";
let usuarioAtualEmail = sessionStorage.getItem("usuarioAtualEmail") || "";
let twoFactorPending = null;
let updateTimer = null;
let dashboardWindowAction = null;
let dashboardPeriod = localStorage.getItem("dashboardPeriod") || "day";
let dashboardAnalyticsCache = carregarObjeto("dashboardAnalyticsCache", {});
let dashboardAnalyticsRequest = null;
let dashboardAnalyticsLastUploadAt = 0;
let sideDrawerGesture = null;
let sideDrawerOpen = false;
let sideDrawerProgress = 0;
let profileLongPressState = null;
let calcWidgetAction = null;
let sessionTimer = null;
let sessionWarned = false;
let assistantOpen = false;
let assistantMinimized = false;
let assistantMessages = [];
let assistantGenerating = false;
let assistantMode = "basic";
let assistantListening = false;
let assistantVoiceSupport = null;
let assistantVoiceSupportLoading = false;
let assistantRuntimeDiagnostics = null;
let assistantRuntimeDiagnosticsLoading = false;
let assistantRuntimeLoading = false;
let assistantRuntimeReady = false;
let assistantRuntimePromise = null;
let aiModelInstallPromise = null;
let aiProgressRenderTimer = null;
let adminAuthValidUntil = 0;
let localLockModalOpen = false;
let licenseMonitorTimer = null;
let dataScopeChangedOnCurrentSession = false;
let scopedDataCacheReady = false;
let dataSyncDebounceTimer = null;
let syncIndicatorTimer = null;
let realtimeSyncState = {
  socket: null,
  topic: "",
  userId: "",
  accessToken: "",
  ref: 0,
  joinRef: "",
  joined: false,
  heartbeatTimer: null,
  reconnectTimer: null,
  debounceTimer: null,
  pollTimer: null,
  applying: false,
  lastEventKey: "",
  lastEventAt: 0,
  lastPollAt: 0,
  lastToastAt: 0,
  reconnectAttempts: 0
};

let estoque = carregarLista("estoque");
let caixa = carregarLista("caixa");
let pedidos = carregarLista("pedidos");
let orcamentos = carregarLista("orcamentos");
let historico = carregarLista("historico");
let diagnostics = carregarLista("diagnostics");
let sugestoes = carregarLista("sugestoes");
let appErrorLogsRemotos = [];
let appFeedbackReportsRemotos = [];
let appSuggestionsRemotas = [];
let securityLogs = carregarLista("securityLogs");
let auditLogs = carregarLista("auditLogs");
let passwordResetTokens = carregarLista("passwordResetTokens");
let saasClients = carregarLista("saasClients");
let saasPlans = carregarLista("saasPlans");
let saasSubscriptions = carregarLista("saasSubscriptions");
let saasPayments = carregarLista("saasPayments");
let saasSessions = carregarLista("saasSessions");
let pendingSync = carregarLista(PENDING_SYNC_QUEUE_KEY);
let saasClientsRemoteState = {
  status: "idle",
  message: "",
  detail: "",
  updatedAt: ""
};
let usageCounters = carregarObjeto("usageCounters", {});
let loginAttempts = carregarObjeto("loginAttempts", {});
let syncConfig = carregarObjeto("syncConfig", {
  cloudUrl: "",
  token: "",
  deviceName: "",
  driveFolderName: "",
  driveFileName: "erp3d-backup.json",
  driveLastSync: "",
  autoBackupEnabled: true,
  autoBackupInterval: 30,
  autoBackupTarget: "supabase",
  autoBackupLastRun: "",
  autoBackupStatus: "Aguardando",
  ultimoBackup: "",
  ultimaSync: "",
  supabaseEnabled: false,
  supabaseUrl: SUPABASE_DEFAULT_URL,
  supabaseAnonKey: SUPABASE_DEFAULT_ANON_KEY,
  supabaseEmail: "",
  supabaseUserId: "",
  supabaseAccessToken: "",
  supabaseRefreshToken: "",
  supabaseTokenExpiresAt: 0,
  supabaseLastLogin: "",
  supabaseLastSync: "",
  supabaseGoogleOAuthEnabled: false
});
if (!ENABLE_GOOGLE_DRIVE_BACKUP && syncConfig.autoBackupTarget === "drive") {
  syncConfig.autoBackupTarget = "supabase";
}
let appConfig = carregarObjeto("appConfig", {
  appName: SYSTEM_NAME,
  businessName: "Minha empresa 3D",
  whatsappNumber: "",
  documentFooter: "Obrigado pela preferência.",
  pixKey: "",
  pixReceiverName: "",
  pixCity: "",
  pixDescription: "Pedido Simplifica 3D",
  brandLogoDataUrl: "",
  profilePhotoDataUrl: "",
  companyLogoDataUrl: "",
  loginBackgroundDataUrl: "",
  customLoginMessage: "",
  pdfBackgroundDataUrl: "",
  pdfStyle: "clean",
  pdfHeaderText: "",
  brandWatermarkEnabled: true,
  theme: "dark",
  accentColor: "#073b4b",
  appearanceSettings: {
    primary_color: "#073b4b",
    secondary_color: "#ff941c",
    pdf_background: "",
    logo_url: "",
    theme_mode: "dark",
    glass_effect: true,
    custom_pdf_enabled: false
  },
  compactMode: false,
  motionLevel: "medium",
  showBrandInHeader: true,
  defaultMargin: 100,
  defaultEnergy: 0.85,
  defaultFilamentCost: 150,
  defaultExtraFee: 0,
  defaultPrinterType: "FDM",
  defaultPrintType: "",
  defaultMaterial: "",
  companySetupCompleted: false,
  defaultPrinterModel: "Ender 3",
  defaultResinCost: 180,
  calculatorDefaults: {},
  screenFit: "auto",
  uiScale: 100,
  desktopCardMinWidth: 320,
  desktopMaxWidth: 1480,
  sidebarCollapsed: false,
  twoFactorEnabled: false,
  twoFactorWhatsapp: "",
  twoFactorScope: "admin",
  twoFactorRememberMinutes: 60,
  autoUpdateEnabled: true,
  updateCheckInterval: 30,
  updateLastCheck: "",
  updateStatus: "Aguardando",
  updateAvailableVersion: "",
  updateAvailableCode: 0,
  updateDownloadUrl: "",
  updateManifestUrl: "",
  updatePromptedVersion: "",
  updatePromptedAt: "",
  updateDismissedVersion: "",
  updateDismissedCode: 0,
  browserPasswordSaveOffer: true,
  keepSessionCache: true,
  biometricEnabled: false,
  biometricOfferDismissed: false,
  backupReminderLastAt: "",
  telemetryEnabled: true,
  adsenseWebEnabled: ADSENSE_WEB_DEFAULT_ENABLED,
  adsensePublisherId: ADSENSE_WEB_DEFAULT_PUBLISHER_ID,
  adsenseBannerSlot: ADSENSE_WEB_DEFAULT_BANNER_SLOT,
  aiOfflineAssistant: {
    localEnabled: false,
    proActivationPromptedVersion: "",
    onboardingCompleted: false,
    activeModelId: "",
    installedModelId: "",
    models: {},
    lastFailure: "",
    lastPerformance: "",
    lastDeviceProfile: "",
    voiceEnabled: false,
    ttsEnabled: false,
    ttsRate: 1,
    basicFallback: true
  },
  calculatorWidget: {
    open: false,
    x: null,
    y: null,
    w: 430,
    h: 620
  },
  dashboardLayout: {
    mode: "tiles",
    order: ["dashboard", "pedido", "estoque", "pedidos", "caixa"],
    sizes: {
      dashboard: "m",
      pedido: "m",
      estoque: "m",
      pedidos: "m",
      caixa: "m"
    },
    windows: {}
  }
});

const assistantResponses = [
  { keywords: ["pedido", "pedidos", "venda", "vendas"], answer: "Para criar um pedido, vá em Pedidos ou Novo pedido, adicione um ou mais produtos e finalize. Ao clicar em um pedido da lista você pode visualizar, editar, excluir e acompanhar o status. Ao editar, o sistema recalcula o estoque pela diferença para evitar baixa duplicada." },
  { keywords: ["estoque", "material", "filamento", "resina"], answer: "No Estoque você cadastra materiais por tipo e cor, como PLA Preto ou Resina Transparente. Quando um pedido usa material vinculado por ID, o sistema verifica saldo, baixa automaticamente ao salvar e devolve ao excluir/cancelar." },
  { keywords: ["calculadora", "calcular", "preco", "preço", "orcamento", "orçamento"], answer: "Na Calculadora 3D informe material, gramas, tempo, impressora, margem e taxa extra. O resultado separa custo de material, energia, custo total e preço sugerido. Você pode adicionar como pedido, salvar orçamento ou gerar PDF se o plano permitir." },
  { keywords: ["backup", "restaurar", "exportar", "supabase", "nuvem", "drive"], answer: "Em Backup você pode sincronizar pelo Supabase, exportar um JSON local ou importar um JSON seguro. A sincronização fica vinculada à conta logada; Google Drive está oculto enquanto não estiver validado." },
  { keywords: ["pdf", "comprovante", "recibo"], answer: "Para gerar PDF, monte um pedido ou orçamento e clique em Gerar PDF. Trial ativo, plano pago e superadmin têm acesso ao PDF. No celular, se o download direto falhar, o sistema tenta abrir o arquivo em nova aba." },
  { keywords: ["plano", "trial", "pago", "vencido", "bloqueado", "premium"], answer: "O Premium Trial libera recursos por 7 dias. Free mantém limites básicos. Premium libera recursos completos. O primeiro pagamento usa a condição promocional e os seguintes usam o mensal normal. Superadmin sempre tem acesso total." },
  { keywords: ["superadmin", "super", "administrador principal"], answer: "Super Admin é exclusivo do administrador principal. Ele vê a aba Super Admin, gerencia usuários, planos, bloqueios, vencimentos e acessa todas as funções sem limite de aparelho." },
  { keywords: ["login", "entrar", "acesso", "sessao", "sessão"], answer: "Use a área Admin para entrar com e-mail e senha. A sessão fica salva até o logout manual enquanto o Supabase conseguir renovar o token. Se aparecer Acesso negado, seu perfil não tem permissão para aquela tela ou o plano não libera o recurso." },
  { keywords: ["senha", "recuperar", "esqueci", "trocar"], answer: "Em Segurança você pode alterar sua senha. Use uma senha forte com 8 ou mais caracteres, maiúscula, minúscula, número e símbolo. Se esquecer, use Esqueci minha senha; com Supabase configurado, o reset usa o fluxo de autenticação online." },
  { keywords: ["usuario", "usuário", "usuarios", "usuários", "permissao", "permissão", "perfil"], answer: "Admin e superadmin podem criar usuários. Os perfis são superadmin, admin, operador e visualizador. Operador trabalha na operação; visualizador consulta; admin gerencia usuários e dados; superadmin acessa tudo." },
  { keywords: ["caixa", "financeiro", "relatorio", "relatório"], answer: "Em Caixa você registra entradas e saídas. Os pedidos finalizados entram como movimentação financeira. Relatórios mostram visão resumida para acompanhar faturamento, saldo e operação." },
  { keywords: ["producao", "produção", "impressao", "impressão"], answer: "A tela Produção acompanha pedidos em aberto ou em andamento. Atualize o status para organizar o fluxo de impressão, entrega e finalização." }
];
let billingConfig = carregarObjeto("billingConfig", {
  clientId: "",
  companyId: "",
  subscriptionId: "",
  planSlug: "free",
  licenseBlockLevel: "none",
  ownerMode: false,
  ownerName: "",
  ownerEmail: "",
  licenseStatus: "free",
  activePlan: "free",
  pendingPlan: "",
  pendingStartedAt: "",
  paymentStatus: "none",
  subscriptionStatus: "free",
  trialStartedAt: "",
  trialExpiresAt: "",
  isTrialActive: false,
  trialDays: DEFAULT_TRIAL_DAYS,
  lastDailyPlanCheck: "",
  blocked: false,
  monthlyPrice: PREMIUM_MONTHLY_PRICE,
  planPrice: 0,
  priceLocked: false,
  mercadoPagoLink: "",
  licenseEmail: "",
  paidUntil: "",
  planExpiresAt: "",
  lastAdShownAt: "",
  androidDownloadUrl: "",
  windowsDownloadUrl: "",
  windowsWebUrl: "",
  supportUrl: "",
  deviceLimits: {
    mobile: 1,
    desktop: 1
  },
  registeredDevices: [],
  cloudSyncPaidOnly: false
});
let usuarios = carregarLista("usuarios");
let deviceId = localStorage.getItem("deviceId") || criarDeviceId();
let driveFolderHandle = null;
let autoBackupTimer = null;
let autoBackupRodando = false;

carregarSessaoSensivelSupabase();

class AppError extends Error {
  constructor(message, { code = "APP_ERROR", userMessage = "", details = {}, cause = null } = {}) {
    super(message || userMessage || "Erro inesperado");
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage || message || "Não foi possível concluir a operação.";
    this.details = details;
    this.cause = cause;
  }
}

const StateStore = {
  get(chave) {
    const mapa = {
      estoque,
      caixa,
      pedidos,
      orcamentos,
      historico,
      diagnostics,
      sugestoes,
      securityLogs,
      auditLogs,
      passwordResetTokens,
      saasClients,
      saasPlans,
      saasSubscriptions,
      saasPayments,
      saasSessions,
      pendingSync,
      usageCounters,
      loginAttempts,
      usuarios,
      syncConfig,
      appConfig,
      billingConfig,
      usuarioAtualEmail,
      adminLogado
    };
    return mapa[chave];
  },
  set(chave, valor, opcoes = {}) {
    switch (chave) {
      case "estoque": estoque = Array.isArray(valor) ? valor : []; break;
      case "caixa": caixa = Array.isArray(valor) ? valor : []; break;
      case "pedidos": pedidos = Array.isArray(valor) ? valor : []; break;
      case "orcamentos": orcamentos = Array.isArray(valor) ? valor : []; break;
      case "historico": historico = Array.isArray(valor) ? valor : []; break;
      case "diagnostics": diagnostics = Array.isArray(valor) ? valor : []; break;
      case "sugestoes": sugestoes = Array.isArray(valor) ? valor : []; break;
      case "securityLogs": securityLogs = Array.isArray(valor) ? valor : []; break;
      case "auditLogs": auditLogs = Array.isArray(valor) ? valor : []; break;
      case "passwordResetTokens": passwordResetTokens = Array.isArray(valor) ? valor : []; break;
      case "saasClients": saasClients = Array.isArray(valor) ? valor : []; break;
      case "saasPlans": saasPlans = Array.isArray(valor) ? valor : []; break;
      case "saasSubscriptions": saasSubscriptions = Array.isArray(valor) ? valor : []; break;
      case "saasPayments": saasPayments = Array.isArray(valor) ? valor : []; break;
      case "saasSessions": saasSessions = Array.isArray(valor) ? valor : []; break;
      case "pendingSync": pendingSync = Array.isArray(valor) ? valor : []; break;
      case "usageCounters": usageCounters = valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {}; break;
      case "loginAttempts": loginAttempts = valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {}; break;
      case "usuarios": usuarios = normalizarUsuarios(valor); break;
      case "syncConfig": syncConfig = valor && typeof valor === "object" && !Array.isArray(valor) ? { ...syncConfig, ...valor } : syncConfig; break;
      case "appConfig": appConfig = valor && typeof valor === "object" && !Array.isArray(valor) ? { ...appConfig, ...valor } : appConfig; break;
      case "billingConfig": billingConfig = valor && typeof valor === "object" && !Array.isArray(valor) ? { ...billingConfig, ...valor } : billingConfig; break;
      case "usuarioAtualEmail":
        usuarioAtualEmail = normalizarEmail(valor || "");
        if (usuarioAtualEmail) sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
        else sessionStorage.removeItem("usuarioAtualEmail");
        break;
      case "adminLogado":
        adminLogado = valor === true;
        if (adminLogado) sessionStorage.setItem("adminLogado", "sim");
        else sessionStorage.removeItem("adminLogado");
        break;
      default:
        throw new AppError(`Estado desconhecido: ${chave}`, {
          code: "STATE_UNKNOWN_KEY",
          userMessage: "O estado interno solicitado não existe."
        });
    }
    if (opcoes.persistir) salvarDados();
    return this.get(chave);
  },
  update(chave, produtor, opcoes = {}) {
    const atual = this.get(chave);
    const base = Array.isArray(atual)
      ? [...atual]
      : atual && typeof atual === "object"
        ? { ...atual }
        : atual;
    return this.set(chave, produtor(base), opcoes);
  },
  hydrateAuthenticatedUser(usuario) {
    if (!usuario?.email) return null;
    const email = normalizarEmail(usuario.email);
    const lista = normalizarUsuarios(usuarios);
    const proximaLista = lista.some((item) => item.email === email)
      ? lista.map((item) => {
        if (item.email !== email) return item;
        const combinado = { ...item, ...usuario };
        combinado.onboardingCompleted = item.onboardingCompleted === true || usuario.onboardingCompleted === true;
        combinado.onboardingStep = combinado.onboardingCompleted ? 4 : Math.max(Number(item.onboardingStep) || 0, Number(usuario.onboardingStep) || 0);
        return normalizarUsuario(combinado);
      })
      : [...lista, normalizarUsuario(usuario)];
    this.set("usuarios", proximaLista);
    if (usuario.clientId || usuario.companyId) this.set("billingConfig", {
      ...(usuario.clientId ? { clientId: usuario.clientId } : {}),
      ...(usuario.companyId ? { companyId: usuario.companyId } : {})
    });
    salvarDados();
    return usuarios.find((item) => item.email === email) || null;
  },
  snapshot() {
    return {
      usuarioAtual: getUsuarioAtual(),
      estoque: [...normalizarEstoque()],
      planoAtual: getPlanoAtual(),
      syncConfig: criarSyncConfigPersistente(),
      billingConfig: { ...billingConfig }
    };
  }
};

const ErrorService = {
  toAppError(erro, contexto = {}) {
    if (erro instanceof AppError) return erro;
    const mensagem = String(erro?.message || erro || "Erro inesperado");
    let userMessage = contexto.userMessage || "Não foi possível concluir a operação.";
    let code = contexto.code || "APP_ERROR";
    if (/email_not_confirmed|email not confirmed|email não confirmado|email nao confirmado/i.test(mensagem)) {
      code = "AUTH_EMAIL_NOT_CONFIRMED";
      userMessage = "Confirme seu e-mail para ativar a sincronização online.";
    } else if (/invalid login credentials|invalid credentials|invalid_grant|senha|credenciais/i.test(mensagem)) {
      code = "AUTH_INVALID_CREDENTIALS";
      userMessage = "Usuário ou senha inválidos.";
    } else if (/failed to fetch|network|load failed|internet|timeout/i.test(mensagem)) {
      code = "NETWORK_ERROR";
      userMessage = "Não foi possível conectar agora. Verifique a internet e tente novamente.";
    } else if (/row-level security|violates row-level security|permission denied|not authorized|PGRST/i.test(mensagem)) {
      code = "SUPABASE_RLS_BLOCKED";
      userMessage = "O acesso online foi bloqueado por regra de segurança. O suporte precisa revisar as políticas Supabase.";
    } else if (/valor inválido|valor invalido|invalid number/i.test(mensagem)) {
      code = "VALIDATION_INVALID_NUMBER";
      userMessage = "Informe um valor numérico válido.";
    } else if (/já está cadastrado|already|registered|exists/i.test(mensagem)) {
      code = "AUTH_ALREADY_REGISTERED";
      userMessage = "Este e-mail já está cadastrado.";
    }
    return new AppError(mensagem, {
      code,
      userMessage,
      details: contexto,
      cause: erro
    });
  },
  capture(erro, contexto = {}) {
    const appError = this.toAppError(erro, contexto);
    try {
      registrarDiagnostico(
        contexto.area || "Erro",
        contexto.action || appError.code,
        `${appError.message}${contexto.detail ? " | " + contexto.detail : ""}`,
        { silent: contexto.silent === true }
      );
    } catch (_) {}
    try {
      if (contexto.telemetry !== false && !String(contexto.action || "").includes("register_app_error")) {
        registrarErroAplicacaoSilencioso(
          contexto.errorKey || appError.code || "APP_ERROR",
          appError,
          contexto.action || contexto.area || appError.code,
          {
            area: contexto.area || "",
            detail: contexto.detail || "",
            code: appError.code || ""
          }
        );
      }
    } catch (_) {}
    return appError;
  },
  notify(erro, contexto = {}) {
    const appError = this.capture(erro, contexto);
    if (!contexto.silent) {
      if (typeof mostrarToast === "function") mostrarToast(appError.userMessage, "erro", 6500);
      else alert(appError.userMessage);
    }
    return appError;
  }
};

const PlanService = {
  exigirPlanoCompleto(usuario = getUsuarioAtual()) {
    const plano = getPlanoAtual(usuario);
    if (canUsePremiumFeatures(usuario)) {
      return { status: "ALLOWED", allowed: true, reason: "ACTIVE", plano };
    }
    if (plano.status === "bloqueado") {
      return { status: "BLOCKED", allowed: false, reason: "BLOCKED", plano, message: "Este acesso está bloqueado. Fale com o administrador." };
    }
    if (plano.status === "expirado") {
      return { status: "BLOCKED", allowed: false, reason: "EXPIRED", plano, message: "Seu plano expirou. Renove para voltar a usar os recursos premium." };
    }
    if (plano.completo) {
      return { status: "BLOCKED", allowed: false, reason: "DEVICE_LIMIT", plano, message: "Este e-mail já atingiu o limite de aparelhos da licença." };
    }
    return { status: "BLOCKED", allowed: false, reason: "PREMIUM_REQUIRED", plano, message: "Recurso premium. O trial ativo e o plano pago liberam esta função." };
  }
};

function configurarTelemetriaErros() {
  try {
    if (!window.ErrorTelemetry?.configure) return;
    window.appConfig = appConfig;
    window.ErrorTelemetry.configure({
      getContext: () => {
        const usuario = getUsuarioAtual();
        return {
          userEmail: normalizarEmail(syncConfig.supabaseEmail || usuario?.email || billingConfig.licenseEmail || ""),
          appVersion: APP_VERSION,
          screenName: telaAtual || "",
          deviceModel: syncConfig.deviceName || deviceId || navigator.platform || "",
          osVersion: navigator.userAgent || "",
          platform: window.Capacitor?.getPlatform?.() || (navigator.userAgentData?.mobile ? "mobile-web" : "web")
        };
      },
      send: (payload) => requisicaoSupabase("/rest/v1/rpc/register_app_error", {
        method: "POST",
        telemetry: false,
        body: JSON.stringify(payload)
      })
    });
  } catch (_) {}
}

function registrarErroAplicacaoSilencioso(errorKey, erro, actionName = "", metadata = {}, screenName = telaAtual) {
  try {
    if (!window.ErrorTelemetry?.logAppError) return false;
    window.ErrorTelemetry.logAppError({
      errorKey,
      error: erro,
      screenName,
      actionName,
      metadata
    }).catch(() => {});
    return true;
  } catch (_) {
    return false;
  }
}

function flushPendingErrorLogs() {
  try {
    return window.ErrorTelemetry?.flushPendingErrorLogs?.() || Promise.resolve(false);
  } catch (_) {
    return Promise.resolve(false);
  }
}

function getUsuarioMonetizacao() {
  const usuario = getUsuarioAtual() || {};
  const assinatura = getAssinaturaSaas(usuario.clientId || billingConfig.clientId || "") || {};
  const plano = getPlanoAtual(usuario);
  const estadoPlano = resolverEstadoPlano(usuario, { subscription: assinatura || undefined, source: "monetization-user" });
  return {
    ...usuario,
    isPremium: canUsePremiumFeatures(usuario),
    completo: plano.completo === true,
    planState: estadoPlano.state,
    planStatus: plano.status,
    isTrialActive: estadoPlano.isTrialActive,
    trialStartedAt: estadoPlano.trialStartedAt,
    trialExpiresAt: estadoPlano.trialExpiresAt,
    trialRemainingDays: estadoPlano.trialRemainingDays,
    planId: assinatura.planId || assinatura.planSlug || billingConfig.planSlug || "free",
    planSlug: assinatura.activePlan || assinatura.planSlug || billingConfig.activePlan || billingConfig.planSlug || "free",
    activePlan: assinatura.activePlan || billingConfig.activePlan || assinatura.planSlug || billingConfig.planSlug || "free",
    pendingPlan: assinatura.pendingPlan || billingConfig.pendingPlan || "",
    paymentStatus: assinatura.paymentStatus || billingConfig.paymentStatus || "none",
    subscriptionStatus: assinatura.subscriptionStatus || billingConfig.subscriptionStatus || "",
    status: assinatura.status || assinatura.statusAssinatura || billingConfig.licenseStatus || "active",
    currentPeriodEnd: assinatura.planExpiresAt || assinatura.trialExpiresAt || assinatura.currentPeriodEnd || assinatura.expiresAt || billingConfig.planExpiresAt || billingConfig.paidUntil || "",
    trialExpiresAt: assinatura.trialExpiresAt || billingConfig.trialExpiresAt || "",
    lastAdShownAt: billingConfig.lastAdShownAt || getClienteSaasAtual()?.lastAdShownAt || "",
    orderCount: getPedidosAtivosPlanoFree(),
    email: usuario.email || syncConfig.supabaseEmail || billingConfig.licenseEmail || ""
  };
}

function configurarMonetizacaoAds() {
  try {
    window.AdMobService?.configure?.({
      isPremiumResolver: () => canUsePremiumFeatures(),
      shouldShowAdsResolver: (user, context) => shouldShowAds(user, context),
      telemetry: (errorKey, metadata = {}) => registrarErroAplicacaoSilencioso(errorKey, new Error(errorKey), "AdMob", metadata),
      toast: mostrarToast
    });
    window.MonetizationLimits?.configure?.({
      isPremiumResolver: () => canUsePremiumFeatures(),
      getOrderCount: () => getPedidosAtivosPlanoFree()
    });
    window.AdSenseService?.configure?.({
      enabled: appConfig.adsenseWebEnabled === true,
      publisherId: appConfig.adsensePublisherId || ADSENSE_WEB_DEFAULT_PUBLISHER_ID,
      bannerSlot: appConfig.adsenseBannerSlot || ADSENSE_WEB_DEFAULT_BANNER_SLOT,
      isPremiumResolver: () => canUsePremiumFeatures(),
      shouldShowAdsResolver: (user, context) => shouldShowAds(user, context),
      telemetry: (errorKey, metadata = {}) => registrarErroAplicacaoSilencioso(errorKey, new Error(errorKey), "AdSense", metadata)
    });
  } catch (erro) {
    registrarDiagnostico("Monetização", "Configuração de monetização falhou", erro.message || erro);
  }
}

function contextoInterstitialSeguro(actionName = "") {
  return {
    actionName,
    screenName: telaAtual,
    isEditingOrder: !!pedidoEditando,
    isCalculating: telaAtual === "calculadora" || !!document.querySelector(".floating-calculator.open"),
    isExportingPdf: !!window.__simplificaExportandoPdf,
    isModalOpen: !!document.getElementById("popup")?.innerHTML,
    isTyping: !!document.activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName),
    hasError: !!document.querySelector(".feedback-status.error, .saas-sync-state.error, .toast-erro"),
    isSyncing: window.__simplificaSyncing === true
  };
}

function shouldShowAds(user = getUsuarioMonetizacao(), context = contextoInterstitialSeguro()) {
  if (isSuperAdmin() || adminLogado) return false;
  if (window.AdMobService?.hasTemporaryUnlock?.("ad_free") || window.MonetizationLimits?.hasUnlock?.("ad_free", user || getUsuarioAtual())) return false;
  const estadoPlano = resolverEstadoPlano(user || getUsuarioAtual(), { source: "shouldShowAds" });
  if (estadoPlano.hasPremium) return false;
  const tela = String(context?.screenName || telaAtual || "").toLowerCase();
  if (["admin", "assinatura", "minhaassinatura", "planos", "conta", "seguranca", "superadmin", "onboarding", "acessonegado", "privacy", "terms"].includes(tela)) return false;
  if (context?.isEditingOrder || context?.isCalculating || context?.isExportingPdf || context?.isModalOpen || context?.isTyping || context?.hasError) return false;
  const isBannerView = String(context?.actionName || "").toLowerCase() === "screen_view" || String(context?.adType || "").toLowerCase() === "banner";
  const ultimo = Date.parse(user?.lastAdShownAt || billingConfig.lastAdShownAt || 0) || 0;
  if (!isBannerView && ultimo && Date.now() - ultimo < AD_MIN_INTERVAL_MS) return false;
  return estadoPlano.adsAllowed || [PLAN_ACCESS_STATES.FREE, PLAN_ACCESS_STATES.PENDING, PLAN_ACCESS_STATES.EXPIRED].includes(estadoPlano.state);
}

function registrarAnuncioExibido() {
  const agora = new Date().toISOString();
  billingConfig.lastAdShownAt = agora;
  const cliente = getClienteSaasAtual();
  if (cliente) cliente.lastAdShownAt = agora;
  salvarDados();
}

function registrarAcaoCompletaMonetizacao(actionName = "completed_action") {
  try {
    const contexto = contextoInterstitialSeguro(actionName);
    if (!shouldShowAds(getUsuarioMonetizacao(), contexto)) return;
    window.AdMobService?.maybeShowInterstitialAfterCompletedAction?.(getUsuarioMonetizacao(), contexto).then((resultado) => {
      if (resultado?.shown) registrarAnuncioExibido();
    });
  } catch (erro) {
    registrarErroAplicacaoSilencioso("ADMOB_INTERSTITIAL_FAILED", erro, "Interstitial pós-ação", { actionName });
  }
}

function sincronizarBannerAdMob() {
  try {
    const contexto = { ...contextoInterstitialSeguro("screen_view"), adType: "banner" };
    const resultado = window.AdMobService?.syncBannerForScreen?.(getUsuarioMonetizacao(), contexto);
    if (resultado?.catch) resultado.catch(() => {});
  } catch (erro) {
    registrarErroAplicacaoSilencioso("ADMOB_BANNER_SYNC_FAILED", erro, "Banner AdMob", { tela: telaAtual });
  }
}

function agendarPreloadRewardedAds(origem = "app") {
  try {
    if (!window.AdMobService?.preloadRewardedAd) return;
    window.clearTimeout?.(window.__rewardedPreloadTimer);
    window.__rewardedPreloadTimer = window.setTimeout(() => {
      window.AdMobService.preloadRewardedAd({
        user: getUsuarioMonetizacao(),
        rewardType: "orders"
      }).then((resultado) => {
        if (resultado?.ok) registrarDiagnostico("AdMob", "Rewarded preparado", { origem });
      }).catch((erro) => {
        registrarErroAplicacaoSilencioso("ADMOB_REWARDED_PRELOAD_FAILED", erro, "Rewarded preload", { origem });
      });
    }, 700);
  } catch (erro) {
    registrarErroAplicacaoSilencioso("ADMOB_REWARDED_PRELOAD_SCHEDULE_FAILED", erro, "Rewarded preload", { origem });
  }
}

function mensagemRewardedPorResultado(resultado = {}) {
  const motivo = String(resultado?.reason || "").toUpperCase();
  if (motivo === "WEB_OR_ELECTRON") return "Anúncio recompensado disponível no APK Android.";
  if (motivo === "PREMIUM_USER" || motivo === "ADS_NOT_ALLOWED") return "Sua conta não precisa assistir anúncio para este recurso.";
  if (motivo === "NOT_COMPLETED") return "Anúncio não concluído.";
  return "Anúncio indisponível no momento.";
}

async function atualizarBotaoRewardedModal(botao, rewardType) {
  if (!botao) return;
  const service = window.AdMobService;
  if (!service?.getRewardedStatus) {
    botao.disabled = true;
    botao.textContent = "Anúncio indisponível";
    return;
  }
  let status = service.getRewardedStatus(getUsuarioMonetizacao(), rewardType);
  if (status.loaded) {
    botao.disabled = false;
    botao.textContent = "Assistir anúncio";
    botao.dataset.textoOriginal = "Assistir anúncio";
    return;
  }
  if (status.loading) {
    botao.disabled = true;
    botao.textContent = "Carregando anúncio...";
    window.setTimeout(() => atualizarBotaoRewardedModal(botao, rewardType).catch(() => {}), 900);
    return;
  }
  if (!status.canRequestLoad) {
    botao.disabled = true;
    botao.textContent = "Anúncio indisponível";
    botao.dataset.rewardReason = status.reason || "";
    return;
  }
  botao.disabled = false;
  botao.textContent = "Assistir anúncio";
  botao.dataset.textoOriginal = "Assistir anúncio";
}

function mostrarModalDesbloqueioAnuncio({ tipo = "orders", titulo = "", texto = "" } = {}) {
  return new Promise((resolve) => {
    const popup = document.getElementById("popup");
    if (!popup) {
      alert(texto || "Assine o Premium para continuar.");
      resolve(false);
      return;
    }

    const rewardTypeMap = { pdf: "pdf", calculator: "calculator", calculadora: "calculator", reports: "reports", relatorios: "reports", ads: "ad_free", ad_free: "ad_free", orders: "orders" };
    const rewardType = rewardTypeMap[tipo] || "orders";
    popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-card limit-modal reward-modal">
          <div class="modal-header">
            <h2>${escaparHtml(titulo)}</h2>
            <button class="icon-button" type="button" id="rewardAdCancelTop" title="Fechar">✕</button>
          </div>
          <p class="muted">${escaparHtml(texto)}</p>
          <div class="actions">
            <button class="btn secondary" type="button" id="rewardAdWatch">Assistir anúncio</button>
            <button class="btn" type="button" id="rewardAdPlan">Assinar plano</button>
            <button class="btn ghost" type="button" id="rewardAdCancel">Agora não</button>
          </div>
        </div>
      </div>
    `;

    const finalizar = (valor) => {
      fecharPopup();
      resolve(valor);
    };
    const assistir = async () => {
      const botao = document.getElementById("rewardAdWatch");
      setBotaoLoading(botao, true, "Carregando...");
      try {
        const status = window.AdMobService?.getRewardedStatus?.(getUsuarioMonetizacao(), rewardType);
        if (status && !status.loaded) {
          const preload = await window.AdMobService?.preloadRewardedAd?.({ user: getUsuarioMonetizacao(), rewardType });
          if (!preload?.ok) {
            mostrarToast(mensagemRewardedPorResultado(preload || status), "warning", 4500);
            setBotaoLoading(botao, false);
            await atualizarBotaoRewardedModal(botao, rewardType);
            return;
          }
        }
        const resultado = await window.AdMobService?.showRewardedAd?.({
          user: getUsuarioMonetizacao(),
          rewardType,
          onReward: () => {
            if (rewardType !== "ad_free") window.MonetizationLimits?.unlockAdsByAd?.(getUsuarioMonetizacao());
            if (rewardType === "pdf") window.MonetizationLimits?.unlockPdfByAd?.(getUsuarioMonetizacao());
            else if (rewardType === "calculator") window.MonetizationLimits?.unlockCalculationsByAd?.(getUsuarioMonetizacao());
            else if (rewardType === "reports") window.MonetizationLimits?.unlockReportsByAd?.(getUsuarioMonetizacao());
            else if (rewardType === "ad_free") window.MonetizationLimits?.unlockAdsByAd?.(getUsuarioMonetizacao());
            else window.MonetizationLimits?.unlockOrdersByAd?.(getUsuarioMonetizacao());
          },
          onError: (erro) => registrarErroAplicacaoSilencioso("ADMOB_REWARDED_LOAD_FAILED", erro, "Rewarded Ad", { rewardType })
        });
        if (resultado?.rewarded) {
          const mensagens = {
            pdf: "PDF premium liberado temporariamente.",
            calculator: "+20 cálculos liberados.",
            reports: "Relatório avançado liberado temporariamente.",
            ad_free: "Anúncios pausados por 10 minutos.",
            orders: "Recursos liberados temporariamente."
          };
          mostrarToast(mensagens[rewardType] || "Recompensa aplicada.", "sucesso", 4500);
          finalizar(true);
          return;
        }
        mostrarToast(mensagemRewardedPorResultado(resultado), resultado?.cancelled ? "info" : "warning", 4500);
        setBotaoLoading(botao, false);
        await atualizarBotaoRewardedModal(botao, rewardType);
      } catch (erro) {
        registrarErroAplicacaoSilencioso("ADMOB_REWARDED_LOAD_FAILED", erro, "Rewarded Ad", { rewardType });
        mostrarToast("Anúncio indisponível no momento.", "erro", 5000);
        setBotaoLoading(botao, false);
        await atualizarBotaoRewardedModal(botao, rewardType);
      }
    };

    document.getElementById("rewardAdWatch")?.addEventListener("click", assistir);
    atualizarBotaoRewardedModal(document.getElementById("rewardAdWatch"), rewardType).catch(() => {});
    document.getElementById("rewardAdPlan")?.addEventListener("click", () => {
      finalizar(false);
      trocarTela("assinatura");
    }, { once: true });
    document.getElementById("rewardAdCancel")?.addEventListener("click", () => finalizar(false), { once: true });
    document.getElementById("rewardAdCancelTop")?.addEventListener("click", () => finalizar(false), { once: true });
    popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) finalizar(false);
    });
  });
}

const InventoryService = {
  parseNumberStrict(valor, campo = "valor", { min = null, allowZero = true } = {}) {
    if (valor === null || valor === undefined || String(valor).trim() === "") {
      throw new AppError("Valor Inválido", {
        code: "VALIDATION_INVALID_NUMBER",
        userMessage: `Informe ${campo}.`
      });
    }
    const numero = Number(String(valor).replace(",", "."));
    if (!Number.isFinite(numero) || Number.isNaN(numero)) {
      throw new AppError("Valor Inválido", {
        code: "VALIDATION_INVALID_NUMBER",
        userMessage: `${campo} precisa ser um número válido.`
      });
    }
    if (!allowZero && numero === 0) {
      throw new AppError("Valor Inválido", {
        code: "VALIDATION_INVALID_NUMBER",
        userMessage: `${campo} precisa ser maior que zero.`
      });
    }
    if (min !== null && numero < min) {
      throw new AppError("Valor Inválido", {
        code: "VALIDATION_INVALID_NUMBER",
        userMessage: `${campo} precisa ser maior ou igual a ${min}.`
      });
    }
    return numero;
  },
  getMateriais() {
    return normalizarEstoque();
  },
  addMaterial({ tipo, cor, qtd }) {
    const tipoNormalizado = String(tipo || "PLA").trim() || "PLA";
    const corNormalizada = String(cor || "").trim();
    const nome = [tipoNormalizado, corNormalizada].filter(Boolean).join(" ");
    const quantidade = this.parseNumberStrict(qtd, "quantidade em kg", { min: 0, allowZero: false });
    const atual = normalizarEstoque();
    const indice = atual.findIndex((material) => material.tipo === tipoNormalizado && String(material.cor || "").toLowerCase() === corNormalizada.toLowerCase());
    const proximo = indice >= 0
      ? atual.map((material, i) => i === indice
        ? prepararRegistroOnline({ ...material, qtd: this.parseNumberStrict(material.qtd, "saldo atual", { min: 0 }) + quantidade })
        : material)
      : [...atual, prepararRegistroOnline(normalizarMaterialEstoque({ id: Date.now(), nome, tipo: tipoNormalizado, cor: corNormalizada, qtd: quantidade }))];
    StateStore.set("estoque", proximo, { persistir: true });
    registrarHistorico("Estoque", "Material adicionado: " + nome + " (" + quantidade + " kg)");
    return proximo;
  },
  updateMaterial(indice, dados = {}) {
    const atual = normalizarEstoque();
    const material = atual[Number(indice)];
    if (!material) {
      throw new AppError("Material não encontrado", {
        code: "INVENTORY_NOT_FOUND",
        userMessage: "Material não encontrado no estoque."
      });
    }
    const nomeInformado = String(dados.nome ?? material.nome ?? "").trim();
    const tipo = inferirTipoMaterial(nomeInformado || material.nome);
    const cor = String(dados.cor ?? material.cor ?? "").trim();
    const qtd = this.parseNumberStrict(dados.qtd ?? material.qtd, "quantidade em kg", { min: 0 });
    const nome = nomeInformado || [tipo, cor].filter(Boolean).join(" ");
    const atualizado = prepararRegistroOnline(normalizarMaterialEstoque({
      ...material,
      nome,
      tipo,
      cor,
      qtd,
      atualizadoEm: new Date().toISOString()
    }));
    const proximo = atual.map((item, i) => i === Number(indice) ? atualizado : item);
    StateStore.set("estoque", proximo, { persistir: true });
    registrarHistorico("Estoque", "Material editado: " + atualizado.nome);
    return atualizado;
  },
  removeMaterial(indice) {
    const atual = normalizarEstoque();
    if (!atual[Number(indice)]) return atual;
    const proximo = atual.filter((_, i) => i !== Number(indice));
    StateStore.set("estoque", proximo, { persistir: true });
    registrarHistorico("Estoque", "Material removido");
    return proximo;
  },
  validateStockDiff(diff = []) {
    const faltas = [];
    const materiais = normalizarEstoque();
    diff.forEach((item) => {
      const consumo = this.parseNumberStrict(item.kg, "consumo de material", { min: null });
      if (consumo <= 0) return;
      const material = materiais.find((entrada) => String(entrada.id) === String(item.materialId));
      const saldo = material ? this.parseNumberStrict(material.qtd, "saldo do material", { min: 0 }) : 0;
      if (!material || saldo + 0.000001 < consumo) {
        faltas.push(`${material?.nome || "Material"}: precisa ${consumo.toFixed(3)} kg, saldo ${saldo.toFixed(3)} kg`);
      }
    });
    return faltas;
  },
  applyDiff(diff = [], motivo = "pedido") {
    const atual = normalizarEstoque();
    const movimentos = [];
    const proximo = atual.map((material) => {
      const item = diff.find((entrada) => String(entrada.materialId) === String(material.id));
      if (!item) return material;
      const consumo = this.parseNumberStrict(item.kg, "consumo de material", { min: null });
      const saldoAtual = this.parseNumberStrict(material.qtd, "saldo do material", { min: 0 });
      const saldoNovo = Math.max(0, saldoAtual - consumo);
      const tipoMovimento = consumo >= 0 ? "saída" : "entrada";
      movimentos.push(`${tipoMovimento} por ${motivo}: ${material.nome} (${Math.abs(consumo).toFixed(3)} kg)`);
      return prepararRegistroOnline({ ...material, qtd: saldoNovo, atualizadoEm: new Date().toISOString() });
    });
    StateStore.set("estoque", proximo, { persistir: true });
    movimentos.forEach((movimento) => registrarHistorico("Estoque", movimento));
    return proximo;
  }
};

const AuthService = {
  async login(emailEntrada, senha) {
    const email = normalizarEmail(emailEntrada || "");
    if (!email || !senha || !emailValido(email)) {
      throw new AppError("Campo obrigatório", {
        code: email && !emailValido(email) ? "AUTH_INVALID_EMAIL" : "AUTH_REQUIRED_FIELDS",
        userMessage: email && !emailValido(email) ? "Informe um e-mail válido." : "Informe e-mail e senha."
      });
    }
    try {
      if (!estaOnline()) {
        throw new AppError("Conexão necessária para entrar.", {
          code: "AUTH_ONLINE_REQUIRED",
          userMessage: "Conexão necessária para entrar."
        });
      }

      StateStore.set("usuarios", normalizarUsuarios(usuarios));
      const usuario = await this.loginWithSupabase(email, senha);
      if (!usuario || !syncConfig.supabaseUserId) {
        registrarFalhaLogin(email, "Sessão Supabase sem auth.uid");
        throw new AppError("Sessão Supabase inválida", {
          code: "AUTH_UID_REQUIRED",
          userMessage: "Não foi possível validar sua sessão online."
        });
      }
      console.info("[Auth][login]", { email, auth_uid: syncConfig.supabaseUserId, source: "supabase" });
      const hidratado = await this.hydrateAuthenticatedUser(usuario, { source: "supabase" });
      await sincronizarFilaOfflinePendente("login").catch((erro) => registrarDiagnostico("sync", "Fila offline pós-login falhou", erro.message));
      return { usuario: hidratado || usuario, source: "supabase" };
    } catch (erro) {
      registrarFalhaLogin(email, erro?.message || "Falha online");
      throw ErrorService.capture(erro, { area: "Autenticação", action: "Login", errorKey: "LOGIN_FAILED" });
    }
  },
  async loginWithSupabase(email, senha) {
    try {
      const usuario = await loginUsuarioSupabase(email, senha);
      if (!usuario) {
        throw new AppError("Sessão Supabase não retornou usuário", {
          code: "AUTH_EMPTY_SUPABASE_USER",
          userMessage: "Não foi possível carregar seu perfil online."
        });
      }
      return usuario;
    } catch (erro) {
      throw ErrorService.capture(erro, { area: "Supabase", action: "Login com senha", errorKey: "LOGIN_FAILED", silent: true });
    }
  },
  async recoverOnlineAccount(usuario, senha, erroOriginal) {
    if (erroSupabaseCredenciaisInvalidas(erroOriginal)) {
      try {
        const usuarioCriadoOnline = await criarContaSupabaseParaUsuarioLocal(usuario, senha);
        if (usuarioCriadoOnline) return usuarioCriadoOnline;
        mostrarToast("Confirme seu e-mail para ativar a sincronização online.", "info", 6500);
        return usuario;
      } catch (erroCadastro) {
        marcarUsuarioSupabasePendente(usuario, erroCadastro.message);
        salvarDados();
        throw ErrorService.capture(erroCadastro, { area: "Supabase", action: "Criação online pós-login", silent: true });
      }
    }
    if (erroSupabaseEmailNaoConfirmado(erroOriginal)) {
      marcarUsuarioSupabasePendente(usuario, erroOriginal.message);
      salvarDados();
      mostrarToast("Confirme seu e-mail para ativar a sincronização online.", "info", 6500);
      return usuario;
    }
    ErrorService.capture(erroOriginal, { area: "Supabase", action: "Login local sem sincronização online", silent: true });
    return usuario;
  },
  async hydrateAuthenticatedUser(usuario, contexto = {}) {
    try {
      let hidratado = usuario;
      if (syncConfig.supabaseAccessToken && syncConfig.supabaseUserId) {
        hidratado = await carregarPerfilSaasSupabase(usuario);
        marcarUsuarioSupabaseSincronizado(hidratado);
        await garantirCadastroSaasOnlineAposLogin(hidratado);
        await consultarLicencaSupabaseSilencioso({ motivo: "login-hydrate" });
        await this.verifyRlsHealth();
      }
      return StateStore.hydrateAuthenticatedUser(hidratado);
    } catch (erro) {
      throw ErrorService.capture(erro, { area: "Autenticação", action: "Carregar perfil pós-login", errorKey: "LOAD_PROFILE_FAILED", detail: contexto.source || "" });
    }
  },
  async verifyRlsHealth() {
    if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !syncConfig.supabaseUrl) {
      return { ok: true, skipped: true };
    }
    const checks = [
      {
        name: "erp_profiles.select",
        run: () => requisicaoSupabase(`/rest/v1/erp_profiles?select=id,email,client_id&id=eq.${encodeURIComponent(syncConfig.supabaseUserId)}&limit=1`, { method: "GET" })
      },
      {
        name: "profiles.select",
        run: () => requisicaoSupabase(`/rest/v1/profiles?select=id,user_id,client_id&user_id=eq.${encodeURIComponent(syncConfig.supabaseUserId)}&limit=1`, { method: "GET" })
      },
      {
        name: "get_effective_license.rpc",
        run: () => requisicaoSupabase("/rest/v1/rpc/get_effective_license", { method: "POST", body: JSON.stringify({}) })
      }
    ];
    const falhas = [];
    for (const check of checks) {
      try {
        await check.run();
      } catch (erro) {
        falhas.push(`${check.name}: ${erro.message}`);
      }
    }
    if (falhas.length) {
      registrarDiagnostico("Supabase/RLS", "Verificação RLS pós-login", falhas.join(" | "));
      registrarErroAplicacaoSilencioso("SUPABASE_RLS_DENIED", new Error(falhas.join(" | ")), "Verificação RLS pós-login", { falhas });
      return { ok: false, falhas };
    }
    registrarDiagnostico("Supabase/RLS", "Verificação RLS pós-login", "OK");
    return { ok: true, falhas: [] };
  },
  async signupSaas({ nome, email, senha, negocio, telefone, cnpj = "" }) {
    if (!emailValido(email)) {
      throw new AppError("E-mail inválido", {
        code: "AUTH_INVALID_EMAIL",
        userMessage: "Informe um e-mail válido."
      });
    }
    if (!estaOnline()) {
      throw new AppError("Conexão necessária para criar sua conta.", {
        code: "AUTH_ONLINE_REQUIRED",
        userMessage: "Conexão necessária para criar sua conta."
      });
    }

    let cadastroOnline = null;
    const emailNormalizado = normalizarEmail(email);
    limparResiduosCadastroLocal(emailNormalizado, { onlyPending: true });

    try {
      syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
      syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
      const dados = await requisicaoSupabase("/auth/v1/signup", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          password: senha,
          redirect_to: montarRedirectSupabaseEmail("signup"),
          data: {
            owner_name: nome,
            name: nome,
            company_name: negocio,
            business_name: negocio,
            phone: telefone,
            cnpj,
            accepted_terms: true
          }
        })
      });

      const usuarioAuth = obterUsuarioAuthResposta(dados);
      if (salvarSessaoSupabase(dados, email)) {
        cadastroOnline = await registrarClienteSaasSupabase({ nome, email, negocio, telefone, planSlug: "premium_trial" });
      } else if (usuarioAuth?.id) {
        syncConfig.supabaseUserId = "";
        syncConfig.supabaseAccessToken = "";
        syncConfig.supabaseRefreshToken = "";
        syncConfig.supabaseTokenExpiresAt = 0;
        syncConfig.supabaseEmail = email;
        salvarDados();
        throw new AppError("Conta criada no Supabase aguardando confirmação de e-mail", {
          code: "AUTH_EMAIL_CONFIRMATION_REQUIRED",
          userMessage: "Conta criada. Confirme o e-mail antes de entrar."
        });
      }

      if (!cadastroOnline?.client_id) {
        throw new AppError("Cadastro SaaS remoto não retornou cliente", {
          code: "AUTH_REMOTE_PROFILE_FAILED",
          userMessage: "Não foi possível concluir o cadastro online. Tente novamente."
        });
      }
    } catch (erro) {
      const appError = ErrorService.capture(erro, { area: "Supabase", action: "Cadastro online", errorKey: "SIGNUP_FAILED", silent: true });
      if (appError.code !== "AUTH_ALREADY_REGISTERED") limparResiduosCadastroLocal(emailNormalizado, { onlyPending: true });
      throw appError;
    }

    const local = criarClienteSaasLocal({ nome, email, senha, negocio, telefone, planSlug: "premium_trial", trial: true });
    if (cadastroOnline?.client_id) {
      const clientIdOnline = String(cadastroOnline.client_id);
      local.cliente.id = clientIdOnline;
      local.assinatura.clientId = clientIdOnline;
      local.usuario.clientId = clientIdOnline;
      billingConfig.clientId = clientIdOnline;
    }
    if (cadastroOnline?.company_id) {
      const companyIdOnline = String(cadastroOnline.company_id);
      local.cliente.companyId = companyIdOnline;
      local.assinatura.companyId = companyIdOnline;
      local.usuario.companyId = companyIdOnline;
      billingConfig.companyId = companyIdOnline;
    }
    if (cadastroOnline?.client_code) {
      local.cliente.clientCode = String(cadastroOnline.client_code);
    }
    if (cadastroOnline?.subscription_id) {
      local.assinatura.id = String(cadastroOnline.subscription_id);
      billingConfig.subscriptionId = local.assinatura.id;
    }
    local.usuario.supabasePending = !cadastroOnline?.client_id;
    local.usuario.supabaseUserId = syncConfig.supabaseUserId || local.usuario.supabaseUserId || "";
    local.usuario.supabaseLastSyncAt = cadastroOnline?.client_id ? new Date().toISOString() : "";
    local.cliente.sync_status = "synced";
    local.assinatura.sync_status = "synced";
    local.usuario.sync_status = "synced";
    await definirSenhaUsuario(local.usuario, senha, false);
    await consultarLicencaSupabaseSilencioso().catch((erro) => registrarDiagnostico("Supabase", "Licença pós-cadastro não carregada", erro.message));
    await sincronizarFilaOfflinePendente("signup").catch((erro) => registrarDiagnostico("sync", "Fila offline pós-cadastro falhou", erro.message));
    salvarDados();
    console.info("[Auth][signup]", { email, auth_uid: syncConfig.supabaseUserId, client_id: cadastroOnline?.client_id || "", sync_status: "synced" });
    return { ...local, cadastroOnline, cadastroAguardandoConfirmacao: false };
  }
};

if (typeof window !== "undefined") {
  window.AppError = AppError;
  window.StateStore = StateStore;
  window.ErrorService = ErrorService;
  window.AuthService = AuthService;
  window.InventoryService = InventoryService;
  window.PlanService = PlanService;
}

const printers = {
  "Ender 3": { tipo: "FDM", consumo: 120, custo: 1 },
  "Ender 3 V2": { tipo: "FDM", consumo: 130, custo: 1.2 },
  "Ender 5": { tipo: "FDM", consumo: 140, custo: 1.4 },
  "Bambu Lab": { tipo: "FDM", consumo: 250, custo: 2.5 },
  "Bambu A1": { tipo: "FDM", consumo: 220, custo: 2.2 },
  "Bambu P1P": { tipo: "FDM", consumo: 250, custo: 2.5 },
  "Bambu X1": { tipo: "FDM", consumo: 300, custo: 3 },
  "Bambu X1 Carbon": { tipo: "FDM", consumo: 320, custo: 3.2 },
  "Anycubic Photon": { tipo: "RESINA", consumo: 55, custo: 1.5 },
  "Elegoo Mars": { tipo: "RESINA", consumo: 48, custo: 1.4 },
  "Elegoo Saturn": { tipo: "RESINA", consumo: 80, custo: 2 },
  "Anycubic Kobra": { tipo: "FDM", consumo: 140, custo: 1.3 },
  "Creality K1": { tipo: "FDM", consumo: 220, custo: 2.2 },
  "Prusa MK3S+": { tipo: "FDM", consumo: 150, custo: 1.8 },
  "Elegoo Neptune 4": { tipo: "FDM", consumo: 180, custo: 1.9 }
};

const tiposMaterial = ["PLA", "PETG", "TPU", "RESINA"];
const MATERIAL_ADD_OPTION = "__add_material__";
const MATERIAL_COLOR_PALETTE = [
  { nome: "Preto", cor: "#111827" },
  { nome: "Branco", cor: "#f8fafc" },
  { nome: "Cinza", cor: "#94a3b8" },
  { nome: "Prata", cor: "#cbd5e1" },
  { nome: "Vermelho", cor: "#ef4444" },
  { nome: "Azul", cor: "#2563eb" },
  { nome: "Verde", cor: "#22c55e" },
  { nome: "Amarelo", cor: "#facc15" },
  { nome: "Laranja", cor: "#f97316" },
  { nome: "Roxo", cor: "#8b5cf6" },
  { nome: "Transparente", cor: "linear-gradient(135deg, rgba(255,255,255,.9), rgba(125,211,252,.55))" },
  { nome: "Natural", cor: "#f5deb3" }
];
const estoqueMinimoKg = 0.1;

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dashboardWidgets = [
  { id: "dashboard", titulo: "Resumo", icone: "📊" },
  { id: "pedido", titulo: "Novo pedido", icone: "📦" },
  { id: "estoque", titulo: "Estoque", icone: "📦" },
  { id: "pedidos", titulo: "Pedidos", icone: "📋" },
  { id: "caixa", titulo: "Caixa", icone: "💰" }
];

const dashboardDefaultSizes = {
  dashboard: "m",
  pedido: "m",
  estoque: "m",
  pedidos: "m",
  caixa: "m"
};

const dashboardSizeConfig = {
  s: { span: 3, minHeight: 260 },
  m: { span: 4, minHeight: 320 },
  l: { span: 6, minHeight: 390 },
  xl: { span: 12, minHeight: 500 }
};

const dashboardDefaultWindows = {
  dashboard: { x: 0, y: 0, w: 380, h: 365, z: 1 },
  pedido: { x: 400, y: 0, w: 430, h: 430, z: 2 },
  estoque: { x: 850, y: 0, w: 390, h: 300, z: 3 },
  pedidos: { x: 0, y: 395, w: 400, h: 260, z: 4 },
  caixa: { x: 420, y: 455, w: 430, h: 455, z: 5 }
};

function carregarLista(chave) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch (erro) {
    console.warn("Não foi possível carregar", chave, erro);
    return [];
  }
}

function carregarObjeto(chave, fallback = {}) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "null");
    return valor && typeof valor === "object" && !Array.isArray(valor) ? { ...fallback, ...valor } : { ...fallback };
  } catch (erro) {
    console.warn("Não foi possível carregar", chave, erro);
    return { ...fallback };
  }
}

function sincronizarBannerAdSense() {
  try {
    window.AdSenseService?.configure?.({
      enabled: appConfig.adsenseWebEnabled === true,
      publisherId: appConfig.adsensePublisherId || ADSENSE_WEB_DEFAULT_PUBLISHER_ID,
      bannerSlot: appConfig.adsenseBannerSlot || ADSENSE_WEB_DEFAULT_BANNER_SLOT
    });
    const contexto = {
      ...contextoInterstitialSeguro("screen_view"),
      isAuthScreen: window.__simplificaLocalLockActive || document.body?.classList.contains("auth-screen-active") || !getUsuarioAtual() || isTelaPublica(telaAtual),
      isModalOpen: !!document.getElementById("popup")?.innerHTML
    };
    const resultado = window.AdSenseService?.syncBannerForScreen?.(getUsuarioMonetizacao(), contexto);
    if (resultado?.catch) resultado.catch(() => {});
  } catch (erro) {
    registrarErroAplicacaoSilencioso("ADSENSE_BANNER_SYNC_FAILED", erro, "Banner AdSense", { tela: telaAtual });
  }
}

function getEscopoDadosAtual() {
  return pareceUuid(syncConfig.supabaseUserId) ? String(syncConfig.supabaseUserId) : "";
}

function getChaveCacheDadosUsuario(escopo = getEscopoDadosAtual()) {
  return escopo ? `${USER_DATA_CACHE_PREFIX}${escopo}` : "";
}

function getChaveFilaSyncUsuario(escopo = getEscopoDadosAtual()) {
  return escopo ? `${PENDING_SYNC_QUEUE_KEY}_${escopo}` : PENDING_SYNC_QUEUE_KEY;
}

function lerCacheDadosUsuario(escopo = getEscopoDadosAtual()) {
  const chave = getChaveCacheDadosUsuario(escopo);
  if (!chave) return null;
  try {
    const cache = JSON.parse(localStorage.getItem(chave) || "null");
    return cache && typeof cache === "object" && !Array.isArray(cache) ? cache : null;
  } catch (erro) {
    console.warn("Não foi possível carregar cache de dados", escopo, erro);
    return null;
  }
}

function criarSnapshotDadosUsuario(escopo = getEscopoDadosAtual()) {
  return {
    version: 1,
    scopeId: escopo || "",
    savedAt: new Date().toISOString(),
    data: {
      estoque,
      caixa,
      pedidos,
      orcamentos,
      historico,
      diagnostics,
      sugestoes,
      securityLogs,
      auditLogs,
      saasClients,
      saasSubscriptions,
      saasPayments,
      saasSessions,
      appConfig,
      billingConfig,
      usageCounters
    }
  };
}

function salvarCacheDadosUsuario(escopo = getEscopoDadosAtual()) {
  const chave = getChaveCacheDadosUsuario(escopo);
  if (!chave) return false;
  localStorage.setItem(chave, JSON.stringify(criarSnapshotDadosUsuario(escopo)));
  return true;
}

function aplicarCacheDadosUsuario(cache) {
  const data = cache?.data && typeof cache.data === "object" ? cache.data : {};
  estoque = Array.isArray(data.estoque) ? data.estoque : [];
  caixa = Array.isArray(data.caixa) ? data.caixa : [];
  pedidos = Array.isArray(data.pedidos) ? data.pedidos : [];
  orcamentos = Array.isArray(data.orcamentos) ? data.orcamentos : [];
  historico = Array.isArray(data.historico) ? data.historico : [];
  diagnostics = Array.isArray(data.diagnostics) ? data.diagnostics : [];
  sugestoes = Array.isArray(data.sugestoes) ? data.sugestoes : [];
  securityLogs = Array.isArray(data.securityLogs) ? data.securityLogs : [];
  auditLogs = Array.isArray(data.auditLogs) ? data.auditLogs : [];
  saasClients = Array.isArray(data.saasClients) ? data.saasClients : [];
  saasSubscriptions = Array.isArray(data.saasSubscriptions) ? data.saasSubscriptions : [];
  saasPayments = Array.isArray(data.saasPayments) ? data.saasPayments : [];
  saasSessions = Array.isArray(data.saasSessions) ? data.saasSessions : [];
  appConfig = data.appConfig && typeof data.appConfig === "object" ? { ...appConfig, ...data.appConfig } : appConfig;
  billingConfig = data.billingConfig && typeof data.billingConfig === "object" ? { ...billingConfig, ...data.billingConfig } : billingConfig;
  usageCounters = data.usageCounters && typeof data.usageCounters === "object" ? data.usageCounters : {};
}

function limparDadosOperacionaisLocais() {
  estoque = [];
  caixa = [];
  pedidos = [];
  orcamentos = [];
  historico = [];
  diagnostics = [];
  sugestoes = [];
  securityLogs = [];
  auditLogs = [];
  saasClients = [];
  saasSubscriptions = [];
  saasPayments = [];
  saasSessions = [];
  pendingSync = [];
  pedidoEditando = null;
  pedidoVisualizandoId = null;
  itensPedido = [];
  clientePedido = "";
  clienteTelefonePedido = "";
}

function removerCachesOperacionaisGlobais() {
  USER_SCOPED_LIST_KEYS.forEach((chave) => localStorage.removeItem(chave));
  localStorage.removeItem(PENDING_SYNC_QUEUE_KEY);
}

function limparCacheTemporarioContaAnterior() {
  removerCachesOperacionaisGlobais();
  window.__pedidosFiltroDashboard = "";
  window.__pedidosLimite = LIST_PAGE_SIZE;
  window.__clienteSaasSelecionadoId = "";
}

function listaTemDadosOperacionais(lista) {
  return Array.isArray(lista) && lista.length > 0;
}

function possuiDadosOperacionaisLocais() {
  return [estoque, pedidos, caixa, orcamentos].some(listaTemDadosOperacionais);
}

function cacheTemDadosOperacionais(cache) {
  const data = cache?.data && typeof cache.data === "object" ? cache.data : {};
  return [data.estoque, data.pedidos, data.caixa, data.orcamentos].some(listaTemDadosOperacionais);
}

function backupTemDadosOperacionais(dados) {
  const backup = normalizarBackup(dados);
  return [backup.estoque, backup.pedidos, backup.caixa, backup.orcamentos].some(listaTemDadosOperacionais);
}

function atribuirDonoRemotoLista(lista, escopo = getEscopoDadosAtual()) {
  if (!escopo) return Array.isArray(lista) ? lista : [];
  return (Array.isArray(lista) ? lista : []).map((item) => {
    if (!item || typeof item !== "object") return item;
    const atualizadoEm = item.updated_at || item.updatedAt || item.atualizadoEm || new Date().toISOString();
    return {
      ...item,
      user_id: escopo,
      owner_id: escopo,
      source_device_id: item.source_device_id || item.sourceDeviceId || deviceId,
      sourceDeviceId: item.sourceDeviceId || item.source_device_id || deviceId,
      sync_status: item.sync_status || item.syncStatus || "pending",
      updated_at: atualizadoEm,
      updatedAt: item.updatedAt || atualizadoEm
    };
  });
}

function atribuirDonoRemotoDadosLocais(escopo = getEscopoDadosAtual()) {
  if (!escopo) return;
  estoque = atribuirDonoRemotoLista(estoque, escopo);
  caixa = atribuirDonoRemotoLista(caixa, escopo);
  pedidos = atribuirDonoRemotoLista(pedidos, escopo);
  orcamentos = atribuirDonoRemotoLista(orcamentos, escopo);
}

function marcarRegistroAlteradoParaSync(registro = {}, campos = {}) {
  const agora = new Date().toISOString();
  return prepararRegistroOnline({
    ...registro,
    ...campos,
    atualizadoEm: agora,
    updated_at: agora,
    updatedAt: agora,
    sync_status: "pending",
    syncStatus: "pending",
    synced_at: "",
    sync_error: ""
  });
}

function marcarRegistroLocalAlteradoParaSync(registro, campos = {}) {
  if (!registro || typeof registro !== "object") return registro;
  Object.assign(registro, marcarRegistroAlteradoParaSync(registro, campos));
  return registro;
}

function atualizarIndicadorSincronizacao(status = "idle", texto = "") {
  if (typeof document === "undefined" || !document.body) return;
  window.__simplificaSyncing = status === "syncing";
  let indicador = document.getElementById("syncIndicator");
  if (syncIndicatorTimer) {
    clearTimeout(syncIndicatorTimer);
    syncIndicatorTimer = null;
  }
  if (status === "idle") {
    indicador?.classList.add("is-hidden");
    syncIndicatorTimer = setTimeout(() => indicador?.remove(), 220);
    return;
  }
  if (!indicador) {
    indicador = document.createElement("div");
    indicador.id = "syncIndicator";
    indicador.className = "sync-indicator";
    indicador.innerHTML = `<span class="sync-spinner" aria-hidden="true"></span><strong></strong>`;
    document.body.appendChild(indicador);
  }
  indicador.className = `sync-indicator sync-${status}`;
  indicador.querySelector("strong").textContent = texto || (status === "pending" ? "Na fila" : status === "success" ? "Salvo" : status === "error" ? "Offline" : "Salvando");
  if (["success", "error"].includes(status)) {
    syncIndicatorTimer = setTimeout(() => atualizarIndicadorSincronizacao("idle"), status === "success" ? 1200 : 2200);
  }
}

function sincronizarAlteracoesLocaisSilencioso(motivo = "data-change") {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !syncConfig.supabaseEnabled) return Promise.resolve(false);
  recomporFilaSyncPendente();
  if (!pendingSync.length && motivo !== "login" && motivo !== "online") return Promise.resolve(false);
  if (!estaOnline()) {
    syncConfig.autoBackupStatus = "Offline - fila pendente";
    salvarDados();
    atualizarIndicadorSincronizacao("pending", "Na fila");
    return Promise.resolve(false);
  }
  atualizarIndicadorSincronizacao("syncing", "Salvando");
  return sincronizarSupabaseSilencioso()
    .then((ok) => {
      atualizarIndicadorSincronizacao(ok ? "success" : "pending", ok ? "Salvo" : "Na fila");
      return ok;
    })
    .catch((erro) => {
      registrarDiagnostico("sync", `Sync silencioso após ${motivo} falhou`, erro.message);
      atualizarIndicadorSincronizacao("error", "Offline");
      return false;
    });
}

function agendarSyncSilenciosoDados(motivo = "data-change", atrasoMs = 1200) {
  if (typeof window === "undefined" || typeof setTimeout !== "function") return;
  recomporFilaSyncPendente();
  if (!estaOnline()) {
    syncConfig.autoBackupStatus = "Offline - fila pendente";
    salvarDados();
    atualizarIndicadorSincronizacao("pending", "Na fila");
    return;
  }
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !syncConfig.supabaseEnabled) return;
  atualizarIndicadorSincronizacao("syncing", "Salvando");
  if (dataSyncDebounceTimer) clearTimeout(dataSyncDebounceTimer);
  dataSyncDebounceTimer = setTimeout(() => {
    dataSyncDebounceTimer = null;
    sincronizarAlteracoesLocaisSilencioso(motivo);
  }, atrasoMs);
}

function capturarLicencaBackendFresca() {
  if (!licencaEfetivaRemotaFresca()) return null;
  return BACKEND_LICENSE_CACHE_KEYS.reduce((snapshot, chave) => {
    if (Object.prototype.hasOwnProperty.call(billingConfig, chave)) snapshot[chave] = billingConfig[chave];
    return snapshot;
  }, {});
}

function restaurarLicencaBackendFresca(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  Object.assign(billingConfig, snapshot);
}

function ativarEscopoDadosUsuarioAtual(motivo = "session", opcoes = {}) {
  const escopo = getEscopoDadosAtual();
  if (!escopo) return false;
  scopedDataCacheReady = true;
  const anterior = localStorage.getItem(ACTIVE_DATA_SCOPE_KEY) || "";
  if (anterior === escopo) {
    const cache = lerCacheDadosUsuario(escopo);
    if (!possuiDadosOperacionaisLocais() && cacheTemDadosOperacionais(cache)) {
      aplicarCacheDadosUsuario(cache);
      console.info("[SyncScope][hydrate]", { motivo, auth_uid: escopo, restored_cache: true });
    }
    atribuirDonoRemotoDadosLocais(escopo);
    pendingSync = carregarLista(getChaveFilaSyncUsuario(escopo));
    return false;
  }

  if (anterior) salvarCacheDadosUsuario(anterior);
  limparDadosOperacionaisLocais();
  localStorage.setItem(ACTIVE_DATA_SCOPE_KEY, escopo);
  const cache = lerCacheDadosUsuario(escopo);
  if (cache) aplicarCacheDadosUsuario(cache);
  pendingSync = carregarLista(getChaveFilaSyncUsuario(escopo));
  atribuirDonoRemotoDadosLocais(escopo);
  limparCacheTemporarioContaAnterior();
  dataScopeChangedOnCurrentSession = true;
  console.info("[SyncScope][switch]", { motivo, previous_scope: anterior || "", auth_uid: escopo, restored_cache: !!cache });
  if (opcoes.persistir !== false) salvarDados();
  return true;
}

function estaOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function limparResiduosCadastroLocal(email, { onlyPending = true } = {}) {
  const alvo = normalizarEmail(email || "");
  if (!alvo) return false;

  const usuariosAntes = normalizarUsuarios(usuarios);
  const removiveis = usuariosAntes.filter((usuario) => {
    if (normalizarEmail(usuario.email) !== alvo) return false;
    if (!onlyPending) return true;
    const clientId = String(usuario.clientId || "");
    return usuario.supabasePending === true && !usuario.supabaseUserId && (!clientId || clientId.startsWith("client-"));
  });
  if (!removiveis.length) return false;

  const clientIds = new Set(removiveis.map((usuario) => String(usuario.clientId || "")).filter(Boolean));
  usuarios = usuariosAntes.filter((usuario) => !removiveis.some((item) => item.email === usuario.email && String(item.clientId || "") === String(usuario.clientId || "")));
  saasClients = saasClients.filter((cliente) => normalizarEmail(cliente.email) !== alvo && !clientIds.has(String(cliente.id || "")));
  saasSubscriptions = saasSubscriptions.filter((assinatura) => !clientIds.has(String(assinatura.clientId || assinatura.client_id || "")));
  saasSessions = saasSessions.filter((sessao) => !clientIds.has(String(sessao.clientId || sessao.client_id || "")));

  if (normalizarEmail(billingConfig.licenseEmail) === alvo && clientIds.has(String(billingConfig.clientId || ""))) {
    billingConfig.clientId = "";
    billingConfig.companyId = "";
    billingConfig.subscriptionId = "";
    billingConfig.licenseEmail = "";
    billingConfig.activePlan = "free";
    billingConfig.planSlug = "free";
    billingConfig.licenseStatus = "free";
    billingConfig.subscriptionStatus = "free";
    billingConfig.isTrialActive = false;
  }

  registrarDiagnostico("Auth", "Resíduo local de cadastro pendente removido", alvo);
  salvarDados();
  return true;
}

function criarDeviceId() {
  const id = "erp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  localStorage.setItem("deviceId", id);
  return id;
}

function abrirDriveDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB não disponível neste navegador"));
      return;
    }

    const request = indexedDB.open("erp3d-google-drive", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("handles");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function salvarDriveHandle(handle) {
  const db = await abrirDriveDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    tx.objectStore("handles").put(handle, "backupFolder");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function carregarDriveHandle() {
  if (driveFolderHandle) return driveFolderHandle;

  try {
    const db = await abrirDriveDb();
    driveFolderHandle = await new Promise((resolve, reject) => {
      const tx = db.transaction("handles", "readonly");
      const request = tx.objectStore("handles").get("backupFolder");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    return driveFolderHandle;
  } catch (erro) {
    return null;
  }
}

function salvarDados() {
  const escopo = scopedDataCacheReady ? getEscopoDadosAtual() : "";
  if (escopo) {
    atribuirDonoRemotoDadosLocais(escopo);
    salvarCacheDadosUsuario(escopo);
    removerCachesOperacionaisGlobais();
  } else {
    localStorage.setItem("estoque", JSON.stringify(estoque));
    localStorage.setItem("caixa", JSON.stringify(caixa));
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
    localStorage.setItem("orcamentos", JSON.stringify(orcamentos));
    localStorage.setItem("historico", JSON.stringify(historico));
    localStorage.setItem("diagnostics", JSON.stringify(diagnostics));
    localStorage.setItem("sugestoes", JSON.stringify(sugestoes));
    localStorage.setItem("securityLogs", JSON.stringify(securityLogs));
    localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
    localStorage.setItem(PENDING_SYNC_QUEUE_KEY, JSON.stringify(pendingSync));
  }
  localStorage.setItem("passwordResetTokens", JSON.stringify(passwordResetTokens));
  localStorage.setItem("saasPlans", JSON.stringify(saasPlans));
  localStorage.setItem("usageCounters", JSON.stringify(usageCounters));
  localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  localStorage.setItem("syncConfig", JSON.stringify(criarSyncConfigPersistente()));
  localStorage.setItem("appConfig", JSON.stringify(appConfig));
  localStorage.setItem("billingConfig", JSON.stringify(billingConfig));
  localStorage.setItem("dashboardPeriod", dashboardPeriod);
  localStorage.setItem("dashboardAnalyticsCache", JSON.stringify(dashboardAnalyticsCache));
}

function criarSyncConfigPersistente() {
  const {
    supabaseAccessToken,
    supabaseRefreshToken,
    supabaseTokenExpiresAt,
    ...persistente
  } = syncConfig || {};
  return persistente;
}

function salvarSessaoSensivelSupabase() {
  const sessao = {
    supabaseAccessToken: syncConfig.supabaseAccessToken || "",
    supabaseRefreshToken: syncConfig.supabaseRefreshToken || "",
    supabaseTokenExpiresAt: Number(syncConfig.supabaseTokenExpiresAt) || 0,
    supabaseUserId: syncConfig.supabaseUserId || "",
    supabaseEmail: syncConfig.supabaseEmail || ""
  };
  sessionStorage.setItem("supabaseSession", JSON.stringify(sessao));
  salvarCacheSessaoLocal();
}

function carregarSessaoSensivelSupabase() {
  try {
    sanitizarCacheSessaoLocalLegado();
    const sessaoSessao = JSON.parse(sessionStorage.getItem("supabaseSession") || "{}");
    const cacheLocal = JSON.parse(localStorage.getItem(LOCAL_SESSION_CACHE_KEY) || "{}");
    const supabaseLocal = cacheLocal.supabase || {};
    syncConfig = {
      ...syncConfig,
      supabaseAccessToken: sessaoSessao.supabaseAccessToken || syncConfig.supabaseAccessToken || "",
      supabaseRefreshToken: sessaoSessao.supabaseRefreshToken || supabaseLocal.supabaseRefreshToken || syncConfig.supabaseRefreshToken || "",
      supabaseTokenExpiresAt: Number(sessaoSessao.supabaseTokenExpiresAt) || Number(supabaseLocal.supabaseTokenExpiresAt) || Number(syncConfig.supabaseTokenExpiresAt) || 0,
      supabaseUserId: sessaoSessao.supabaseUserId || supabaseLocal.supabaseUserId || syncConfig.supabaseUserId || "",
      supabaseEmail: sessaoSessao.supabaseEmail || supabaseLocal.supabaseEmail || syncConfig.supabaseEmail || ""
    };
    ativarEscopoDadosUsuarioAtual("load-sensitive-session", { persistir: false });
  } catch (_) {}
}

function sanitizarCacheSessaoLocalLegado() {
  if (appConfig.keepSessionCache === false) return;
  try {
    const cache = JSON.parse(localStorage.getItem(LOCAL_SESSION_CACHE_KEY) || "{}");
    if (!cache?.supabase) return;
    if (!cache.supabase.supabaseAccessToken && !cache.supabase.supabaseRefreshToken) return;
    const seguro = {
      usuarioAtualEmail: normalizarEmail(cache.usuarioAtualEmail || cache.supabase.supabaseEmail || ""),
      salvoEm: cache.salvoEm || new Date().toISOString(),
      supabase: {
        supabaseUserId: cache.supabase.supabaseUserId || "",
        supabaseEmail: normalizarEmail(cache.supabase.supabaseEmail || ""),
        supabaseRefreshToken: cache.supabase.supabaseRefreshToken || "",
        supabaseTokenExpiresAt: Number(cache.supabase.supabaseTokenExpiresAt) || 0
      }
    };
    localStorage.setItem(LOCAL_SESSION_CACHE_KEY, JSON.stringify(seguro));
  } catch (_) {
    localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
  }
}

function limparSessaoSensivelSupabase() {
  syncConfig.supabaseAccessToken = "";
  syncConfig.supabaseRefreshToken = "";
  syncConfig.supabaseTokenExpiresAt = 0;
  sessionStorage.removeItem("supabaseSession");
  localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
}

function salvarCacheSessaoLocal() {
  if (appConfig.keepSessionCache === false) {
    localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
    return;
  }

  const usuario = normalizarEmail(usuarioAtualEmail);
  const cache = {
    usuarioAtualEmail: usuario,
    salvoEm: new Date().toISOString(),
    supabase: {
      supabaseUserId: syncConfig.supabaseUserId || "",
      supabaseEmail: normalizarEmail(syncConfig.supabaseEmail || ""),
      supabaseRefreshToken: syncConfig.supabaseRefreshToken || "",
      supabaseTokenExpiresAt: Number(syncConfig.supabaseTokenExpiresAt) || 0
    }
  };
  localStorage.setItem(LOCAL_SESSION_CACHE_KEY, JSON.stringify(cache));
}

function registrarDesbloqueioLocal(motivo = "manual") {
  const agora = new Date().toISOString();
  localStorage.setItem(LOCAL_UNLOCK_KEY, agora);
  console.info("[Auth][local-unlock]", { motivo, auth_uid: syncConfig.supabaseUserId || "", at: agora });
}

function getUltimoDesbloqueioLocalMs() {
  return Date.parse(localStorage.getItem(LOCAL_UNLOCK_KEY) || "") || 0;
}

function precisaDesbloqueioLocal() {
  if (!usuarioAtualEmail || !syncConfig.supabaseUserId) return false;
  const ultimo = getUltimoDesbloqueioLocalMs();
  return !ultimo || Date.now() - ultimo > LOCAL_UNLOCK_MAX_MS;
}

function licencaLocalAindaConfiavel() {
  const ultimo = Date.parse(billingConfig.lastOnlineLicenseValidationAt || billingConfig.effectiveLicenseUpdatedAt || "") || 0;
  return !!ultimo && Date.now() - ultimo <= OFFLINE_LICENSE_STALE_MAX_MS;
}

function ativarTravaLocal(motivo = "stale") {
  window.__simplificaLocalLockActive = true;
  window.__simplificaLocalLockReason = motivo;
}

function desativarTravaLocal(motivo = "unlock") {
  window.__simplificaLocalLockActive = false;
  window.__simplificaLocalLockReason = "";
  localLockModalOpen = false;
  registrarDesbloqueioLocal(motivo);
}

function renderTravaLocal() {
  return `
    <main class="auth-desktop-main">
      <section class="card auth-card">
        <div class="brand-lockup">
          <img class="auth-logo" src="${escaparAttr(getMarcaProjetoSrc("icon"))}" alt="Simplifica 3D">
          <h1>Simplifica 3D</h1>
          <p>Confirme sua senha para continuar usando este dispositivo.</p>
        </div>
        <form class="auth-form" onsubmit="desbloquearTravaLocalFormulario(event)">
          <label class="field auth-field">
            <span>Senha da conta</span>
            <div class="password-row auth-password-row">
              <input id="localUnlockPassword" type="password" autocomplete="current-password" placeholder="Sua senha" required>
              <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
            </div>
          </label>
          <div class="actions">
            <button id="localUnlockBtn" class="btn" type="submit">Desbloquear</button>
            <button class="btn ghost" type="button" onclick="logoutUsuario()">Sair</button>
          </div>
        </form>
      </section>
    </main>
  `;
}

async function concluirDesbloqueioLocalComSenha(senha) {
  if (!window.__simplificaLocalLockActive) return true;
  const usuario = getUsuarioAtual();
  const email = normalizarEmail(usuario?.email || usuarioAtualEmail || syncConfig.supabaseEmail || "");
  if (!senha) return false;
  if (!estaOnline()) {
    mostrarToast("Conexão necessária para desbloquear após 12 horas.", "erro", 7000);
    return false;
  }
  try {
    await loginUsuarioSupabase(email, senha);
    await consultarLicencaSupabaseSilencioso();
    desativarTravaLocal("password");
    fecharPopup();
    await sincronizarFilaOfflinePendente("unlock").catch((erro) => registrarDiagnostico("sync", "Fila offline após desbloqueio falhou", erro.message));
    mostrarToast("Dispositivo desbloqueado.", "sucesso", 3500);
    renderApp();
    return true;
  } catch (erro) {
    ErrorService.capture(erro, { area: "Autenticação", action: "Desbloqueio local", errorKey: "LOCAL_UNLOCK_FAILED", silent: true });
    mostrarToast("Senha não validada. Tente novamente.", "erro", 6500);
    return false;
  }
}

async function desbloquearTravaLocalFormulario(event) {
  event?.preventDefault?.();
  if (localLockModalOpen) return;
  const input = document.getElementById("localUnlockPassword");
  const botao = document.getElementById("localUnlockBtn");
  const senha = input?.value || "";
  if (!senha) return;
  localLockModalOpen = true;
  if (botao) {
    botao.disabled = true;
    botao.textContent = "Validando...";
  }
  const ok = await concluirDesbloqueioLocalComSenha(senha);
  localLockModalOpen = false;
  if (!ok) {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Desbloquear";
    }
    if (input) {
      input.value = "";
      input.focus();
    }
  }
}

async function abrirModalDesbloqueioLocal() {
  if (localLockModalOpen || !window.__simplificaLocalLockActive) return;
  localLockModalOpen = true;
  const senha = await solicitarEntradaTexto({
    titulo: "Desbloquear dispositivo",
    mensagem: "Por segurança, confirme a senha da sua conta. Isso não encerra sua sessão do Supabase.",
    tipo: "password",
    obrigatorio: true
  });
  localLockModalOpen = false;
  if (!senha) return;
  await concluirDesbloqueioLocalComSenha(senha);
}

async function exigirDesbloqueioLocalSeNecessario(motivo = "restore") {
  if (!precisaDesbloqueioLocal()) return true;
  ativarTravaLocal(motivo);
  console.info("[Auth][local-lock]", { motivo, auth_uid: syncConfig.supabaseUserId || "", last_unlock_at: localStorage.getItem(LOCAL_UNLOCK_KEY) || "" });
  return false;
}

async function restaurarCacheSessaoLocal() {
  if (appConfig.keepSessionCache === false) return false;
  if (usuarioAtualEmail) {
    try {
      const emailSessaoAtual = normalizarEmail(usuarioAtualEmail);
      carregarSessaoSensivelSupabase();
      if (!syncConfig.supabaseUserId || !syncConfig.supabaseRefreshToken) {
        usuarioAtualEmail = "";
        sessionStorage.removeItem("usuarioAtualEmail");
        return false;
      }
      if (!estaOnline()) {
        if (!licencaLocalAindaConfiavel()) {
          ativarTravaLocal("offline-stale-license");
          mostrarToast("Conexão necessária para validar sua sessão.", "erro", 7000);
          return true;
        }
        billingConfig.effectiveLicenseStale = true;
        billingConfig.effectiveLicenseSource = "backend-rpc-cache-stale";
        await exigirDesbloqueioLocalSeNecessario("restore-offline");
        registrarAtividadeSessao();
        return true;
      }
      if (emailSessaoAtual && !sessaoSupabaseValidaParaEmail(emailSessaoAtual)) {
        const renovada = await renovarSessaoSupabase();
        if (!renovada) {
          mostrarToast("Sua sessão expirou. Faça login novamente.", "erro", 7000);
          return false;
        }
      }
      await sincronizarLicencaEfetivaSePossivel("restoreSession-active");
      await sincronizarFilaOfflinePendente("restoreSession-active").catch((erro) => registrarDiagnostico("sync", "Fila offline ao restaurar sessão ativa falhou", erro.message));
      await exigirDesbloqueioLocalSeNecessario("restore-active");
      registrarAtividadeSessao();
    } catch (erro) {
      registrarDiagnostico("Supabase", "Licença da sessão ativa não sincronizada", erro.message);
    }
    return false;
  }
  try {
    const cache = JSON.parse(localStorage.getItem(LOCAL_SESSION_CACHE_KEY) || "{}");
    const email = normalizarEmail(cache.usuarioAtualEmail || cache.supabase?.supabaseEmail || "");
    if (!email || !normalizarUsuarios(usuarios).some((usuario) => usuario.email === email && usuario.ativo)) return false;

    carregarSessaoSensivelSupabase();
    if (!syncConfig.supabaseUserId || !syncConfig.supabaseRefreshToken) {
      localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
      return false;
    }
    if (appConfig.biometricEnabled && isAndroid()) {
      const biometria = await confirmarBiometriaSeDisponivel("Confirme sua identidade para abrir seus dados.");
      if (biometria.disponivel && !biometria.ok) return false;
    }

    if (!estaOnline()) {
      if (!licencaLocalAindaConfiavel()) {
        ativarTravaLocal("offline-stale-license");
        mostrarToast("Conexão necessária para validar sua sessão.", "erro", 7000);
        usuarioAtualEmail = email;
        sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
        return true;
      }
      usuarioAtualEmail = email;
      sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
      registrarAtividadeSessao();
      billingConfig.effectiveLicenseStale = true;
      billingConfig.effectiveLicenseSource = "backend-rpc-cache-stale";
      salvarDados();
      await exigirDesbloqueioLocalSeNecessario("restore-offline");
      return true;
    }

    if (!sessaoSupabaseValidaParaEmail(email)) {
      const renovada = await renovarSessaoSupabase();
      if (!renovada) {
        mostrarToast("Sua sessão expirou. Faça login novamente.", "erro", 7000);
        return false;
      }
    }

    usuarioAtualEmail = email;
    sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
    registrarAtividadeSessao();
    await sincronizarLicencaEfetivaSePossivel("restoreSession");
    await sincronizarFilaOfflinePendente("restoreSession").catch((erro) => registrarDiagnostico("sync", "Fila offline ao restaurar sessão falhou", erro.message));
    await exigirDesbloqueioLocalSeNecessario("restore");
    return true;
  } catch (_) {
    localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
    return false;
  }
}

function registrarHistorico(acao, detalhes = "") {
  historico.unshift({
    id: Date.now(),
    acao,
    detalhes,
    data: new Date().toISOString(),
    dispositivo: syncConfig.deviceName || deviceId
  });

  historico = historico.slice(0, 250);
  localStorage.setItem("historico", JSON.stringify(historico));
}

function registrarSeguranca(acao, resultado = "sucesso", detalhes = "", usuarioEmail = usuarioAtualEmail) {
  const usuario = normalizarEmail(usuarioEmail || getUsuarioAtual()?.email || "");
  const registro = {
    id: Date.now() + Math.random(),
    data: new Date().toISOString(),
    usuario: usuario || "visitante",
    acao: String(acao || "Evento"),
    resultado: String(resultado || "sucesso"),
    detalhes: String(detalhes || "").slice(0, 280),
    dispositivo: syncConfig.deviceName || deviceId,
    userAgent: (navigator.userAgent || "").slice(0, 160)
  };
  securityLogs.unshift(registro);
  securityLogs = securityLogs.slice(0, 300);
  localStorage.setItem("securityLogs", JSON.stringify(securityLogs));
  registrarSecurityLogSupabaseSilencioso(registro);
}

function registrarAuditoria(acao, detalhes = {}, clientId = getClientIdAtual()) {
  const registro = {
    id: "audit-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
    userId: syncConfig.supabaseUserId || getUsuarioAtual()?.id || "",
    clientId: clientId || "",
    acao: String(acao || "evento"),
    detalhes: typeof detalhes === "string" ? { descricao: detalhes } : (detalhes || {}),
    data: new Date().toISOString()
  };
  auditLogs.unshift(registro);
  auditLogs = auditLogs.slice(0, 500);
  localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
  registrarAuditLogSupabaseSilencioso(registro);
}

function registrarDiagnostico(tipo, mensagem, detalhes = "", opcoes = {}) {
  if (appConfig.telemetryEnabled === false) return;

  diagnostics.unshift({
    id: Date.now(),
    tipo: String(tipo || "info"),
    mensagem: String(mensagem || "").slice(0, 220),
    detalhes: String(detalhes || "").slice(0, 900),
    tela: telaAtual,
    versao: APP_VERSION,
    data: new Date().toISOString(),
    dispositivo: syncConfig.deviceName || deviceId
  });

  diagnostics = diagnostics.slice(0, 150);
  localStorage.setItem("diagnostics", JSON.stringify(diagnostics));
  if (opcoes.silent !== true) mostrarToast(String(mensagem || "Erro registrado").slice(0, 120), "erro");
}

function normalizarTextoSugestao(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function registrarSugestaoLocal(texto, origem = "cliente", dados = {}) {
  const titulo = String(dados.title || dados.titulo || texto || "").trim();
  const chave = normalizarTextoSugestao(titulo);
  if (chave.length < 4) return false;

  const existente = sugestoes.find((item) => item.chave === chave);
  if (existente) {
    existente.votos = (Number(existente.votos) || 1) + 1;
    existente.atualizadoEm = new Date().toISOString();
    existente.origem = origem;
    existente.type = dados.type || existente.type || "suggestion";
    existente.category = dados.category || existente.category || "geral";
    existente.description = dados.description || existente.description || "";
    existente.status = dados.status || existente.status || "new";
  } else {
    sugestoes.unshift({
      id: Date.now(),
      titulo,
      chave,
      votos: 1,
      origem,
      type: dados.type || "suggestion",
      category: dados.category || "geral",
      description: dados.description || "",
      status: dados.status || "new",
      userId: dados.userId || syncConfig.supabaseUserId || getUsuarioAtual()?.id || "",
      clientId: dados.clientId || getClientIdAtual() || billingConfig.clientId || "",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    });
  }

  sugestoes.sort((a, b) => (Number(b.votos) || 0) - (Number(a.votos) || 0) || Date.parse(b.atualizadoEm || 0) - Date.parse(a.atualizadoEm || 0));
  sugestoes = sugestoes.slice(0, 100);
  localStorage.setItem("sugestoes", JSON.stringify(sugestoes));
  return true;
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarEmail(email));
}

function normalizarPapel(papel) {
  const alvo = String(papel || "").toLowerCase();
  if (alvo === "owner" || alvo === "dono") return "user";
  if (alvo === "attendant") return "operador";
  if (alvo === "production") return "operador";
  if (alvo === "finance") return "admin";
  if (alvo === "read_only") return "visualizador";
  if (alvo === "user" || alvo === "usuario" || alvo === "usuário") return "user";
  return ["superadmin", "admin", "user", "operador", "visualizador"].includes(alvo) ? alvo : "user";
}

function normalizarUsuario(usuario) {
  const email = normalizarEmail(usuario?.email);
  if (!email) return null;
  const status = String(usuario?.status || "").toLowerCase();
  const onboardingCompleted = usuario?.onboardingCompleted === true || usuario?.onboarding_completed === true;

  return {
    id: usuario?.id || criarIdUsuario(),
    clientId: usuario?.clientId || usuario?.client_id || billingConfig.clientId || "",
    companyId: usuario?.companyId || usuario?.company_id || billingConfig.companyId || "",
    nome: String(usuario?.nome || usuario?.name || usuario?.display_name || email.split("@")[0] || "Usuário").trim(),
    email,
    senha: String(usuario?.senha || ""),
    passwordHash: usuario?.passwordHash || usuario?.senhaHash || "",
    mustChangePassword: usuario?.mustChangePassword === true || usuario?.senhaTemporaria === true || usuario?.must_change_password === true,
    senhaTemporaria: usuario?.senhaTemporaria === true || usuario?.mustChangePassword === true || usuario?.must_change_password === true,
    phone: normalizePhoneBR(usuario?.phone || usuario?.telefone || "") || String(usuario?.phone || usuario?.telefone || "").trim(),
    papel: normalizarPapel(usuario?.papel || usuario?.role),
    ativo: status ? status === "active" : usuario?.ativo !== false,
    bloqueado: usuario?.bloqueado === true || status === "blocked",
    planStatus: usuario?.planStatus || "",
    planExpiresAt: usuario?.planExpiresAt || "",
    trialStartedAt: usuario?.trialStartedAt || "",
    trialDays: Math.max(1, Number(usuario?.trialDays) || Number(billingConfig.trialDays) || 7),
    acceptedTermsAt: usuario?.acceptedTermsAt || usuario?.accepted_terms_at || "",
    onboardingCompleted,
    onboardingStep: onboardingCompleted ? 4 : Math.max(0, Math.min(4, Number(usuario?.onboardingStep ?? usuario?.onboarding_step ?? 0) || 0)),
    supabaseUserId: usuario?.supabaseUserId || usuario?.supabase_user_id || usuario?.user_id || "",
    supabasePending: usuario?.supabasePending === true || usuario?.onlineRegistrationPending === true,
    supabaseLastSyncAt: usuario?.supabaseLastSyncAt || usuario?.updated_at || "",
    criadoEm: usuario?.criadoEm || usuario?.created_at || new Date().toISOString(),
    atualizadoEm: usuario?.atualizadoEm || usuario?.updated_at || usuario?.criadoEm || new Date().toISOString(),
    lastLoginAt: usuario?.lastLoginAt || "",
    passwordUpdatedAt: usuario?.passwordUpdatedAt || "",
    failedLoginCount: Math.max(0, Number(usuario?.failedLoginCount) || 0)
  };
}

function normalizarUsuarios(lista = []) {
  const mapa = new Map();
  (Array.isArray(lista) ? lista : []).forEach((item) => {
    const usuario = normalizarUsuario(item);
    if (!usuario) return;
    const atual = mapa.get(usuario.email);
    mapa.set(usuario.email, atual ? { ...atual, ...usuario } : usuario);
  });
  return Array.from(mapa.values());
}

function normalizarUsuarioPerfilSupabase(perfil) {
  const email = normalizarEmail(perfil?.email);
  if (!email) return null;
  const userId = perfil?.user_id || perfil?.supabaseUserId || perfil?.id || "";
  const status = String(perfil?.status || "active").toLowerCase();

  return normalizarUsuario({
    id: perfil?.id || userId || criarIdUsuario(),
    clientId: perfil?.client_id || perfil?.clientId || "",
    companyId: perfil?.company_id || perfil?.companyId || "",
    nome: perfil?.name || perfil?.display_name || perfil?.nome || email.split("@")[0],
    email,
    phone: perfil?.phone || perfil?.telefone || "",
    papel: perfil?.role || perfil?.papel || "user",
    ativo: status === "active",
    bloqueado: status === "blocked",
    mustChangePassword: perfil?.must_change_password === true || perfil?.mustChangePassword === true,
    onboardingCompleted: perfil?.onboarding_completed === true || perfil?.onboardingCompleted === true,
    onboardingStep: perfil?.onboarding_step ?? perfil?.onboardingStep ?? 0,
    acceptedTermsAt: perfil?.accepted_terms_at || perfil?.acceptedTermsAt || "",
    supabaseUserId: userId,
    supabasePending: false,
    supabaseLastSyncAt: perfil?.updated_at || new Date().toISOString(),
    criadoEm: perfil?.created_at || perfil?.criadoEm || new Date().toISOString(),
    atualizadoEm: perfil?.updated_at || perfil?.atualizadoEm || new Date().toISOString()
  });
}

function mesclarUsuariosSupabase(usuariosAtuais = [], perfis = []) {
  const mapa = new Map();
  normalizarUsuarios(usuariosAtuais).forEach((usuario) => mapa.set(usuario.email, usuario));

  (Array.isArray(perfis) ? perfis : []).forEach((perfil) => {
    const remoto = normalizarUsuarioPerfilSupabase(perfil);
    if (!remoto) return;
    const local = mapa.get(remoto.email);
    const papel = local?.papel === "superadmin" || remoto.papel === "superadmin" ? "superadmin" : remoto.papel;
    const onboardingCompleted = local?.onboardingCompleted === true || remoto.onboardingCompleted === true;
    const usuario = normalizarUsuario({
      ...local,
      ...remoto,
      papel,
      onboardingCompleted,
      onboardingStep: onboardingCompleted ? 4 : Math.max(Number(local?.onboardingStep) || 0, Number(remoto.onboardingStep) || 0),
      senha: local?.senha || "",
      passwordHash: local?.passwordHash || "",
      passwordUpdatedAt: local?.passwordUpdatedAt || "",
      failedLoginCount: local?.failedLoginCount || 0,
      lastLoginAt: local?.lastLoginAt || remoto.lastLoginAt || "",
      planStatus: local?.planStatus || remoto.planStatus || "",
      planExpiresAt: local?.planExpiresAt || remoto.planExpiresAt || "",
      trialStartedAt: local?.trialStartedAt || remoto.trialStartedAt || "",
      trialDays: local?.trialDays || remoto.trialDays,
      ativo: local ? local.ativo !== false && remoto.ativo !== false : remoto.ativo !== false,
      bloqueado: local?.bloqueado === true || remoto.bloqueado === true
    });
    if (usuario) mapa.set(usuario.email, usuario);
  });

  return Array.from(mapa.values());
}

function criarIdLocal(prefixo = "id") {
  return prefixo + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function normalizarSlugPlano(slug = "free") {
  const valor = String(slug || "free").toLowerCase().trim().replace(/-/g, "_");
  if (["basic", "basico", "básico", "gratis", "grátis", "free"].includes(valor)) return "free";
  if (["trial", "premium_trial"].includes(valor)) return "premium_trial";
  if (["pro", "premium", "premium_normal", "premium_monthly"].includes(valor)) return "premium";
  return "free";
}

function normalizarStatusPlano(status = "pending") {
  const valor = String(status || "pending").toLowerCase().trim();
  const mapa = {
    ativo: "active",
    ativa: "active",
    pago: "active",
    paid: "active",
    trial: "trialing",
    pendente: "pending",
    atrasado: "past_due",
    overdue: "past_due",
    blocked: "past_due",
    bloqueado: "past_due",
    cancelado: "cancelled",
    canceled: "cancelled",
    vencido: "expired",
    expirado: "expired"
  };
  const normalizado = mapa[valor] || valor;
  return ["active", "trialing", "pending", "past_due", "cancelled", "expired"].includes(normalizado) ? normalizado : "pending";
}

function normalizarStatusPagamento(status = "none") {
  const valor = String(status || "none").toLowerCase().trim();
  const mapa = {
    pago: "approved",
    aprovado: "approved",
    approved: "approved",
    pendente: "pending",
    pending: "pending",
    recusado: "rejected",
    rejected: "rejected",
    cancelado: "cancelled",
    cancelled: "cancelled",
    canceled: "cancelled"
  };
  const normalizado = mapa[valor] || valor;
  return ["none", "pending", "approved", "rejected", "cancelled", "refunded", "charged_back"].includes(normalizado) ? normalizado : "none";
}

function normalizarStatusAssinaturaDefinitivo(status = "free") {
  const valor = String(status || "free").toLowerCase().trim();
  const mapa = {
    ativo: "active",
    ativa: "active",
    pago: "active",
    paid: "active",
    trial: "trialing",
    pendente: "free",
    pending: "free",
    gratis: "free",
    grátis: "free",
    free: "free",
    atrasado: "past_due",
    vencido: "expired",
    expirado: "expired",
    cancelado: "cancelled",
    canceled: "cancelled"
  };
  const normalizado = mapa[valor] || valor;
  return ["free", "trialing", "active", "past_due", "cancelled", "expired"].includes(normalizado) ? normalizado : "free";
}

function normalizarBillingVariant(valor = "") {
  const variant = String(valor || "").toLowerCase().trim().replace(/-/g, "_");
  return variant === "premium_monthly" ? "premium_monthly" : "premium_first_month";
}

function getBillingVariantAssinatura(assinatura = getAssinaturaSaas()) {
  return assinatura?.promoUsed ? "premium_monthly" : "premium_first_month";
}

function getPrecoBillingVariant(variant = "premium_first_month") {
  return BILLING_VARIANTS[normalizarBillingVariant(variant)]?.amount || PREMIUM_FIRST_MONTH_PRICE;
}

function getPrecoPagoVigenteLocal() {
  return PREMIUM_MONTHLY_PRICE;
}

function proximoClienteIdS3D() {
  const atual = Math.max(1, Number(localStorage.getItem("s3dClientSequence") || "1") || 1);
  localStorage.setItem("s3dClientSequence", String(atual + 1));
  return `${CLIENT_CODE_PREFIX}-${String(atual).padStart(6, "0")}`;
}

function normalizarPlanoSaas(plano = {}) {
  const slug = normalizarSlugPlano(plano.slug || plano.id || "free");
  const padrao = DEFAULT_SAAS_PLANS.find((item) => item.slug === slug || item.id === slug) || DEFAULT_SAAS_PLANS[0];
  const planoPadrao = DEFAULT_SAAS_PLANS.some((item) => item.slug === slug || item.id === slug);
  return {
    id: String(plano.id || slug),
    slug,
    name: String(planoPadrao ? padrao.name : (plano.name || plano.nome || padrao.name || "Plano")),
    price: Math.max(0, Number(planoPadrao ? padrao.price : (plano.price ?? plano.preco ?? padrao.price ?? 0))),
    maxUsers: Math.max(1, Number(planoPadrao ? padrao.maxUsers : (plano.maxUsers ?? plano.max_users ?? padrao.maxUsers ?? 1))),
    maxOrders: planoPadrao ? padrao.maxOrders : (plano.maxOrders === null || plano.max_orders === null ? null : Math.max(1, Number(plano.maxOrders ?? plano.max_orders ?? padrao.maxOrders ?? 50))),
    maxClients: planoPadrao ? padrao.maxClients : (plano.maxClients === null || plano.max_clients === null ? null : Math.max(1, Number(plano.maxClients ?? plano.max_clients ?? padrao.maxClients ?? 10))),
    maxCalculatorUses: planoPadrao ? padrao.maxCalculatorUses : (plano.maxCalculatorUses === null || plano.max_calculator_uses === null ? null : Math.max(1, Number(plano.maxCalculatorUses ?? plano.max_calculator_uses ?? padrao.maxCalculatorUses ?? 30))),
    maxStorageMb: planoPadrao ? padrao.maxStorageMb : (plano.maxStorageMb === null || plano.max_storage_mb === null ? null : Math.max(1, Number(plano.maxStorageMb ?? plano.max_storage_mb ?? padrao.maxStorageMb ?? 25))),
    allowPdf: Boolean(planoPadrao ? padrao.allowPdf : (plano.allowPdf ?? plano.allow_pdf ?? padrao.allowPdf)),
    allowReports: Boolean(planoPadrao ? padrao.allowReports : (plano.allowReports ?? plano.allow_reports ?? padrao.allowReports)),
    allowPermissions: Boolean(planoPadrao ? padrao.allowPermissions : (plano.allowPermissions ?? plano.allow_permissions ?? padrao.allowPermissions)),
    kind: String(planoPadrao ? padrao.kind : (plano.kind || padrao.kind || "paid")),
    durationDays: Number(planoPadrao ? padrao.durationDays : (plano.durationDays ?? plano.duration_days ?? padrao.durationDays ?? 0)) || 0,
    active: plano.active !== false && plano.ativo !== false,
    recommended: planoPadrao ? !!padrao.recommended : (plano.recommended === true || plano.recomendado === true || slug === "premium"),
    sortOrder: Number(planoPadrao ? padrao.sortOrder : (plano.sortOrder ?? plano.sort_order ?? padrao.sortOrder ?? 100)) || 100
  };
}

function normalizarClienteSaas(cliente = {}) {
  const email = normalizarEmail(cliente.email);
  const statusCliente = String(cliente.status || "").trim();
  return {
    id: cliente.id || criarIdLocal("client"),
    clientCode: cliente.clientCode || cliente.client_code || cliente.clienteId || proximoClienteIdS3D(),
    companyId: cliente.companyId || cliente.company_id || "",
    name: String(cliente.name || cliente.nome || cliente.businessName || appConfig.businessName || "Empresa 3D").trim(),
    responsibleName: String(cliente.responsibleName || cliente.responsible_name || cliente.responsavel || cliente.name || "").trim(),
    email,
    phone: normalizePhoneBR(cliente.phone || cliente.telefone || "") || String(cliente.phone || cliente.telefone || "").trim(),
    cnpj: String(cliente.cnpj || "").replace(/\D/g, ""),
    status: ["active", "overdue", "blocked", "inactive", "cancelled", "anonymized"].includes(statusCliente) ? statusCliente : "active",
    planoAtual: normalizarSlugPlano(cliente.planoAtual || cliente.plano_atual || "free"),
    statusAssinatura: String(cliente.statusAssinatura || cliente.status_assinatura || cliente.status || "active"),
    activePlan: normalizarSlugPlano(cliente.activePlan || cliente.active_plan || cliente.planoAtual || cliente.plano_atual || "free"),
    pendingPlan: cliente.pendingPlan || cliente.pending_plan ? normalizarSlugPlano(cliente.pendingPlan || cliente.pending_plan) : "",
    pendingStartedAt: cliente.pendingStartedAt || cliente.pending_started_at || "",
    paymentStatus: normalizarStatusPagamento(cliente.paymentStatus || cliente.payment_status || "none"),
    subscriptionStatus: normalizarStatusAssinaturaDefinitivo(cliente.subscriptionStatus || cliente.subscription_status || "free"),
    planExpiresAt: cliente.planExpiresAt || cliente.plan_expires_at || "",
    planPrice: Math.max(0, Number(cliente.planPrice ?? cliente.plan_price ?? 0) || 0),
    priceLocked: cliente.priceLocked === true || cliente.price_locked === true,
    trialStartedAt: cliente.trialStartedAt || cliente.trial_started_at || cliente.trialStartAt || cliente.trial_start_at || "",
    trialExpiresAt: cliente.trialExpiresAt || cliente.trial_expires_at || cliente.trialEndAt || cliente.trial_end_at || "",
    trialConsumedAt: cliente.trialConsumedAt || cliente.trial_consumed_at || cliente.trialUsedAt || cliente.trial_used_at || "",
    isTrialActive: cliente.isTrialActive === true || cliente.is_trial_active === true,
    lastAdShownAt: cliente.lastAdShownAt || cliente.last_ad_shown_at || "",
    isTestUser: cliente.isTestUser === true || cliente.is_test_user === true || cliente.testUser === true || cliente.test_user === true,
    createdAt: cliente.createdAt || cliente.created_at || new Date().toISOString(),
    criadoEm: cliente.criadoEm || cliente.criado_em || cliente.createdAt || cliente.created_at || new Date().toISOString(),
    lastAccessAt: cliente.lastAccessAt || cliente.last_access_at || "",
    updatedAt: cliente.updatedAt || cliente.updated_at || new Date().toISOString(),
    inactiveMarkedAt: cliente.inactiveMarkedAt || "",
    blockedAt: cliente.blockedAt || cliente.blocked_at || "",
    blockedReason: cliente.blockedReason || cliente.blocked_reason || "",
    archivedAt: cliente.archivedAt || cliente.archived_at || "",
    anonymizedAt: cliente.anonymizedAt || cliente.anonymized_at || "",
    deletionPolicy: cliente.deletionPolicy || cliente.deletion_policy || "mark_only"
  };
}

function normalizarAssinaturaSaas(assinatura = {}) {
  const planoRelacional = assinatura.plans?.slug || assinatura.plan?.slug || "";
  const planSlug = normalizarSlugPlano(assinatura.planSlug || assinatura.plan_slug || planoRelacional || assinatura.planId || assinatura.plan_id || "free");
  const status = normalizarStatusPlano(assinatura.status || assinatura.statusAssinatura || assinatura.status_assinatura || "pending");
  const activePlanInformado = assinatura.activePlan || assinatura.active_plan || "";
  const activePlan = normalizarSlugPlano(activePlanInformado || (status === "pending" ? "free" : planSlug));
  const pendingPlan = assinatura.pendingPlan || assinatura.pending_plan ? normalizarSlugPlano(assinatura.pendingPlan || assinatura.pending_plan) : "";
  const paymentStatus = normalizarStatusPagamento(assinatura.paymentStatus || assinatura.payment_status || (status === "pending" ? "pending" : "none"));
  const subscriptionStatus = normalizarStatusAssinaturaDefinitivo(assinatura.subscriptionStatus || assinatura.subscription_status || (activePlan === "premium_trial" ? "trialing" : activePlan === "premium" ? "active" : "free"));
  const currentPeriodStart = assinatura.currentPeriodStart || assinatura.current_period_start || assinatura.startedAt || assinatura.started_at || assinatura.trialStartedAt || assinatura.trial_started_at || assinatura.trialStartAt || assinatura.trial_start_at || assinatura.createdAt || assinatura.created_at || new Date().toISOString();
  const currentPeriodEnd = assinatura.planExpiresAt || assinatura.plan_expires_at || assinatura.currentPeriodEnd || assinatura.current_period_end || assinatura.expiresAt || assinatura.expires_at || assinatura.nextBillingAt || assinatura.next_billing_at || assinatura.proximoVencimento || assinatura.proximo_vencimento || assinatura.trialEndAt || assinatura.trial_end_at || "";
  const trialStartedAt = assinatura.trialStartedAt || assinatura.trial_started_at || assinatura.trialStartAt || assinatura.trial_start_at || (activePlan === "premium_trial" ? currentPeriodStart : "");
  const trialExpiresAt = assinatura.trialExpiresAt || assinatura.trial_expires_at || assinatura.trialEndAt || assinatura.trial_end_at || (activePlan === "premium_trial" ? currentPeriodEnd : "");
  const isTrialActive = (assinatura.isTrialActive === true || assinatura.is_trial_active === true || activePlan === "premium_trial") && !!trialExpiresAt && getRemainingDays(trialExpiresAt) > 0;
  const planPrice = Math.max(0, Number(assinatura.planPrice ?? assinatura.plan_price ?? assinatura.price_locked_amount ?? 0) || 0);
  return {
    id: assinatura.id || criarIdLocal("sub"),
    clientId: assinatura.clientId || assinatura.client_id || "",
    companyId: assinatura.companyId || assinatura.company_id || "",
    userId: assinatura.userId || assinatura.user_id || "",
    planId: planSlug,
    planSlug,
    activePlan,
    pendingPlan,
    paymentStatus,
    subscriptionStatus,
    status,
    statusAssinatura: normalizarStatusPlano(assinatura.statusAssinatura || assinatura.status_assinatura || status),
    promoUsed: assinatura.promoUsed === true || assinatura.promo_used === true,
    billingVariant: normalizarBillingVariant(assinatura.billingVariant || assinatura.billing_variant || (assinatura.promoUsed || assinatura.promo_used ? "premium_monthly" : "premium_first_month")),
    planPrice,
    priceLocked: assinatura.priceLocked === true || assinatura.price_locked === true,
    currentPeriodStart,
    currentPeriodEnd,
    planExpiresAt: currentPeriodEnd,
    trialStartedAt,
    trialExpiresAt,
    trialConsumedAt: assinatura.trialConsumedAt || assinatura.trial_consumed_at || assinatura.trialUsedAt || assinatura.trial_used_at || "",
    isTrialActive,
    pendingStartedAt: assinatura.pendingStartedAt || assinatura.pending_started_at || "",
    planCode: String(assinatura.planCode || assinatura.plan_code || "").toUpperCase(),
    effectiveStatus: assinatura.effectiveStatus || assinatura.effective_status || "",
    manualOverride: assinatura.manualOverride === true || assinatura.manual_override === true,
    manualOverrideReason: assinatura.manualOverrideReason || assinatura.manual_override_reason || "",
    blockedAt: assinatura.blockedAt || assinatura.blocked_at || "",
    blockedReason: assinatura.blockedReason || assinatura.blocked_reason || "",
    archivedAt: assinatura.archivedAt || assinatura.archived_at || "",
    anonymizedAt: assinatura.anonymizedAt || assinatura.anonymized_at || "",
    mercadoPagoSubscriptionId: assinatura.mercadoPagoSubscriptionId || assinatura.mercado_pago_subscription_id || assinatura.subscriptionIdMercadoPago || "",
    startedAt: assinatura.startedAt || assinatura.started_at || currentPeriodStart,
    expiresAt: assinatura.expiresAt || assinatura.expires_at || currentPeriodEnd,
    nextBillingAt: assinatura.nextBillingAt || assinatura.next_billing_at || assinatura.proximoVencimento || assinatura.proximo_vencimento || currentPeriodEnd,
    lastPaymentAt: assinatura.lastPaymentAt || assinatura.ultimoPagamento || assinatura.ultimo_pagamento || "",
    overdueSince: assinatura.overdueSince || assinatura.overdue_since || ""
  };
}

function normalizarPagamentoSaas(pagamento = {}) {
  const planSlug = normalizarSlugPlano(pagamento.planSlug || pagamento.plan_slug || pagamento.planId || pagamento.plan_id || pagamento.plano || "free");
  const billingVariant = normalizarBillingVariant(pagamento.billingVariant || pagamento.billing_variant || pagamento.metadata?.billing_variant || "");
  return {
    id: pagamento.id || criarIdLocal("pay"),
    clientId: pagamento.clientId || pagamento.client_id || "",
    userId: pagamento.userId || pagamento.user_id || "",
    subscriptionId: pagamento.subscriptionId || pagamento.subscription_id || "",
    mercadoPagoPaymentId: pagamento.mercadoPagoPaymentId || pagamento.mercado_pago_payment_id || pagamento.paymentId || pagamento.payment_id || "",
    mercadoPagoSubscriptionId: pagamento.mercadoPagoSubscriptionId || pagamento.mercado_pago_subscription_id || "",
    preferenceId: pagamento.preferenceId || pagamento.preference_id || "",
    externalReference: pagamento.externalReference || pagamento.external_reference || "",
    planId: planSlug,
    planSlug,
    billingVariant,
    amount: Math.max(0, Number(pagamento.amount ?? pagamento.valor ?? 0)),
    planPrice: Math.max(0, Number(pagamento.planPrice ?? pagamento.plan_price ?? pagamento.amount ?? pagamento.valor ?? 0) || 0),
    status: pagamento.status || "pending",
    paymentMethod: pagamento.paymentMethod || pagamento.payment_method || pagamento.metodoPagamento || pagamento.metodo_pagamento || "",
    createdAt: pagamento.createdAt || pagamento.created_at || pagamento.criadoEm || pagamento.criado_em || new Date().toISOString(),
    updatedAt: pagamento.updatedAt || pagamento.updated_at || pagamento.atualizadoEm || pagamento.atualizado_em || ""
  };
}

function normalizarSessaoSaas(sessao = {}) {
  const lastSeenAt = sessao.lastSeenAt || sessao.last_seen_at || new Date().toISOString();
  return {
    id: sessao.id || criarIdLocal("session"),
    clientId: sessao.clientId || sessao.client_id || "",
    userId: sessao.userId || sessao.user_id || "",
    deviceId: sessao.deviceId || sessao.device_id || deviceId,
    ip: sessao.ip || "",
    userAgent: sessao.userAgent || sessao.user_agent || navigator.userAgent || "",
    startedAt: sessao.startedAt || sessao.started_at || new Date().toISOString(),
    lastSeenAt,
    atualizadoEm: sessao.atualizadoEm || sessao.updatedAt || sessao.updated_at || lastSeenAt,
    updatedAt: sessao.updatedAt || sessao.updated_at || sessao.atualizadoEm || lastSeenAt,
    active: sessao.active !== false && !sessao.endedAt && !sessao.ended_at
  };
}

function garantirPlanosSaas() {
  const mapa = new Map();
  DEFAULT_SAAS_PLANS.forEach((plano) => mapa.set(plano.slug, normalizarPlanoSaas(plano)));
  (Array.isArray(saasPlans) ? saasPlans : []).forEach((plano) => {
    const slugOriginal = String(plano.slug || plano.id || "").toLowerCase().trim().replace(/-/g, "_");
    if (!["free", "premium_trial", "premium"].includes(slugOriginal)) return;
    const normalizado = normalizarPlanoSaas(plano);
    mapa.set(normalizado.slug, { ...mapa.get(normalizado.slug), ...normalizado });
  });
  saasPlans = Array.from(mapa.values()).sort((a, b) => (a.sortOrder || 100) - (b.sortOrder || 100) || a.price - b.price);
  return saasPlans;
}

function getPlanoSaas(slug = billingConfig.planSlug || "free") {
  garantirPlanosSaas();
  return saasPlans.find((plano) => plano.slug === slug || plano.id === slug) || saasPlans[0] || normalizarPlanoSaas(DEFAULT_SAAS_PLANS[0]);
}

function getClientIdAtual(usuario = getUsuarioAtual()) {
  return usuario?.clientId || billingConfig.clientId || "";
}

function getClienteSaasAtual() {
  const clientId = getClientIdAtual();
  return saasClients.find((cliente) => String(cliente.id) === String(clientId)) || null;
}

function getAssinaturaSaas(clientId = getClientIdAtual()) {
  return saasSubscriptions.find((assinatura) => String(assinatura.clientId) === String(clientId)) || null;
}

function calcularStatusAssinatura(assinatura = getAssinaturaSaas()) {
  if (!assinatura) return { status: "active", blockLevel: "none", diasAtraso: 0 };
  assinatura = normalizarAssinaturaSaas(assinatura);
  if (assinatura.paymentStatus === "pending") {
    return { status: assinatura.activePlan === "premium_trial" ? "trialing" : assinatura.activePlan === "premium" ? "active" : "free", blockLevel: "none", diasAtraso: 0, pending: true };
  }
  if (assinatura.activePlan === "free") return { status: "free", blockLevel: "none", diasAtraso: 0 };
  const status = normalizarStatusPlano(assinatura.status || assinatura.statusAssinatura);
  if (["cancelled", "expired"].includes(status)) return { status, blockLevel: "total", diasAtraso: 0 };
  if (status === "past_due") return { status, blockLevel: "total", diasAtraso: 1 };
  const vencimento = Date.parse(assinatura.planExpiresAt || assinatura.trialExpiresAt || assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0) || 0;
  if ((status === "active" || status === "trialing") && vencimento && vencimento >= Date.now()) {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  if (assinatura.activePlan === "premium" && status === "active" && !vencimento) {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  if (assinatura.activePlan === "free" && status === "active") {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  const diasAtraso = vencimento ? Math.max(0, Math.floor((Date.now() - vencimento) / (24 * 60 * 60 * 1000))) : 0;
  return { status: status === "trialing" ? "expired" : "past_due", blockLevel: "total", diasAtraso };
}

function getUsuariosDoCliente(clientId = getClientIdAtual()) {
  usuarios = normalizarUsuarios(usuarios);
  return usuarios.filter((usuario) => {
    if (!clientId) return !usuario.clientId;
    return usuario.clientId === clientId || (!usuario.clientId && normalizarEmail(usuario.email) === normalizarEmail(billingConfig.licenseEmail));
  });
}

function getPlanoSaasAtual() {
  const estado = resolverEstadoPlano(getUsuarioAtual(), { source: "getPlanoSaasAtual" });
  return getPlanoSaas(estado.hasPremium ? estado.activePlan : "free");
}

function limiteUsuariosAtingido() {
  if (isSuperAdmin()) return false;
  const plano = getPlanoSaasAtual();
  return getUsuariosDoCliente().filter((usuario) => usuario.ativo !== false).length >= plano.maxUsers;
}

function limitePedidosAtingido() {
  if (isSuperAdmin()) return false;
  const plano = getPlanoSaasAtual();
  if (!plano.maxOrders) return false;
  return getPedidosAtivosPlanoFree() >= plano.maxOrders;
}

function garantirEstruturaSaasLocal() {
  garantirPlanosSaas();
  const nomeAtualApp = String(appConfig.appName || "").trim();
  if (!nomeAtualApp || ["ERP 3D", "NE3D ERP", "NE 3D ERP"].includes(nomeAtualApp) || /^3d\s*flow$/i.test(nomeAtualApp)) {
    appConfig.appName = SYSTEM_NAME;
  }
  saasClients = (Array.isArray(saasClients) ? saasClients : []).map(normalizarClienteSaas);
  saasSubscriptions = (Array.isArray(saasSubscriptions) ? saasSubscriptions : []).map(normalizarAssinaturaSaas);
  saasPayments = (Array.isArray(saasPayments) ? saasPayments : []).map(normalizarPagamentoSaas);
  saasSessions = (Array.isArray(saasSessions) ? saasSessions : []).map(normalizarSessaoSaas);
  usageCounters = usageCounters && typeof usageCounters === "object" ? usageCounters : {};
  auditLogs = Array.isArray(auditLogs) ? auditLogs : [];

  billingConfig.planSlug = normalizarSlugPlano(billingConfig.planSlug || "free");
  billingConfig.activePlan = normalizarSlugPlano(billingConfig.activePlan || billingConfig.planSlug || "free");
  billingConfig.pendingPlan = billingConfig.pendingPlan ? normalizarSlugPlano(billingConfig.pendingPlan) : "";
  billingConfig.paymentStatus = normalizarStatusPagamento(billingConfig.paymentStatus || "none");
  billingConfig.subscriptionStatus = normalizarStatusAssinaturaDefinitivo(billingConfig.subscriptionStatus || (billingConfig.activePlan === "premium_trial" ? "trialing" : billingConfig.activePlan === "premium" ? "active" : "free"));
  billingConfig.cloudSyncPaidOnly = false;

  const planoAtual = getPlanoSaas(billingConfig.activePlan || billingConfig.planSlug || "free");
  billingConfig.planSlug = planoAtual.slug;
  billingConfig.activePlan = planoAtual.slug;
  billingConfig.monthlyPrice = Number(billingConfig.monthlyPrice) || (planoAtual.slug === "premium" ? getPrecoPagoVigenteLocal() : planoAtual.price);
  billingConfig.planPrice = Math.max(0, Number(billingConfig.planPrice) || 0);
  billingConfig.priceLocked = billingConfig.priceLocked === true;
  billingConfig.trialDays = Math.max(1, Number(billingConfig.trialDays) || DEFAULT_TRIAL_DAYS);
  if (billingConfig.trialStartedAt && !billingConfig.trialExpiresAt) {
    billingConfig.trialExpiresAt = calcularFimTrial(billingConfig.trialStartedAt, billingConfig.trialDays);
  }
  billingConfig.isTrialActive = billingConfig.activePlan === "premium_trial" && !!billingConfig.trialExpiresAt && getRemainingDays(billingConfig.trialExpiresAt) > 0;

  if (billingConfig.clientId && !saasClients.some((cliente) => cliente.id === billingConfig.clientId)) {
    saasClients.push(normalizarClienteSaas({
      id: billingConfig.clientId,
      name: appConfig.businessName || "Minha empresa 3D",
      responsibleName: billingConfig.ownerName || "",
      email: billingConfig.licenseEmail || billingConfig.ownerEmail || "",
      phone: appConfig.whatsappNumber || "",
      status: "active",
      lastAccessAt: new Date().toISOString()
    }));
  }

  verificarVencimentoPlanoLocal(false);
}

function clienteTemPagamentoRecente(clientId, dias = INACTIVE_CLIENT_DAYS) {
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  return saasPayments.some((pagamento) => (
    pagamento.clientId === clientId
    && pagamento.status === "approved"
    && (Date.parse(pagamento.createdAt || 0) || 0) >= limite
  ));
}

function marcarClientesInativosLocal() {
  const limite = Date.now() - INACTIVE_CLIENT_DAYS * 24 * 60 * 60 * 1000;
  saasClients.forEach((cliente) => {
    const ultimo = Date.parse(cliente.lastAccessAt || cliente.createdAt || 0) || 0;
    if (cliente.status !== "active" || !ultimo || ultimo >= limite || clienteTemPagamentoRecente(cliente.id)) return;
    cliente.status = "inactive";
    cliente.inactiveMarkedAt = new Date().toISOString();
    registrarAuditoria("marcado inativo", { dias: INACTIVE_CLIENT_DAYS }, cliente.id);
  });
}

function verificarVencimentoPlanoLocal(salvar = true) {
  if (licencaEfetivaRemotaFresca()) {
    return;
  }

  const hoje = hojeIsoData();
  let alterou = false;

  if (billingConfig.paymentStatus === "pending") {
    const inicioPendenteGlobal = getTimestampPlano(billingConfig.pendingStartedAt || billingConfig.updatedAt || 0);
    if (inicioPendenteGlobal && Date.now() - inicioPendenteGlobal > 24 * 60 * 60 * 1000) {
      billingConfig.pendingPlan = "";
      billingConfig.paymentStatus = "none";
      billingConfig.pendingStartedAt = "";
      alterou = true;
    }
  }

  saasSubscriptions.forEach((assinatura) => {
    const plano = getPlanoSaas(assinatura.activePlan || assinatura.planSlug);
    const vencimento = getTimestampPlano(assinatura.planExpiresAt || assinatura.trialExpiresAt || assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0);
    if (assinatura.paymentStatus === "pending") {
      const inicioPendente = getTimestampPlano(assinatura.pendingStartedAt || assinatura.updatedAt || assinatura.createdAt || 0);
      if (inicioPendente && Date.now() - inicioPendente > 24 * 60 * 60 * 1000) {
        assinatura.pendingPlan = "";
        assinatura.paymentStatus = "none";
        assinatura.pendingStartedAt = "";
        if (billingConfig.clientId === assinatura.clientId) {
          billingConfig.pendingPlan = "";
          billingConfig.paymentStatus = "none";
          billingConfig.pendingStartedAt = "";
        }
        alterou = true;
      }
    }
    if (!vencimento || vencimento >= Date.now()) return;
    if ((assinatura.activePlan || assinatura.planSlug) === "free" || ["cancelled", "expired"].includes(assinatura.status)) return;

    const diasAtraso = Math.max(0, Math.floor((Date.now() - vencimento) / (24 * 60 * 60 * 1000)));
    if (plano.kind === "trial") {
      assinatura.planSlug = "free";
      assinatura.planId = "free";
      assinatura.activePlan = "free";
      assinatura.subscriptionStatus = "free";
      assinatura.status = "active";
      assinatura.statusAssinatura = "active";
      assinatura.currentPeriodEnd = "";
      assinatura.expiresAt = "";
      assinatura.nextBillingAt = "";
      assinatura.planExpiresAt = "";
      assinatura.isTrialActive = false;
      assinatura.overdueSince = assinatura.overdueSince || new Date(vencimento).toISOString();
      const cliente = getClienteSaasPorId(assinatura.clientId);
      if (cliente) {
        cliente.planoAtual = "free";
        cliente.activePlan = "free";
        cliente.subscriptionStatus = "free";
        cliente.isTrialActive = false;
        cliente.statusAssinatura = "active";
        cliente.updatedAt = new Date().toISOString();
      }
      if (billingConfig.clientId === assinatura.clientId) {
        billingConfig.planSlug = "free";
        billingConfig.activePlan = "free";
        billingConfig.subscriptionStatus = "free";
        billingConfig.isTrialActive = false;
        billingConfig.licenseStatus = "free";
        billingConfig.licenseBlockLevel = "none";
      }
      registrarAuditoria("alteração plano", { motivo: "vencimento", planoAnterior: plano.slug }, assinatura.clientId);
      alterou = true;
    } else if (diasAtraso >= 0) {
      assinatura.planSlug = "free";
      assinatura.planId = "free";
      assinatura.activePlan = "free";
      assinatura.subscriptionStatus = "free";
      assinatura.status = "active";
      assinatura.statusAssinatura = "active";
      assinatura.currentPeriodEnd = "";
      assinatura.expiresAt = "";
      assinatura.nextBillingAt = "";
      assinatura.planExpiresAt = "";
      assinatura.overdueSince = assinatura.overdueSince || new Date(vencimento).toISOString();
      const cliente = getClienteSaasPorId(assinatura.clientId);
      if (cliente) {
        cliente.planoAtual = "free";
        cliente.activePlan = "free";
        cliente.subscriptionStatus = "free";
        cliente.statusAssinatura = "active";
        cliente.updatedAt = new Date().toISOString();
      }
      alterou = true;
    }
  });

  billingConfig.lastDailyPlanCheck = hoje;
  if (salvar && alterou) salvarDados();
}

function getPedidosMesAtual() {
  const prefixo = hojeIsoData().slice(0, 7);
  return pedidos.filter((pedido) => String(pedido.criadoEm || dataPedidoIso(pedido) || "").slice(0, 7) === prefixo).length;
}

function getPedidosAtivosPlanoFree() {
  return pedidos.filter((pedido) => !["entregue", "cancelado", "finalizado"].includes(String(pedido.status || "aberto"))).length;
}

function getClientesPedidoUnicos() {
  const nomes = new Set();
  pedidos.forEach((pedido) => {
    const nome = clienteDoPedido(pedido).trim().toLowerCase();
    if (nome) nomes.add(nome);
  });
  return nomes.size;
}

function getChaveUsoMensal(tipo) {
  return `${tipo}:${hojeIsoData().slice(0, 7)}:${getClientIdAtual() || getEmailLicencaAtual() || "local"}`;
}

function getUsoMensal(tipo) {
  return Math.max(0, Number(usageCounters[getChaveUsoMensal(tipo)] || 0) || 0);
}

function incrementarUsoMensal(tipo) {
  const chave = getChaveUsoMensal(tipo);
  usageCounters[chave] = getUsoMensal(tipo) + 1;
  salvarDados();
  return usageCounters[chave];
}

function planoPermiteRecurso(recurso) {
  if (isSuperAdmin()) return true;
  const plano = getPlanoSaasAtual();
  if (recurso === "pdf") return canUsePremiumFeatures() && !!plano.allowPdf;
  if (recurso === "reports") return !!plano.allowReports || window.AdMobService?.hasTemporaryUnlock?.("reports") || window.MonetizationLimits?.hasUnlock?.("reports", getUsuarioMonetizacao());
  if (!canUsePremiumFeatures()) return false;
  if (recurso === "permissions") return !!plano.allowPermissions;
  return canUsePremiumFeatures();
}

function getSessionLimitPlano() {
  const slug = getPlanoSaasAtual().slug;
  if (["premium", "premium_trial"].includes(slug)) return 5;
  return 1;
}

function criarClienteSaasLocal({ nome, email, senha, negocio, telefone, planSlug = "premium_trial", trial = true }) {
  const emailNormalizado = normalizarEmail(email);
  if (saasClients.some((cliente) => normalizarEmail(cliente.email) === emailNormalizado)) {
    throw new Error("Este e-mail já está cadastrado.");
  }

  const agora = new Date().toISOString();
  const plano = getPlanoSaas(planSlug);
  const clientId = criarIdLocal("client");
  const clientCode = proximoClienteIdS3D();
  const subscriptionId = criarIdLocal("sub");
  const expiresAt = trial ? calcularFimTrial(agora, DEFAULT_TRIAL_DAYS) : "";
  const cliente = normalizarClienteSaas({
    id: clientId,
    clientCode,
    name: negocio,
    responsibleName: nome,
    email: emailNormalizado,
    phone: telefone,
    status: "active",
    planoAtual: plano.slug,
    statusAssinatura: trial ? "trialing" : "active",
    createdAt: agora,
    lastAccessAt: agora
  });
  const assinatura = normalizarAssinaturaSaas({
    id: subscriptionId,
    clientId,
    planSlug: plano.slug,
    planId: plano.slug,
    activePlan: plano.slug,
    subscriptionStatus: trial ? "trialing" : "free",
    paymentStatus: "none",
    status: trial ? "trialing" : "pending",
    promoUsed: false,
    billingVariant: "premium_first_month",
    currentPeriodStart: agora,
    currentPeriodEnd: expiresAt,
    startedAt: agora,
    expiresAt,
    nextBillingAt: expiresAt || agora,
    planExpiresAt: expiresAt,
    trialStartedAt: trial ? agora : "",
    trialExpiresAt: trial ? expiresAt : "",
    trialConsumedAt: trial ? agora : "",
    isTrialActive: trial
  });
  const usuario = normalizarUsuario({
    id: criarIdUsuario(),
    clientId,
    nome,
    email: emailNormalizado,
    phone: telefone,
    papel: "user",
    ativo: true,
    planStatus: assinatura.status,
    trialStartedAt: trial ? agora : "",
    trialConsumedAt: trial ? agora : "",
    trialDays: DEFAULT_TRIAL_DAYS,
    planExpiresAt: expiresAt,
    acceptedTermsAt: agora,
    criadoEm: agora
  });

  saasClients.push(cliente);
  saasSubscriptions.push(assinatura);
  usuarios.push(usuario);
  billingConfig.clientId = clientId;
  billingConfig.subscriptionId = subscriptionId;
  billingConfig.licenseEmail = emailNormalizado;
  billingConfig.planSlug = plano.slug;
  billingConfig.activePlan = plano.slug;
  billingConfig.pendingPlan = "";
  billingConfig.paymentStatus = "none";
  billingConfig.subscriptionStatus = trial ? "trialing" : "free";
  billingConfig.licenseStatus = assinatura.status;
  billingConfig.trialStartedAt = trial ? agora : "";
  billingConfig.trialExpiresAt = trial ? expiresAt : "";
  billingConfig.trialConsumedAt = trial ? agora : "";
  billingConfig.isTrialActive = trial;
  billingConfig.paidUntil = expiresAt;
  billingConfig.planExpiresAt = expiresAt;
  billingConfig.monthlyPrice = plano.price;

  return { cliente, assinatura, usuario, senha };
}

function criarIdUsuario() {
  return "user-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function bytesParaBase64(bytes) {
  let binario = "";
  new Uint8Array(bytes).forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario);
}

function base64ParaBytes(base64) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

function cryptoDisponivel() {
  return !!(window.crypto?.subtle && window.crypto?.getRandomValues);
}

function gerarSaltSenha() {
  const bytes = new Uint8Array(16);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesParaBase64(bytes);
}

async function gerarHashSenha(senha, salt = gerarSaltSenha(), iterations = 120000) {
  if (!cryptoDisponivel()) {
    return "local$" + salt + "$" + btoa(unescape(encodeURIComponent(salt + ":" + senha)));
  }

  const encoder = new TextEncoder();
  const chave = await crypto.subtle.importKey("raw", encoder.encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt: base64ParaBytes(salt),
    iterations,
    hash: "SHA-256"
  }, chave, 256);
  return `pbkdf2$${iterations}$${salt}$${bytesParaBase64(bits)}`;
}

async function verificarHashSenha(senha, hash) {
  if (!hash) return false;
  if (hash.startsWith("local$")) {
    const partesLocal = hash.split("$");
    return hash === "local$" + partesLocal[1] + "$" + btoa(unescape(encodeURIComponent(partesLocal[1] + ":" + senha)));
  }
  const partes = String(hash).split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") return false;
  const esperado = await gerarHashSenha(senha, partes[2], Number(partes[1]) || 120000);
  return esperado === hash;
}

function senhaEhObvia(senha) {
  const alvo = removerAcentos(String(senha || "").toLowerCase()).replace(/\s+/g, "");
  return ["123456", "12345678", "senha123", "admin123", "admin", "password", "qwerty123", "ne3d123"].includes(alvo);
}

function avaliarForcaSenha(senha) {
  const texto = String(senha || "");
  const regras = {
    tamanho: texto.length >= 8,
    maiuscula: /[A-Z]/.test(texto),
    minuscula: /[a-z]/.test(texto),
    numero: /\d/.test(texto),
    especial: /[^A-Za-z0-9]/.test(texto),
    naoObvia: !senhaEhObvia(texto)
  };
  const pontos = Object.values(regras).filter(Boolean).length;
  return {
    regras,
    pontos,
    nivel: pontos >= 6 ? "forte" : pontos >= 4 ? "media" : "fraca",
    valida: pontos >= 6
  };
}

function mensagemValidacaoSenha(senha) {
  const forca = avaliarForcaSenha(senha);
  if (forca.valida) return "";
  const faltando = [];
  if (!forca.regras.tamanho) faltando.push("8 caracteres");
  if (!forca.regras.maiuscula) faltando.push("letra maiúscula");
  if (!forca.regras.minuscula) faltando.push("letra minúscula");
  if (!forca.regras.numero) faltando.push("número");
  if (!forca.regras.especial) faltando.push("caractere especial");
  if (!forca.regras.naoObvia) faltando.push("não ser uma senha óbvia");
  return "A senha precisa ter " + faltando.join(", ") + ".";
}

function renderIndicadorForcaSenha(inputId = "novoUsuarioSenha", inputEl = null) {
  const input = inputEl || document.getElementById(inputId);
  const valor = input?.value || "";
  const formulario = input?.closest?.(".password-change-form");
  const alvo = formulario?.querySelector(`[data-strength-for="${inputId}"]`) || document.querySelector(`[data-strength-for="${inputId}"]`);
  if (!alvo) return;
  const forca = avaliarForcaSenha(valor);
  alvo.className = `password-strength strength-${forca.nivel}`;
  alvo.textContent = valor ? `Senha ${forca.nivel === "media" ? "média" : forca.nivel}` : "Digite uma senha forte";
}

function chaveTentativaLogin(email) {
  return normalizarEmail(email || "admin-local") || "visitante";
}

function getTentativaLogin(email) {
  const chave = chaveTentativaLogin(email);
  const atual = loginAttempts[chave] || { count: 0, lockedUntil: 0 };
  if ((Number(atual.lockedUntil) || 0) < Date.now()) {
    atual.lockedUntil = 0;
    if ((Number(atual.count) || 0) >= LOGIN_MAX_ATTEMPTS) atual.count = 0;
  }
  loginAttempts[chave] = atual;
  return atual;
}

function loginEstaBloqueado(email) {
  const tentativa = getTentativaLogin(email);
  const ate = Number(tentativa.lockedUntil) || 0;
  if (ate > Date.now()) {
    const minutos = Math.ceil((ate - Date.now()) / 60000);
    alert(`Muitas tentativas incorretas. Tente novamente em ${minutos} minuto(s).`);
    return true;
  }
  return false;
}

function registrarFalhaLogin(email, motivo = "Usuário ou senha inválidos") {
  const chave = chaveTentativaLogin(email);
  const tentativa = getTentativaLogin(chave);
  tentativa.count = (Number(tentativa.count) || 0) + 1;
  tentativa.lastFailureAt = new Date().toISOString();
  if (tentativa.count >= LOGIN_MAX_ATTEMPTS) {
    tentativa.lockedUntil = Date.now() + LOGIN_LOCK_MS;
  }
  loginAttempts[chave] = tentativa;
  salvarDados();
  registrarSeguranca("Falha de login", "erro", motivo, email);
}

function limparFalhasLogin(email) {
  delete loginAttempts[chaveTentativaLogin(email)];
  salvarDados();
}

async function definirSenhaUsuario(usuario, senha, temporaria = false) {
  usuario.passwordHash = await gerarHashSenha(senha);
  usuario.senha = "";
  usuario.mustChangePassword = !!temporaria;
  usuario.senhaTemporaria = !!temporaria;
  usuario.passwordUpdatedAt = temporaria ? "" : new Date().toISOString();
  usuario.atualizadoEm = new Date().toISOString();
}

async function verificarSenhaUsuario(usuario, senha) {
  if (!usuario) return false;
  if (usuario.passwordHash && await verificarHashSenha(senha, usuario.passwordHash)) return true;
  if (usuario.senha && usuario.senha === senha) {
    await definirSenhaUsuario(usuario, senha, usuario.senhaTemporaria || usuario.mustChangePassword);
    salvarDados();
    return true;
  }
  return false;
}

function garantirSuperadminPrincipalLocal() {
  const emailBootstrap = normalizarEmail(SUPERADMIN_BOOTSTRAP_EMAIL);
  if (!emailBootstrap) return null;
  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === emailBootstrap);
  const agora = new Date().toISOString();
  if (!usuario) {
    usuario = normalizarUsuario({
      nome: "Everton PAESS",
      email: emailBootstrap,
      papel: "superadmin",
      ativo: true,
      passwordHash: SUPERADMIN_BOOTSTRAP_HASH,
      mustChangePassword: true,
      senhaTemporaria: true,
      criadoEm: agora
    });
    usuarios.unshift(usuario);
  }

  usuario.nome = usuario.nome || "Everton PAESS";
  usuario.papel = "superadmin";
  usuario.ativo = true;
  usuario.bloqueado = false;
  if (!usuario.passwordHash && !usuario.passwordUpdatedAt) {
    usuario.passwordHash = SUPERADMIN_BOOTSTRAP_HASH;
    usuario.senha = "";
    usuario.mustChangePassword = true;
    usuario.senhaTemporaria = true;
  }

  return usuario;
}

function limparDadosComerciaisBootstrapCliente() {
  const emailBootstrap = normalizarEmail(SUPERADMIN_BOOTSTRAP_EMAIL);
  if (emailBootstrap && !billingConfig.ownerMode && normalizarEmail(billingConfig.ownerEmail) === emailBootstrap) {
    billingConfig.ownerEmail = "";
    if (String(billingConfig.ownerName || "").trim() === "Everton PAESS") {
      billingConfig.ownerName = "";
    }
  }
  if (emailBootstrap && normalizarEmail(billingConfig.licenseEmail) === emailBootstrap) {
    billingConfig.licenseEmail = "";
  }
}

function garantirUsuarioDono(nome = billingConfig.ownerName, email = billingConfig.ownerEmail, senha = "") {
  const emailDono = normalizarEmail(email);
  if (!emailDono) return null;

  usuarios = normalizarUsuarios(usuarios);
  const existente = usuarios.find((usuario) => normalizarEmail(usuario.email) === emailDono);
  if (existente) {
    existente.nome = String(nome || existente.nome || "Usuário").trim();
    if (senha) existente.senha = senha;
    if (existente.papel !== "superadmin") existente.papel = "user";
    existente.ativo = true;
    return existente;
  }

  const novo = {
    id: criarIdUsuario(),
    nome: String(nome || "Usuário").trim(),
    email: emailDono,
    senha,
    papel: "user",
    ativo: true,
    criadoEm: new Date().toISOString()
  };
  usuarios.unshift(novo);
  return novo;
}

garantirSuperadminPrincipalLocal();
limparDadosComerciaisBootstrapCliente();
garantirEstruturaSaasLocal();
salvarDados();

function getUsuarioAtual() {
  const emailAtual = normalizarEmail(usuarioAtualEmail);
  if (!emailAtual) return null;
  usuarios = normalizarUsuarios(usuarios);
  return usuarios.find((usuario) => usuario.email === emailAtual && usuario.ativo) || null;
}

function isDono() {
  return false;
}

function isSuperAdmin(usuario = getUsuarioAtual()) {
  return usuario?.papel === "superadmin";
}

function getSuperAdminPrincipal() {
  usuarios = normalizarUsuarios(usuarios);
  return usuarios.find((usuario) => usuario.papel === "superadmin") || null;
}

function isSuperAdminPrincipal(usuario) {
  const principal = getSuperAdminPrincipal();
  return !!usuario && !!principal && String(usuario.id) === String(principal.id);
}

function isAdminCliente() {
  const usuario = getUsuarioAtual();
  return usuario?.papel === "admin" || usuario?.papel === "superadmin";
}

function podeGerenciarUsuarios() {
  return adminLogado || isAdminCliente();
}

function existeAdminCliente(clientId = getClientIdAtual()) {
  usuarios = normalizarUsuarios(usuarios);
  return usuarios.some((usuario) => {
    if (usuario.papel !== "admin" || usuario.ativo === false || usuario.bloqueado) return false;
    return !clientId || usuario.clientId === clientId || (!usuario.clientId && usuario.email === normalizarEmail(billingConfig.licenseEmail));
  });
}

function renderAdminSobDemanda(mensagem = "Configure um administrador para continuar") {
  return `
    <div class="danger-zone admin-demand-box">
      ${mensagem ? `<h2 class="section-title">${escaparHtml(mensagem)}</h2>` : ""}
      <div class="sync-grid">
        <label class="field">
          <span>Nome</span>
          <input id="adminDemandaNome" placeholder="Nome do administrador">
        </label>
        <label class="field">
          <span>E-mail</span>
          <input id="adminDemandaEmail" type="email" placeholder="admin@email.com">
        </label>
        <label class="field">
          <span>Senha</span>
          <div class="password-row">
            <input id="adminDemandaSenha" type="password" autocomplete="new-password" oninput="renderIndicadorForcaSenha('adminDemandaSenha', this)">
            <button class="icon-button" type="button" onclick="alternarSenhaVisivel('adminDemandaSenha')" title="Mostrar/ocultar senha">👁</button>
          </div>
          <small class="password-strength" data-strength-for="adminDemandaSenha">Digite uma senha forte</small>
        </label>
      </div>
      <div class="actions">
        <button class="btn secondary" onclick="criarAdminSobDemanda()">Criar admin</button>
      </div>
    </div>
  `;
}

function mostrarAdminSobDemanda() {
  const popup = document.getElementById("popup");
  if (!popup) {
    trocarTela("admin");
    return;
  }
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="modal-close">
      <div class="modal-card admin-demand-modal">
        <div class="modal-header">
          <h2>Configure um administrador para continuar</h2>
          <button class="icon-button" type="button" data-action="modal-close" title="Fechar">✕</button>
        </div>
        ${renderAdminSobDemanda("")}
      </div>
    </div>
  `;
}

async function criarAdminSobDemanda() {
  const nome = String(document.getElementById("adminDemandaNome")?.value || "").trim();
  const email = normalizarEmail(document.getElementById("adminDemandaEmail")?.value || "");
  const senha = document.getElementById("adminDemandaSenha")?.value || "";
  if (!nome || !email || !senha) {
    alert("Campo obrigatório");
    return;
  }
  if (!emailValido(email)) {
    alert("Informe um e-mail válido.");
    return;
  }
  const erroSenha = mensagemValidacaoSenha(senha);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }
  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === email);
  if (!usuario) {
    usuario = normalizarUsuario({
      id: criarIdUsuario(),
      clientId: getClientIdAtual(),
      companyId: billingConfig.companyId,
      nome,
      email,
      papel: "admin",
      ativo: true,
      criadoEm: new Date().toISOString()
    });
    usuarios.push(usuario);
  }
  usuario.nome = nome;
  usuario.clientId = usuario.clientId || getClientIdAtual();
  usuario.companyId = usuario.companyId || billingConfig.companyId;
  usuario.papel = "admin";
  usuario.ativo = true;
  usuario.bloqueado = false;
  await definirSenhaUsuario(usuario, senha, true);
  salvarDados();
  registrarAuditoria("admin sob demanda criado", { email }, usuario.clientId || billingConfig.clientId);
  mostrarToast("Administrador configurado.", "sucesso", 4200);
  fecharPopup();
  renderApp();
}

function exigirAdminParaAcao() {
  if (podeGerenciarUsuarios()) return true;
  if (!existeAdminCliente()) {
    mostrarAdminSobDemanda();
    return false;
  }
  alert("Entre com um usuário admin para continuar.");
  trocarTela("admin");
  return false;
}

function obterWhatsapp2FA() {
  return normalizarTelefoneWhatsapp(appConfig.twoFactorWhatsapp || appConfig.whatsappNumber || "");
}

function doisFatoresValido() {
  const validade = Number(sessionStorage.getItem("twoFactorValidUntil") || 0);
  return validade > Date.now();
}

function whatsapp2FABackendDisponivel() {
  return WHATSAPP_2FA_BACKEND_ENABLED === true;
}

function registrar2FADesativadoTemporariamente(motivo = "backend indisponível") {
  if (sessionStorage.getItem("twoFactorWhatsappDisabledNotice") === "sim") return;
  sessionStorage.setItem("twoFactorWhatsappDisabledNotice", "sim");
  registrarHistorico("Segurança", "2FA WhatsApp desativado temporariamente");
  registrarSeguranca("2FA WhatsApp desativado temporariamente", "sucesso", motivo, getUsuarioAtual()?.email || syncConfig.supabaseEmail || "login");
}

function precisa2FA(usuario = null) {
  if (!appConfig.twoFactorEnabled || doisFatoresValido()) return false;
  if (!whatsapp2FABackendDisponivel()) {
    registrar2FADesativadoTemporariamente("2FA WhatsApp exige backend, armazenamento temporário e provedor oficial.");
    return false;
  }
  if (!obterWhatsapp2FA()) return false;
  if (appConfig.twoFactorScope === "todos") return true;
  return !usuario || ["superadmin", "admin"].includes(usuario.papel);
}

function gerarCodigo2FA() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function abrirWhats2FA() {
  if (!twoFactorPending) return;
  if (!whatsapp2FABackendDisponivel()) {
    registrar2FADesativadoTemporariamente("Tentativa de abrir WhatsApp 2FA sem backend.");
    alert("2FA WhatsApp desativado temporariamente. Entre com e-mail e senha.");
    return;
  }

  const numero = obterWhatsapp2FA();
  if (!numero) {
    alert("Configure o WhatsApp da verificação em duas etapas.");
    return;
  }

  const mensagem = [
    `${appConfig.appName || SYSTEM_NAME} - verificação em duas etapas`,
    `Código: ${twoFactorPending.codigo}`,
    `Acesso: ${twoFactorPending.nome || "Admin"}`,
    "Se você não pediu esse acesso, ignore esta mensagem."
  ].join("\n");

  window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem), "_blank");
}

function iniciarVerificacao2FA(tipo, usuario = null) {
  if (!whatsapp2FABackendDisponivel()) {
    registrar2FADesativadoTemporariamente("Fluxo 2FA solicitado sem backend real.");
    return false;
  }
  twoFactorPending = {
    tipo,
    email: usuario?.email || "",
    nome: usuario?.nome || (tipo === "admin" ? "Admin local" : "Usuário"),
    codigo: gerarCodigo2FA(),
    expiraEm: Date.now() + 5 * 60 * 1000
  };
  abrirWhats2FA();
  renderApp();
  return true;
}

function confirmarCodigo2FA() {
  if (!twoFactorPending) {
    alert("Nenhuma verificação pendente.");
    return;
  }

  if (Date.now() > twoFactorPending.expiraEm) {
    twoFactorPending = null;
    alert("Código expirado. Tente entrar novamente.");
    renderApp();
    return;
  }

  const codigo = (document.getElementById("twoFactorCode")?.value || "").trim();
  if (codigo !== twoFactorPending.codigo) {
    alert("Código incorreto.");
    return;
  }

  const lembrarMinutos = Math.max(1, Number(appConfig.twoFactorRememberMinutes) || 60);
  sessionStorage.setItem("twoFactorValidUntil", String(Date.now() + lembrarMinutos * 60 * 1000));

  const pendente = twoFactorPending;
  twoFactorPending = null;

  if (pendente.tipo === "admin") {
    concluirLoginAdmin();
    return;
  }

  const usuario = normalizarUsuarios(usuarios).find((item) => item.email === pendente.email && item.ativo);
  if (!usuario) {
    alert("Usuário não encontrado.");
    renderApp();
    return;
  }

  concluirLoginUsuario(usuario);
}

function cancelar2FA() {
  twoFactorPending = null;
  renderApp();
}

function renderVerificacao2FA() {
  if (!twoFactorPending) return "";
  if (!whatsapp2FABackendDisponivel()) {
    twoFactorPending = null;
    return "";
  }

  return `
    <div class="danger-zone">
      <h2 class="section-title">Verificação em duas etapas</h2>
      <p class="muted">Enviamos um código para o WhatsApp configurado. Digite o código para concluir o acesso.</p>
      <label class="field">
        <span>Código recebido</span>
        <input id="twoFactorCode" inputmode="numeric" maxlength="6" placeholder="000000">
      </label>
      <div class="actions">
        <button class="btn" onclick="confirmarCodigo2FA()">Confirmar código</button>
        <button class="btn ghost" onclick="abrirWhats2FA()">Reenviar WhatsApp</button>
        <button class="btn ghost" onclick="cancelar2FA()">Cancelar</button>
      </div>
    </div>
  `;
}

function isMobile() {
  return window.innerWidth < 768;
}

function detectarTipoDispositivo() {
  const agente = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(agente) || isMobile()) return "mobile";
  return "desktop";
}

function nomeTipoDispositivo(tipo) {
  return tipo === "mobile" ? "celular Android" : "Windows/navegador";
}

function getLimitesDispositivos() {
  const limitePlano = getSessionLimitPlano();
  const limites = billingConfig.deviceLimits && typeof billingConfig.deviceLimits === "object" ? billingConfig.deviceLimits : {};
  return {
    mobile: Math.max(1, Number(limites.mobile) || limitePlano),
    desktop: Math.max(1, Number(limites.desktop) || limitePlano),
    total: limitePlano
  };
}

function normalizarDispositivosLicenca(lista = billingConfig.registeredDevices) {
  const vistos = new Set();
  return (Array.isArray(lista) ? lista : []).map((item) => {
    const email = normalizarEmail(item?.email);
    const id = String(item?.id || "").trim();
    const tipo = item?.tipo === "desktop" ? "desktop" : "mobile";
    if (!email || !id) return null;
    const chave = `${email}:${tipo}:${id}`;
    if (vistos.has(chave)) return null;
    vistos.add(chave);
    return {
      id,
      email,
      tipo,
      nome: String(item?.nome || nomeTipoDispositivo(tipo)).trim(),
      ultimoAcesso: item?.ultimoAcesso || new Date().toISOString()
    };
  }).filter(Boolean);
}

function getEmailLicencaAtual() {
  const usuario = getUsuarioAtual();
  return normalizarEmail(usuario?.email || billingConfig.licenseEmail || "");
}

function getDataOwnerId() {
  const remoto = getEscopoDadosAtual();
  if (remoto) return remoto;
  const usuario = getUsuarioAtual();
  return isSuperAdmin(usuario) ? "superadmin" : normalizarEmail(usuario?.email || billingConfig.licenseEmail || deviceId);
}

function prepararRegistroOnline(registro = {}) {
  const atualizadoEm = registro.updated_at || registro.updatedAt || registro.atualizadoEm || new Date().toISOString();
  const ownerId = getDataOwnerId();
  return {
    ...registro,
    user_id: pareceUuid(ownerId) ? ownerId : registro.user_id || registro.userId || null,
    owner_id: ownerId,
    source_device_id: registro.source_device_id || registro.sourceDeviceId || deviceId,
    sourceDeviceId: registro.sourceDeviceId || registro.source_device_id || deviceId,
    sync_status: registro.sync_status || registro.syncStatus || "pending",
    updated_at: atualizadoEm,
    updatedAt: registro.updatedAt || atualizadoEm
  };
}

function getRegistroSyncId(colecao, registro = {}) {
  const id = registro.remote_id || registro.remoteId || registro.id || registro.local_id || registro.localId;
  if (id !== undefined && id !== null && String(id).trim()) return String(id);
  const base = [
    colecao,
    registro.cliente || registro.nome || registro.descricao || registro.tipo || "registro",
    registro.data || registro.criadoEm || registro.createdAt || registro.updated_at || Date.now()
  ].join("|");
  return base.toLowerCase().replace(/[^a-z0-9_-]+/gi, "-").slice(0, 90);
}

function normalizarPayloadSync(colecao, registro = {}) {
  const atualizadoEm = registro.updated_at || registro.updatedAt || registro.atualizadoEm || registro.criadoEm || registro.createdAt || new Date().toISOString();
  const ownerId = getDataOwnerId();
  return {
    ...registro,
    user_id: pareceUuid(ownerId) ? ownerId : registro.user_id || registro.userId || null,
    owner_id: ownerId,
    source_device_id: registro.source_device_id || registro.sourceDeviceId || deviceId,
    sourceDeviceId: registro.sourceDeviceId || registro.source_device_id || deviceId,
    sync_status: registro.sync_status || registro.syncStatus || "pending",
    updated_at: atualizadoEm,
    updatedAt: registro.updatedAt || atualizadoEm,
    local_collection: colecao
  };
}

function getTimestampAlteracaoRegistro(item = {}) {
  return Date.parse(
    item?.updated_at
    || item?.updatedAt
    || item?.atualizadoEm
    || item?.lastSeenAt
    || item?.last_seen_at
    || item?.data
    || item?.createdAt
    || item?.criadoEm
    || 0
  ) || 0;
}

function coletarClientesOperacionaisParaSync() {
  const mapa = new Map();
  pedidos.forEach((pedido) => {
    const nome = String(clienteDoPedido(pedido) || "").trim();
    if (!nome || nome === "Sem cliente") return;
    const telefone = telefoneDoPedido(pedido);
    const chave = normalizarTextoBusca(`${nome}|${telefone || ""}`);
    const atual = mapa.get(chave) || {
      id: `cliente-${chave.slice(0, 72)}`,
      nome,
      telefone,
      pedidos: 0,
      total: 0,
      owner_id: pedido.owner_id || getDataOwnerId(),
      sync_status: pedido.sync_status || "pending",
      updated_at: pedido.updated_at || pedido.updatedAt || pedido.criadoEm || new Date().toISOString()
    };
    atual.pedidos += 1;
    atual.total += totalPedido(pedido);
    const pedidoAtualizado = Date.parse(pedido.updated_at || pedido.updatedAt || pedido.criadoEm || 0) || 0;
    const atualAtualizado = Date.parse(atual.updated_at || 0) || 0;
    if (pedidoAtualizado > atualAtualizado) atual.updated_at = pedido.updated_at || pedido.updatedAt || pedido.criadoEm;
    if ((pedido.sync_status || "pending") !== "synced") atual.sync_status = "pending";
    mapa.set(chave, atual);
  });
  return Array.from(mapa.values());
}

function getColecaoLocalSync(colecao) {
  if (colecao === "pedidos") return pedidos;
  if (colecao === "estoque") return estoque;
  if (colecao === "caixa") return caixa;
  if (colecao === "clientes") return coletarClientesOperacionaisParaSync();
  return [];
}

function coletarRegistrosPendentesLocais() {
  const itens = [];
  SYNCABLE_COLLECTIONS.forEach((colecao) => {
    getColecaoLocalSync(colecao).forEach((registro) => {
      const status = String(registro.sync_status || registro.syncStatus || "pending").toLowerCase();
      if (!["pending", "error"].includes(status)) return;
      const payload = normalizarPayloadSync(colecao, registro);
      itens.push({
        id: `${colecao}:${getRegistroSyncId(colecao, payload)}`,
        scopeId: getEscopoDadosAtual(),
        collection: colecao,
        recordId: getRegistroSyncId(colecao, payload),
        data: payload,
        operation: payload.deleted_at ? "delete" : "upsert",
        status: "pending",
        attempts: 0,
        updatedAt: payload.updated_at || new Date().toISOString()
      });
    });
  });
  return itens;
}

function salvarFilaSyncLocal() {
  const escopo = getEscopoDadosAtual();
  const fila = escopo
    ? (Array.isArray(pendingSync) ? pendingSync : []).filter((item) => !item.scopeId || item.scopeId === escopo).map((item) => ({ ...item, scopeId: escopo }))
    : (Array.isArray(pendingSync) ? pendingSync : []);
  pendingSync = fila;
  localStorage.setItem(getChaveFilaSyncUsuario(escopo), JSON.stringify(fila));
  if (escopo) localStorage.removeItem(PENDING_SYNC_QUEUE_KEY);
}

function recomporFilaSyncPendente() {
  const escopo = getEscopoDadosAtual();
  const mapa = new Map();
  (Array.isArray(pendingSync) ? pendingSync : []).forEach((item) => {
    if (!item?.collection || !item?.recordId) return;
    if (escopo && item.scopeId && item.scopeId !== escopo) return;
    const normalizado = escopo ? { ...item, scopeId: escopo } : item;
    mapa.set(`${normalizado.scopeId || "local"}:${normalizado.collection}:${normalizado.recordId}`, normalizado);
  });
  coletarRegistrosPendentesLocais().forEach((item) => {
    if (escopo && item.scopeId !== escopo) return;
    const chave = `${item.scopeId || "local"}:${item.collection}:${item.recordId}`;
    const existente = mapa.get(chave) || {};
    mapa.set(chave, { ...existente, ...item, attempts: existente.attempts || 0, scopeId: item.scopeId || escopo || "" });
  });
  pendingSync = Array.from(mapa.values()).filter((item) => item.status !== "synced" && (!escopo || item.scopeId === escopo));
  salvarFilaSyncLocal();
  return pendingSync;
}

function atualizarStatusRegistroLocalSync(colecao, recordId, status, extra = {}) {
  const atualizar = (registro) => {
    if (getRegistroSyncId(colecao, registro) !== String(recordId)) return registro;
    return {
      ...registro,
      ...extra,
      sync_status: status,
      syncStatus: status,
      remote_id: extra.remote_id || extra.remoteId || registro.remote_id || registro.remoteId || String(recordId),
      synced_at: status === "synced" ? new Date().toISOString() : registro.synced_at || "",
      sync_error: status === "error" ? String(extra.sync_error || extra.syncError || registro.sync_error || "").slice(0, 240) : ""
    };
  };
  if (colecao === "pedidos") pedidos = pedidos.map(atualizar);
  if (colecao === "estoque") estoque = estoque.map(atualizar);
  if (colecao === "caixa") caixa = caixa.map(atualizar);
}

async function enviarRegistroSyncSupabase(item) {
  const escopo = getEscopoDadosAtual();
  if (escopo && item.scopeId && item.scopeId !== escopo) {
    throw new Error("Fila offline pertence a outra conta.");
  }
  const payload = normalizarPayloadSync(item.collection, item.data || {});
  console.info("[SyncQueue][send]", {
    auth_uid: syncConfig.supabaseUserId || "",
    scope_id: item.scopeId || escopo || "",
    collection: item.collection,
    record_id: item.recordId,
    sync_status: payload.sync_status || "pending"
  });
  return requisicaoSupabase("/rest/v1/rpc/upsert_erp_record_if_newer", {
    method: "POST",
    body: JSON.stringify({
      p_collection: item.collection,
      p_record_id: String(item.recordId),
      p_data: payload,
      p_deleted_at: payload.deleted_at || null
    })
  });
}

async function sincronizarFilaOfflinePendente(motivo = "manual") {
  if (!estaOnline()) {
    recomporFilaSyncPendente();
    syncConfig.autoBackupStatus = "Offline - fila pendente";
    salvarDados();
    return { ok: false, offline: true, pending: pendingSync.length };
  }
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) {
    recomporFilaSyncPendente();
    return { ok: false, auth: false, pending: pendingSync.length };
  }

  recomporFilaSyncPendente();
  if (!pendingSync.length) return { ok: true, sent: 0, pending: 0 };

  let enviados = 0;
  const restantes = [];
  for (const item of pendingSync) {
    try {
      const resultado = await enviarRegistroSyncSupabase(item);
      const action = String(resultado?.action || resultado?.status || "synced");
      atualizarStatusRegistroLocalSync(item.collection, item.recordId, "synced", {
        remote_id: resultado?.remote_id || item.recordId,
        sync_result: action
      });
      enviados += 1;
      console.info("[SyncQueue][ok]", {
        motivo,
        collection: item.collection,
        record_id: item.recordId,
        action,
        sync_status: "synced"
      });
    } catch (erro) {
      const falha = {
        ...item,
        status: "error",
        attempts: Number(item.attempts || 0) + 1,
        lastError: String(erro.message || erro).slice(0, 240),
        updatedAt: new Date().toISOString()
      };
      atualizarStatusRegistroLocalSync(item.collection, item.recordId, "error", { sync_error: falha.lastError });
      restantes.push(falha);
      registrarDiagnostico("sync", `Falha ao sincronizar ${item.collection}/${item.recordId}`, falha.lastError);
      break;
    }
  }
  pendingSync = restantes.concat(pendingSync.slice(enviados + restantes.length).filter((item) => item.status !== "synced"));
  syncConfig.autoBackupStatus = restantes.length ? "Fila com erro" : "Fila sincronizada";
  syncConfig.ultimaSync = new Date().toISOString();
  salvarDados();
  return { ok: restantes.length === 0, sent: enviados, pending: pendingSync.length };
}

function realtimeSyncDisponivel() {
  return REALTIME_SYNC_ENABLED
    && typeof WebSocket !== "undefined"
    && !!syncConfig.supabaseAccessToken
    && !!syncConfig.supabaseUserId
    && !!syncConfig.supabaseUrl
    && estaOnline();
}

function montarUrlRealtimeSupabase() {
  const base = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL).replace(/^http/i, "ws");
  const anonKey = encodeURIComponent(syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY);
  return `${base}/realtime/v1/websocket?apikey=${anonKey}&vsn=2.0.0`;
}

function montarConfigRealtimeUsuario(userId) {
  const filtroUsuario = `user_id=eq.${userId}`;
  return {
    broadcast: { ack: false, self: false },
    presence: { enabled: false },
    postgres_changes: [
      { event: "INSERT", schema: "public", table: "erp_backups", filter: filtroUsuario },
      { event: "UPDATE", schema: "public", table: "erp_backups", filter: filtroUsuario },
      { event: "INSERT", schema: "public", table: "erp_records", filter: filtroUsuario },
      { event: "UPDATE", schema: "public", table: "erp_records", filter: filtroUsuario },
      { event: "INSERT", schema: "public", table: "subscriptions", filter: filtroUsuario },
      { event: "UPDATE", schema: "public", table: "subscriptions", filter: filtroUsuario },
      { event: "INSERT", schema: "public", table: "payments", filter: filtroUsuario },
      { event: "UPDATE", schema: "public", table: "payments", filter: filtroUsuario }
    ],
    private: false
  };
}

function proximoRefRealtime() {
  realtimeSyncState.ref += 1;
  return String(realtimeSyncState.ref);
}

function enviarMensagemRealtime(evento, payload = {}, opcoes = {}) {
  const socket = realtimeSyncState.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return "";
  const ref = proximoRefRealtime();
  const topic = opcoes.topic || realtimeSyncState.topic;
  let joinRef = Object.prototype.hasOwnProperty.call(opcoes, "joinRef") ? opcoes.joinRef : (realtimeSyncState.joinRef || null);
  if (evento === "phx_join") {
    joinRef = ref;
    realtimeSyncState.joinRef = joinRef;
  }
  socket.send(JSON.stringify([joinRef, ref, topic, evento, payload]));
  return ref;
}

function iniciarHeartbeatRealtime() {
  if (realtimeSyncState.heartbeatTimer) clearInterval(realtimeSyncState.heartbeatTimer);
  realtimeSyncState.heartbeatTimer = setInterval(() => {
    enviarMensagemRealtime("heartbeat", {}, { topic: "phoenix", joinRef: null });
  }, REALTIME_SYNC_HEARTBEAT_MS);
}

function limparTimersRealtime() {
  if (realtimeSyncState.heartbeatTimer) clearInterval(realtimeSyncState.heartbeatTimer);
  if (realtimeSyncState.reconnectTimer) clearTimeout(realtimeSyncState.reconnectTimer);
  if (realtimeSyncState.debounceTimer) clearTimeout(realtimeSyncState.debounceTimer);
  if (realtimeSyncState.pollTimer) clearInterval(realtimeSyncState.pollTimer);
  realtimeSyncState.heartbeatTimer = null;
  realtimeSyncState.reconnectTimer = null;
  realtimeSyncState.debounceTimer = null;
  realtimeSyncState.pollTimer = null;
}

function pararRealtimeSyncUsuario(motivo = "logout") {
  const socket = realtimeSyncState.socket;
  limparTimersRealtime();
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      enviarMensagemRealtime("phx_leave", {}, { joinRef: realtimeSyncState.joinRef || null });
    } catch (_) {}
  }
  if (socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)) {
    try {
      socket.close(1000, motivo);
    } catch (_) {}
  }
  realtimeSyncState = {
    socket: null,
    topic: "",
    userId: "",
    accessToken: "",
    ref: 0,
    joinRef: "",
    joined: false,
    heartbeatTimer: null,
    reconnectTimer: null,
    debounceTimer: null,
    pollTimer: null,
    applying: false,
    lastEventKey: "",
    lastEventAt: 0,
    lastPollAt: 0,
    lastToastAt: realtimeSyncState.lastToastAt || 0,
    reconnectAttempts: 0
  };
  registrarDiagnostico("Realtime", "Subscription encerrada", motivo);
}

function agendarReconnectRealtime(motivo = "socket-close") {
  if (!REALTIME_SYNC_ENABLED) return;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return;
  if (realtimeSyncState.reconnectTimer) clearTimeout(realtimeSyncState.reconnectTimer);
  const tentativas = Math.min(6, Number(realtimeSyncState.reconnectAttempts || 0) + 1);
  realtimeSyncState.reconnectAttempts = tentativas;
  const atraso = REALTIME_SYNC_RECONNECT_MS * tentativas;
  realtimeSyncState.reconnectTimer = setTimeout(() => {
    realtimeSyncState.reconnectTimer = null;
    iniciarRealtimeSyncUsuario(`reconnect:${motivo}`).catch((erro) => {
      registrarDiagnostico("Realtime", "Reconnect falhou", erro.message || erro);
    });
  }, atraso);
}

async function iniciarRealtimeSyncUsuario(motivo = "manual") {
  if (!REALTIME_SYNC_ENABLED) return false;
  if (!realtimeSyncDisponivel()) return false;
  const userId = String(syncConfig.supabaseUserId || "").trim();
  const token = String(syncConfig.supabaseAccessToken || "").trim();
  const socketAtual = realtimeSyncState.socket;
  if (
    socketAtual
    && realtimeSyncState.userId === userId
    && realtimeSyncState.accessToken === token
    && [WebSocket.CONNECTING, WebSocket.OPEN].includes(socketAtual.readyState)
  ) {
    agendarPollingSyncTempoReal(`realtime-already:${motivo}`);
    return true;
  }

  if (socketAtual) pararRealtimeSyncUsuario("troca-de-sessao");

  const topic = `realtime:simplifica-sync-${userId}`;
  const socket = new WebSocket(montarUrlRealtimeSupabase());
  realtimeSyncState.socket = socket;
  realtimeSyncState.topic = topic;
  realtimeSyncState.userId = userId;
  realtimeSyncState.accessToken = token;
  realtimeSyncState.joined = false;

  socket.onopen = () => {
    realtimeSyncState.reconnectAttempts = 0;
    enviarMensagemRealtime("phx_join", {
      config: montarConfigRealtimeUsuario(userId),
      access_token: token
    }, { joinRef: null });
    iniciarHeartbeatRealtime();
    agendarPollingSyncTempoReal(`realtime:${motivo}`);
    console.info("[Realtime][join]", { motivo, auth_uid: userId, tables: ["erp_backups", "erp_records", "subscriptions", "payments"] });
  };

  socket.onmessage = (event) => {
    tratarMensagemRealtimeSupabase(event.data);
  };

  socket.onerror = () => {
    registrarDiagnostico("Realtime", "Erro no WebSocket", motivo);
  };

  socket.onclose = () => {
    if (realtimeSyncState.socket !== socket) return;
    if (realtimeSyncState.heartbeatTimer) clearInterval(realtimeSyncState.heartbeatTimer);
    if (realtimeSyncState.debounceTimer) clearTimeout(realtimeSyncState.debounceTimer);
    realtimeSyncState.socket = null;
    realtimeSyncState.joined = false;
    realtimeSyncState.heartbeatTimer = null;
    realtimeSyncState.debounceTimer = null;
    agendarPollingSyncTempoReal("realtime-close");
    agendarReconnectRealtime("close");
  };

  return true;
}

function extrairMensagemRealtime(raw) {
  try {
    const mensagem = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(mensagem)) {
      return {
        joinRef: mensagem[0],
        ref: mensagem[1],
        topic: mensagem[2],
        event: mensagem[3],
        payload: mensagem[4] || {}
      };
    }
    return mensagem && typeof mensagem === "object" ? mensagem : null;
  } catch (erro) {
    registrarDiagnostico("Realtime", "Mensagem invalida", erro.message);
    return null;
  }
}

function normalizarEventoPostgresRealtime(payload = {}) {
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  return {
    ids: payload.ids || data.ids || [],
    schema: data.schema || "public",
    table: data.table || "",
    type: data.type || payload.type || "",
    commit_timestamp: data.commit_timestamp || payload.commit_timestamp || "",
    record: data.record && typeof data.record === "object" ? data.record : {},
    old_record: data.old_record && typeof data.old_record === "object" ? data.old_record : {},
    errors: data.errors || payload.errors || null
  };
}

function eventoRealtimePertenceAoUsuario(evento) {
  const userId = String(syncConfig.supabaseUserId || "").trim();
  if (!userId) return false;
  const clientId = String(billingConfig.clientId || getUsuarioAtual()?.clientId || "").trim();
  const record = evento.record || {};
  const oldRecord = evento.old_record || {};
  const data = record.data && typeof record.data === "object" ? record.data : {};
  const oldData = oldRecord.data && typeof oldRecord.data === "object" ? oldRecord.data : {};
  const candidatosUsuario = [
    record.user_id,
    record.owner_id,
    oldRecord.user_id,
    oldRecord.owner_id,
    data.user_id,
    data.owner_id,
    oldData.user_id,
    oldData.owner_id
  ].filter((valor) => valor !== undefined && valor !== null).map((valor) => String(valor));
  if (candidatosUsuario.includes(userId)) return true;
  const candidatosCliente = [
    record.client_id,
    oldRecord.client_id,
    data.client_id,
    data.clientId,
    oldData.client_id,
    oldData.clientId
  ].filter((valor) => valor !== undefined && valor !== null).map((valor) => String(valor));
  return !!clientId && candidatosCliente.includes(clientId);
}

function eventoRealtimeEhDesteDispositivo(evento) {
  if (!["erp_backups", "erp_records"].includes(evento.table)) return false;
  const record = evento.record || {};
  if (evento.table === "erp_backups" && String(record.device_id || "") === deviceId) return true;
  const data = record.data && typeof record.data === "object" ? record.data : {};
  return [
    data.source_device_id,
    data.sourceDeviceId,
    data.device_id,
    data.deviceId,
    data.sync_device_id
  ].filter(Boolean).some((valor) => String(valor) === deviceId);
}

function tratarMensagemRealtimeSupabase(raw) {
  const mensagem = extrairMensagemRealtime(raw);
  if (!mensagem) return;

  if (mensagem.event === "phx_reply") {
    const respostaJoin = mensagem.topic === realtimeSyncState.topic && mensagem.ref === realtimeSyncState.joinRef;
    if (mensagem.payload?.status === "ok" && respostaJoin) {
      realtimeSyncState.joined = true;
      registrarDiagnostico("Realtime", "Subscription ativa", realtimeSyncState.topic);
    } else if (mensagem.payload?.status === "error" && respostaJoin) {
      registrarDiagnostico("Realtime", "Falha ao assinar canal", JSON.stringify(mensagem.payload.response || {}));
    }
    return;
  }

  if (mensagem.event === "system") {
    if (mensagem.payload?.status === "error" || mensagem.payload?.status === "timeout") {
      registrarDiagnostico("Realtime", "Sistema reportou falha", mensagem.payload.message || mensagem.payload.status);
    }
    return;
  }

  if (mensagem.event === "postgres_changes") {
    tratarEventoRealtimeSupabase(normalizarEventoPostgresRealtime(mensagem.payload));
    return;
  }

  if (mensagem.event === "phx_close" || mensagem.event === "phx_error") {
    registrarDiagnostico("Realtime", "Canal fechado pelo servidor", mensagem.event);
  }
}

function tratarEventoRealtimeSupabase(evento) {
  if (!["erp_backups", "erp_records", "subscriptions", "payments"].includes(evento.table)) return;
  if (!eventoRealtimePertenceAoUsuario(evento)) return;
  if (eventoRealtimeEhDesteDispositivo(evento)) return;

  const recordId = evento.record?.id || evento.record?.record_id || evento.old_record?.id || evento.old_record?.record_id || "";
  const eventKey = [evento.table, evento.type, evento.commit_timestamp, recordId].join(":");
  if (eventKey === realtimeSyncState.lastEventKey && Date.now() - realtimeSyncState.lastEventAt < 2500) return;
  realtimeSyncState.lastEventKey = eventKey;
  realtimeSyncState.lastEventAt = Date.now();

  if (realtimeSyncState.debounceTimer) clearTimeout(realtimeSyncState.debounceTimer);
  realtimeSyncState.debounceTimer = setTimeout(() => {
    realtimeSyncState.debounceTimer = null;
    processarMudancaRealtimeSupabase(evento).catch((erro) => {
      registrarDiagnostico("Realtime", "Falha ao aplicar evento remoto", erro.message || erro);
    });
  }, REALTIME_SYNC_DEBOUNCE_MS);
}

function getListaColecaoOperacional(colecao) {
  if (colecao === "pedidos") return pedidos;
  if (colecao === "estoque") return estoque;
  if (colecao === "caixa") return caixa;
  if (colecao === "orcamentos") return orcamentos;
  return null;
}

function setListaColecaoOperacional(colecao, lista) {
  if (!Array.isArray(lista)) return false;
  if (colecao === "pedidos") pedidos = lista;
  else if (colecao === "estoque") estoque = lista;
  else if (colecao === "caixa") caixa = lista;
  else if (colecao === "orcamentos") orcamentos = lista;
  else return false;
  return true;
}

function aplicarRegistroRemotoRealtime(record = {}) {
  const colecao = String(record.collection || "").trim();
  const lista = getListaColecaoOperacional(colecao);
  if (!lista) return false;
  if (String(record.user_id || record.owner_id || "") !== String(syncConfig.supabaseUserId || "")) return false;

  const data = record.data && typeof record.data === "object" ? record.data : {};
  const recordId = String(record.record_id || data.remote_id || data.remoteId || data.id || "").trim();
  if (!recordId) return false;
  const indice = lista.findIndex((item) => getRegistroSyncId(colecao, item) === recordId || String(item?.id || "") === recordId);
  const local = indice >= 0 ? lista[indice] : null;
  const statusLocal = String(local?.sync_status || local?.syncStatus || "synced").toLowerCase();
  const localPendente = ["pending", "error"].includes(statusLocal);
  const tsLocal = getTimestampAlteracaoRegistro(local || {});
  const tsRemoto = getTimestampAlteracaoRegistro(data) || Date.parse(record.updated_at || record.created_at || 0) || 0;
  if (localPendente && tsLocal >= tsRemoto) return false;

  let novaLista;
  if (record.deleted_at || data.deleted_at) {
    novaLista = lista.filter((item) => getRegistroSyncId(colecao, item) !== recordId && String(item?.id || "") !== recordId);
  } else {
    const atualizadoEm = data.updated_at || data.updatedAt || record.updated_at || record.created_at || new Date().toISOString();
    const itemRemoto = {
      ...data,
      id: data.id || recordId,
      user_id: syncConfig.supabaseUserId,
      owner_id: syncConfig.supabaseUserId,
      remote_id: recordId,
      sync_status: "synced",
      syncStatus: "synced",
      updated_at: atualizadoEm,
      updatedAt: data.updatedAt || atualizadoEm,
      synced_at: new Date().toISOString(),
      sync_error: ""
    };
    novaLista = indice >= 0
      ? lista.map((item, idx) => (idx === indice ? itemRemoto : item))
      : lista.concat(itemRemoto);
  }

  return setListaColecaoOperacional(colecao, novaLista);
}

function avisarRealtimeDadosAtualizados() {
  const agora = Date.now();
  if (agora - Number(realtimeSyncState.lastToastAt || 0) < 3500) return;
  realtimeSyncState.lastToastAt = agora;
  if (typeof mostrarToast === "function") mostrarToast("Atualizado", "info", 2200);
}

function avisarRealtimePlanoAtualizado() {
  const agora = Date.now();
  if (agora - Number(realtimeSyncState.lastToastAt || 0) < 3500) return;
  realtimeSyncState.lastToastAt = agora;
  if (typeof mostrarToast === "function") mostrarToast("Plano atualizado", "info", 2400);
}

async function processarMudancaBillingRealtimeSupabase(evento) {
  registrarDiagnostico("Realtime", isSuperAdmin() ? "Evento de billing recebido" : "Plano atualizado em tempo real", `${evento.table}:${evento.type || ""}`);
  const licenca = await consultarLicencaSupabaseSilencioso({ motivo: `realtime-${evento.table}` });
  if (isSuperAdmin() && ["clientes", "superadmin", "admin"].includes(telaAtual)) {
    await carregarSaasSupabaseSilencioso({ renderizar: false, feedback: false }).catch((erro) => {
      registrarDiagnostico("Realtime", "Clientes SaaS não atualizados via billing", erro.message || erro);
    });
  }
  if (licenca && document.visibilityState !== "hidden") {
    if (["assinatura", "minhaAssinatura", "planos", "admin", "clientes", "dashboard"].includes(telaAtual)) agendarRenderizacaoPreservandoScroll(120);
    avisarRealtimePlanoAtualizado();
  }
  return !!licenca;
}

async function processarMudancaRealtimeSupabase(evento) {
  if (realtimeSyncState.applying || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  realtimeSyncState.applying = true;
  try {
    if (["subscriptions", "payments"].includes(evento.table)) {
      return await processarMudancaBillingRealtimeSupabase(evento);
    }

    const pendentes = recomporFilaSyncPendente();
    if (pendentes.length) {
      registrarDiagnostico("Realtime", "Evento remoto aguardou fila local", `${pendentes.length} item(ns) pendente(s)`);
      const sincronizado = await sincronizarSupabaseSilencioso();
      if (sincronizado) avisarRealtimeDadosAtualizados();
      return !!sincronizado;
    }

    let alterou = false;
    if (evento.table === "erp_records") {
      alterou = aplicarRegistroRemotoRealtime(evento.record) || alterou;
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const remoto = await obterBackupSupabase();
    if (remoto) {
      alterou = aplicarBackup(remoto, "mesclar") || alterou;
    }

    if (alterou) {
      marcarSincronizacaoVisual("realtime");
      syncConfig.autoBackupStatus = "Atualizado";
      salvarCacheDadosUsuario();
      salvarDados();
      if (document.visibilityState !== "hidden") agendarRenderizacaoPreservandoScroll(120);
      avisarRealtimeDadosAtualizados();
    }
    return alterou;
  } finally {
    realtimeSyncState.applying = false;
  }
}

async function baixarAtualizacoesSupabaseSilencioso(motivo = "polling") {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  if (realtimeSyncState.applying) return false;
  realtimeSyncState.applying = true;
  try {
    let alterou = false;
    const registros = await obterRegistrosErpSupabase();
    alterou = aplicarRegistrosErpSupabase(registros) || alterou;
    const remoto = await obterBackupSupabase();
    if (remoto) alterou = aplicarBackup(remoto, "mesclar") || alterou;
    if (alterou) {
      marcarSincronizacaoVisual(motivo);
      syncConfig.autoBackupStatus = "Atualizado";
      salvarCacheDadosUsuario();
      salvarDados();
      if (document.visibilityState !== "hidden") agendarRenderizacaoPreservandoScroll(120);
      avisarRealtimeDadosAtualizados();
    }
    return alterou;
  } catch (erro) {
    registrarDiagnostico("sync", "Polling de sincronização falhou", erro.message || erro);
    return false;
  } finally {
    realtimeSyncState.applying = false;
  }
}

async function executarPollingSyncTempoReal(motivo = "polling") {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  const agora = Date.now();
  const intervaloMinimo = document.visibilityState === "hidden" ? REALTIME_FALLBACK_BACKGROUND_MS : REALTIME_FALLBACK_FOREGROUND_MS;
  if (agora - Number(realtimeSyncState.lastPollAt || 0) < Math.max(8000, intervaloMinimo - 1000)) return false;
  realtimeSyncState.lastPollAt = agora;
  const pendentes = recomporFilaSyncPendente();
  if (pendentes.length) {
    return !!await sincronizarSupabaseSilencioso().catch((erro) => {
      registrarDiagnostico("sync", "Polling não enviou fila pendente", erro.message || erro);
      return false;
    });
  }
  return baixarAtualizacoesSupabaseSilencioso(motivo);
}

function agendarPollingSyncTempoReal(motivo = "session") {
  if (!REALTIME_SYNC_ENABLED) return false;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) return false;
  if (realtimeSyncState.pollTimer) clearInterval(realtimeSyncState.pollTimer);
  const intervalo = document.visibilityState === "hidden" ? REALTIME_FALLBACK_BACKGROUND_MS : REALTIME_FALLBACK_FOREGROUND_MS;
  realtimeSyncState.pollTimer = setInterval(() => {
    executarPollingSyncTempoReal("fallback-polling").catch((erro) => registrarDiagnostico("sync", "Fallback polling falhou", erro.message || erro));
  }, intervalo);
  if (document.visibilityState !== "hidden") {
    setTimeout(() => executarPollingSyncTempoReal(`fallback-start:${motivo}`).catch(() => {}), 1500);
  }
  return true;
}

function usuarioEhDonoDaLicenca(email) {
  const alvo = normalizarEmail(email);
  const usuario = normalizarUsuarios(usuarios).find((item) => item.email === alvo);
  return usuario?.papel === "superadmin";
}

function dispositivoDentroDoLimite(email = getEmailLicencaAtual()) {
  const emailLicenca = normalizarEmail(email);
  if (!emailLicenca || usuarioEhDonoDaLicenca(emailLicenca)) return true;

  const tipo = detectarTipoDispositivo();
  const limites = getLimitesDispositivos();
  const lista = normalizarDispositivosLicenca();
  if (lista.some((item) => item.email === emailLicenca && item.tipo === tipo && item.id === deviceId)) return true;
  return lista.filter((item) => item.email === emailLicenca).length < limites.total;
}

function registrarDispositivoLicenca(email = getEmailLicencaAtual(), silencioso = false) {
  const emailLicenca = normalizarEmail(email);
  if (!emailLicenca) {
    if (!silencioso) alert("Informe o e-mail da conta/licença antes de vincular este aparelho.");
    return false;
  }

  const tipo = detectarTipoDispositivo();
  const limites = getLimitesDispositivos();
  const lista = normalizarDispositivosLicenca();
  const atual = lista.find((item) => item.email === emailLicenca && item.tipo === tipo && item.id === deviceId);
  const usuarioDono = usuarioEhDonoDaLicenca(emailLicenca);

  if (!usuarioDono && !atual && lista.filter((item) => item.email === emailLicenca).length >= limites.total) {
    if (!silencioso) {
      alert("Detectamos múltiplos acessos. Para mais usuários, faça upgrade.");
    }
    return false;
  }

  const agora = new Date().toISOString();
  const nome = syncConfig.deviceName || nomeTipoDispositivo(tipo);
  const proximaLista = lista.filter((item) => !(item.email === emailLicenca && item.tipo === tipo && item.id === deviceId));
  proximaLista.unshift({
    id: deviceId,
    email: emailLicenca,
    tipo,
    nome,
    ultimoAcesso: agora
  });

  billingConfig.registeredDevices = proximaLista.slice(0, 30);
  salvarDados();
  return true;
}

function registrarSessaoSaasLocal(usuario = getUsuarioAtual()) {
  if (!usuario || usuario.papel === "superadmin") return true;
  const clientId = usuario.clientId || billingConfig.clientId;
  if (!clientId) return true;

  const agora = new Date().toISOString();
  const limite = getSessionLimitPlano();
  const janelaAtiva = Date.now() - SECURITY_SESSION_TIMEOUT_MS * 2;
  saasSessions = saasSessions.map(normalizarSessaoSaas).map((sessao) => {
    if ((Date.parse(sessao.lastSeenAt || 0) || 0) < janelaAtiva) {
      return { ...sessao, active: false, endedAt: sessao.endedAt || agora };
    }
    return sessao;
  });

  let atual = saasSessions.find((sessao) => sessao.clientId === clientId && sessao.deviceId === deviceId && sessao.active);
  if (!atual) {
    atual = normalizarSessaoSaas({
      clientId,
      userId: usuario.id,
      deviceId,
      userAgent: navigator.userAgent || "",
      startedAt: agora,
      lastSeenAt: agora,
      active: true
    });
    saasSessions.push(atual);
  } else {
    atual.userId = usuario.id;
    atual.lastSeenAt = agora;
    atual.atualizadoEm = agora;
    atual.updatedAt = agora;
    atual.userAgent = navigator.userAgent || atual.userAgent;
    atual.active = true;
  }

  const ativas = saasSessions
    .filter((sessao) => sessao.clientId === clientId && sessao.active)
    .sort((a, b) => (Date.parse(a.lastSeenAt || 0) || 0) - (Date.parse(b.lastSeenAt || 0) || 0));
  const excedentes = Math.max(0, ativas.length - limite);
  let fechadas = 0;
  ativas.slice(0, excedentes).forEach((sessao) => {
    if (sessao.deviceId === deviceId) return;
    sessao.active = false;
    sessao.endedAt = agora;
    fechadas += 1;
  });

  if (fechadas > 0) {
    registrarAuditoria("múltiplos acessos", { closedSessions: fechadas, limit: limite }, clientId);
    alert("Detectamos múltiplos acessos. Para mais usuários, faça upgrade.");
  }

  salvarDados();
  return true;
}

async function registrarSessaoSaasOnlineSilencioso(usuario = getUsuarioAtual()) {
  if (!usuario || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl || usuario.papel === "superadmin") return;
  try {
    const resultado = await requisicaoSupabase("/rest/v1/rpc/register_saas_session", {
      method: "POST",
      body: JSON.stringify({
        p_device_id: deviceId,
        p_user_agent: navigator.userAgent || ""
      })
    });
    if (Number(resultado?.closed_sessions || 0) > 0) {
      alert("Detectamos múltiplos acessos. Para mais usuários, faça upgrade.");
    }
  } catch (erro) {
    registrarDiagnostico("Sessão SaaS", "Controle online de sessão não registrado", erro.message);
  }
}

function renderDispositivosLicenca() {
  const email = getEmailLicencaAtual();
  const limites = getLimitesDispositivos();
  const lista = normalizarDispositivosLicenca().filter((item) => item.email === email);
  const linhas = lista.map((item) => `
    <div class="device-row">
      <div>
        <strong>${escaparHtml(nomeTipoDispositivo(item.tipo))}</strong>
        <span class="muted">${escaparHtml(item.nome)} • ${new Date(item.ultimoAcesso).toLocaleDateString("pt-BR")}</span>
      </div>
      <span class="status-badge">${item.id === deviceId ? "Atual" : "Vinculado"}</span>
    </div>
  `).join("") || `<p class="empty">Nenhum aparelho vinculado ainda.</p>`;

  return `
    <div class="device-list">
      <div class="row-title">
        <strong>Aparelhos da licença</strong>
        <span class="muted">${limites.total} sessão(ões) simultânea(s)</span>
      </div>
      ${linhas}
    </div>
  `;
}

function podeGerenciarComercial() {
  return isSuperAdmin() || isAdminCliente() || (adminLogado && !getUsuarioAtual());
}

function formatarMoeda(valor) {
  return moeda.format(Number(valor) || 0);
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escaparAttr(valor) {
  return escaparHtml(valor)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMarcaProjetoSrc(tipo = "cover") {
  if (appConfig.brandLogoDataUrl) return appConfig.brandLogoDataUrl;
  return tipo === "icon" ? PROJECT_ICON_IMAGE : PROJECT_COVER_IMAGE;
}

function getMarcaOficialProjetoSrc(tipo = "cover") {
  return tipo === "icon" ? PROJECT_ICON_IMAGE : PROJECT_COVER_IMAGE;
}

function renderMarcaProjeto(classe = "brand-logo", alt = "Marca do projeto", tipo = "") {
  const variant = tipo || (classe.includes("side-brand-logo") ? "icon" : "cover");
  const src = getMarcaProjetoSrc(variant);
  return src ? `<img class="${escaparAttr(classe)}" src="${escaparAttr(src)}" alt="${escaparAttr(alt)}">` : "";
}

function renderMarcaOficialProjeto(classe = "brand-logo", alt = "Simplifica 3D", tipo = "cover") {
  const src = getMarcaOficialProjetoSrc(tipo);
  return src ? `<img class="${escaparAttr(classe)}" src="${escaparAttr(src)}" alt="${escaparAttr(alt)}">` : "";
}

function finalizarIntroAbertura(overlay) {
  if (!overlay || overlay.dataset.done === "true") return;
  overlay.dataset.done = "true";
  overlay.classList.add("is-hidden");
  setTimeout(() => overlay.remove(), 420);
}

function tentarReproduzirIntro(video, overlay) {
  if (!video || !overlay) return;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const playPromise = video.play?.();
  if (playPromise?.then) {
    playPromise.then(() => {
      overlay.classList.remove("needs-action");
      video.controls = false;
    }).catch((erro) => {
      console.debug("Intro: autoplay bloqueado, aguardando toque do usuario.", erro);
      overlay.classList.add("needs-action");
      video.controls = true;
    });
  }
}

function iniciarIntroAbertura() {
  if (!INTRO_VIDEO_SRC || !document.body) return;
  if (document.getElementById("introOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "introOverlay";
  overlay.className = "intro-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.innerHTML = `
    <div class="intro-video-frame" style="aspect-ratio:${escaparAttr(INTRO_VIDEO_ASPECT_RATIO)};width:${escaparAttr(INTRO_VIDEO_FRAME_WIDTH)};height:${escaparAttr(INTRO_VIDEO_FRAME_HEIGHT)};">
      <video class="intro-video" src="${escaparAttr(INTRO_VIDEO_SRC)}" poster="${escaparAttr(PROJECT_COVER_IMAGE)}" autoplay muted playsinline webkit-playsinline preload="auto" style="width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;background:#051c26;"></video>
    </div>
    <button class="intro-play" type="button" aria-label="Reproduzir abertura">Reproduzir</button>
    <button class="intro-skip" type="button" aria-label="Pular abertura">Pular</button>
  `;

  const video = overlay.querySelector(".intro-video");
  const play = overlay.querySelector(".intro-play");
  const skip = overlay.querySelector(".intro-skip");
  const concluir = () => finalizarIntroAbertura(overlay);

  if (video) {
    Object.assign(video.style, {
      width: "100%",
      height: "100%",
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      objectPosition: "center",
      background: "#051c26"
    });
    video.load?.();
  }

  video?.addEventListener("ended", concluir, { once: true });
  video?.addEventListener("error", (erro) => {
    console.debug("Intro: video indisponivel, seguindo para o app.", erro);
    setTimeout(concluir, 1200);
  }, { once: true });
  video?.addEventListener("loadeddata", () => tentarReproduzirIntro(video, overlay), { once: true });
  play?.addEventListener("click", () => tentarReproduzirIntro(video, overlay));
  skip?.addEventListener("click", concluir);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => tentarReproduzirIntro(video, overlay));

  setTimeout(concluir, 14000);
}

function totalPedido(pedido) {
  return Number(pedido?.total ?? pedido?.valor ?? 0) || 0;
}

function clienteDoPedido(pedido) {
  return pedido?.cliente || pedido?.nome || "Sem cliente";
}

function telefoneDoPedido(pedido) {
  return String(pedido?.clienteTelefone || pedido?.telefoneCliente || pedido?.whatsappCliente || pedido?.phone || "").trim();
}

function normalizePhoneBR(phone = "") {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  if (!digits.startsWith("55") || (digits.length !== 12 && digits.length !== 13)) {
    return "";
  }
  return "+" + digits;
}

function normalizarTelefoneWhatsapp(numero = "") {
  return normalizePhoneBR(numero).replace(/^\+/, "");
}

async function obterTelefoneWhatsappPedido(pedido = null) {
  const campo = document.getElementById("clienteTelefone");
  const atual = campo?.value || clienteTelefonePedido || telefoneDoPedido(pedido);
  let numero = normalizarTelefoneWhatsapp(atual);
  if (!numero) {
    const digitado = await solicitarEntradaTexto({
      titulo: "WhatsApp do cliente",
      mensagem: "Informe o número com DDD ou DDI.",
      valor: "",
      tipo: "tel"
    });
    numero = normalizarTelefoneWhatsapp(digitado);
  }
  if (numero && campo) {
    campo.value = numero;
    clienteTelefonePedido = numero;
  }
  return numero;
}

function inferirTipoMaterial(nome = "") {
  const texto = removerAcentos(nome).toUpperCase();
  if (texto.includes("RESINA")) return "RESINA";
  if (texto.includes("PETG")) return "PETG";
  if (texto.includes("TPU")) return "TPU";
  return "PLA";
}

function normalizarMaterialEstoque(material = {}) {
  const tipo = material.tipo || inferirTipoMaterial(material.nome);
  const cor = String(material.cor || "").trim();
  const nomeBase = String(material.nome || [tipo, cor].filter(Boolean).join(" ") || tipo).trim();
  return {
    ...material,
    id: material.id || "mat-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    nome: nomeBase,
    tipo,
    cor,
    qtd: Math.max(0, Number(material.qtd) || 0),
    unidade: material.unidade || "kg"
  };
}

function normalizarEstoque() {
  let mudou = false;
  estoque = (Array.isArray(estoque) ? estoque : []).map((material) => {
    const normalizado = normalizarMaterialEstoque(material);
    if (!material.id || !material.tipo || material.qtd !== normalizado.qtd) mudou = true;
    return normalizado;
  });
  if (mudou) salvarDados();
  return estoque;
}

function getMaterialEstoque(materialId) {
  return normalizarEstoque().find((material) => String(material.id) === String(materialId)) || null;
}

function getMateriaisItem(item = {}) {
  if (Array.isArray(item.materiais) && item.materiais.length) {
    return item.materiais
      .map((material) => ({
        materialId: material.materialId || material.id || "",
        nome: material.nome || getMaterialEstoque(material.materialId || material.id)?.nome || "",
        gramas: Math.max(0, Number(material.gramas) || 0)
      }))
      .filter((material) => material.materialId && material.gramas > 0);
  }

  const materialId = item.materialId || "";
  const gramas = Math.max(0, Number(item.materialGramsTotal ?? item.materialGrams) || 0);
  return materialId && gramas > 0 ? [{ materialId, nome: getMaterialEstoque(materialId)?.nome || "", gramas }] : [];
}

function normalizarItemPedido(item = {}) {
  const qtd = Math.max(1, Number(item.qtd) || 1);
  const valor = Math.max(0, Number(item.valor ?? item.precoVenda) || 0);
  const materiais = getMateriaisItem(item);
  return {
    ...item,
    id: item.id || "item-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    nome: String(item.nome || "Produto 3D").trim(),
    tipoImpressao: item.tipoImpressao === "RESINA" ? "RESINA" : "FDM",
    material: item.material || "",
    materiais,
    qtd,
    tempoHoras: Math.max(0, Number(item.tempoHoras ?? item.tempo) || 0),
    valor,
    total: Math.max(0, Number(item.total) || valor * qtd),
    custoMaterial: Math.max(0, Number(item.custoMaterial) || 0),
    custoEnergia: Math.max(0, Number(item.custoEnergia) || 0),
    custoTotal: Math.max(0, Number(item.custoTotal ?? item.custo) || 0)
  };
}

function normalizarItensPedido(pedidoOuItens = itensPedido) {
  const itens = Array.isArray(pedidoOuItens) ? pedidoOuItens : Array.isArray(pedidoOuItens?.itens) ? pedidoOuItens.itens : [];
  return itens.map(normalizarItemPedido);
}

function calcularConsumoMateriais(itens = []) {
  const consumo = new Map();
  normalizarItensPedido(itens).forEach((item) => {
    getMateriaisItem(item).forEach((material) => {
      const kg = material.gramas / 1000;
      consumo.set(material.materialId, (consumo.get(material.materialId) || 0) + kg);
    });
  });
  return consumo;
}

function descricaoCaixa(movimento) {
  return movimento?.descricao || movimento?.desc || "Movimento";
}

function calcularSaldo() {
  return caixa.reduce((saldo, movimento) => {
    const valor = Number(movimento.valor) || 0;
    return movimento.tipo === "saida" ? saldo - valor : saldo + valor;
  }, 0);
}

function calcularTotaisCaixa() {
  return caixa.reduce((totais, movimento) => {
    const valor = Number(movimento.valor) || 0;
    if (movimento.tipo === "saida") {
      totais.saidas += valor;
    } else {
      totais.entradas += valor;
    }
    totais.saldo = totais.entradas - totais.saidas;
    return totais;
  }, { entradas: 0, saidas: 0, saldo: 0 });
}

// Regra central de planos/permissões: somente active_plan libera acesso; pending nunca ativa plano.
function getTimestampPlano(valor) {
  const timestamp = Date.parse(valor || 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRemainingDays(expiresAt, now = Date.now()) {
  const fim = getTimestampPlano(expiresAt);
  if (!fim) return 0;
  return Math.max(0, Math.ceil((fim - now) / (24 * 60 * 60 * 1000)));
}

function calcularFimTrial(inicio, dias = billingConfig.trialDays) {
  const dataInicio = getTimestampPlano(inicio);
  if (!dataInicio) return "";
  return new Date(dataInicio + Math.max(1, Number(dias) || 7) * 24 * 60 * 60 * 1000).toISOString();
}

function normalizarStatusLicencaEfetiva(status = "FREE") {
  const valor = String(status || "FREE").toUpperCase().trim();
  const mapa = {
    ACTIVE: PLAN_ACCESS_STATES.ACTIVE,
    ATIVO: PLAN_ACCESS_STATES.ACTIVE,
    PAID: PLAN_ACCESS_STATES.ACTIVE,
    PAGO: PLAN_ACCESS_STATES.ACTIVE,
    TRIAL: PLAN_ACCESS_STATES.TRIAL,
    TESTE: PLAN_ACCESS_STATES.TRIAL,
    PENDING: PLAN_ACCESS_STATES.PENDING,
    PENDENTE: PLAN_ACCESS_STATES.PENDING,
    EXPIRED: PLAN_ACCESS_STATES.EXPIRED,
    VENCIDO: PLAN_ACCESS_STATES.EXPIRED,
    BLOCKED: PLAN_ACCESS_STATES.BLOCKED,
    BLOQUEADO: PLAN_ACCESS_STATES.BLOCKED,
    FREE: PLAN_ACCESS_STATES.FREE,
    GRATIS: PLAN_ACCESS_STATES.FREE,
    GRATUITO: PLAN_ACCESS_STATES.FREE
  };
  return mapa[valor] || PLAN_ACCESS_STATES.FREE;
}

function slugPlanoPorLicencaEfetiva(licenca = {}) {
  const status = normalizarStatusLicencaEfetiva(licenca.effective_status || licenca.effectiveStatus);
  const planCode = String(licenca.plan_code || licenca.planCode || "").toUpperCase().trim();
  if (status === PLAN_ACCESS_STATES.TRIAL) return "premium_trial";
  if (status === PLAN_ACCESS_STATES.ACTIVE || planCode === "PREMIUM") return status === PLAN_ACCESS_STATES.FREE ? "free" : "premium";
  return "free";
}

function statusLegadoPorLicencaEfetiva(status) {
  const normalizado = normalizarStatusLicencaEfetiva(status);
  if (normalizado === PLAN_ACCESS_STATES.TRIAL) return "trialing";
  if (normalizado === PLAN_ACCESS_STATES.ACTIVE) return "active";
  if (normalizado === PLAN_ACCESS_STATES.PENDING) return "pending";
  if (normalizado === PLAN_ACCESS_STATES.BLOCKED) return "blocked";
  if (normalizado === PLAN_ACCESS_STATES.EXPIRED) return "expired";
  return "active";
}

function getLicencaEfetivaSnapshotLocal() {
  const status = billingConfig.effectiveStatus || billingConfig.effective_status || "";
  if (!status) return null;
  const updatedAt = billingConfig.effectiveLicenseUpdatedAt || billingConfig.effectiveUpdatedAt || "";
  const stale = billingConfig.effectiveLicenseStale === true;
  return {
    userId: billingConfig.effectiveUserId || syncConfig.supabaseUserId || "",
    clientId: billingConfig.clientId || "",
    planCode: billingConfig.effectivePlanCode || "",
    effectiveStatus: normalizarStatusLicencaEfetiva(status),
    isPremium: billingConfig.effectiveIsPremium === true,
    isTrial: billingConfig.effectiveIsTrial === true,
    isPending: billingConfig.effectiveIsPending === true,
    isBlocked: billingConfig.effectiveIsBlocked === true,
    remainingTrialDays: Math.max(0, Number(billingConfig.effectiveRemainingTrialDays || 0) || 0),
    trialStartAt: billingConfig.trialStartedAt || "",
    trialEndAt: billingConfig.trialExpiresAt || "",
    trialConsumedAt: billingConfig.trialConsumedAt || "",
    premiumUntil: billingConfig.premiumUntil || billingConfig.planExpiresAt || "",
    blockedAt: billingConfig.blockedAt || "",
    blockedReason: billingConfig.blockedReason || "",
    source: stale ? "backend-rpc-cache-stale" : (billingConfig.effectiveLicenseSource || "backend-rpc"),
    updatedAt,
    stale
  };
}

function licencaEfetivaRemotaFresca() {
  const snapshot = getLicencaEfetivaSnapshotLocal();
  return !!snapshot && snapshot.stale !== true && ["backend-rpc", "backend-rpc-legacy", "subscriptions", "superadmin"].includes(String(snapshot.source || ""));
}

function montarSnapshotPlanoDeLicencaEfetiva(licenca = getLicencaEfetivaSnapshotLocal(), source = "backend-rpc") {
  if (!licenca) return null;
  const state = normalizarStatusLicencaEfetiva(licenca.effectiveStatus || licenca.effective_status);
  const activePlan = state === PLAN_ACCESS_STATES.TRIAL ? "premium_trial" : state === PLAN_ACCESS_STATES.ACTIVE ? "premium" : "free";
  const trialRemainingDays = Math.max(0, Number(licenca.remainingTrialDays || licenca.remaining_trial_days || 0) || 0);
  const planExpiresAt = licenca.premiumUntil || licenca.premium_until || licenca.expires_at || "";
  return {
    state,
    source: source || licenca.source || "backend-rpc",
    activePlan,
    pendingPlan: licenca.isPending || licenca.is_pending ? (activePlan === "free" ? "premium" : "") : "",
    paymentStatus: licenca.isPending || licenca.is_pending ? "pending" : "none",
    subscriptionStatus: state === PLAN_ACCESS_STATES.TRIAL ? "trialing" : state === PLAN_ACCESS_STATES.ACTIVE ? "active" : "free",
    statusPlano: statusLegadoPorLicencaEfetiva(state),
    pending: state === PLAN_ACCESS_STATES.PENDING || licenca.isPending === true || licenca.is_pending === true,
    pendingExpired: false,
    trialStartedAt: licenca.trialStartAt || licenca.trial_start_at || licenca.trial_started_at || "",
    trialExpiresAt: licenca.trialEndAt || licenca.trial_end_at || licenca.trial_expires_at || "",
    trialRemainingDays,
    planExpiresAt,
    planRemainingDays: planExpiresAt ? getRemainingDays(planExpiresAt) : 0,
    hasPremium: state === PLAN_ACCESS_STATES.TRIAL || state === PLAN_ACCESS_STATES.ACTIVE,
    isTrialActive: state === PLAN_ACCESS_STATES.TRIAL,
    isPaidActive: state === PLAN_ACCESS_STATES.ACTIVE,
    adsAllowed: state === PLAN_ACCESS_STATES.FREE || state === PLAN_ACCESS_STATES.PENDING,
    blockLevel: state === PLAN_ACCESS_STATES.BLOCKED ? "total" : "none",
    stale: licenca.stale === true
  };
}

function primeiroValorPlano(...valores) {
  for (const valor of valores) {
    if (valor === null || valor === undefined) continue;
    const texto = String(valor).trim();
    if (texto) return valor;
  }
  return "";
}

function getTrialSnapshotPlano(source = {}, now = Date.now()) {
  const startedAt = primeiroValorPlano(source.trialStartedAt, source.trial_started_at, source.trialStartAt, source.trial_start_at);
  const expiresAt = primeiroValorPlano(
    source.trialExpiresAt,
    source.trial_expires_at,
    source.trialEndAt,
    source.trial_end_at,
    startedAt ? calcularFimTrial(startedAt, source.trialDays || source.trial_days || billingConfig.trialDays || DEFAULT_TRIAL_DAYS) : ""
  );
  const expiresMs = getTimestampPlano(expiresAt);
  return {
    startedAt: startedAt || "",
    expiresAt: expiresAt || "",
    expiresMs,
    remainingDays: expiresMs ? getRemainingDays(expiresAt, now) : 0,
    active: !!expiresMs && expiresMs > now
  };
}

function resolverEstadoPlano(user = getUsuarioAtual(), options = {}) {
  const now = Number(options.now || Date.now());
  const assinatura = options.subscription === undefined
    ? getAssinaturaSaas(user?.clientId || billingConfig.clientId || "")
    : options.subscription;
  const cliente = options.client === undefined ? getClienteSaasAtual() : options.client;
  const source = options.source || (assinatura ? "supabase/local-subscription" : "local-cache");

  if (isSuperAdmin(user)) {
    const snapshotSuper = {
      state: PLAN_ACCESS_STATES.ACTIVE,
      source,
      activePlan: "premium",
      pendingPlan: "",
      paymentStatus: "none",
      subscriptionStatus: "active",
      statusPlano: "active",
      pending: false,
      pendingExpired: false,
      trialStartedAt: "",
      trialExpiresAt: "",
      trialRemainingDays: 0,
      planExpiresAt: "",
      planRemainingDays: 9999,
      hasPremium: true,
      isTrialActive: false,
      isPaidActive: true,
      adsAllowed: false,
      blockLevel: "none"
    };
    logEstadoPlanoDebug(snapshotSuper);
    return snapshotSuper;
  }

  if (options.ignoreEffectiveLicense !== true) {
    const licencaEfetiva = getLicencaEfetivaSnapshotLocal();
    const clientIdUsuario = String(user?.clientId || billingConfig.clientId || "");
    const clientIdLicenca = String(licencaEfetiva?.clientId || "");
    if (licencaEfetiva && (!clientIdUsuario || !clientIdLicenca || clientIdUsuario === clientIdLicenca)) {
      const snapshotEfetivo = montarSnapshotPlanoDeLicencaEfetiva(licencaEfetiva, licencaEfetiva.source || source);
      if (snapshotEfetivo) {
        logEstadoPlanoDebug(snapshotEfetivo);
        return snapshotEfetivo;
      }
    }
  }

  const activePlan = normalizarSlugPlano(primeiroValorPlano(
    assinatura?.activePlan,
    assinatura?.active_plan,
    cliente?.activePlan,
    cliente?.active_plan,
    billingConfig.activePlan,
    user?.activePlan,
    user?.active_plan,
    assinatura?.planSlug,
    assinatura?.plan_slug,
    assinatura?.planId,
    assinatura?.plan_id,
    cliente?.planoAtual,
    cliente?.plano_atual,
    billingConfig.planSlug,
    user?.planSlug,
    user?.plan_slug,
    user?.planoAtual,
    "free"
  ));
  const pendingPlan = normalizarSlugPlano(primeiroValorPlano(
    assinatura?.pendingPlan,
    assinatura?.pending_plan,
    cliente?.pendingPlan,
    cliente?.pending_plan,
    billingConfig.pendingPlan,
    user?.pendingPlan,
    user?.pending_plan,
    ""
  ));
  const paymentStatus = normalizarStatusPagamento(primeiroValorPlano(
    assinatura?.paymentStatus,
    assinatura?.payment_status,
    cliente?.paymentStatus,
    cliente?.payment_status,
    billingConfig.paymentStatus,
    user?.paymentStatus,
    user?.payment_status,
    "none"
  ));
  const subscriptionStatus = normalizarStatusAssinaturaDefinitivo(primeiroValorPlano(
    assinatura?.subscriptionStatus,
    assinatura?.subscription_status,
    cliente?.subscriptionStatus,
    cliente?.subscription_status,
    billingConfig.subscriptionStatus,
    user?.subscriptionStatus,
    user?.subscription_status,
    activePlan === "premium_trial" ? "trialing" : activePlan === "premium" ? "active" : "free"
  ));
  const statusPlanoBruto = primeiroValorPlano(
    assinatura?.status,
    assinatura?.statusAssinatura,
    assinatura?.status_assinatura,
    cliente?.statusAssinatura,
    cliente?.status_assinatura,
    billingConfig.licenseStatus,
    user?.planStatus,
    activePlan === "premium_trial" ? "trialing" : activePlan === "premium" ? "active" : "active"
  );
  const statusPlano = ["free", "gratis", "grátis"].includes(String(statusPlanoBruto || "").toLowerCase().trim())
    ? "active"
    : normalizarStatusPlano(statusPlanoBruto);
  const trial = getTrialSnapshotPlano({
    trialStartedAt: primeiroValorPlano(assinatura?.trialStartedAt, assinatura?.trial_started_at, cliente?.trialStartedAt, cliente?.trial_started_at, billingConfig.trialStartedAt, user?.trialStartedAt, user?.trial_started_at),
    trialExpiresAt: primeiroValorPlano(assinatura?.trialExpiresAt, assinatura?.trial_expires_at, cliente?.trialExpiresAt, cliente?.trial_expires_at, billingConfig.trialExpiresAt, user?.trialExpiresAt, user?.trial_expires_at),
    trialDays: primeiroValorPlano(assinatura?.trialDays, assinatura?.trial_days, cliente?.trialDays, cliente?.trial_days, billingConfig.trialDays, user?.trialDays, user?.trial_days, DEFAULT_TRIAL_DAYS)
  }, now);
  const planExpiresAt = primeiroValorPlano(
    assinatura?.planExpiresAt,
    assinatura?.plan_expires_at,
    assinatura?.currentPeriodEnd,
    assinatura?.current_period_end,
    assinatura?.expiresAt,
    assinatura?.expires_at,
    assinatura?.nextBillingAt,
    assinatura?.next_billing_at,
    cliente?.planExpiresAt,
    cliente?.plan_expires_at,
    billingConfig.planExpiresAt,
    billingConfig.paidUntil,
    user?.planExpiresAt,
    user?.plan_expires_at
  );
  const planExpiresMs = getTimestampPlano(planExpiresAt);
  const planExpired = !!planExpiresMs && planExpiresMs <= now;
  const pendingStartedAt = primeiroValorPlano(assinatura?.pendingStartedAt, assinatura?.pending_started_at, billingConfig.pendingStartedAt, cliente?.pendingStartedAt, cliente?.pending_started_at);
  const pendingExpired = paymentStatus === "pending" && pendingStartedAt && (now - getTimestampPlano(pendingStartedAt) > 24 * 60 * 60 * 1000);
  const pending = !pendingExpired && (paymentStatus === "pending" || (!!pendingPlan && pendingPlan !== "free") || statusPlano === "pending");
  const blocked = usuarioEstaBloqueado(user) || (paymentStatus !== "pending" && (billingConfig.licenseStatus === "blocked" || billingConfig.licenseBlockLevel === "total" || billingConfig.blocked));
  const paidActive = activePlan === "premium"
    && !planExpired
    && (subscriptionStatus === "active" || statusPlano === "active" || paymentStatus === "approved");
  const trialActive = trial.active && (
    activePlan === "premium_trial"
    || billingConfig.isTrialActive === true
    || assinatura?.isTrialActive === true
    || cliente?.isTrialActive === true
  );

  let state = PLAN_ACCESS_STATES.FREE;
  if (blocked) {
    state = PLAN_ACCESS_STATES.BLOCKED;
  } else if (paidActive) {
    state = PLAN_ACCESS_STATES.ACTIVE;
  } else if (trialActive) {
    state = PLAN_ACCESS_STATES.TRIAL;
  } else if (pending) {
    state = PLAN_ACCESS_STATES.PENDING;
  } else if (
    ["past_due", "cancelled", "expired"].includes(subscriptionStatus)
    || ["past_due", "cancelled", "expired"].includes(statusPlano)
    || (activePlan === "premium_trial" && !!trial.expiresMs && !trial.active)
    || (activePlan === "premium" && planExpired)
  ) {
    state = PLAN_ACCESS_STATES.EXPIRED;
  }

  const planoEfetivoUnico = state === PLAN_ACCESS_STATES.TRIAL
    ? "premium_trial"
    : state === PLAN_ACCESS_STATES.ACTIVE
      ? "premium"
      : "free";
  const snapshot = {
    state,
    source,
    activePlan: planoEfetivoUnico,
    pendingPlan: pendingPlan === "free" ? "" : pendingPlan,
    paymentStatus,
    subscriptionStatus,
    statusPlano,
    pending,
    pendingExpired: !!pendingExpired,
    trialStartedAt: trial.startedAt,
    trialExpiresAt: trial.expiresAt,
    trialRemainingDays: trial.remainingDays,
    planExpiresAt: planExpiresAt || "",
    planRemainingDays: planExpiresAt ? getRemainingDays(planExpiresAt, now) : 0,
    hasPremium: [PLAN_ACCESS_STATES.TRIAL, PLAN_ACCESS_STATES.ACTIVE].includes(state),
    isTrialActive: state === PLAN_ACCESS_STATES.TRIAL,
    isPaidActive: state === PLAN_ACCESS_STATES.ACTIVE,
    adsAllowed: [PLAN_ACCESS_STATES.FREE, PLAN_ACCESS_STATES.PENDING].includes(state) && activePlan === "free",
    blockLevel: state === PLAN_ACCESS_STATES.BLOCKED ? "total" : "none"
  };
  logEstadoPlanoDebug(snapshot);
  return snapshot;
}

function logEstadoPlanoDebug(snapshot = {}) {
  if (!PLAN_DEBUG_ENABLED || typeof console === "undefined") return;
  const holder = typeof window !== "undefined" ? window : globalThis;
  const chave = [
    snapshot.state,
    snapshot.activePlan,
    snapshot.pendingPlan,
    snapshot.paymentStatus,
    snapshot.subscriptionStatus,
    snapshot.trialExpiresAt,
    snapshot.planExpiresAt,
    snapshot.source
  ].join("|");
  if (holder.__simplificaLastPlanDebug === chave) return;
  holder.__simplificaLastPlanDebug = chave;
  console.info("[Simplifica3D][PlanState]", {
    state: snapshot.state,
    source: snapshot.source,
    active_plan: snapshot.activePlan,
    pending_plan: snapshot.pendingPlan || "",
    payment_status: snapshot.paymentStatus,
    subscription_status: snapshot.subscriptionStatus,
    trial_start_at: snapshot.trialStartedAt || "",
    trial_end_at: snapshot.trialExpiresAt || "",
    remaining_days: snapshot.trialRemainingDays || snapshot.planRemainingDays || 0,
    pending: snapshot.pending === true,
    active: snapshot.hasPremium === true
  });
}

function usuarioEstaBloqueado(user = getUsuarioAtual()) {
  const status = String(user?.planStatus || "").toLowerCase();
  return !!user?.bloqueado || user?.ativo === false || status === "blocked" || status === "bloqueado";
}

function licencaEfetivaBloqueada(user = getUsuarioAtual()) {
  if (isSuperAdmin(user)) return false;
  return usuarioEstaBloqueado(user)
    || billingConfig.effectiveIsBlocked === true
    || billingConfig.effectiveStatus === PLAN_ACCESS_STATES.BLOCKED
    || billingConfig.licenseStatus === "blocked"
    || billingConfig.licenseBlockLevel === "total"
    || billingConfig.blocked === true;
}

function planoGlobalBloqueado() {
  if (billingConfig.paymentStatus === "pending") return false;
  if (normalizarSlugPlano(billingConfig.activePlan || billingConfig.planSlug) === "free") return false;
  return billingConfig.licenseStatus === "blocked" || billingConfig.licenseBlockLevel === "total" || billingConfig.blocked;
}

function isTrialActive(user = getUsuarioAtual()) {
  return resolverEstadoPlano(user, { source: "isTrialActive" }).isTrialActive;
}

function hasPremiumAccess(subscription = getAssinaturaSaas()) {
  if (!subscription) return false;
  return resolverEstadoPlano(getUsuarioAtual(), { subscription, source: "hasPremiumAccess" }).hasPremium;
}

function hasActivePlan(user = getUsuarioAtual()) {
  if (isSuperAdmin(user)) return true;
  return resolverEstadoPlano(user, { source: "hasActivePlan" }).hasPremium;
}

function canUsePremiumFeatures(user = getUsuarioAtual()) {
  if (!hasActivePlan(user)) return false;
  if (isSuperAdmin(user)) return true;
  return dispositivoDentroDoLimite(user?.email || getEmailLicencaAtual());
}

function getPlanoAtual(user = getUsuarioAtual()) {
  if (isSuperAdmin(user)) {
    return {
      nome: "Super Admin",
      status: "superadmin",
      slug: "premium",
      completo: true,
      diasRestantes: 9999,
      descricao: "PRO interno"
    };
  }

  const estadoPlano = resolverEstadoPlano(user, { source: "getPlanoAtual" });
  if (estadoPlano.state === PLAN_ACCESS_STATES.BLOCKED) {
    return {
      nome: "Bloqueado",
      status: "bloqueado",
      slug: estadoPlano.activePlan || "free",
      completo: false,
      diasRestantes: 0,
      descricao: "Acesso bloqueado pelo administrador"
    };
  }

  const planoSaas = getPlanoSaas(estadoPlano.activePlan || "free");
  const descricoes = {
    [PLAN_ACCESS_STATES.TRIAL]: `${estadoPlano.trialRemainingDays || DEFAULT_TRIAL_DAYS} dia(s) restantes no teste grátis`,
    [PLAN_ACCESS_STATES.ACTIVE]: estadoPlano.planRemainingDays ? `${estadoPlano.planRemainingDays} dia(s) restantes no plano pago` : "Assinatura paga ativa",
    [PLAN_ACCESS_STATES.PENDING]: "Pagamento pendente. Seu plano atual continua funcionando e o pending não bloqueia o app.",
    [PLAN_ACCESS_STATES.EXPIRED]: "Plano vencido. O app voltou para o Free com anúncios.",
    [PLAN_ACCESS_STATES.FREE]: "Plano Free com anúncios"
  };
  const nomes = {
    [PLAN_ACCESS_STATES.TRIAL]: "Teste PRO",
    [PLAN_ACCESS_STATES.ACTIVE]: "PRO",
    [PLAN_ACCESS_STATES.PENDING]: "Pendente",
    [PLAN_ACCESS_STATES.EXPIRED]: "Expirado",
    [PLAN_ACCESS_STATES.FREE]: "Free"
  };
  const statusUi = {
    [PLAN_ACCESS_STATES.TRIAL]: "trial",
    [PLAN_ACCESS_STATES.ACTIVE]: "pago",
    [PLAN_ACCESS_STATES.PENDING]: "pendente",
    [PLAN_ACCESS_STATES.EXPIRED]: "expirado",
    [PLAN_ACCESS_STATES.FREE]: "gratis"
  };
  return {
    nome: nomes[estadoPlano.state] || "Free",
    status: statusUi[estadoPlano.state] || "gratis",
    slug: planoSaas.slug,
    completo: estadoPlano.hasPremium,
    blockLevel: estadoPlano.blockLevel,
    diasRestantes: estadoPlano.state === PLAN_ACCESS_STATES.TRIAL
      ? estadoPlano.trialRemainingDays
      : estadoPlano.state === PLAN_ACCESS_STATES.ACTIVE
        ? (estadoPlano.planRemainingDays || 9999)
        : 0,
    descricao: descricoes[estadoPlano.state] || "Plano Free com anúncios",
    plano: planoSaas,
    state: estadoPlano.state,
    pending: estadoPlano.pending,
    source: estadoPlano.source
  };
}

function temAcessoCompleto() {
  return canUsePremiumFeatures();
}

function temPlanoProPagoAtivo(user = getUsuarioAtual()) {
  if (!user || licencaEfetivaBloqueada(user)) return false;

  const licenca = getLicencaEfetivaSnapshotLocal();
  if (licenca && licenca.stale !== true) {
    const status = normalizarStatusLicencaEfetiva(licenca.effectiveStatus || licenca.effective_status);
    const planCode = String(licenca.planCode || licenca.plan_code || "").toUpperCase().trim();
    const planoPro = !planCode || ["PREMIUM", "PRO"].includes(planCode);
    return status === PLAN_ACCESS_STATES.ACTIVE
      && planoPro
      && licenca.isTrial !== true
      && licenca.isBlocked !== true;
  }

  // IA offline e um beneficio pago: Superadmin, Trial e Free nao entram por atalho local.
  if (isSuperAdmin(user)) return false;

  const estadoPlano = resolverEstadoPlano(user, { source: "temPlanoProPagoAtivo", ignoreEffectiveLicense: true });
  return estadoPlano.state === PLAN_ACCESS_STATES.ACTIVE
    && estadoPlano.isPaidActive === true
    && estadoPlano.isTrialActive !== true
    && normalizarSlugPlano(estadoPlano.activePlan || "") === "premium";
}

function exigirPlanoCompleto() {
  return PlanService.exigirPlanoCompleto();
}

function permitirAcaoPlanoCompleto() {
  const resultado = exigirPlanoCompleto();
  if (resultado.allowed) return true;
  mostrarBloqueioPlano(resultado);
  return false;
}

function permitirAcaoBasicaFree(mensagem = "Seu acesso está bloqueado. Regularize o plano para continuar.") {
  const plano = getPlanoAtual();
  if (plano.blockLevel === "total" || plano.status === "bloqueado") {
    mostrarBloqueioPlano({ message: mensagem });
    return false;
  }
  return true;
}

function permitirVisualizacaoOperacionalBasica() {
  const plano = getPlanoAtual();
  return !(plano.blockLevel === "total" || plano.status === "bloqueado");
}

function mostrarBloqueioPlano(resultado) {
  const mensagem = resultado?.message || "Recurso premium. O trial ativo e o plano pago liberam esta função.";
  if (resultado?.reason === "DEVICE_LIMIT") {
    alert(mensagem);
  } else {
    mostrarModalLimitePlano(mensagem);
  }
  trocarTela("assinatura");
}

function mostrarModalLimitePlano(mensagem = "Você atingiu o limite do seu plano. Faça upgrade para continuar.") {
  const popup = document.getElementById("popup");
  if (!popup) {
    alert(mensagem);
    return;
  }
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="plan-modal-close">
      <div class="modal-card limit-modal">
        <div class="modal-header">
          <h2>Você atingiu o limite do seu plano</h2>
          <button class="icon-button" type="button" data-action="plan-modal-close" title="Fechar">✕</button>
        </div>
        <p class="muted">${escaparHtml(mensagem)}</p>
        <div class="actions">
          <button class="btn secondary" type="button" data-action="plan-upgrade">Ver planos</button>
          <button class="btn" type="button" data-action="plan-upgrade">Fazer upgrade</button>
        </div>
      </div>
    </div>
  `;
  registrarAuditoria("tentativa", { motivo: "limite_plano", mensagem });
}

function getDocumentoLegal(tipo = "termos") {
  const nomeApp = appConfig.appName || SYSTEM_NAME;
  const data = "04/05/2026";
  if (tipo === "privacidade") {
    return {
      titulo: "Política de Privacidade",
      subtitulo: `${nomeApp} respeita a privacidade dos usuários e se compromete a proteger seus dados pessoais.`,
      secoes: [
        {
          titulo: "1. Informações gerais",
          itens: [
            "Esta Política explica como coletamos, usamos e protegemos suas informações ao utilizar o aplicativo.",
            "O uso do aplicativo indica ciência desta Política e das práticas de tratamento de dados aqui descritas."
          ]
        },
        {
          titulo: "2. Informações coletadas",
          itens: [
            "Dados fornecidos pelo usuário: nome, e-mail e informações inseridas no app, como pedidos, cálculos e dados operacionais.",
            "Dados coletados automaticamente: informações do dispositivo, identificadores do dispositivo ou publicidade, dados de uso do app e endereço IP aproximado."
          ]
        },
        {
          titulo: "3. Uso das informações",
          itens: [
            "Utilizamos os dados para funcionamento do aplicativo, melhoria da experiência, suporte ao usuário, personalização de funcionalidades e exibição de anúncios."
          ]
        },
        {
          titulo: "4. Anúncios",
          itens: [
            "O app utiliza o serviço Google AdMob, que pode coletar dados para exibir anúncios relevantes.",
            "Esses dados podem incluir identificadores do dispositivo, comportamento de uso e localização aproximada.",
            "O Google pode utilizar cookies e tecnologias similares.",
            "Para mais informações, acesse: https://policies.google.com/technologies/ads"
          ]
        },
        {
          titulo: "5. Compartilhamento de dados",
          itens: [
            "Seus dados podem ser compartilhados com serviços de terceiros, como Google AdMob, e provedores de infraestrutura, como hospedagem e banco de dados.",
            "Não vendemos seus dados pessoais."
          ]
        },
        {
          titulo: "6. Armazenamento e segurança",
          itens: [
            "Adotamos medidas para proteger seus dados, mas nenhum sistema é 100% seguro.",
            "O usuário também deve manter seus dados de acesso e seus dispositivos protegidos."
          ]
        },
        {
          titulo: "7. Direitos do usuário (LGPD)",
          itens: [
            "Você pode solicitar acesso aos seus dados, corrigir informações, solicitar exclusão e revogar consentimento, quando aplicável."
          ]
        },
        {
          titulo: "8. Retenção de dados",
          itens: [
            "Mantemos os dados apenas pelo tempo necessário para funcionamento do serviço, segurança, suporte e cumprimento de obrigações aplicáveis."
          ]
        },
        {
          titulo: "9. Alterações",
          itens: [
            "Esta política pode ser atualizada a qualquer momento."
          ]
        },
        {
          titulo: "10. Contato",
          itens: [
            `Para dúvidas: ${SUPPORT_EMAIL}`
          ]
        }
      ],
      rodape: `Última atualização: ${data}.`
    };
  }

  return {
    titulo: "Termos de Uso",
    subtitulo: `Ao utilizar o ${nomeApp}, você concorda com estes Termos.`,
    secoes: [
      {
        titulo: "1. Aceitação",
        itens: [
          "Ao utilizar o aplicativo, você concorda com estes Termos."
        ]
      },
      {
        titulo: "2. Uso do aplicativo",
        itens: [
          `${nomeApp} é uma ferramenta de apoio para cálculo e gestão de pedidos.`,
          "O usuário é responsável pelas decisões tomadas com base nas informações fornecidas pelo app."
        ]
      },
      {
        titulo: "3. Responsabilidade",
        itens: [
          "O aplicativo não garante precisão absoluta dos cálculos, ausência de erros ou resultados financeiros específicos.",
          "Recomendamos que o usuário revise cálculos, preços, prazos e documentos antes de tomar decisões comerciais."
        ]
      },
      {
        titulo: "4. Conta do usuário",
        itens: [
          "O usuário é responsável por manter seus dados seguros e por não compartilhar acesso indevidamente."
        ]
      },
      {
        titulo: "5. Plano pago",
        itens: [
          "O app pode oferecer funcionalidades pagas.",
          "Pagamentos seguem as regras da plataforma aplicável, como Google, App Store ou provedor de pagamento usado no aplicativo.",
          "Benefícios podem ser alterados."
        ]
      },
      {
        titulo: "6. Anúncios",
        itens: [
          "Usuários da versão gratuita podem visualizar anúncios.",
          "Usuários premium não terão anúncios."
        ]
      },
      {
        titulo: "7. Limitação de responsabilidade",
        itens: [
          `${nomeApp} não se responsabiliza por prejuízos financeiros, decisões comerciais ou uso incorreto do app.`
        ]
      },
      {
        titulo: "8. Suspensão",
        itens: [
          "Podemos suspender contas em caso de uso indevido."
        ]
      },
      {
        titulo: "9. Alterações",
        itens: [
          "Os termos podem ser atualizados a qualquer momento."
        ]
      },
      {
          titulo: "10. Contato",
          itens: [
          SUPPORT_EMAIL
          ]
      }
    ],
    rodape: `Última atualização: ${data}.`
  };
}

function abrirDocumentoLegal(tipo = "termos", evento) {
  if (evento) {
    evento.preventDefault();
    evento.stopPropagation();
  }

  const popup = document.getElementById("popup");
  const documento = getDocumentoLegal(tipo);
  if (!popup) {
    alert(`${documento.titulo}\n\n${documento.subtitulo}`);
    return;
  }

  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="legalModalTitle" onclick="fecharPopup()">
      <div class="modal-card legal-modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 id="legalModalTitle">${escaparHtml(documento.titulo)}</h2>
            <p class="muted">${escaparHtml(documento.subtitulo)}</p>
          </div>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="legal-content">
          ${documento.secoes.map((secao) => `
            <section class="legal-section">
              <h3>${escaparHtml(secao.titulo)}</h3>
              <ul>
                ${secao.itens.map((item) => `<li>${escaparHtml(item)}</li>`).join("")}
              </ul>
            </section>
          `).join("")}
          <p class="muted">${escaparHtml(documento.rodape)}</p>
        </div>
        <div class="actions legal-actions">
          <button class="btn secondary" type="button" onclick="fecharPopup()">Fechar</button>
          <button class="btn" type="button" onclick="aceitarTermosCadastro()">Aceitar e fechar</button>
        </div>
      </div>
    </div>
  `;
}

function aceitarTermosCadastro() {
  const aceite = document.getElementById("signupAceite");
  if (aceite) aceite.checked = true;
  fecharPopup();
}

async function verificarLimitePedidosAntesCriar() {
  if (getPlanoAtual().blockLevel === "partial") {
    mostrarModalLimitePlano("Seu pagamento está pendente. Regularize para evitar bloqueio.");
    return false;
  }
  if (!window.MonetizationLimits) return true;
  const usuario = getUsuarioMonetizacao();
  if (window.MonetizationLimits.canCreateOrder(usuario)) return true;
  registrarErroAplicacaoSilencioso("FREE_ORDER_LIMIT_BLOCKED", new Error("FREE_ORDER_LIMIT_BLOCKED"), "Limite de pedidos gratuito", {
    remaining: window.MonetizationLimits.getRemainingFreeOrders(usuario)
  });
  return mostrarModalDesbloqueioAnuncio({
    tipo: "orders",
    titulo: "Limite da versão gratuita",
    texto: "Você atingiu o limite de pedidos gratuitos. Assista a um anúncio para liberar novos pedidos por 30 minutos ou assine o plano para uso ilimitado."
  });
}

async function verificarPermissaoPdfAntesGerar() {
  const plano = getPlanoAtual();
  if (plano.blockLevel === "total" || plano.status === "bloqueado") {
    mostrarBloqueioPlano({ message: "Seu acesso está bloqueado. Regularize o plano para gerar PDF." });
    return false;
  }
  if (!window.MonetizationLimits) return permitirAcaoPlanoCompleto();
  const usuario = getUsuarioMonetizacao();
  if (window.MonetizationLimits.canExportPDF(usuario)) return true;
  registrarErroAplicacaoSilencioso("FREE_PDF_LIMIT_BLOCKED", new Error("FREE_PDF_LIMIT_BLOCKED"), "Limite de PDF gratuito", {
    remaining: window.MonetizationLimits.getRemainingFreePdfExports(usuario)
  });
  return mostrarModalDesbloqueioAnuncio({
    tipo: "pdf",
    titulo: "Exportação em PDF",
    texto: "Você já usou sua exportação gratuita de hoje. Assista a um anúncio para liberar uma exportação extra ou assine o plano para exportações ilimitadas."
  });
}

function verificarLimiteClientesAntesPedido(clienteNome = "") {
  const plano = getPlanoSaasAtual();
  if (!plano.maxClients) return true;
  const nome = String(clienteNome || "").trim().toLowerCase();
  const nomes = new Set();
  pedidos.forEach((pedido) => {
    const atual = clienteDoPedido(pedido).trim().toLowerCase();
    if (atual) nomes.add(atual);
  });
  if (!nome || nomes.has(nome) || nomes.size < plano.maxClients) return true;
  mostrarModalLimitePlano("Você atingiu o limite de clientes do seu plano. Faça upgrade para continuar.");
  return false;
}

function temAcessoNuvem() {
  return !!(getUsuarioAtual() || syncConfig.supabaseAccessToken || billingConfig.licenseEmail || billingConfig.clientId);
}

function exigirAcessoNuvem() {
  if (temAcessoNuvem()) return true;
  alert("Entre ou crie uma conta para sincronizar seus dados com segurança.");
  trocarTela("admin");
  return false;
}

function detectarPerfilTela() {
  const largura = window.innerWidth || 1024;
  if (largura < 420) return "phone-small";
  if (largura < 768) return "phone";
  if (largura < 1100) return "tablet";
  if (largura < 1500) return "desktop";
  return "wide";
}

function calcularEscalaInterface() {
  if (appConfig.screenFit === "manual") {
    return Math.min(1.4, Math.max(0.7, (Number(appConfig.uiScale) || 100) / 100));
  }

  const largura = window.innerWidth || 1024;
  if (largura < 360) return 0.82;
  if (largura < 420) return 0.88;
  if (largura < 768) return 1;
  if (largura < 1100) return 0.92;
  if (largura > 1700) return 1.05;
  return 1;
}

function detectarNivelMovimento() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return "low";
  const escolhido = String(appConfig.motionLevel || "medium").toLowerCase();
  if (["low", "medium", "high"].includes(escolhido)) return escolhido;
  return isMobile() ? "medium" : "high";
}

function aplicarPersonalizacao() {
  const root = document.documentElement;
  const temaClaro = appConfig.theme === "light";
  const temaAuto = appConfig.theme === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const usarClaro = temaClaro || temaAuto;
  const cor = appConfig.accentColor || "#073b4b";
  const escala = calcularEscalaInterface();
  const largura = window.innerWidth || 1024;
  const cardMinManual = Math.min(560, Math.max(220, Number(appConfig.desktopCardMinWidth) || 320));
  const cardMinAuto = largura < 900 ? 260 : largura < 1200 ? 280 : largura < 1500 ? 300 : 320;
  const cardMin = appConfig.screenFit === "manual" ? cardMinManual : cardMinAuto;
  const maxWidthManual = Math.min(3200, Math.max(900, Number(appConfig.desktopMaxWidth) || 1480));
  const maxWidthAuto = largura >= 1600
    ? Math.min(3200, Math.round(largura * 0.98))
    : largura >= 1200
      ? Math.round(largura * 0.96)
      : Math.max(900, largura - 24);
  const maxWidth = appConfig.screenFit === "manual" ? maxWidthManual : maxWidthAuto;
  const controlHeight = Math.max(30, Math.round(40 * escala));

  root.style.setProperty("--primary", cor);
  root.style.setProperty("--primary-2", cor);
  root.style.setProperty("--bg", usarClaro ? "#f4f6f8" : "#101114");
  root.style.setProperty("--panel", usarClaro ? "#ffffff" : "#1a1d22");
  root.style.setProperty("--panel-2", usarClaro ? "#edf1f5" : "#20252b");
  root.style.setProperty("--chrome", usarClaro ? "#ffffff" : "#08090b");
  root.style.setProperty("--line", usarClaro ? "#d8dee6" : "#2d333b");
  root.style.setProperty("--text", usarClaro ? "#111827" : "#f5f7fb");
  root.style.setProperty("--muted", usarClaro ? "#5f6b7a" : "#a9b1bd");
  root.style.setProperty("--input-bg", usarClaro ? "#ffffff" : "#111419");
  root.style.setProperty("--input-text", usarClaro ? "#111827" : "#f5f7fb");
  root.style.setProperty("--input-placeholder", usarClaro ? "#7a8797" : "#8f98a6");
  root.style.setProperty("--result-bg", usarClaro ? "#ffffff" : "#111419");
  root.style.setProperty("--ui-scale", escala.toFixed(2));
  root.style.setProperty("--base-font-size", `${Math.max(11, Math.round(15 * escala))}px`);
  root.style.setProperty("--font-xs", `${Math.max(8, Math.round(12 * escala))}px`);
  root.style.setProperty("--font-sm", `${Math.max(9, Math.round(13 * escala))}px`);
  root.style.setProperty("--font-md", `${Math.max(10, Math.round(15 * escala))}px`);
  root.style.setProperty("--font-lg", `${Math.max(11, Math.round(16 * escala))}px`);
  root.style.setProperty("--font-xl", `${Math.max(14, Math.round(20 * escala))}px`);
  root.style.setProperty("--control-height", `${controlHeight}px`);
  root.style.setProperty("--icon-button-size", `${controlHeight}px`);
  root.style.setProperty("--floating-button-size", `${Math.max(36, Math.round(48 * escala))}px`);
  root.style.setProperty("--menu-button-height", `${Math.max(42, Math.round(56 * escala))}px`);
  root.style.setProperty("--mobile-header-height", `${Math.max(46, Math.round(58 * escala))}px`);
  root.style.setProperty("--metric-min-height", `${Math.max(48, Math.round(68 * escala))}px`);
  root.style.setProperty("--summary-metric-min-height", `${Math.max(46, Math.round(64 * escala))}px`);
  root.style.setProperty("--quick-action-min-height", `${Math.max(52, Math.round(74 * escala))}px`);
  root.style.setProperty("--popup-nav-min-height", `${Math.max(52, Math.round(72 * escala))}px`);
  root.style.setProperty("--toolbar-button-size", `${Math.max(24, Math.round(30 * escala))}px`);
  root.style.setProperty("--card-padding", `${Math.max(7, Math.round(12 * escala))}px`);
  root.style.setProperty("--gap", `${Math.max(6, Math.round(12 * escala))}px`);
  root.style.setProperty("--radius", `${Math.max(6, Math.round(10 * escala))}px`);
  root.style.setProperty("--desktop-card-min", `${cardMin}px`);
  root.style.setProperty("--desktop-max-width", `${maxWidth}px`);
  root.style.setProperty("--desktop-sidebar-width", `${Math.round(230 * Math.min(1.05, Math.max(0.92, escala)))}px`);
  root.style.setProperty("--login-background-image", appConfig.loginBackgroundDataUrl ? `url("${String(appConfig.loginBackgroundDataUrl).replace(/"/g, "%22")}")` : "none");

  document.body.classList.toggle("compact-mode", !!appConfig.compactMode);
  document.body.dataset.screenFit = appConfig.screenFit || "auto";
  document.body.dataset.screenProfile = detectarPerfilTela();
  document.body.dataset.motion = detectarNivelMovimento();

  const nome = appConfig.appName || SYSTEM_NAME;
  document.title = nome;
  const titulo = document.getElementById("appTitleText") || document.getElementById("appTitle");
  if (titulo) {
    titulo.textContent = appConfig.showBrandInHeader ? nome : "ERP";
  }

  const logo = document.getElementById("appLogo");
  if (logo) {
    logo.src = getMarcaProjetoSrc("icon");
    logo.hidden = !appConfig.showBrandInHeader;
  }

  const themeMeta = document.querySelector("meta[name='theme-color']");
  if (themeMeta) {
    themeMeta.setAttribute("content", cor);
  }
}

function capturarScrollInterface() {
  if (typeof document === "undefined") return [];
  const snapshot = [];
  const registrar = (elemento, chave) => {
    if (!elemento) return;
    snapshot.push({
      chave,
      top: Number(elemento.scrollTop) || 0,
      left: Number(elemento.scrollLeft) || 0
    });
  };

  registrar(document.scrollingElement || document.documentElement, "__page");
  [
    ".mobile-home",
    ".mobile-panel-content",
    ".desktop-main",
    ".side-drawer",
    ".profile-premium-panel",
    ".popup-box",
    ".modal-card"
  ].forEach((seletor) => {
    document.querySelectorAll(seletor).forEach((elemento, index) => registrar(elemento, `${seletor}:${index}`));
  });

  return snapshot;
}

function restaurarScrollInterface(snapshot = []) {
  if (!Array.isArray(snapshot) || !snapshot.length || typeof document === "undefined") return;
  const obterElemento = (chave) => {
    if (chave === "__page") return document.scrollingElement || document.documentElement;
    const separador = chave.lastIndexOf(":");
    const seletor = chave.slice(0, separador);
    const index = Number(chave.slice(separador + 1)) || 0;
    return document.querySelectorAll(seletor)[index] || null;
  };
  const aplicar = () => {
    snapshot.forEach((item) => {
      const elemento = obterElemento(item.chave);
      if (!elemento) return;
      elemento.scrollTop = item.top;
      elemento.scrollLeft = item.left;
    });
  };
  requestAnimationFrame(() => {
    aplicar();
    requestAnimationFrame(aplicar);
  });
}

function renderizarPreservandoScroll() {
  const snapshot = capturarScrollInterface();
  renderApp();
  restaurarScrollInterface(snapshot);
}

function agendarRenderizacaoPreservandoScroll(atraso = 120) {
  if (window.__simplificaRenderPreserveTimer) clearTimeout(window.__simplificaRenderPreserveTimer);
  window.__simplificaRenderPreserveTimer = setTimeout(() => {
    window.__simplificaRenderPreserveTimer = null;
    renderizarPreservandoScroll();
  }, Math.max(0, Number(atraso) || 0));
}

function renderizarStatusSyncSeVisivel() {
  if (["backup", "config", "conta"].includes(telaAtual)) renderizarPreservandoScroll();
}

function trocarTela(tela) {
  if (!telas[tela]) {
    tela = "dashboard";
  }

  if (!canAccessScreen(tela)) {
    registrarSeguranca("Acesso negado", "erro", "Tela: " + tela);
    tela = "acessoNegado";
  }

  if (telaAtual !== tela) {
    telaAnterior = telaAtual;
  }

  telaAtual = tela;
  if (tela === "calculadora" && appConfig.calculatorWidget?.open) {
    appConfig.calculatorWidget.open = false;
    salvarDados();
  }
  renderApp();
}

function voltarTela() {
  const destino = telas[telaAnterior] ? telaAnterior : "dashboard";
  telaAtual = destino;
  telaAnterior = "dashboard";
  renderApp();
}

function voltarInicio() {
  telaAnterior = telaAtual;
  telaAtual = "dashboard";
  renderApp();
}

function atualizarMenu() {
  document.querySelectorAll(".menu-button, .side-nav-button, .popup-nav-button, .mobile-bottom-nav-button").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.tela === telaAtual);
  });
}

function renderApp() {
  const app = document.getElementById("app");
  if (!app) return;
  if (window.__simplificaLocalLockActive && getUsuarioAtual()) {
    aplicarPersonalizacao();
    app.innerHTML = renderTravaLocal();
    renderCalculadoraFlutuante();
    sincronizarBannerAdMob();
    sincronizarBannerAdSense();
    setTimeout(() => document.getElementById("localUnlockPassword")?.focus(), 80);
    return;
  }
  if (!getUsuarioAtual() && !adminLogado && !isTelaPublica(telaAtual)) {
    telaAtual = "admin";
  }
  if (telaAtual === "dashboard" && deveMostrarOnboarding()) {
    telaAtual = "onboarding";
  }

  aplicarPersonalizacao();
  const mobile = isMobile();
  document.body.classList.toggle("mobile-mode", mobile);
  document.body.classList.toggle("auth-screen-active", !getUsuarioAtual() && telaAtual === "admin");
  app.innerHTML = (mobile ? renderMobile() : renderDesktop()) + (podeMostrarControlesFlutuantes() ? renderAssistenteVirtual() : "");
  atualizarMenu();
  ajustarJanelasDashboardAoWorkspace(false);
  renderCalculadoraFlutuante();
  sincronizarBannerAdMob();
  sincronizarBannerAdSense();
  preencherImpressoras();
  preencherMateriaisCalculadora();
}

function podeMostrarControlesFlutuantes() {
  return !!getUsuarioAtual() && !window.__simplificaLocalLockActive && !isTelaPublica(telaAtual) && telaAtual !== "onboarding";
}

function renderDesktop() {
  if (!getUsuarioAtual() && telaAtual === "admin") {
    return `<main class="auth-desktop-main">${renderAdmin()}</main>`;
  }
  const classeMenu = appConfig.sidebarCollapsed ? " sidebar-collapsed" : "";
  return `
    <div class="desktop-shell${classeMenu}">
      ${renderMenuLateral()}
      <main class="desktop-main">
        ${renderDesktopConteudo()}
      </main>
    </div>
  `;
}

function renderDesktopConteudo() {
  if (!canAccessScreen(telaAtual)) {
    return `<div class="desktop-focus">${renderAcessoNegado()}</div>`;
  }

  if (getUsuarioAtual()?.mustChangePassword && telaAtual !== "seguranca") {
    return `<div class="desktop-focus">${renderTrocaSenhaObrigatoria()}</div>`;
  }

  const configuracoes = ["config", "backup", "personalizacao", "empresa", "preferencias", "mais", "conta", "assinatura", "minhaAssinatura", "planos", "admin", "usuarios", "seguranca", "superadmin", "privacy", "terms", "acessoNegado"];
  const atualizacaoAndroid = renderAtualizacaoAndroidDownload();

  if (configuracoes.includes(telaAtual)) {
    return `<div class="desktop-focus">${atualizacaoAndroid}${renderTela(telaAtual)}</div>`;
  }

  if (telaAtual !== "dashboard") {
    return `
      <div class="desktop-focus">${atualizacaoAndroid}${renderTela(telaAtual)}</div>
      <div class="desktop-side-preview">${renderDashboard()}</div>
    `;
  }

  return `${atualizacaoAndroid}${renderDashboard()}`;
}

function renderTopbar() {
  const usuario = getUsuarioAtual();
  const plano = getPlanoAtual(usuario);
  const nomeUsuario = usuario?.nome || (adminLogado ? "Admin local" : "Visitante");
  return `
    <section class="topbar">
      <div>
        <strong>${escaparHtml(appConfig.appName || SYSTEM_NAME)}</strong>
        <span class="muted">${escaparHtml(appConfig.businessName || "Gestão para impressão 3D")}</span>
      </div>
      <label class="topbar-search search-compact" onclick="expandirBuscaGlobal(this)">
        <button class="search-ai-button" type="button" onclick="event.stopPropagation(); abrirAssistente('basic')" title="Abrir assistente básico">${renderAssistantFabContent("IA", false)}</button>
        <input placeholder="Buscar pedidos, clientes ou perguntar ao assistente..." onkeydown="buscarGlobal(event, this.value)" onblur="recolherBuscaGlobal(this)">
      </label>
      <div class="topbar-user">
        <span class="status-badge ${classeStatusPlano(plano.status)}">${escaparHtml(plano.nome)}</span>
        <strong>${escaparHtml(nomeUsuario)}</strong>
      </div>
    </section>
  `;
}

function buscarGlobal(event, valor) {
  if (event.key !== "Enter") return;
  const valorOriginal = String(valor || "").trim();
  const termo = valorOriginal.toLowerCase();
  if (!termo) return;

  const pedido = pedidos.find((item) => clienteDoPedido(item).toLowerCase().includes(termo) || String(item.id).includes(termo));
  if (pedido) {
    visualizarPedido(pedido.id);
    return;
  }

  const material = normalizarEstoque().find((item) => item.nome.toLowerCase().includes(termo));
  if (material) {
    trocarTela("estoque");
    return;
  }

  if (deveDirecionarBuscaParaAssistente(valorOriginal)) {
    abrirAssistenteComPergunta(valorOriginal);
    return;
  }

  alert("Nada encontrado para: " + valor);
}

function expandirBuscaGlobal(elemento) {
  const label = elemento?.closest?.(".search-compact") || elemento;
  if (!label) return;
  label.classList.add("is-expanded");
  setTimeout(() => label.querySelector?.("input")?.focus(), 30);
}

function recolherBuscaGlobal(input) {
  const label = input?.closest?.(".search-compact");
  if (!label) return;
  setTimeout(() => {
    if (document.activeElement === input || String(input.value || "").trim()) return;
    label.classList.remove("is-expanded");
  }, 140);
}

function isTelaPublica(tela) {
  return ["calculadora", "admin", "assinatura", "minhaAssinatura", "planos", "sobre", "privacy", "terms", "acessoNegado"].includes(tela);
}

function canAccessScreen(tela, usuario = getUsuarioAtual()) {
  if (isTelaPublica(tela)) return true;
  if (adminLogado && !usuario) return tela !== "superadmin";
  if (!usuario) return false;
  if (tela === "onboarding") return !isSuperAdmin(usuario);
  if (isSuperAdmin(usuario)) return true;
  if (licencaEfetivaBloqueada(usuario)) return false;

  const permissoes = {
    admin: ["dashboard", "pedido", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "config", "empresa", "preferencias", "personalizacao", "mais", "conta", "usuarios", "seguranca", "feedback", "onboarding"],
    user: ["dashboard", "pedido", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "mais", "conta", "seguranca", "feedback", "onboarding"],
    operador: ["dashboard", "pedido", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "mais", "conta", "seguranca", "feedback", "onboarding"],
    visualizador: ["dashboard", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "mais", "conta", "seguranca", "feedback", "onboarding"]
  };

  return (permissoes[usuario.papel] || []).includes(tela);
}

function renderAcessoNegado() {
  return `
    <section class="card">
      <div class="card-header">
        <h2>🔒 Acesso negado</h2>
        <span class="status-badge badge-danger">Restrito</span>
      </div>
      <p class="muted">Você precisa entrar com uma conta autorizada ou seu perfil não tem permissão para esta área.</p>
      <div class="actions">
        <button class="btn" onclick="trocarTela('admin')">Entrar</button>
        <button class="btn secondary" onclick="trocarTela('calculadora')">Abrir calculadora grátis</button>
        <button class="btn ghost" onclick="voltarTela()">Voltar</button>
      </div>
    </section>
  `;
}

function getChaveOnboardingConcluido(usuario = getUsuarioAtual()) {
  const id = String(usuario?.supabaseUserId || syncConfig.supabaseUserId || usuario?.email || "").trim();
  return id ? `simplifica3d:onboarding_done:${id}` : "";
}

function onboardingConcluidoLocalmente(usuario = getUsuarioAtual()) {
  const chave = getChaveOnboardingConcluido(usuario);
  return !!chave && localStorage.getItem(chave) === "true";
}

function registrarOnboardingConcluidoLocalmente(usuario = getUsuarioAtual(), concluido = true) {
  const chave = getChaveOnboardingConcluido(usuario);
  if (!chave) return;
  if (concluido) localStorage.setItem(chave, "true");
  else localStorage.removeItem(chave);
}

function onboardingEstaConcluido(usuario = getUsuarioAtual()) {
  if (!usuario || isSuperAdmin(usuario)) return false;
  if (usuario.onboardingCompleted === true || onboardingConcluidoLocalmente(usuario)) return true;
  return appConfig.companySetupCompleted === true && etapaOnboardingAtual(usuario) >= 4;
}

function reconciliarOnboardingConcluido(usuario = getUsuarioAtual()) {
  if (!usuario || isSuperAdmin(usuario) || !onboardingEstaConcluido(usuario)) return false;
  usuario.onboardingCompleted = true;
  usuario.onboardingStep = 4;
  appConfig.companySetupCompleted = true;
  appConfig.onboardingFirstOrderPending = false;
  registrarOnboardingConcluidoLocalmente(usuario, true);
  return true;
}

function deveMostrarOnboarding(usuario = getUsuarioAtual()) {
  if (!usuario || isSuperAdmin(usuario)) return false;
  if (reconciliarOnboardingConcluido(usuario)) return false;
  return true;
}

function etapaOnboardingAtual(usuario = getUsuarioAtual()) {
  return Math.max(0, Math.min(4, Number(usuario?.onboardingStep) || 0));
}

function salvarOnboardingLocal(step, completed = false) {
  const usuario = getUsuarioAtual();
  if (!usuario) return;
  usuario.onboardingStep = Math.max(0, Math.min(4, Number(step) || 0));
  usuario.onboardingCompleted = completed === true;
  appConfig.companySetupCompleted = completed === true || appConfig.companySetupCompleted === true;
  appConfig.onboardingLastUpdatedAt = new Date().toISOString();
  if (completed === true) registrarOnboardingConcluidoLocalmente(usuario, true);
  salvarDados();
  persistirOnboardingSupabaseSilencioso(usuario).catch((erro) => {
    registrarDiagnostico("Onboarding", "Onboarding não sincronizado no Supabase", erro.message || erro);
  });
}

async function persistirOnboardingSupabaseSilencioso(usuario = getUsuarioAtual()) {
  if (!usuario || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !syncConfig.supabaseUrl) return false;
  const agora = new Date().toISOString();
  const userId = encodeURIComponent(syncConfig.supabaseUserId);
  const perfil = {
    onboarding_completed: usuario.onboardingCompleted === true,
    onboarding_step: etapaOnboardingAtual(usuario),
    updated_at: agora
  };
  const resultados = await Promise.allSettled([
    requisicaoSupabase(`/rest/v1/profiles?user_id=eq.${userId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(perfil)
    }),
    requisicaoSupabase(`/rest/v1/erp_profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(perfil)
    })
  ]);
  resultados.forEach((resultado, indice) => {
    if (resultado.status === "rejected") {
      registrarDiagnostico("Onboarding", indice === 0 ? "profiles onboarding não sincronizado" : "erp_profiles onboarding não sincronizado", resultado.reason?.message || resultado.reason);
    }
  });

  const companyId = usuario.companyId || billingConfig.companyId || "";
  if (companyId) {
    await requisicaoSupabase(`/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        setup_completed: usuario.onboardingCompleted === true || appConfig.companySetupCompleted === true,
        print_type: appConfig.defaultPrintType || null,
        default_material: appConfig.defaultMaterial || null,
        updated_at: agora
      })
    }).catch((erro) => registrarDiagnostico("Onboarding", "Empresa não atualizada no Supabase", erro.message || erro));
  }
  return true;
}

function avancarOnboarding(step) {
  salvarOnboardingLocal(step, false);
  renderApp();
}

function selecionarTipoImpressaoOnboarding(tipo) {
  const permitido = ONBOARDING_PRINT_TYPES.some((item) => item.id === tipo) ? tipo : "fdm";
  appConfig.defaultPrintType = permitido;
  appConfig.defaultPrinterType = permitido === "resina" ? "Resina" : "FDM";
  salvarOnboardingLocal(2, false);
  renderApp();
}

function selecionarMaterialOnboarding(material) {
  appConfig.defaultMaterial = String(material || "").trim();
  salvarOnboardingLocal(3, false);
  renderApp();
}

function pularMaterialOnboarding() {
  salvarOnboardingLocal(3, false);
  renderApp();
}

function abrirPrimeiroPedidoOnboarding() {
  appConfig.onboardingFirstOrderPending = true;
  salvarOnboardingLocal(4, false);
  trocarTela("pedido");
}

function finalizarOnboarding(abrirPedido = false) {
  appConfig.onboardingFirstOrderPending = false;
  salvarOnboardingLocal(4, true);
  mostrarToast("Pronto! Seu sistema está configurado.", "sucesso");
  trocarTela(abrirPedido ? "pedido" : "dashboard");
}

function reiniciarOnboarding() {
  const usuario = getUsuarioAtual();
  if (!usuario || isSuperAdmin(usuario)) {
    alert("Onboarding disponível apenas para contas de cliente.");
    return;
  }
  usuario.onboardingCompleted = false;
  usuario.onboardingStep = 0;
  appConfig.companySetupCompleted = false;
  registrarOnboardingConcluidoLocalmente(usuario, false);
  salvarDados();
  persistirOnboardingSupabaseSilencioso(usuario).catch((erro) => registrarDiagnostico("Onboarding", "Reset não sincronizado", erro.message || erro));
  trocarTela("onboarding");
}

function renderIndicadorOnboarding(step) {
  return `
    <div class="progress-steps" aria-label="Progresso da introdução">
      ${[0, 1, 2, 3, 4].map((item) => `<span class="${item <= step ? "active" : ""}"></span>`).join("")}
    </div>
    <p class="muted">Etapa ${step + 1} de 5</p>
  `;
}

function renderOnboarding() {
  const usuario = getUsuarioAtual();
  if (!usuario || isSuperAdmin(usuario)) return renderAcessoNegado();
  const step = etapaOnboardingAtual(usuario);
  const tipoAtual = appConfig.defaultPrintType || "";
  const materialAtual = appConfig.defaultMaterial || "";
  const botoesPular = `<button class="btn ghost" onclick="finalizarOnboarding(false)">Pular e ir para o painel</button>`;

  const telasOnboarding = [
    `
      <h2>Bem-vindo ao Simplifica 3D</h2>
      <p class="muted">Vamos configurar o básico para você começar em poucos minutos.</p>
      <div class="actions">
        <button class="btn" onclick="avancarOnboarding(1)">Começar</button>
        ${botoesPular}
      </div>
    `,
    `
      <h2>Tipo de uso</h2>
      <p class="muted">Você trabalha principalmente com qual tipo de impressão?</p>
      <div class="actions">
        ${ONBOARDING_PRINT_TYPES.map((tipo) => `<button class="btn ${tipoAtual === tipo.id ? "" : "secondary"}" onclick="selecionarTipoImpressaoOnboarding('${tipo.id}')">${escaparHtml(tipo.label)}</button>`).join("")}
      </div>
      <div class="actions">${botoesPular}</div>
    `,
    `
      <h2>Material padrão</h2>
      <p class="muted">Qual material você mais usa?</p>
      <div class="actions">
        ${ONBOARDING_MATERIALS.map((material) => `<button class="btn ${materialAtual === material ? "" : "secondary"}" onclick="selecionarMaterialOnboarding('${escaparAttr(material)}')">${escaparHtml(material)}</button>`).join("")}
      </div>
      <div class="actions">
        <button class="btn ghost" onclick="pularMaterialOnboarding()">Pular por agora</button>
        ${botoesPular}
      </div>
    `,
    `
      <h2>Primeiro pedido</h2>
      <p class="muted">Agora vamos criar seu primeiro pedido para você entender como o sistema funciona.</p>
      <div class="actions">
        <button class="btn" onclick="abrirPrimeiroPedidoOnboarding()">Criar primeiro pedido</button>
        <button class="btn secondary" onclick="avancarOnboarding(4)">Pular e ir para a finalização</button>
      </div>
    `,
    `
      <h2>Pronto! Seu sistema está configurado.</h2>
      <p class="muted">Você pode ir para o painel ou criar um novo pedido quando quiser.</p>
      <div class="actions">
        <button class="btn" onclick="finalizarOnboarding(false)">Ir para o painel</button>
        <button class="btn secondary" onclick="finalizarOnboarding(true)">Criar novo pedido</button>
      </div>
    `
  ];

  return `
    <section class="card onboarding-card">
      <div class="card-header">
        <h2>Introdução</h2>
        <span class="status-badge">Simplifica 3D</span>
      </div>
      ${renderIndicadorOnboarding(step)}
      ${telasOnboarding[step] || telasOnboarding[0]}
    </section>
  `;
}

function abrirAssistente(modo = "auto") {
  assistantOpen = true;
  assistantMinimized = false;
  assistantMode = modo === "pro" && iaLocalEstaPronta() ? "pro" : modo === "basic" ? "basic" : getAssistenteModoDisponivel();
  if (!assistantMessages.length) {
    assistantMessages.push({
      role: "assistant",
      text: assistantMode === "pro"
        ? "IA local instalada. Digite sua pergunta para iniciar o modelo neste aparelho."
        : "Olá! Sou o Assistente do Simplifica 3D. Posso ajudar com pedido, estoque, calculadora, backup, PDF, plano e login."
    });
  }
  if (assistantMode === "pro") {
    assistantRuntimeReady = false;
    assistantRuntimeDiagnostics = null;
    atualizarSuporteVozIASeNecessario();
  }
  renderApp();
}

function fecharAssistente() {
  assistantOpen = false;
  assistantMinimized = false;
  assistantRuntimeReady = false;
  assistantRuntimeDiagnostics = null;
  try { getAIPlugin()?.unloadAiModel?.(); } catch (_) {}
  renderApp();
}

function minimizarAssistente() {
  assistantMinimized = true;
  assistantRuntimeReady = false;
  assistantRuntimeDiagnostics = null;
  try { getAIPlugin()?.unloadAiModel?.(); } catch (_) {}
  renderApp();
}

function normalizarTextoAssistente(texto) {
  return removerAcentos(String(texto || "").toLowerCase());
}

function montarContextoAssistenteEnxuto(tarefa = "") {
  const pedidoAtual = pedidoEditando || (pedidoVisualizandoId ? pedidos.find((pedido) => String(pedido.id) === String(pedidoVisualizandoId)) : null);
  const materiaisBaixos = normalizarEstoque()
    .filter((material) => (Number(material.qtd) || 0) <= estoqueMinimoKg)
    .slice(0, ASSISTANT_MAX_CONTEXT_RESULTS)
    .map((material) => ({ nome: material.nome, qtd: material.qtd, tipo: material.tipo }));
  return {
    tarefa: String(tarefa || "").slice(0, 300),
    tela: telaAtual,
    empresa: appConfig.businessName || SYSTEM_NAME,
    plano: getPlanoAtual().status,
    pedidoAtual: pedidoAtual ? {
      id: pedidoAtual.id,
      cliente: clienteDoPedido(pedidoAtual),
      total: totalPedido(pedidoAtual),
      status: pedidoAtual.status || "aberto",
      itens: normalizarItensPedido(pedidoAtual).slice(0, ASSISTANT_MAX_CONTEXT_RESULTS)
    } : null,
    materiaisBaixos,
    mensagensRecentes: assistantMessages.slice(-ASSISTANT_MAX_MESSAGES),
    limites: {
      mensagens: ASSISTANT_MAX_MESSAGES,
      resultados: ASSISTANT_MAX_CONTEXT_RESULTS
    }
  };
}

function estimarTokensTexto(texto = "") {
  return Math.ceil(String(texto || "").length / 4);
}

function limitarMensagensAssistente() {
  assistantMessages = assistantMessages.slice(-ASSISTANT_MAX_MESSAGES);
}

function limparConversaAssistente() {
  assistantMessages = [];
  abrirAssistente(assistantMode || "auto");
}

function obterRespostaAssistente(texto, contexto = montarContextoAssistenteEnxuto(texto)) {
  try {
    const pergunta = normalizarTextoAssistente(texto);
    const base = Array.isArray(assistantResponses) ? assistantResponses : [];
    const resposta = base.find((item) => (item.keywords || []).some((keyword) => pergunta.includes(normalizarTextoAssistente(keyword))));
    const estimado = estimarTokensTexto(JSON.stringify(contexto || {}));
    window.__assistantLastTokenEstimate = estimado;
    console.debug("[Assistente] Resposta básica", { tokens: estimado, tela: contexto?.tela || telaAtual, matched: !!resposta });
    return resposta?.answer || "Não consegui acessar a IA agora, mas posso te ajudar com orientações básicas do sistema. Tente perguntar sobre pedido, estoque, calculadora, PDF, backup, plano ou login.";
  } catch (erro) {
    ErrorService.capture(erro, { area: "Assistente básico", action: "fallback", silent: true });
    return "Não consegui acessar a IA agora, mas posso te ajudar com orientações básicas do sistema.";
  }
}

function normalizarAIAssistantSettings(config = appConfig.aiOfflineAssistant || {}) {
  const normalizarModelId = (modelId) => AI_MODELS.some((modelo) => modelo.id === String(modelId || "")) ? String(modelId || "") : "";
  const activeModelId = normalizarModelId(config.activeModelId);
  const installedModelId = normalizarModelId(config.installedModelId);
  const localEnabled = config.localEnabled === undefined
    ? !!activeModelId
    : config.localEnabled === true;
  return {
    localEnabled,
    proActivationPromptedVersion: String(config.proActivationPromptedVersion || ""),
    onboardingCompleted: config.onboardingCompleted === true,
    activeModelId,
    installedModelId,
    models: config.models && typeof config.models === "object" ? config.models : {},
    lastFailure: String(config.lastFailure || ""),
    lastPerformance: String(config.lastPerformance || ""),
    lastDeviceProfile: String(config.lastDeviceProfile || ""),
    voiceEnabled: config.voiceEnabled === true,
    ttsEnabled: config.ttsEnabled === true,
    ttsRate: Math.max(0.6, Math.min(Number(config.ttsRate || 1) || 1, 1.4)),
    basicFallback: config.basicFallback !== false
  };
}

function getAIAssistantSettings() {
  appConfig.aiOfflineAssistant = normalizarAIAssistantSettings(appConfig.aiOfflineAssistant);
  return appConfig.aiOfflineAssistant;
}

function getAIModel(modelId) {
  return AI_MODELS.find((modelo) => modelo.id === modelId) || AI_MODELS[0] || null;
}

function getAIModelLocalState(modelId) {
  const settings = getAIAssistantSettings();
  return settings.models?.[modelId] || {};
}

function setAIModelLocalState(modelId, patch = {}) {
  const settings = getAIAssistantSettings();
  const normalizedPatch = { ...patch };
  if (normalizedPatch.status) {
    normalizedPatch.status = AI_INSTALL_STATE_ALIASES[normalizedPatch.status] || normalizedPatch.status;
    normalizedPatch.installState = normalizedPatch.status;
  }
  settings.models = {
    ...(settings.models || {}),
    [modelId]: {
      ...(settings.models?.[modelId] || {}),
      ...normalizedPatch,
      updatedAt: new Date().toISOString()
    }
  };
  appConfig.aiOfflineAssistant = settings;
  salvarDados();
  return settings.models[modelId];
}

function agendarRenderizacaoIA(atraso = AI_PROGRESS_RENDER_INTERVAL_MS) {
  if (aiProgressRenderTimer) return;
  aiProgressRenderTimer = setTimeout(() => {
    aiProgressRenderTimer = null;
    renderizarPreservandoScroll();
  }, Math.max(120, Number(atraso) || AI_PROGRESS_RENDER_INTERVAL_MS));
}

function atualizarElementosProgressoIA(modelId, state = getAIModelLocalState(modelId)) {
  const progress = progressoIAInstalacao(state);
  const safeId = String(modelId || "").replace(/["\\]/g, "");
  document.querySelectorAll(`[data-ai-progress="${safeId}"]`).forEach((root) => {
    root.style.setProperty("--ai-progress", `${Math.max(0, Math.min(100, progress.percent))}%`);
    const percent = root.querySelector("[data-ai-progress-percent]");
    if (percent) percent.textContent = `${Math.max(0, Math.min(100, progress.percent))}%`;
    const label = root.querySelector("[data-ai-progress-label]");
    if (label) label.textContent = progress.label || label.textContent || "";
  });
}

function podeExibirAssistenteIAOffline() {
  return isAndroidNativeApp() && !!getUsuarioAtual();
}

function podeUsarAssistenteIAOfflinePro() {
  // IA Local e premium real: Free, Trial e Superadmin sem plano Pro pago visualizam, mas nao executam runtime/download.
  return podeExibirAssistenteIAOffline() && temPlanoProPagoAtivo();
}

function mensagemUpgradeIALocalPro() {
  return "Assine o Plano Pro para desbloquear IA Local offline diretamente no aparelho.";
}

function exigirPlanoProPagoIALocal({ navegar = false } = {}) {
  if (podeUsarAssistenteIAOfflinePro()) return true;
  mostrarToast(mensagemUpgradeIALocalPro(), "aviso", 5200);
  if (navegar) trocarTela("assinatura");
  return false;
}

function iaLocalEstaAtivada() {
  const settings = getAIAssistantSettings();
  return podeUsarAssistenteIAOfflinePro() && settings.localEnabled === true;
}

function iaLocalEstaPronta() {
  return iaLocalEstaAtivada() && !!getModeloIAOfflineAtivoInstalado(false);
}

function getAssistenteModoDisponivel() {
  return iaLocalEstaPronta() ? "pro" : "basic";
}

function getAssistenteLabelPrincipal() {
  return "Assistente";
}

function renderAssistantFabContent(label = "Assistente", pro = false) {
  return `
    <span class="assistant-fab-icon ${pro ? "pro" : ""}" aria-hidden="true">
      <span></span>
    </span>
    <span>${escaparHtml(label)}</span>
  `;
}

function registrarFalhaIALocal(action, erro, extra = {}) {
  ErrorService.capture(erro, { area: "Assistente IA Local", action, silent: true, ...extra });
}

function definirIAConfig(patch = {}, persistir = true) {
  appConfig.aiOfflineAssistant = {
    ...getAIAssistantSettings(),
    ...patch
  };
  if (persistir) salvarDados();
  return getAIAssistantSettings();
}

function getAIModelStatus(modelId) {
  const settings = getAIAssistantSettings();
  const state = getAIModelLocalState(modelId);
  const normalizedStatus = AI_INSTALL_STATE_ALIASES[state.status] || state.status;
  if (normalizedStatus && normalizedStatus !== state.status) return normalizedStatus;
  if (state.status === "installed") {
    return state.runtimeValidatedAt ? AI_INSTALL_STATUS.INSTALLED_READY : AI_INSTALL_STATUS.INSTALLED_BUT_FAILED;
  }
  if (state.status) return state.status;
  if ((settings.activeModelId === modelId || settings.installedModelId === modelId || state.installedAt) && state.runtimeValidatedAt) {
    return AI_INSTALL_STATUS.INSTALLED_READY;
  }
  if (settings.activeModelId === modelId || settings.installedModelId === modelId || state.installedAt) {
    return AI_INSTALL_STATUS.INSTALLED_BUT_FAILED;
  }
  return AI_INSTALL_STATUS.NOT_INSTALLED;
}

function labelStatusAI(status = "") {
  const labels = {
    [AI_INSTALL_STATUS.NOT_INSTALLED]: "Não instalado",
    [AI_INSTALL_STATUS.DOWNLOADING]: "Baixando",
    [AI_INSTALL_STATUS.DOWNLOADED]: "Baixado",
    [AI_INSTALL_STATUS.VALIDATING]: "Verificando",
    [AI_INSTALL_STATUS.LOADING]: "Carregando",
    [AI_INSTALL_STATUS.INSTALLING]: "Instalando",
    [AI_INSTALL_STATUS.TESTING]: "Testando",
    [AI_INSTALL_STATUS.INSTALLED_READY]: "Pronta",
    [AI_INSTALL_STATUS.INSTALLED_BUT_FAILED]: "Precisa testar",
    [AI_INSTALL_STATUS.FAILED_DOWNLOAD]: "Falha no download",
    [AI_INSTALL_STATUS.FAILED_VALIDATION]: "Falha na validação",
    [AI_INSTALL_STATUS.FAILED_RUNTIME]: "Falha no runtime",
    [AI_INSTALL_STATUS.REMOVING]: "Removendo",
    [AI_INSTALL_STATUS.REMOVED]: "Removida",
    installed: "Precisa testar",
    error: "Erro",
    incompatible: "Incompatível",
    active: "Pronta"
  };
  return labels[status] || "Não instalado";
}

function getAIPlugin() {
  return window.Capacitor?.Plugins?.SimplificaFiles || null;
}

function isAIModelReadyStatus(status = "") {
  return status === AI_INSTALL_STATUS.INSTALLED_READY || status === "active";
}

function isAIModelBusyStatus(status = "") {
  return [
    AI_INSTALL_STATUS.DOWNLOADING,
    AI_INSTALL_STATUS.VALIDATING,
    AI_INSTALL_STATUS.LOADING,
    AI_INSTALL_STATUS.INSTALLING,
    AI_INSTALL_STATUS.TESTING,
    AI_INSTALL_STATUS.REMOVING
  ].includes(status);
}

function progressoIAInstalacao(state = {}) {
  const status = state.status || AI_INSTALL_STATUS.NOT_INSTALLED;
  const progress = Math.max(0, Math.min(100, Math.round(Number(state.progress || 0) || 0)));
  const labels = {
    [AI_INSTALL_STATUS.DOWNLOADING]: `Baixando modelo: ${progress}%`,
    [AI_INSTALL_STATUS.DOWNLOADED]: "Download concluído",
    [AI_INSTALL_STATUS.VALIDATING]: "Verificando arquivo...",
    [AI_INSTALL_STATUS.LOADING]: "Carregando modelo...",
    [AI_INSTALL_STATUS.INSTALLING]: "Instalando IA...",
    [AI_INSTALL_STATUS.TESTING]: "Testando IA...",
    [AI_INSTALL_STATUS.INSTALLED_READY]: "IA testada e pronta",
    [AI_INSTALL_STATUS.INSTALLED_BUT_FAILED]: "Modelo baixado, mas ainda sem teste válido",
    [AI_INSTALL_STATUS.FAILED_DOWNLOAD]: "Download não concluído",
    [AI_INSTALL_STATUS.FAILED_VALIDATION]: "Arquivo inválido",
    [AI_INSTALL_STATUS.FAILED_RUNTIME]: "Runtime não iniciou",
    [AI_INSTALL_STATUS.REMOVING]: "Removendo modelo..."
  };
  return {
    active: isAIModelBusyStatus(status) || progress > 0,
    percent: status === AI_INSTALL_STATUS.DOWNLOADING ? progress : isAIModelReadyStatus(status) ? 100 : Math.max(progress, 0),
    label: labels[status] || ""
  };
}

function formatarMb(bytes = 0) {
  const valor = Number(bytes || 0);
  if (!Number.isFinite(valor) || valor <= 0) return "";
  return `${Math.round(valor / 1024 / 1024)} MB`;
}

function estimarMemoriaDispositivoMb() {
  const gb = Number(navigator.deviceMemory || 0);
  return gb > 0 ? Math.round(gb * 1024) : 0;
}

async function obterResumoCapacidadeIA(modelo = {}) {
  const plugin = getAIPlugin();
  if (plugin?.testAiModelPerformance) {
    try {
      return await plugin.testAiModelPerformance({ modelId: modelo.id || "", sizeMb: Number(modelo.sizeMb) || 0 });
    } catch (erro) {
      return { ok: false, risk: "unknown", message: erro.message || String(erro) };
    }
  }
  const memoriaMb = estimarMemoriaDispositivoMb();
  let storageMb = 0;
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      storageMb = Math.round(Number(estimate.quota || 0) / 1024 / 1024);
    }
  } catch (_) {}
  const risco = modelo.sizeMb >= 180 && memoriaMb && memoriaMb < 4096 ? "high" : modelo.sizeMb >= 90 && memoriaMb && memoriaMb < 2048 ? "medium" : "low";
  return {
    ok: risco !== "high",
    risk: risco,
    memoryMb: memoriaMb,
    storageMb,
    message: risco === "high"
      ? "Este aparelho pode ficar lento com este modelo."
      : "Teste básico concluído."
  };
}

function classificarDispositivoIA(resumo = {}) {
  const memoria = Math.max(Number(resumo.memoryMb || 0) || 0, Number(resumo.memoryClassMb || 0) || 0);
  const storage = Number(resumo.storageMb || 0) || 0;
  const cores = Number(resumo.cpuCores || navigator.hardwareConcurrency || 0) || 0;
  if ((memoria && memoria < 1024) || (storage && storage < 700) || (cores && cores <= 2)) {
    return {
      id: "basic",
      label: "Básico",
      modelId: AI_DEFAULT_MODEL_ID,
      description: "Respostas curtas, menor consumo e melhor estabilidade para aparelhos simples.",
      speed: "mais rápido e leve",
      quality: "ajuda essencial do sistema"
    };
  }
  if ((memoria && memoria < 4096) || (storage && storage < 1200) || (cores && cores <= 4)) {
    return {
      id: "intermediate",
      label: "Intermediário",
      modelId: AI_DEFAULT_MODEL_ID,
      description: "Bom equilíbrio entre qualidade e desempenho para uso diário.",
      speed: "velocidade moderada",
      quality: "mais contexto para pedidos, estoque e cálculo"
    };
  }
  return {
    id: "advanced",
    label: "Avançado",
    modelId: AI_DEFAULT_MODEL_ID,
    description: "Melhor qualidade para aparelhos mais fortes.",
    speed: "mais completo",
    quality: "análises comerciais mais completas"
  };
}

async function analisarDispositivoParaIA() {
  const resultados = [];
  for (const modelo of AI_MODELS) {
    resultados.push({ modelo, resumo: await obterResumoCapacidadeIA(modelo) });
  }
  const melhorResumo = resultados.find((item) => item.modelo.id === AI_DEFAULT_MODEL_ID)?.resumo
    || resultados[0]?.resumo
    || {};
  const perfil = classificarDispositivoIA(melhorResumo);
  const modelo = getAIModel(perfil.modelId) || AI_MODELS[0];
  return {
    perfil,
    modelo,
    resumo: melhorResumo,
    resultados
  };
}

async function obterSuporteVozIA() {
  if (!podeUsarAssistenteIAOfflinePro()) return { speechAvailable: false, ttsAvailable: false };
  const plugin = getAIPlugin();
  if (!plugin?.getAiVoiceSupport) return { speechAvailable: false, ttsAvailable: false };
  if (assistantVoiceSupportLoading) return assistantVoiceSupport || { speechAvailable: false, ttsAvailable: false, loading: true };
  assistantVoiceSupportLoading = true;
  try {
    assistantVoiceSupport = await plugin.getAiVoiceSupport();
  } catch (erro) {
    assistantVoiceSupport = { speechAvailable: false, ttsAvailable: false, error: erro?.message || String(erro) };
    registrarFalhaIALocal("voice_support", erro);
  } finally {
    assistantVoiceSupportLoading = false;
  }
  return assistantVoiceSupport;
}

async function obterDiagnosticoRuntimeIA({ force = false } = {}) {
  if (!podeUsarAssistenteIAOfflinePro()) return null;
  const plugin = getAIPlugin();
  if (!plugin?.getAiRuntimeDiagnostics) {
    assistantRuntimeDiagnostics = { engine: "Indisponível", ok: false };
    return assistantRuntimeDiagnostics;
  }
  if (assistantRuntimeDiagnosticsLoading) return assistantRuntimeDiagnostics || { loading: true };
  if (assistantRuntimeDiagnostics && !force) return assistantRuntimeDiagnostics;
  assistantRuntimeDiagnosticsLoading = true;
  try {
    assistantRuntimeDiagnostics = await plugin.getAiRuntimeDiagnostics();
  } catch (erro) {
    assistantRuntimeDiagnostics = { ok: false, error: erro?.message || String(erro) };
    registrarFalhaIALocal("runtime_diagnostics", erro);
  } finally {
    assistantRuntimeDiagnosticsLoading = false;
  }
  return assistantRuntimeDiagnostics;
}

function atualizarDiagnosticoRuntimeIASeNecessario() {
  if (!podeUsarAssistenteIAOfflinePro() || assistantRuntimeDiagnostics || assistantRuntimeDiagnosticsLoading) return;
  obterDiagnosticoRuntimeIA().then(() => {
    if (telaAtual === "config") renderizarPreservandoScroll();
  });
}

async function atualizarDiagnosticoRuntimeIA(force = false) {
  await obterDiagnosticoRuntimeIA({ force });
  renderizarPreservandoScroll();
}

function renderDiagnosticoRuntimeIA() {
  const diag = assistantRuntimeDiagnostics || {};
  const carregando = assistantRuntimeDiagnosticsLoading || diag.loading;
  const valor = (item, fallback = "—") => item === undefined || item === null || item === "" ? fallback : item;
  return `
    <details class="ai-runtime-diagnostics">
      <summary>Diagnóstico técnico da IA</summary>
      <div class="sync-grid">
        <div class="metric"><span>Engine</span><strong>${escaparHtml(valor(diag.engine, carregando ? "Verificando" : "llama.cpp JNI"))}</strong></div>
        <div class="metric"><span>Modelo carregado</span><strong>${diag.modelLoaded ? "Sim" : "Não"}</strong></div>
        <div class="metric"><span>mmap</span><strong>${diag.mmap === false ? "Não" : "Sim"}</strong></div>
        <div class="metric"><span>Threads</span><strong>${escaparHtml(valor(diag.threads, 2))}</strong></div>
        <div class="metric"><span>Contexto</span><strong>${escaparHtml(valor(diag.contextTokens, 2048))}</strong></div>
        <div class="metric"><span>GPU layers</span><strong>${escaparHtml(valor(diag.gpuLayers, 0))}</strong></div>
        <div class="metric"><span>RAM livre</span><strong>${escaparHtml(valor(diag.availableMemoryMb))} MB</strong></div>
        <div class="metric"><span>Android</span><strong>${escaparHtml(valor(diag.androidSdk))}</strong></div>
      </div>
      ${diag.error ? `<p class="feedback-status error">${escaparHtml(diag.error)}</p>` : ""}
      <div class="actions">
        <button class="btn ghost" type="button" onclick="atualizarDiagnosticoRuntimeIA(true)">Atualizar diagnóstico</button>
      </div>
    </details>
  `;
}

function podeUsarVozIAPro() {
  return iaLocalEstaPronta()
    && assistantMode === "pro"
    && getAIAssistantSettings().voiceEnabled === true
    && assistantVoiceSupport?.speechAvailable === true;
}

async function atualizarSuporteVozIASeNecessario() {
  if (!iaLocalEstaPronta() || assistantVoiceSupport || assistantVoiceSupportLoading) return;
  await obterSuporteVozIA();
  renderApp();
}

function renderAssistenteInteligenteProConfig() {
  if (!getUsuarioAtual()) return "";
  const acessoProIA = podeUsarAssistenteIAOfflinePro();
  const settings = getAIAssistantSettings();
  const ativo = getAIModel(settings.activeModelId);
  const instalado = getAIModel(settings.installedModelId);
  const localAtivo = acessoProIA && settings.localEnabled === true;
  const pronto = localAtivo && !!getModeloIAOfflineAtivoInstalado();
  const vozDisponivel = assistantVoiceSupport?.speechAvailable === true;
  const vozVerificada = !!assistantVoiceSupport && assistantVoiceSupportLoading === false;
  const ttsDisponivel = assistantVoiceSupport?.ttsAvailable !== false;
  if (pronto && !assistantVoiceSupport && !assistantVoiceSupportLoading) {
    setTimeout(() => atualizarSuporteVozIASeNecessario(), 0);
  }
  if (acessoProIA && !assistantRuntimeDiagnostics && !assistantRuntimeDiagnosticsLoading) {
    setTimeout(() => atualizarDiagnosticoRuntimeIASeNecessario(), 0);
  }
  const textoStatusVoz = assistantVoiceSupportLoading
    ? "verificando compatibilidade"
    : vozDisponivel
      ? "disponível"
      : vozVerificada
        ? "indisponível neste aparelho"
        : "aguardando verificação";

  return `
    <div class="danger-zone ai-pro-manager">
      <div class="card-header compact">
        <h2 class="section-title">IA Local</h2>
        <span class="status-badge">${acessoProIA ? (pronto ? "Pronta" : localAtivo ? "Configurar" : "Pro") : "Plano Pro"}</span>
      </div>
      ${acessoProIA ? "" : `
        <div class="ai-upgrade-box">
          <strong>Recurso exclusivo do Plano Pro</strong>
          <span>${escaparHtml(mensagemUpgradeIALocalPro())}</span>
          <button class="btn secondary" type="button" onclick="trocarTela('assinatura')">Disponível no Plano Pro</button>
        </div>
      `}
      <label class="toggle-row">
        <input type="checkbox" ${localAtivo ? "checked" : ""} onchange="alternarIALocalPro(this.checked)" ${acessoProIA ? "" : "disabled"}>
        <span>Ativar IA Local</span>
      </label>
      <div class="sync-grid">
        <div class="metric"><span>Modo</span><strong>${escaparHtml(settings.lastDeviceProfile || "Automático")}</strong></div>
        <div class="metric"><span>Modelo ativo</span><strong>${escaparHtml(localAtivo ? (ativo?.name || "Nenhum") : acessoProIA ? "Assistente básico" : "Bloqueado")}</strong></div>
        <div class="metric"><span>Espaço</span><strong>${Number(getAIModelLocalState(settings.installedModelId).sizeMb || instalado?.sizeMb || 0) || 0} MB</strong></div>
        <div class="metric"><span>Status</span><strong>${acessoProIA ? (pronto ? "Validada" : settings.installedModelId ? labelStatusAI(getAIModelStatus(settings.installedModelId)) : "Aguardando") : "Exclusivo Pro"}</strong></div>
      </div>
      <div class="actions">
        <button class="btn" type="button" onclick="${acessoProIA ? "abrirWizardIAProLocal()" : "trocarTela('assinatura')"}">${acessoProIA ? "Instalar IA automaticamente" : "Disponível no Plano Pro"}</button>
        <button class="btn ghost" type="button" onclick="limparRuntimeIAPro()" ${acessoProIA ? "" : "disabled"}>Parar IA Local</button>
      </div>
      ${acessoProIA ? renderDiagnosticoRuntimeIA() : ""}
      <label class="toggle-row ${vozDisponivel ? "" : "muted-disabled"}">
        <input type="checkbox" ${settings.voiceEnabled && vozDisponivel && acessoProIA ? "checked" : ""} onchange="alternarVozIAPro(this.checked)" ${vozDisponivel && acessoProIA ? "" : "disabled"}>
        <span>Microfone${vozDisponivel ? "" : ` (${escaparHtml(textoStatusVoz)})`}</span>
      </label>
      <label class="toggle-row ${ttsDisponivel ? "" : "muted-disabled"}">
        <input type="checkbox" ${settings.ttsEnabled && ttsDisponivel && acessoProIA ? "checked" : ""} onchange="alternarLeituraVozIAPro(this.checked)" ${ttsDisponivel && acessoProIA ? "" : "disabled"}>
        <span>Ler em voz alta${ttsDisponivel ? "" : " (indisponível)"}</span>
      </label>
      ${settings.ttsEnabled && ttsDisponivel && acessoProIA ? `
        <label class="range-row">
          <span>Velocidade da voz</span>
          <input type="range" min="0.6" max="1.4" step="0.1" value="${escaparAttr(settings.ttsRate || 1)}" oninput="ajustarVelocidadeLeituraIAPro(this.value)">
          <strong>${Number(settings.ttsRate || 1).toFixed(1)}x</strong>
        </label>
      ` : ""}
      ${settings.lastFailure ? `<p class="feedback-status error">${escaparHtml(settings.lastFailure)}</p>` : ""}
      <details class="ai-advanced-settings">
        <summary>Modelos</summary>
        <div class="ai-model-list">
          ${AI_MODELS.map((modelo) => renderAIModelCard(modelo, settings)).join("")}
        </div>
      </details>
    </div>
  `;
}

function renderAIModelCard(modelo, settings = getAIAssistantSettings()) {
  const acessoProIA = podeUsarAssistenteIAOfflinePro();
  const state = getAIModelLocalState(modelo.id);
  const realStatus = getAIModelStatus(modelo.id);
  const status = settings.activeModelId === modelo.id && isAIModelReadyStatus(realStatus) ? "active" : realStatus;
  const ready = isAIModelReadyStatus(realStatus);
  const hasFile = !!state.path || !!state.installedAt || [AI_INSTALL_STATUS.DOWNLOADED, AI_INSTALL_STATUS.INSTALLED_BUT_FAILED, AI_INSTALL_STATUS.FAILED_RUNTIME].includes(realStatus);
  const busy = isAIModelBusyStatus(realStatus);
  const urlConfigurada = !!String(modelo.url || "").trim();
  const statusLabel = status === "active" ? "Em uso" : labelStatusAI(status);
  const progress = progressoIAInstalacao(state);
  const tamanho = formatarMb(state.sizeBytes) || `${Number(state.sizeMb || modelo.sizeMb) || modelo.sizeMb} MB`;
  const acaoPrincipal = !acessoProIA ? "Disponível no Plano Pro" : ready ? "Abrir IA" : realStatus === AI_INSTALL_STATUS.FAILED_DOWNLOAD || realStatus === AI_INSTALL_STATUS.FAILED_VALIDATION || realStatus === AI_INSTALL_STATUS.FAILED_RUNTIME ? "Tentar novamente" : "Instalar IA";
  return `
    <article class="ai-model-card ${settings.activeModelId === modelo.id && ready ? "active" : ""} ${acessoProIA ? "" : "locked"}">
      <div class="row-title">
        <div>
          <strong>${escaparHtml(modelo.name)}</strong>
          <span class="muted">${escaparHtml(modelo.recommended)} • ${escaparHtml(modelo.ramRecommended)} • ${escaparHtml(tamanho)}</span>
        </div>
        <span class="status-badge">${escaparHtml(statusLabel)}</span>
      </div>
      ${progress.active || state.lastError || state.runtimeValidatedAt ? `
        <div class="ai-install-progress" data-ai-progress="${escaparAttr(modelo.id)}" style="--ai-progress:${Math.max(0, Math.min(100, progress.percent))}%">
          <div class="ai-progress-circle" aria-label="Progresso da IA">
            <strong data-ai-progress-percent>${Math.max(0, Math.min(100, progress.percent))}%</strong>
          </div>
          ${progress.label ? `<span data-ai-progress-label>${escaparHtml(progress.label)}</span>` : `<span data-ai-progress-label></span>`}
          ${state.runtimeValidatedAt ? `<small>Teste interno OK</small>` : ""}
          ${state.lastError ? `<small class="error">${escaparHtml(state.lastError)}</small>` : ""}
        </div>
      ` : ""}
      <div class="actions">
        <button class="btn secondary" type="button" onclick="${acessoProIA ? (ready ? `abrirModeloIAOffline('${escaparAttr(modelo.id)}')` : `baixarModeloIAOffline('${escaparAttr(modelo.id)}')`) : "trocarTela('assinatura')"}" ${acessoProIA && (busy || (!ready && !urlConfigurada)) ? "disabled" : ""}>${escaparHtml(acaoPrincipal)}</button>
        ${busy && acessoProIA ? `<button class="btn ghost" type="button" onclick="cancelarInstalacaoIAOffline('${escaparAttr(modelo.id)}')">Cancelar</button>` : ""}
        <button class="btn ghost" type="button" onclick="testarModeloIAOffline('${escaparAttr(modelo.id)}')" ${!acessoProIA || busy || !hasFile ? "disabled" : ""}>Testar IA</button>
        <button class="btn danger" type="button" onclick="removerModeloIAOffline('${escaparAttr(modelo.id)}')" ${!acessoProIA || busy || !hasFile ? "disabled" : ""}>Remover modelo</button>
      </div>
    </article>
  `;
}

async function adicionarListenerProgressoIA(modelId) {
  const plugin = getAIPlugin();
  if (!plugin?.addListener) return null;
  try {
    const handle = await plugin.addListener("aiModelProgress", (event = {}) => {
      if (String(event.modelId || "") !== String(modelId)) return;
      const status = String(event.status || AI_INSTALL_STATUS.DOWNLOADING);
      setAIModelLocalState(modelId, {
        status,
        progress: Number(event.percent || 0) || 0,
        downloadedBytes: Number(event.bytesRead || event.downloadedBytes || 0) || 0,
        totalBytes: Number(event.totalBytes || 0) || 0,
        lastError: ""
      });
      atualizarElementosProgressoIA(modelId);
      agendarRenderizacaoIA();
    });
    return handle;
  } catch (erro) {
    registrarFalhaIALocal("progress_listener", erro, { modelId });
    return null;
  }
}

async function removerListenerProgressoIA(handle) {
  try {
    await handle?.remove?.();
  } catch (_) {}
}

async function validarArquivoModeloIA(modelo, modelId, path = "") {
  const plugin = getAIPlugin();
  setAIModelLocalState(modelId, {
    status: AI_INSTALL_STATUS.VALIDATING,
    progress: 100,
    lastError: ""
  });
  renderizarPreservandoScroll();
  if (!plugin?.validateAiModel) {
    return { ok: true, skipped: true, path };
  }
  return await plugin.validateAiModel({
    modelId,
    fileName: modelo.fileName,
    modelPath: path,
    minBytes: modelo.minBytes || 0
  });
}

async function verificarModeloIAInstalado(modelo, modelId) {
  const plugin = getAIPlugin();
  const state = getAIModelLocalState(modelId);
  if (!plugin?.validateAiModel) return null;
  try {
    const validacao = await plugin.validateAiModel({
      modelId,
      fileName: modelo.fileName,
      modelPath: String(state.path || "").trim(),
      minBytes: modelo.minBytes || 0
    });
    if (validacao?.ok) {
      const patch = {
        status: state.runtimeValidatedAt ? AI_INSTALL_STATUS.INSTALLED_READY : AI_INSTALL_STATUS.INSTALLED_BUT_FAILED,
        progress: 100,
        path: validacao.path || state.path || "",
        fileName: validacao.fileName || modelo.fileName,
        sizeBytes: Number(validacao.sizeBytes || state.sizeBytes || 0) || 0,
        sizeMb: Number(validacao.sizeMb || state.sizeMb || modelo.sizeMb) || modelo.sizeMb,
        ggufValid: true,
        lastError: ""
      };
      setAIModelLocalState(modelId, patch);
      return { ...validacao, ...patch };
    }
  } catch (erro) {
    registrarFalhaIALocal("validate_existing_model", erro, { modelId });
  }
  return null;
}

async function testarRuntimeModeloIA(modelo, modelId, path = "") {
  const plugin = getAIPlugin();
  setAIModelLocalState(modelId, {
    status: AI_INSTALL_STATUS.TESTING,
    progress: 100,
    lastError: ""
  });
  renderizarPreservandoScroll();
  if (!plugin?.testAiModelRuntime) {
    throw new Error("Runtime nativo da IA não disponível neste APK.");
  }
  return await promiseComTimeout(
    plugin.testAiModelRuntime({
      modelId,
      modelPath: path,
      systemPrompt: AI_RUNTIME_TEST_SYSTEM_PROMPT,
      prompt: AI_RUNTIME_TEST_PROMPT,
      maxTokens: 4,
      proAllowed: podeUsarAssistenteIAOfflinePro(),
      timeoutMs: 240000
    }),
    245000,
    "Teste da IA demorou demais."
  );
}

async function baixarModeloIAOffline(modelId) {
  const modelo = getAIModel(modelId);
  if (!modelo) return false;
  if (!exigirPlanoProPagoIALocal({ navegar: true })) return false;
  if (aiModelInstallPromise && isAIModelBusyStatus(getAIModelStatus(modelId))) {
    mostrarToast("A instalação da IA já está em andamento.", "info", 3200);
    return aiModelInstallPromise;
  }
  const existente = await verificarModeloIAInstalado(modelo, modelId);
  if (existente?.path) {
    try {
      if (!getAIModelLocalState(modelId).runtimeValidatedAt) {
        await testarModeloIAOffline(modelId);
      }
      if (isAIModelReadyStatus(getAIModelStatus(modelId))) {
        definirIAConfig({ activeModelId: modelId, installedModelId: modelId, localEnabled: true, onboardingCompleted: true });
        mostrarToast("IA já instalada neste aparelho.", "sucesso", 3200);
        abrirAssistente("pro");
        return true;
      }
      return false;
    } catch (erro) {
      setAIModelLocalState(modelId, { status: AI_INSTALL_STATUS.FAILED_RUNTIME, lastError: erro?.message || String(erro), progress: 100 });
      mostrarToast("Modelo encontrado, mas a IA não iniciou neste aparelho.", "erro", 5200);
      return false;
    }
  }
  if (!modelo.url) {
    const msg = "Instalação indisponível no momento.";
    setAIModelLocalState(modelId, { status: AI_INSTALL_STATUS.FAILED_DOWNLOAD, lastError: msg });
    appConfig.aiOfflineAssistant.lastFailure = msg;
    salvarDados();
    mostrarToast("Modelo ainda sem URL de download.", "aviso", 5000);
    renderizarPreservandoScroll();
    return false;
  }
  const plugin = getAIPlugin();
  if (!plugin?.downloadAiModel) {
    mostrarToast("Instalação indisponível neste aparelho.", "erro", 5000);
    return false;
  }
  setAIModelLocalState(modelId, { status: AI_INSTALL_STATUS.DOWNLOADING, progress: 0, lastError: "", runtimeValidatedAt: "" });
  appConfig.aiOfflineAssistant.lastFailure = "";
  renderizarPreservandoScroll();
  let progressHandle = null;
  aiModelInstallPromise = (async () => {
  try {
    progressHandle = await adicionarListenerProgressoIA(modelId);
    const result = await plugin.downloadAiModel({
      modelId,
      name: modelo.name,
      url: modelo.url,
      fileName: modelo.fileName,
      sizeMb: modelo.sizeMb,
      proAllowed: podeUsarAssistenteIAOfflinePro(),
      minBytes: modelo.minBytes || 0
    });
    setAIModelLocalState(modelId, {
      status: AI_INSTALL_STATUS.DOWNLOADED,
      progress: 100,
      downloadedAt: new Date().toISOString(),
      sizeMb: Number(result?.sizeMb || modelo.sizeMb) || modelo.sizeMb,
      sizeBytes: Number(result?.sizeBytes || 0) || 0,
      path: result?.path || "",
      lastError: ""
    });
    const validacao = await validarArquivoModeloIA(modelo, modelId, result?.path || "");
    if (validacao?.ok === false) {
      throw new Error(validacao?.message || "Arquivo GGUF inválido.");
    }
    setAIModelLocalState(modelId, {
      status: AI_INSTALL_STATUS.INSTALLING,
      progress: 100,
      validationCheckedAt: new Date().toISOString(),
      ggufValid: true,
      path: validacao?.path || result?.path || ""
    });
    renderizarPreservandoScroll();
    const runtime = await testarRuntimeModeloIA(modelo, modelId, validacao?.path || result?.path || "");
    const runtimeText = String(runtime?.text || "").trim();
    if (!runtime?.ok || !runtimeText) {
      throw new Error(runtime?.message || "A IA não respondeu no teste interno.");
    }
    setAIModelLocalState(modelId, {
      status: AI_INSTALL_STATUS.INSTALLED_READY,
      installedAt: new Date().toISOString(),
      runtimeValidatedAt: new Date().toISOString(),
      runtimeTestResponse: runtimeText.slice(0, 80),
      sizeMb: Number(result?.sizeMb || modelo.sizeMb) || modelo.sizeMb,
      sizeBytes: Number(result?.sizeBytes || validacao?.sizeBytes || 0) || 0,
      path: validacao?.path || result?.path || "",
      progress: 100,
      lastError: ""
    });
    appConfig.aiOfflineAssistant.installedModelId = modelId;
    appConfig.aiOfflineAssistant.activeModelId = modelId;
    appConfig.aiOfflineAssistant.localEnabled = true;
    appConfig.aiOfflineAssistant.onboardingCompleted = true;
    salvarDados();
    mostrarToast(`${modelo.name} instalado.`, "sucesso", 4200);
    return true;
  } catch (erro) {
    const msg = erro?.message || String(erro);
    const estadoAtual = getAIModelStatus(modelId);
    const statusFalha = estadoAtual === AI_INSTALL_STATUS.VALIDATING
      ? AI_INSTALL_STATUS.FAILED_VALIDATION
      : estadoAtual === AI_INSTALL_STATUS.TESTING || estadoAtual === AI_INSTALL_STATUS.INSTALLING || getAIModelLocalState(modelId).path
        ? AI_INSTALL_STATUS.FAILED_RUNTIME
        : AI_INSTALL_STATUS.FAILED_DOWNLOAD;
    setAIModelLocalState(modelId, { status: statusFalha, lastError: msg, progress: statusFalha === AI_INSTALL_STATUS.FAILED_DOWNLOAD ? 0 : 100 });
    appConfig.aiOfflineAssistant.lastFailure = statusFalha === AI_INSTALL_STATUS.FAILED_RUNTIME
      ? "Modelo baixado, mas não foi possível iniciar a IA neste aparelho."
      : "Falha ao instalar modelo: " + msg;
    if (appConfig.aiOfflineAssistant.activeModelId === modelId) appConfig.aiOfflineAssistant.activeModelId = "";
    appConfig.aiOfflineAssistant.localEnabled = false;
    salvarDados();
    mostrarToast(statusFalha === AI_INSTALL_STATUS.FAILED_RUNTIME ? "Modelo baixado, mas a IA não iniciou neste aparelho." : "Não foi possível instalar o modelo.", "erro", 6500);
    registrarFalhaIALocal("download_model", erro, { modelId });
    return false;
  } finally {
    await removerListenerProgressoIA(progressHandle);
    aiModelInstallPromise = null;
    renderizarPreservandoScroll();
  }
  })();
  return aiModelInstallPromise;
}

async function cancelarInstalacaoIAOffline(modelId) {
  const plugin = getAIPlugin();
  try {
    await plugin?.cancelAiModelDownload?.({ modelId });
  } catch (erro) {
    registrarFalhaIALocal("cancel_download", erro, { modelId });
  }
  setAIModelLocalState(modelId, {
    status: AI_INSTALL_STATUS.FAILED_DOWNLOAD,
    progress: 0,
    lastError: "Instalação cancelada pelo usuário."
  });
  mostrarToast("Instalação da IA cancelada.", "info", 2600);
  renderizarPreservandoScroll();
}

async function abrirModeloIAOffline(modelId) {
  const modelo = getAIModel(modelId);
  if (!modelo || !exigirPlanoProPagoIALocal({ navegar: true })) return;
  const state = getAIModelLocalState(modelId);
  if (!isAIModelReadyStatus(getAIModelStatus(modelId)) || !String(state.path || "").trim() || !state.runtimeValidatedAt) {
    await baixarModeloIAOffline(modelId);
    return;
  }
  definirIAConfig({ activeModelId: modelId, installedModelId: modelId, localEnabled: true, onboardingCompleted: true, lastFailure: "" });
  assistantRuntimeReady = false;
  assistantRuntimeDiagnostics = null;
  abrirAssistente("pro");
}

async function usarModeloIAOffline(modelId) {
  const modelo = getAIModel(modelId);
  if (!modelo || !exigirPlanoProPagoIALocal({ navegar: true })) return;
  const state = getAIModelLocalState(modelId);
  if (!isAIModelReadyStatus(getAIModelStatus(modelId)) || !state.runtimeValidatedAt) {
    mostrarToast("Teste a IA antes de ativar este modelo.", "aviso", 4800);
    return;
  }
  const performance = await obterResumoCapacidadeIA(modelo);
  if (["high", "medium"].includes(String(performance.risk || ""))) {
    const seguir = confirm("Este modelo pode deixar seu aparelho lento neste aparelho. Deseja ativar mesmo assim?");
    if (!seguir) return;
  }
  appConfig.aiOfflineAssistant.activeModelId = modelId;
  appConfig.aiOfflineAssistant.installedModelId = appConfig.aiOfflineAssistant.installedModelId || modelId;
  appConfig.aiOfflineAssistant.localEnabled = true;
  appConfig.aiOfflineAssistant.onboardingCompleted = true;
  appConfig.aiOfflineAssistant.lastPerformance = performance.message || "Modelo ativado";
  assistantVoiceSupport = null;
  assistantRuntimeDiagnostics = null;
  salvarDados();
  mostrarToast(`${modelo.name} ativo.`, "sucesso", 3500);
  renderizarPreservandoScroll();
}

async function removerModeloIAOffline(modelId) {
  const modelo = getAIModel(modelId);
  if (!modelo || !exigirPlanoProPagoIALocal({ navegar: true })) return;
  const confirmado = confirm("Remover esta IA do aparelho? Você poderá instalar novamente depois.");
  if (!confirmado) return;
  const plugin = getAIPlugin();
  setAIModelLocalState(modelId, { status: AI_INSTALL_STATUS.REMOVING });
  renderizarPreservandoScroll();
  try {
    if (plugin?.deleteAiModel) await plugin.deleteAiModel({ modelId, fileName: modelo.fileName });
    const settings = getAIAssistantSettings();
    settings.models = { ...(settings.models || {}) };
    settings.models[modelId] = { status: AI_INSTALL_STATUS.REMOVED, removedAt: new Date().toISOString() };
    if (settings.activeModelId === modelId) settings.activeModelId = "";
    if (settings.installedModelId === modelId) settings.installedModelId = "";
    if (!settings.activeModelId) {
      settings.localEnabled = false;
      settings.voiceEnabled = false;
      assistantMode = "basic";
    }
    assistantVoiceSupport = null;
    assistantRuntimeDiagnostics = null;
    appConfig.aiOfflineAssistant = settings;
    salvarDados();
    mostrarToast("Modelo removido.", "sucesso", 3500);
  } catch (erro) {
    setAIModelLocalState(modelId, { status: AI_INSTALL_STATUS.INSTALLED_BUT_FAILED, lastError: erro?.message || String(erro) });
    mostrarToast("Não foi possível remover o modelo.", "erro", 5000);
  }
  renderizarPreservandoScroll();
}

async function testarModeloIAOffline(modelId) {
  const modelo = getAIModel(modelId);
  if (!modelo || !exigirPlanoProPagoIALocal({ navegar: true })) return;
  const state = getAIModelLocalState(modelId);
  const path = String(state.path || "").trim();
  if (!path) {
    mostrarToast("Baixe o modelo antes de testar.", "aviso", 4200);
    return;
  }
  try {
    const resultado = await obterResumoCapacidadeIA(modelo);
    if (resultado.risk === "high") {
      mostrarToast("Este modelo pode ficar lento neste aparelho.", "aviso", 5200);
    }
    const runtime = await testarRuntimeModeloIA(modelo, modelId, path);
    const runtimeText = String(runtime?.text || "").trim();
    if (!runtime?.ok || !runtimeText) throw new Error(runtime?.message || "A IA não respondeu no teste interno.");
    setAIModelLocalState(modelId, {
      status: AI_INSTALL_STATUS.INSTALLED_READY,
      runtimeValidatedAt: new Date().toISOString(),
      runtimeTestResponse: runtimeText.slice(0, 80),
      progress: 100,
      lastError: ""
    });
    definirIAConfig({ activeModelId: modelId, installedModelId: modelId, localEnabled: true, onboardingCompleted: true, lastFailure: "" });
    appConfig.aiOfflineAssistant.lastPerformance = "Teste interno OK.";
    salvarDados();
    mostrarToast("IA testada e pronta.", "sucesso", 4200);
  } catch (erro) {
    const msg = erro?.message || String(erro);
    setAIModelLocalState(modelId, { status: AI_INSTALL_STATUS.FAILED_RUNTIME, lastError: msg, progress: 100 });
    appConfig.aiOfflineAssistant.lastFailure = "Modelo baixado, mas não foi possível iniciar a IA neste aparelho.";
    if (appConfig.aiOfflineAssistant.activeModelId === modelId) appConfig.aiOfflineAssistant.activeModelId = "";
    appConfig.aiOfflineAssistant.localEnabled = false;
    salvarDados();
    registrarFalhaIALocal("test_runtime", erro, { modelId });
    mostrarToast("Modelo baixado, mas a IA não iniciou neste aparelho.", "erro", 6500);
  } finally {
    renderizarPreservandoScroll();
  }
}

async function alternarIALocalPro(ativo) {
  if (!exigirPlanoProPagoIALocal({ navegar: true })) return;
  const settings = getAIAssistantSettings();
  if (!ativo) {
    definirIAConfig({ localEnabled: false, voiceEnabled: false, ttsEnabled: false });
    assistantMode = "basic";
    assistantListening = false;
    assistantRuntimeReady = false;
    assistantRuntimeDiagnostics = null;
    try {
      await getAIPlugin()?.stopAiVoiceRecognition?.();
      await getAIPlugin()?.stopAiSpeech?.();
      await getAIPlugin()?.unloadAiModel?.();
    } catch (erro) {
      registrarFalhaIALocal("unload_toggle", erro);
    }
    mostrarToast("Assistente básico ativo.", "info", 3200);
    renderizarPreservandoScroll();
    return;
  }
  const modelo = getAIModel(settings.activeModelId);
  const state = getAIModelLocalState(settings.activeModelId);
  if (!modelo || !state.path || !isAIModelReadyStatus(getAIModelStatus(settings.activeModelId))) {
    definirIAConfig({ localEnabled: false });
    abrirWizardIAProLocal();
    return;
  }
  definirIAConfig({ localEnabled: true, onboardingCompleted: true });
  assistantMode = "pro";
  assistantVoiceSupport = null;
  assistantRuntimeDiagnostics = null;
  mostrarToast("IA Local ativada.", "sucesso", 3200);
  obterSuporteVozIA().finally(() => renderizarPreservandoScroll());
}

async function limparRuntimeIAPro() {
  if (!exigirPlanoProPagoIALocal()) return;
  try {
    assistantListening = false;
    await getAIPlugin()?.stopAiVoiceRecognition?.();
    await getAIPlugin()?.stopAiSpeech?.();
    await getAIPlugin()?.unloadAiModel?.();
    assistantRuntimeReady = false;
    assistantRuntimeDiagnostics = null;
    mostrarToast("Memória da IA liberada.", "sucesso", 3000);
  } catch (erro) {
    registrarFalhaIALocal("unload_manual", erro);
    mostrarToast("Não foi possível liberar a IA agora.", "aviso", 4000);
  }
}

async function alternarVozIAPro(ativo) {
  if (!exigirPlanoProPagoIALocal({ navegar: true })) return;
  if (!ativo) {
    assistantListening = false;
    try {
      await getAIPlugin()?.stopAiVoiceRecognition?.();
    } catch (erro) {
      registrarFalhaIALocal("voice_disable", erro);
    }
  }
  if (ativo) {
    const suporte = await obterSuporteVozIA();
    if (suporte?.speechAvailable !== true) {
      definirIAConfig({ voiceEnabled: false });
      mostrarToast("Seu dispositivo não possui suporte completo ao reconhecimento de voz.", "aviso", 5000);
      renderizarPreservandoScroll();
      return;
    }
  }
  definirIAConfig({ voiceEnabled: ativo === true });
  renderizarPreservandoScroll();
}

function alternarLeituraVozIAPro(ativo) {
  if (!exigirPlanoProPagoIALocal({ navegar: true })) return;
  if (ativo && assistantVoiceSupport?.ttsAvailable === false) {
    definirIAConfig({ ttsEnabled: false });
    mostrarToast("Leitura em voz indisponível neste aparelho.", "aviso", 4200);
    renderizarPreservandoScroll();
    return;
  }
  if (!ativo) {
    getAIPlugin()?.stopAiSpeech?.().catch((erro) => registrarFalhaIALocal("tts_disable", erro));
  }
  definirIAConfig({ ttsEnabled: ativo === true });
  mostrarToast(ativo ? "Leitura em voz ativada." : "Leitura em voz desativada.", "info", 2600);
  renderizarPreservandoScroll();
}

function ajustarVelocidadeLeituraIAPro(valor) {
  if (!exigirPlanoProPagoIALocal({ navegar: true })) return;
  const ttsRate = Math.max(0.6, Math.min(Number(valor || 1) || 1, 1.4));
  definirIAConfig({ ttsRate }, true);
  renderizarPreservandoScroll();
}

async function abrirWizardIAProLocal() {
  if (!exigirPlanoProPagoIALocal({ navegar: true })) return;
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="ai-wizard-cancel">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Preparando IA Local</h2>
          <button class="icon-button" type="button" data-action="ai-wizard-cancel" title="Fechar">✕</button>
        </div>
        <p class="muted">Escolhendo a melhor opção para este aparelho...</p>
        <div class="skeleton-block"></div>
      </div>
    </div>
  `;
  try {
    const analise = await analisarDispositivoParaIA();
    definirIAConfig({ lastDeviceProfile: analise.perfil.label }, true);
    popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="ai-wizard-cancel">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Modo ${escaparHtml(analise.perfil.label)}</h2>
            <button class="icon-button" type="button" data-action="ai-wizard-cancel" title="Fechar">✕</button>
          </div>
          <div class="sync-grid">
            <div class="metric"><span>Escolha</span><strong>${escaparHtml(analise.modelo?.name || "IA Local")}</strong></div>
            <div class="metric"><span>Uso</span><strong>${escaparHtml(analise.perfil.speed)}</strong></div>
            <div class="metric"><span>Ajuda</span><strong>${escaparHtml(analise.perfil.quality)}</strong></div>
            <div class="metric"><span>Espaço</span><strong>${Number(analise.modelo?.sizeMb || 0)} MB</strong></div>
          </div>
          <div class="actions">
            <button class="btn" type="button" data-action="ai-wizard-install" data-model-id="${escaparAttr(analise.modelo?.id || "lite")}">Instalar IA automaticamente</button>
            <button class="btn ghost" type="button" data-action="ai-wizard-cancel">Depois</button>
          </div>
        </div>
      </div>
    `;
  } catch (erro) {
    registrarFalhaIALocal("wizard_analyze", erro);
    mostrarToast("Não foi possível analisar o aparelho agora.", "erro", 5000);
    fecharPopup();
  }
}

async function instalarIAAutomatica(modelId = "lite") {
  fecharPopup();
  const ok = await baixarModeloIAOffline(modelId);
  if (ok) {
    definirIAConfig({ localEnabled: true, onboardingCompleted: true });
    assistantMode = "pro";
    mostrarToast("IA pronta para uso.", "sucesso", 4200);
  }
}

function usarAssistenteBasicoAgora(origem = "assistente") {
  fecharPopup();
  assistantMode = "basic";
  if (origem === "calculadora") {
    const contexto = montarContextoIAComercial().calculoRecente || {};
    mostrarSugestoesIACalculadora(gerarSugestoesCalculadoraBasicas(contexto), "Assistente básico com resumo seguro da calculadora.");
    return;
  }
  abrirAssistente("basic");
}

function montarContextoIAComercial() {
  const pedidosRecentes = pedidos.slice(-20);
  const produtos = new Map();
  pedidosRecentes.forEach((pedido) => {
    normalizarItensPedido(pedido).forEach((item) => {
      const nome = String(item.nome || "Item").slice(0, 50);
      produtos.set(nome, (produtos.get(nome) || 0) + Number(item.qtd || 1));
    });
  });
  const maisVendidos = [...produtos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, qtd]) => ({ nome, qtd }));
  const materiaisUsados = normalizarEstoque().slice(0, 8).map((item) => ({ nome: item.nome, qtd: item.qtd, tipo: item.tipo }));
  return {
    margemMedia: appConfig.defaultMargin || 0,
    produtosMaisVendidos: maisVendidos,
    materiaisMaisUsados: materiaisUsados,
    estoqueBaixo: materiaisUsados.filter((item) => Number(item.qtd) <= estoqueMinimoKg),
    pedidosPendentes: pedidos.filter((pedido) => !["entregue", "finalizado", "cancelado"].includes(String(pedido.status || ""))).length,
    calculoRecente: ultimoCalculo ? {
      pesoGramas: ultimoCalculo.peso,
      tempoHoras: ultimoCalculo.tempo,
      material: ultimoCalculo.materialNome,
      custoMaterial: ultimoCalculo.custoMaterial,
      custoEnergia: ultimoCalculo.custoEnergia,
      margem: appConfig.defaultMargin,
      precoFinal: ultimoCalculo.precoTotal,
      tipoPecaInformado: document.getElementById("nomeItem")?.value || "",
      observacoes: ""
    } : null
  };
}

function gerarSugestoesCalculadoraBasicas(contexto = montarContextoIAComercial().calculoRecente || {}) {
  const sugestoes = [];
  const margem = Number(contexto.margem || appConfig.defaultMargin || 0);
  const tempo = Number(contexto.tempoHoras || 0);
  const preco = Number(contexto.precoFinal || 0);
  if (margem < 80) sugestoes.push("Sua margem parece baixa. Confira se embalagem, retrabalho e tempo de atendimento entraram no preço.");
  if (tempo > 6) sugestoes.push("Peça com prazo longo: considere cobrar urgência ou combinar entrega com folga.");
  if (preco > 0) sugestoes.push("Ofereça embalagem simples ou kit com mais unidades para aumentar o ticket.");
  if (/chaveiro|pingente|tag/i.test(contexto.tipoPecaInformado || "")) sugestoes.push("Para chaveiro ou pingente, inclua argola, corrente ou embalagem no orçamento.");
  if (!contexto.material) sugestoes.push("Vincule um material do estoque para acompanhar custo e reposição com mais precisão.");
  if (!sugestoes.length) sugestoes.push("Preço calculado. Confira acabamento, embalagem e prazo antes de enviar ao cliente.");
  return sugestoes.slice(0, 5);
}

function getModeloIAOfflineAtivoInstalado(exigirToggle = true) {
  if (!podeUsarAssistenteIAOfflinePro()) return null;
  if (exigirToggle && getAIAssistantSettings().localEnabled !== true) return null;
  const settings = getAIAssistantSettings();
  const modelo = getAIModel(settings.activeModelId);
  const state = getAIModelLocalState(settings.activeModelId);
  const path = String(state.path || "").trim();
  if (!modelo || !path || !isAIModelReadyStatus(getAIModelStatus(settings.activeModelId)) || !state.runtimeValidatedAt) return null;
  return { modelo, state, path };
}

function buscarTrechosManualIA(texto = "") {
  const pergunta = normalizarTextoAssistente(texto);
  const topicos = [
    ["pedidos", "Pedidos: guarda cliente, telefone, itens, quantidades, subtotais, total geral, status e observações. Alterações devem ser revisadas antes de salvar."],
    ["estoque material materiais", "Estoque: registra materiais, quantidade, tipo e custo. Materiais podem ser usados pela calculadora."],
    ["caixa financeiro entrada saída", "Caixa: registra entradas, saídas e histórico financeiro. Alterações sensíveis exigem confirmação."],
    ["calculadora cálculo peso horas taxa", "Calculadora: calcula preço com material, peso, horas, quantidade, energia, margem e taxa extra. Peso, horas e taxa extra começam limpos em novo cálculo."],
    ["impressora impressoras", "Impressoras: podem compor o cálculo e organizar produção. Configurações fixas podem ser mantidas quando definidas."],
    ["plano planos pro free", "Planos: controlam acesso a recursos gratuitos e PRO. Recursos pagos precisam de validação de plano."],
    ["anúncio anuncios ads", "Anúncios: podem aparecer em fluxos permitidos do plano gratuito e usam integração nativa no Android quando disponível."],
    ["sincronização sincronizar supabase backup", "Sincronização: pode usar Supabase ou backups configurados, preserva dados locais offline e não deve forçar retorno para a tela inicial."],
    ["personalização logo fundo pdf", "Personalização: ajusta dados visuais e informações usadas nos PDFs, incluindo logo e fundo."],
    ["pdf orçamento orcamento", "PDF: pode ser gerado para pedidos e orçamentos usando os dados revisados."],
    ["superadmin segurança biometria senha", "Segurança e superadmin: ações sensíveis podem exigir senha administrativa ou biometria. A biometria tem validade curta e senha é fallback."]
  ];
  const encontrados = topicos
    .filter(([keywords]) => keywords.split(/\s+/).some((keyword) => pergunta.includes(normalizarTextoAssistente(keyword))))
    .map(([, trecho]) => trecho);
  return (encontrados.length ? encontrados : topicos.slice(0, 4).map(([, trecho]) => trecho)).slice(0, 3);
}

function montarPromptIAOffline(texto = "", contexto = {}) {
  const contextoSeguro = {
    tela: contexto.tela || telaAtual,
    pergunta: String(texto || "").slice(0, 300),
    dados: contexto.calculoRecente || contexto
  };
  const trechosManual = buscarTrechosManualIA(texto);
  return [
    "Manual relevante do Simplifica 3D:",
    trechosManual.join("\n"),
    "Contexto resumido:",
    JSON.stringify(contextoSeguro).slice(0, 700),
    "",
    "Pergunta:",
    String(texto || "").slice(0, 400)
  ].join("\n");
}

function promiseComTimeout(promise, timeoutMs, mensagem = "Tempo esgotado.") {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(mensagem)), Math.max(1000, Number(timeoutMs) || 8000));
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function gerarRespostaIAOffline(texto, contexto = montarContextoAssistenteEnxuto(texto), opcoes = {}) {
  if (!podeUsarAssistenteIAOfflinePro()) throw new Error("Assistente offline disponível apenas no Android com plano PRO ativo.");
  const ativo = getModeloIAOfflineAtivoInstalado();
  if (!ativo) throw new Error("Instale a IA local antes de usar.");
  const plugin = getAIPlugin();
  if (!plugin?.runAiPrompt) throw new Error("IA indisponível neste aparelho.");

  const result = await plugin.runAiPrompt({
    modelId: ativo.modelo.id,
    modelPath: ativo.path,
    systemPrompt: AI_OFFLINE_SYSTEM_PROMPT,
    prompt: montarPromptIAOffline(texto, contexto),
    maxTokens: Math.max(32, Math.min(Number(opcoes.maxTokens || 160) || 160, 256)),
    proAllowed: podeUsarAssistenteIAOfflinePro(),
    timeoutMs: Math.max(8000, Math.min(Number(opcoes.timeoutMs || 120000) || 120000, 240000))
  });
  const resposta = String(result?.text || "").trim();
  if (!resposta) throw new Error("O modelo offline não retornou resposta.");
  return resposta;
}

async function sugerirCalculadoraComIA() {
  if (!ultimoCalculo) {
    const calculou = calcular();
    if (!calculou) return;
  }
  const contexto = montarContextoIAComercial().calculoRecente || {};
  const settings = getAIAssistantSettings();
  const modelo = getAIModel(settings.activeModelId);
  let sugestoes = gerarSugestoesCalculadoraBasicas(contexto);
  let detalhesMotor = "Assistente básico com resumo seguro da calculadora.";
  if (podeUsarAssistenteIAOfflinePro() && !iaLocalEstaPronta()) {
    abrirModalIALocalNaoConfigurada("calculadora");
    return;
  }
  try {
    if (iaLocalEstaPronta()) {
      const resposta = await promiseComTimeout(
        gerarRespostaIAOffline("Sugira melhorias comerciais para este cálculo sem alterar o preço oficial.", { tela: "calculadora", calculoRecente: contexto }, { maxTokens: 140, timeoutMs: 60000 }),
        8000,
        "IA local demorou demais para responder."
      );
      sugestoes = resposta.split(/\n+/).map((linha) => linha.replace(/^[-*•\d.)\s]+/, "").trim()).filter(Boolean).slice(0, 6);
      if (!sugestoes.length) sugestoes = [resposta];
      detalhesMotor = `Modelo ativo: ${modelo?.name || "IA offline"}. Resposta gerada localmente no Android, sem internet.`;
    }
  } catch (erro) {
    detalhesMotor = "Não foi possível usar a IA agora. Mostrando sugestões básicas.";
    registrarFalhaIALocal("calculator_suggestion", erro);
  }
  mostrarSugestoesIACalculadora(sugestoes, detalhesMotor);
}

function mostrarSugestoesIACalculadora(sugestoes = [], detalhesMotor = "Assistente básico com resumo seguro da calculadora.") {
  const popup = document.getElementById("popup");
  if (!popup) {
    alert(sugestoes.join("\n"));
    return;
  }
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="ai-suggestion-close">
      <div class="modal-card">
        <div class="modal-header">
          <h2>✨ Sugestões com IA</h2>
          <button class="icon-button" type="button" data-action="ai-suggestion-close" title="Fechar">✕</button>
        </div>
        <p class="muted">${escaparHtml(detalhesMotor)}</p>
        <div class="history-list">
          ${sugestoes.map((item) => `<div class="history-item"><strong>${escaparHtml(item)}</strong></div>`).join("")}
        </div>
        <p class="muted">A IA não altera o preço oficial. Revise as sugestões antes de enviar ao cliente.</p>
        <div class="actions">
          <button class="btn" type="button" data-action="ai-suggestion-close">Entendi</button>
          <button class="btn ghost" type="button" onclick="trocarTela('config')">Gerenciar IA</button>
        </div>
      </div>
    </div>
  `;
}

function abrirModalIALocalNaoConfigurada(origem = "assistente") {
  const popup = document.getElementById("popup");
  if (!popup) {
    mostrarToast("IA local ainda não configurada.", "aviso", 5000);
    return;
  }
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="ai-setup-cancel">
      <div class="modal-card">
        <div class="modal-header">
          <h2>IA local ainda não configurada</h2>
          <button class="icon-button" type="button" data-action="ai-setup-cancel" title="Fechar">✕</button>
        </div>
        <p class="muted">Para usar a IA local, instale o modelo neste aparelho. Você também pode continuar com o assistente básico agora.</p>
        <div class="actions">
          <button class="btn" type="button" data-action="ai-setup-install" data-origin="${escaparAttr(origem)}">Instalar IA</button>
          <button class="btn secondary" type="button" data-action="ai-setup-basic" data-origin="${escaparAttr(origem)}">Usar assistente básico</button>
          <button class="btn ghost" type="button" data-action="ai-setup-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

function deveDirecionarBuscaParaAssistente(termo = "") {
  const texto = String(termo || "").trim();
  if (!texto) return false;
  return texto.includes("?") || /^(como|por que|porque|qual|quais|sugere|sugerir|me ajuda|ajuda|ia\b)/i.test(texto);
}

async function abrirAssistenteComPergunta(texto = "") {
  abrirAssistente("auto");
  await responderAssistente(texto);
}

async function responderAssistente(texto = "") {
  const pergunta = String(texto || "").trim();
  if (!pergunta) return;
  let contexto = {};
  try {
    contexto = montarContextoAssistenteEnxuto(pergunta);
  } catch (erro) {
    contexto = { tela: telaAtual, tarefa: pergunta };
    ErrorService.capture(erro, { area: "Assistente básico", action: "contexto", silent: true });
  }
  const usarIAPro = iaLocalEstaPronta();
  assistantMode = usarIAPro ? "pro" : "basic";
  assistantMessages.push({ role: "user", text: pergunta });
  const respostaPendente = {
    role: "assistant",
    text: usarIAPro ? "Iniciando IA..." : "Consultando orientações básicas..."
  };
  assistantMessages.push(respostaPendente);
  limitarMensagensAssistente();
  assistantGenerating = usarIAPro;
  renderApp();
  try {
    if (usarIAPro) {
      const carregou = await garantirRuntimeIAAtivo({ silent: true });
      if (!carregou) throw new Error("IA local não iniciou neste aparelho.");
      respostaPendente.text = "Gerando resposta local...";
      renderizarMensagemAssistentePendente(respostaPendente);
    }
    const resposta = usarIAPro
      ? await promiseComTimeout(
          gerarRespostaIAOffline(pergunta, contexto, { maxTokens: 128, timeoutMs: 240000 }),
          245000,
          "IA local demorou demais para responder."
        )
      : obterRespostaAssistente(pergunta, contexto);
    const respostaIndex = assistantMessages.indexOf(respostaPendente);
    if (respostaIndex >= 0) {
      assistantMessages[respostaIndex] = { role: "assistant", text: resposta };
    } else {
      assistantMessages.push({ role: "assistant", text: resposta });
    }
    if (usarIAPro && getAIAssistantSettings().ttsEnabled === true) {
      lerRespostaIAEmVoz(resposta);
    }
  } catch (erro) {
    registrarFalhaIALocal("chat_response", erro);
    const respostaIndex = assistantMessages.indexOf(respostaPendente);
    const fallback = {
      role: "assistant",
      text: obterRespostaAssistente(pergunta, contexto)
    };
    if (respostaIndex >= 0) {
      assistantMessages[respostaIndex] = fallback;
    } else {
      assistantMessages.push(fallback);
    }
  } finally {
    assistantGenerating = false;
  }
  limitarMensagensAssistente();
  renderApp();
  setTimeout(() => document.getElementById("assistantInput")?.focus(), 0);
}

function renderizarMensagemAssistentePendente(referencia) {
  const index = assistantMessages.indexOf(referencia);
  const body = document.querySelector(".assistant-body");
  if (!body || index < 0) return;
  const messages = body.querySelectorAll(".assistant-message");
  const el = messages[index];
  if (el) el.textContent = referencia.text || "";
}

async function cancelarGeracaoIAOffline() {
  assistantGenerating = false;
  try {
    await getAIPlugin()?.cancelAiGeneration?.();
    mostrarToast("Geração cancelada.", "info", 2500);
  } catch (_) {}
  renderApp();
}

async function iniciarEntradaVozIAPro() {
  if (!podeUsarVozIAPro()) {
    mostrarToast("Voz disponível apenas na IA local configurada.", "aviso", 4200);
    return;
  }
  assistantListening = true;
  renderApp();
  try {
    const result = await promiseComTimeout(
      getAIPlugin().startAiVoiceRecognition(),
      14000,
      "Tempo esgotado para reconhecimento de voz."
    );
    const texto = String(result?.text || "").trim();
    if (!texto) throw new Error("Não foi possível reconhecer sua fala.");
    assistantListening = false;
    renderApp();
    await responderAssistente(texto);
  } catch (erro) {
    assistantListening = false;
    registrarFalhaIALocal("voice_recognition", erro);
    mostrarToast("Não foi possível reconhecer sua fala.", "aviso", 4200);
    renderApp();
  }
}

async function cancelarEntradaVozIAPro() {
  assistantListening = false;
  try {
    await getAIPlugin()?.stopAiVoiceRecognition?.();
  } catch (erro) {
    registrarFalhaIALocal("voice_cancel", erro);
  }
  renderApp();
}

async function lerRespostaIAEmVoz(texto = "") {
  const settings = getAIAssistantSettings();
  if (!settings.ttsEnabled || !getAIPlugin()?.speakAiText) return;
  try {
    await getAIPlugin().speakAiText({ text: String(texto || "").slice(0, 700), rate: settings.ttsRate || 1 });
  } catch (erro) {
    registrarFalhaIALocal("tts", erro);
  }
}

async function enviarMensagemAssistente(event) {
  event?.preventDefault?.();
  const input = document.getElementById("assistantInput");
  const texto = (input?.value || "").trim();
  if (!texto) return;
  if (input) input.value = "";
  await responderAssistente(texto);
}

function renderAssistenteVirtual() {
  if (!podeMostrarControlesFlutuantes()) return "";
  const modoDisponivel = getAssistenteModoDisponivel();

  if (!assistantOpen) {
    if (modoDisponivel !== "pro") return "";
    const label = modoDisponivel === "pro" ? "IA" : "Assistente";
    return `<button class="assistant-fab" onclick="abrirAssistente('${escaparAttr(modoDisponivel)}')" title="Assistente inteligente">${renderAssistantFabContent(label, modoDisponivel === "pro")}</button>`;
  }

  if (assistantMinimized) {
    if (assistantMode !== "pro") return "";
    const label = assistantMode === "pro" ? "IA" : "Assistente";
    return `
      <button class="assistant-fab assistant-fab-open" onclick="abrirAssistente('${escaparAttr(assistantMode || modoDisponivel)}')" title="Abrir assistente">
        ${renderAssistantFabContent(label, assistantMode === "pro")}
      </button>
    `;
  }

  const settings = getAIAssistantSettings();
  const modeloAtivo = getAIModel(settings.activeModelId);
  const subtituloAssistente = assistantMode === "pro" && modeloAtivo
    ? assistantRuntimeLoading ? "Iniciando IA..." : `${modeloAtivo.name} offline`
    : "Assistente básico";
  const podeMostrarMicrofone = podeUsarVozIAPro();
  const envioBloqueado = assistantGenerating || assistantListening || (assistantMode === "pro" && assistantRuntimeLoading);

  const mensagens = assistantMessages.map((msg) => `
    <div class="assistant-message ${msg.role === "user" ? "assistant-user" : "assistant-bot"}">
      ${escaparHtml(msg.text)}
    </div>
  `).join("");

  const painel = `
    <section class="assistant-panel" aria-label="Assistente virtual local">
      <div class="assistant-header">
        <div>
          <strong>Assistente Simplifica 3D</strong>
          <span>${escaparHtml(subtituloAssistente)}</span>
        </div>
        <div class="row-actions">
          ${assistantGenerating ? `<button class="icon-button warning" onclick="cancelarGeracaoIAOffline()" title="Cancelar geração">⏹</button>` : ""}
        </div>
      </div>
      <div class="assistant-body">${mensagens}</div>
      ${assistantListening ? `
        <div class="assistant-voice-status" aria-live="polite">
          <span class="voice-wave"></span>
          <strong>Ouvindo...</strong>
          <span>Fale sua pergunta em português.</span>
        </div>
      ` : assistantRuntimeLoading ? `
        <div class="assistant-voice-status processing" aria-live="polite">
          <span class="voice-wave"></span>
          <strong>Iniciando IA...</strong>
          <span>Você já pode digitar. O envio libera quando a IA estiver pronta.</span>
        </div>
      ` : assistantGenerating ? `
        <div class="assistant-voice-status processing" aria-live="polite">
          <span class="voice-wave"></span>
          <strong>Processando...</strong>
          <span>Preparando resposta.</span>
        </div>
      ` : ""}
      <form class="assistant-form" onsubmit="enviarMensagemAssistente(event)">
        <input id="assistantInput" placeholder="${assistantMode === "pro" ? "Pergunte para a IA..." : "Pergunte sobre pedido, estoque, PDF..."}" autocomplete="off">
        ${podeMostrarMicrofone ? `<button class="assistant-mic-button ${assistantListening ? "warning" : ""}" type="button" onclick="${assistantListening ? "cancelarEntradaVozIAPro()" : "iniciarEntradaVozIAPro()"}" title="${assistantListening ? "Cancelar fala" : "Falar com a IA"}">🎙</button>` : ""}
        <button class="btn" type="submit" ${envioBloqueado ? "disabled" : ""}>Enviar</button>
      </form>
    </section>
  `;
  return `<div class="assistant-backdrop" onclick="minimizarAssistente()" aria-hidden="true"></div>${painel}`;
}

function getDashboardLayout() {
  const ids = dashboardWidgets.map((item) => item.id);
  const layout = appConfig.dashboardLayout && typeof appConfig.dashboardLayout === "object" ? appConfig.dashboardLayout : {};
  const order = Array.isArray(layout.order) ? layout.order.filter((id) => ids.includes(id)) : [];
  ids.forEach((id) => {
    if (!order.includes(id)) order.push(id);
  });

  const sizes = { ...dashboardDefaultSizes, ...(layout.sizes || {}) };
  ids.forEach((id) => {
    if (!["s", "m", "l", "xl"].includes(sizes[id])) sizes[id] = dashboardDefaultSizes[id] || "m";
  });

  const windows = { ...dashboardDefaultWindows, ...(layout.windows || {}) };
  ids.forEach((id) => {
    windows[id] = normalizarJanelaDashboard(windows[id] || dashboardDefaultWindows[id]);
  });

  return {
    mode: layout.mode === "free" ? "free" : "tiles",
    order,
    sizes,
    windows
  };
}

function normalizarTamanhoDashboard(tamanho) {
  return dashboardSizeConfig[tamanho] ? tamanho : "m";
}

function normalizarJanelaDashboard(janela = {}) {
  return {
    x: Math.max(0, Number(janela.x) || 0),
    y: Math.max(0, Number(janela.y) || 0),
    w: Math.min(2400, Math.max(280, Number(janela.w) || 380)),
    h: Math.min(1600, Math.max(230, Number(janela.h) || 320)),
    z: Math.max(1, Number(janela.z) || 1)
  };
}

function getMaiorZDashboard(layout = getDashboardLayout()) {
  return Object.values(layout.windows || {}).reduce((maior, janela) => Math.max(maior, Number(janela.z) || 1), 1);
}

function salvarDashboardLayout(layout) {
  appConfig.dashboardLayout = layout;
  salvarDados();
}

function renderDashboardOrganizavel() {
  const layout = getDashboardLayout();
  if (layout.mode === "tiles") {
    return renderDashboardJanelas(layout);
  }

  return `
    <div class="desktop-grid dashboard-grid">
      ${layout.order.map((id) => renderDashboardWidget(id, layout.sizes[id])).join("")}
    </div>
  `;
}

function renderDashboardJanelas(layout = getDashboardLayout()) {
  const workspaceHeight = Math.max(420, Math.round((window.innerHeight || 900) - 105));

  return `
    <div class="window-workspace tile-workspace" style="min-height:${workspaceHeight}px">
      ${layout.order.map((id) => renderDashboardJanela(id, layout.windows[id], layout.sizes[id])).join("")}
    </div>
  `;
}

function renderDashboardJanela(id, janela, tamanho = "m") {
  const item = dashboardWidgets.find((widget) => widget.id === id);
  const pos = normalizarJanelaDashboard(janela || dashboardDefaultWindows[id]);
  const tamanhoNormalizado = normalizarTamanhoDashboard(tamanho);
  const altura = Math.max(dashboardSizeConfig[tamanhoNormalizado].minHeight, pos.h || 320);
  if (!item) return "";

  return `
    <section class="dashboard-window window-size-${tamanhoNormalizado}" data-widget="${id}" ondragover="permitirSoltarWidget(event)" ondragleave="sairSoltarWidget(event)" ondrop="soltarWidget(event, '${id}')" style="--window-min-height:${altura}px">
      <div class="window-titlebar" draggable="true" ondragstart="iniciarArrasteWidget(event, '${id}')" title="Arrastar para reorganizar">
        <div class="window-title">
          <span>${item.icone}</span>
          <strong>${item.titulo}</strong>
        </div>
        <div class="window-actions">
          <button class="icon-button" onclick="alterarTamanhoWidget('${id}', -1)" title="Diminuir janela">−</button>
          <button class="icon-button" onclick="alterarTamanhoWidget('${id}', 1)" title="Aumentar janela">+</button>
        </div>
      </div>
      <div class="window-content">
        ${renderDashboardWidgetConteudo(id)}
      </div>
      <div class="window-resize-handle" onpointerdown="iniciarRedimensionarJanelaDashboard(event, '${id}')" title="Redimensionar"></div>
    </section>
  `;
}

function renderDashboardWidget(id, tamanho = "m") {
  const item = dashboardWidgets.find((widget) => widget.id === id);
  if (!item) return "";

  return `
    <div class="dashboard-widget widget-size-${tamanho}" data-widget="${id}" ondragover="permitirSoltarWidget(event)" ondragleave="sairSoltarWidget(event)" ondrop="soltarWidget(event, '${id}')">
      <div class="widget-toolbar" aria-label="Organizar bloco">
        <button class="icon-button widget-drag-handle" draggable="true" ondragstart="iniciarArrasteWidget(event, '${id}')" title="Arrastar bloco">☰</button>
        <button class="icon-button" onclick="moverWidget('${id}', -1)" title="Mover para antes">↑</button>
        <button class="icon-button" onclick="moverWidget('${id}', 1)" title="Mover para depois">↓</button>
        <button class="icon-button" onclick="alterarTamanhoWidget('${id}')" title="Alterar tamanho">↔</button>
      </div>
      ${renderDashboardWidgetConteudo(id)}
    </div>
  `;
}

function renderDashboardWidgetConteudo(id) {
  switch (id) {
    case "pedido":
      return renderPedido();
    case "estoque":
      return renderEstoque();
    case "pedidos":
      return renderListaPedidos();
    case "caixa":
      return renderCaixa();
    default:
      return renderDashboard();
  }
}

function getWorkspaceDashboard() {
  return document.querySelector(".window-workspace");
}

function ajustarJanelasDashboardAoWorkspace(salvar = false) {
  const workspace = getWorkspaceDashboard();
  if (!workspace) return;
  if (workspace.classList.contains("tile-workspace")) return;

  const larguraWorkspace = Math.max(300, workspace.clientWidth || workspace.getBoundingClientRect().width || 0);
  const layout = getDashboardLayout();
  let alterou = false;

  layout.order.forEach((id) => {
    const atual = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
    const larguraMaxima = Math.max(280, larguraWorkspace - 8);
    const largura = Math.min(atual.w, larguraMaxima);
    const xMaximo = Math.max(0, larguraWorkspace - largura - 8);
    const x = Math.min(Math.max(0, atual.x), xMaximo);
    const proxima = { ...atual, x, w: largura };

    if (proxima.x !== atual.x || proxima.w !== atual.w) {
      alterou = true;
      layout.windows[id] = proxima;
      const el = document.querySelector(`.dashboard-window[data-widget="${id}"]`);
      if (el) {
        el.style.left = `${proxima.x}px`;
        el.style.width = `${proxima.w}px`;
      }
    }
  });

  if (!alterou) return;
  appConfig.dashboardLayout = layout;
  if (salvar) salvarDados();
}

function atualizarJanelaDashboard(id, valores) {
  const layout = getDashboardLayout();
  const atual = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
  const proxima = normalizarJanelaDashboard({ ...atual, ...valores });
  layout.windows[id] = proxima;
  appConfig.dashboardLayout = layout;

  const el = document.querySelector(`.dashboard-window[data-widget="${id}"]`);
  if (el) {
    el.style.left = `${proxima.x}px`;
    el.style.top = `${proxima.y}px`;
    el.style.width = `${proxima.w}px`;
    el.style.height = `${proxima.h}px`;
    el.style.zIndex = proxima.z;
  }
}

function atualizarJanelaDashboardEncaixada(id, tamanho, altura) {
  const layout = getDashboardLayout();
  const tamanhoNormalizado = normalizarTamanhoDashboard(tamanho);
  const atual = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
  const alturaMinima = dashboardSizeConfig[tamanhoNormalizado].minHeight;
  const proxima = normalizarJanelaDashboard({
    ...atual,
    h: Math.min(1200, Math.max(alturaMinima, altura || atual.h))
  });

  layout.sizes[id] = tamanhoNormalizado;
  layout.windows[id] = proxima;
  appConfig.dashboardLayout = layout;

  const el = document.querySelector(`.dashboard-window[data-widget="${id}"]`);
  if (el) {
    Object.keys(dashboardSizeConfig).forEach((classe) => el.classList.remove(`window-size-${classe}`));
    el.classList.add(`window-size-${tamanhoNormalizado}`);
    el.style.setProperty("--window-min-height", `${Math.max(alturaMinima, proxima.h)}px`);
  }
}

function trazerJanelaFrente(id) {
  const layout = getDashboardLayout();
  const janela = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
  janela.z = getMaiorZDashboard(layout) + 1;
  salvarDashboardLayout({
    ...layout,
    windows: {
      ...layout.windows,
      [id]: janela
    }
  });
  renderApp();
}

function iniciarMoverJanelaDashboard(event, id) {
  if (event.target.closest("button, input, select, textarea, a")) return;
  const workspace = getWorkspaceDashboard();
  const janelaEl = document.querySelector(`.dashboard-window[data-widget="${id}"]`);
  if (!workspace || !janelaEl) return;
  if (workspace.classList.contains("tile-workspace")) return;

  const layout = getDashboardLayout();
  const janela = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
  janela.z = getMaiorZDashboard(layout) + 1;
  layout.windows[id] = janela;
  appConfig.dashboardLayout = layout;

  dashboardWindowAction = {
    tipo: "move",
    id,
    startX: event.clientX,
    startY: event.clientY,
    original: janela,
    workspaceRect: workspace.getBoundingClientRect()
  };

  janelaEl.setPointerCapture?.(event.pointerId);
  janelaEl.classList.add("is-moving");
  event.preventDefault();
}

function iniciarRedimensionarJanelaDashboard(event, id) {
  const workspace = getWorkspaceDashboard();
  const janelaEl = document.querySelector(`.dashboard-window[data-widget="${id}"]`);
  if (!workspace || !janelaEl) return;

  const layout = getDashboardLayout();
  const janela = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
  janela.z = getMaiorZDashboard(layout) + 1;
  layout.windows[id] = janela;
  appConfig.dashboardLayout = layout;
  const modoEncaixado = workspace.classList.contains("tile-workspace");

  dashboardWindowAction = {
    tipo: modoEncaixado ? "tileResize" : "resize",
    id,
    startX: event.clientX,
    startY: event.clientY,
    startSize: normalizarTamanhoDashboard(layout.sizes[id]),
    original: janela,
    workspaceRect: workspace.getBoundingClientRect()
  };

  janelaEl.setPointerCapture?.(event.pointerId);
  janelaEl.classList.add("is-resizing");
  event.preventDefault();
}

function moverJanelaDashboard(event) {
  if (!dashboardWindowAction) return;

  const { tipo, id, startX, startY, startSize, original, workspaceRect } = dashboardWindowAction;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  const maxX = Math.max(0, workspaceRect.width - original.w - 8);

  if (tipo === "tileResize") {
    const ciclo = ["s", "m", "l", "xl"];
    const indiceAtual = Math.max(0, ciclo.indexOf(startSize || "m"));
    const passos = Math.round(dx / 150);
    const indiceNovo = Math.min(ciclo.length - 1, Math.max(0, indiceAtual + passos));
    atualizarJanelaDashboardEncaixada(id, ciclo[indiceNovo], original.h + dy);
    event.preventDefault();
    return;
  }

  if (tipo === "move") {
    atualizarJanelaDashboard(id, {
      x: Math.min(maxX, Math.max(0, original.x + dx)),
      y: Math.max(0, original.y + dy),
      z: original.z
    });
    event.preventDefault();
    return;
  }

  const maxW = Math.max(300, workspaceRect.width - original.x - 8);
  atualizarJanelaDashboard(id, {
    w: Math.min(maxW, Math.max(280, original.w + dx)),
    h: Math.min(1600, Math.max(230, original.h + dy)),
    z: original.z
  });
  event.preventDefault();
}

function finalizarJanelaDashboard() {
  if (!dashboardWindowAction) return;

  document.querySelectorAll(".dashboard-window.is-moving, .dashboard-window.is-resizing").forEach((el) => {
    el.classList.remove("is-moving", "is-resizing");
  });
  salvarDados();
  dashboardWindowAction = null;
}

function centralizarJanelaDashboard(id) {
  const workspace = getWorkspaceDashboard();
  const layout = getDashboardLayout();
  const janela = normalizarJanelaDashboard(layout.windows[id] || dashboardDefaultWindows[id]);
  const largura = workspace?.clientWidth || window.innerWidth || 1200;
  const x = Math.max(0, Math.round((largura - janela.w) / 2));
  const y = Math.max(0, Math.round((window.scrollY || 0) - (workspace?.getBoundingClientRect().top || 0) + 30));
  janela.x = x;
  janela.y = y;
  janela.z = getMaiorZDashboard(layout) + 1;
  salvarDashboardLayout({
    ...layout,
    windows: {
      ...layout.windows,
      [id]: janela
    }
  });
  renderApp();
}

function iniciarArrasteWidget(event, id) {
  event.dataTransfer.setData("text/plain", id);
  event.dataTransfer.effectAllowed = "move";
}

function permitirSoltarWidget(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function sairSoltarWidget(event) {
  event.currentTarget.classList.remove("drag-over");
}

function soltarWidget(event, destino) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
  const origem = event.dataTransfer.getData("text/plain");
  if (!origem || origem === destino) return;

  const layout = getDashboardLayout();
  const order = layout.order.filter((id) => id !== origem);
  const indiceDestino = order.indexOf(destino);
  order.splice(indiceDestino < 0 ? order.length : indiceDestino, 0, origem);
  salvarDashboardLayout({ ...layout, order });
  renderApp();
}

function moverWidget(id, direcao) {
  const layout = getDashboardLayout();
  const indice = layout.order.indexOf(id);
  const novoIndice = indice + direcao;
  if (indice < 0 || novoIndice < 0 || novoIndice >= layout.order.length) return;

  const order = [...layout.order];
  [order[indice], order[novoIndice]] = [order[novoIndice], order[indice]];
  salvarDashboardLayout({ ...layout, order });
  renderApp();
}

function alterarTamanhoWidget(id, direcao = 1) {
  const layout = getDashboardLayout();
  const ciclo = ["s", "m", "l", "xl"];
  const atual = layout.sizes[id] || "m";
  const indiceAtual = Math.max(0, ciclo.indexOf(atual));
  const proximoIndice = Math.min(ciclo.length - 1, Math.max(0, indiceAtual + direcao));
  const proximo = ciclo[proximoIndice] || "m";
  salvarDashboardLayout({
    ...layout,
    sizes: {
      ...layout.sizes,
      [id]: proximo
    }
  });
  renderApp();
}

function restaurarLayoutDashboard() {
  appConfig.dashboardLayout = {
    mode: "tiles",
    order: dashboardWidgets.map((item) => item.id),
    sizes: { ...dashboardDefaultSizes },
    windows: JSON.parse(JSON.stringify(dashboardDefaultWindows))
  };
  salvarDados();
  fecharPopup();
  renderApp();
}

function renderMenuLateral() {
  const recolhido = !!appConfig.sidebarCollapsed;
  const grupos = getMenuGroups();

  return `
    <aside class="side-menu ${recolhido ? "is-collapsed" : ""}" aria-label="Menu lateral">
      ${renderCabecalhoMenuLateral({ recolhido })}
      ${renderPerfilMenuLateral()}
      ${grupos.map((grupo) => `
        <div class="side-section">
          <span>${escaparHtml(grupo.titulo)}</span>
          ${grupo.itens.map(renderBotaoLateral).join("")}
        </div>
      `).join("")}
    </aside>
  `;
}

function renderCabecalhoMenuLateral({ recolhido = false, drawer = false } = {}) {
  const tituloBotao = drawer ? "Fechar menu" : (recolhido ? "Mostrar menu" : "Esconder menu");
  const acaoBotao = drawer ? "fecharDrawerLateral()" : "alternarMenuLateral()";
  const iconeBotao = drawer ? "✕" : "☰";

  return `
    <div class="side-brand side-brand-official ${drawer ? "drawer-brand" : ""}">
      <button class="icon-button side-menu-toggle" onclick="${acaoBotao}" title="${tituloBotao}">${iconeBotao}</button>
      ${renderMarcaOficialProjeto("side-brand-mark", "Simplifica 3D", "icon")}
      <span class="side-brand-copy">
        <strong>SIMPLIFICA 3D</strong>
        <small>Organize seus pedidos sem complicação</small>
      </span>
    </div>
  `;
}

function renderPerfilMenuLateral() {
  const usuario = getUsuarioAtual();
  const plano = getPlanoAtual(usuario);
  const nome = appConfig.businessName || usuario?.nome || usuario?.email || "Perfil";
  const email = usuario?.email || syncConfig.supabaseEmail || "Conta ativa";
  const status = licencaEfetivaBloqueada(usuario) ? "Bloqueado" : plano.nome || "Free";
  const empresaLogo = appConfig.companyLogoDataUrl || appConfig.brandLogoDataUrl || "";

  return `
    <div class="side-profile-card premium-profile-trigger" role="button" tabindex="0"
      onclick="abrirPerfilPremiumPainel(event)"
      onkeydown="if(event.key === 'Enter' || event.key === ' '){abrirPerfilPremiumPainel(event)}"
      onpointerdown="iniciarPressPerfil(event)"
      onpointermove="moverPressPerfil(event)"
      onpointerup="finalizarPressPerfil(event)"
      onpointercancel="cancelarPressPerfil()"
      title="Abrir perfil e personalização">
      <div class="side-profile-photo-stack">
        ${renderUsuarioAvatar(usuario, "side-profile-avatar")}
        ${empresaLogo ? `<img class="side-company-logo" src="${escaparAttr(empresaLogo)}" alt="Logo da empresa">` : ""}
      </div>
      <span class="side-profile-meta">
        <strong>${escaparHtml(nome)}</strong>
        <small>${escaparHtml(usuario?.nome || email)}</small>
        <small class="side-profile-status">${escaparHtml(plano.descricao || "Assinatura ativa")}</small>
      </span>
      <button class="status-badge profile-plan-link ${classeStatusPlano(plano.status)}" type="button" onclick="event.stopPropagation(); abrirTelaPlanosPerfil()">
        ${escaparHtml(status)}
      </button>
    </div>
  `;
}

function abrirTelaPlanosPerfil() {
  fecharPopup();
  trocarTela("assinatura");
}

function getUsuariosContaAtiva() {
  const atual = getUsuarioAtual();
  const clientId = atual?.clientId || billingConfig.clientId || "";
  const companyId = atual?.companyId || billingConfig.companyId || "";
  return normalizarUsuarios(usuarios)
    .filter((usuario) => usuario.ativo !== false && !usuario.bloqueado)
    .filter((usuario) => {
      if (clientId) return String(usuario.clientId || "") === String(clientId);
      if (companyId) return String(usuario.companyId || "") === String(companyId);
      return usuario.email === atual?.email;
    });
}

function iniciarPressPerfil(event) {
  profileLongPressState = {
    x: event.clientX,
    y: event.clientY,
    moved: false,
    triggered: false,
    timer: setTimeout(() => {
      const perfis = getUsuariosContaAtiva();
      if (perfis.length <= 1) return;
      profileLongPressState.triggered = true;
      window.__profileLongPressLock = Date.now();
      abrirSeletorUsuariosPerfil(perfis);
    }, 520)
  };
  event.currentTarget?.classList.add("is-pressing");
}

function moverPressPerfil(event) {
  if (!profileLongPressState) return;
  const dx = Math.abs(event.clientX - profileLongPressState.x);
  const dy = Math.abs(event.clientY - profileLongPressState.y);
  if (dx > 10 || dy > 10) {
    profileLongPressState.moved = true;
    cancelarPressPerfil();
  }
}

function finalizarPressPerfil(event) {
  const estado = profileLongPressState;
  cancelarPressPerfil(event?.currentTarget);
  if (estado?.triggered) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }
}

function cancelarPressPerfil(elemento = document.querySelector(".premium-profile-trigger")) {
  if (profileLongPressState?.timer) clearTimeout(profileLongPressState.timer);
  profileLongPressState = null;
  elemento?.classList?.remove("is-pressing");
}

function abrirPerfilPremiumPainel(event) {
  event?.preventDefault?.();
  if (Date.now() - Number(window.__profileLongPressLock || 0) < 700) return;
  const popup = document.getElementById("popup");
  if (!popup) return;
  const usuario = getUsuarioAtual();
  const plano = getPlanoAtual(usuario);
  const pro = temAcessoCompleto();
  const empresaLogo = appConfig.companyLogoDataUrl || appConfig.brandLogoDataUrl || "";
  popup.innerHTML = `
    <div class="modal-backdrop profile-panel-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card profile-premium-panel modal-enter" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Perfil e personalização</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="profile-hero-card">
          <div class="profile-photo-large">
            ${renderUsuarioAvatar(usuario, "profile-photo-large-img")}
          </div>
          <div>
            <span class="eyebrow">${escaparHtml(appConfig.businessName || "Simplifica 3D")}</span>
            <h3>${escaparHtml(usuario?.nome || usuario?.email || "Usuário")}</h3>
            <button class="profile-plan-inline ${classeStatusPlano(plano.status)}" type="button" onclick="abrirTelaPlanosPerfil()">${escaparHtml(plano.nome || "Free")}</button>
            <p>${escaparHtml(plano.descricao || "Plano ativo")}</p>
          </div>
          ${empresaLogo ? `<img class="profile-company-large" src="${escaparAttr(empresaLogo)}" alt="Logo da empresa">` : ""}
        </div>
        <div class="profile-info-grid">
          <div class="metric"><span>E-mail</span><strong>${escaparHtml(usuario?.email || syncConfig.supabaseEmail || "-")}</strong></div>
          <div class="metric"><span>Empresa</span><strong>${escaparHtml(appConfig.businessName || "-")}</strong></div>
          <div class="metric"><span>Usuários</span><strong>${getUsuariosContaAtiva().length || 1}</strong></div>
          <div class="metric"><span>Status</span><strong>${escaparHtml(plano.descricao || plano.nome || "Free")}</strong></div>
        </div>
        <div class="profile-customization-grid">
          <button class="profile-option" type="button" onclick="abrirPersonalizacaoDoPerfil('avatar')">
            <strong>Foto e logo</strong><span>Usuário e empresa</span>
          </button>
          <button class="profile-option ${pro ? "" : "locked"}" type="button" onclick="abrirPersonalizacaoDoPerfil('pdf')">
            <strong>Personalizar PDF</strong><span>${pro ? "Logo, fundo e marca d'água" : "Disponível no PRO"}</span>
          </button>
          <button class="profile-option ${pro ? "" : "locked"}" type="button" onclick="abrirPersonalizacaoDoPerfil('theme')">
            <strong>Cores do app</strong><span>${pro ? "Tema e transparência" : "Disponível no PRO"}</span>
          </button>
          <button class="profile-option ${pro ? "" : "locked"}" type="button" onclick="abrirPersonalizacaoDoPerfil('login')">
            <strong>Tela de login</strong><span>${pro ? "Fundo e mensagem" : "Disponível no PRO"}</span>
          </button>
        </div>
        <div class="actions">
          <button class="btn secondary" type="button" onclick="abrirTelaPlanosPerfil()">Ver planos</button>
          <button class="btn" type="button" onclick="abrirPersonalizacaoDoPerfil('all')">Personalizar</button>
        </div>
      </section>
    </div>
  `;
}

function abrirPersonalizacaoDoPerfil(tipo = "all") {
  if (!temAcessoCompleto() && ["pdf", "theme", "login", "all"].includes(tipo)) {
    fecharPopup();
    trocarTela("assinatura");
    mostrarToast("Personalização avançada disponível no PRO.", "info", 3200);
    return;
  }
  fecharPopup();
  trocarTela("personalizacao");
}

function abrirSeletorUsuariosPerfil(perfis = getUsuariosContaAtiva()) {
  if (!Array.isArray(perfis) || perfis.length <= 1) return;
  const popup = document.getElementById("popup");
  if (!popup) return;
  const atual = getUsuarioAtual();
  popup.innerHTML = `
    <div class="modal-backdrop profile-switch-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card profile-switch-panel glass-pop" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Trocar usuário</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="profile-carousel-3d">
          ${perfis.map((usuario, index) => `
            <button class="profile-carousel-card ${usuario.email === atual?.email ? "active" : ""}" type="button" style="--i:${index - 1}" onclick="selecionarUsuarioPerfil('${escaparAttr(usuario.id)}')">
              ${renderUsuarioAvatar(usuario, "profile-carousel-avatar")}
              <strong>${escaparHtml(usuario.nome || usuario.email)}</strong>
              <span>${escaparHtml(usuario.papel || "user")}</span>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function selecionarUsuarioPerfil(id) {
  const usuario = normalizarUsuarios(usuarios).find((item) => String(item.id) === String(id));
  if (!usuario) return;
  const mesmoAuth = !usuario.supabaseUserId || !syncConfig.supabaseUserId || String(usuario.supabaseUserId) === String(syncConfig.supabaseUserId);
  if (!mesmoAuth) {
    fecharPopup();
    mostrarToast("Para trocar de conta com segurança, saia e entre com o outro usuário.", "info", 4500);
    return;
  }
  usuarioAtualEmail = usuario.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  registrarAtividadeUsuarioAtual("profile-switch", true);
  fecharPopup();
  renderApp();
}

function getMenuGroups() {
  const grupos = [
    {
      titulo: "Dashboard",
      itens: [
        { tela: "dashboard", icone: "📊", texto: "Dashboard" },
        { tela: "calculadora", icone: "🧮", texto: "Calculadora 3D" }
      ]
    },
    {
      titulo: "Operação",
      itens: [
        { tela: "pedidos", icone: "📋", texto: "Pedidos" },
        { tela: "producao", icone: "🖨️", texto: "Produção" },
        { tela: "estoque", icone: "📦", texto: "Estoque" }
      ]
    },
    {
      titulo: "Clientes",
      itens: [
        { tela: "clientes", icone: "👥", texto: isSuperAdmin() ? "Clientes SaaS" : "Clientes" }
      ]
    },
    {
      titulo: "Financeiro",
      itens: [
        { tela: "caixa", icone: "💰", texto: "Caixa" },
        { tela: "relatorios", icone: "📈", texto: "Relatórios" },
        { tela: "assinatura", icone: "💳", texto: "Planos" }
      ]
    },
    {
      titulo: "Configurações",
      itens: [
        { tela: "empresa", icone: "🏢", texto: "Empresa" },
        { tela: "config", icone: "⚙️", texto: "Configurações" },
        { tela: "backup", icone: "☁️", texto: "Backup" },
        { tela: "preferencias", icone: "🎛️", texto: "Preferências" },
        { tela: "conta", icone: "👤", texto: "Conta" },
        { tela: "seguranca", icone: "🔒", texto: "Segurança" },
        { tela: "feedback", icone: "💡", texto: "Ajuda" },
        { tela: "sobre", icone: "ℹ️", texto: "Sobre" }
      ]
    }
  ];

  const usuarioMenu = getUsuarioAtual();
  if (!usuarioMenu || podeGerenciarUsuarios()) {
    grupos.push({
      titulo: "Admin",
      itens: [
        { tela: "usuarios", icone: "🔐", texto: "Usuários" },
        { tela: "planos", icone: "💳", texto: "Planos" }
      ]
    });
  }

  if (isSuperAdmin()) {
    grupos.push({
      titulo: "Super Admin",
      itens: [
        { tela: "superadmin", icone: "🛡️", texto: "Super Admin" }
      ]
    });
  }

  return grupos.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => canAccessScreen(item.tela))
  })).filter((grupo) => grupo.itens.length);
}

function renderBotaoLateral(item) {
  return `
    <button class="side-nav-button" data-tela="${item.tela}" onclick="abrirTelaMenuLateral('${item.tela}')" title="${escaparAttr(item.texto)}">
      <span>${item.icone}</span>
      <strong>${item.texto}</strong>
    </button>
  `;
}

function alternarMenuLateral() {
  appConfig.sidebarCollapsed = !appConfig.sidebarCollapsed;
  salvarDados();
  fecharPopup();
  renderApp();
}

function abrirTelaMenuLateral(tela) {
  fecharPopup();
  trocarTela(tela);
}

function getItensMenuPopup() {
  return getMenuGroups().flatMap((grupo) => grupo.itens.map((item) => ({ ...item, grupo: grupo.titulo })));
}

function renderDrawerLateral({ progress = 1, dragging = false } = {}) {
  const itens = getItensMenuPopup();
  const grupos = getMenuGroups().map((grupo) => grupo.titulo);
  const progresso = Math.min(1, Math.max(0, Number(progress) || 0));
  return `
    <div class="side-drawer-backdrop ${dragging ? "is-dragging" : ""}" role="dialog" aria-modal="true" aria-label="Menu do aplicativo" onclick="fecharDrawerLateral()" style="--drawer-progress:${progresso}">
      <aside class="side-menu side-drawer" onclick="event.stopPropagation()" style="--drawer-progress:${progresso}; transform:translate3d(${((progresso - 1) * 100).toFixed(1)}%,0,0)">
        ${renderCabecalhoMenuLateral({ drawer: true })}
        ${renderPerfilMenuLateral()}
        ${grupos.map((grupo) => `
          <div class="side-section">
            <span>${grupo}</span>
            ${itens.filter((item) => item.grupo === grupo).map(renderBotaoLateral).join("")}
          </div>
        `).join("")}
      </aside>
    </div>
  `;
}

function abrirDrawerLateral(origem = "menu", progress = 1, dragging = false) {
  const popup = document.getElementById("popup");
  if (!popup || !getUsuarioAtual()) return;
  sideDrawerOpen = true;
  sideDrawerProgress = Math.min(1, Math.max(0, Number(progress) || 0));
  popup.innerHTML = renderDrawerLateral({ progress: sideDrawerProgress, dragging });
  atualizarMenu();
}

function fecharDrawerLateral() {
  sideDrawerOpen = false;
  sideDrawerProgress = 0;
  fecharPopup();
}

function abrirMenuPopup() {
  if (!isMobile()) {
    alternarMenuLateral();
    return;
  }
  abrirDrawerLateral("button");
}

function abrirTelaMenuPopup(tela) {
  fecharPopup();
  trocarTela(tela);
}

function alvoInterativoDrawer(event) {
  const alvo = event.target;
  return !!alvo?.closest?.("input, textarea, select, button, a, .calc-widget-window, .modal-card");
}

function atualizarProgressoDrawer(progresso) {
  const popup = document.getElementById("popup");
  if (!popup) return;
  const valor = Math.min(1, Math.max(0, progresso));
  sideDrawerProgress = valor;
  if (!popup.querySelector(".side-drawer")) {
    abrirDrawerLateral("gesture", valor, true);
    return;
  }
  popup.querySelector(".side-drawer-backdrop")?.style.setProperty("--drawer-progress", valor);
  const drawer = popup.querySelector(".side-drawer");
  drawer?.style.setProperty("--drawer-progress", valor);
  if (drawer) drawer.style.transform = `translate3d(${((valor - 1) * 100).toFixed(1)}%,0,0)`;
  popup.querySelector(".side-drawer-backdrop")?.classList.add("is-dragging");
}

function iniciarGestoDrawerLateral(event) {
  if (!DRAWER_EDGE_SWIPE_ENABLED) return;
  if (!getUsuarioAtual() || event.pointerType === "mouse" && event.button !== 0) return;
  if (isTelaPublica(telaAtual) || window.__simplificaLocalLockActive) return;
  const drawerAberto = !!document.querySelector(".side-drawer");
  const rail = !!event.target?.closest?.(".drawer-gesture-rail");
  const largura = window.innerWidth || 360;
  // A zona começa alguns pixels depois da borda real para não disputar com o gesto nativo "voltar" do Android.
  const zonaSegura = event.clientX >= 18 && event.clientX <= Math.min(86, Math.max(42, largura * 0.22));
  if (!drawerAberto && ((!rail && !zonaSegura) || alvoInterativoDrawer(event))) return;

  sideDrawerGesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    mode: drawerAberto ? "close" : "open",
    active: false,
    rail,
    width: Math.min(340, Math.max(280, window.innerWidth - 20)),
    progress: drawerAberto ? 1 : 0
  };
}

function moverGestoDrawerLateral(event) {
  if (!sideDrawerGesture || event.pointerId !== sideDrawerGesture.pointerId) return;
  const dx = event.clientX - sideDrawerGesture.startX;
  const dy = event.clientY - sideDrawerGesture.startY;
  if (!sideDrawerGesture.active) {
    const aberturaValida = sideDrawerGesture.mode === "open" ? dx > 0 : dx < 0;
    if (!aberturaValida || Math.abs(dx) < 18 || Math.abs(dx) < Math.abs(dy) * 1.45) return;
    sideDrawerGesture.active = true;
    try {
      event.target?.setPointerCapture?.(event.pointerId);
    } catch (erro) {
      // Alguns WebViews não permitem captura aqui; o gesto continua funcionando sem ela.
    }
  }
  event.preventDefault?.();
  const base = sideDrawerGesture.mode === "close" ? 1 : 0;
  const progresso = base + dx / sideDrawerGesture.width;
  atualizarProgressoDrawer(progresso);
}

function finalizarGestoDrawerLateral(event) {
  if (!sideDrawerGesture || event.pointerId !== sideDrawerGesture.pointerId) return;
  const gesto = sideDrawerGesture;
  sideDrawerGesture = null;
  if (!gesto.active) return;
  const abrir = sideDrawerProgress > 0.3 && gesto.mode === "open" || sideDrawerProgress > 0.7 && gesto.mode === "close";
  if (abrir) abrirDrawerLateral("gesture");
  else fecharDrawerLateral();
}

function configurarGestosDrawerLateral() {
  if (!DRAWER_EDGE_SWIPE_ENABLED) return;
  if (window.__drawerGestureConfigured) return;
  window.__drawerGestureConfigured = true;
  document.addEventListener("pointerdown", iniciarGestoDrawerLateral, { passive: true });
  document.addEventListener("pointermove", moverGestoDrawerLateral, { passive: false });
  document.addEventListener("pointerup", finalizarGestoDrawerLateral);
  document.addEventListener("pointercancel", finalizarGestoDrawerLateral);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector(".side-drawer")) fecharDrawerLateral();
  });
}

function renderMobile() {
  if (!getUsuarioAtual() && telaAtual === "admin") {
    return `<div class="mobile-auth-shell">${renderAdmin()}</div>`;
  }

  if (getUsuarioAtual()?.mustChangePassword) {
    return `
      <div class="mobile-home password-required-mobile">
        ${renderTrocaSenhaObrigatoria()}
      </div>
    `;
  }

  const painelAberto = telaAtual !== "dashboard";
  const home = canAccessScreen("dashboard") ? renderDashboard(true) : renderAcessoNegado();

  return `
    ${renderDrawerGestureRail()}
    <div class="mobile-home">
      ${renderAtualizacaoAndroidDownload()}
      ${home}
      ${renderAcoesRapidas()}
    </div>
    ${painelAberto ? renderPainelMobile(telaAtual) : ""}
    ${renderMobileBottomNav()}
  `;
}

function renderDrawerGestureRail() {
  if (!DRAWER_EDGE_SWIPE_ENABLED) return "";
  if (!getUsuarioAtual() || isTelaPublica(telaAtual) || window.__simplificaLocalLockActive) return "";
  return `<div class="drawer-gesture-rail" aria-hidden="true"></div>`;
}

function getMobileBottomNavItems() {
  return [
    { tela: "dashboard", icone: "⌂", texto: "Home" },
    { tela: "pedidos", icone: "📋", texto: "Pedidos" },
    { tela: "producao", icone: "🖨️", texto: "Produção" },
    { tela: "estoque", icone: "📦", texto: "Estoque" },
    { tela: "caixa", icone: "💰", texto: "Caixa" }
  ].filter((item) => canAccessScreen(item.tela));
}

function getMobileBottomNavActive() {
  const principais = new Set(getMobileBottomNavItems().map((item) => item.tela));
  return principais.has(telaAtual) ? telaAtual : "";
}

function renderMobileBottomNav() {
  const ativo = getMobileBottomNavActive();
  const itens = getMobileBottomNavItems();
  if (!itens.length || !getUsuarioAtual()) return "";
  return `
    <nav class="mobile-bottom-nav" aria-label="Navegação principal" style="grid-template-columns:repeat(${itens.length}, minmax(0, 1fr))">
      ${itens.map((item) => `
        <button class="mobile-bottom-nav-button ${ativo === item.tela ? "active" : ""}" data-tela="${item.tela}" type="button" onclick="trocarTela('${item.tela}')" aria-label="${escaparAttr(item.texto)}">
          <span>${item.icone}</span>
          <small>${escaparHtml(item.texto)}</small>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderPainelMobile(tela) {
  return `
    <section class="mobile-panel" role="dialog" aria-modal="true" aria-label="${escaparAttr(telas[tela])}">
      <div class="mobile-panel-bar">
        <button class="icon-button" onclick="voltarTela()" title="Voltar">←</button>
        <h2>${escaparHtml(telas[tela])}</h2>
        <button class="icon-button" onclick="abrirMenuPopup()" title="Abrir menu">☰</button>
      </div>
      <div class="mobile-panel-content">
        ${renderTela(tela)}
      </div>
    </section>
  `;
}

function renderTela(tela) {
  if (!canAccessScreen(tela)) return renderAcessoNegado();
  if (getUsuarioAtual()?.mustChangePassword && tela !== "seguranca" && tela !== "admin") {
    return renderTrocaSenhaObrigatoria();
  }
  switch (tela) {
    case "mais":
      return renderMais();
    case "conta":
      return renderConta();
    case "calculadora":
      return renderCalculadoraTela();
    case "pedido":
      return renderPedido();
    case "producao":
      return renderProducao();
    case "estoque":
      return renderEstoque();
    case "pedidos":
      return renderListaPedidos();
    case "clientes":
      return renderClientes();
    case "caixa":
      return renderCaixa();
    case "relatorios":
      return renderRelatorios();
    case "backup":
    case "config":
      return renderConfig();
    case "empresa":
    case "preferencias":
    case "personalizacao":
      return renderPersonalizacao();
    case "planos":
    case "assinatura":
      return renderAssinatura();
    case "minhaAssinatura":
      return renderMinhaAssinatura();
    case "feedback":
      return renderFeedback();
    case "sobre":
      return renderSobre();
    case "privacy":
      return renderDocumentoLegalPage("privacidade");
    case "terms":
      return renderDocumentoLegalPage("termos");
    case "seguranca":
      return renderSeguranca();
    case "onboarding":
      return renderOnboarding();
    case "acessoNegado":
      return renderAcessoNegado();
    case "usuarios":
    case "admin":
      return renderAdmin();
    case "superadmin":
      return renderSuperAdmin();
    default:
      return renderDashboard();
  }
}

function renderAcoesRapidas() {
  const acoes = [
    { tela: "pedidos", icone: "📋", texto: "Pedidos" },
    { tela: "producao", icone: "🖨️", texto: "Produção" },
    { tela: "estoque", icone: "📦", texto: "Estoque" },
    { tela: "caixa", icone: "💰", texto: "Caixa" },
    { tela: "clientes", icone: "👥", texto: "Clientes" },
    { tela: "relatorios", icone: "📈", texto: "Relatórios" },
    { tela: "backup", icone: "☁️", texto: "Backup" },
    { tela: "assinatura", icone: "💳", texto: "Planos" }
  ];
  if (getUsuarioAtual()) acoes.push({ tela: "conta", icone: "👤", texto: "Conta" });

  return `
    <div class="quick-actions">
      ${acoes.filter((acao) => acao.acao || canAccessScreen(acao.tela)).map((acao) => `
        <button class="quick-action" onclick="${acao.acao || `trocarTela('${acao.tela}')`}">
          <span>${acao.icone}</span>
          <strong>${acao.texto}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderMais() {
  const grupos = [
    {
      titulo: "Operação",
      itens: [
        { tela: "clientes", icone: "👥", texto: "Clientes" },
        { tela: "relatorios", icone: "📈", texto: "Relatórios" },
        { tela: "backup", icone: "☁️", texto: "Backup" },
        { tela: "producao", icone: "🖨️", texto: "Produção" }
      ]
    },
    {
      titulo: "Conta",
      itens: [
        { tela: "conta", icone: "👤", texto: "Conta" },
        { tela: "assinatura", icone: "💳", texto: "Planos" },
        { tela: "config", icone: "⚙️", texto: "Configurações" },
        { tela: "feedback", icone: "💡", texto: "Ajuda" }
      ]
    },
    {
      titulo: "Admin",
      itens: [
        { tela: "usuarios", icone: "🔐", texto: "Admin" },
        { tela: "superadmin", icone: "🛡️", texto: "Superadmin" }
      ]
    }
  ].map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => canAccessScreen(item.tela))
  })).filter((grupo) => grupo.itens.length);

  return `
    <section class="card more-screen">
      <div class="card-header">
        <h2>Mais</h2>
        <span class="status-badge">${escaparHtml(getPlanoAtual().nome)}</span>
      </div>
      ${grupos.map((grupo) => `
        <div class="more-group">
          <h3>${escaparHtml(grupo.titulo)}</h3>
          <div class="more-grid">
            ${grupo.itens.map((item) => `
              <button class="more-item" type="button" onclick="trocarTela('${item.tela}')">
                <span>${item.icone}</span>
                <strong>${escaparHtml(item.texto)}</strong>
              </button>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function renderConta() {
  const usuario = getUsuarioAtual();
  if (!usuario) return renderAcessoNegado();
  const inicial = String(usuario.nome || usuario.email || "S").trim().slice(0, 1).toUpperCase();
  const syncStatus = syncConfig.supabaseAccessToken ? "Online" : "Local";
  return `
    <section class="card account-screen">
      <div class="account-profile">
        <div class="account-avatar">${escaparHtml(inicial)}</div>
        <div>
          <h2>Conta</h2>
          <strong>${escaparHtml(usuario.nome || usuario.email)}</strong>
          <span class="muted">${escaparHtml(usuario.email || syncConfig.supabaseEmail || "-")}</span>
        </div>
        <span class="status-badge ${usuarioEstaBloqueado(usuario) ? "badge-danger" : "badge-ativo"}">${usuario.ativo === false ? "Inativa" : "Ativa"}</span>
      </div>

      <div class="metrics">
        <div class="metric"><span>Perfil</span><strong>${escaparHtml(usuario.papel || "user")}</strong></div>
        <div class="metric"><span>Sessão</span><strong>${sessionStorage.getItem("usuarioAtualEmail") ? "Ativa" : "Local"}</strong></div>
        <div class="metric"><span>Sincronização</span><strong>${escaparHtml(syncStatus)}</strong></div>
        <div class="metric"><span>Último acesso</span><strong>${escaparHtml(formatarUltimoAcessoConta())}</strong></div>
      </div>

      <div class="actions">
        <button class="btn secondary" type="button" onclick="sincronizarSupabase()">Sincronizar</button>
        <button class="btn secondary" type="button" onclick="trocarTela('backup')">Backup</button>
        <button class="btn ghost" type="button" onclick="trocarTela('seguranca')">Segurança</button>
        <button class="btn warning" type="button" onclick="logoutUsuario()">Sair</button>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Alterar senha</h2>
        ${renderFormularioAlterarSenha(false)}
      </div>

      ${renderDispositivosLicenca()}
    </section>
  `;
}

function renderAtualizacaoAndroidDownload() {
  if (!isAndroid() || !appConfig.updateAvailableVersion) return "";
  const manifestLocal = {
    version: appConfig.updateAvailableVersion,
    versionCode: Number(appConfig.updateAvailableCode || 0) || 0
  };
  if (!existeAtualizacaoAndroid(manifestLocal) || atualizacaoAndroidFoiOcultada(manifestLocal)) {
    appConfig.updateAvailableVersion = "";
    appConfig.updateAvailableCode = 0;
    salvarDados();
    return "";
  }
  const versao = appConfig.updateAvailableVersion || "mais recente";
  const status = appConfig.updateStatus || "Checagem automática ativa";
  const destaque = appConfig.updateAvailableVersion ? " update-available" : "";

  return `
    <section class="update-download-card${destaque}">
      <div>
        <span>Atualização do APK</span>
        <strong>${appConfig.updateAvailableVersion ? `Versão ${escaparHtml(versao)} disponível` : "Baixar versão mais recente"}</strong>
        <small>${escaparHtml(status)}</small>
      </div>
      <div class="update-download-actions">
        <button class="btn secondary" onclick="verificarAtualizacaoManual()">Checar</button>
        <button class="btn" onclick="baixarAtualizacaoAndroid(true)">Baixar APK</button>
      </div>
    </section>
  `;
}

function classeStatusPlano(status) {
  return `badge-${removerAcentos(status || "gratis").replace(/[^a-z0-9_-]/gi, "").toLowerCase()}`;
}

function dataLocalIso(valor = new Date()) {
  const data = valor instanceof Date ? valor : new Date(valor || Date.now());
  if (Number.isNaN(data.getTime())) return "";
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseDataLocalIso(iso = hojeIsoData()) {
  const partes = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) return new Date();
  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

function hojeIsoData() {
  return dataLocalIso(new Date());
}

function dataRegistroIso(registro = {}) {
  const bruto = registro?.criadoEm || registro?.createdAt || registro?.created_at || registro?.updatedAt || registro?.updated_at || "";
  if (bruto) return dataLocalIso(bruto);
  return "";
}

function dataPedidoIso(pedido) {
  if (pedido?.criadoEm || pedido?.createdAt || pedido?.created_at) return dataRegistroIso(pedido);
  const data = String(pedido?.data || "");
  const partes = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (partes) return `${partes[3]}-${partes[2]}-${partes[1]}`;
  return "";
}

function getUltimaAtividadeAplicativo() {
  const usuario = getUsuarioAtual();
  const candidatos = [
    syncConfig.ultimaSync,
    syncConfig.supabaseLastSync,
    syncConfig.autoBackupLastRun,
    syncConfig.lastActivityAt,
    syncConfig.supabaseLastLogin,
    usuario?.lastActivityAt,
    usuario?.lastLoginAt,
    billingConfig.lastOnlineLicenseValidationAt,
    billingConfig.effectiveLicenseUpdatedAt
  ];
  return candidatos
    .map((valor) => Date.parse(valor || 0) || 0)
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || 0;
}

function formatarTempoRelativo(timestamp) {
  const valor = typeof timestamp === "number" ? timestamp : (Date.parse(timestamp || 0) || 0);
  if (!valor) return "Não registrado";
  const diff = Math.max(0, Date.now() - valor);
  if (diff < 60 * 1000) return "Atualizado agora";
  const minutos = Math.floor(diff / (60 * 1000));
  if (minutos < 60) return `Atualizado há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Atualizado há ${horas} h`;
  return new Date(valor).toLocaleString("pt-BR");
}

function formatarUltimoAcessoConta() {
  return formatarTempoRelativo(getUltimaAtividadeAplicativo());
}

function registrarAtividadeUsuarioAtual(motivo = "atividade", salvar = false) {
  const agora = new Date().toISOString();
  syncConfig.lastActivityAt = agora;
  const usuario = getUsuarioAtual();
  if (usuario) {
    usuario.lastActivityAt = agora;
    usuario.lastLoginAt = usuario.lastLoginAt || syncConfig.supabaseLastLogin || agora;
  }
  if (motivo === "login") syncConfig.supabaseLastLogin = agora;
  if (salvar) salvarDados();
  return agora;
}

function marcarSincronizacaoVisual(motivo = "sync") {
  const agora = new Date().toISOString();
  syncConfig.supabaseLastSync = agora;
  syncConfig.ultimoBackup = agora;
  syncConfig.ultimaSync = agora;
  syncConfig.autoBackupLastRun = agora;
  syncConfig.lastActivityAt = agora;
  const usuario = getUsuarioAtual();
  if (usuario) usuario.lastActivityAt = agora;
  return agora;
}

function calcularFluxoAtivoDashboard(stats, totaisCaixa) {
  const sinais = [
    stats.pedidosHoje,
    stats.pedidosAbertos,
    stats.producoesAtivas,
    stats.pedidosConcluidos,
    stats.estoqueBaixo,
    totaisCaixa.entradas > 0 ? 1 : 0,
    totaisCaixa.saidas > 0 ? 1 : 0,
    getUltimaAtividadeAplicativo() && Date.now() - getUltimaAtividadeAplicativo() < DASHBOARD_RECENT_ACTIVITY_MS ? 1 : 0
  ].reduce((total, valor) => total + Math.max(0, Number(valor) || 0), 0);
  if (!sinais) {
    return { percent: 0, label: "Sem atividade suficiente", hasData: false };
  }
  const base = Math.max(4, stats.pedidosHoje + stats.pedidosAbertos + stats.pedidosConcluidos + stats.producoesAtivas + 2);
  const percent = Math.min(100, Math.max(1, Math.round((sinais / base) * 100)));
  return { percent, label: "fluxo ativo", hasData: true };
}

function getDashboardStats() {
  const hoje = hojeIsoData();
  const pedidosHoje = pedidos.filter((pedido) => dataPedidoIso(pedido) === hoje);
  const faturamentoDia = pedidosHoje.reduce((total, pedido) => total + totalPedido(pedido), 0);
  const pedidosAbertos = pedidos.filter((pedido) => !["entregue", "cancelado", "finalizado"].includes(String(pedido.status || "aberto"))).length;
  const producoesAtivas = pedidos.filter((pedido) => String(pedido.status || "") === "producao").length;
  const materiaisEstoque = normalizarEstoque();
  const estoqueBaixo = materiaisEstoque.filter((material) => (Number(material.qtd) || 0) <= estoqueMinimoKg).length;
  const pedidosConcluidos = pedidosHoje.filter((pedido) => ["entregue", "finalizado"].includes(String(pedido.status || ""))).length;
  const clientesAtivos = new Set(pedidos.map((pedido) => clienteDoPedido(pedido)).filter(Boolean)).size;
  const consumoHojeKg = pedidosHoje.reduce((total, pedido) => {
    const consumo = calcularConsumoMateriais(normalizarItensPedido(pedido));
    return total + Array.from(consumo.values()).reduce((soma, kg) => soma + kg, 0);
  }, 0);
  const lucroEstimado = pedidos.reduce((total, pedido) => {
    const itens = normalizarItensPedido(pedido);
    const custo = itens.reduce((soma, item) => soma + (Number(item.custoTotal) || 0), 0);
    return total + Math.max(0, totalPedido(pedido) - custo);
  }, 0);
  return {
    faturamentoDia,
    pedidosHoje: pedidosHoje.length,
    pedidosAbertos,
    producoesAtivas,
    estoqueBaixo,
    lucroEstimado,
    pedidosConcluidos,
    clientesAtivos,
    consumoHojeKg,
    totalMateriais: materiaisEstoque.length
  };
}

function normalizarPeriodoDashboard(periodo = dashboardPeriod) {
  const valor = String(periodo || "day").toLowerCase();
  return ["day", "week", "month", "year"].includes(valor) ? valor : "day";
}

function getDashboardPeriodos() {
  return [
    { id: "day", label: "Hoje" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mês" },
    { id: "year", label: "Ano" }
  ];
}

function somarDias(data, dias) {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function inicioSemanaLocal(data) {
  const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const deslocamento = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - deslocamento);
  return inicio;
}

function getPeriodoReferenciaIso(periodo = dashboardPeriod) {
  const info = getInfoPeriodoDashboard(periodo);
  return dataLocalIso(info.start);
}

function getInfoPeriodoDashboard(periodo = dashboardPeriod, referencia = new Date()) {
  const tipo = normalizarPeriodoDashboard(periodo);
  const base = referencia instanceof Date ? referencia : parseDataLocalIso(referencia);
  let start;
  let end;
  let previousStart;
  let previousEnd;
  let comparisonLabel;

  if (tipo === "week") {
    start = inicioSemanaLocal(base);
    end = somarDias(start, 7);
    previousStart = somarDias(start, -7);
    previousEnd = start;
    comparisonLabel = "comparado à semana anterior";
  } else if (tipo === "month") {
    start = new Date(base.getFullYear(), base.getMonth(), 1);
    end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    previousStart = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    previousEnd = start;
    comparisonLabel = "comparado ao mês anterior";
  } else if (tipo === "year") {
    start = new Date(base.getFullYear(), 0, 1);
    end = new Date(base.getFullYear() + 1, 0, 1);
    previousStart = new Date(base.getFullYear() - 1, 0, 1);
    previousEnd = start;
    comparisonLabel = "comparado ao ano anterior";
  } else {
    start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    end = somarDias(start, 1);
    previousStart = somarDias(start, -1);
    previousEnd = start;
    comparisonLabel = "comparado a ontem";
  }

  return {
    tipo,
    start,
    end,
    previousStart,
    previousEnd,
    reference: dataLocalIso(start),
    comparisonLabel
  };
}

function getDataPedidoLocal(pedido = {}) {
  const iso = dataPedidoIso(pedido);
  return iso ? parseDataLocalIso(iso) : null;
}

function estaNoIntervalo(data, inicio, fim) {
  if (!data || Number.isNaN(data.getTime())) return false;
  return data >= inicio && data < fim;
}

function pedidoContaParaAnalytics(pedido = {}) {
  const status = String(pedido.status || "").toLowerCase();
  if (pedido.deleted_at || pedido.deletedAt) return false;
  return status !== "cancelado";
}

function calcularCustosPedidoAnalytics(pedido = {}) {
  const itens = normalizarItensPedido(pedido);
  return itens.reduce((totais, item) => {
    const qtd = Math.max(1, Number(item.qtd) || 1);
    totais.material += Number(item.custoMaterial) || 0;
    totais.energy += Number(item.custoEnergia) || 0;
    totais.cost += Number(item.custoTotal) || 0;
    totais.hours += (Number(item.tempoHoras) || 0) * qtd;
    return totais;
  }, { material: 0, energy: 0, cost: 0, hours: 0 });
}

function calcularAgregadoAnalytics(inicio, fim) {
  const pedidosPeriodo = pedidos.filter((pedido) => pedidoContaParaAnalytics(pedido) && estaNoIntervalo(getDataPedidoLocal(pedido), inicio, fim));
  const totaisCaixa = calcularTotaisCaixa();
  return pedidosPeriodo.reduce((total, pedido) => {
    const custos = calcularCustosPedidoAnalytics(pedido);
    const venda = totalPedido(pedido);
    total.total_sales += venda;
    total.total_profit += Math.max(0, venda - custos.cost);
    total.total_orders += 1;
    total.material_cost += custos.material;
    total.energy_cost += custos.energy;
    total.printer_hours += custos.hours;
    return total;
  }, {
    total_sales: 0,
    total_profit: 0,
    total_orders: 0,
    material_cost: 0,
    energy_cost: 0,
    printer_hours: 0,
    cash_balance: totaisCaixa.saldo
  });
}

function criarBucketsAnalytics(info) {
  const buckets = [];
  if (info.tipo === "day") {
    for (let hora = 0; hora < 24; hora += 3) {
      const start = new Date(info.start);
      start.setHours(hora, 0, 0, 0);
      const end = new Date(info.start);
      end.setHours(hora + 3, 0, 0, 0);
      buckets.push({ label: `${hora}h`, start, end });
    }
  } else if (info.tipo === "week") {
    for (let dia = 0; dia < 7; dia += 1) {
      const start = somarDias(info.start, dia);
      buckets.push({
        label: start.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        start,
        end: somarDias(start, 1)
      });
    }
  } else if (info.tipo === "month") {
    let cursor = new Date(info.start);
    while (cursor < info.end) {
      const start = new Date(cursor);
      const end = new Date(Math.min(somarDias(start, 7).getTime(), info.end.getTime()));
      buckets.push({ label: `${start.getDate()}-${somarDias(end, -1).getDate()}`, start, end });
      cursor = end;
    }
  } else {
    for (let mes = 0; mes < 12; mes += 1) {
      const start = new Date(info.start.getFullYear(), mes, 1);
      const end = new Date(info.start.getFullYear(), mes + 1, 1);
      buckets.push({
        label: start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        start,
        end
      });
    }
  }
  return buckets;
}

function gerarSeriesDashboardAnalytics(info) {
  return criarBucketsAnalytics(info).map((bucket) => {
    const agregado = calcularAgregadoAnalytics(bucket.start, bucket.end);
    return {
      label: bucket.label,
      sales: Number(agregado.total_sales.toFixed(2)),
      profit: Number(agregado.total_profit.toFixed(2)),
      orders: agregado.total_orders
    };
  });
}

function calcularComparacaoAnalytics(valorAtual, valorAnterior, sufixo = "") {
  const atual = Number(valorAtual) || 0;
  const anterior = Number(valorAnterior) || 0;
  const diferenca = atual - anterior;
  const percent = anterior > 0 ? Math.round((diferenca / anterior) * 100) : (atual > 0 ? 100 : 0);
  const direcao = diferenca > 0 ? "up" : diferenca < 0 ? "down" : "flat";
  const seta = direcao === "up" ? "↑" : direcao === "down" ? "↓" : "•";
  const texto = sufixo === "money"
    ? `${seta} ${formatarMoeda(Math.abs(diferenca))}`
    : `${seta} ${Math.abs(percent)}%`;
  return { atual, anterior, diferenca, direcao, percent, texto };
}

function gerarInsightsAnalytics(analytics) {
  if (!analytics.total_orders) {
    return ["Sem atividade suficiente para gerar insights. Salve pedidos para começar o histórico."];
  }
  const itens = pedidos
    .filter((pedido) => pedidoContaParaAnalytics(pedido))
    .flatMap((pedido) => normalizarItensPedido(pedido));
  const ranking = itens.reduce((mapa, item) => {
    const nome = item.nome || "Produto 3D";
    mapa.set(nome, (mapa.get(nome) || 0) + (Number(item.qtd) || 1));
    return mapa;
  }, new Map());
  const produtoMaisVendido = Array.from(ranking.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const insights = [];
  if (analytics.growth_percent > 0) insights.push(`Seu faturamento cresceu ${Math.round(analytics.growth_percent)}% neste período.`);
  if (produtoMaisVendido) insights.push(`Produto mais vendido: ${produtoMaisVendido}.`);
  if (analytics.material_cost > 0) insights.push(`Custo de material no período: ${formatarMoeda(analytics.material_cost)}.`);
  if (analytics.printer_hours > 0) insights.push(`Produção estimada: ${analytics.printer_hours.toFixed(1)} h de impressão.`);
  return insights.slice(0, 4);
}

function getDashboardAnalyticsCacheKey(periodo = dashboardPeriod) {
  const uid = syncConfig.supabaseUserId || getUsuarioAtual()?.id || "local";
  return `${uid}:${normalizarPeriodoDashboard(periodo)}:${getPeriodoReferenciaIso(periodo)}`;
}

function getDashboardAnalyticsLocal(periodo = dashboardPeriod) {
  const info = getInfoPeriodoDashboard(periodo);
  const atual = calcularAgregadoAnalytics(info.start, info.end);
  const anterior = calcularAgregadoAnalytics(info.previousStart, info.previousEnd);
  const growth = anterior.total_sales > 0
    ? ((atual.total_sales - anterior.total_sales) / anterior.total_sales) * 100
    : (atual.total_sales > 0 ? 100 : 0);
  const analytics = {
    ...atual,
    growth_percent: Number(growth.toFixed(2)),
    comparison_label: info.comparisonLabel,
    chart_series: gerarSeriesDashboardAnalytics(info),
    period_type: info.tipo,
    period_reference: info.reference,
    source: "local",
    updated_at: new Date().toISOString(),
    comparisons: {
      sales: calcularComparacaoAnalytics(atual.total_sales, anterior.total_sales),
      profit: calcularComparacaoAnalytics(atual.total_profit, anterior.total_profit, "money"),
      orders: calcularComparacaoAnalytics(atual.total_orders, anterior.total_orders),
      material: calcularComparacaoAnalytics(atual.material_cost, anterior.material_cost, "money"),
      cash: calcularComparacaoAnalytics(atual.cash_balance, anterior.cash_balance, "money")
    }
  };
  analytics.insights = gerarInsightsAnalytics(analytics);
  dashboardAnalyticsCache[getDashboardAnalyticsCacheKey(info.tipo)] = analytics;
  return analytics;
}

function selecionarPeriodoDashboard(periodo) {
  dashboardPeriod = normalizarPeriodoDashboard(periodo);
  salvarDados();
  renderizarPreservandoScroll();
  carregarAnalyticsBackendSilencioso(dashboardPeriod);
}

function avancarPeriodoDashboard() {
  const periodos = getDashboardPeriodos().map((periodo) => periodo.id);
  const atual = Math.max(0, periodos.indexOf(normalizarPeriodoDashboard(dashboardPeriod)));
  selecionarPeriodoDashboard(periodos[(atual + 1) % periodos.length]);
}

function agendarAnalyticsDashboard(analytics) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return;
  const agora = Date.now();
  if (agora - dashboardAnalyticsLastUploadAt < 25000) return;
  dashboardAnalyticsLastUploadAt = agora;
  setTimeout(() => {
    enviarAnalyticsDashboardSilencioso(analytics)
      .then(() => carregarAnalyticsBackendSilencioso(analytics.period_type))
      .catch((erro) => registrarDiagnostico("Analytics", "Snapshot do dashboard não sincronizado", erro.message));
  }, 120);
}

async function enviarAnalyticsDashboardSilencioso(analytics) {
  if (!analytics || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) return false;
  await requisicaoSupabase("/rest/v1/rpc/upsert_dashboard_analytics_snapshot", {
    method: "POST",
    telemetry: false,
    body: JSON.stringify({
      p_period_type: analytics.period_type,
      p_period_reference: analytics.period_reference,
      p_company_id: billingConfig.companyId || getUsuarioAtual()?.companyId || null,
      p_total_sales: Number(analytics.total_sales) || 0,
      p_total_profit: Number(analytics.total_profit) || 0,
      p_total_orders: Number(analytics.total_orders) || 0,
      p_material_cost: Number(analytics.material_cost) || 0,
      p_energy_cost: Number(analytics.energy_cost) || 0,
      p_printer_hours: Number(analytics.printer_hours) || 0,
      p_cash_balance: Number(analytics.cash_balance) || 0,
      p_chart_series: analytics.chart_series || [],
      p_insights: analytics.insights || []
    })
  });
  return true;
}

async function carregarAnalyticsBackendSilencioso(periodo = dashboardPeriod) {
  if (dashboardAnalyticsRequest || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return null;
  const periodType = normalizarPeriodoDashboard(periodo);
  const periodReference = getPeriodoReferenciaIso(periodType);
  dashboardAnalyticsRequest = requisicaoSupabase("/rest/v1/rpc/get_dashboard_analytics", {
    method: "POST",
    telemetry: false,
    body: JSON.stringify({
      p_period_type: periodType,
      p_period_reference: periodReference
    })
  }).then((dados) => {
    if (dados && dados.source && dados.source !== "empty") {
      dashboardAnalyticsCache[getDashboardAnalyticsCacheKey(periodType)] = {
        ...dashboardAnalyticsCache[getDashboardAnalyticsCacheKey(periodType)],
        ...dados
      };
      salvarDados();
      if (telaAtual === "dashboard") agendarRenderizacaoPreservandoScroll(180);
    }
    return dados;
  }).catch((erro) => {
    registrarDiagnostico("Analytics", "Leitura remota do dashboard indisponível", erro.message);
    return null;
  }).finally(() => {
    dashboardAnalyticsRequest = null;
  });
  return dashboardAnalyticsRequest;
}

function abrirBlocoDashboard(tela, filtro = "") {
  if (tela === "pedidos") {
    window.__pedidosFiltroDashboard = filtro || "";
  }
  trocarTela(tela || "dashboard");
}

function getUserInitials(nome = "") {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "S3";
  return partes.slice(0, 2).map((parte) => parte.charAt(0).toUpperCase()).join("");
}

function renderUsuarioAvatar(usuario, classe = "home-avatar") {
  const nome = usuario?.nome || usuario?.email || appConfig.businessName || "Simplifica 3D";
  const avatarUrl = appConfig.profilePhotoDataUrl || usuario?.avatarUrl || usuario?.avatar_url || "";
  if (avatarUrl) {
    return `<img class="${escaparAttr(classe)}" src="${escaparAttr(avatarUrl)}" alt="Avatar do usuário">`;
  }
  return `<div class="${escaparAttr(classe)}" aria-label="Avatar do usuário">${escaparHtml(getUserInitials(nome))}</div>`;
}

function renderDashboardAvatar(usuario) {
  return renderUsuarioAvatar(usuario, "home-avatar");
}

function renderDashboardPremiumHeader(plano) {
  const usuario = getUsuarioAtual();
  const nomeUsuario = usuario?.nome || usuario?.email || "Operação";
  const nomeEmpresa = appConfig.businessName || appConfig.appName || SYSTEM_NAME;
  const statusAssinatura = licencaEfetivaBloqueada(usuario) ? "Bloqueado" : plano.descricao || plano.nome || "Plano ativo";

  return `
    <section class="home-premium-header">
      <div class="home-brand-lockup">
        ${renderMarcaProjeto("home-brand-logo", "Simplifica 3D", "icon")}
        <div>
          <span class="eyebrow">Painel operacional</span>
          <h1>${escaparHtml(nomeEmpresa)}</h1>
          <p>${escaparHtml(nomeUsuario)}</p>
        </div>
      </div>
      <div class="home-account-strip">
        <div>
          <span>Plano</span>
          <strong>${escaparHtml(plano.nome || "Free")}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>${escaparHtml(statusAssinatura)}</strong>
        </div>
        ${renderDashboardAvatar(usuario)}
        <button class="icon-button home-menu-button" type="button" onclick="abrirMenuPopup()" title="Abrir menu">☰</button>
      </div>
    </section>
  `;
}

function renderDashboardSearch() {
  return `
    <div class="dashboard-search-row">
      <button class="icon-button dashboard-menu-trigger" type="button" onclick="abrirMenuPopup()" title="Abrir menu">☰</button>
      <label class="dashboard-search search-compact" onclick="expandirBuscaGlobal(this)">
        <button class="search-ai-button" type="button" onclick="event.stopPropagation(); abrirAssistente('basic')" title="Abrir assistente básico">${renderAssistantFabContent("IA", false)}</button>
        <input placeholder="Buscar pedidos, clientes ou perguntar ao assistente..." onkeydown="buscarGlobal(event, this.value)" onblur="recolherBuscaGlobal(this)">
      </label>
    </div>
  `;
}

function renderDashboardBars(stats, totaisCaixa) {
  const baseFinanceira = Math.max(stats.faturamentoDia, stats.lucroEstimado, totaisCaixa.entradas, 1);
  const barras = [
    { label: "Faturamento", value: stats.faturamentoDia, percent: Math.round((stats.faturamentoDia / baseFinanceira) * 100), state: "teal" },
    { label: "Lucro", value: stats.lucroEstimado, percent: Math.round((stats.lucroEstimado / baseFinanceira) * 100), state: "green" },
    { label: "Entradas", value: totaisCaixa.entradas, percent: Math.round((totaisCaixa.entradas / baseFinanceira) * 100), state: "orange" }
  ];

  return `
    <div class="depth-bar-chart" aria-label="Indicadores financeiros">
      ${barras.map((barra) => `
        <div class="depth-bar-row ${barra.state}">
          <span>${escaparHtml(barra.label)}</span>
          <div class="depth-bar-track"><i style="--bar:${Math.min(100, Math.max(4, barra.percent))}%"></i></div>
          <strong>${formatarMoeda(barra.value)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderDashboardTrend(stats) {
  const valores = [stats.pedidosConcluidos, stats.producoesAtivas, stats.estoqueBaixo, stats.pedidosAbertos, stats.pedidosHoje].map((valor) => Math.max(0, Number(valor) || 0));
  const maximo = Math.max(...valores, 1);
  return `
    <div class="mini-trend" aria-label="Pulso operacional">
      ${valores.map((valor) => `<span style="--h:${Math.max(16, Math.round((valor / maximo) * 100))}%"></span>`).join("")}
    </div>
  `;
}

function renderDashboardDonut(stats) {
  const totalOperacao = Math.max(stats.pedidosAbertos + stats.pedidosConcluidos, 1);
  const progresso = Math.round((stats.pedidosConcluidos / totalOperacao) * 100);
  return `
    <div class="production-donut" style="--value:${progresso}%">
      <strong>${progresso}%</strong>
      <span>concluído</span>
    </div>
  `;
}

function renderDashboardTechnicalPanel(stats, totaisCaixa) {
  const fluxo = calcularFluxoAtivoDashboard(stats, totaisCaixa);
  const andamento = fluxo.percent;
  const saldoState = totaisCaixa.saldo < 0 ? "red" : "teal";
  const ultimaAtualizacao = formatarUltimoAcessoConta();
  const etapas = [
    { label: "Pedidos", value: stats.pedidosHoje, detail: "hoje", icon: "📋", state: "teal" },
    { label: "Produção", value: stats.producoesAtivas, detail: "ativa", icon: "🖨️", state: "orange" },
    { label: "Concluídos", value: stats.pedidosConcluidos, detail: "entregas", icon: "✓", state: "green" },
    { label: "Caixa", value: formatarMoeda(totaisCaixa.saldo), detail: "saldo", icon: "💳", state: saldoState }
  ];

  return `
    <section class="technical-glass-panel infographic-panel" aria-label="Infográfico operacional da tela inicial">
      <div class="infographic-hero">
        <div>
          <span class="eyebrow">Infográfico do dia</span>
          <h2>${formatarMoeda(stats.faturamentoDia)}</h2>
          <p>Da entrada do pedido até o caixa, com alertas de produção e material em uma leitura rápida.</p>
        </div>
        <div class="infographic-ring ${fluxo.hasData ? "" : "is-empty"}" style="--value:${andamento}%">
          <strong>${fluxo.hasData ? `${andamento}%` : "—"}</strong>
          <span>${escaparHtml(fluxo.label)}</span>
        </div>
      </div>

      <div class="infographic-flow" style="--flow:${andamento}%">
        ${etapas.map((etapa, index) => `
          <button class="infographic-node node-${etapa.state}" type="button" onclick="abrirBlocoDashboard('${index === 3 ? "caixa" : index === 1 ? "producao" : "pedidos"}', '${index === 0 ? "hoje" : index === 2 ? "hoje" : ""}')">
            <span class="node-icon">${etapa.icon}</span>
            <strong>${escaparHtml(etapa.value)}</strong>
            <small>${escaparHtml(etapa.label)} · ${escaparHtml(etapa.detail)}</small>
          </button>
        `).join("")}
      </div>

      <div class="infographic-insights">
        <div class="insight-card">
          <span>Lucro estimado</span>
          <strong>${formatarMoeda(stats.lucroEstimado)}</strong>
          <i style="--w:${Math.min(100, Math.max(8, Math.round((stats.lucroEstimado / Math.max(stats.faturamentoDia, stats.lucroEstimado, 1)) * 100)))}%"></i>
        </div>
        <div class="insight-card ${stats.estoqueBaixo ? "warning" : ""}">
          <span>Estoque baixo</span>
          <strong>${stats.estoqueBaixo}</strong>
          <small>${stats.totalMateriais || 0} materiais cadastrados</small>
        </div>
        <div class="insight-card">
          <span>Consumo material</span>
          <strong>${stats.consumoHojeKg.toFixed(3)} kg</strong>
          <small>baseado nos pedidos de hoje</small>
        </div>
        <div class="insight-card">
          <span>Pedidos ativos</span>
          <strong>${stats.pedidosAbertos}</strong>
          <small>${stats.producoesAtivas} em produção</small>
        </div>
        <div class="insight-card">
          <span>Atualização</span>
          <strong>${escaparHtml(ultimaAtualizacao)}</strong>
          <small>${escaparHtml(syncConfig.autoBackupStatus || "Sincronização automática")}</small>
        </div>
      </div>
    </section>
  `;
}

function renderDashboardKpiCard(card) {
  return `
    <button class="kpi-card kpi-card-button ${card.state ? `kpi-${card.state}` : ""}" onclick="abrirBlocoDashboard('${card.tela}', '${card.filtro || ""}')">
      <span class="kpi-icon">${card.icone}</span>
      <div>
        <span>${escaparHtml(card.titulo)}</span>
        <strong>${escaparHtml(card.valor)}</strong>
      </div>
      <em class="status-badge ${classeStatusPlano(String(card.badge).toLowerCase())}">${escaparHtml(card.badge)}</em>
    </button>
  `;
}

function renderDashboardPeriodTabs() {
  const ativo = normalizarPeriodoDashboard(dashboardPeriod);
  return `
    <div class="dashboard-period-tabs" role="tablist" aria-label="Período do dashboard">
      ${getDashboardPeriodos().map((periodo) => `
        <button class="${ativo === periodo.id ? "active" : ""}" type="button" onclick="selecionarPeriodoDashboard('${periodo.id}')">
          ${escaparHtml(periodo.label)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderComparacaoDashboard(comparacao, label, vazio = "Sem movimentação") {
  const direcao = comparacao?.direcao || "flat";
  const atual = Number(comparacao?.atual) || 0;
  const anterior = Number(comparacao?.anterior) || 0;
  const diferenca = Number(comparacao?.diferenca) || 0;
  let texto = comparacao?.texto || "Sem variação";
  let complemento = label || "";
  if (atual === 0 && anterior === 0) {
    texto = vazio;
    complemento = "";
  } else if (atual > 0 && anterior === 0) {
    texto = "Primeira movimentação do período";
    complemento = "";
  } else if (diferenca === 0) {
    texto = "Sem variação";
  }
  return `<span class="analytics-comparison ${direcao}">${escaparHtml(texto)} ${escaparHtml(complemento)}</span>`;
}

function renderDashboardAnalyticsKpi({ titulo, valor, comparacao, label, estado = "neutral", vazio }) {
  return `
    <div class="analytics-kpi analytics-${estado} card-enter">
      <span>${escaparHtml(titulo)}</span>
      <strong>${escaparHtml(valor)}</strong>
      ${renderComparacaoDashboard(comparacao, label, vazio)}
    </div>
  `;
}

function renderDashboardAnalyticsHero(analytics) {
  const label = analytics.comparison_label || "comparado ao período anterior";
  return `
    <section class="dashboard-analytics-hero chart-enter">
      ${renderDashboardAnalyticsKpi({
        titulo: "Faturamento",
        valor: formatarMoeda(analytics.total_sales),
        comparacao: analytics.comparisons?.sales,
        label,
        estado: "teal"
      })}
      ${renderDashboardAnalyticsKpi({
        titulo: "Lucro",
        valor: formatarMoeda(analytics.total_profit),
        comparacao: analytics.comparisons?.profit,
        label,
        estado: "green"
      })}
      ${renderDashboardAnalyticsKpi({
        titulo: "Pedidos",
        valor: String(analytics.total_orders || 0),
        comparacao: analytics.comparisons?.orders,
        label,
        estado: "neutral",
        vazio: "Nenhum pedido no período"
      })}
      ${renderDashboardAnalyticsKpi({
        titulo: "Gasto material",
        valor: formatarMoeda(analytics.material_cost),
        comparacao: analytics.comparisons?.material,
        label,
        estado: "orange"
      })}
      ${renderDashboardAnalyticsKpi({
        titulo: "Saldo do caixa",
        valor: formatarMoeda(analytics.cash_balance),
        comparacao: analytics.comparisons?.cash,
        label: "atual",
        estado: analytics.cash_balance < 0 ? "red" : "teal"
      })}
    </section>
  `;
}

function renderDashboardComboChart(analytics) {
  const series = Array.isArray(analytics.chart_series) && analytics.chart_series.length ? analytics.chart_series : [];
  const width = 360;
  const height = 180;
  const padding = { top: 18, right: 18, bottom: 34, left: 34 };
  const areaW = width - padding.left - padding.right;
  const areaH = height - padding.top - padding.bottom;
  const maxSales = Math.max(...series.map((item) => Number(item.sales) || 0), 1);
  const maxProfit = Math.max(...series.map((item) => Number(item.profit) || 0), 1);
  const step = series.length > 1 ? areaW / series.length : areaW;
  const barWidth = Math.max(10, Math.min(28, step * 0.48));
  const points = series.map((item, index) => {
    const x = padding.left + step * index + step / 2;
    const y = padding.top + areaH - ((Number(item.profit) || 0) / maxProfit) * areaH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return `
    <section class="dashboard-chart-card chart-enter" onclick="avancarPeriodoDashboard()" role="button" tabindex="0" aria-label="Gráfico de faturamento e lucro. Toque para trocar o período.">
      <div class="card-header">
        <div>
          <span class="eyebrow">Histórico analítico</span>
          <h2>Faturamento e lucro</h2>
        </div>
        <span class="status-badge">${escaparHtml(getDashboardPeriodos().find((item) => item.id === analytics.period_type)?.label || "Hoje")}</span>
      </div>
      <svg class="combo-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Barras de faturamento e linha de lucro">
        <defs>
          <linearGradient id="salesBarGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#86f0ff" stop-opacity="0.95"></stop>
            <stop offset="100%" stop-color="#073b4b" stop-opacity="0.82"></stop>
          </linearGradient>
          <linearGradient id="profitLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#45e08f"></stop>
            <stop offset="100%" stop-color="#ff941c"></stop>
          </linearGradient>
          <filter id="chartSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        <line x1="${padding.left}" y1="${padding.top + areaH}" x2="${width - padding.right}" y2="${padding.top + areaH}" class="chart-axis"></line>
        ${series.map((item, index) => {
          const value = Number(item.sales) || 0;
          const barH = Math.max(4, (value / maxSales) * areaH);
          const x = padding.left + step * index + step / 2 - barWidth / 2;
          const y = padding.top + areaH - barH;
          return `
            <g class="chart-bar-group">
              <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barH.toFixed(1)}" rx="7" class="chart-sales-bar" style="--delay:${index * 36}ms"></rect>
              <text x="${(padding.left + step * index + step / 2).toFixed(1)}" y="${height - 12}" text-anchor="middle" class="chart-label">${escaparHtml(item.label)}</text>
              <title>${escaparHtml(item.label)}: faturamento ${formatarMoeda(item.sales)}, lucro ${formatarMoeda(item.profit)}</title>
            </g>
          `;
        }).join("")}
        ${points ? `<polyline points="${points}" class="chart-profit-line" filter="url(#chartSoftGlow)"></polyline>` : ""}
        ${series.map((item, index) => {
          const x = padding.left + step * index + step / 2;
          const y = padding.top + areaH - ((Number(item.profit) || 0) / maxProfit) * areaH;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="chart-profit-point"><title>${escaparHtml(item.label)}: lucro ${formatarMoeda(item.profit)}</title></circle>`;
        }).join("")}
      </svg>
      <div class="chart-legend">
        <span><i class="legend-sales"></i> Faturamento</span>
        <span><i class="legend-profit"></i> Lucro</span>
        <small>Toque no gráfico para alternar Hoje, Semana, Mês e Ano.</small>
      </div>
    </section>
  `;
}

function renderDashboardInsights(analytics) {
  const insights = Array.isArray(analytics.insights) && analytics.insights.length ? analytics.insights : ["Sem atividade suficiente para gerar insights."];
  return `
    <section class="dashboard-insights glass-pop">
      <div class="card-header">
        <h2>Insights</h2>
        <span class="status-badge">Automático</span>
      </div>
      <div class="insight-list">
        ${insights.map((insight) => `<span>${escaparHtml(insight)}</span>`).join("")}
      </div>
    </section>
  `;
}

function renderDashboardAnalyticSections(analytics) {
  const ticketMedio = analytics.total_orders ? analytics.total_sales / analytics.total_orders : 0;
  return `
    <div class="analytics-sections">
      <section class="analytics-module">
        <span class="eyebrow">Financeiro</span>
        <div class="metric"><span>Faturamento</span><strong>${formatarMoeda(analytics.total_sales)}</strong></div>
        <div class="metric"><span>Lucro</span><strong>${formatarMoeda(analytics.total_profit)}</strong></div>
        <div class="metric"><span>Saldo</span><strong>${formatarMoeda(analytics.cash_balance)}</strong></div>
      </section>
      <section class="analytics-module">
        <span class="eyebrow">Produção</span>
        <div class="metric"><span>Horas impressas</span><strong>${Number(analytics.printer_hours || 0).toFixed(1)} h</strong></div>
        <div class="metric"><span>Material</span><strong>${formatarMoeda(analytics.material_cost)}</strong></div>
        <div class="metric"><span>Energia</span><strong>${formatarMoeda(analytics.energy_cost)}</strong></div>
      </section>
      <section class="analytics-module">
        <span class="eyebrow">Comercial</span>
        <div class="metric"><span>Pedidos</span><strong>${analytics.total_orders || 0}</strong></div>
        <div class="metric"><span>Ticket médio</span><strong>${formatarMoeda(ticketMedio)}</strong></div>
        <div class="metric"><span>Clientes</span><strong>${getDashboardStats().clientesAtivos}</strong></div>
      </section>
    </div>
  `;
}

function renderDashboard() {
  const totaisCaixa = calcularTotaisCaixa();
  const stats = getDashboardStats();
  const plano = getPlanoAtual();
  const analytics = getDashboardAnalyticsLocal(dashboardPeriod);
  agendarAnalyticsDashboard(analytics);

  const cards = [
    { icone: "💸", titulo: "Faturamento do dia", valor: formatarMoeda(stats.faturamentoDia), badge: "Hoje", tela: "caixa", state: "teal" },
    { icone: "📋", titulo: "Pedidos do dia", valor: stats.pedidosHoje, badge: "Operação", tela: "pedidos", filtro: "hoje", state: "neutral" },
    { icone: "🕒", titulo: "Pedidos em aberto", valor: stats.pedidosAbertos, badge: stats.pedidosAbertos ? "Ação" : "OK", tela: "pedidos", filtro: "abertos", state: stats.pedidosAbertos ? "orange" : "green" },
    { icone: "🖨️", titulo: "Produções ativas", valor: stats.producoesAtivas, badge: "Produção", tela: "producao", state: "teal" },
    { icone: "📦", titulo: "Estoque baixo", valor: stats.estoqueBaixo, badge: stats.estoqueBaixo ? "Atenção" : "OK", tela: "estoque", state: stats.estoqueBaixo ? "orange" : "green" },
    { icone: "📈", titulo: "Lucro estimado", valor: formatarMoeda(stats.lucroEstimado), badge: "Margem", tela: "relatorios", state: "green" },
    { icone: "👥", titulo: "Clientes", valor: stats.clientesAtivos, badge: "Carteira", tela: "clientes", state: "neutral" },
    { icone: "💳", titulo: "Caixa / financeiro", valor: formatarMoeda(totaisCaixa.saldo), badge: "Saldo", tela: "caixa", state: totaisCaixa.saldo < 0 ? "red" : "teal" }
  ];

  return `
    <section class="dashboard-pro premium-dashboard">
      ${renderDashboardSearch()}
      ${renderDashboardPeriodTabs()}
      ${renderDashboardAnalyticsHero(analytics)}
      ${renderDashboardComboChart(analytics)}
      ${renderDashboardInsights(analytics)}
      ${renderDashboardAnalyticSections(analytics)}

      <div class="dashboard-kpis">
        ${cards.map(renderDashboardKpiCard).join("")}
      </div>

      ${pedidos.length === 0 && temAcessoCompleto() ? `
        <section class="card onboarding-card">
          <div class="card-header">
            <h2>Primeiro pedido guiado</h2>
            <span class="status-badge">Onboarding</span>
          </div>
          <div class="actions">
            <button class="btn" onclick="trocarTela('calculadora')">Calcular item</button>
            <button class="btn secondary" onclick="trocarTela('estoque')">Cadastrar material</button>
            <button class="btn ghost" onclick="trocarTela('pedido')">Montar pedido</button>
          </div>
        </section>
      ` : ""}

      <div class="dashboard-split">
        <section class="card">
          <div class="card-header">
            <h2>💰 Resumo financeiro</h2>
            <span class="status-badge">Caixa</span>
          </div>
          <div class="metrics">
            <div class="metric"><span>Saldo</span><strong>${formatarMoeda(totaisCaixa.saldo)}</strong></div>
            <div class="metric"><span>Entradas</span><strong>${formatarMoeda(totaisCaixa.entradas)}</strong></div>
            <div class="metric"><span>Saídas</span><strong>${formatarMoeda(totaisCaixa.saidas)}</strong></div>
          </div>
        </section>
        <section class="card">
          <div class="card-header">
            <h2>☁️ Continuidade</h2>
            <span class="status-badge">${temAcessoNuvem() ? "Liberado" : "Premium"}</span>
          </div>
          <p class="muted">Backup JSON permanece disponível. A sincronização principal usa Supabase vinculado à conta logada, sem configuração técnica manual.</p>
          <div class="actions">
            <button class="btn secondary" onclick="exportarBackup()">Exportar backup</button>
            <button class="btn ghost" onclick="trocarTela('backup')">Dados e Backup</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

function labelStatusPedido(status = "aberto") {
  const mapa = {
    aberto: "Aberto",
    producao: "Produção",
    aguardando: "Aguardando",
    pausado: "Aguardando",
    entregue: "Pago",
    finalizado: "Pago",
    pago: "Pago",
    cancelado: "Cancelado"
  };
  return mapa[String(status || "aberto").toLowerCase()] || String(status || "Aberto");
}

function classeStatusPedido(status = "aberto") {
  const valor = String(status || "aberto").toLowerCase();
  if (["producao", "produção"].includes(valor)) return "order-status-production";
  if (["aguardando", "pausado"].includes(valor)) return "order-status-waiting";
  if (["pago", "entregue", "finalizado"].includes(valor)) return "order-status-paid";
  if (valor === "cancelado") return "order-status-cancelled";
  return "order-status-open";
}

function resumoMaterialItemPedido(item = {}) {
  const materiais = getMateriaisItem(item);
  if (!materiais.length) return [];
  return materiais.slice(0, 3).map((material) => {
    const estoqueItem = getMaterialEstoque(material.materialId);
    return material.nome || estoqueItem?.nome || "Material";
  }).filter(Boolean);
}

function renderChipsMaterialPedido(item = {}) {
  const chips = resumoMaterialItemPedido(item);
  if (!chips.length) return `<span class="order-chip muted-chip">Sem material</span>`;
  return chips.map((chip) => `<span class="order-chip">${escaparHtml(chip)}</span>`).join("");
}

function renderPedido() {
  const planoAtual = getPlanoAtual();
  if (planoAtual.blockLevel === "total" || planoAtual.status === "bloqueado") return renderBloqueioPlano("Novo pedido");
  const titulo = pedidoEditando ? "Editar pedido" : "Novo pedido";
  const botao = pedidoEditando ? "Salvar" : "Salvar";
  itensPedido = normalizarItensPedido(itensPedido);
  const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  const statusAtual = pedidoEditando?.status || "aberto";
  const clienteResumo = clientePedido || clienteDoPedido(pedidoEditando || {}) || "Cliente não informado";
  const observacaoCurta = pedidoEditando?.observacao || pedidoEditando?.observacoes || "";

  const itensHtml = itensPedido.length
    ? itensPedido.map((item, i) => `
        <details class="order-item-card" ${itensPedido.length === 1 ? "open" : ""}>
          <summary class="order-item-summary">
            <span class="order-item-main">
              <strong>${escaparHtml(item.nome || "Item do pedido")}</strong>
              <small>Qtd ${Number(item.qtd) || 1} • ${renderChipsMaterialPedido(item)}</small>
            </span>
            <span class="order-item-total">${formatarMoeda(Number(item.total) || 0)}</span>
          </summary>
          <div class="order-item-details">
            <div class="order-item-edit-grid">
              <label class="field">
                <span>Item</span>
                <input value="${escaparAttr(item.nome)}" oninput="editarNome(${i}, this.value)">
              </label>
              <label class="field compact-field">
                <span>Qtd</span>
                <input type="number" min="1" step="1" value="${Number(item.qtd) || 1}" onchange="editarQtd(${i}, this.value)">
              </label>
              <label class="field compact-field">
                <span>Valor unitário</span>
                <input type="number" min="0" step="0.01" value="${(Number(item.valor) || 0).toFixed(2)}" onchange="editarPreco(${i}, this.value)">
              </label>
              <label class="field compact-field">
                <span>Horas</span>
                <input type="number" min="0" step="0.01" value="${Number(item.tempoHoras) || 0}" onchange="editarTempoItem(${i}, this.value)">
              </label>
              <label class="field compact-field">
                <span>Tipo</span>
                <select onchange="editarTipoImpressaoItem(${i}, this.value)">
                  <option value="FDM" ${item.tipoImpressao !== "RESINA" ? "selected" : ""}>FDM</option>
                  <option value="RESINA" ${item.tipoImpressao === "RESINA" ? "selected" : ""}>RESINA</option>
                </select>
              </label>
            </div>
            <div class="order-material-compact">
              <div class="order-material-head">
                <span>${renderChipsMaterialPedido(item)}</span>
                <button class="btn ghost compact-action" type="button" onclick="adicionarMaterialProduto(${i})">+ material</button>
              </div>
              ${renderMateriaisItemPedido(item, i)}
            </div>
            <div class="order-item-actions">
              <div class="item-subtotal">
                <span>Subtotal</span>
                <strong>${formatarMoeda(Number(item.total) || 0)}</strong>
              </div>
              <button class="icon-button danger" onclick="removerItem(${i})" title="Remover item">×</button>
            </div>
          </div>
        </details>
      `).join("")
    : `<div class="order-empty-state"><strong>Nenhum item ainda</strong><span>Adicione pela calculadora ou crie um item manual.</span></div>`;

  return `
    <section class="card order-edit-screen order-flow-screen">
      <div class="card-header order-edit-header">
        <h2>${titulo}</h2>
        ${pedidoEditando ? `<button class="icon-button" onclick="cancelarEdicaoPedido()" title="Cancelar edição">↩</button>` : ""}
      </div>
      <div class="order-mini-summary">
        <div>
          <strong>${escaparHtml(clienteResumo)}</strong>
          <span>${itensPedido.length} item(ns) • ${escaparHtml(labelStatusPedido(statusAtual))} • ${formatarMoeda(total)}</span>
        </div>
        <span class="order-status-badge ${classeStatusPedido(statusAtual)}">${escaparHtml(labelStatusPedido(statusAtual))}</span>
      </div>

      <section class="order-step-panel">
        <div class="order-step-title">
          <span>1</span>
          <strong>Resumo</strong>
        </div>
        <div class="order-summary-grid">
          <label class="field">
            <span>Cliente</span>
            <input id="clienteNome" placeholder="Nome do cliente" value="${escaparAttr(clientePedido)}" oninput="atualizarClientePedido(this.value)">
          </label>
          <label class="field">
            <span>WhatsApp</span>
            <input id="clienteTelefone" inputmode="tel" placeholder="5585999999999" value="${escaparAttr(clienteTelefonePedido)}" oninput="atualizarTelefoneClientePedido(this.value)">
          </label>
          <label class="field compact-field">
            <span>Status</span>
            <select id="pedidoStatus">
              ${["aberto", "producao", "pausado", "entregue", "cancelado"].map((status) => `<option value="${status}" ${statusAtual === status ? "selected" : ""}>${labelStatusPedido(status)}</option>`).join("")}
            </select>
          </label>
        </div>
        ${observacaoCurta ? `<p class="order-note-preview">${escaparHtml(String(observacaoCurta).slice(0, 120))}</p>` : ""}
      </section>

      <section class="order-step-panel">
        <div class="order-step-title">
          <span>2</span>
          <strong>Itens</strong>
          <small>${itensPedido.length} item(ns)</small>
        </div>
        <div class="order-items-list">${itensHtml}</div>
      </section>

      <div class="order-bottom-bar">
        <div>
          <span>Total</span>
          <strong>${formatarMoeda(total)}</strong>
        </div>
        <button class="btn secondary" onclick="iniciarAdicionarItemPedido()">+ Item</button>
        <button class="btn" onclick="fecharPedido()" ${pedidoSalvando ? "disabled" : ""}>${botao}</button>
      </div>

      <div class="order-secondary-actions">
        <button class="btn ghost" onclick="adicionarProdutoManual()">Manual</button>
        <button class="btn ghost" onclick="gerarPDF()">PDF</button>
        <button class="btn ghost" onclick="enviarWhats()">WhatsApp</button>
      </div>
    </section>
  `;
}

function renderPaletaCoresMaterial(inputId, selected = "") {
  const valor = String(selected || "").trim().toLowerCase();
  return `
    <div class="material-color-palette" role="group" aria-label="Escolher cor do material">
      ${MATERIAL_COLOR_PALETTE.map((item) => {
        const ativo = valor && item.nome.toLowerCase() === valor;
        const estilo = String(item.cor || "").includes("gradient") ? `background:${item.cor}` : `background-color:${item.cor}`;
        return `
          <button class="material-color-chip ${ativo ? "active" : ""}" type="button" data-target="${escaparAttr(inputId)}" data-color="${escaparAttr(item.nome)}" onclick="selecionarCorMaterial('${escaparAttr(inputId)}', '${escaparAttr(item.nome)}')" title="${escaparAttr(item.nome)}">
            <span class="material-color-dot" style="${escaparAttr(estilo)}"></span>
            <span>${escaparHtml(item.nome)}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function selecionarCorMaterial(inputId, cor) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = cor || "";
  const alvo = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(inputId) : String(inputId).replace(/"/g, '\\"');
  document.querySelectorAll(`.material-color-chip[data-target="${alvo}"]`).forEach((botao) => {
    botao.classList.toggle("active", String(botao.dataset.color || "") === String(cor || ""));
  });
}

function renderMaterialOptions(selectedId = "", opcoes = {}) {
  const materiais = normalizarEstoque();
  const incluirSemVinculo = opcoes.includeEmpty !== false;
  const labelSemVinculo = opcoes.emptyLabel || "Sem vínculo com estoque";
  const adicionar = opcoes.includeAdd
    ? `<option value="${MATERIAL_ADD_OPTION}">+ Adicionar material ao estoque</option>`
    : "";
  const vazio = incluirSemVinculo ? `<option value="" ${!selectedId ? "selected" : ""}>${escaparHtml(labelSemVinculo)}</option>` : "";
  if (!materiais.length) return adicionar + vazio + `<option value="" disabled>Nenhum material cadastrado</option>`;
  return adicionar + vazio + materiais.map((material) => `
    <option value="${escaparAttr(material.id)}" ${String(material.id) === String(selectedId) ? "selected" : ""}>
      ${escaparHtml(material.nome)} (${Number(material.qtd).toFixed(3)} kg)
    </option>
  `).join("");
}

function renderMateriaisItemPedido(item, itemIndex) {
  const materiais = getMateriaisItem(item);
  const linhas = materiais.length ? materiais : [{ materialId: "", gramas: 0 }];
  return linhas.map((material, materialIndex) => `
    <div class="material-line">
      <label class="field compact-field">
        <span>Material</span>
        <select onchange="editarMaterialItem(${itemIndex}, ${materialIndex}, this.value)">
          ${renderMaterialOptions(material.materialId)}
        </select>
      </label>
      <label class="field compact-field">
        <span>Gramas</span>
        <input type="number" min="0" step="0.1" value="${Number(material.gramas) || 0}" onchange="editarGramasItem(${itemIndex}, ${materialIndex}, this.value)">
      </label>
      <button class="icon-button danger" onclick="removerMaterialProduto(${itemIndex}, ${materialIndex})" title="Remover material">×</button>
    </div>
  `).join("");
}

function renderEstoque() {
  const podeOperar = permitirVisualizacaoOperacionalBasica();
  normalizarEstoque();
  const linhas = estoque.length
    ? estoque.map((material, i) => `
        <div class="stock-row">
          <div class="row-title">
            <strong>${escaparHtml(material.nome)}</strong>
            <span class="muted">${escaparHtml(material.tipo || inferirTipoMaterial(material.nome))}${material.cor ? " • " + escaparHtml(material.cor) : ""} • ${(Number(material.qtd) || 0).toFixed(3)} kg</span>
          </div>
          ${(Number(material.qtd) || 0) <= estoqueMinimoKg ? `<span class="status-badge badge-alerta">Estoque baixo</span>` : `<span class="status-badge badge-ativo">OK</span>`}
          ${podeOperar ? `<div class="row-actions">
            <button class="btn ghost" type="button" data-action="stock-edit" data-index="${i}">✏️ Editar</button>
            <button class="btn danger" type="button" data-action="stock-remove" data-index="${i}">Remover</button>
          </div>` : ""}
        </div>
      `).join("")
    : `<p class="empty">Nenhum material cadastrado.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>📦 Estoque</h2>
      </div>
      ${podeOperar ? "" : `<p class="muted">Seu acesso está bloqueado. Visualização liberada; alterações voltam após regularização.</p>`}
      ${podeOperar ? `
      <label class="field">
        <span>Tipo de material</span>
        <select id="matTipo">
          ${tiposMaterial.map((tipo) => `<option value="${tipo}">${tipo}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>Cor do material</span>
        <input id="matCor" placeholder="Escolha na paleta" readonly>
        ${renderPaletaCoresMaterial("matCor")}
      </label>
      <label class="field">
        <span>Quantidade em kg</span>
        <input id="matQtd" type="number" min="0" step="0.01" placeholder="Ex.: 1.5">
      </label>
      <button class="btn" type="button" data-action="stock-add">Adicionar material</button>` : `<div class="actions"><button class="btn" type="button" data-action="open-payment">Pagar agora</button></div>`}
      ${linhas}
    </section>
  `;
}

function renderListaPedidos() {
  const podeOperar = permitirVisualizacaoOperacionalBasica();
  const filtroDashboard = String(window.__pedidosFiltroDashboard || "");
  const listaBase = filtroDashboard === "abertos"
    ? pedidos.filter((pedido) => !["entregue", "cancelado", "finalizado"].includes(String(pedido.status || "aberto")))
    : filtroDashboard === "hoje"
      ? pedidos.filter((pedido) => dataPedidoIso(pedido) === hojeIsoData())
      : pedidos;
  const lista = [...listaBase].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  const limitePedidos = Math.max(LIST_PAGE_SIZE, Number(window.__pedidosLimite) || LIST_PAGE_SIZE);
  const listaPaginada = lista.slice(0, limitePedidos);
  const pedidoSelecionado = pedidos.find((pedido) => String(pedido.id) === String(pedidoVisualizandoId));
  const detalhe = pedidoSelecionado ? renderDetalhePedido(pedidoSelecionado) : "";
  const linhas = lista.length
    ? listaPaginada.map((pedido) => {
        const id = Number(pedido.id);
        const itens = Array.isArray(pedido.itens) ? pedido.itens.length : 1;
        const status = pedido.status || "aberto";
        return `
          <div class="list-row clickable-row" onclick="visualizarPedido(${id})">
            <div class="row-title">
              <strong>${escaparHtml(clienteDoPedido(pedido))}</strong>
              <span class="muted">${escaparHtml(pedido.data || "")}</span>
            </div>
            <span class="status-badge ${classeStatusPlano(status)}">${escaparHtml(status)}</span>
            <div class="muted">${itens} item(ns) • ${formatarMoeda(totalPedido(pedido))}</div>
            <div class="row-actions">
              <button class="btn ghost" onclick="event.stopPropagation(); visualizarPedido(${id})">Ver</button>
              ${podeOperar ? `<button class="btn ghost" onclick="event.stopPropagation(); editarPedido(${id})">✏️ Editar</button>
              <button class="btn danger" onclick="event.stopPropagation(); removerPedido(${id})">Excluir</button>` : ""}
            </div>
          </div>
        `;
      }).join("")
    : `<p class="empty">Nenhum pedido fechado ainda.</p>`;
  const paginacao = lista.length > listaPaginada.length
    ? `<div class="actions pagination-actions"><span class="muted">Mostrando ${listaPaginada.length} de ${lista.length}</span><button class="btn ghost" onclick="carregarMaisPedidos()">Carregar mais</button></div>`
    : "";

  return `
    <section class="card">
      <div class="card-header">
        <h2>📋 Pedidos</h2>
        ${podeOperar ? `<button class="icon-button" onclick="trocarTela('pedido')" title="Novo pedido">➕</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Pagar agora</button>`}
      </div>
      ${filtroDashboard ? `<div class="filter-chip-row"><span class="status-badge">Filtro: ${filtroDashboard === "hoje" ? "pedidos de hoje" : "pedidos em aberto"}</span><button class="btn ghost" onclick="window.__pedidosFiltroDashboard=''; renderApp()">Ver todos</button></div>` : ""}
      ${podeOperar ? "" : `<p class="muted">Seu plano está inativo. Você pode visualizar seus dados e regularizar o pagamento para continuar.</p>`}
      ${detalhe}
      ${linhas}
      ${paginacao}
    </section>
  `;
}

function renderDetalhePedido(pedido) {
  const itens = normalizarItensPedido(pedido);
  const total = totalPedido(pedido);
  return `
    <div class="detail-panel">
      <div class="card-header">
        <h2>Pedido #${escaparHtml(pedido.id)}</h2>
        <span class="status-badge ${classeStatusPlano(pedido.status || "aberto")}">${escaparHtml(pedido.status || "aberto")}</span>
      </div>
      <p class="muted">Cliente: ${escaparHtml(clienteDoPedido(pedido))}${telefoneDoPedido(pedido) ? " • WhatsApp: " + escaparHtml(telefoneDoPedido(pedido)) : ""} • Total: ${formatarMoeda(total)}</p>
      <div class="history-list">
        ${itens.map((item) => `
          <div class="history-item">
            <strong>${escaparHtml(item.nome)} • ${escaparHtml(item.tipoImpressao)}</strong>
            <span class="muted">Qtd ${item.qtd} • Tempo ${Number(item.tempoHoras || 0).toFixed(2)}h • ${formatarMoeda(item.total)}</span>
            ${getMateriaisItem(item).map((material) => `<span class="muted">${escaparHtml(material.nome || getMaterialEstoque(material.materialId)?.nome || "Material")} - ${Number(material.gramas).toFixed(1)}g</span>`).join("")}
          </div>
        `).join("")}
      </div>
      <div class="actions">
        <button class="btn" onclick="baixarPdfPedidoSalvo(${Number(pedido.id)})">Baixar PDF</button>
        <button class="btn ghost" onclick="enviarWhatsPedidoSalvo(${Number(pedido.id)})">WhatsApp</button>
        <button class="btn secondary" onclick="editarPedido(${Number(pedido.id)})">Editar pedido</button>
        <button class="btn danger" onclick="removerPedido(${Number(pedido.id)})">Excluir pedido</button>
        <button class="btn ghost" onclick="pedidoVisualizandoId=null; renderApp()">Fechar detalhe</button>
      </div>
    </div>
  `;
}

function visualizarPedido(id) {
  pedidoVisualizandoId = id;
  trocarTela("pedidos");
}

function carregarMaisPedidos() {
  window.__pedidosLimite = Math.max(LIST_PAGE_SIZE, Number(window.__pedidosLimite) || LIST_PAGE_SIZE) + LIST_PAGE_SIZE;
  renderApp();
}

function renderProducao() {
  if (!temAcessoCompleto()) return renderBloqueioPlano("Produção");
  const producoes = pedidos.filter((pedido) => ["aberto", "producao", "pausado"].includes(String(pedido.status || "aberto")));
  const linhas = producoes.length ? producoes.map((pedido) => `
    <div class="list-row">
      <div class="row-title">
        <strong>${escaparHtml(clienteDoPedido(pedido))}</strong>
        <span class="muted">${normalizarItensPedido(pedido).length} produto(s) • ${formatarMoeda(totalPedido(pedido))}</span>
      </div>
      <label class="field compact-field">
        <span>Status</span>
        <select onchange="alterarStatusPedido(${Number(pedido.id)}, this.value)">
          ${["aberto", "producao", "pausado", "entregue", "cancelado"].map((status) => `<option value="${status}" ${String(pedido.status || "aberto") === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>
      <button class="btn ghost" onclick="visualizarPedido(${Number(pedido.id)})">Ver pedido</button>
    </div>
  `).join("") : `<p class="empty">Nenhuma produção ativa.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>🖨️ Produção</h2>
        <span class="status-badge">${producoes.length} ativa(s)</span>
      </div>
      ${linhas}
    </section>
  `;
}

function renderClientes() {
  if (isSuperAdmin()) return renderClientesSaas();
  return renderClientesOperacionais();
}

function renderClientesOperacionais() {
  const mapa = new Map();
  pedidos.forEach((pedido) => {
    const nome = clienteDoPedido(pedido);
    const atual = mapa.get(nome) || { nome, pedidos: 0, total: 0 };
    atual.pedidos += 1;
    atual.total += totalPedido(pedido);
    mapa.set(nome, atual);
  });
  const clientes = Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  const linhas = clientes.length ? clientes.map((cliente) => `
    <div class="list-row">
      <div class="row-title">
        <strong>${escaparHtml(cliente.nome)}</strong>
        <span class="muted">${cliente.pedidos} pedido(s)</span>
      </div>
      <strong>${formatarMoeda(cliente.total)}</strong>
    </div>
  `).join("") : `<p class="empty">Clientes aparecem automaticamente a partir dos pedidos.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>👥 Clientes</h2>
        <span class="status-badge">${clientes.length}</span>
      </div>
      ${linhas}
    </section>
  `;
}

function rotuloStatusCliente(status) {
  const mapa = {
    active: "ativo",
    overdue: "atrasado",
    blocked: "bloqueado",
    inactive: "inativo",
    cancelled: "cancelado",
    anonymized: "anonimizado"
  };
  return mapa[status] || status || "ativo";
}

function getClientesSaasFiltrados() {
  marcarClientesInativosLocal();
  const filtros = window.__clientesSaasFiltros || {};
  return saasClients.filter((cliente) => clientePassaFiltrosSaas(cliente, filtros));
}

function normalizarTextoBusca(valor = "") {
  return removerAcentos(String(valor || "").toLowerCase().trim());
}

function clientePassaFiltrosSaas(cliente, filtros = window.__clientesSaasFiltros || {}) {
  if (normalizarEmail(cliente.email) === SUPERADMIN_BOOTSTRAP_EMAIL) return false;
  if (cliente.archivedAt) return false;
  const termoNome = String(filtros.nome || "").toLowerCase();
  const termoEmail = String(filtros.email || "").toLowerCase();
  const plano = String(filtros.plano || "");
  const status = String(filtros.status || "");
  const assinatura = getAssinaturaSaas(cliente.id);
  const planoCliente = getPlanoSaas(assinatura?.activePlan || cliente.activePlan || assinatura?.planSlug || cliente.planoAtual || "free");
  if (termoNome && !normalizarTextoBusca(cliente.name).includes(normalizarTextoBusca(termoNome))) return false;
  if (termoEmail && !normalizarTextoBusca(cliente.email).includes(normalizarTextoBusca(termoEmail))) return false;
  if (plano && planoCliente.slug !== plano) return false;
  if (status && cliente.status !== status) return false;
  return true;
}

function aplicarFiltroClientesSaasNaTela() {
  const container = document.getElementById("clientesSaasLista");
  if (container) {
    const total = saasClients.filter((cliente) => normalizarEmail(cliente.email) !== SUPERADMIN_BOOTSTRAP_EMAIL && !cliente.archivedAt).length;
    container.innerHTML = renderListaClientesSaasConteudo(total);
    return;
  }
  const filtros = window.__clientesSaasFiltros || {};
  const linhas = Array.from(document.querySelectorAll("[data-client-row='saas']"));
  let visiveis = 0;
  linhas.forEach((linha) => {
    const cliente = getClienteSaasPorId(linha.dataset.clientId || "");
    const mostrar = cliente ? clientePassaFiltrosSaas(cliente, filtros) : false;
    linha.hidden = !mostrar;
    if (mostrar) visiveis += 1;
  });
  const vazio = document.getElementById("clientesSaasFiltroVazio");
  if (vazio) vazio.hidden = visiveis !== 0;
}

function definirEstadoClientesSaasRemoto(estado = {}) {
  saasClientsRemoteState = {
    status: estado.status || "idle",
    message: estado.message || "",
    detail: estado.detail || "",
    updatedAt: estado.updatedAt || new Date().toISOString()
  };
}

function logSuperadminSupabaseDebug(evento, detalhes = {}) {
  try {
    console.warn("[Superadmin/Supabase]", evento, {
      code: detalhes.code || "",
      status: detalhes.status || "",
      route: detalhes.route || "",
      message: detalhes.message || ""
    });
  } catch (_) {}
}

function classificarFalhaClientesSaasRemoto(erro) {
  const mensagem = String(erro?.message || erro || "");
  const status = erro?.details?.status || erro?.cause?.details?.status || "";
  const route = erro?.details?.caminho || erro?.cause?.details?.caminho || "";
  if (status === 401 || /jwt|token|unauthorized|session/i.test(mensagem)) {
    return {
      status: "auth-error",
      message: "Sessão Supabase expirada. Faça login novamente para carregar clientes remotos.",
      detail: "AUTH",
      log: { code: "AUTH", status, route, message: mensagem.slice(0, 160) }
    };
  }
  if (status === 403 || /row-level security|violates row-level security|permission denied|not authorized|PGRST/i.test(mensagem)) {
    return {
      status: "permission-error",
      message: "A busca foi bloqueada por permissão/RLS no Supabase.",
      detail: "RLS",
      log: { code: "RLS", status, route, message: mensagem.slice(0, 160) }
    };
  }
  return {
    status: "connection-error",
    message: "Não foi possível conectar ao Supabase para carregar clientes.",
    detail: "NETWORK",
    log: { code: "NETWORK", status, route, message: mensagem.slice(0, 160) }
  };
}

function renderEstadoClientesSaasRemoto(totalClientes, totalFiltrado) {
  const estado = saasClientsRemoteState || {};
  if (estado.status === "loading") {
    return `<div class="saas-sync-state info">Carregando clientes do Supabase...</div>`;
  }
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) {
    return `<div class="saas-sync-state warning">Entre com a conta Supabase do superadmin para carregar clientes remotos.</div>`;
  }
  if (estado.status === "auth-error") {
    return `<div class="saas-sync-state warning">${escaparHtml(estado.message)}</div>`;
  }
  if (estado.status === "permission-error" || estado.status === "permission-warning") {
    return `<div class="saas-sync-state warning">${escaparHtml(estado.message)}</div>`;
  }
  if (estado.status === "connection-error") {
    return `<div class="saas-sync-state error">${escaparHtml(estado.message)}</div>`;
  }
  if (totalClientes === 0) {
    return `<p class="empty">Nenhum cliente cadastrado.</p>`;
  }
  if (estado.status === "success" && estado.updatedAt) {
    return `<div class="saas-sync-state success">Clientes remotos atualizados.</div>`;
  }
  return "";
}

function getPaginaClientesSaas() {
  return Math.max(1, Number(window.__clientesSaasPagina) || 1);
}

function setPaginaClientesSaas(pagina) {
  window.__clientesSaasPagina = Math.max(1, Number(pagina) || 1);
  renderApp();
}

function getClientesSaasPagina(lista = getClientesSaasFiltrados()) {
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / SUPERADMIN_PAGE_SIZE));
  const pagina = Math.min(getPaginaClientesSaas(), totalPaginas);
  window.__clientesSaasPagina = pagina;
  const inicio = (pagina - 1) * SUPERADMIN_PAGE_SIZE;
  return {
    pagina,
    total,
    totalPaginas,
    inicio,
    fim: Math.min(inicio + SUPERADMIN_PAGE_SIZE, total),
    itens: lista.slice(inicio, inicio + SUPERADMIN_PAGE_SIZE)
  };
}

function renderLinhaClienteSaas(cliente) {
  const assinatura = getAssinaturaSaas(cliente.id);
  const plano = getPlanoSaas(assinatura?.activePlan || cliente.activePlan || assinatura?.planSlug || cliente.planoAtual || "free");
  const usuarioPrincipal = getUsuariosDoCliente(cliente.id)[0];
  const clienteIdAttr = escaparAttr(cliente.id);
  const selecionado = String(window.__clienteSaasSelecionadoId || "") === String(cliente.id);
  const badgeTeste = cliente.isTestUser ? `<span class="status-badge badge-teste">Teste</span>` : "";
  return `
    <div class="client-admin-row ${selecionado ? "selected" : ""}" data-client-row="saas" data-client-id="${clienteIdAttr}" role="button" tabindex="0" aria-selected="${selecionado ? "true" : "false"}" onpointerdown="prepararSelecaoClienteSaas(event, '${clienteIdAttr}')" onpointermove="atualizarMovimentoClienteSaas(event, '${clienteIdAttr}')" onpointercancel="cancelarSelecaoClienteSaas(event, '${clienteIdAttr}')" ontouchstart="prepararSelecaoClienteSaas(event, '${clienteIdAttr}')" ontouchmove="atualizarMovimentoClienteSaas(event, '${clienteIdAttr}')" ontouchcancel="cancelarSelecaoClienteSaas(event, '${clienteIdAttr}')" onclick="selecionarResultadoClienteSaas(event, '${clienteIdAttr}')" onkeydown="acionarClienteSaasPorTeclado(event, '${clienteIdAttr}')">
      <div>
        <strong>${escaparHtml(cliente.name)}</strong>
        <span class="muted">ID: ${escaparHtml(cliente.clientCode || cliente.id)}</span>
        <span class="muted">${escaparHtml(cliente.email)}${cliente.phone ? " • " + escaparHtml(cliente.phone) : ""}</span>
        <span class="muted">user_id: ${escaparHtml(assinatura?.userId || usuarioPrincipal?.id || "-")}</span>
        <span class="muted">active_plan: ${escaparHtml(assinatura?.activePlan || cliente.activePlan || "free")} • pending: ${escaparHtml(assinatura?.pendingPlan || cliente.pendingPlan || "-")} • status: ${escaparHtml(assinatura?.subscriptionStatus || cliente.subscriptionStatus || normalizarStatusPlano(assinatura?.status || cliente.statusAssinatura || "active"))}</span>
        <span class="muted">promo_used: ${assinatura?.promoUsed ? "true" : "false"} • expira: ${assinatura?.currentPeriodEnd ? new Date(assinatura.currentPeriodEnd).toLocaleDateString("pt-BR") : "-"}</span>
      </div>
      <span class="status-badge">${escaparHtml(plano.name)}</span>
      <span class="status-badge ${classeStatusPlano(cliente.status)}">${escaparHtml(rotuloStatusCliente(cliente.status))}</span>
      ${badgeTeste}
      <div class="client-meta">
        <span>${cliente.lastAccessAt ? new Date(cliente.lastAccessAt).toLocaleDateString("pt-BR") : "sem acesso"}</span>
        <span>${new Date(cliente.createdAt).toLocaleDateString("pt-BR")}</span>
      </div>
      <div class="row-actions">
        <button class="btn ghost" onclick="editarClienteSaas('${clienteIdAttr}')">Editar</button>
        <button class="btn warning" onclick="alterarStatusClienteSaas('${clienteIdAttr}', '${cliente.status === "blocked" ? "active" : "blocked"}')">${cliente.status === "blocked" ? "Reativar" : "Bloquear"}</button>
        <button class="btn ghost" onclick="alterarPlanoClienteSaas('${clienteIdAttr}')">Alterar plano</button>
        <button class="btn ghost" onclick="liberarDiasManualClienteSaas('${clienteIdAttr}')">Liberar dias</button>
        <button class="btn ghost" onclick="alternarUsuarioTesteSaas('${clienteIdAttr}')">${cliente.isTestUser ? "Remover teste" : "Marcar teste"}</button>
        <button class="btn ghost" onclick="exportarClienteSaas('${clienteIdAttr}')">Exportar</button>
        <button class="btn ghost" onclick="arquivarClienteSaas('${clienteIdAttr}')">Arquivar</button>
        <button class="btn danger" onclick="anonimizarClienteSaas('${clienteIdAttr}')">Anonimizar</button>
        ${cliente.isTestUser ? `<button class="btn danger" onclick="excluirUsuarioTesteSaas('${clienteIdAttr}')">Excluir usuário de teste</button>` : ""}
      </div>
    </div>
  `;
}

function renderPaginacaoClientesSaas(paginaInfo) {
  if (paginaInfo.total <= SUPERADMIN_PAGE_SIZE) return "";
  return `
    <div class="actions pagination-actions">
      <button class="btn ghost" onclick="setPaginaClientesSaas(${paginaInfo.pagina - 1})" ${paginaInfo.pagina <= 1 ? "disabled" : ""}>Anterior</button>
      <span class="muted">Mostrando ${paginaInfo.inicio + 1}-${paginaInfo.fim} de ${paginaInfo.total}</span>
      <button class="btn ghost" onclick="setPaginaClientesSaas(${paginaInfo.pagina + 1})" ${paginaInfo.pagina >= paginaInfo.totalPaginas ? "disabled" : ""}>Próxima</button>
    </div>
  `;
}

function renderListaClientesSaasConteudo(totalClientes) {
  const listaFiltrada = getClientesSaasFiltrados();
  const paginaInfo = getClientesSaasPagina(listaFiltrada);
  const estadoRemoto = renderEstadoClientesSaasRemoto(totalClientes, listaFiltrada.length);
  const vazioFiltro = `<p id="clientesSaasFiltroVazio" class="empty" ${listaFiltrada.length === 0 && totalClientes > 0 ? "" : "hidden"}>Nenhum cliente corresponde aos filtros atuais.</p>`;
  const linhas = paginaInfo.itens.map(renderLinhaClienteSaas).join("");
  return `${estadoRemoto}${linhas}${vazioFiltro}${renderPaginacaoClientesSaas(paginaInfo)}`;
}

function renderClientesSaas() {
  garantirEstruturaSaasLocal();
  const clientesVisiveis = saasClients.filter((cliente) => normalizarEmail(cliente.email) !== SUPERADMIN_BOOTSTRAP_EMAIL && !cliente.archivedAt);
  const total = clientesVisiveis.length;
  const ativos = clientesVisiveis.filter((cliente) => cliente.status === "active").length;
  const atrasados = clientesVisiveis.filter((cliente) => cliente.status === "overdue").length;
  const inativos = clientesVisiveis.filter((cliente) => cliente.status === "inactive").length;
  const filtros = window.__clientesSaasFiltros || {};
  const linhas = renderListaClientesSaasConteudo(total);

  return `
    <section class="card">
      <div class="card-header">
        <h2>👥 Clientes SaaS</h2>
        <span class="status-badge badge-superadmin">${ativos} ativos</span>
      </div>
      <div class="metrics">
        <div class="metric"><span>Total clientes</span><strong>${total}</strong></div>
        <div class="metric"><span>Ativos</span><strong>${ativos}</strong></div>
        <div class="metric"><span>Atrasados</span><strong>${atrasados}</strong></div>
        <div class="metric"><span>Inativos &gt;90 dias</span><strong>${inativos}</strong></div>
      </div>
      <div class="sync-grid">
        <label class="field">
          <span>Nome</span>
          <input id="clientesSaasFiltroNome" value="${escaparAttr(filtros.nome || "")}" oninput="filtrarClientesSaas('nome', this.value)" placeholder="empresa" autocomplete="off">
        </label>
        <label class="field">
          <span>E-mail</span>
          <input id="clientesSaasFiltroEmail" value="${escaparAttr(filtros.email || "")}" oninput="filtrarClientesSaas('email', this.value)" placeholder="cliente@email.com" autocomplete="off">
        </label>
        <label class="field">
          <span>Plano</span>
          <select onchange="filtrarClientesSaas('plano', this.value)">
            <option value="">Todos</option>
            ${garantirPlanosSaas().map((plano) => `<option value="${plano.slug}" ${filtros.plano === plano.slug ? "selected" : ""}>${escaparHtml(plano.name)}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>Status</span>
          <select onchange="filtrarClientesSaas('status', this.value)">
            <option value="">Todos</option>
            ${["active", "overdue", "blocked", "inactive", "cancelled", "anonymized"].map((status) => `<option value="${status}" ${filtros.status === status ? "selected" : ""}>${rotuloStatusCliente(status)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="btn secondary" onclick="atualizarClientesSaasRemoto()">Atualizar Supabase</button>
        <button class="btn secondary" onclick="marcarClientesInativosAcao()">Marcar inativos &gt;90 dias</button>
        <button class="btn ghost" onclick="exportarClientesSaas()">Exportar dados</button>
      </div>
      <div id="clientesSaasLista" class="history-list users-list">${linhas}</div>
    </section>
  `;
}

function filtrarClientesSaas(campo, valor) {
  window.__clientesSaasFiltros = {
    ...(window.__clientesSaasFiltros || {}),
    [campo]: valor
  };
  window.__clientesSaasPagina = 1;
  clearTimeout(window.__clientesSaasFiltroTimer);
  window.__clientesSaasFiltroTimer = setTimeout(aplicarFiltroClientesSaasNaTela, 300);
}

function alvoInterativoClienteSaas(event) {
  return !!event?.target?.closest?.("button, a, input, select, textarea, label, .row-actions, .modal-card");
}

function fecharTecladoBuscaClientesSaas() {
  const ativo = document.activeElement;
  if (ativo && ["INPUT", "TEXTAREA", "SELECT"].includes(ativo.tagName)) {
    ativo.blur();
  }
}

function prepararSelecaoClienteSaas(event, id) {
  if (alvoInterativoClienteSaas(event)) return;
  const ponto = getPontoInteracaoClienteSaas(event);
  if (!ponto) return;
  window.__clienteSaasToque = {
    id: String(id),
    startX: ponto.x,
    startY: ponto.y,
    moved: false,
    cancelled: false,
    startedAt: Date.now()
  };
}

function getPontoInteracaoClienteSaas(event) {
  const toque = event?.changedTouches?.[0] || event?.touches?.[0] || null;
  const x = Number(toque?.clientX ?? event?.clientX);
  const y = Number(toque?.clientY ?? event?.clientY);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function atualizarMovimentoClienteSaas(event, id) {
  const estado = window.__clienteSaasToque;
  if (!estado || String(estado.id) !== String(id)) return;
  const ponto = getPontoInteracaoClienteSaas(event);
  if (!ponto) return;
  const dx = Math.abs(ponto.x - estado.startX);
  const dy = Math.abs(ponto.y - estado.startY);
  if (dx > 10 || dy > 10) {
    estado.moved = true;
  }
}

function cancelarSelecaoClienteSaas(event, id) {
  const estado = window.__clienteSaasToque;
  if (!estado || String(estado.id) !== String(id)) return;
  estado.cancelled = true;
  estado.moved = true;
}

function selecaoClienteSaasFoiArrasto(event, id) {
  const estado = window.__clienteSaasToque;
  if (!estado || String(estado.id) !== String(id)) return false;
  atualizarMovimentoClienteSaas(event, id);
  const foiArrasto = estado.moved === true || estado.cancelled === true;
  window.__clienteSaasToque = null;
  return foiArrasto;
}

function selecionarResultadoClienteSaas(event, id) {
  if (alvoInterativoClienteSaas(event)) return;
  if (selecaoClienteSaasFoiArrasto(event, id)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  selecionarClienteSaasResultado(id);
}

function acionarClienteSaasPorTeclado(event, id) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  selecionarClienteSaasResultado(id);
}

async function selecionarClienteSaasResultado(id) {
  if (!id || window.__clienteSaasSelecaoEmAndamento === String(id)) return;
  window.__clienteSaasSelecaoEmAndamento = String(id);
  window.__clienteSaasSelecionadoId = String(id);
  fecharTecladoBuscaClientesSaas();
  try {
    await editarClienteSaas(id);
  } finally {
    window.__clienteSaasSelecaoEmAndamento = "";
  }
}

function getClienteSaasPorId(id) {
  return saasClients.find((cliente) => String(cliente.id) === String(id));
}

async function editarClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const nome = await solicitarEntradaTexto({
    titulo: "Editar cliente",
    mensagem: "Nome da empresa",
    valor: cliente.name,
    obrigatorio: true
  });
  if (nome === null) return;
  const telefone = await solicitarEntradaTexto({
    titulo: "Editar cliente",
    mensagem: "Telefone",
    valor: cliente.phone || "",
    tipo: "tel"
  });
  cliente.name = nome.trim() || cliente.name;
  cliente.phone = telefone === null ? cliente.phone : (normalizePhoneBR(telefone) || telefone.trim());
  cliente.updatedAt = new Date().toISOString();
  salvarDados();
  registrarAuditoria("cliente editado", { email: cliente.email }, cliente.id);
  renderApp();
}

function pareceUuid(valor = "") {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(valor || ""));
}

function podeSalvarAdminSupabaseRemoto() {
  return isSuperAdmin() && !!syncConfig.supabaseAccessToken && !!syncConfig.supabaseUrl;
}

function getAlvoRpcClienteSaas(id) {
  const referencias = getReferenciasClienteSaas(id);
  const assinatura = getAssinaturaSaas(id);
  const candidatos = [
    assinatura?.userId,
    assinatura?.user_id,
    ...referencias.usuariosCliente.map((usuario) => usuario.userId || usuario.user_id || usuario.id),
    id
  ];
  return String(candidatos.find((valor) => pareceUuid(valor)) || id);
}

function aplicarLicencaEfetivaClienteSaas(id, licenca = {}) {
  if (!licenca || typeof licenca !== "object") return;
  const statusEfetivo = normalizarStatusLicencaEfetiva(licenca.effective_status || licenca.effectiveStatus || licenca.status);
  const activePlan = slugPlanoPorLicencaEfetiva(licenca);
  const cliente = getClienteSaasPorId(id || licenca.client_id);
  let assinatura = getAssinaturaSaas(id || licenca.client_id);
  if (!assinatura && (id || licenca.client_id)) {
    assinatura = normalizarAssinaturaSaas({ clientId: id || licenca.client_id, planSlug: activePlan, activePlan });
    saasSubscriptions.push(assinatura);
  }
  if (assinatura) {
    assinatura.userId = licenca.user_id || assinatura.userId || "";
    assinatura.planCode = String(licenca.plan_code || "").toUpperCase();
    assinatura.effectiveStatus = statusEfetivo;
    assinatura.planSlug = activePlan;
    assinatura.activePlan = activePlan;
    assinatura.pendingPlan = licenca.pending_plan || "";
    assinatura.paymentStatus = licenca.payment_status || (statusEfetivo === PLAN_ACCESS_STATES.PENDING ? "pending" : "none");
    assinatura.subscriptionStatus = licenca.subscription_status || (statusEfetivo === PLAN_ACCESS_STATES.TRIAL ? "trialing" : statusEfetivo === PLAN_ACCESS_STATES.ACTIVE ? "active" : "free");
    assinatura.status = statusLegadoPorLicencaEfetiva(statusEfetivo);
    assinatura.statusAssinatura = assinatura.status;
    assinatura.planExpiresAt = licenca.premium_until || licenca.expires_at || "";
    assinatura.currentPeriodEnd = licenca.current_period_end || assinatura.planExpiresAt;
    assinatura.expiresAt = assinatura.planExpiresAt;
    assinatura.trialStartedAt = licenca.trial_start_at || licenca.trial_started_at || "";
    assinatura.trialExpiresAt = licenca.trial_end_at || licenca.trial_expires_at || "";
    assinatura.trialConsumedAt = licenca.trial_consumed_at || assinatura.trialConsumedAt || "";
    assinatura.isTrialActive = statusEfetivo === PLAN_ACCESS_STATES.TRIAL;
    assinatura.manualOverride = licenca.manual_override === true;
    assinatura.manualOverrideReason = licenca.manual_override_reason || "";
    assinatura.blockedAt = licenca.blocked_at || "";
    assinatura.blockedReason = licenca.blocked_reason || "";
    assinatura.archivedAt = licenca.archived_at || "";
    assinatura.anonymizedAt = licenca.anonymized_at || "";
  }
  if (cliente) {
    cliente.activePlan = activePlan;
    cliente.planoAtual = activePlan;
    cliente.pendingPlan = licenca.pending_plan || "";
    cliente.paymentStatus = licenca.payment_status || (statusEfetivo === PLAN_ACCESS_STATES.PENDING ? "pending" : "none");
    cliente.subscriptionStatus = licenca.subscription_status || (statusEfetivo === PLAN_ACCESS_STATES.TRIAL ? "trialing" : statusEfetivo === PLAN_ACCESS_STATES.ACTIVE ? "active" : "free");
    cliente.statusAssinatura = statusLegadoPorLicencaEfetiva(statusEfetivo);
    cliente.planExpiresAt = licenca.premium_until || licenca.expires_at || "";
    cliente.trialStartedAt = licenca.trial_start_at || licenca.trial_started_at || "";
    cliente.trialExpiresAt = licenca.trial_end_at || licenca.trial_expires_at || "";
    cliente.trialConsumedAt = licenca.trial_consumed_at || cliente.trialConsumedAt || "";
    cliente.isTrialActive = statusEfetivo === PLAN_ACCESS_STATES.TRIAL;
    cliente.blockedAt = licenca.blocked_at || "";
    cliente.blockedReason = licenca.blocked_reason || "";
    cliente.archivedAt = licenca.archived_at || cliente.archivedAt || "";
    cliente.anonymizedAt = licenca.anonymized_at || cliente.anonymizedAt || "";
    if (statusEfetivo === PLAN_ACCESS_STATES.BLOCKED) cliente.status = "blocked";
    else if (cliente.anonymizedAt) cliente.status = "anonymized";
    else if (cliente.status !== "inactive") cliente.status = "active";
    cliente.updatedAt = licenca.updated_at || new Date().toISOString();
  }
  salvarDados();
}

async function chamarSuperadminUpdateSubscription(id, action, options = {}) {
  if (!podeSalvarAdminSupabaseRemoto()) {
    throw new Error("Entre como superadmin Supabase para salvar no banco.");
  }
  const alvo = options.targetUserId || getAlvoRpcClienteSaas(id);
  const licenca = await requisicaoSupabase("/rest/v1/rpc/superadmin_update_subscription", {
    method: "POST",
    body: JSON.stringify({
      target_user_id: String(alvo),
      action,
      plan_code: options.planCode || null,
      premium_until: options.premiumUntil || null,
      reason: options.reason || null
    })
  });
  aplicarLicencaEfetivaClienteSaas(id || licenca?.client_id, licenca);
  return licenca;
}

async function atualizarClienteSaasSupabaseParcial(id, payload = {}) {
  if (!podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
  await requisicaoSupabase(`/rest/v1/clients?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() })
  });
  return { ok: true };
}

async function atualizarStatusPerfisClienteSupabase(id, status) {
  if (!podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
  const statusPerfil = status === "blocked" ? "blocked" : "active";
  await Promise.all([
    requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: statusPerfil, updated_at: new Date().toISOString() })
    }).catch((erro) => registrarDiagnostico("Supabase", "Status profiles não atualizado", erro.message)),
    requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: statusPerfil, updated_at: new Date().toISOString() })
    }).catch((erro) => registrarDiagnostico("Supabase", "Status erp_profiles não atualizado", erro.message))
  ]);
  return { ok: true };
}

async function atualizarFlagTesteClienteSaasSupabase(id, isTestUser) {
  if (!podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
  await Promise.all([
    requisicaoSupabase(`/rest/v1/clients?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_test_user: isTestUser === true, updated_at: new Date().toISOString() })
    }),
    requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_test_user: isTestUser === true, updated_at: new Date().toISOString() })
    }).catch((erro) => registrarDiagnostico("Supabase", "Flag teste profiles não atualizada", erro.message)),
    requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_test_user: isTestUser === true, updated_at: new Date().toISOString() })
    }).catch((erro) => registrarDiagnostico("Supabase", "Flag teste erp_profiles não atualizada", erro.message))
  ]);
  return { ok: true };
}

async function atualizarAnonimizacaoClienteSaasSupabase(id, emailAnonimo) {
  if (!podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
  const atualizadoEm = new Date().toISOString();
  await Promise.all([
    requisicaoSupabase(`/rest/v1/clients?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        name: "Cliente anonimizado",
        responsible_name: null,
        nome_responsavel: null,
        email: emailAnonimo,
        phone: null,
        status: "anonymized",
        anonymized_at: atualizadoEm,
        updated_at: atualizadoEm
      })
    }),
    requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ name: "Usuário anonimizado", email: emailAnonimo, phone: null, status: "inactive", updated_at: atualizadoEm })
    }).catch((erro) => registrarDiagnostico("Supabase", "Profiles não anonimizados", erro.message)),
    requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ display_name: "Usuário anonimizado", email: emailAnonimo, phone: null, status: "inactive", updated_at: atualizadoEm })
    }).catch((erro) => registrarDiagnostico("Supabase", "ERP profiles não anonimizados", erro.message))
  ]);
  return { ok: true };
}

async function obterPlanIdSupabase(slug) {
  const plano = getPlanoSaas(slug);
  if (pareceUuid(plano.id)) return plano.id;
  if (!podeSalvarAdminSupabaseRemoto()) return "";
  const linhas = await requisicaoSupabase(`/rest/v1/plans?select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`, {
    method: "GET"
  });
  const remoto = Array.isArray(linhas) ? linhas[0] : null;
  if (remoto?.id) {
    saasPlans = mesclarListaPorId(saasPlans, [remoto], normalizarPlanoSaas);
    salvarDados();
    return String(remoto.id);
  }
  return "";
}

async function atualizarAssinaturaClienteSaasSupabase(id, assinatura = {}) {
  if (!podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
  const planId = await obterPlanIdSupabase(assinatura.activePlan || assinatura.planSlug || "free");
  const payload = {
    status: normalizarStatusPlano(assinatura.status),
    status_assinatura: normalizarStatusPlano(assinatura.statusAssinatura || assinatura.status),
    active_plan: normalizarSlugPlano(assinatura.activePlan || assinatura.planSlug || "free"),
    pending_plan: assinatura.pendingPlan || null,
    payment_status: normalizarStatusPagamento(assinatura.paymentStatus || "none"),
    subscription_status: normalizarStatusAssinaturaDefinitivo(assinatura.subscriptionStatus || "free"),
    plan_expires_at: assinatura.planExpiresAt || assinatura.currentPeriodEnd || null,
    plan_price: assinatura.planPrice || null,
    price_locked: assinatura.priceLocked === true,
    trial_started_at: assinatura.trialStartedAt || null,
    trial_expires_at: assinatura.trialExpiresAt || null,
    is_trial_active: assinatura.isTrialActive === true,
    promo_used: assinatura.promoUsed === true,
    billing_variant: normalizarBillingVariant(assinatura.billingVariant),
    current_period_start: assinatura.currentPeriodStart || null,
    current_period_end: assinatura.currentPeriodEnd || null,
    expires_at: assinatura.expiresAt || assinatura.currentPeriodEnd || null,
    next_billing_at: assinatura.nextBillingAt || assinatura.currentPeriodEnd || null,
    proximo_vencimento: assinatura.nextBillingAt || assinatura.currentPeriodEnd || null,
    updated_at: new Date().toISOString()
  };
  if (planId) payload.plan_id = planId;
  await requisicaoSupabase(`/rest/v1/subscriptions?client_id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
  return { ok: true };
}

async function alterarStatusClienteSaas(id, status) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const bloquear = status === "blocked";
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: bloquear ? "Bloquear cliente" : "Desbloquear cliente",
    mensagem: bloquear
      ? `Bloquear ${cliente.email}? O cliente perde acesso, mas os dados ficam preservados.`
      : `Desbloquear ${cliente.email}? O acesso será restaurado conforme o plano ativo.`,
    confirmar: bloquear ? "Bloquear" : "Desbloquear",
    perigo: bloquear
  });
  if (!confirmado) return;

  const toast = mostrarToast("Salvando...", "loading");
  try {
    const licenca = await chamarSuperadminUpdateSubscription(id, bloquear ? "BLOCK" : "UNBLOCK", {
      planCode: "FREE",
      reason: bloquear ? "Bloqueio manual pelo Superadmin" : "Desbloqueio manual pelo Superadmin"
    });
    usuarios.filter((usuario) => usuario.clientId === id).forEach((usuario) => {
      usuario.bloqueado = bloquear;
      usuario.ativo = !bloquear;
      usuario.atualizadoEm = licenca?.updated_at || new Date().toISOString();
    });
    salvarDados();
    registrarAuditoria(status === "active" ? "reativado" : "bloqueio", { email: cliente.email, status, source: licenca?.source || "rpc" }, cliente.id);
    mostrarToast(status === "active" ? "Cliente desbloqueado" : "Cliente bloqueado", "sucesso", 4200);
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Erro ao alterar status do cliente", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
    renderApp();
  }
}

async function alterarPlanoClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const planoAtual = getPlanoSaas(getAssinaturaSaas(id)?.activePlan || cliente.activePlan || getAssinaturaSaas(id)?.planSlug || cliente.planoAtual || "free");
  const respostaPlano = await solicitarPlanoSuperadmin(planoAtual.slug);
  if (respostaPlano === null) return;
  const novoPlano = normalizarSlugPlano(respostaPlano || "");
  const plano = getPlanoSaas(novoPlano);
  if (!["free", "premium_trial", "premium"].includes(novoPlano)) {
    alert("Plano inválido.");
    return;
  }
  if (novoPlano === "premium_trial") {
    alert("Teste grátis não pode ser reativado manualmente. Use Premium manual ou Free.");
    return;
  }
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Alterar plano",
    mensagem: `Alterar ${cliente.email} para ${plano.name}?`,
    confirmar: "Alterar plano"
  });
  if (!confirmado) return;
  const assinaturaAtual = getAssinaturaSaas(id);
  const trialValido = (assinaturaAtual?.activePlan === "premium_trial" || cliente.activePlan === "premium_trial")
    && getTimestampPlano(assinaturaAtual?.trialExpiresAt || cliente.trialExpiresAt || 0) > Date.now();
  if (novoPlano === "free" && trialValido) {
    const confirmarTrial = await solicitarConfirmacaoAcao({
      titulo: "Encerrar teste ativo",
      mensagem: "Este cliente ainda tem trial válido. Confirmar Free encerra o acesso Premium temporário.",
      confirmar: "Confirmar Free",
      perigo: true
    });
    if (!confirmarTrial) return;
  }
  const toast = mostrarToast("Salvando...", "loading");
  try {
    const licenca = await chamarSuperadminUpdateSubscription(id, novoPlano === "premium" ? "ACTIVATE_PREMIUM_MANUAL" : "SET_FREE", {
      planCode: novoPlano === "premium" ? "PREMIUM" : "FREE",
      premiumUntil: null,
      reason: `Alteração manual para ${plano.name}`
    });
    registrarAuditoria("alteração plano", { email: cliente.email, plano: plano.slug, source: licenca?.source || "rpc" }, cliente.id);
    mostrarToast("Plano atualizado com sucesso", "sucesso", 4200);
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Erro ao alterar plano", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
    renderApp();
  }
}

async function liberarDiasManualClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;

  const diasTexto = await solicitarEntradaTexto({
    titulo: "Liberar dias manualmente",
    mensagem: "Informe quantos dias serão adicionados ao Premium deste cliente.",
    valor: "30",
    tipo: "number",
    obrigatorio: true
  });
  const dias = Math.max(0, Math.floor(Number(String(diasTexto || "").replace(",", ".")) || 0));
  if (!dias) {
    alert("Informe uma quantidade de dias válida.");
    return;
  }

  const motivo = await solicitarEntradaTexto({
    titulo: "Motivo da liberação",
    mensagem: "Use algo como PIX manual, suporte, cortesia ou recuperação webhook.",
    valor: "PIX manual",
    obrigatorio: true
  });
  if (!String(motivo || "").trim()) return;

  const targetUserId = getAlvoRpcClienteSaas(id);
  let licencaRemota = null;
  try {
    licencaRemota = await consultarLicencaSupabaseSilencioso({ targetUserId, aplicar: false });
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Licença remota não consultada para liberação manual", erro.message || erro);
  }

  const assinatura = getAssinaturaSaas(id);
  const validadeAtual = getTimestampPlano(
    licencaRemota?.premium_until
    || licencaRemota?.plan_expires_at
    || licencaRemota?.current_period_end
    || licencaRemota?.expires_at
    || assinatura?.premiumUntil
    || assinatura?.planExpiresAt
    || assinatura?.currentPeriodEnd
    || cliente.planExpiresAt
    || 0
  );
  const base = Math.max(Date.now(), validadeAtual || 0);
  const premiumUntil = new Date(base + dias * 24 * 60 * 60 * 1000).toISOString();
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Confirmar liberação manual",
    mensagem: `Liberar ${dias} dia(s) de Premium para ${cliente.email}? Validade até ${new Date(premiumUntil).toLocaleDateString("pt-BR")}.`,
    confirmar: "Liberar Premium"
  });
  if (!confirmado) return;

  const toast = mostrarToast("Salvando...", "loading");
  try {
    const licenca = await chamarSuperadminUpdateSubscription(id, "ACTIVATE_PREMIUM_MANUAL", {
      planCode: "PREMIUM",
      premiumUntil,
      reason: `${String(motivo).trim()} (${dias} dia(s))`
    });
    registrarAuditoria("liberação manual premium", {
      email: cliente.email,
      dias,
      motivo,
      premiumUntil,
      source: licenca?.source || "rpc"
    }, cliente.id);
    mostrarToast("Plano atualizado com sucesso", "sucesso", 4200);
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Erro ao liberar dias manualmente", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
    renderApp();
  }
}

function exportarClienteSaas(id) {
  const cliente = getClienteSaasPorId(id);
  if (!cliente || !isSuperAdmin()) return;
  const dados = {
    cliente,
    usuarios: getUsuariosDoCliente(id),
    assinatura: getAssinaturaSaas(id),
    pagamentos: saasPayments.filter((pagamento) => pagamento.clientId === id),
    logs: auditLogs.filter((log) => log.clientId === id)
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cliente-${cliente.email || cliente.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
  registrarAuditoria("exportar dados", { email: cliente.email }, cliente.id);
}

function exportarClientesSaas() {
  if (!isSuperAdmin()) return;
  const blob = new Blob([JSON.stringify({ clientes: saasClients, assinaturas: saasSubscriptions, pagamentos: saasPayments }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clientes-simplifica-3d.json";
  link.click();
  URL.revokeObjectURL(url);
  registrarAuditoria("exportar dados", { escopo: "clientes_saas" });
}

async function alternarUsuarioTesteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const proximoValor = cliente.isTestUser !== true;
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: proximoValor ? "Marcar usuário de teste" : "Remover marcação de teste",
    mensagem: proximoValor
      ? `Marcar ${cliente.email} como usuário de teste? Isso libera a ação de exclusão completa com confirmação forte.`
      : `Remover a marcação de usuário de teste de ${cliente.email}? A exclusão completa ficará bloqueada.`,
    confirmar: proximoValor ? "Marcar teste" : "Remover teste",
    perigo: proximoValor
  });
  if (!confirmado) return;

  const toast = mostrarToast("Salvando...", "loading");
  try {
    const remoto = await atualizarFlagTesteClienteSaasSupabase(id, proximoValor);
    if (remoto.skipped) throw new Error("Sessão Supabase de superadmin indisponível.");
    cliente.isTestUser = proximoValor;
    cliente.deletionPolicy = proximoValor ? "test_delete_allowed" : "mark_only";
    cliente.updatedAt = new Date().toISOString();
    salvarDados();
    registrarAuditoria(proximoValor ? "marcado teste" : "desmarcado teste", { email: cliente.email, remoto: remoto.ok === true }, id);
    mostrarToast(proximoValor ? "Usuário marcado como teste." : "Usuário deixou de ser teste.", "sucesso", 4200);
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Flag de usuário teste não sincronizada", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 7000);
  } finally {
    toast?.remove?.();
    renderApp();
  }
}

function getReferenciasClienteSaas(id) {
  const cliente = getClienteSaasPorId(id);
  const usuariosCliente = getUsuariosDoCliente(id);
  const assinatura = getAssinaturaSaas(id);
  const userIds = new Set(usuariosCliente.map((usuario) => String(usuario.id || usuario.userId || usuario.user_id || "").trim()).filter(Boolean));
  if (assinatura?.userId) userIds.add(String(assinatura.userId));
  const emails = new Set([cliente?.email, ...usuariosCliente.map((usuario) => usuario.email)].map(normalizarEmail).filter(Boolean));
  return { cliente, usuariosCliente, userIds, emails };
}

function registroPertenceAoClienteSaas(item = {}, id, referencias = getReferenciasClienteSaas(id)) {
  const clientId = String(item.clientId || item.client_id || item.saasClientId || item.saas_client_id || item.customerId || item.customer_id || "").trim();
  const userId = String(item.userId || item.user_id || item.usuarioId || item.usuario_id || "").trim();
  const email = normalizarEmail(item.email || item.userEmail || item.user_email || item.usuarioEmail || item.usuario_email || item.clienteEmail || item.cliente_email || "");
  return clientId === String(id)
    || (userId && referencias.userIds.has(userId))
    || (email && referencias.emails.has(email));
}

function contarResumoExclusaoClienteTesteLocal(id) {
  const referencias = getReferenciasClienteSaas(id);
  const pedidosRelacionados = pedidos.filter((pedido) => registroPertenceAoClienteSaas(pedido, id, referencias));
  const orcamentosRelacionados = orcamentos.filter((orcamento) => registroPertenceAoClienteSaas(orcamento, id, referencias));
  const clientesVinculados = new Set([
    ...pedidosRelacionados.map((pedido) => pedido.cliente || pedido.clienteNome || pedido.customerName || ""),
    ...orcamentosRelacionados.map((orcamento) => orcamento.cliente || orcamento.clienteNome || orcamento.customerName || "")
  ].map((valor) => String(valor || "").trim()).filter(Boolean)).size;
  const feedbacks = sugestoes.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)).length;
  const logs = [
    ...diagnostics.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)),
    ...auditLogs.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)),
    ...securityLogs.filter((item) => registroPertenceAoClienteSaas(item, id, referencias))
  ].length;
  const registrosAuxiliares = [
    ...saasSubscriptions.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)),
    ...saasPayments.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)),
    ...saasSessions.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)),
    ...usuarios.filter((item) => registroPertenceAoClienteSaas(item, id, referencias))
  ].length;

  return {
    pedidos: pedidosRelacionados.length,
    clientesVinculados,
    relatoriosFeedbacks: feedbacks + logs,
    registrosRelacionados: pedidosRelacionados.length + orcamentosRelacionados.length + feedbacks + logs + registrosAuxiliares,
    usuarios: referencias.usuariosCliente.length,
    assinaturas: saasSubscriptions.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)).length,
    pagamentos: saasPayments.filter((item) => registroPertenceAoClienteSaas(item, id, referencias)).length
  };
}

function textoResumoExclusaoClienteTeste(cliente, resumo) {
  return [
    `Nome: ${cliente.name}`,
    `E-mail: ${cliente.email}`,
    `ID: ${cliente.id}`,
    `Pedidos: ${resumo.pedidos}`,
    `Clientes vinculados: ${resumo.clientesVinculados}`,
    `Relatórios/feedbacks/logs: ${resumo.relatoriosFeedbacks}`,
    `Registros relacionados: ${resumo.registrosRelacionados}`,
    "Digite EXCLUIR TESTE para confirmar."
  ].join("\n");
}

function removerDadosLocaisUsuarioTesteSaas(id) {
  const referencias = getReferenciasClienteSaas(id);
  const naoRelacionado = (item) => !registroPertenceAoClienteSaas(item, id, referencias);
  const resumo = contarResumoExclusaoClienteTesteLocal(id);
  pedidos = pedidos.filter(naoRelacionado);
  orcamentos = orcamentos.filter(naoRelacionado);
  sugestoes = sugestoes.filter(naoRelacionado);
  diagnostics = diagnostics.filter(naoRelacionado);
  auditLogs = auditLogs.filter(naoRelacionado);
  securityLogs = securityLogs.filter(naoRelacionado);
  passwordResetTokens = passwordResetTokens.filter(naoRelacionado);
  saasSubscriptions = saasSubscriptions.filter(naoRelacionado);
  saasPayments = saasPayments.filter(naoRelacionado);
  saasSessions = saasSessions.filter(naoRelacionado);
  usuarios = usuarios.filter(naoRelacionado);
  saasClients = saasClients.filter((cliente) => String(cliente.id) !== String(id));
  salvarDados();
  return resumo;
}

async function excluirUsuarioTesteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  if (cliente.isTestUser !== true) {
    alert("Exclusão completa bloqueada. Marque o cliente como usuário de teste antes de excluir.");
    return;
  }

  const resumo = contarResumoExclusaoClienteTesteLocal(id);
  const confirmacao = await solicitarEntradaTexto({
    titulo: "Excluir usuário de teste",
    mensagem: textoResumoExclusaoClienteTeste(cliente, resumo),
    valor: "",
    obrigatorio: true
  });
  if (confirmacao === null) return;
  if (String(confirmacao).trim() !== "EXCLUIR TESTE") {
    mostrarToast("Confirmação inválida. Nada foi excluído.", "erro", 5500);
    return;
  }

  const toast = mostrarToast("Salvando...", "loading");
  try {
    if (!podeSalvarAdminSupabaseRemoto()) {
      throw new Error("Sessão Supabase de superadmin indisponível.");
    }
    const remoto = await requisicaoSupabase("/rest/v1/rpc/delete_test_user_client", {
      method: "POST",
      body: JSON.stringify({ p_client_id: id, p_confirmation: "EXCLUIR TESTE" })
    });
    if (remoto?.ok !== true) throw new Error("RPC não confirmou a exclusão remota.");
    const authConfirmado = remoto?.auth_verified_absent === true || remoto?.auth_deleted === true;
    if (!authConfirmado) {
      throw new Error(remoto?.auth_delete_error || "Auth não confirmou a remoção do usuário. Exclusão local cancelada.");
    }
    const residuos = remoto?.remaining && typeof remoto.remaining === "object" ? remoto.remaining : {};
    const totalResiduos = Object.values(residuos).reduce((total, valor) => total + (Number(valor) || 0), 0);
    if (totalResiduos > 0) {
      throw new Error("Exclusão remota deixou resíduos. Exclusão local cancelada.");
    }
    const resumoLocal = removerDadosLocaisUsuarioTesteSaas(id);
    registrarAuditoria("exclusão usuário teste", {
      email: cliente.email,
      resumo: resumoLocal,
      remoto: remoto?.ok === true,
      authDeleted: remoto?.auth_deleted === true,
      authVerifiedAbsent: remoto?.auth_verified_absent === true
    }, id);
    mostrarToast("Usuário de teste excluído com segurança.", "sucesso", 4200);
    renderApp();
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Erro ao excluir usuário de teste", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
  }
}

async function anonimizarClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Anonimizar cliente",
    mensagem: `Anonimizar dados pessoais de ${cliente.email}? Esta ação preserva vínculos operacionais e financeiros, mas remove nome, telefone e e-mail pessoais.`,
    confirmar: "Anonimizar",
    perigo: true
  });
  if (!confirmado) return;
  const toast = mostrarToast("Salvando...", "loading");
  const emailOriginal = cliente.email;
  try {
    const licenca = await chamarSuperadminUpdateSubscription(id, "ANONYMIZE", {
      planCode: "FREE",
      reason: "Anonimização manual pelo Superadmin"
    });
    const emailAnonimo = `anon-${String(id).replace(/[^a-z0-9]/gi, "").slice(0, 18) || Date.now()}@anon.local`;
    cliente.name = "Cliente anonimizado";
    cliente.responsibleName = "";
    cliente.email = emailAnonimo;
    cliente.phone = "";
    cliente.status = "anonymized";
    cliente.anonymizedAt = licenca?.anonymized_at || new Date().toISOString();
    cliente.deletionPolicy = "anonymized";
    cliente.updatedAt = new Date().toISOString();
    usuarios.filter((usuario) => usuario.clientId === id).forEach((usuario) => {
      usuario.nome = "Usuario anonimizado";
      usuario.email = `anon-${usuario.id}@anon.local`;
      usuario.phone = "";
      usuario.ativo = false;
      usuario.bloqueado = true;
    });
    salvarDados();
    registrarAuditoria("anonimizado", { emailOriginal, source: licenca?.source || "rpc" }, id);
    mostrarToast("Usuário anonimizado", "sucesso", 4200);
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Erro ao anonimizar cliente", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
    renderApp();
  }
}

async function excluirClienteSaasManual(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  if (cliente.isTestUser === true) {
    await excluirUsuarioTesteSaas(id);
    return;
  }
  alert("Usuários reais não podem ser excluídos diretamente. Exporte os dados ou use Anonimizar para remover dados pessoais preservando vínculos.");
}

async function arquivarClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Arquivar usuário",
    mensagem: `Arquivar ${cliente.email}? Ele será ocultado da lista principal, sem apagar dados.`,
    confirmar: "Arquivar"
  });
  if (!confirmado) return;
  const toast = mostrarToast("Salvando...", "loading");
  try {
    const licenca = await chamarSuperadminUpdateSubscription(id, "ARCHIVE", {
      reason: "Arquivamento manual pelo Superadmin"
    });
    cliente.archivedAt = licenca?.archived_at || new Date().toISOString();
    cliente.updatedAt = licenca?.updated_at || new Date().toISOString();
    salvarDados();
    registrarAuditoria("arquivado", { email: cliente.email, source: licenca?.source || "rpc" }, id);
    mostrarToast("Usuário arquivado", "sucesso", 4200);
  } catch (erro) {
    registrarDiagnostico("Superadmin", "Erro ao arquivar cliente", erro.message);
    mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
    renderApp();
  }
}

async function marcarClientesInativosAcao() {
  if (!isSuperAdmin()) return;
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Marcar inativos",
    mensagem: "Marcar automaticamente clientes sem acesso há mais de 90 dias?",
    confirmar: "Marcar inativos"
  });
  if (!confirmado) return;
  const antes = saasClients.filter((cliente) => cliente.status === "inactive").length;
  marcarClientesInativosLocal();
  salvarDados();
  const depois = saasClients.filter((cliente) => cliente.status === "inactive").length;
  mostrarToast(`${Math.max(0, depois - antes)} cliente(s) marcado(s) como inativo >90 dias.`, "sucesso");
  renderApp();
}

function renderRelatorios() {
  if (!planoPermiteRecurso("reports")) {
    return `
      <section class="card">
        <div class="card-header">
          <h2>📈 Relatórios avançados</h2>
          <span class="status-badge">PRO</span>
        </div>
        <p class="muted">O Free mantém dashboard e dados básicos. Relatórios avançados ficam disponíveis no PRO ou temporariamente ao assistir um anúncio recompensado.</p>
        <div class="actions">
          <button class="btn secondary" type="button" onclick="desbloquearRelatoriosComAnuncio()">Assistir anúncio</button>
          <button class="btn ghost" type="button" onclick="trocarTela('assinatura')">Ver planos</button>
        </div>
      </section>
    `;
  }
  const podeOperar = temAcessoCompleto();
  const totais = calcularTotaisCaixa();
  const stats = getDashboardStats();
  return `
    <section class="card">
      <div class="card-header">
        <h2>📈 Relatórios</h2>
        <span class="status-badge">Local</span>
      </div>
      <div class="metrics">
        <div class="metric"><span>Faturamento hoje</span><strong>${formatarMoeda(stats.faturamentoDia)}</strong></div>
        <div class="metric"><span>Lucro estimado</span><strong>${formatarMoeda(stats.lucroEstimado)}</strong></div>
        <div class="metric"><span>Saldo em caixa</span><strong>${formatarMoeda(totais.saldo)}</strong></div>
        <div class="metric"><span>Pedidos totais</span><strong>${pedidos.length}</strong></div>
      </div>
      <p class="muted">${podeOperar ? "Relatórios avançados por período ficam preparados para a futura camada online/Supabase, mantendo o localStorage atual funcionando." : "Seu plano está inativo. Visualização liberada; recursos avançados voltam após regularização."}</p>
      ${podeOperar ? "" : `<div class="actions"><button class="btn" type="button" data-action="open-payment">Pagar agora</button></div>`}
    </section>
  `;
}

function renderCaixa() {
  const podeOperar = permitirVisualizacaoOperacionalBasica();
  const totais = calcularTotaisCaixa();
  const linhas = caixa.length
    ? [...caixa].reverse().map((movimento, posicaoInvertida) => {
        const indice = caixa.length - 1 - posicaoInvertida;
        const saida = movimento.tipo === "saida";
        return `
          <div class="cash-row">
            <div class="row-title">
              <strong>${saida ? "Saída" : "Entrada"}</strong>
              <span class="muted">${formatarMoeda(movimento.valor)}</span>
            </div>
            <div class="muted">${escaparHtml(descricaoCaixa(movimento))}</div>
            ${podeOperar ? `<div class="row-actions">
              <button class="btn danger" onclick="removerMovimentoCaixa(${indice})">Remover</button>
            </div>` : ""}
          </div>
        `;
      }).join("")
    : `<p class="empty">Nenhum movimento no caixa.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>💰 Caixa</h2>
        <strong>${formatarMoeda(totais.saldo)}</strong>
      </div>
      <div class="metrics">
        <div class="metric">
          <span>Entradas</span>
          <strong>${formatarMoeda(totais.entradas)}</strong>
        </div>
        <div class="metric">
          <span>Saídas</span>
          <strong>${formatarMoeda(totais.saidas)}</strong>
        </div>
      </div>
      ${podeOperar ? `
      <label class="field">
        <span>Tipo</span>
        <select id="caixaTipo">
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
      </label>
      <label class="field">
        <span>Valor</span>
        <input id="caixaValor" type="number" min="0" step="0.01" placeholder="0,00">
      </label>
      <label class="field">
        <span>Descrição</span>
        <input id="caixaDescricao" placeholder="Ex.: 2 reais caneta">
      </label>
      <button class="btn" onclick="adicionarMovimentoCaixa()">Lançar movimento</button>` : `<p class="muted">Seu acesso está bloqueado. Visualização liberada; lançamentos voltam após regularização.</p><div class="actions"><button class="btn" type="button" data-action="open-payment">Pagar agora</button></div>`}
      ${linhas}
    </section>
  `;
}

function renderBloqueioPlano(recurso) {
  const plano = getPlanoAtual();
  return `
    <section class="card">
      <div class="card-header">
        <h2>🔒 ${escaparHtml(recurso)}</h2>
        <span class="status-badge ${classeStatusPlano(plano.status)}">${escaparHtml(plano.nome)}</span>
      </div>
      <p class="muted">${plano.blockLevel === "total" ? "Seu plano está inativo. Regularize para continuar." : escaparHtml(plano.descricao)}</p>
      <div class="actions">
        <button class="btn secondary" onclick="abrirCalculadora()">🧮 Abrir calculadora</button>
        <button class="btn ghost" onclick="trocarTela('assinatura')">Ver planos</button>
        <button class="btn" type="button" data-action="open-payment">Pagar agora</button>
      </div>
    </section>
  `;
}

function renderConfig() {
  const usuario = getUsuarioAtual();
  const emailConta = normalizarEmail(usuario?.email || syncConfig.supabaseEmail || billingConfig.licenseEmail || "");
  const ultimaSync = syncConfig.supabaseLastSync || syncConfig.ultimaSync || "";
  const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
  const conectado = !!(syncConfig.supabaseAccessToken && syncConfig.supabaseUserId);
  const status = !online
    ? "Offline"
    : syncConfig.autoBackupStatus && /erro/i.test(syncConfig.autoBackupStatus)
      ? "Erro ao sincronizar"
      : conectado && ultimaSync
        ? "Sincronizado"
        : conectado
          ? "Conectado"
          : "Conta necessária";

  if (!temAcessoNuvem()) {
    return `
      <section class="card">
        <div class="card-header">
          <h2>☁️ Backup e sincronização</h2>
          <span class="status-badge">Conta necessária</span>
        </div>
        <p class="muted">Entre ou crie uma conta para sincronizar dados entre Android, Windows e navegador. O plano Free também sincroniza, respeitando o limite de armazenamento.</p>
        <div class="admin-grid">
          <div class="metric">
            <span>Free</span>
            <strong>Sync limitada</strong>
          </div>
          <div class="metric">
            <span>Premium</span>
            <strong>Sync ampliada</strong>
          </div>
        </div>
        <div class="actions">
          <button class="btn" onclick="trocarTela('admin')">Entrar ou criar conta</button>
          <button class="btn secondary" onclick="exportarBackup()">Exportar backup</button>
          <button class="btn ghost" onclick="voltarTela()">Voltar</button>
        </div>
        <label class="field">
          <span>Restaurar backup JSON local</span>
          <input class="file-input" type="file" accept="application/json" onchange="importarBackup(this.files[0])">
        </label>
      </section>
    `;
  }

  return `
    <section class="card">
      <div class="card-header">
        <h2>☁️ Dados e Backup</h2>
        <span class="status-badge">${escaparHtml(status)}</span>
      </div>
      <div class="sync-grid">
        <div class="metric">
          <span>Conta</span>
          <strong>${escaparHtml(emailConta || "Não conectada")}</strong>
        </div>
        <div class="metric">
          <span>Status</span>
          <strong>${escaparHtml(status)}</strong>
        </div>
        <div class="metric">
          <span>Última sincronização</span>
          <strong>${ultimaSync ? new Date(ultimaSync).toLocaleString("pt-BR") : "Nunca"}</strong>
        </div>
        <div class="metric">
          <span>Dispositivo</span>
          <strong>${escaparHtml(syncConfig.deviceName || deviceId.slice(0, 10))}</strong>
        </div>
      </div>

      <div class="actions">
        <button class="btn" onclick="sincronizarSupabase()">Sincronizar agora</button>
        <button class="btn secondary" onclick="exportarBackup()">Exportar backup</button>
        <label class="btn ghost file-label">
          <span>Importar backup</span>
          <input class="file-input" type="file" accept="application/json" onchange="importarBackup(this.files[0])">
        </label>
      </div>

      ${telaAtual === "config" ? `
        ${renderAssistenteInteligenteProConfig()}

        ${whatsapp2FABackendDisponivel() ? `<div class="danger-zone">
          <h2 class="section-title">Segurança</h2>
          <label class="checkbox-row">
            <input id="twoFactorEnabled" type="checkbox" ${appConfig.twoFactorEnabled && whatsapp2FABackendDisponivel() ? "checked" : ""} ${whatsapp2FABackendDisponivel() ? "" : "disabled"}>
            <span>${whatsapp2FABackendDisponivel() ? "Ativar verificação em duas etapas pelo WhatsApp" : "2FA WhatsApp desativado temporariamente"}</span>
          </label>
          <div class="sync-grid">
            <label class="field">
              <span>WhatsApp da verificação</span>
              <input id="twoFactorWhatsapp" value="${escaparAttr(appConfig.twoFactorWhatsapp || appConfig.whatsappNumber || "")}" placeholder="Ex.: +5585999999999" ${whatsapp2FABackendDisponivel() ? "" : "disabled"}>
            </label>
            <label class="field">
              <span>Proteger</span>
              <select id="twoFactorScope" ${whatsapp2FABackendDisponivel() ? "" : "disabled"}>
                <option value="admin" ${appConfig.twoFactorScope !== "todos" ? "selected" : ""}>Admins</option>
                <option value="todos" ${appConfig.twoFactorScope === "todos" ? "selected" : ""}>Todos os usuários</option>
              </select>
            </label>
            <label class="field">
              <span>Lembrar neste aparelho por minutos</span>
              <input id="twoFactorRememberMinutes" type="number" min="1" step="1" value="${Number(appConfig.twoFactorRememberMinutes) || 60}" ${whatsapp2FABackendDisponivel() ? "" : "disabled"}>
            </label>
          </div>
        </div>` : ""}

        <div class="danger-zone">
          <h2 class="section-title">Atualizações</h2>
          <label class="checkbox-row">
            <input id="autoUpdateEnabled" type="checkbox" ${appConfig.autoUpdateEnabled !== false ? "checked" : ""}>
            <span>Atualizar automaticamente quando houver versão nova</span>
          </label>
          <div class="sync-grid">
            <div class="metric">
              <span>Versão instalada</span>
              <strong>${escaparHtml(APP_VERSION)}</strong>
            </div>
            <div class="metric">
              <span>Status</span>
              <strong>${escaparHtml(appConfig.updateStatus || "Aguardando")}</strong>
            </div>
            <div class="metric">
              <span>Versão disponível</span>
              <strong>${escaparHtml(appConfig.updateAvailableVersion || "Nenhuma")}</strong>
            </div>
            <label class="field">
              <span>Checar a cada minutos</span>
              <input id="updateCheckInterval" type="number" min="5" step="1" value="${Number(appConfig.updateCheckInterval) || 30}">
            </label>
            <div class="metric">
              <span>Última checagem</span>
              <strong>${appConfig.updateLastCheck ? new Date(appConfig.updateLastCheck).toLocaleString("pt-BR") : "Nunca"}</strong>
            </div>
          </div>
          <div class="actions">
            <button class="btn" onclick="salvarConfigSync()">Salvar configurações</button>
            <button class="btn secondary" onclick="verificarAtualizacaoManual()">Checar atualização</button>
            <button class="btn ghost" onclick="aplicarAtualizacaoAgora()">Aplicar agora</button>
            <button class="btn ghost" onclick="baixarAtualizacaoAndroid(true)">Baixar APK</button>
          </div>
        </div>

        ${isSuperAdmin() || isAmbienteLocal() ? `
          <div class="danger-zone">
            <h2 class="section-title">Anúncios web</h2>
            <p class="muted">Configuração reservada para PWA/navegador. O APK continua usando AdMob e esta camada nunca carrega em Android nativo.</p>
            <label class="checkbox-row">
              <input id="adsenseWebEnabled" type="checkbox" ${appConfig.adsenseWebEnabled === true ? "checked" : ""}>
              <span>Ativar AdSense na versão web</span>
            </label>
            <div class="sync-grid">
              <label class="field">
                <span>Publisher ID</span>
                <input id="adsensePublisherId" value="${escaparAttr(appConfig.adsensePublisherId || ADSENSE_WEB_DEFAULT_PUBLISHER_ID)}" placeholder="ca-pub-0000000000000000">
              </label>
              <label class="field">
                <span>Slot do banner</span>
                <input id="adsenseBannerSlot" value="${escaparAttr(appConfig.adsenseBannerSlot || ADSENSE_WEB_DEFAULT_BANNER_SLOT)}" placeholder="0000000000">
              </label>
            </div>
            <p class="muted">Sem esses dados válidos o app não carrega script externo nem exibe espaço de anúncio.</p>
          </div>
        ` : ""}

        <div class="danger-zone">
          <h2 class="section-title">Introdução</h2>
          <p class="muted">Refaça o guia inicial quando quiser revisar o fluxo básico do sistema.</p>
          <div class="actions">
            <button class="btn secondary" onclick="reiniciarOnboarding()">Refazer introdução</button>
          </div>
        </div>

        <div class="danger-zone">
          <h2 class="section-title">Legal e versão</h2>
          <div class="actions">
            <button class="btn ghost" onclick="trocarTela('privacy')">Política de Privacidade</button>
            <button class="btn ghost" onclick="trocarTela('terms')">Termos de Uso</button>
            <button class="btn ghost" onclick="trocarTela('sobre')">Sobre e licenças</button>
          </div>
        </div>
      ` : ""}

      <div class="actions single">
        <button class="btn ghost" onclick="voltarTela()">← Voltar para a tela anterior</button>
        <button class="btn ghost" onclick="voltarInicio()">Ir para o início</button>
      </div>
    </section>
  `;
}

function getAuthTabAtual() {
  return window.__authTab === "signup" ? "signup" : "signin";
}

function trocarAbaAuth(tab) {
  window.__authTab = tab === "signup" ? "signup" : "signin";
  renderApp();
  setTimeout(() => {
    const alvo = window.__authTab === "signup" ? "signupNome" : "usuarioLoginEmail";
    document.getElementById(alvo)?.focus();
  }, 0);
}

function renderAuthPublica() {
  const tab = getAuthTabAtual();
  return `
    <section class="auth-page" aria-label="Acesso ao Simplifica 3D">
      <div class="auth-card">
        <div class="auth-brand">
          ${renderMarcaOficialProjeto("auth-logo", "Simplifica 3D", "icon")}
          <div>
            <h1>Simplifica 3D</h1>
            <p>${escaparHtml(appConfig.customLoginMessage || "Organize seus pedidos sem complicação")}</p>
          </div>
        </div>

        <div class="auth-tabs" role="tablist" aria-label="Escolha o fluxo de autenticação">
          <button type="button" class="${tab === "signin" ? "active" : ""}" role="tab" aria-selected="${tab === "signin"}" onclick="trocarAbaAuth('signin')">Entrar</button>
          <button type="button" class="${tab === "signup" ? "active" : ""}" role="tab" aria-selected="${tab === "signup"}" onclick="trocarAbaAuth('signup')">Criar conta</button>
        </div>

        ${renderVerificacao2FA()}
        <div class="auth-tab-panel">
          ${tab === "signup" ? renderAuthCriarConta() : renderAuthEntrar()}
        </div>
      </div>
    </section>
  `;
}

function renderAuthEntrar() {
  return `
    <form class="auth-form" onsubmit="event.preventDefault(); loginUsuario();">
      <label class="field auth-field">
        <span>Email</span>
        <input id="usuarioLoginEmail" type="email" value="${escaparAttr(usuarioAtualEmail || syncConfig.supabaseEmail || "")}" placeholder="seu@email.com" autocomplete="username">
      </label>

      <label class="field auth-field">
        <span>Senha</span>
        <div class="password-row auth-password-row">
          <input id="usuarioLoginSenha" type="password" placeholder="Sua senha" autocomplete="current-password">
          <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
        </div>
      </label>

      <label class="auth-checkline">
        <input id="lembrarSenhaNavegador" type="checkbox" ${appConfig.browserPasswordSaveOffer !== false ? "checked" : ""}>
        <span>Manter-me conectado</span>
      </label>

      <button id="loginUsuarioBtn" class="btn auth-primary" type="submit">Entrar</button>

      <div class="auth-link-row">
        <button class="inline-link auth-link" type="button" onclick="solicitarRecuperacaoSenha()">Esqueci minha senha</button>
        <button class="inline-link auth-link" type="button" onclick="trocarTela('assinatura')">Ver planos e benefícios</button>
      </div>

      <p class="auth-footer-text">
        Não tem conta?
        <button class="inline-link auth-link" type="button" onclick="trocarAbaAuth('signup')">Criar conta</button>
      </p>
    </form>
  `;
}

function renderAuthCriarConta() {
  return `
    <form class="auth-form auth-signup-form" onsubmit="event.preventDefault(); cadastrarClienteSaas();">
      <label class="field auth-field">
        <span>Nome completo</span>
        <input id="signupNome" placeholder="Seu nome" autocomplete="name">
      </label>
      <label class="field auth-field">
        <span>Email</span>
        <input id="signupEmail" type="email" placeholder="seu@email.com" autocomplete="email">
      </label>
      <label class="field auth-field">
        <span>Senha</span>
        <div class="password-row auth-password-row">
          <input id="signupSenha" type="password" autocomplete="new-password" oninput="renderIndicadorForcaSenha('signupSenha', this)">
          <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
        </div>
        <small class="password-strength" data-strength-for="signupSenha">Digite uma senha forte</small>
      </label>
      <label class="field auth-field">
        <span>Confirmar senha</span>
        <div class="password-row auth-password-row">
          <input id="signupConfirmarSenha" type="password" autocomplete="new-password">
          <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
        </div>
      </label>
      <label class="field auth-field">
        <span>Nome do negócio</span>
        <input id="signupNegocio" placeholder="Ex.: Minha Impressão 3D">
      </label>
      <label class="field auth-field">
        <span>Telefone opcional</span>
        <input id="signupTelefone" inputmode="tel" placeholder="+5585999999999" autocomplete="tel">
      </label>

      <label class="auth-checkline auth-terms-row">
        <input id="signupAceite" type="checkbox" aria-label="Aceitar Termos de Uso e Política de Privacidade">
        <span>
          Li e aceito os
          <button class="inline-link auth-link" type="button" onclick="abrirDocumentoLegal('termos', event)">Termos de Uso</button>
          e
          <button class="inline-link auth-link" type="button" onclick="abrirDocumentoLegal('privacidade', event)">Política de Privacidade</button>
        </span>
      </label>

      <button id="signupBtn" class="btn auth-primary" type="submit">Criar conta</button>

      <p class="auth-footer-text">
        Já tem conta?
        <button class="inline-link auth-link" type="button" onclick="trocarAbaAuth('signin')">Entrar</button>
      </p>
    </form>
  `;
}

function renderAdmin() {
  const usuarioAtual = getUsuarioAtual();
  const podeAdmin = podeGerenciarUsuarios();

  if (!podeAdmin) {
    if (usuarioAtual && !existeAdminCliente()) {
      return `
        <section class="card">
          <div class="card-header">
            <h2>🔐 Admin</h2>
            <button class="icon-button" onclick="logoutUsuario()" title="Sair">↩</button>
          </div>
          <p class="muted">Você pode usar o app normalmente. Para ações administrativas, configure um admin.</p>
          ${renderAdminSobDemanda("Configure um administrador para continuar")}
        </section>
      `;
    }
    if (usuarioAtual) {
      return `
        <section class="card">
          <div class="card-header">
            <h2>🔐 Admin</h2>
            <button class="icon-button" onclick="logoutUsuario()" title="Sair">↩</button>
          </div>
          <p class="muted">Você está logado como ${escaparHtml(usuarioAtual.nome)} (${escaparHtml(usuarioAtual.papel)}), mas este usuário não gerencia o sistema.</p>
          <div class="actions single">
            <button class="btn ghost" onclick="logoutUsuario()">Sair</button>
          </div>
        </section>
      `;
    }
    return renderAuthPublica();
  }

  const totais = calcularTotaisCaixa();
  const ultimosEventos = historico.slice(0, 12).map((item) => `
    <div class="history-item">
      <strong>${escaparHtml(item.acao)}</strong>
      <span class="muted">${new Date(item.data).toLocaleString("pt-BR")} • ${escaparHtml(item.detalhes || "")}</span>
    </div>
  `).join("") || `<p class="empty">Nenhum histórico registrado ainda.</p>`;
  const perfilAtual = usuarioAtual ? `${usuarioAtual.nome} (${usuarioAtual.papel})` : "Admin local";
  const podeComercial = podeGerenciarComercial();

  return `
      <section class="card">
        <div class="card-header">
          <h2>🔐 Admin</h2>
          <button class="icon-button" onclick="logoutAdmin()" title="Sair">↩</button>
        </div>
          <p class="muted">Logado como ${escaparHtml(perfilAtual)}. Admin gerencia usuários, configurações e ações administrativas do cliente.</p>

      <div class="admin-grid">
        <div class="metric">
          <span>Pedidos</span>
          <strong>${pedidos.length}</strong>
        </div>
        <div class="metric">
          <span>Materiais</span>
          <strong>${estoque.length}</strong>
        </div>
        <div class="metric">
          <span>Entradas</span>
          <strong>${formatarMoeda(totais.entradas)}</strong>
        </div>
        <div class="metric">
          <span>Saídas</span>
          <strong>${formatarMoeda(totais.saidas)}</strong>
        </div>
      </div>

      <div class="actions">
        <button class="btn secondary" onclick="exportarBackup()">Exportar tudo</button>
        <button class="btn ghost" onclick="trocarTela('config')">Nuvem</button>
        <button class="btn ghost" onclick="trocarTela('assinatura')">Planos</button>
        <button class="btn ghost" onclick="sincronizarNuvem()">Sincronizar</button>
        <button class="btn warning" onclick="limparPedidoAtual()">Limpar pedido atual</button>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Usuários</h2>
        <p class="muted">Cadastre admins apenas quando precisar de ações administrativas. Usuários comuns continuam usando o app sem virar admin automaticamente.</p>

        <h2 class="section-title">Adicionar usuário</h2>
        <div class="sync-grid">
          <label class="field">
            <span>Nome</span>
            <input id="novoUsuarioNome" placeholder="Nome do usuário">
          </label>
          <label class="field">
            <span>E-mail</span>
            <input id="novoUsuarioEmail" type="email" placeholder="usuario@email.com">
          </label>
          <label class="field">
            <span>Telefone opcional</span>
            <input id="novoUsuarioTelefone" inputmode="tel" placeholder="5585999999999">
          </label>
          <label class="field">
            <span>Senha inicial</span>
            <div class="password-row">
              <input id="novoUsuarioSenha" type="password" placeholder="Senha temporária" oninput="renderIndicadorForcaSenha('novoUsuarioSenha')">
              <button class="icon-button" type="button" onclick="alternarSenhaVisivel('novoUsuarioSenha')" title="Mostrar/ocultar senha">👁</button>
            </div>
            <small class="password-strength" data-strength-for="novoUsuarioSenha">Digite uma senha forte</small>
          </label>
          <label class="field">
            <span>Função</span>
            <select id="novoUsuarioPapel">
              ${isSuperAdmin(usuarioAtual) ? `<option value="superadmin">Super Admin</option>` : ""}
              <option value="admin">Admin</option>
              <option value="user" selected>Usuário</option>
              <option value="operador">Operador</option>
              <option value="visualizador">Visualizador</option>
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select id="novoUsuarioStatus">
              <option value="ativo" selected>Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
        </div>
        <button class="btn secondary" onclick="adicionarUsuario()">Adicionar usuário</button>
        ${renderUsuariosAdmin()}
      </div>

      ${podeComercial ? `<div class="danger-zone">
        <h2 class="section-title">Comercial</h2>
        <div class="sync-grid">
          <label class="field">
            <span>Dias grátis</span>
            <input id="trialDaysAdmin" type="number" min="1" step="1" value="${Number(billingConfig.trialDays) || 7}">
          </label>
          <label class="field">
            <span>Preço mensal</span>
            <input id="monthlyPriceAdmin" type="number" min="0" step="0.01" value="${Number(billingConfig.monthlyPrice) || 19.9}">
          </label>
          <label class="field">
            <span>Celulares por licença</span>
            <input id="mobileLimitAdmin" type="number" min="1" step="1" value="${getLimitesDispositivos().mobile}">
          </label>
          <label class="field">
            <span>Windows/navegador por licença</span>
            <input id="desktopLimitAdmin" type="number" min="1" step="1" value="${getLimitesDispositivos().desktop}">
          </label>
        </div>
        <label class="field">
          <span>Link do plano Mercado Pago</span>
          <input id="mercadoPagoLinkAdmin" value="${escaparAttr(billingConfig.mercadoPagoLink)}" placeholder="https://www.mercadopago.com.br/subscriptions/...">
        </label>
        <label class="field">
          <span>Link Android APK</span>
          <input id="androidDownloadUrlAdmin" value="${escaparAttr(billingConfig.androidDownloadUrl)}" placeholder="https://.../erp3d.apk">
        </label>
        <label class="field">
          <span>Link Windows/navegador</span>
          <input id="windowsWebUrlAdmin" value="${escaparAttr(billingConfig.windowsWebUrl || billingConfig.windowsDownloadUrl || "")}" placeholder="https://seu-app.vercel.app">
        </label>
        <div class="actions">
          <button class="btn" onclick="salvarConfigComercial()">Salvar comercial</button>
          <button class="btn secondary" onclick="ativarLicencaLocal()">Ativar completo local</button>
          <button class="btn ghost" onclick="voltarParaGratis()">Voltar para grátis</button>
        </div>
      </div>` : ""}

      <h2 class="section-title">Histórico</h2>
      <div class="history-list">
        ${ultimosEventos}
      </div>
    </section>
  `;
}

function renderUsuariosAdmin() {
  usuarios = normalizarUsuarios(usuarios);
  const lista = isSuperAdmin()
    ? usuarios
    : getUsuariosDoCliente().filter((usuario) => usuario.papel !== "superadmin");
  if (!lista.length) {
    return `<p class="empty">Nenhum usuário cadastrado ainda.</p>`;
  }

  return `
    <div class="history-list users-list">
      ${lista.map((usuario) => `
        <div class="user-row">
          <div>
            <strong>${escaparHtml(usuario.nome)}</strong>
            <span class="muted">${escaparHtml(usuario.email)}${usuario.phone ? " • " + escaparHtml(usuario.phone) : ""}</span>
          </div>
          <span class="status-badge ${usuarioEstaBloqueado(usuario) ? "badge-danger" : "badge-ativo"}">${escaparHtml(usuario.papel)} • ${usuario.ativo === false ? "inativo" : "ativo"}</span>
          <div class="row-actions">
            <button class="btn ghost" onclick="redefinirSenhaUsuario('${escaparAttr(usuario.id)}')">Redefinir senha</button>
            <button class="btn warning" onclick="alternarStatusUsuario('${escaparAttr(usuario.id)}')">${usuario.ativo === false ? "Reativar" : "Desativar"}</button>
            <button class="icon-button danger" onclick="removerUsuario('${escaparAttr(usuario.id)}')" title="Remover">×</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderGoogleAuthButton(rotulo = "Login com Google") {
  if (!syncConfig.supabaseGoogleOAuthEnabled) {
    return `<button class="btn secondary" type="button" disabled title="Ative o provedor Google no Supabase e marque a opção em Backup e sincronização">${escaparHtml(rotulo)} indisponível</button>`;
  }
  return `<button class="btn secondary" type="button" data-action="login-google">${escaparHtml(rotulo)}</button>`;
}

function alternarSenhaVisivel(idOuBotao) {
  const input = typeof idOuBotao === "string"
    ? document.getElementById(idOuBotao)
    : idOuBotao?.closest?.(".password-row")?.querySelector("input");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  input.focus();
}

async function oferecerSalvarCredencialNavegador(email, senha) {
  appConfig.browserPasswordSaveOffer = document.getElementById("lembrarSenhaNavegador") ? !!document.getElementById("lembrarSenhaNavegador")?.checked : appConfig.browserPasswordSaveOffer !== false;
  salvarDados();
  if (appConfig.browserPasswordSaveOffer === false || !email || !senha) return;
  try {
    if ("PasswordCredential" in window && navigator.credentials?.store) {
      const credencial = new PasswordCredential({
        id: email,
        name: email,
        password: senha
      });
      await navigator.credentials.store(credencial);
    }
  } catch (erro) {
    registrarDiagnostico("login", "Navegador não ofereceu salvar senha", erro.message || erro);
  }
}

async function confirmarBiometriaSeDisponivel(mensagem = "Use digital, rosto ou padrão para continuar.") {
  const plugin = window.Capacitor?.Plugins?.SimplificaBiometric;
  if (!isAndroid() || !plugin?.authenticate) return { disponivel: false, ok: true };

  try {
    const resultado = await plugin.authenticate({
      title: "Simplifica 3D",
      subtitle: mensagem
    });

    if (resultado?.available === false) {
      return { disponivel: false, ok: true, codigo: resultado.code || "" };
    }

    return { disponivel: true, ok: resultado?.ok === true, codigo: resultado?.code || "" };
  } catch (erro) {
    registrarDiagnostico("login", "Biometria nativa falhou", erro.message || erro);
    return { disponivel: true, ok: false, codigo: "erro" };
  }
}

async function alternarBiometriaSeguranca(ativar = null) {
  const desejaAtivar = ativar === null ? !!document.getElementById("biometricEnabledConfig")?.checked : !!ativar;
  if (desejaAtivar) {
    const biometria = await confirmarBiometriaSeDisponivel("Confirme para ativar a entrada por digital, rosto ou padrão.");
    if (biometria.disponivel && !biometria.ok) {
      alert("Não foi possível confirmar a biometria agora.");
      appConfig.biometricEnabled = false;
      salvarDados();
      renderApp();
      return;
    }
    if (!biometria.disponivel && isAndroid()) {
      alert("Este aparelho não informou biometria, rosto ou padrão disponível para o app.");
    }
  }

  appConfig.biometricEnabled = desejaAtivar;
  appConfig.biometricOfferDismissed = true;
  salvarDados();
  mostrarToast(desejaAtivar ? "Biometria ativada para este aparelho." : "Biometria desativada neste aparelho.", "sucesso");
  renderApp();
}

function oferecerAtivarBiometriaAposLogin() {
  if (!isAndroid() || appConfig.biometricEnabled || appConfig.biometricOfferDismissed) return;
  setTimeout(() => {
    if (!getUsuarioAtual()) return;
    const aceitar = confirm("Deseja ativar digital, rosto ou padrão para proteger a abertura do Simplifica 3D neste aparelho?");
    appConfig.biometricOfferDismissed = true;
    salvarDados();
    if (aceitar) {
      trocarTela("seguranca");
      setTimeout(() => alternarBiometriaSeguranca(true), 300);
    }
  }, 800);
}

async function entrarComCredencialSalva() {
  if (!navigator.credentials?.get) {
    alert("Este dispositivo não liberou login por senha salva, digital ou padrão para este app.");
    return;
  }

  try {
    if (appConfig.biometricEnabled) {
      const biometria = await confirmarBiometriaSeDisponivel("Use digital, rosto ou padrão para liberar a senha salva.");
      if (biometria.disponivel && !biometria.ok) {
        alert("Confirmação cancelada ou não autorizada.");
        return;
      }
    }

    const credencial = await navigator.credentials.get({
      password: true,
      mediation: "optional"
    });

    if (!credencial?.id || !credencial?.password) {
      alert("Nenhuma senha salva encontrada. Entre uma vez com e-mail e senha e marque a opção de salvar.");
      return;
    }

    const emailInput = document.getElementById("usuarioLoginEmail");
    const senhaInput = document.getElementById("usuarioLoginSenha");
    if (emailInput) emailInput.value = credencial.id;
    if (senhaInput) senhaInput.value = credencial.password;
    await loginUsuario();
  } catch (erro) {
    registrarDiagnostico("login", "Login por credencial salva falhou", erro.message || erro);
    alert("Não foi possível usar a senha salva neste dispositivo.");
  }
}

function renderTrocaSenhaObrigatoria() {
  return `
    <section class="card">
      <div class="card-header">
        <h2>🔐 Troca de senha obrigatória</h2>
        <span class="status-badge badge-alerta">Primeiro acesso</span>
      </div>
      <p class="muted">Por segurança, troque a senha temporária antes de continuar usando o sistema.</p>
      ${renderFormularioAlterarSenha(true)}
    </section>
  `;
}

function renderFormularioAlterarSenha(obrigatoria = false) {
  return `
    <div class="password-change-form">
      <div class="sync-grid">
        <label class="field">
          <span>Senha atual</span>
          <div class="password-row">
            <input id="senhaAtualUsuario" data-password-field="atual" type="password" autocomplete="current-password">
            <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
          </div>
        </label>
        <label class="field">
          <span>Nova senha</span>
          <div class="password-row">
            <input id="novaSenhaUsuario" data-password-field="nova" type="password" autocomplete="new-password" oninput="renderIndicadorForcaSenha('novaSenhaUsuario', this)">
            <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
          </div>
          <small class="password-strength" data-strength-for="novaSenhaUsuario">Digite uma senha forte</small>
        </label>
        <label class="field">
          <span>Confirmar nova senha</span>
          <div class="password-row">
            <input id="confirmarNovaSenhaUsuario" data-password-field="confirmar" type="password" autocomplete="new-password">
            <button class="icon-button" type="button" onclick="alternarSenhaVisivel(this)" title="Mostrar/ocultar senha">👁</button>
          </div>
        </label>
      </div>
      <div class="actions">
        <button id="alterarSenhaBtn" class="btn" onclick="alterarSenhaAtual(${obrigatoria ? "true" : "false"}, this)">Salvar nova senha</button>
        ${obrigatoria ? "" : `<button class="btn ghost" onclick="voltarTela()">Cancelar</button>`}
      </div>
    </div>
  `;
}

function renderSeguranca() {
  const usuario = getUsuarioAtual();
  if (!usuario) return renderAcessoNegado();
  const logs = securityLogs.slice(0, 18).map((log) => `
    <div class="history-item">
      <strong>${escaparHtml(log.acao)} • ${escaparHtml(log.resultado)}</strong>
      <span class="muted">${new Date(log.data).toLocaleString("pt-BR")} • ${escaparHtml(log.usuario)} • ${escaparHtml(log.detalhes || log.dispositivo || "")}</span>
    </div>
  `).join("") || `<p class="empty">Nenhum log de segurança registrado.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>🔒 Segurança</h2>
        <span class="status-badge ${usuarioEstaBloqueado(usuario) ? "badge-danger" : "badge-ativo"}">${usuario.ativo === false ? "Inativo" : "Ativo"}</span>
      </div>
      <div class="admin-grid">
        <div class="metric">
          <span>Conta</span>
          <strong>${escaparHtml(usuario.email)}</strong>
        </div>
        <div class="metric">
          <span>Perfil</span>
          <strong>${escaparHtml(usuario.papel)}</strong>
        </div>
        <div class="metric">
          <span>Último acesso</span>
          <strong>${usuario.lastLoginAt ? new Date(usuario.lastLoginAt).toLocaleString("pt-BR") : "Não registrado"}</strong>
        </div>
        <div class="metric">
          <span>Sessão</span>
          <strong>${sessionStorage.getItem("usuarioAtualEmail") ? "Ativa" : "Local"}</strong>
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Alterar senha</h2>
        ${renderFormularioAlterarSenha(false)}
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Sessão</h2>
        <p class="muted">Ao sair, tokens temporários e dados sensíveis da sessão são limpos deste aparelho. Se a opção de manter sessão estiver ativa, o app preserva o login sem salvar a senha.</p>
        <label class="checkbox-row">
          <input id="keepSessionCacheConfig" type="checkbox" ${appConfig.keepSessionCache !== false ? "checked" : ""} onchange="salvarPreferenciasSeguranca()">
          <span>Manter login neste aparelho</span>
        </label>
        <div class="actions">
          <button class="btn warning" onclick="logoutUsuario()">Sair com segurança</button>
          <button class="btn ghost" onclick="sairSupabase()">Encerrar Supabase</button>
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Biometria e permissões</h2>
        <label class="checkbox-row">
          <input id="biometricEnabledConfig" type="checkbox" ${appConfig.biometricEnabled ? "checked" : ""} onchange="alternarBiometriaSeguranca()">
          <span>Usar digital, rosto ou padrão para abrir dados neste aparelho</span>
        </label>
        <div class="actions">
          <button class="btn ghost" onclick="verificarPermissoesDispositivo()">Verificar permissões do aparelho</button>
          <button class="btn ghost" onclick="entrarComCredencialSalva()">Testar senha salva/digital</button>
        </div>
        <p class="muted">O Android não permite que o app leia o MAC real do aparelho. Para controle de uso, o Simplifica 3D usa um ID de dispositivo local, tipo de acesso e sessão vinculada ao e-mail do plano.</p>
      </div>

      <h2 class="section-title">Logs de segurança</h2>
      <div class="history-list">${logs}</div>
    </section>
  `;
}

function salvarPreferenciasSeguranca() {
  appConfig.keepSessionCache = !!document.getElementById("keepSessionCacheConfig")?.checked;
  if (!appConfig.keepSessionCache) {
    localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
  } else {
    salvarCacheSessaoLocal();
  }
  salvarDados();
  mostrarToast("Preferências de segurança salvas.", "sucesso");
}

async function verificarPermissoesDispositivo() {
  const resultados = [];
  try {
    const files = window.Capacitor?.Plugins?.SimplificaFiles;
    if (files?.requestStoragePermission) {
      const permissao = await files.requestStoragePermission();
      resultados.push(permissao?.granted === false ? "Arquivos: permissão pendente" : "Arquivos: pronto");
    } else {
      resultados.push(isAndroid() ? "Arquivos: Android moderno usa Downloads/Simplifica3D sem permissão manual" : "Arquivos: navegador");
    }
  } catch (erro) {
    resultados.push("Arquivos: " + (erro.message || "não verificado"));
  }

  try {
    const biometric = window.Capacitor?.Plugins?.SimplificaBiometric;
    if (biometric?.isAvailable) {
      const status = await biometric.isAvailable();
      resultados.push(status?.available ? "Biometria: disponível" : "Biometria: configure digital, rosto ou padrão no aparelho");
    } else {
      resultados.push("Biometria: indisponível neste ambiente");
    }
  } catch (erro) {
    resultados.push("Biometria: " + (erro.message || "não verificada"));
  }

  alert(resultados.join("\n"));
}

function statusUsuarioPlano(usuario) {
  if (usuarioEstaBloqueado(usuario)) return "bloqueado";
  if (usuario.papel === "superadmin") return "superadmin";
  if (isTrialActive(usuario)) return "trial";
  if ((usuario.planStatus === "paid" || usuario.planStatus === "active") && (!usuario.planExpiresAt || getRemainingDays(usuario.planExpiresAt) > 0)) return "pago";
  if (usuario.planExpiresAt || usuario.trialStartedAt) return "vencido";
  return "gratis";
}

function getSuperAdminMetricas() {
  garantirEstruturaSaasLocal();
  const porPlano = { free: 0, premium: 0, trial: 0 };
  saasClients.forEach((cliente) => {
    const plano = getPlanoSaas(getAssinaturaSaas(cliente.id)?.planSlug || cliente.planoAtual || "free");
    if (plano.kind === "trial") porPlano.trial += 1;
    else if (plano.slug === "premium") porPlano.premium += 1;
    else porPlano.free += 1;
  });
  return {
    total: saasClients.length,
    ativos: saasClients.filter((cliente) => cliente.status === "active").length,
    vencidos: saasSubscriptions.filter((assinatura) => ["past_due", "cancelled", "expired"].includes(normalizarStatusPlano(assinatura.status))).length,
    pendentes: saasPayments.filter((pagamento) => pagamento.status === "pending").length,
    receita: saasPayments.filter((pagamento) => pagamento.status === "approved").reduce((total, pagamento) => total + Number(pagamento.amount || 0), 0),
    porPlano
  };
}

function renderGraficoLinha(titulo, dados = []) {
  const valores = dados.map((item) => Number(item.valor) || 0);
  const max = Math.max(1, ...valores);
  const pontos = valores.map((valor, indice) => {
    const x = valores.length <= 1 ? 12 : 12 + indice * (216 / (valores.length - 1));
    const y = 88 - (valor / max) * 72;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `
    <div class="chart-card">
      <div class="row-title"><strong>${escaparHtml(titulo)}</strong><span class="muted">${dados.length} período(s)</span></div>
      <svg class="chart-svg" viewBox="0 0 240 100" role="img" aria-label="${escaparAttr(titulo)}">
        <polyline points="${pontos}" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
        ${valores.map((valor, indice) => {
          const [x, y] = pontos.split(" ")[indice].split(",");
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--accent)"><title>${valor}</title></circle>`;
        }).join("")}
      </svg>
    </div>
  `;
}

function renderGraficoBarras(titulo, dados = []) {
  const max = Math.max(1, ...dados.map((item) => Number(item.valor) || 0));
  return `
    <div class="chart-card">
      <div class="row-title"><strong>${escaparHtml(titulo)}</strong><span class="muted">${dados.length} item(ns)</span></div>
      <div class="bar-chart">
        ${dados.map((item) => `
          <div class="bar-item">
            <span>${escaparHtml(item.label)}</span>
            <div class="bar-track"><i style="width:${Math.max(4, (Number(item.valor) || 0) / max * 100)}%"></i></div>
            <strong>${item.moeda ? formatarMoeda(item.valor) : escaparHtml(item.valor)}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderGraficoPizza(titulo, dados = []) {
  const total = dados.reduce((soma, item) => soma + (Number(item.valor) || 0), 0) || 1;
  let acumulado = 0;
  const cores = ["#0b5366", "#ff8a1f", "#62d2a2", "#a3bffa", "#f7c948"];
  const partes = dados.map((item, indice) => {
    const inicio = acumulado;
    const fim = inicio + ((Number(item.valor) || 0) / total) * 100;
    acumulado = fim;
    return `${cores[indice % cores.length]} ${inicio}% ${fim}%`;
  }).join(", ");
  return `
    <div class="chart-card">
      <div class="row-title"><strong>${escaparHtml(titulo)}</strong><span class="muted">${total} cliente(s)</span></div>
      <div class="pie-chart" style="background:conic-gradient(${partes || "#203040 0 100%"});"></div>
      <div class="legend-list">
        ${dados.map((item, indice) => `<span><i style="background:${cores[indice % cores.length]}"></i>${escaparHtml(item.label)}: ${escaparHtml(item.valor)}</span>`).join("")}
      </div>
    </div>
  `;
}

function getSeriesMensais(campo = "clientes") {
  const meses = [];
  for (let i = 5; i >= 0; i -= 1) {
    const data = new Date();
    data.setMonth(data.getMonth() - i, 1);
    meses.push(data.toISOString().slice(0, 7));
  }
  return meses.map((mes) => {
    if (campo === "receita") {
      return {
        label: mes.slice(5),
        valor: saasPayments.filter((pagamento) => pagamento.status === "approved" && String(pagamento.createdAt || "").slice(0, 7) === mes).reduce((total, pagamento) => total + Number(pagamento.amount || 0), 0),
        moeda: true
      };
    }
    return {
      label: mes.slice(5),
      valor: saasClients.filter((cliente) => String(cliente.createdAt || cliente.criadoEm || "").slice(0, 7) <= mes).length
    };
  });
}

function renderSuperAdminDashboard() {
  const metricas = getSuperAdminMetricas();
  const cards = [
    ["Total clientes", metricas.total, "clientes", ""],
    ["Free", metricas.porPlano.free, "clientes", "free"],
    ["Premium", metricas.porPlano.premium, "clientes", "premium"],
    ["Trial", metricas.porPlano.trial, "clientes", "premium_trial"],
    ["Vencidos", metricas.vencidos, "clientesStatus", "past_due"],
    ["Pagamentos pendentes", metricas.pendentes, "pagamentos", "pending"],
    ["Receita", formatarMoeda(metricas.receita), "pagamentos", "approved"]
  ];
  return `
    <div class="metrics superadmin-metrics">
      ${cards.map(([titulo, valor, tab, filtro]) => `
        <button class="metric metric-button" onclick="abrirSuperAdminFiltro('${tab}', '${filtro}')">
          <span>${escaparHtml(titulo)}</span>
          <strong>${escaparHtml(valor)}</strong>
        </button>
      `).join("")}
    </div>
    <div class="chart-grid">
      ${renderGraficoLinha("Crescimento de usuários", getSeriesMensais("clientes"))}
      ${renderGraficoBarras("Receita", getSeriesMensais("receita"))}
      ${renderGraficoPizza("Planos", [
        { label: "Free", valor: metricas.porPlano.free },
        { label: "Premium", valor: metricas.porPlano.premium },
        { label: "Trial", valor: metricas.porPlano.trial }
      ])}
      ${renderGraficoBarras("Pagamentos", ["approved", "pending", "rejected", "cancelled"].map((status) => ({
        label: status,
        valor: saasPayments.filter((pagamento) => pagamento.status === status).length
      })))}
    </div>
  `;
}

function renderSuperAdminPagamentos() {
  const filtro = String(window.__superAdminPagamentoFiltro || "");
  const pagamentos = saasPayments
    .filter((pagamento) => !filtro || pagamento.status === filtro)
    .sort((a, b) => (Date.parse(b.createdAt || 0) || 0) - (Date.parse(a.createdAt || 0) || 0));
  return `
    <div class="actions">
      ${["", "approved", "pending", "rejected", "cancelled"].map((status) => `<button class="btn ghost" onclick="filtrarPagamentosSuperAdmin('${status}')">${status || "Todos"}</button>`).join("")}
    </div>
    <div class="payment-table admin-table">
      ${pagamentos.map((pagamento) => {
        const cliente = getClienteSaasPorId(pagamento.clientId);
        return `
          <div class="payment-row">
            <span>${escaparHtml(cliente?.clientCode || pagamento.clientId || "-")}</span>
            <strong>${formatarMoeda(pagamento.amount)}</strong>
            <span class="status-badge ${classeStatusPlano(pagamento.status)}">${escaparHtml(pagamento.status)}</span>
            <span>${pagamento.createdAt ? new Date(pagamento.createdAt).toLocaleDateString("pt-BR") : "-"}</span>
            <span>${escaparHtml(pagamento.mercadoPagoPaymentId || pagamento.preferenceId || "-")}</span>
          </div>
        `;
      }).join("") || `<p class="empty">Nenhum pagamento encontrado.</p>`}
    </div>
  `;
}

function renderSuperAdminPlanos() {
  return `
    <div class="comparison-grid">
      ${garantirPlanosSaas().filter((plano) => ["free", "premium_trial", "premium"].includes(plano.slug)).map((plano) => `
        <div class="plan-card ${plano.recommended ? "featured" : ""}">
          <div class="row-title"><strong>${escaparHtml(plano.name)}</strong><span>${formatarMoeda(plano.price)}</span></div>
          <p class="muted">${plano.maxUsers} usuário(s) • ${plano.maxOrders || "pedidos ilimitados"} • ${plano.maxCalculatorUses || "calculadora ilimitada"}</p>
          <span class="status-badge ${plano.active ? "badge-ativo" : "badge-danger"}">${plano.active ? "ativo" : "inativo"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSuperAdminTrial() {
  const trials = saasSubscriptions.filter((assinatura) => assinatura.planSlug === "premium_trial");
  return `
    <div class="payment-table admin-table">
      ${trials.map((assinatura) => {
        const cliente = getClienteSaasPorId(assinatura.clientId);
        return `
          <div class="payment-row">
            <span>${escaparHtml(cliente?.clientCode || assinatura.clientId)}</span>
            <strong>${escaparHtml(cliente?.name || "-")}</strong>
            <span>${escaparHtml(getPlanoSaas(assinatura.planSlug).name)}</span>
            <span class="status-badge ${classeStatusPlano(assinatura.status)}">${escaparHtml(assinatura.status)}</span>
            <span>${assinatura.expiresAt ? new Date(assinatura.expiresAt).toLocaleDateString("pt-BR") : "-"}</span>
          </div>
        `;
      }).join("") || `<p class="empty">Nenhum trial ativo.</p>`}
    </div>
  `;
}

function renderSuperAdminLogs() {
  const logs = auditLogs.slice(0, 120);
  return `
    <div class="history-list">
      ${logs.map((log) => `
        <div class="history-item">
          <strong>${escaparHtml(log.acao)}</strong>
          <span class="muted">${new Date(log.data || Date.now()).toLocaleString("pt-BR")} • ${escaparHtml(log.clientId || "-")}</span>
          <span class="muted">${escaparHtml(JSON.stringify(log.detalhes || {})).slice(0, 240)}</span>
        </div>
      `).join("") || `<p class="empty">Nenhum log registrado.</p>`}
    </div>
  `;
}

function renderSuperAdminSuporte() {
  return `
    <div class="metrics">
      <div class="metric"><span>Sugestões</span><strong>${sugestoes.length}</strong></div>
      <div class="metric"><span>Erros locais</span><strong>${diagnostics.length}</strong></div>
      <div class="metric"><span>Logs segurança</span><strong>${securityLogs.length}</strong></div>
    </div>
    <div class="history-list">
      ${[...sugestoes.slice(0, 20), ...diagnostics.slice(0, 20)].map((item) => `
        <div class="history-item">
          <strong>${escaparHtml(item.titulo || item.mensagem || "Registro")}</strong>
          <span class="muted">${new Date(item.atualizadoEm || item.data || Date.now()).toLocaleString("pt-BR")}</span>
        </div>
      `).join("") || `<p class="empty">Nenhum chamado local.</p>`}
    </div>
  `;
}

function getEstadoTelemetriaSuperadmin() {
  if (!window.__superAdminTelemetryState) {
    window.__superAdminTelemetryState = {
      erros: "idle",
      feedback: "idle",
      sugestoes: "idle",
      errosMessage: "",
      feedbackMessage: "",
      sugestoesMessage: ""
    };
  }
  return window.__superAdminTelemetryState;
}

function getFiltrosTelemetriaSuperadmin() {
  if (!window.__superAdminTelemetryFilters) {
    window.__superAdminTelemetryFilters = {
      severity: "",
      status: "",
      version: "",
      device: "",
      feedbackStatus: "",
      feedbackType: "",
      suggestionStatus: "",
      suggestionCategory: ""
    };
  }
  return window.__superAdminTelemetryFilters;
}

function atualizarFiltroTelemetriaSuperadmin(campo, valor) {
  const filtros = getFiltrosTelemetriaSuperadmin();
  filtros[campo] = String(valor || "");
  renderApp();
}

async function carregarRelatoriosAutomaticosSupabase(opcoes = {}) {
  const estado = getEstadoTelemetriaSuperadmin();
  if (!isSuperAdmin()) return;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) {
    estado.erros = "missing-token";
    estado.errosMessage = "Entre com a conta Supabase do superadmin para carregar relatórios automáticos.";
    if (opcoes.renderizar) renderApp();
    return;
  }
  estado.erros = "loading";
  estado.errosMessage = "Carregando relatórios automáticos...";
  if (opcoes.renderizar) renderApp();
  try {
    const linhas = await requisicaoSupabase("/rest/v1/app_error_logs?select=*&order=last_seen_at.desc&limit=120", { method: "GET" });
    appErrorLogsRemotos = Array.isArray(linhas) ? linhas : [];
    estado.erros = "loaded";
    estado.errosMessage = "";
  } catch (erro) {
    appErrorLogsRemotos = [];
    estado.erros = "error";
    estado.errosMessage = ErrorService.toAppError(erro).userMessage || "Não foi possível carregar relatórios automáticos.";
    registrarErroAplicacaoSilencioso("LOAD_ERROR_REPORTS_FAILED", erro, "Carregar relatórios automáticos");
  }
  if (opcoes.renderizar) renderApp();
}

async function carregarFeedbackReportsSupabase(opcoes = {}) {
  const estado = getEstadoTelemetriaSuperadmin();
  if (!isSuperAdmin()) return;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) {
    estado.feedback = "missing-token";
    estado.feedbackMessage = "Entre com a conta Supabase do superadmin para carregar feedbacks.";
    if (opcoes.renderizar) renderApp();
    return;
  }
  estado.feedback = "loading";
  estado.feedbackMessage = "Carregando feedbacks...";
  if (opcoes.renderizar) renderApp();
  try {
    const linhas = await requisicaoSupabase("/rest/v1/app_feedback_reports?select=*&order=created_at.desc&limit=120", { method: "GET" });
    appFeedbackReportsRemotos = Array.isArray(linhas) ? linhas : [];
    estado.feedback = "loaded";
    estado.feedbackMessage = "";
  } catch (erro) {
    appFeedbackReportsRemotos = [];
    estado.feedback = "error";
    estado.feedbackMessage = ErrorService.toAppError(erro).userMessage || "Não foi possível carregar feedbacks.";
    registrarErroAplicacaoSilencioso("LOAD_FEEDBACK_REPORTS_FAILED", erro, "Carregar feedbacks superadmin");
  }
  if (opcoes.renderizar) renderApp();
}

async function carregarSugestoesSupabase(opcoes = {}) {
  const estado = getEstadoTelemetriaSuperadmin();
  if (!isSuperAdmin()) return;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) {
    estado.sugestoes = "missing-token";
    estado.sugestoesMessage = "Entre com a conta Supabase do superadmin para carregar sugestões.";
    if (opcoes.renderizar) renderApp();
    return;
  }
  estado.sugestoes = "loading";
  estado.sugestoesMessage = "Carregando sugestões...";
  if (opcoes.renderizar) renderApp();
  try {
    const linhas = await requisicaoSupabase("/rest/v1/app_suggestions?select=*&order=created_at.desc&limit=200", { method: "GET" });
    appSuggestionsRemotas = Array.isArray(linhas) ? linhas : [];
    estado.sugestoes = "loaded";
    estado.sugestoesMessage = "";
  } catch (erro) {
    appSuggestionsRemotas = [];
    estado.sugestoes = "error";
    estado.sugestoesMessage = ErrorService.toAppError(erro).userMessage || "Não foi possível carregar sugestões.";
    registrarErroAplicacaoSilencioso("LOAD_APP_SUGGESTIONS_FAILED", erro, "Carregar sugestões superadmin");
  }
  if (opcoes.renderizar) renderApp();
}

async function atualizarStatusRelatorioAutomatico(id, status) {
  if (!isSuperAdmin() || !id) return;
  try {
    await requisicaoSupabase(`/rest/v1/app_error_logs?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status })
    });
    appErrorLogsRemotos = appErrorLogsRemotos.map((item) => String(item.id) === String(id) ? { ...item, status } : item);
    mostrarToast("Status do relatório atualizado.", "sucesso", 3500);
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status relatório", errorKey: "UPDATE_ERROR_REPORT_STATUS_FAILED" });
  }
}

async function atualizarStatusFeedbackReport(id, status) {
  if (!isSuperAdmin() || !id) return;
  try {
    await requisicaoSupabase(`/rest/v1/app_feedback_reports?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status })
    });
    appFeedbackReportsRemotos = appFeedbackReportsRemotos.map((item) => String(item.id) === String(id) ? { ...item, status } : item);
    mostrarToast("Status do feedback atualizado.", "sucesso", 3500);
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status feedback", errorKey: "UPDATE_FEEDBACK_STATUS_FAILED" });
  }
}

async function atualizarStatusSugestaoApp(id, status) {
  if (!isSuperAdmin() || !id) return;
  try {
    await requisicaoSupabase(`/rest/v1/app_suggestions?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status })
    });
    appSuggestionsRemotas = appSuggestionsRemotas.map((item) => String(item.id) === String(id) ? { ...item, status } : item);
    mostrarToast("Status da sugestão atualizado.", "sucesso", 3500);
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status sugestão", errorKey: "UPDATE_APP_SUGGESTION_STATUS_FAILED" });
  }
}

function filtrarRelatoriosAutomaticos(lista) {
  const filtros = getFiltrosTelemetriaSuperadmin();
  return lista.filter((item) => {
    if (filtros.severity && item.severity !== filtros.severity) return false;
    if (filtros.status && item.status !== filtros.status) return false;
    if (filtros.version && !String(item.app_version || "").toLowerCase().includes(filtros.version.toLowerCase())) return false;
    if (filtros.device && !String(item.device_model || "").toLowerCase().includes(filtros.device.toLowerCase())) return false;
    return true;
  });
}

function filtrarFeedbackReports(lista) {
  const filtros = getFiltrosTelemetriaSuperadmin();
  return lista.filter((item) => {
    if (filtros.feedbackStatus && item.status !== filtros.feedbackStatus) return false;
    if (filtros.feedbackType && item.type !== filtros.feedbackType) return false;
    return true;
  });
}

function filtrarSugestoesApp(lista) {
  const filtros = getFiltrosTelemetriaSuperadmin();
  return lista.filter((item) => {
    if (filtros.suggestionStatus && item.status !== filtros.suggestionStatus) return false;
    if (filtros.suggestionCategory && item.category !== filtros.suggestionCategory) return false;
    return true;
  });
}

function contarSugestoesPorCategoria(lista = []) {
  return lista.reduce((acc, item) => {
    const categoria = String(item.category || "geral").toLowerCase();
    acc[categoria] = (Number(acc[categoria]) || 0) + 1;
    return acc;
  }, {});
}

function renderSuperAdminRelatoriosAutomaticos() {
  const estado = getEstadoTelemetriaSuperadmin();
  if (estado.erros === "idle") {
    estado.erros = "loading";
    setTimeout(() => carregarRelatoriosAutomaticosSupabase({ renderizar: true }), 0);
  }
  const filtros = getFiltrosTelemetriaSuperadmin();
  const lista = filtrarRelatoriosAutomaticos(appErrorLogsRemotos);
  return `
    <div class="sync-grid">
      <label class="field"><span>Severidade</span><select onchange="atualizarFiltroTelemetriaSuperadmin('severity', this.value)">
        <option value="">Todas</option>
        ${["critical", "high", "medium", "low"].map((valor) => `<option value="${valor}" ${filtros.severity === valor ? "selected" : ""}>${valor}</option>`).join("")}
      </select></label>
      <label class="field"><span>Status</span><select onchange="atualizarFiltroTelemetriaSuperadmin('status', this.value)">
        <option value="">Todos</option>
        ${["new", "reviewing", "fixed", "ignored"].map((valor) => `<option value="${valor}" ${filtros.status === valor ? "selected" : ""}>${valor}</option>`).join("")}
      </select></label>
      <label class="field"><span>Versão</span><input value="${escaparAttr(filtros.version)}" oninput="atualizarFiltroTelemetriaSuperadmin('version', this.value)" placeholder="2026..."></label>
      <label class="field"><span>Dispositivo</span><input value="${escaparAttr(filtros.device)}" oninput="atualizarFiltroTelemetriaSuperadmin('device', this.value)" placeholder="Android, web..."></label>
    </div>
    <div class="actions">
      <button class="btn secondary" onclick="carregarRelatoriosAutomaticosSupabase({ renderizar: true })">Atualizar</button>
    </div>
    ${estado.errosMessage ? `<div class="saas-sync-state ${estado.erros === "error" ? "warning" : "info"}">${escaparHtml(estado.errosMessage)}</div>` : ""}
    <div class="payment-table admin-table telemetry-table">
      <div class="payment-row table-head">
        <span>Erro</span><span>Ocorrências</span><span>Usuários</span><span>Severidade</span><span>Versão</span><span>Dispositivo</span><span>Último</span><span>Status</span><span>Ações</span>
      </div>
      ${lista.map((item) => `
        <div class="payment-row">
          <span><strong>${escaparHtml(item.error_key || "-")}</strong><small>${escaparHtml(item.action_name || item.screen_name || "")}</small></span>
          <span>${Number(item.occurrence_count) || 0}</span>
          <span>${Number(item.affected_user_count) || 0}</span>
          <span>${escaparHtml(item.severity || "low")}</span>
          <span>${escaparHtml(item.app_version || "-")}</span>
          <span>${escaparHtml(item.device_model || item.platform || "-")}</span>
          <span>${item.last_seen_at ? new Date(item.last_seen_at).toLocaleString("pt-BR") : "-"}</span>
          <span>${escaparHtml(item.status || "new")}</span>
          <span class="row-actions">
            <button class="btn ghost" onclick="atualizarStatusRelatorioAutomatico('${escaparAttr(item.id)}', 'reviewing')">Analisar</button>
            <button class="btn secondary" onclick="atualizarStatusRelatorioAutomatico('${escaparAttr(item.id)}', 'fixed')">Corrigido</button>
            <button class="btn warning" onclick="atualizarStatusRelatorioAutomatico('${escaparAttr(item.id)}', 'ignored')">Ignorar</button>
          </span>
        </div>
      `).join("") || `<p class="empty">Nenhum relatório automático encontrado.</p>`}
    </div>
  `;
}

function renderSuperAdminFeedbackReports() {
  const estado = getEstadoTelemetriaSuperadmin();
  if (estado.feedback === "idle") {
    estado.feedback = "loading";
    setTimeout(() => carregarFeedbackReportsSupabase({ renderizar: true }), 0);
  }
  if (estado.sugestoes === "idle") {
    estado.sugestoes = "loading";
    setTimeout(() => carregarSugestoesSupabase({ renderizar: true }), 0);
  }
  const filtros = getFiltrosTelemetriaSuperadmin();
  const lista = filtrarFeedbackReports(appFeedbackReportsRemotos);
  const sugestoesRemotas = filtrarSugestoesApp(appSuggestionsRemotas);
  const categorias = contarSugestoesPorCategoria(appSuggestionsRemotas);
  const nfeCount = Number(categorias.nfe) || 0;
  const categoriasOrdenadas = Object.entries(categorias).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return `
    <div class="metrics">
      <div class="metric"><span>Sugestões online</span><strong>${appSuggestionsRemotas.length}</strong></div>
      <div class="metric"><span>Pedidos NF-e</span><strong>${nfeCount}</strong></div>
      <div class="metric"><span>Feedbacks técnicos</span><strong>${appFeedbackReportsRemotos.length}</strong></div>
    </div>
    <div class="history-list">
      ${categoriasOrdenadas.map(([categoria, total]) => `
        <div class="history-item">
          <strong>${escaparHtml(categoria)}</strong>
          <span class="muted">${Number(total) || 0} pedido(s)</span>
        </div>
      `).join("") || `<p class="empty">Nenhuma categoria contabilizada.</p>`}
    </div>
    <div class="sync-grid">
      <label class="field"><span>Status</span><select onchange="atualizarFiltroTelemetriaSuperadmin('feedbackStatus', this.value)">
        <option value="">Todos</option>
        ${["new", "reviewing", "fixed", "ignored", "closed"].map((valor) => `<option value="${valor}" ${filtros.feedbackStatus === valor ? "selected" : ""}>${valor}</option>`).join("")}
      </select></label>
      <label class="field"><span>Tipo</span><select onchange="atualizarFiltroTelemetriaSuperadmin('feedbackType', this.value)">
        <option value="">Todos</option>
        ${["bug", "sugestao", "duvida", "melhoria", "reclamacao"].map((valor) => `<option value="${valor}" ${filtros.feedbackType === valor ? "selected" : ""}>${valor}</option>`).join("")}
      </select></label>
      <label class="field"><span>Status sugestão</span><select onchange="atualizarFiltroTelemetriaSuperadmin('suggestionStatus', this.value)">
        <option value="">Todos</option>
        ${["new", "reviewing", "planned", "done", "ignored"].map((valor) => `<option value="${valor}" ${filtros.suggestionStatus === valor ? "selected" : ""}>${valor}</option>`).join("")}
      </select></label>
      <label class="field"><span>Categoria sugestão</span><select onchange="atualizarFiltroTelemetriaSuperadmin('suggestionCategory', this.value)">
        <option value="">Todas</option>
        ${Object.keys(categorias).sort().map((valor) => `<option value="${escaparAttr(valor)}" ${filtros.suggestionCategory === valor ? "selected" : ""}>${escaparHtml(valor)}</option>`).join("")}
      </select></label>
    </div>
    <div class="actions">
      <button class="btn secondary" onclick="carregarFeedbackReportsSupabase({ renderizar: true })">Atualizar</button>
      <button class="btn ghost" onclick="carregarSugestoesSupabase({ renderizar: true })">Atualizar sugestões</button>
    </div>
    ${estado.feedbackMessage ? `<div class="saas-sync-state ${estado.feedback === "error" ? "warning" : "info"}">${escaparHtml(estado.feedbackMessage)}</div>` : ""}
    ${estado.sugestoesMessage ? `<div class="saas-sync-state ${estado.sugestoes === "error" ? "warning" : "info"}">${escaparHtml(estado.sugestoesMessage)}</div>` : ""}
    <h2 class="section-title">Sugestões do app</h2>
    <div class="history-list">
      ${sugestoesRemotas.map((item) => `
        <div class="history-item">
          <strong>${escaparHtml(item.title || "Sugestão")}</strong>
          <span class="muted">${escaparHtml(item.type || "-")} • ${escaparHtml(item.category || "geral")} • ${escaparHtml(item.status || "new")} • ${item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}</span>
          <span>${escaparHtml(item.description || "")}</span>
          <div class="row-actions">
            <button class="btn ghost" onclick="atualizarStatusSugestaoApp('${escaparAttr(item.id)}', 'reviewing')">Analisar</button>
            <button class="btn secondary" onclick="atualizarStatusSugestaoApp('${escaparAttr(item.id)}', 'planned')">Planejar</button>
            <button class="btn secondary" onclick="atualizarStatusSugestaoApp('${escaparAttr(item.id)}', 'done')">Concluída</button>
            <button class="btn warning" onclick="atualizarStatusSugestaoApp('${escaparAttr(item.id)}', 'ignored')">Ignorar</button>
          </div>
        </div>
      `).join("") || `<p class="empty">Nenhuma sugestão encontrada.</p>`}
    </div>
    <h2 class="section-title">Feedback técnico</h2>
    <div class="history-list">
      ${lista.map((item) => `
        <div class="history-item">
          <strong>${escaparHtml(item.title || "Feedback")}</strong>
          <span class="muted">${escaparHtml(item.type || "-")} • ${escaparHtml(item.status || "new")} • ${escaparHtml(item.user_email || "-")} • ${item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}</span>
          <span>${escaparHtml(item.description || "")}</span>
          <div class="row-actions">
            <button class="btn ghost" onclick="atualizarStatusFeedbackReport('${escaparAttr(item.id)}', 'reviewing')">Analisar</button>
            <button class="btn secondary" onclick="atualizarStatusFeedbackReport('${escaparAttr(item.id)}', 'fixed')">Corrigido</button>
            <button class="btn warning" onclick="atualizarStatusFeedbackReport('${escaparAttr(item.id)}', 'ignored')">Ignorar</button>
            <button class="btn ghost" onclick="atualizarStatusFeedbackReport('${escaparAttr(item.id)}', 'closed')">Fechar</button>
          </div>
        </div>
      `).join("") || `<p class="empty">Nenhum feedback encontrado.</p>`}
    </div>
  `;
}

function renderSuperAdminConfiguracoes() {
  usuarios = normalizarUsuarios(usuarios);
  const termo = String(window.__superAdminBusca || "").toLowerCase();
  const lista = usuarios.filter((usuario) => !termo || usuario.email.includes(termo) || usuario.nome.toLowerCase().includes(termo));
  return `
    <div class="sync-grid">
      <label class="field"><span>Buscar por e-mail</span><input value="${escaparAttr(window.__superAdminBusca || "")}" oninput="filtrarSuperAdmin(this.value)" placeholder="cliente@email.com"></label>
      <label class="field"><span>E-mail para acesso manual</span><input id="superEmail" type="email" placeholder="cliente@email.com"></label>
      <label class="field"><span>Tipo de plano</span><select id="superPlanoTipo"><option value="trial">Trial</option><option value="paid">Premium</option><option value="free">Free</option></select></label>
      <label class="field"><span>Dias</span><input id="superPlanoDias" type="number" min="1" step="1" value="7"></label>
    </div>
    <div class="actions">
      <button class="btn" onclick="salvarAcessoSuperAdmin()">Criar acesso manual</button>
      <button class="btn secondary" type="button" data-action="superadmin-refresh-users">Atualizar usuários Supabase</button>
      <button class="btn ghost" onclick="exportarBackup()">Exportar backup geral</button>
    </div>
    <div class="history-list users-list">
      ${lista.map((usuario) => {
        const status = statusUsuarioPlano(usuario);
        const principal = isSuperAdminPrincipal(usuario);
        return `
          <div class="user-row superadmin-row">
            <div>
              <strong>${escaparHtml(usuario.nome)}</strong>
              <span class="muted">${escaparHtml(usuario.email)} • ${escaparHtml(usuario.papel)}${principal ? " • principal" : ""}</span>
              <span class="muted">Vence: ${usuario.planExpiresAt ? new Date(usuario.planExpiresAt).toLocaleDateString("pt-BR") : "sem data"}</span>
            </div>
            <span class="status-badge ${classeStatusPlano(status)}">${escaparHtml(status)}</span>
            <div class="row-actions">
              <button class="btn ghost" onclick="ajustarDiasUsuario('${escaparAttr(usuario.id)}', 7)">+7</button>
              <button class="btn ghost" onclick="ajustarDiasUsuario('${escaparAttr(usuario.id)}', 30)">+30</button>
              <button class="btn warning" onclick="alternarBloqueioUsuario('${escaparAttr(usuario.id)}')" ${principal ? "disabled" : ""}>${usuario.bloqueado ? "Desbloquear" : "Bloquear"}</button>
              <button class="btn danger" onclick="excluirUsuarioSuperAdmin('${escaparAttr(usuario.id)}')" ${principal ? "disabled" : ""}>Excluir</button>
            </div>
          </div>
        `;
      }).join("") || `<p class="empty">Nenhum usuário encontrado.</p>`}
    </div>
  `;
}

function renderSuperAdminConteudo(tab) {
  const mapa = {
    dashboard: renderSuperAdminDashboard,
    clientes: renderClientesSaas,
    pagamentos: renderSuperAdminPagamentos,
    planos: renderSuperAdminPlanos,
    trial: renderSuperAdminTrial,
    logs: renderSuperAdminLogs,
    suporte: renderSuperAdminSuporte,
    relatorios: renderSuperAdminRelatoriosAutomaticos,
    feedbacks: renderSuperAdminFeedbackReports,
    configuracoes: renderSuperAdminConfiguracoes
  };
  return (mapa[tab] || mapa.dashboard)();
}

function renderSuperAdmin() {
  if (!isSuperAdmin()) {
    return renderBloqueioPlano("Super Admin");
  }

  const tab = window.__superAdminTab || "dashboard";
  const abas = [
    ["dashboard", "Dashboard"],
    ["clientes", "Clientes"],
    ["pagamentos", "Pagamentos"],
    ["planos", "Planos"],
    ["trial", "Trial"],
    ["logs", "Logs"],
    ["suporte", "Suporte"],
    ["relatorios", "Relatórios automáticos"],
    ["feedbacks", "Sugestões e Feedback"],
    ["configuracoes", "Configurações"]
  ];

  return `
    <section class="card superadmin-panel">
      <div class="card-header">
        <h2>🛡️ Superadmin Simplifica 3D</h2>
        <span class="status-badge badge-superadmin">Acesso total</span>
      </div>
      <p class="muted">Painel SaaS com métricas, planos, pagamentos e controle de clientes.</p>
      <div class="superadmin-tabs">
        ${abas.map(([id, label]) => `<button class="tab-button ${tab === id ? "active" : ""}" onclick="trocarAbaSuperAdmin('${id}')">${label}</button>`).join("")}
      </div>
      <div class="superadmin-content">${renderSuperAdminConteudo(tab)}</div>
    </section>
  `;
}

function trocarAbaSuperAdmin(tab) {
  window.__superAdminTab = tab || "dashboard";
  renderApp();
}

function abrirSuperAdminFiltro(tab, filtro) {
  if (tab === "clientes") {
    window.__superAdminTab = "clientes";
    window.__clientesSaasFiltros = filtro ? { ...(window.__clientesSaasFiltros || {}), plano: filtro } : {};
  } else if (tab === "clientesStatus") {
    window.__superAdminTab = "clientes";
    window.__clientesSaasFiltros = { ...(window.__clientesSaasFiltros || {}), status: filtro || "" };
  } else if (tab === "pagamentos") {
    window.__superAdminTab = "pagamentos";
    window.__superAdminPagamentoFiltro = filtro || "";
  }
  renderApp();
}

function filtrarPagamentosSuperAdmin(status) {
  window.__superAdminPagamentoFiltro = status || "";
  renderApp();
}

function filtrarSuperAdmin(valor) {
  window.__superAdminBusca = valor || "";
  renderApp();
}

async function atualizarUsuariosSuperAdminSupabase() {
  if (!isSuperAdmin()) return;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) {
    mostrarToast("Entre com uma sessão Supabase para carregar usuários online.", "erro");
    return;
  }
  await carregarSaasSupabaseSilencioso();
  mostrarToast("Usuários do Supabase atualizados no Superadmin.", "sucesso");
  renderApp();
}

function salvarAcessoSuperAdmin() {
  if (!isSuperAdmin()) return;
  const email = normalizarEmail(document.getElementById("superEmail")?.value || "");
  const tipo = document.getElementById("superPlanoTipo")?.value || "trial";
  const dias = Math.max(1, parseFloat(document.getElementById("superPlanoDias")?.value || 7) || 7);
  if (!email) {
    alert("Informe o e-mail.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === email);
  if (!usuario) {
    usuario = normalizarUsuario({ nome: email.split("@")[0], email, senha: "Simplifica@123", papel: "admin", mustChangePassword: true });
    usuarios.push(usuario);
  }

  usuario.ativo = true;
  usuario.bloqueado = false;
  if (tipo === "trial") {
    usuario.trialStartedAt = new Date().toISOString();
    usuario.trialDays = dias;
    usuario.planStatus = "trial";
    usuario.planExpiresAt = "";
  } else if (tipo === "paid") {
    usuario.planStatus = "paid";
    usuario.trialStartedAt = usuario.trialStartedAt || "";
    usuario.planExpiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
  } else {
    usuario.planStatus = "free";
    usuario.planExpiresAt = "";
  }

  salvarDados();
  registrarHistorico("Super Admin", `Acesso ${tipo} salvo para ${email}`);
  renderApp();
}

function ajustarDiasUsuario(id, dias) {
  if (!isSuperAdmin()) return;
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario) return;
  const base = Math.max(Date.now(), Date.parse(usuario.planExpiresAt || 0) || 0);
  usuario.planStatus = "paid";
  usuario.planExpiresAt = new Date(base + dias * 24 * 60 * 60 * 1000).toISOString();
  usuario.bloqueado = false;
  salvarDados();
  registrarHistorico("Super Admin", `+${dias} dias para ${usuario.email}`);
  renderApp();
}

function alternarBloqueioUsuario(id) {
  if (!isSuperAdmin()) return;
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario || isSuperAdminPrincipal(usuario)) return;
  usuario.bloqueado = !usuario.bloqueado;
  usuario.ativo = !usuario.bloqueado;
  salvarDados();
  registrarHistorico("Super Admin", `${usuario.bloqueado ? "Bloqueado" : "Desbloqueado"}: ${usuario.email}`);
  renderApp();
}

function excluirUsuarioSuperAdmin(id) {
  if (!isSuperAdmin()) return;
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario || isSuperAdminPrincipal(usuario)) {
    alert("O superadmin principal não pode ser excluído.");
    return;
  }
  if (!confirm(`Excluir ${usuario.email}?`)) return;
  usuarios = usuarios.filter((item) => String(item.id) !== String(id));
  salvarDados();
  registrarHistorico("Super Admin", `Usuário excluído: ${usuario.email}`);
  renderApp();
}

function desbloquearRelatoriosComAnuncio() {
  mostrarModalDesbloqueioAnuncio({
    tipo: "reports",
    titulo: "Relatórios avançados",
    texto: "Assista a um anúncio para liberar relatórios avançados temporariamente ou assine o PRO para acesso permanente."
  }).then((liberado) => {
    if (liberado) renderizarPreservandoScroll();
  });
}

function normalizarAppearanceSettings(origem = appConfig.appearanceSettings || {}) {
  return {
    primary_color: origem.primary_color || appConfig.accentColor || "#073b4b",
    secondary_color: origem.secondary_color || "#ff941c",
    pdf_background: origem.pdf_background || appConfig.pdfBackgroundDataUrl || "",
    logo_url: origem.logo_url || appConfig.brandLogoDataUrl || "",
    profile_photo: origem.profile_photo || appConfig.profilePhotoDataUrl || "",
    company_logo: origem.company_logo || appConfig.companyLogoDataUrl || "",
    login_background: origem.login_background || appConfig.loginBackgroundDataUrl || "",
    theme_mode: origem.theme_mode || appConfig.theme || "dark",
    glass_effect: origem.glass_effect !== false,
    custom_pdf_enabled: origem.custom_pdf_enabled !== false
  };
}

function renderPersonalizacao() {
  const corAtual = appConfig.accentColor || "#073b4b";
  const resolucaoAtual = `${window.innerWidth || 0} x ${window.innerHeight || 0}`;
  const acessoMarca = temAcessoCompleto();
  const marcaAtual = getMarcaProjetoSrc();
  const pdfBgAtual = appConfig.pdfBackgroundDataUrl || "";
  const fotoPerfilAtual = appConfig.profilePhotoDataUrl || "";
  const logoEmpresaAtual = appConfig.companyLogoDataUrl || "";
  const fundoLoginAtual = appConfig.loginBackgroundDataUrl || "";
  return `
    <section class="card">
      <div class="card-header">
        <h2>🎨 Personalização</h2>
        <span class="status-badge">${acessoMarca ? "Recurso PRO" : "PRO"}</span>
      </div>

      <label class="field">
        <span>Nome do aplicativo</span>
              <input id="appNameConfig" value="${escaparAttr(appConfig.appName)}" placeholder="Simplifica 3D">
      </label>
      <label class="field">
        <span>Nome da empresa</span>
        <input id="businessNameConfig" value="${escaparAttr(appConfig.businessName)}" placeholder="Minha empresa 3D">
      </label>
      <label class="field">
        <span>WhatsApp comercial</span>
        <input id="whatsappNumberConfig" value="${escaparAttr(appConfig.whatsappNumber)}" placeholder="Ex.: 5585999999999">
      </label>
      <label class="field">
        <span>Rodapé do PDF</span>
        <input id="documentFooterConfig" value="${escaparAttr(appConfig.documentFooter)}" placeholder="Obrigado pela preferência.">
      </label>

      <div class="danger-zone">
        <h2 class="section-title">Perfil premium</h2>
        <p class="muted">Separe a foto do usuário, a logo da empresa e a identidade usada no PDF. Recursos avançados ficam disponíveis no PRO.</p>
        <div class="profile-preview-row">
          <div class="profile-preview-avatar" id="profilePhotoPreview">${fotoPerfilAtual ? `<img src="${escaparAttr(fotoPerfilAtual)}" alt="Foto do usuário">` : escaparHtml(getUserInitials(getUsuarioAtual()?.nome || getUsuarioAtual()?.email || ""))}</div>
          <div class="brand-preview compact">
            <img id="companyLogoPreview" src="${escaparAttr(logoEmpresaAtual || marcaAtual)}" alt="Logo da empresa">
            <div>
              <strong>${escaparHtml(appConfig.businessName || "Minha empresa 3D")}</strong>
              <span class="muted">${escaparHtml(getPlanoAtual().nome)} · ${escaparHtml(getPlanoAtual().descricao || "Plano ativo")}</span>
            </div>
          </div>
        </div>
        <div class="sync-grid">
          <label class="field">
            <span>Foto do usuário</span>
            <input id="profilePhotoFileConfig" class="file-input" type="file" accept="image/*" onchange="prepararPreviewImagemPersonalizacao(this, 'profile-photo')" ${acessoMarca ? "" : "disabled"}>
          </label>
          <label class="field">
            <span>Logo da empresa</span>
            <input id="companyLogoFileConfig" class="file-input" type="file" accept="image/*" onchange="prepararPreviewImagemPersonalizacao(this, 'company-logo')" ${acessoMarca ? "" : "disabled"}>
          </label>
          <label class="field">
            <span>Imagem de fundo do login</span>
            <input id="loginBackgroundFileConfig" class="file-input" type="file" accept="image/*" onchange="prepararPreviewImagemPersonalizacao(this, 'login-background')" ${acessoMarca ? "" : "disabled"}>
          </label>
          <label class="field">
            <span>Mensagem da empresa no login</span>
            <input id="customLoginMessageConfig" maxlength="90" value="${escaparAttr(appConfig.customLoginMessage || "")}" placeholder="Ex.: Impressão 3D sob medida" ${acessoMarca ? "" : "disabled"}>
          </label>
        </div>
        <div class="sync-grid">
          <div class="metric"><span>Foto</span><strong>${acessoMarca ? (fotoPerfilAtual ? "Salva" : "Padrão") : "Disponível no PRO"}</strong></div>
          <div class="metric"><span>Logo empresa</span><strong>${acessoMarca ? (logoEmpresaAtual ? "Salva" : "Padrão") : "Disponível no PRO"}</strong></div>
          <div class="metric"><span>Fundo login</span><strong>${acessoMarca ? (fundoLoginAtual ? "Salvo" : "Padrão") : "Disponível no PRO"}</strong></div>
          <label class="field">
            <span>Nível de animação</span>
            <select id="motionLevelConfig">
              <option value="low" ${appConfig.motionLevel === "low" ? "selected" : ""}>Baixo</option>
              <option value="medium" ${appConfig.motionLevel !== "low" && appConfig.motionLevel !== "high" ? "selected" : ""}>Médio</option>
              <option value="high" ${appConfig.motionLevel === "high" ? "selected" : ""}>Alto</option>
            </select>
          </label>
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">PDF, Pix e marca</h2>
        <p class="muted">Esses dados aparecem no PDF do pedido. A marca d'água e o logotipo ficam liberados no plano completo.</p>
        <div class="brand-preview">
          <img id="brandLogoPreview" src="${escaparAttr(marcaAtual)}" alt="Prévia da marca no PDF">
          <div>
            <strong>${appConfig.brandLogoDataUrl ? "Marca personalizada" : "Capa padrão do projeto"}</strong>
            <span class="muted">Essa imagem aparece no app e no PDF. Clientes pagos podem trocar pela própria marca.</span>
          </div>
        </div>
        <div class="sync-grid">
          <label class="field">
            <span>Chave Pix</span>
            <input id="pixKeyConfig" value="${escaparAttr(appConfig.pixKey || "")}" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória">
          </label>
          <label class="field">
            <span>Nome do recebedor Pix</span>
            <input id="pixReceiverNameConfig" maxlength="25" value="${escaparAttr(appConfig.pixReceiverName || "")}" placeholder="Nome ou empresa">
          </label>
          <label class="field">
            <span>Cidade do Pix</span>
            <input id="pixCityConfig" maxlength="15" value="${escaparAttr(appConfig.pixCity || "")}" placeholder="Cidade">
          </label>
          <label class="field">
            <span>Descrição Pix</span>
            <input id="pixDescriptionConfig" maxlength="40" value="${escaparAttr(appConfig.pixDescription || "Pedido Simplifica 3D")}">
          </label>
        </div>
        <div class="sync-grid">
          <label class="field">
            <span>Logo da marca</span>
            <input id="brandLogoFileConfig" class="file-input" type="file" accept="image/*" onchange="prepararPreviewImagemPersonalizacao(this, 'brand-logo')" ${acessoMarca ? "" : "disabled"}>
          </label>
          <label class="field">
            <span>Fundo do PDF</span>
            <input id="pdfBackgroundFileConfig" class="file-input" type="file" accept="image/*" onchange="prepararPreviewImagemPersonalizacao(this, 'pdf-background')" ${acessoMarca ? "" : "disabled"}>
          </label>
          <div class="metric">
            <span>Marca no PDF</span>
            <strong>${acessoMarca ? (appConfig.brandLogoDataUrl ? "Logo salva" : "Capa padrão") : "Bloqueado"}</strong>
          </div>
          <div class="metric">
            <span>Fundo personalizado</span>
            <strong>${acessoMarca ? (pdfBgAtual ? "Fundo salvo" : "Padrão") : "Bloqueado"}</strong>
          </div>
        </div>
        <div class="sync-grid">
          <label class="field">
            <span>Estilo do PDF</span>
            <select id="pdfStyleConfig" ${acessoMarca ? "" : "disabled"}>
              <option value="clean" ${appConfig.pdfStyle !== "brand" ? "selected" : ""}>Limpo</option>
              <option value="brand" ${appConfig.pdfStyle === "brand" ? "selected" : ""}>Marca destacada</option>
            </select>
          </label>
          <label class="field">
            <span>Cabeçalho personalizado</span>
            <input id="pdfHeaderTextConfig" maxlength="60" value="${escaparAttr(appConfig.pdfHeaderText || "")}" placeholder="Ex.: Qualidade em impressão 3D" ${acessoMarca ? "" : "disabled"}>
          </label>
        </div>
        <label class="checkbox-row">
          <input id="brandWatermarkEnabledConfig" type="checkbox" ${appConfig.brandWatermarkEnabled !== false ? "checked" : ""} ${acessoMarca ? "" : "disabled"}>
          <span>Usar logo como marca d'água no PDF</span>
        </label>
        ${appConfig.brandLogoDataUrl && acessoMarca ? `<button class="btn ghost" onclick="removerLogoMarca()">Remover logo salva</button>` : ""}
        ${appConfig.pdfBackgroundDataUrl && acessoMarca ? `<button class="btn ghost" onclick="removerFundoPdf()">Remover fundo do PDF</button>` : ""}
      </div>

      <div class="sync-grid">
        <label class="field">
          <span>Tema</span>
          <select id="themeConfig" ${acessoMarca ? "" : "disabled"}>
            <option value="dark" ${appConfig.theme === "dark" ? "selected" : ""}>Escuro</option>
            <option value="light" ${appConfig.theme === "light" ? "selected" : ""}>Claro</option>
            <option value="auto" ${appConfig.theme === "auto" ? "selected" : ""}>Automático</option>
          </select>
        </label>
        <label class="field">
          <span>Cor principal</span>
          <input id="accentColorConfig" type="color" value="${escaparAttr(corAtual)}" ${acessoMarca ? "" : "disabled"}>
        </label>
      </div>

      <div class="color-swatches">
        ${["#073b4b", "#ff941c", "#2f6fed", "#e11d48", "#f59e0b", "#0f766e"].map((cor) => `
          <button class="color-swatch" style="--swatch:${cor}" onclick="selecionarCor('${cor}')" title="${cor}" ${acessoMarca ? "" : "disabled"}></button>
        `).join("")}
      </div>

      <div class="sync-grid">
        <label class="field">
          <span>Margem padrão da calculadora (%)</span>
          <input id="defaultMarginConfig" type="number" min="0" step="1" value="${Number(appConfig.defaultMargin) || 100}">
        </label>
        <label class="field">
          <span>Energia padrão R$/kWh</span>
          <input id="defaultEnergyConfig" type="number" min="0" step="0.01" value="${Number(appConfig.defaultEnergy) || 0.85}">
        </label>
      </div>
      <label class="field">
        <span>Filamento padrão R$/kg</span>
        <input id="defaultFilamentCostConfig" type="number" min="0" step="0.01" value="${Number(appConfig.defaultFilamentCost) || 150}">
      </label>
      <label class="field">
        <span>Taxa extra padrão (R$)</span>
        <input id="defaultExtraFeeConfig" type="number" min="0" step="0.01" value="${Number(appConfig.defaultExtraFee) || 0}">
      </label>

      <div class="danger-zone">
        <h2 class="section-title">Tela e resolução</h2>
        <p class="muted">O modo automático ajusta espaçamento, tamanho dos campos e largura dos blocos conforme a tela do cliente.</p>
        <div class="sync-grid">
          <label class="field">
            <span>Ajuste da interface</span>
            <select id="screenFitConfig">
              <option value="auto" ${appConfig.screenFit !== "manual" ? "selected" : ""}>Automático</option>
              <option value="manual" ${appConfig.screenFit === "manual" ? "selected" : ""}>Manual</option>
            </select>
          </label>
          <div class="metric">
            <span>Resolução atual</span>
            <strong>${escaparHtml(resolucaoAtual)}</strong>
          </div>
          <label class="field">
            <span>Escala manual (%)</span>
            <input id="uiScaleConfig" type="number" min="70" max="140" step="5" value="${Number(appConfig.uiScale) || 100}">
          </label>
          <label class="field">
            <span>Largura mínima dos blocos</span>
            <input id="desktopCardMinWidthConfig" type="number" min="220" max="560" step="10" value="${Number(appConfig.desktopCardMinWidth) || 320}">
          </label>
          <label class="field">
            <span>Largura máxima no desktop</span>
            <input id="desktopMaxWidthConfig" type="number" min="900" max="3200" step="20" value="${Number(appConfig.desktopMaxWidth) || 1480}">
          </label>
        </div>
        <div class="actions single">
          <button class="btn ghost" onclick="restaurarLayoutDashboard()">Restaurar janelas da tela principal</button>
        </div>
      </div>

      <label class="checkbox-row">
        <input id="compactModeConfig" type="checkbox" ${appConfig.compactMode ? "checked" : ""}>
        <span>Modo compacto</span>
      </label>
      <label class="checkbox-row">
        <input id="showBrandInHeaderConfig" type="checkbox" ${appConfig.showBrandInHeader ? "checked" : ""}>
        <span>Mostrar nome do app no topo</span>
      </label>

      <div class="actions">
        <button class="btn" onclick="salvarPersonalizacao()">Salvar personalização</button>
        <button class="btn ghost" onclick="restaurarPersonalizacaoPadrao()">Restaurar padrão</button>
      </div>
      <p id="personalizationImageHint" class="muted" hidden>Imagem ajustada automaticamente para o melhor tamanho.</p>
    </section>
  `;
}

function getResumoPlanoUnico(estadoPlano, precoVigente, superadmin = false) {
  if (superadmin) {
    return {
      classe: "pro",
      titulo: "PRO ativo",
      detalhe: "Acesso interno liberado",
      status: "Ativo",
      dias: "Ativo",
      preco: `${formatarMoeda(precoVigente)}/mês`
    };
  }
  if (estadoPlano.state === PLAN_ACCESS_STATES.TRIAL && estadoPlano.isTrialActive) {
    const dias = Math.max(0, Number(estadoPlano.trialRemainingDays || 0));
    return {
      classe: "trial",
      titulo: "Teste PRO ativo",
      detalhe: "Você está usando o PRO gratuitamente. Ao final do teste, sua conta volta para o Free se não assinar.",
      status: "Teste ativo",
      dias: dias === 1 ? "1 dia restante" : `${dias} dias restantes`,
      preco: `Depois ${formatarMoeda(precoVigente)}/mês`
    };
  }
  if (estadoPlano.state === PLAN_ACCESS_STATES.ACTIVE) {
    const dias = Math.max(0, Number(estadoPlano.planRemainingDays || 0));
    const dataRenovacao = estadoPlano.planExpiresAt ? new Date(estadoPlano.planExpiresAt).toLocaleDateString("pt-BR") : "";
    return {
      classe: "pro",
      titulo: "PRO ativo",
      detalhe: dataRenovacao ? `Renovação em ${dataRenovacao}.` : "Recursos completos liberados.",
      status: "Ativo",
      dias: dias > 0 && dias < 9999 ? `${dias} dias restantes` : "Ativo",
      preco: `${formatarMoeda(precoVigente)}/mês`
    };
  }
  if (estadoPlano.pending) {
    return {
      classe: "pending",
      titulo: "Plano atual: FREE",
      detalhe: "Existe um pagamento pendente. Ele não libera PRO e não bloqueia sua conta atual.",
      status: "Pagamento pendente",
      dias: "-",
      preco: `${formatarMoeda(precoVigente)}/mês`
    };
  }
  return {
    classe: "free",
    titulo: "Plano atual: FREE",
    detalhe: "Recursos básicos com anúncios leves. Faça upgrade para liberar o PRO.",
    status: "Gratuito",
    dias: "-",
    preco: `${formatarMoeda(precoVigente)}/mês`
  };
}

function renderStatusPlanoUnico(resumo) {
  return `
    <div class="plan-current-card plan-current-${escaparAttr(resumo.classe)}">
      <span class="plan-badge">${escaparHtml(resumo.status)}</span>
      <h3>${escaparHtml(resumo.titulo)}</h3>
      <p>${escaparHtml(resumo.detalhe)}</p>
      <div class="comparison-grid">
        <div class="metric"><span>Status</span><strong>${escaparHtml(resumo.status)}</strong></div>
        <div class="metric"><span>Período</span><strong>${escaparHtml(resumo.dias)}</strong></div>
        <div class="metric"><span>PRO</span><strong>${escaparHtml(resumo.preco)}</strong></div>
      </div>
    </div>
  `;
}

function renderAssinatura() {
  verificarVencimentoPlanoLocal(false);
  const plano = getPlanoAtual();
  const estadoPlano = resolverEstadoPlano(getUsuarioAtual(), { source: "plans-screen" });
  const precoVigente = getPrecoPagoVigenteLocal();
  const superadmin = isSuperAdmin();
  const isTrial = estadoPlano.state === PLAN_ACCESS_STATES.TRIAL && estadoPlano.isTrialActive;
  const isPremiumAtivo = superadmin || estadoPlano.state === PLAN_ACCESS_STATES.ACTIVE;
  const diasTrial = Math.max(0, Number(estadoPlano.trialRemainingDays || 0));
  const diasPlano = Math.max(0, Number(estadoPlano.planRemainingDays || plano.diasRestantes || 0));
  const resumoPlano = getResumoPlanoUnico(estadoPlano, precoVigente, superadmin);
  const cardsPlanos = isPremiumAtivo
    ? renderPlanoPremiumAtivoCard(estadoPlano, precoVigente, superadmin, diasPlano)
    : `${isTrial ? renderTrialPremiumAtivoCard(diasTrial) : ""}
       ${renderPlanoSaasCard(getPlanoSaas("premium"), { destaque: true, isTrial, preco: precoVigente })}
       ${renderPlanoSaasCard(getPlanoSaas("free"), { secundario: true, isTrial })}`;

  return `
    <section class="card plans-screen ${isTrial ? "plans-screen-trial" : isPremiumAtivo ? "plans-screen-premium" : "plans-screen-free"}">
      <div class="card-header">
        <h2>Planos</h2>
        <span class="status-badge ${classeStatusPlano(plano.status)}">${escaparHtml(plano.nome)}</span>
      </div>
      <p class="muted">${isTrial
        ? "Você está usando os benefícios Premium gratuitamente durante o teste."
        : isPremiumAtivo
          ? "Seu Premium está ativo e os recursos completos estão liberados."
          : "Escolha o Premium para remover anúncios e liberar o app completo."}</p>

      ${renderStatusPlanoUnico(resumoPlano)}

      ${estadoPlano.pending ? `
        <div class="plan-note plan-note-warning">
          <strong>Pagamento pendente</strong>
          <span>O plano atual continua funcionando normalmente até a confirmação do pagamento.</span>
        </div>
      ` : ""}

      <div class="plans-grid">
        ${cardsPlanos}
      </div>

      <div class="plan-benefits-panel">
        <h2 class="section-title">Benefícios Premium</h2>
        <div class="comparison-grid">
          <div class="metric"><span>Anúncios</span><strong>${estadoPlano.hasPremium ? "Sem anúncios" : "Ativos no Free"}</strong></div>
          <div class="metric"><span>Pedidos</span><strong>${estadoPlano.hasPremium ? "Ilimitados" : "Limitados"}</strong></div>
          <div class="metric"><span>PDFs</span><strong>${estadoPlano.hasPremium ? "Ilimitados" : "1 por dia"}</strong></div>
          <div class="metric"><span>Relatórios</span><strong>${estadoPlano.hasPremium ? "Avançados" : "Básicos"}</strong></div>
        </div>
      </div>

      <div class="actions">
        ${superadmin
          ? `<button class="btn secondary" type="button" onclick="trocarTela('superadmin')">Gerenciar clientes</button>`
          : `<button class="btn secondary" type="button" onclick="sincronizarSupabase()">Restaurar compra</button>
             <button class="btn ghost" type="button" data-action="open-screen" data-screen="dashboard">Continuar usando</button>`}
      </div>
    </section>
  `;
}

function renderTrialPremiumAtivoCard(diasTrial = 0) {
  const textoDias = diasTrial === 1 ? "1 dia restante" : `${diasTrial} dias restantes`;
  return `
    <div class="plan-status-card trial" aria-label="Teste PRO ativo">
      <div class="plan-card-top">
        <span class="plan-badge plan-badge-trial">Teste PRO ativo</span>
        <strong class="plan-days">${textoDias}</strong>
      </div>
      <h3>Você está testando o PRO gratuitamente</h3>
      <p>Ao final do período, sua conta volta para o plano gratuito caso você não assine.</p>
      <div class="actions">
        <button class="btn plan-primary-button" type="button" data-action="open-payment" data-slug="premium">Assinar PRO</button>
        <button class="btn ghost" type="button" data-action="open-screen" data-screen="dashboard">Continuar usando</button>
      </div>
    </div>
  `;
}

function renderPlanoPremiumAtivoCard(estadoPlano, precoVigente, superadmin = false, diasPlano = 0) {
  const validade = superadmin
    ? "Acesso interno liberado"
    : diasPlano > 0 && diasPlano < 9999
      ? `${diasPlano} dia(s) restantes`
      : "Assinatura ativa";
  return `
    <div class="plan-card featured plan-card-premium plan-card-active">
      <div class="plan-card-top">
        <span class="plan-badge">PRO ativo</span>
        <span class="status-badge badge-pago">${escaparHtml(validade)}</span>
      </div>
      <h3>PRO</h3>
      <div class="plan-price">${formatarMoeda(precoVigente)}<small>/mês</small></div>
      ${renderPlanBenefitList([
        "Pedidos ilimitados",
        "PDFs ilimitados",
        "Sem anúncios",
        "Relatórios avançados",
        "Backup e sincronização",
        "Suporte prioritário"
      ])}
      <div class="actions">
        <button class="btn ghost" type="button" data-action="open-screen" data-screen="dashboard">Continuar usando</button>
        ${superadmin
          ? `<button class="btn secondary" type="button" onclick="trocarTela('superadmin')">Gerenciar clientes</button>`
          : `<button class="btn secondary" type="button" onclick="sincronizarSupabase()">Restaurar compra</button>`}
      </div>
    </div>
  `;
}

function renderPlanBenefitList(beneficios = []) {
  return `
    <ul class="plan-benefit-list">
      ${beneficios.map((item) => `<li>${escaparHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderPlanoSaasCard(plano, options = {}) {
  const superadmin = isSuperAdmin();
  const isPremium = plano.slug === "premium";
  const preco = isPremium ? Number(options.preco || getPrecoPagoVigenteLocal()) : 0;
  const beneficios = isPremium
    ? ["Pedidos ilimitados", "PDFs ilimitados", "Sem anúncios", "Relatórios avançados", "Backup e sincronização", "Suporte prioritário"]
    : ["Pedidos limitados", "1 PDF grátis por dia", "Anúncios leves", "Recursos básicos"];

  return `
    <div class="plan-card ${isPremium ? "featured plan-card-premium" : "plan-card-free"}">
      <div class="plan-card-top">
        <span class="plan-badge ${isPremium ? "" : "plan-badge-free"}">${isPremium ? "Recomendado" : "Gratuito"}</span>
        ${isPremium ? `<span class="muted">Mais completo</span>` : ""}
      </div>
      <h3>${isPremium ? "PRO" : "Free"}</h3>
      ${isPremium
        ? `<div class="plan-price">${formatarMoeda(preco)}<small>/mês</small></div>
           <p class="muted plan-card-note">Primeiro mês por ${formatarMoeda(PREMIUM_FIRST_MONTH_PRICE)}.</p>`
        : `<p class="plan-free-copy">Para continuar sem custo, com anúncios leves e recursos básicos.</p>`}
      ${renderPlanBenefitList(beneficios)}
      ${isPremium && options.isTrial ? `<p class="muted plan-card-note">Assinar agora não cancela o teste atual; o acesso PRO continua normalmente enquanto o pagamento é confirmado.</p>` : ""}
      <div class="actions single">
        ${superadmin
          ? `<button class="btn ghost" type="button" disabled>Não aplicável</button>`
          : isPremium
            ? `<button class="btn plan-primary-button" type="button" data-action="open-payment" data-slug="premium">Assinar PRO</button>`
            : `<button class="btn ghost plan-free-button" type="button" data-action="open-screen" data-screen="dashboard">Continuar no plano gratuito</button>`}
      </div>
    </div>
  `;
}

function renderMinhaAssinatura() {
  verificarVencimentoPlanoLocal(false);
  const cliente = getClienteSaasAtual();
  const assinatura = getAssinaturaSaas();
  const plano = getPlanoSaasAtual();
  const status = getPlanoAtual();
  const pagamentos = saasPayments
    .filter((pagamento) => !cliente?.id || pagamento.clientId === cliente.id || pagamento.clientId === billingConfig.clientId)
    .sort((a, b) => (Date.parse(b.createdAt || 0) || 0) - (Date.parse(a.createdAt || 0) || 0));
  const ultimo = pagamentos[0];
  const inicio = assinatura?.startedAt || cliente?.createdAt || "";
  const vencimento = assinatura?.expiresAt || assinatura?.nextBillingAt || billingConfig.paidUntil || "";
  const diasRestantes = vencimento ? getRemainingDays(vencimento) : status.diasRestantes;

  const linhas = pagamentos.map((pagamento) => `
    <div class="payment-row">
      <span>${new Date(pagamento.createdAt || Date.now()).toLocaleDateString("pt-BR")}</span>
      <strong>${escaparHtml(getPlanoSaas(pagamento.planSlug).name)}</strong>
      <span>${formatarMoeda(pagamento.amount)}</span>
      <span class="status-badge ${classeStatusPlano(pagamento.status)}">${escaparHtml(pagamento.status)}</span>
      <span>${escaparHtml(pagamento.paymentMethod || "-")}</span>
      <span>${escaparHtml(pagamento.mercadoPagoPaymentId || "-")}</span>
    </div>
  `).join("") || `<p class="empty">Nenhum pagamento confirmado ainda.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>💳 Minha Assinatura</h2>
        <span class="status-badge ${classeStatusPlano(status.status)}">${escaparHtml(status.nome)}</span>
      </div>
      <p class="muted">Os dados técnicos ficam aqui como histórico interno. O plano só é liberado após confirmação real do webhook Mercado Pago.</p>

      <div class="metrics">
        <div class="metric"><span>Cliente ID</span><strong>${escaparHtml(cliente?.clientCode || billingConfig.clientId || "não vinculado")}</strong></div>
        <div class="metric"><span>Plano atual</span><strong>${escaparHtml(plano.name)}</strong></div>
        <div class="metric"><span>Status</span><strong>${escaparHtml(status.descricao || status.status)}</strong></div>
        <div class="metric"><span>Dias restantes</span><strong>${diasRestantes >= 9999 ? "Livre" : Math.max(0, diasRestantes || 0)}</strong></div>
        <div class="metric"><span>Início do plano</span><strong>${inicio ? new Date(inicio).toLocaleDateString("pt-BR") : "-"}</strong></div>
        <div class="metric"><span>Vencimento / cobrança</span><strong>${vencimento ? new Date(vencimento).toLocaleDateString("pt-BR") : "-"}</strong></div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Último pagamento</h2>
        <div class="metrics">
          <div class="metric"><span>Valor</span><strong>${ultimo ? formatarMoeda(ultimo.amount) : "-"}</strong></div>
          <div class="metric"><span>Data</span><strong>${ultimo?.createdAt ? new Date(ultimo.createdAt).toLocaleDateString("pt-BR") : "-"}</strong></div>
          <div class="metric"><span>Status</span><strong>${escaparHtml(ultimo?.status || "-")}</strong></div>
          <div class="metric"><span>Método</span><strong>${escaparHtml(ultimo?.paymentMethod || "-")}</strong></div>
          <div class="metric"><span>Payment ID</span><strong>${escaparHtml(ultimo?.mercadoPagoPaymentId || "-")}</strong></div>
          <div class="metric"><span>Subscription ID</span><strong>${escaparHtml(assinatura?.mercadoPagoSubscriptionId || "-")}</strong></div>
        </div>
        <div class="actions">
          <button class="btn" type="button" data-action="plan-renew" data-slug="${escaparAttr(plano.slug === "free" ? "premium" : plano.slug)}">Renovar plano</button>
          <button class="btn secondary" type="button" data-action="open-screen" data-screen="assinatura">Alterar plano</button>
          <button class="btn ghost" type="button" data-action="plan-cancel">Cancelar assinatura</button>
          <button class="btn ghost" type="button" data-action="plan-support">Falar com suporte</button>
        </div>
      </div>

      <h2 class="section-title">Histórico de pagamentos</h2>
      <div class="payment-table">${linhas}</div>
    </section>
  `;
}

function renderSobre() {
  return `
    <section class="card about-card">
      <div class="card-header">
        <h2>Sobre</h2>
        <span class="status-badge">v1.0-beta</span>
      </div>
      <div class="about-brand">
        ${renderMarcaProjeto("about-logo", "Logo Simplifica 3D")}
        <div>
          <strong>Simplifica 3D</strong>
          <span class="muted">Sistema SaaS para gestão de impressão 3D</span>
        </div>
      </div>
      <div class="metrics">
        <div class="metric"><span>Versão do sistema</span><strong>${escaparHtml(APP_VERSION)}</strong></div>
        <div class="metric"><span>Aplicativo</span><strong>Simplifica 3D</strong></div>
        <div class="metric"><span>Suporte</span><strong><a href="mailto:simplifica3d.app@gmail.com">simplifica3d.app@gmail.com</a></strong></div>
        <div class="metric"><span>Plataformas</span><strong>PWA + APK</strong></div>
      </div>
      <p class="muted legal-copy">© 2026 Simplifica 3D - Todos os direitos reservados</p>
    </section>
  `;
}

function renderDocumentoLegalPage(tipo = "termos") {
  const documento = getDocumentoLegal(tipo);
  return `
    <section class="card legal-page">
      <div class="card-header">
        <h2>${escaparHtml(documento.titulo)}</h2>
        <span class="status-badge">Legal</span>
      </div>
      <p class="muted">${escaparHtml(documento.subtitulo)}</p>
      <div class="legal-content legal-page-content">
        ${documento.secoes.map((secao) => `
          <section class="legal-section">
            <h3>${escaparHtml(secao.titulo)}</h3>
            <ul>
              ${secao.itens.map((item) => `<li>${escaparHtml(item)}</li>`).join("")}
            </ul>
          </section>
        `).join("")}
        <p class="muted">${escaparHtml(documento.rodape)}</p>
      </div>
    </section>
  `;
}

function renderFeedback() {
  const podeVerDiagnosticos = isSuperAdmin() || (adminLogado && !getUsuarioAtual());
  const feedbackStatus = window.__feedbackManualStatus || {};
  const eventosRecentes = historico.slice(0, 20).map((item) => `
    <div class="history-item">
      <strong>${escaparHtml(item.acao)}</strong>
      <span class="muted">${new Date(item.data || Date.now()).toLocaleString("pt-BR")} • ${escaparHtml(item.detalhes || "")}</span>
    </div>
  `).join("") || `<p class="empty">Nenhuma mensagem recente.</p>`;
  const sugestoesOrdenadas = [...sugestoes].sort((a, b) => (Number(b.votos) || 0) - (Number(a.votos) || 0) || Date.parse(b.atualizadoEm || 0) - Date.parse(a.atualizadoEm || 0));
  const listaSugestoes = sugestoesOrdenadas.slice(0, 20).map((item, indice) => `
    <div class="suggestion-item">
      <div>
        <strong>${indice + 1}. ${escaparHtml(item.titulo)}</strong>
        <span class="muted">${Number(item.votos) || 1} ocorrência(s) • ${escaparHtml(item.category || "geral")} • ${new Date(item.atualizadoEm || item.criadoEm).toLocaleString("pt-BR")}</span>
      </div>
      <button class="icon-button" onclick="votarSugestao('${escaparAttr(item.id)}')" title="Repetir sugestão">+</button>
    </div>
  `).join("") || `<p class="empty">Nenhuma sugestão registrada ainda.</p>`;

  const listaErros = diagnostics.slice(0, 25).map((item) => `
    <div class="history-item">
      <strong>${escaparHtml(item.tipo)} • ${escaparHtml(item.mensagem)}</strong>
      <span class="muted">${new Date(item.data).toLocaleString("pt-BR")} • Tela: ${escaparHtml(item.tela || "-")} • ${escaparHtml(item.versao || "")}</span>
      ${item.detalhes ? `<span class="muted">${escaparHtml(item.detalhes)}</span>` : ""}
    </div>
  `).join("") || `<p class="empty">Nenhum erro local registrado.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>💡 Bugs e sugestões</h2>
      <span class="status-badge">${podeVerDiagnosticos ? (appConfig.telemetryEnabled === false ? "Pausado" : "Local") : "Sugestões"}</span>
      </div>
      <p class="muted">Sugestões ajudam a priorizar as próximas funções do app.</p>
      <div class="actions">
        <button class="btn secondary" onclick="registrarSugestaoNfe()">Quero emissão de NF-e</button>
      </div>

      ${podeVerDiagnosticos ? `<label class="checkbox-row">
        <input id="telemetryEnabledConfig" type="checkbox" ${appConfig.telemetryEnabled !== false ? "checked" : ""}>
        <span>Registrar erros locais do funcionamento</span>
      </label>
      <button class="btn ghost" onclick="salvarFeedbackConfig()">Salvar configuração</button>` : ""}

      <div class="danger-zone">
        <h2 class="section-title">Ajuda e Feedback</h2>
        <div class="sync-grid">
          <label class="field">
            <span>Tipo</span>
            <select id="feedbackTipo">
              <option value="bug">Bug</option>
              <option value="sugestao" selected>Sugestão</option>
              <option value="duvida">Dúvida</option>
              <option value="melhoria">Melhoria</option>
              <option value="reclamacao">Reclamação</option>
            </select>
          </label>
          <label class="field">
            <span>Título</span>
            <input id="feedbackTitulo" maxlength="120" placeholder="Ex.: melhorar relatório mensal">
          </label>
        </div>
        <label class="field">
          <span>Descrição</span>
          <textarea id="feedbackDescricao" rows="4" maxlength="1200" placeholder="Conte o que aconteceu ou o que você gostaria de melhorar"></textarea>
        </label>
        <div class="actions">
          <button class="btn" onclick="enviarSugestaoProduto()" ${feedbackStatus.status === "sending" ? "disabled" : ""}>Sugerir melhoria</button>
          <button class="btn secondary" onclick="enviarFeedbackManual()" ${feedbackStatus.status === "sending" ? "disabled" : ""}>${feedbackStatus.status === "sending" ? "Enviando..." : "Enviar feedback"}</button>
        </div>
        ${feedbackStatus.message ? `<p class="muted feedback-status ${escaparAttr(feedbackStatus.status || "")}">${escaparHtml(feedbackStatus.message)}</p>` : ""}
      </div>

      <h2 class="section-title">Sugestões mais pedidas</h2>
      <div class="history-list">
        ${listaSugestoes}
      </div>

      <h2 class="section-title">Mensagens recentes</h2>
      <div class="history-list">
        ${eventosRecentes}
      </div>

      ${podeVerDiagnosticos ? `<div class="danger-zone">
        <h2 class="section-title">Erros recentes</h2>
        <div class="actions">
          <button class="btn ghost" onclick="registrarDiagnosticoManual()">Registrar teste</button>
          <button class="btn danger" onclick="limparDiagnosticos()">Limpar erros</button>
        </div>
        <div class="history-list">
          ${listaErros}
        </div>
      </div>` : ""}
    </section>
  `;
}

function salvarFeedbackConfig() {
  appConfig.telemetryEnabled = !!document.getElementById("telemetryEnabledConfig")?.checked;
  salvarDados();
  registrarHistorico("Diagnóstico", appConfig.telemetryEnabled ? "Registro local ativado" : "Registro local pausado");
  renderApp();
}

function adicionarSugestao() {
  const texto = document.getElementById("novaSugestaoTexto")?.value || "";
  if (!registrarSugestaoLocal(texto, "manual")) {
    alert("Digite uma sugestão com pelo menos 4 caracteres.");
    return;
  }
  registrarHistorico("Sugestão", texto.trim());
  renderApp();
}

function lerFormularioFeedbackManual() {
  return {
    type: document.getElementById("feedbackTipo")?.value || "sugestao",
    title: String(document.getElementById("feedbackTitulo")?.value || "").trim(),
    description: String(document.getElementById("feedbackDescricao")?.value || "").trim()
  };
}

function montarPayloadFeedbackManual(form) {
  const usuario = getUsuarioAtual();
  const email = normalizarEmail(syncConfig.supabaseEmail || usuario?.email || billingConfig.licenseEmail || "");
  return {
    user_id: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    user_email: email || null,
    user_name: usuario?.nome || null,
    type: form.type,
    title: form.title.slice(0, 120),
    description: form.description.slice(0, 1200),
    app_version: APP_VERSION,
    device_model: syncConfig.deviceName || deviceId || navigator.platform || "",
    os_version: navigator.userAgent || "",
    platform: window.Capacitor?.getPlatform?.() || (navigator.userAgentData?.mobile ? "mobile-web" : "web"),
    screen_name: telaAtual || "",
    metadata: {
      device_id: deviceId,
      company_id: billingConfig.companyId || "",
      client_id: billingConfig.clientId || ""
    }
  };
}

async function salvarFeedbackManualSupabase(form) {
  return requisicaoSupabase("/rest/v1/app_feedback_reports", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(montarPayloadFeedbackManual(form))
  });
}

function normalizarTipoSugestaoApp(tipo = "suggestion") {
  const valor = String(tipo || "").toLowerCase();
  if (valor === "bug") return "bug";
  if (["feature", "melhoria", "recurso"].includes(valor)) return "feature";
  return "suggestion";
}

function inferirCategoriaSugestao(form = {}) {
  const texto = normalizarTextoSugestao(`${form.category || ""} ${form.title || form.titulo || ""} ${form.description || ""}`);
  if (/\bnf\s*e\b|\bnfe\b|nota fiscal|emissao fiscal/.test(texto)) return "nfe";
  if (/pedido|orcamento|orcamento/.test(texto)) return "pedidos";
  if (/financeiro|caixa|pagamento|relatorio/.test(texto)) return "financeiro";
  return String(form.category || "geral").toLowerCase().replace(/[^a-z0-9_]/g, "_") || "geral";
}

function montarPayloadSugestaoApp(form = {}) {
  const usuario = getUsuarioAtual();
  const clientId = getClientIdAtual() || billingConfig.clientId || "";
  return {
    user_id: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    client_id: pareceUuid(clientId) ? clientId : null,
    type: normalizarTipoSugestaoApp(form.type),
    category: inferirCategoriaSugestao(form),
    title: String(form.title || form.titulo || "Sugestão").trim().slice(0, 140),
    description: String(form.description || "").trim().slice(0, 1600),
    status: "new",
    metadata: {
      user_email: normalizarEmail(syncConfig.supabaseEmail || usuario?.email || billingConfig.licenseEmail || ""),
      user_name: usuario?.nome || "",
      app_version: APP_VERSION,
      screen_name: telaAtual || "",
      device_id: deviceId || ""
    }
  };
}

async function salvarSugestaoSupabase(payload) {
  return requisicaoSupabase("/rest/v1/app_suggestions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
}

async function registrarSugestaoProduto(form = {}) {
  const payload = montarPayloadSugestaoApp(form);
  if (!payload.title || payload.title.length < 4) {
    throw new Error("Informe uma sugestão com pelo menos 4 caracteres.");
  }
  registrarSugestaoLocal(payload.title, "produto", {
    type: payload.type,
    category: payload.category,
    description: payload.description,
    status: payload.status,
    userId: payload.user_id || "",
    clientId: payload.client_id || getClientIdAtual() || ""
  });
  try {
    await salvarSugestaoSupabase(payload);
  } catch (erro) {
    registrarErroAplicacaoSilencioso("SAVE_APP_SUGGESTION_FAILED", erro, "Salvar sugestão", { category: payload.category, type: payload.type });
  }
  salvarDados();
  registrarHistorico("Sugestão", `${payload.category}: ${payload.title}`);
  return payload;
}

async function enviarSugestaoProduto() {
  const form = lerFormularioFeedbackManual();
  if (!form.title || form.title.length < 4) {
    window.__feedbackManualStatus = { status: "error", message: "Informe um título com pelo menos 4 caracteres." };
    renderApp();
    return;
  }
  window.__feedbackManualStatus = { status: "sending", message: "Registrando sugestão..." };
  renderApp();
  try {
    await registrarSugestaoProduto({
      ...form,
      type: normalizarTipoSugestaoApp(form.type === "bug" ? "bug" : "feature")
    });
    window.__feedbackManualStatus = { status: "success", message: "Obrigado! Sua sugestão foi registrada." };
    mostrarToast("Obrigado! Sua sugestão foi registrada.", "sucesso", 4200);
  } catch (erro) {
    window.__feedbackManualStatus = { status: "error", message: erro.message || "Não foi possível registrar a sugestão." };
    mostrarToast(window.__feedbackManualStatus.message, "erro", 5000);
  }
  renderApp();
}

async function registrarSugestaoNfe() {
  try {
    await registrarSugestaoProduto({
      type: "feature",
      category: "nfe",
      title: "Quero emissão de NF-e",
      description: "Pedido rápido do usuário para emissão de NF-e dentro do Simplifica 3D."
    });
    mostrarToast("Obrigado! Sua sugestão foi registrada.", "sucesso", 4200);
  } catch (erro) {
    mostrarToast(erro.message || "Não foi possível registrar a sugestão.", "erro", 5000);
  }
  renderApp();
}

async function enviarFeedbackManual() {
  const form = lerFormularioFeedbackManual();
  if (!form.title || form.title.length < 4) {
    window.__feedbackManualStatus = { status: "error", message: "Informe um título com pelo menos 4 caracteres." };
    renderApp();
    return;
  }
  if (!form.description || form.description.length < 8) {
    window.__feedbackManualStatus = { status: "error", message: "Descreva o feedback com um pouco mais de detalhe." };
    renderApp();
    return;
  }

  window.__feedbackManualStatus = { status: "sending", message: "Enviando feedback..." };
  renderApp();

  try {
    await salvarFeedbackManualSupabase(form);
    registrarSugestaoLocal(`${form.title}: ${form.description}`, "feedback");
    registrarHistorico("Feedback", `${form.type}: ${form.title}`);
    window.__feedbackManualStatus = { status: "success", message: "Feedback enviado com sucesso." };
    mostrarToast("Feedback enviado com sucesso.", "sucesso", 4000);
  } catch (erro) {
    registrarSugestaoLocal(`${form.title}: ${form.description}`, "feedback-local");
    registrarErroAplicacaoSilencioso("FEEDBACK_SUBMIT_FAILED", erro, "Enviar feedback manual", { type: form.type });
    window.__feedbackManualStatus = { status: "error", message: "Não foi possível enviar agora. O feedback ficou salvo neste aparelho." };
    mostrarToast("Erro ao enviar feedback. Ficou salvo localmente.", "erro", 5000);
  }
  renderApp();
}

function votarSugestao(id) {
  const item = sugestoes.find((sugestao) => String(sugestao.id) === String(id));
  if (!item) return;
  registrarSugestaoLocal(item.titulo, "repetida", {
    type: item.type || "suggestion",
    category: item.category || "geral",
    description: item.description || ""
  });
  renderApp();
}

function limparDiagnosticos() {
  if (!confirm("Limpar os registros locais de erros?")) return;
  diagnostics = [];
  salvarDados();
  renderApp();
}

function registrarDiagnosticoManual() {
  registrarDiagnostico("teste", "Registro manual criado", "Usado para confirmar se o painel está salvando os dados.");
  renderApp();
}

function escolherPlanoSaas(slug = "free") {
  const plano = getPlanoSaas(slug);
  if (!["free", "premium"].includes(plano.slug)) {
    alert("Plano indisponível.");
    return;
  }
  if (plano.slug === "free") {
    mostrarToast("Você continua no plano gratuito.", "info");
    trocarTela("dashboard");
    return;
  }
  const clientId = getClientIdAtual() || billingConfig.clientId || criarIdLocal("client");
  if (!billingConfig.clientId) billingConfig.clientId = clientId;
  let assinatura = getAssinaturaSaas(clientId);
  if (!assinatura) {
    assinatura = normalizarAssinaturaSaas({ clientId, planSlug: "free", activePlan: "free", status: "active" });
    saasSubscriptions.push(assinatura);
  }
  if (plano.slug === "free") {
    assinatura.pendingPlan = "";
    assinatura.paymentStatus = "none";
    billingConfig.pendingPlan = "";
    billingConfig.paymentStatus = "none";
  } else {
    const agoraPendente = new Date().toISOString();
    assinatura.pendingPlan = plano.slug;
    assinatura.paymentStatus = "pending";
    assinatura.pendingStartedAt = agoraPendente;
    billingConfig.pendingPlan = plano.slug;
    billingConfig.paymentStatus = "pending";
    billingConfig.pendingStartedAt = agoraPendente;
  }
  billingConfig.planSlug = assinatura.activePlan || assinatura.planSlug || "free";
  billingConfig.activePlan = assinatura.activePlan || assinatura.planSlug || "free";
  billingConfig.monthlyPrice = plano.slug === "premium" ? getPrecoPagoVigenteLocal() : plano.price;
  billingConfig.subscriptionId = assinatura.id;
  salvarDados();
  registrarAuditoria(plano.price > 0 ? "upgrade" : "alteração plano", { plano: plano.slug }, clientId);
  if (plano.slug === "free") {
    ativarPlanoClienteLocal(clientId, "free", "active", 0, { origem: "escolha_free" });
    renderApp();
    return;
  }
  abrirLinkMercadoPago(plano.slug);
  renderApp();
}

function iniciarTesteGratis(slug = "premium_trial") {
  const plano = getPlanoSaas(slug);
  const usuario = getUsuarioAtual();
  const email = normalizarEmail(usuario?.email || syncConfig.supabaseEmail || billingConfig.licenseEmail || usuarioAtualEmail || "");
  if (!email) {
    alert("Entre ou crie uma conta antes de iniciar o teste grátis.");
    trocarTela("admin");
    return;
  }

  if (billingConfig.trialConsumedAt || getAssinaturaSaas(getClientIdAtual() || billingConfig.clientId)?.trialConsumedAt) {
    mostrarToast("O teste grátis já foi usado nesta conta.", "info", 6500);
    trocarTela("assinatura");
    return;
  }

  if (!billingConfig.trialStartedAt) {
    billingConfig.licenseEmail = email;
    billingConfig.planSlug = plano.slug;
    billingConfig.activePlan = plano.slug;
    billingConfig.pendingPlan = "";
    billingConfig.paymentStatus = "none";
    billingConfig.subscriptionStatus = "trialing";
    billingConfig.monthlyPrice = plano.price;
    billingConfig.trialStartedAt = new Date().toISOString();
    billingConfig.trialExpiresAt = calcularFimTrial(billingConfig.trialStartedAt, billingConfig.trialDays);
    billingConfig.trialConsumedAt = billingConfig.trialStartedAt;
    billingConfig.isTrialActive = true;
    billingConfig.licenseStatus = "trial";
    const clientId = getClientIdAtual() || billingConfig.clientId || criarIdLocal("client");
    billingConfig.clientId = clientId;
    let assinatura = getAssinaturaSaas(clientId);
    if (!assinatura) {
      assinatura = normalizarAssinaturaSaas({ clientId, planSlug: plano.slug, status: "trialing" });
      saasSubscriptions.push(assinatura);
    }
    assinatura.planSlug = plano.slug;
    assinatura.planId = plano.slug;
    assinatura.activePlan = plano.slug;
    assinatura.pendingPlan = "";
    assinatura.paymentStatus = "none";
    assinatura.subscriptionStatus = "trialing";
    assinatura.status = "trialing";
    assinatura.statusAssinatura = "trialing";
    assinatura.promoUsed = false;
    assinatura.billingVariant = "premium_first_month";
    assinatura.startedAt = billingConfig.trialStartedAt;
    assinatura.currentPeriodStart = billingConfig.trialStartedAt;
    assinatura.currentPeriodEnd = billingConfig.trialExpiresAt;
    assinatura.expiresAt = assinatura.currentPeriodEnd;
    assinatura.nextBillingAt = assinatura.currentPeriodEnd;
    assinatura.planExpiresAt = assinatura.currentPeriodEnd;
    assinatura.trialStartedAt = billingConfig.trialStartedAt;
    assinatura.trialExpiresAt = billingConfig.trialExpiresAt;
    assinatura.trialConsumedAt = billingConfig.trialConsumedAt;
    assinatura.isTrialActive = true;
    billingConfig.subscriptionId = assinatura.id;
    billingConfig.paidUntil = assinatura.expiresAt;
    billingConfig.planExpiresAt = assinatura.expiresAt;
    if (!registrarDispositivoLicenca(email)) return;
    salvarDados();
    registrarHistorico("Assinatura", "Teste grátis iniciado");
    registrarAuditoria("trial iniciado", { plano: plano.slug }, clientId);
  }

  renderApp();
}

function getClienteCodigoAtual() {
  const cliente = getClienteSaasAtual();
  return cliente?.clientCode || billingConfig.clientId || getClientIdAtual() || "";
}

function garantirAssinaturaClienteLocal(clientId = getClientIdAtual()) {
  const idCliente = clientId || billingConfig.clientId || criarIdLocal("client");
  let assinatura = getAssinaturaSaas(idCliente);
  if (!assinatura) {
    assinatura = normalizarAssinaturaSaas({ clientId: idCliente, planSlug: "free", status: "active" });
    saasSubscriptions.push(assinatura);
  }
  if (!billingConfig.clientId) billingConfig.clientId = idCliente;
  billingConfig.subscriptionId = assinatura.id;
  return assinatura;
}

function ativarPlanoClienteLocal(clientId, slug, status = "active", dias = 30, detalhes = {}) {
  const plano = getPlanoSaas(slug);
  const agora = new Date().toISOString();
  const assinatura = garantirAssinaturaClienteLocal(clientId);
  const expiresAt = dias > 0 ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : "";
  const planPrice = plano.slug === "premium"
    ? Math.max(0, Number(detalhes.planPrice ?? detalhes.plan_price ?? assinatura.planPrice ?? getPrecoPagoVigenteLocal()) || getPrecoPagoVigenteLocal())
    : 0;
  assinatura.planSlug = plano.slug;
  assinatura.planId = plano.slug;
  assinatura.activePlan = plano.slug;
  assinatura.pendingPlan = "";
  assinatura.pendingStartedAt = "";
  assinatura.paymentStatus = status === "pending" ? "pending" : "none";
  assinatura.subscriptionStatus = plano.slug === "premium_trial" ? "trialing" : plano.slug === "premium" ? "active" : "free";
  assinatura.status = normalizarStatusPlano(status);
  assinatura.statusAssinatura = assinatura.status;
  assinatura.promoUsed = detalhes.promoUsed === true || assinatura.promoUsed === true;
  assinatura.billingVariant = normalizarBillingVariant(detalhes.billingVariant || getBillingVariantAssinatura(assinatura));
  assinatura.planPrice = planPrice;
  assinatura.priceLocked = plano.slug === "premium";
  assinatura.currentPeriodStart = agora;
  assinatura.currentPeriodEnd = expiresAt;
  assinatura.startedAt = assinatura.startedAt || agora;
  assinatura.expiresAt = expiresAt;
  assinatura.nextBillingAt = expiresAt;
  assinatura.planExpiresAt = expiresAt;
  assinatura.trialStartedAt = plano.slug === "premium_trial" ? agora : "";
  assinatura.trialExpiresAt = plano.slug === "premium_trial" ? expiresAt : "";
  assinatura.trialConsumedAt = plano.slug === "premium_trial" ? (assinatura.trialConsumedAt || agora) : assinatura.trialConsumedAt || "";
  assinatura.isTrialActive = plano.slug === "premium_trial" && !!expiresAt;
  assinatura.overdueSince = "";

  const cliente = getClienteSaasPorId(clientId);
  if (cliente) {
    cliente.planoAtual = plano.slug;
    cliente.activePlan = plano.slug;
    cliente.pendingPlan = "";
    cliente.pendingStartedAt = "";
    cliente.paymentStatus = assinatura.paymentStatus;
    cliente.subscriptionStatus = assinatura.subscriptionStatus;
    cliente.statusAssinatura = assinatura.statusAssinatura;
    cliente.status = status === "blocked" ? "blocked" : "active";
    cliente.planPrice = planPrice;
    cliente.priceLocked = plano.slug === "premium";
    cliente.planExpiresAt = expiresAt;
    cliente.trialStartedAt = assinatura.trialStartedAt;
    cliente.trialExpiresAt = assinatura.trialExpiresAt;
    cliente.trialConsumedAt = assinatura.trialConsumedAt || cliente.trialConsumedAt || "";
    cliente.isTrialActive = assinatura.isTrialActive;
    cliente.updatedAt = agora;
  }

  getUsuariosDoCliente(clientId).forEach((usuario) => {
    usuario.planStatus = status;
    usuario.planExpiresAt = expiresAt;
    if (status !== "blocked") {
      usuario.bloqueado = false;
      usuario.ativo = true;
    }
  });

  if (String(clientId || "") === String(getClientIdAtual() || billingConfig.clientId || "")) {
    billingConfig.clientId = clientId;
    billingConfig.planSlug = plano.slug;
    billingConfig.activePlan = plano.slug;
    billingConfig.pendingPlan = "";
    billingConfig.pendingStartedAt = "";
    billingConfig.paymentStatus = assinatura.paymentStatus;
    billingConfig.subscriptionStatus = assinatura.subscriptionStatus;
    billingConfig.licenseStatus = status;
    billingConfig.licenseBlockLevel = "none";
    billingConfig.paidUntil = expiresAt;
    billingConfig.planExpiresAt = expiresAt;
    billingConfig.monthlyPrice = plano.slug === "premium" ? planPrice : plano.price;
    billingConfig.planPrice = planPrice;
    billingConfig.priceLocked = plano.slug === "premium";
    billingConfig.trialStartedAt = assinatura.trialStartedAt;
    billingConfig.trialExpiresAt = assinatura.trialExpiresAt;
    billingConfig.trialConsumedAt = assinatura.trialConsumedAt || billingConfig.trialConsumedAt || "";
    billingConfig.isTrialActive = assinatura.isTrialActive;
    billingConfig.subscriptionId = assinatura.id;
  }

  salvarDados();
  registrarAuditoria("alteração plano", { plano: plano.slug, status, expiresAt, ...detalhes }, clientId);
  return assinatura;
}

async function chamarFuncaoSaas(nome, corpo = {}) {
  if (!syncConfig.supabaseAccessToken) {
    throw new Error("Entre na conta online antes de iniciar o pagamento.");
  }
  syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
  syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
  return await requisicaoSupabase(`/functions/v1/${nome}`, {
    method: "POST",
    body: JSON.stringify(corpo)
  });
}

function registrarPagamentoLocalPendente(plano, dados = {}, tipo = "subscription") {
  const clientId = getClientIdAtual() || billingConfig.clientId;
  const assinatura = garantirAssinaturaClienteLocal(clientId);
  const billingVariant = normalizarBillingVariant(dados.billing_variant || dados.billingVariant || getBillingVariantAssinatura(assinatura));
  const precoPadrao = getPrecoBillingVariant(billingVariant);
  const planPrice = Math.max(0, Number(dados.plan_price ?? dados.planPrice ?? dados.amount ?? dados.valor ?? precoPadrao) || precoPadrao);
  const pagamento = normalizarPagamentoSaas({
    clientId,
    subscriptionId: assinatura.id,
    mercadoPagoSubscriptionId: dados.subscriptionId || assinatura.mercadoPagoSubscriptionId || "",
    preferenceId: dados.preference_id || dados.preferenceId || "",
    externalReference: dados.external_reference || "",
    planSlug: plano.slug,
    billingVariant,
    amount: Number(dados.amount || dados.valor || planPrice),
    status: "pending",
    paymentMethod: "mercado_pago",
    createdAt: new Date().toISOString()
  });
  pagamento.planPrice = planPrice;
  saasPayments.unshift(pagamento);
  saasPayments = saasPayments.slice(0, 500);
  if (dados.subscriptionId) assinatura.mercadoPagoSubscriptionId = String(dados.subscriptionId);
  assinatura.pendingPlan = plano.slug;
  assinatura.paymentStatus = "pending";
  assinatura.pendingStartedAt = pagamento.createdAt;
  assinatura.planPrice = assinatura.planPrice || planPrice;
  billingConfig.pendingPlan = plano.slug;
  billingConfig.paymentStatus = "pending";
  billingConfig.pendingStartedAt = pagamento.createdAt;
  billingConfig.monthlyPrice = planPrice;
  salvarDados();
  registrarAuditoria("pagamento criado", { tipo, plano: plano.slug, preferenceId: pagamento.preferenceId, subscriptionId: pagamento.mercadoPagoSubscriptionId }, clientId);
}

async function abrirLinkMercadoPago(slug = billingConfig.planSlug || "premium") {
  const plano = getPlanoSaas(slug);
  if (plano.slug !== "premium") {
    trocarTela("assinatura");
    return;
  }

  const clientId = getClientIdAtual() || billingConfig.clientId;
  if (!clientId) {
    alert("Crie ou entre na conta antes de escolher um plano.");
    trocarTela("admin");
    return;
  }

  registrarAuditoria("tentativa", { tipo: "assinatura", plano: plano.slug }, clientId);
  try {
    const assinatura = garantirAssinaturaClienteLocal(clientId);
    const billingVariant = getBillingVariantAssinatura(assinatura);
    const planPrice = getPrecoBillingVariant(billingVariant);
    const dados = await chamarFuncaoSaas("mercadopago-create-payment", {
      clienteId: clientId,
      plan_id: plano.slug,
      billing_variant: billingVariant,
      plan_price: planPrice,
      amount: planPrice,
      plan: plano.slug,
      planSlug: plano.slug,
      email: getEmailLicencaAtual()
    });
    if (!dados?.init_point) throw new Error("Link de pagamento não retornado.");
    registrarPagamentoLocalPendente(plano, dados, "payment");
    window.open(dados.init_point, "_blank");
  } catch (erro) {
    registrarDiagnostico("Mercado Pago", "Pagamento não criado", erro.message);
    registrarErroAplicacaoSilencioso("PAYMENT_STATUS_FAILED", erro, "Criar pagamento Mercado Pago", { plano: plano.slug });
    if (billingConfig.mercadoPagoLink) {
      window.open(billingConfig.mercadoPagoLink, "_blank");
      return;
    }
    alert(erro.message || "Não foi possível iniciar o pagamento agora.");
  }
}

async function criarPagamentoUnicoMercadoPago(slug = billingConfig.planSlug || "premium") {
  const plano = getPlanoSaas(slug);
  if (plano.slug !== "premium") {
    alert("Pagamento disponível para o plano Premium.");
    return;
  }

  const clientId = getClientIdAtual() || billingConfig.clientId;
  if (!clientId) {
    alert("Crie ou entre na conta antes de pagar.");
    trocarTela("admin");
    return;
  }

  try {
    const assinatura = garantirAssinaturaClienteLocal(clientId);
    const billingVariant = getBillingVariantAssinatura(assinatura);
    const planPrice = getPrecoBillingVariant(billingVariant);
    const dados = await chamarFuncaoSaas("mercadopago-create-payment", {
      clienteId: clientId,
      plan_id: plano.slug,
      billing_variant: billingVariant,
      plan_price: planPrice,
      amount: planPrice,
      plan: plano.slug,
      planSlug: plano.slug,
      email: getEmailLicencaAtual()
    });
    if (!dados?.init_point) throw new Error("Link de pagamento não retornado.");
    registrarPagamentoLocalPendente(plano, dados, "payment");
    window.open(dados.init_point, "_blank");
  } catch (erro) {
    registrarDiagnostico("Mercado Pago", "Pagamento não criado", erro.message);
    registrarErroAplicacaoSilencioso("PAYMENT_STATUS_FAILED", erro, "Criar pagamento avulso Mercado Pago", { plano: plano.slug });
    alert(erro.message || "Não foi possível iniciar o pagamento agora.");
  }
}

async function cancelarAssinaturaCliente() {
  const clientId = getClientIdAtual() || billingConfig.clientId;
  const assinatura = garantirAssinaturaClienteLocal(clientId);
  if (getPlanoSaas(assinatura.planSlug).slug === "free") {
    alert("Sua conta já está no plano Free.");
    return;
  }
  if (!confirm("Cancelar a assinatura e voltar para o Free? Seus dados serão mantidos.")) return;

  try {
    if (syncConfig.supabaseAccessToken && assinatura.mercadoPagoSubscriptionId) {
      await chamarFuncaoSaas("mercadopago-cancel-subscription", {
        clienteId: clientId,
        subscriptionId: assinatura.mercadoPagoSubscriptionId
      });
    }
  } catch (erro) {
    registrarDiagnostico("Mercado Pago", "Cancelamento online não confirmado", erro.message);
    alert("Não foi possível confirmar o cancelamento automático. Vamos manter a solicitação local e o suporte pode conferir a cobrança.");
  }

  ativarPlanoClienteLocal(clientId, "free", "active", 0, { origem: "cancelamento_cliente", paymentStatus: "cancelled" });
  alert("Assinatura cancelada. A conta voltou para o Free com anúncios e seus dados foram mantidos.");
  renderApp();
}

function falarComSuporteAssinatura() {
  const texto = `Olá, preciso de suporte na assinatura do ${SYSTEM_NAME}. Cliente: ${getClienteCodigoAtual() || getEmailLicencaAtual() || "não identificado"}`;
  if (billingConfig.supportUrl) {
    window.open(billingConfig.supportUrl, "_blank");
    return;
  }
  const whats = normalizarTelefoneWhatsapp(appConfig.whatsappNumber || "");
  if (whats) {
    window.open(`https://wa.me/${whats}?text=${encodeURIComponent(texto)}`, "_blank");
    return;
  }
  window.open(`mailto:${SUPPORT_EMAIL}?subject=Suporte Simplifica 3D&body=${encodeURIComponent(texto)}`, "_blank");
}

function abrirDownload(tipo) {
  const url = tipo === "android" ? (billingConfig.androidDownloadUrl || ANDROID_RELEASES_URL) : (billingConfig.windowsWebUrl || billingConfig.windowsDownloadUrl || location.origin);
  if (!url) {
    alert("Link de download não configurado.");
    return;
  }
  window.open(url, "_blank");
}

function selecionarCor(cor) {
  if (!temAcessoCompleto()) {
    mostrarToast("Recurso PRO", "warning", 3500);
    return;
  }
  const input = document.getElementById("accentColorConfig");
  if (input) {
    input.value = cor;
  }
}

function lerPersonalizacaoCampos() {
  const acessoMarca = temAcessoCompleto();
  const accentColor = acessoMarca
    ? (document.getElementById("accentColorConfig")?.value || appConfig.accentColor || "#073b4b")
    : (appConfig.accentColor || "#073b4b");
  const theme = acessoMarca
    ? (document.getElementById("themeConfig")?.value || appConfig.theme || "dark")
    : (appConfig.theme || "dark");
  const pdfStyle = acessoMarca
    ? (document.getElementById("pdfStyleConfig")?.value || appConfig.pdfStyle || "clean")
    : (appConfig.pdfStyle || "clean");
  const pdfHeaderText = acessoMarca
    ? (document.getElementById("pdfHeaderTextConfig")?.value || "").trim()
    : (appConfig.pdfHeaderText || "");
  const brandWatermarkEnabled = acessoMarca
    ? (document.getElementById("brandWatermarkEnabledConfig") ? !!document.getElementById("brandWatermarkEnabledConfig")?.checked : appConfig.brandWatermarkEnabled !== false)
    : appConfig.brandWatermarkEnabled !== false;
  const customLoginMessage = acessoMarca
    ? (document.getElementById("customLoginMessageConfig")?.value || "").trim()
    : (appConfig.customLoginMessage || "");
  return {
    appName: (document.getElementById("appNameConfig")?.value || SYSTEM_NAME).trim(),
    businessName: (document.getElementById("businessNameConfig")?.value || "Minha empresa 3D").trim(),
    whatsappNumber: normalizePhoneBR(document.getElementById("whatsappNumberConfig")?.value || ""),
    documentFooter: (document.getElementById("documentFooterConfig")?.value || "").trim(),
    pixKey: (document.getElementById("pixKeyConfig")?.value || "").trim(),
    pixReceiverName: (document.getElementById("pixReceiverNameConfig")?.value || "").trim(),
    pixCity: (document.getElementById("pixCityConfig")?.value || "").trim(),
    pixDescription: (document.getElementById("pixDescriptionConfig")?.value || "Pedido Simplifica 3D").trim(),
    brandWatermarkEnabled,
    theme,
    accentColor,
    pdfStyle,
    pdfHeaderText,
    customLoginMessage,
    motionLevel: document.getElementById("motionLevelConfig")?.value || appConfig.motionLevel || "medium",
    appearanceSettings: normalizarAppearanceSettings({
      ...(appConfig.appearanceSettings || {}),
      primary_color: accentColor,
      pdf_background: appConfig.pdfBackgroundDataUrl || "",
      logo_url: appConfig.brandLogoDataUrl || "",
      profile_photo: appConfig.profilePhotoDataUrl || "",
      company_logo: appConfig.companyLogoDataUrl || "",
      login_background: appConfig.loginBackgroundDataUrl || "",
      theme_mode: theme,
      custom_pdf_enabled: acessoMarca
    }),
    compactMode: !!document.getElementById("compactModeConfig")?.checked,
    showBrandInHeader: !!document.getElementById("showBrandInHeaderConfig")?.checked,
    defaultMargin: Math.max(0, parseFloat(document.getElementById("defaultMarginConfig")?.value) || 100),
    defaultEnergy: Math.max(0, parseFloat(document.getElementById("defaultEnergyConfig")?.value) || 0.85),
    defaultFilamentCost: Math.max(0, parseFloat(document.getElementById("defaultFilamentCostConfig")?.value) || 150),
    defaultExtraFee: Math.max(0, parseFloat(document.getElementById("defaultExtraFeeConfig")?.value) || 0),
    screenFit: document.getElementById("screenFitConfig")?.value === "manual" ? "manual" : "auto",
    uiScale: Math.min(140, Math.max(70, parseFloat(document.getElementById("uiScaleConfig")?.value) || 100)),
    desktopCardMinWidth: Math.min(560, Math.max(220, parseFloat(document.getElementById("desktopCardMinWidthConfig")?.value) || 320)),
    desktopMaxWidth: Math.min(3200, Math.max(900, parseFloat(document.getElementById("desktopMaxWidthConfig")?.value) || 1480))
  };
}

const IMAGE_PERSONALIZATION_PRESETS = Object.freeze({
  "profile-photo": { label: "a foto do usuário", mode: "cover", width: 512, height: 512, quality: 0.84, preserveAlpha: false, circularPreview: true },
  "company-logo": { label: "a logo da empresa", mode: "contain", width: 800, height: 400, quality: 0.85, preserveAlpha: true },
  "brand-logo": { label: "a logo da marca", mode: "contain", width: 800, height: 400, quality: 0.85, preserveAlpha: true },
  "login-background": { label: "o fundo do login", mode: "cover", width: 1280, height: 720, quality: 0.8, preserveAlpha: false },
  "pdf-background": { label: "a marca d'água do PDF", mode: "contain", width: 1000, height: 1000, quality: 0.85, preserveAlpha: true }
});

function canvasSuportaMime(mime = "image/webp") {
  try {
    const canvas = document.createElement("canvas");
    return canvas.toDataURL(mime).startsWith(`data:${mime}`);
  } catch (_) {
    return false;
  }
}

function tamanhoDataUrlBytes(dataUrl = "") {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.round(base64.length * 0.75);
}

function gerarDataUrlOtimizado(canvas, mime, qualidade = 0.82, maxBytes = 500 * 1024) {
  let atualCanvas = canvas;
  let atual = "";
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const q = Math.max(0.55, qualidade - tentativa * 0.05);
    atual = atualCanvas.toDataURL(mime, q);
    if (mime === "image/png" || tamanhoDataUrlBytes(atual) <= maxBytes) break;
    if (tentativa >= 4) {
      const menor = document.createElement("canvas");
      menor.width = Math.max(1, Math.round(atualCanvas.width * 0.86));
      menor.height = Math.max(1, Math.round(atualCanvas.height * 0.86));
      menor.getContext("2d")?.drawImage(atualCanvas, 0, 0, menor.width, menor.height);
      atualCanvas = menor;
    }
  }
  return atual;
}

function carregarImagemArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagem inválida"));
    };
    imagem.src = url;
  });
}

async function otimizarImagemPersonalizacao(arquivo, tipo = "brand-logo") {
  const preset = IMAGE_PERSONALIZATION_PRESETS[tipo] || IMAGE_PERSONALIZATION_PRESETS["brand-logo"];
  if (!arquivo || !String(arquivo.type || "").startsWith("image/")) {
    throw new Error("Escolha uma imagem válida.");
  }
  const imagem = await carregarImagemArquivo(arquivo);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem neste aparelho.");

  if (preset.mode === "contain") {
    const escala = Math.min(preset.width / imagem.naturalWidth, preset.height / imagem.naturalHeight, 1);
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  } else {
    canvas.width = preset.width;
    canvas.height = preset.height;
    const escala = Math.max(canvas.width / imagem.naturalWidth, canvas.height / imagem.naturalHeight);
    const sw = canvas.width / escala;
    const sh = canvas.height / escala;
    const sx = Math.max(0, (imagem.naturalWidth - sw) / 2);
    const sy = Math.max(0, (imagem.naturalHeight - sh) / 2);
    ctx.drawImage(imagem, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  const originalPng = String(arquivo.type || "").toLowerCase().includes("png");
  const webpOk = canvasSuportaMime("image/webp");
  const mime = webpOk ? "image/webp" : (preset.preserveAlpha && originalPng ? "image/png" : "image/jpeg");
  const dataUrl = gerarDataUrlOtimizado(canvas, mime, preset.quality);
  return {
    dataUrl,
    mime,
    width: canvas.width,
    height: canvas.height,
    sizeKb: Math.max(1, Math.round(tamanhoDataUrlBytes(dataUrl) / 1024)),
    label: preset.label
  };
}

async function prepararPreviewImagemPersonalizacao(input, tipo = "brand-logo") {
  const arquivo = input?.files?.[0];
  if (!arquivo) return;
  if (!temAcessoCompleto()) {
    mostrarToast("Recurso PRO", "warning", 4200);
    input.value = "";
    return;
  }
  try {
    input.dataset.optimizing = "1";
    const otimizada = await otimizarImagemPersonalizacao(arquivo, tipo);
    window.__personalizationImageCache = window.__personalizationImageCache || {};
    window.__personalizationImageCache[input.id] = { fileName: arquivo.name, lastModified: arquivo.lastModified, tipo, ...otimizada };
    const dica = document.getElementById("personalizationImageHint");
    if (dica) {
      dica.hidden = false;
      dica.textContent = `Imagem ajustada automaticamente para o melhor tamanho (${otimizada.width}x${otimizada.height}, ${otimizada.sizeKb} KB).`;
    }
    if (tipo === "profile-photo") {
      const preview = document.getElementById("profilePhotoPreview");
      if (preview) preview.innerHTML = `<img src="${escaparAttr(otimizada.dataUrl)}" alt="Foto do usuário">`;
    }
    if (tipo === "company-logo") {
      const preview = document.getElementById("companyLogoPreview");
      if (preview) preview.src = otimizada.dataUrl;
    }
    if (tipo === "brand-logo") {
      const preview = document.getElementById("brandLogoPreview");
      if (preview) preview.src = otimizada.dataUrl;
    }
    mostrarToast("Imagem ajustada automaticamente para o melhor tamanho.", "sucesso", 2600);
  } catch (erro) {
    console.warn("[Personalização] Falha ao otimizar imagem", erro);
    mostrarToast("Não foi possível usar esta imagem. Escolha outra foto ou arquivo.", "erro", 5200);
    input.value = "";
  } finally {
    delete input.dataset.optimizing;
  }
}

async function lerImagemConfiguracao(idInput, valorAtual = "", tipo = "brand-logo") {
  const input = document.getElementById(idInput);
  const arquivo = input?.files?.[0];
  if (!arquivo) return valorAtual || "";
  if (!temAcessoCompleto()) {
    mostrarToast("Recurso PRO", "warning", 4200);
    return valorAtual || "";
  }
  const cache = window.__personalizationImageCache?.[idInput];
  if (cache && cache.fileName === arquivo.name && Number(cache.lastModified || 0) === Number(arquivo.lastModified || 0)) {
    return cache.dataUrl || valorAtual || "";
  }
  try {
    const otimizada = await otimizarImagemPersonalizacao(arquivo, tipo);
    window.__personalizationImageCache = window.__personalizationImageCache || {};
    window.__personalizationImageCache[idInput] = { fileName: arquivo.name, lastModified: arquivo.lastModified, tipo, ...otimizada };
    return otimizada.dataUrl || valorAtual || "";
  } catch (erro) {
    mostrarToast("Não foi possível usar esta imagem. Escolha outra foto ou arquivo.", "erro", 5200);
    return valorAtual || "";
  }
}

function lerLogoMarcaSelecionada() {
  return lerImagemConfiguracao("brandLogoFileConfig", appConfig.brandLogoDataUrl || "", "brand-logo");
}

function lerFundoPdfSelecionado() {
  return lerImagemConfiguracao("pdfBackgroundFileConfig", appConfig.pdfBackgroundDataUrl || "", "pdf-background");
}

function lerFotoPerfilSelecionada() {
  return lerImagemConfiguracao("profilePhotoFileConfig", appConfig.profilePhotoDataUrl || "", "profile-photo");
}

function lerLogoEmpresaSelecionada() {
  return lerImagemConfiguracao("companyLogoFileConfig", appConfig.companyLogoDataUrl || "", "company-logo");
}

function lerFundoLoginSelecionado() {
  return lerImagemConfiguracao("loginBackgroundFileConfig", appConfig.loginBackgroundDataUrl || "", "login-background");
}

function dataUrlParaBlob(dataUrl = "") {
  const partes = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!partes) return null;
  const bytes = atob(partes[2]);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: partes[1] });
}

function extensaoImagemBlob(mime = "") {
  const tipo = String(mime || "").toLowerCase();
  if (tipo.includes("webp")) return "webp";
  if (tipo.includes("png")) return "png";
  if (tipo.includes("jpeg") || tipo.includes("jpg")) return "jpg";
  return "webp";
}

function segmentoStorageSeguro(valor = "", fallback = "asset") {
  const texto = String(valor || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return texto || fallback;
}

async function salvarAssetSupabaseSilencioso(dataUrl, tipo) {
  if (!dataUrl || !String(dataUrl).startsWith("data:") || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return dataUrl || "";
  const blob = dataUrlParaBlob(dataUrl);
  if (!blob) return dataUrl;
  const companyId = billingConfig.companyId || getUsuarioAtual()?.companyId || getUsuarioAtual()?.company_id || syncConfig.supabaseUserId;
  const nome = [
    segmentoStorageSeguro(companyId, "empresa"),
    segmentoStorageSeguro(syncConfig.supabaseUserId, "usuario"),
    segmentoStorageSeguro(tipo, "imagem"),
    `${Date.now()}.${extensaoImagemBlob(blob.type)}`
  ].join("/");
  try {
    const base = normalizarUrlSupabase();
    const resposta = await fetch(`${base}/storage/v1/object/simplifica-assets/${nome}`, {
      method: "POST",
      headers: cabecalhosSupabase(true, {
        "Content-Type": blob.type || "image/jpeg",
        "x-upsert": "true"
      }),
      body: blob
    });
    if (!resposta.ok) throw new Error("HTTP " + resposta.status);
    return `${base}/storage/v1/object/public/simplifica-assets/${nome}`;
  } catch (erro) {
    registrarDiagnostico("Storage", "Upload de personalização indisponível", erro.message);
    return dataUrl;
  }
}

async function salvarPersonalizacaoRemotaSilencioso() {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  const userId = syncConfig.supabaseUserId;
  const companyId = billingConfig.companyId || getUsuarioAtual()?.companyId || userId;
  const settings = normalizarAppearanceSettings();
  try {
    const resultados = await Promise.allSettled([
      requisicaoSupabase("/rest/v1/user_profiles?on_conflict=user_id", {
        method: "POST",
        telemetry: false,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          display_name: getUsuarioAtual()?.nome || "",
          profile_photo: appConfig.profilePhotoDataUrl || "",
          updated_at: new Date().toISOString()
        })
      }),
      requisicaoSupabase("/rest/v1/company_profiles?on_conflict=user_id,company_id", {
        method: "POST",
        telemetry: false,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          company_id: companyId,
          company_name: appConfig.businessName || "",
          company_logo: appConfig.companyLogoDataUrl || appConfig.brandLogoDataUrl || "",
          custom_message: appConfig.customLoginMessage || "",
          updated_at: new Date().toISOString()
        })
      }),
      requisicaoSupabase("/rest/v1/app_customizations?on_conflict=user_id,company_id", {
        method: "POST",
        telemetry: false,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          company_id: companyId,
          theme_color: appConfig.accentColor || "#073b4b",
          secondary_color: settings.secondary_color || "#ff941c",
          background_image: appConfig.pdfBackgroundDataUrl || "",
          login_background: appConfig.loginBackgroundDataUrl || "",
          pdf_watermark: appConfig.brandLogoDataUrl || "",
          company_logo: appConfig.companyLogoDataUrl || "",
          profile_photo: appConfig.profilePhotoDataUrl || "",
          custom_message: appConfig.customLoginMessage || "",
          settings,
          updated_at: new Date().toISOString()
        })
      })
    ]);
    const falhas = resultados.filter((resultado) => resultado.status === "rejected");
    if (falhas.length) {
      throw new Error(falhas.map((falha) => falha.reason?.message || String(falha.reason || "falha")).join(" | "));
    }
    appConfig.customizationSyncPending = false;
    return true;
  } catch (erro) {
    registrarDiagnostico("Personalização", "Persistência remota indisponível", erro.message);
    return false;
  }
}

function aplicarLinhaPersonalizacaoRemota(linha = {}) {
  if (!linha || typeof linha !== "object") return false;
  const settings = linha.settings && typeof linha.settings === "object" ? linha.settings : {};
  const usarTexto = (valor) => (typeof valor === "string" && valor.trim() ? valor.trim() : "");
  const proximo = {
    accentColor: usarTexto(linha.theme_color) || usarTexto(settings.primary_color) || appConfig.accentColor,
    pdfBackgroundDataUrl: usarTexto(linha.background_image) || usarTexto(settings.pdf_background) || appConfig.pdfBackgroundDataUrl,
    loginBackgroundDataUrl: usarTexto(linha.login_background) || usarTexto(settings.login_background) || appConfig.loginBackgroundDataUrl,
    brandLogoDataUrl: usarTexto(linha.pdf_watermark) || usarTexto(settings.logo_url) || appConfig.brandLogoDataUrl,
    companyLogoDataUrl: usarTexto(linha.company_logo) || usarTexto(settings.company_logo) || appConfig.companyLogoDataUrl,
    profilePhotoDataUrl: usarTexto(linha.profile_photo) || usarTexto(settings.profile_photo) || appConfig.profilePhotoDataUrl,
    customLoginMessage: usarTexto(linha.custom_message) || appConfig.customLoginMessage
  };
  const appearanceSettings = normalizarAppearanceSettings({
    ...(appConfig.appearanceSettings || {}),
    ...settings,
    primary_color: proximo.accentColor,
    secondary_color: usarTexto(linha.secondary_color) || usarTexto(settings.secondary_color) || settings.secondary_color,
    pdf_background: proximo.pdfBackgroundDataUrl,
    logo_url: proximo.brandLogoDataUrl,
    profile_photo: proximo.profilePhotoDataUrl,
    company_logo: proximo.companyLogoDataUrl,
    login_background: proximo.loginBackgroundDataUrl
  });
  const mudou = Object.entries(proximo).some(([chave, valor]) => String(appConfig[chave] || "") !== String(valor || ""))
    || JSON.stringify(appConfig.appearanceSettings || {}) !== JSON.stringify(appearanceSettings || {});
  if (!mudou) return false;
  appConfig = {
    ...appConfig,
    ...proximo,
    appearanceSettings,
    customizationSyncPending: false
  };
  aplicarPersonalizacao();
  salvarDados();
  return true;
}

async function carregarPersonalizacaoRemotaSilencioso() {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  try {
    const userId = encodeURIComponent(syncConfig.supabaseUserId);
    const linhas = await requisicaoSupabase(`/rest/v1/app_customizations?select=*&user_id=eq.${userId}&order=updated_at.desc&limit=1`, {
      method: "GET",
      telemetry: false
    });
    const linha = Array.isArray(linhas) ? linhas[0] : null;
    return aplicarLinhaPersonalizacaoRemota(linha);
  } catch (erro) {
    registrarDiagnostico("Personalização", "Leitura remota indisponível", erro.message);
    return false;
  }
}

async function sincronizarPersonalizacaoInicialSilencioso() {
  if (appConfig.customizationSyncPending) {
    const sincronizado = await salvarPersonalizacaoRemotaSilencioso();
    if (sincronizado) {
      appConfig.customizationSyncPending = false;
      salvarDados();
    }
    return false;
  }
  return carregarPersonalizacaoRemotaSilencioso();
}

async function salvarPersonalizacao() {
  const [logoBruto, fundoPdfBruto, fotoBruta, logoEmpresaBruta, fundoLoginBruto] = await Promise.all([
    lerLogoMarcaSelecionada(),
    lerFundoPdfSelecionado(),
    lerFotoPerfilSelecionada(),
    lerLogoEmpresaSelecionada(),
    lerFundoLoginSelecionado()
  ]);
  const [logo, fundoPdf, fotoPerfil, logoEmpresa, fundoLogin] = await Promise.all([
    salvarAssetSupabaseSilencioso(logoBruto, "brand-logo"),
    salvarAssetSupabaseSilencioso(fundoPdfBruto, "pdf-background"),
    salvarAssetSupabaseSilencioso(fotoBruta, "profile-photo"),
    salvarAssetSupabaseSilencioso(logoEmpresaBruta, "company-logo"),
    salvarAssetSupabaseSilencioso(fundoLoginBruto, "login-background")
  ]);
  const campos = lerPersonalizacaoCampos();
  appConfig = {
    ...appConfig,
    ...campos,
    brandLogoDataUrl: logo,
    pdfBackgroundDataUrl: fundoPdf,
    profilePhotoDataUrl: fotoPerfil,
    companyLogoDataUrl: logoEmpresa,
    loginBackgroundDataUrl: fundoLogin,
    appearanceSettings: normalizarAppearanceSettings({
      ...(campos.appearanceSettings || {}),
      logo_url: logo,
      pdf_background: fundoPdf,
      profile_photo: fotoPerfil,
      company_logo: logoEmpresa,
      login_background: fundoLogin
    })
  };
  const remotoOk = await salvarPersonalizacaoRemotaSilencioso();
  appConfig.customizationSyncPending = !remotoOk;
  salvarDados();
  registrarHistorico("Personalização", "Preferências do app atualizadas");
  mostrarToast(temAcessoCompleto() ? "Personalização salva" : "Dados básicos salvos", "sucesso", 2800);
  renderizarPreservandoScroll();
}

function removerLogoMarca() {
  if (!confirm("Remover a logo salva do PDF?")) return;
  appConfig.brandLogoDataUrl = "";
  salvarDados();
  registrarHistorico("Personalização", "Logo removida do PDF");
  renderizarPreservandoScroll();
}

function removerFundoPdf() {
  if (!confirm("Remover o fundo salvo do PDF?")) return;
  appConfig.pdfBackgroundDataUrl = "";
  appConfig.appearanceSettings = normalizarAppearanceSettings({
    ...(appConfig.appearanceSettings || {}),
    pdf_background: ""
  });
  salvarDados();
  registrarHistorico("Personalização", "Fundo do PDF removido");
  renderizarPreservandoScroll();
}

function restaurarPersonalizacaoPadrao() {
  if (!confirm("Restaurar a personalização padrão do app?")) return;
  appConfig = {
    appName: SYSTEM_NAME,
    businessName: "Minha empresa 3D",
    whatsappNumber: "",
    documentFooter: "Obrigado pela preferência.",
    pixKey: "",
    pixReceiverName: "",
    pixCity: "",
    pixDescription: "Pedido Simplifica 3D",
    brandLogoDataUrl: "",
    pdfBackgroundDataUrl: "",
    profilePhotoDataUrl: "",
    companyLogoDataUrl: "",
    loginBackgroundDataUrl: "",
    customLoginMessage: "",
    pdfStyle: "clean",
    pdfHeaderText: "",
    brandWatermarkEnabled: true,
    theme: "dark",
    accentColor: "#073b4b",
    appearanceSettings: normalizarAppearanceSettings({
      primary_color: "#073b4b",
      secondary_color: "#ff941c",
      pdf_background: "",
      logo_url: "",
      profile_photo: "",
      company_logo: "",
      login_background: "",
      theme_mode: "dark",
      glass_effect: true,
      custom_pdf_enabled: false
    }),
    motionLevel: "medium",
    compactMode: false,
    showBrandInHeader: true,
    defaultMargin: 100,
    defaultEnergy: 0.85,
    defaultFilamentCost: 150,
    defaultPrinterType: appConfig.defaultPrinterType || "FDM",
    defaultPrinterModel: appConfig.defaultPrinterModel || "Ender 3",
    defaultResinCost: Number(appConfig.defaultResinCost) || 180,
    screenFit: "auto",
    uiScale: 100,
    desktopCardMinWidth: 320,
    desktopMaxWidth: 1480,
    sidebarCollapsed: false,
    twoFactorEnabled: whatsapp2FABackendDisponivel() && appConfig.twoFactorEnabled,
    twoFactorWhatsapp: appConfig.twoFactorWhatsapp || "",
    twoFactorScope: appConfig.twoFactorScope || "admin",
    twoFactorRememberMinutes: Number(appConfig.twoFactorRememberMinutes) || 60,
    autoUpdateEnabled: appConfig.autoUpdateEnabled !== false,
    updateCheckInterval: Number(appConfig.updateCheckInterval) || 30,
    updateLastCheck: appConfig.updateLastCheck || "",
    updateStatus: appConfig.updateStatus || "Aguardando",
    browserPasswordSaveOffer: appConfig.browserPasswordSaveOffer !== false,
    keepSessionCache: appConfig.keepSessionCache !== false,
    biometricEnabled: !!appConfig.biometricEnabled,
    biometricOfferDismissed: !!appConfig.biometricOfferDismissed,
    backupReminderLastAt: appConfig.backupReminderLastAt || "",
    telemetryEnabled: appConfig.telemetryEnabled !== false,
    adsenseWebEnabled: appConfig.adsenseWebEnabled === true,
    adsensePublisherId: appConfig.adsensePublisherId || "",
    adsenseBannerSlot: appConfig.adsenseBannerSlot || "",
    calculatorWidget: normalizarCalculadoraWidget({
      ...(appConfig.calculatorWidget || {}),
      open: false
    }),
    dashboardLayout: appConfig.dashboardLayout || {
      mode: "tiles",
      order: dashboardWidgets.map((item) => item.id),
      sizes: { ...dashboardDefaultSizes },
      windows: JSON.parse(JSON.stringify(dashboardDefaultWindows))
    }
  };
  salvarDados();
  registrarHistorico("Personalização", "Preferências restauradas");
  renderizarPreservandoScroll();
}

function isAmbienteLocal() {
  const host = location.hostname || "";
  return ["localhost", "127.0.0.1", ""].includes(host) || location.protocol === "file:";
}

function podeUsarAdminLocalManutencao() {
  return isAmbienteLocal() && !isAndroid();
}

function setBotaoLoading(idOuBotao, carregando, textoCarregando = "Entrando...") {
  const botao = typeof idOuBotao === "string" ? document.getElementById(idOuBotao) : idOuBotao;
  if (!botao) return;
  if (carregando) {
    botao.dataset.textoOriginal = botao.textContent;
    botao.textContent = textoCarregando;
    botao.disabled = true;
  } else {
    botao.textContent = botao.dataset.textoOriginal || botao.textContent;
    botao.disabled = false;
  }
}

function normalizarTipoToast(tipo = "info") {
  const valor = String(tipo || "info").toLowerCase();
  const mapa = {
    success: "sucesso",
    sucesso: "sucesso",
    warning: "warning",
    aviso: "warning",
    error: "erro",
    erro: "erro",
    danger: "erro",
    loading: "loading",
    info: "info",
    silent: "silencioso",
    silencioso: "silencioso"
  };
  return mapa[valor] || "info";
}

function mensagemToastTecnica(mensagem = "") {
  return /\b(webhook|billing|telemetry|stack|trace|rpc|rls|payload|postgres|service_role|token|jwt|subscription ativa|evento de billing|evento remoto|canal fechado|sync silencioso|supabase\/rls)\b/i.test(String(mensagem || ""));
}

function mostrarToast(mensagem, tipo = "info", duracao = 4200) {
  if (typeof document === "undefined" || !document.body || !mensagem) return;
  const tipoNormalizado = normalizarTipoToast(tipo);
  const texto = String(mensagem || "").trim();
  if (!texto) return;
  if (tipoNormalizado === "silencioso") {
    registrarDiagnostico("Toast", "Mensagem silenciosa", texto);
    return null;
  }
  if (!isSuperAdmin() && mensagemToastTecnica(texto)) {
    registrarDiagnostico("Toast", "Mensagem técnica ocultada", texto);
    return null;
  }

  const agora = Date.now();
  const holder = window.__simplificaToastState || { last: new Map() };
  window.__simplificaToastState = holder;
  const chave = `${tipoNormalizado}:${texto.toLowerCase()}`;
  const ultimo = Number(holder.last.get(chave) || 0);
  if (agora - ultimo < TOAST_DEBOUNCE_MS) return null;
  holder.last.set(chave, agora);

  let area = document.getElementById("toastArea");
  if (!area) {
    area = document.createElement("div");
    area.id = "toastArea";
    area.className = "toast-area";
    document.body.appendChild(area);
  }

  const existentes = Array.from(area.querySelectorAll(".app-toast:not(.toast-loading)"));
  while (existentes.length >= 3) {
    existentes.shift()?.remove();
  }

  const toast = document.createElement("div");
  toast.className = "app-toast toast-" + tipoNormalizado;
  const icone = tipoNormalizado === "erro" ? "×" : tipoNormalizado === "sucesso" ? "✓" : tipoNormalizado === "loading" ? "•••" : tipoNormalizado === "warning" ? "!" : "i";
  toast.innerHTML = `<span class="toast-icon">${icone}</span><strong>${escaparHtml(texto)}</strong>`;
  area.appendChild(toast);

  if (tipoNormalizado !== "loading") {
    setTimeout(() => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 240);
    }, duracao);
  }

  return toast;
}

async function loginAdmin() {
  const senha = document.getElementById("adminSenha")?.value || "";
  if (!podeUsarAdminLocalManutencao()) {
    alert("Acesso de manutenção local indisponível neste ambiente. Use e-mail e senha do usuário.");
    registrarSeguranca("Acesso admin local negado", "erro", "Ambiente sem manutenção local", "admin-local");
    return;
  }
  if (loginEstaBloqueado("admin-local")) return;
  setBotaoLoading("loginAdminBtn", true);
  if (senha !== "123") {
    registrarFalhaLogin("admin-local", "Senha local incorreta");
    alert("Usuário ou senha inválidos");
    setBotaoLoading("loginAdminBtn", false);
    return;
  }

  if (precisa2FA()) {
    iniciarVerificacao2FA("admin");
    setBotaoLoading("loginAdminBtn", false);
    return;
  }

  limparFalhasLogin("admin-local");
  concluirLoginAdmin();
  setBotaoLoading("loginAdminBtn", false);
}

function concluirLoginAdmin() {
  adminLogado = true;
  usuarioAtualEmail = "";
  sessionStorage.setItem("adminLogado", "sim");
  sessionStorage.removeItem("usuarioAtualEmail");
  registrarHistorico("Admin", "Login realizado");
  registrarSeguranca("Login admin local", "sucesso", "Manutenção local", "admin-local");
  registrarAtividadeSessao();
  renderApp();
}

function logoutAdmin() {
  adminLogado = false;
  usuarioAtualEmail = "";
  sessionStorage.removeItem("adminLogado");
  sessionStorage.removeItem("usuarioAtualEmail");
  registrarSeguranca("Logout admin local", "sucesso", "", "admin-local");
  renderApp();
}

async function cadastrarClienteSaas() {
  const nome = (document.getElementById("signupNome")?.value || "").trim();
  const email = normalizarEmail(document.getElementById("signupEmail")?.value || "");
  const senha = document.getElementById("signupSenha")?.value || "";
  const confirmar = document.getElementById("signupConfirmarSenha")?.value || "";
  const negocio = (document.getElementById("signupNegocio")?.value || "").trim();
  const telefone = normalizePhoneBR(document.getElementById("signupTelefone")?.value || "");
  const aceitou = !!document.getElementById("signupAceite")?.checked;

  if (!nome || !email || !senha || !confirmar || !negocio) {
    alert("Campo obrigatório");
    return;
  }
  if (!emailValido(email)) {
    alert("Informe um e-mail válido.");
    return;
  }
  if (!aceitou) {
    alert("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
    return;
  }
  if (senha !== confirmar) {
    alert("As senhas não conferem.");
    return;
  }
  const erroSenha = mensagemValidacaoSenha(senha);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  garantirEstruturaSaasLocal();
  limparResiduosCadastroLocal(email, { onlyPending: true });
  if (usuarios.some((usuario) => usuario.email === email) || saasClients.some((cliente) => normalizarEmail(cliente.email) === email)) {
    alert("Este e-mail já está cadastrado.");
    return;
  }

  setBotaoLoading("signupBtn", true, "Criando...");
  try {
    const local = await AuthService.signupSaas({ nome, email, senha, negocio, telefone });
    salvarDados();
    registrarHistorico("Conta", "Conta SaaS criada: " + email);
    registrarSeguranca("Criação usuário", "sucesso", "Cadastro inicial", email);
    registrarAuditoria("criação usuário", { email, negocio, plano: "premium_trial" }, local.usuario.clientId);
    mostrarToast(
      local.cadastroAguardandoConfirmacao && !local.cadastroOnline?.client_id
        ? "Conta criada. Confirme o e-mail para ativar a sincronização online."
        : local.usuario.supabasePending
          ? "Conta local criada, mas o cadastro online não foi confirmado. Veja Diagnósticos/Supabase."
        : "Conta criada. Trial Premium liberado por 7 dias.",
      "sucesso",
      6500
    );
    concluirLoginUsuario(local.usuario);
  } catch (erro) {
    ErrorService.notify(erro, { area: "Autenticação", action: "Cadastro SaaS", userMessage: "Não foi possível criar a conta." });
  } finally {
    setBotaoLoading("signupBtn", false);
  }
}

async function loginUsuario() {
  const email = normalizarEmail(document.getElementById("usuarioLoginEmail")?.value || "");
  const senha = document.getElementById("usuarioLoginSenha")?.value || "";
  usuarios = normalizarUsuarios(usuarios);

  if (!email || !senha) {
    alert("Campo obrigatório");
    registrarSeguranca("Falha de login", "erro", "Campo obrigatório", email);
    return;
  }
  if (!emailValido(email)) {
    alert("Informe um e-mail válido.");
    registrarSeguranca("Falha de login", "erro", "E-mail inválido", email);
    return;
  }
  if (loginEstaBloqueado(email)) return;

  setBotaoLoading("loginUsuarioBtn", true);
  try {
    const { usuario, source } = await AuthService.login(email, senha);
    if (source === "supabase") mostrarToast("Login conectado ao Supabase.", "sucesso");

    if (precisa2FA(usuario)) {
      iniciarVerificacao2FA("usuario", usuario);
      return;
    }

    limparFalhasLogin(email);
    oferecerSalvarCredencialNavegador(email, senha);
    concluirLoginUsuario(usuario);
  } catch (erro) {
    ErrorService.notify(erro, { area: "Autenticação", action: "Login", userMessage: "Usuário ou senha inválidos." });
  } finally {
    setBotaoLoading("loginUsuarioBtn", false);
  }
}

function concluirLoginUsuario(usuario) {
  if (!syncConfig.supabaseUserId) {
    alert("Não foi possível validar o auth.uid no Supabase. Faça login online novamente.");
    registrarSeguranca("Login bloqueado", "erro", "Sem auth.uid Supabase", usuario?.email || "");
    return;
  }
  if (usuarioEstaBloqueado(usuario)) {
    alert("Este usuário está bloqueado. Fale com o administrador.");
    return;
  }
  if (usuario.clientId) billingConfig.clientId = usuario.clientId;
  if (usuario.companyId) billingConfig.companyId = usuario.companyId;
  if (usuario.papel !== "superadmin" && !registrarDispositivoLicenca(usuario.email)) return;
  if (!registrarSessaoSaasLocal(usuario)) return;
  usuarioAtualEmail = usuario.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  salvarCacheSessaoLocal();
  desativarTravaLocal("login");
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  usuario.lastLoginAt = new Date().toISOString();
  registrarAtividadeUsuarioAtual("login", false);
  if (usuario.clientId) {
    billingConfig.clientId = usuario.clientId;
    const cliente = saasClients.find((item) => item.id === usuario.clientId);
    if (cliente) {
      cliente.lastAccessAt = usuario.lastLoginAt;
      if (cliente.status === "inactive") cliente.status = "active";
      cliente.updatedAt = usuario.lastLoginAt;
    }
  }
  marcarClientesInativosLocal();
  salvarDados();
  registrarHistorico("Usuário", `Login de ${usuario.nome}`);
  registrarSeguranca("Login realizado", "sucesso", usuario.papel, usuario.email);
  registrarAuditoria("login", { papel: usuario.papel }, usuario.clientId || billingConfig.clientId);
  executarPosLoginAssincrono(usuario);
  registrarAtividadeSessao();
  sincronizarAposLogin();
  oferecerAtivarBiometriaAposLogin();
  reconciliarOnboardingConcluido(usuario);
  if (isSuperAdmin(usuario)) {
    telaAnterior = telaAtual;
    telaAtual = "superadmin";
    window.__superAdminTab = window.__superAdminTab || "dashboard";
  } else if (deveMostrarOnboarding(usuario)) {
    telaAnterior = "dashboard";
    telaAtual = "onboarding";
  } else if (["onboarding", "superadmin", "acessoNegado", "admin"].includes(telaAtual)) {
    telaAtual = "dashboard";
  }
  renderApp();
}

function executarPosLoginAssincrono(usuario) {
  const tarefas = [
    ["Cadastro SaaS pós-login", () => garantirCadastroSaasOnlineAposLogin(usuario)],
    ["Toque de acesso Supabase", () => tocarAcessoClienteSupabaseSilencioso()],
    ["Licença Supabase", () => consultarLicencaSupabaseSilencioso()],
    ["Carga SaaS Supabase", () => carregarSaasSupabaseSilencioso()],
    ["Sessão SaaS Supabase", () => registrarSessaoSaasOnlineSilencioso(usuario)]
  ];
  tarefas.forEach(([nome, tarefa]) => {
    Promise.resolve()
      .then(tarefa)
      .catch((erro) => ErrorService.capture(erro, { area: "Pós-login", action: nome, silent: true }));
  });
}

function sincronizarAposLogin() {
  if (!temAcessoNuvem()) return;
  const plano = getPlanoAtual();
  if (syncConfig.supabaseAccessToken && syncConfig.supabaseUserId) {
    syncConfig.supabaseEnabled = true;
    syncConfig.autoBackupTarget = "supabase";
    sincronizarAlteracoesLocaisSilencioso("login").catch((erro) => registrarDiagnostico("sync", "Sync Supabase pós-login falhou", erro.message));
    return;
  }
  if (plano.slug === "premium" || plano.slug === "premium_trial") {
    syncConfig.supabaseEnabled = true;
    syncConfig.autoBackupTarget = "supabase";
    sincronizarSupabaseSilencioso().catch((erro) => registrarDiagnostico("sync", "Sync Premium pós-login falhou", erro.message));
    return;
  }
  if (syncConfig.autoBackupTarget === "supabase" && syncConfig.supabaseEnabled) {
    sincronizarSupabaseSilencioso().catch((erro) => registrarDiagnostico("sync", "Sync Supabase pós-login falhou", erro.message));
    return;
  }
  if (syncConfig.autoBackupTarget === "url" && syncConfig.cloudUrl) {
    sincronizarUrlSilencioso().catch((erro) => registrarDiagnostico("sync", "Sync pós-login falhou", erro.message));
    return;
  }
  if (ENABLE_GOOGLE_DRIVE_BACKUP && driveFolderHandle) {
    sincronizarGoogleDriveSilencioso().catch((erro) => registrarDiagnostico("sync", "Sync Drive pós-login falhou", erro.message));
  }
}

function logoutUsuario() {
  const email = usuarioAtualEmail;
  const escopoAtual = getEscopoDadosAtual();
  if (escopoAtual) salvarCacheDadosUsuario(escopoAtual);
  pararRealtimeSyncUsuario("logout");
  usuarioAtualEmail = "";
  adminLogado = false;
  window.__simplificaLocalLockActive = false;
  localLockModalOpen = false;
  sessionStorage.removeItem("usuarioAtualEmail");
  sessionStorage.removeItem("adminLogado");
  sessionStorage.removeItem("sessionLastActivity");
  limparSessaoSensivelSupabase();
  syncConfig.supabaseUserId = "";
  syncConfig.supabaseEmail = "";
  scopedDataCacheReady = false;
  localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
  localStorage.removeItem(ACTIVE_DATA_SCOPE_KEY);
  limparDadosOperacionaisLocais();
  limparCacheTemporarioContaAnterior();
  registrarSeguranca("Logout", "sucesso", "", email);
  salvarDados();
  renderApp();
}

function registrarAtividadeSessao() {
  if (!usuarioAtualEmail && !adminLogado) return;
  sessionStorage.setItem("sessionLastActivity", String(Date.now()));
  const ultimo = Date.parse(syncConfig.lastActivityAt || 0) || 0;
  if (Date.now() - ultimo > 60 * 1000) {
    registrarAtividadeUsuarioAtual("session-activity", true);
  }
  sessionWarned = false;
}

function monitorarSessao() {
  if (sessionTimer) clearInterval(sessionTimer);
  ["click", "keydown", "pointerdown", "touchstart"].forEach((evento) => {
    document.addEventListener(evento, registrarAtividadeSessao, { passive: true });
  });
  sessionTimer = setInterval(() => {
    if (!usuarioAtualEmail && !adminLogado) return;
    const ultimo = Number(sessionStorage.getItem("sessionLastActivity") || Date.now());
    const inativo = Date.now() - ultimo;
    if (inativo >= SECURITY_SESSION_TIMEOUT_MS) {
      if (!sessionWarned) {
        sessionWarned = true;
        registrarSeguranca("Sessão mantida", "sucesso", "Inatividade sem logout automático");
      }
      return;
    }
    if (!sessionWarned && inativo >= SECURITY_SESSION_TIMEOUT_MS - SECURITY_SESSION_WARNING_MS) {
      sessionWarned = true;
      registrarSeguranca("Sessão inativa", "sucesso", "Login mantido ate logout manual");
    }
  }, 30000);
}

async function salvarDonoSistema() {
  alert("Superadmin agora é definido no banco pelo user_id. Use o painel Supabase para conceder acesso global.");
}

function loginComoDono() {
  alert("Login de dono foi removido. Entre com admin do cliente ou superadmin definido no banco.");
}

async function adicionarUsuario() {
  if (!exigirAdminParaAcao()) return;

  const nome = (document.getElementById("novoUsuarioNome")?.value || "").trim();
  const email = normalizarEmail(document.getElementById("novoUsuarioEmail")?.value || "");
  const phone = normalizePhoneBR(document.getElementById("novoUsuarioTelefone")?.value || "");
  const senha = document.getElementById("novoUsuarioSenha")?.value || "";
  const papel = normalizarPapel(document.getElementById("novoUsuarioPapel")?.value || "operador");
  const ativo = (document.getElementById("novoUsuarioStatus")?.value || "ativo") === "ativo";

  if (!nome || !email || !senha) {
    alert("Campo obrigatório");
    return;
  }
  if (!emailValido(email)) {
    alert("Informe um e-mail válido.");
    return;
  }

  const usuarioExistente = usuarios.find((usuario) => usuario.email === email);
  if (!usuarioExistente && limiteUsuariosAtingido()) {
    mostrarModalLimitePlano("Você atingiu o limite de usuários do seu plano. Faça upgrade para continuar.");
    return;
  }

  const erroSenha = mensagemValidacaoSenha(senha);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }

  if (papel === "superadmin" && !isSuperAdmin()) {
    alert("Somente um superadmin pode criar outro superadmin.");
    return;
  }

  if (!planoPermiteRecurso("permissions") && !["operador", "visualizador"].includes(papel) && !isSuperAdmin()) {
    mostrarModalLimitePlano("Permissões avançadas fazem parte do plano Premium.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  const existente = usuarioExistente;
  if (existente) {
    if (existente.papel === "superadmin" && (!isSuperAdmin() || isSuperAdminPrincipal(existente))) {
      alert("O superadmin principal não pode ser rebaixado ou alterado por este painel.");
      return;
    }
    existente.nome = nome || existente.nome;
    existente.phone = phone;
    await definirSenhaUsuario(existente, senha, true);
    existente.papel = papel;
    existente.ativo = ativo;
    existente.bloqueado = !ativo;
    existente.clientId = existente.clientId || getClientIdAtual();
  } else {
    const novo = normalizarUsuario({
      id: criarIdUsuario(),
      clientId: getClientIdAtual(),
      nome: nome || email.split("@")[0],
      email,
      phone,
      papel,
      ativo,
      bloqueado: !ativo,
      criadoEm: new Date().toISOString()
    });
    await definirSenhaUsuario(novo, senha, true);
    usuarios.push(novo);
  }

  salvarDados();
  registrarHistorico("Usuários", `Usuário ${email} salvo como ${papel}`);
  registrarSeguranca("Usuário salvo", "sucesso", `${email} como ${papel}`);
  registrarAuditoria("criação usuário", { email, papel });
  renderApp();
}

function removerUsuario(id) {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como admin para remover usuários.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario) return;

  if (isSuperAdminPrincipal(usuario)) {
    alert("O superadmin principal não pode ser removido.");
    return;
  }

  if (usuario.papel === "superadmin" && !isSuperAdmin()) {
    alert("Somente superadmin pode remover outro superadmin.");
    return;
  }

  if (!confirm(`Remover o usuário ${usuario.email}?`)) return;
  usuarios = usuarios.filter((item) => String(item.id) !== String(id));

  if (normalizarEmail(usuarioAtualEmail) === normalizarEmail(usuario.email)) {
    usuarioAtualEmail = "";
    sessionStorage.removeItem("usuarioAtualEmail");
  }

  salvarDados();
  registrarHistorico("Usuários", `Usuário removido: ${usuario.email}`);
  registrarSeguranca("Usuário removido", "sucesso", usuario.email);
  renderApp();
}

async function redefinirSenhaUsuario(id) {
  if (!podeGerenciarUsuarios()) {
    alert("Acesso negado");
    return;
  }
  usuarios = normalizarUsuarios(usuarios);
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario || isSuperAdminPrincipal(usuario) && !isSuperAdmin()) {
    alert("Acesso negado");
    return;
  }
  const senha = await solicitarEntradaTexto({
    titulo: "Nova senha temporária",
    mensagem: "Digite a nova senha temporária para " + usuario.email,
    tipo: "password",
    obrigatorio: true
  });
  if (senha === null) return;
  const erroSenha = mensagemValidacaoSenha(senha);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }
  await definirSenhaUsuario(usuario, senha, true);
  salvarDados();
  registrarHistorico("Usuários", `Senha temporária redefinida: ${usuario.email}`);
  registrarSeguranca("Redefinição de senha", "sucesso", usuario.email);
  alert("Senha redefinida. O usuário deverá trocar no próximo acesso.");
  renderApp();
}

function alternarStatusUsuario(id) {
  if (!podeGerenciarUsuarios()) {
    alert("Acesso negado");
    return;
  }
  usuarios = normalizarUsuarios(usuarios);
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario || isSuperAdminPrincipal(usuario)) {
    alert("O superadmin principal não pode ser desativado.");
    return;
  }
  usuario.ativo = usuario.ativo === false;
  usuario.bloqueado = !usuario.ativo;
  usuario.atualizadoEm = new Date().toISOString();
  salvarDados();
  registrarHistorico("Usuários", `${usuario.ativo ? "Reativado" : "Desativado"}: ${usuario.email}`);
  registrarSeguranca(usuario.ativo ? "Usuário reativado" : "Usuário desativado", "sucesso", usuario.email);
  alert(usuario.ativo ? "Usuário reativado" : "Usuário desativado");
  renderApp();
}

function getCampoSenhaFormulario(formulario, campo, fallbackId) {
  return formulario?.querySelector(`[data-password-field="${campo}"]`)?.value || document.getElementById(fallbackId)?.value || "";
}

async function alterarSenhaAtual(obrigatoria = false, botao = null) {
  const usuario = getUsuarioAtual();
  if (!usuario) {
    alert("Sessão expirada");
    trocarTela("admin");
    return;
  }
  const formulario = botao?.closest?.(".password-change-form") || document.querySelector(".password-change-form");
  const atual = getCampoSenhaFormulario(formulario, "atual", "senhaAtualUsuario");
  const nova = getCampoSenhaFormulario(formulario, "nova", "novaSenhaUsuario");
  const confirmar = getCampoSenhaFormulario(formulario, "confirmar", "confirmarNovaSenhaUsuario");
  if (!atual || !nova || !confirmar) {
    alert("Campo obrigatório");
    return;
  }
  if (nova !== confirmar) {
    alert("As senhas não conferem.");
    return;
  }
  const erroSenha = mensagemValidacaoSenha(nova);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }
  setBotaoLoading(botao || "alterarSenhaBtn", true, "Salvando...");
  if (!await verificarSenhaUsuario(usuario, atual)) {
    registrarSeguranca("Troca de senha", "erro", "Senha atual inválida", usuario.email);
    alert("Usuário ou senha inválidos");
    setBotaoLoading(botao || "alterarSenhaBtn", false);
    return;
  }
  await definirSenhaUsuario(usuario, nova, false);
  await alterarSenhaSupabaseSeConectado(nova);
  salvarDados();
  registrarHistorico("Segurança", "Senha alterada");
  registrarSeguranca("Troca de senha", "sucesso", "", usuario.email);
  alert("Senha alterada com sucesso");
  setBotaoLoading(botao || "alterarSenhaBtn", false);
  if (obrigatoria) trocarTela("dashboard");
  else renderApp();
}

function salvarConfigComercial() {
  if (!podeGerenciarComercial()) {
    alert("Entre como admin para alterar o comercial.");
    return;
  }

  const mobileLimit = Math.max(1, parseFloat(document.getElementById("mobileLimitAdmin")?.value) || 1);
  const desktopLimit = Math.max(1, parseFloat(document.getElementById("desktopLimitAdmin")?.value) || 1);

  billingConfig = {
    ...billingConfig,
    ownerMode: false,
    trialDays: Math.max(1, parseFloat(document.getElementById("trialDaysAdmin")?.value) || 7),
    monthlyPrice: Math.max(0, parseFloat(document.getElementById("monthlyPriceAdmin")?.value) || 19.9),
    mercadoPagoLink: (document.getElementById("mercadoPagoLinkAdmin")?.value || "").trim(),
    androidDownloadUrl: (document.getElementById("androidDownloadUrlAdmin")?.value || "").trim(),
    windowsWebUrl: (document.getElementById("windowsWebUrlAdmin")?.value || "").trim(),
    windowsDownloadUrl: "",
    deviceLimits: {
      mobile: mobileLimit,
      desktop: desktopLimit
    },
    cloudSyncPaidOnly: false
  };

  salvarDados();
  registrarHistorico("Comercial", "Configuração comercial atualizada");
  renderApp();
}

function ativarLicencaLocal() {
  if (!podeGerenciarComercial()) {
    alert("Entre como admin para ativar licença local.");
    return;
  }

  const validade = new Date();
  validade.setMonth(validade.getMonth() + 1);
  billingConfig.licenseStatus = "active";
  billingConfig.paidUntil = validade.toISOString();
  salvarDados();
  registrarHistorico("Assinatura", "Licença local ativada pelo admin");
  renderApp();
}

function voltarParaGratis() {
  if (!podeGerenciarComercial()) {
    alert("Entre como admin para alterar licença.");
    return;
  }

  billingConfig.licenseStatus = "free";
  billingConfig.trialStartedAt = "";
  billingConfig.paidUntil = "";
  salvarDados();
  registrarHistorico("Assinatura", "Licença local voltou para grátis");
  renderApp();
}

function lerConfigSyncCampos() {
  const arquivoDrive = (document.getElementById("driveFileName")?.value || syncConfig.driveFileName || "erp3d-backup.json").trim();
  const autoBackupEnabledEl = document.getElementById("autoBackupEnabled");
  const autoBackupInterval = Math.max(30, parseFloat(document.getElementById("autoBackupInterval")?.value || syncConfig.autoBackupInterval || 30) || 30);
  const supabaseEnabledEl = document.getElementById("supabaseEnabled");
  const alvoSelecionado = document.getElementById("autoBackupTarget")?.value || syncConfig.autoBackupTarget || "supabase";
  return {
    cloudUrl: (document.getElementById("syncCloudUrl")?.value || syncConfig.cloudUrl || "").trim(),
    token: (document.getElementById("syncToken")?.value || syncConfig.token || "").trim(),
    deviceName: (document.getElementById("syncDeviceName")?.value || syncConfig.deviceName || "").trim(),
    driveFileName: arquivoDrive.endsWith(".json") ? arquivoDrive : arquivoDrive + ".json",
    autoBackupEnabled: autoBackupEnabledEl ? autoBackupEnabledEl.checked : !!syncConfig.autoBackupEnabled,
    autoBackupInterval,
    autoBackupTarget: ENABLE_GOOGLE_DRIVE_BACKUP ? alvoSelecionado : "supabase",
    supabaseEnabled: supabaseEnabledEl ? supabaseEnabledEl.checked : true,
    supabaseGoogleOAuthEnabled: document.getElementById("supabaseGoogleOAuthEnabled")
      ? !!document.getElementById("supabaseGoogleOAuthEnabled")?.checked
      : !!syncConfig.supabaseGoogleOAuthEnabled,
    supabaseUrl: (document.getElementById("supabaseUrl")?.value || syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL).trim().replace(/\/+$/, ""),
    supabaseAnonKey: (document.getElementById("supabaseAnonKey")?.value || syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY).trim(),
    supabaseEmail: normalizarEmail(document.getElementById("supabaseEmail")?.value || syncConfig.supabaseEmail || "")
  };
}

function lerConfigAppCampos() {
  const twoFactorEnabledEl = document.getElementById("twoFactorEnabled");
  const autoUpdateEnabledEl = document.getElementById("autoUpdateEnabled");

  return {
    twoFactorEnabled: whatsapp2FABackendDisponivel() && (twoFactorEnabledEl ? twoFactorEnabledEl.checked : !!appConfig.twoFactorEnabled),
    twoFactorWhatsapp: normalizePhoneBR(document.getElementById("twoFactorWhatsapp")?.value || appConfig.twoFactorWhatsapp || ""),
    twoFactorScope: document.getElementById("twoFactorScope")?.value === "todos" ? "todos" : "admin",
    twoFactorRememberMinutes: Math.max(1, parseFloat(document.getElementById("twoFactorRememberMinutes")?.value || appConfig.twoFactorRememberMinutes || 60) || 60),
    autoUpdateEnabled: autoUpdateEnabledEl ? autoUpdateEnabledEl.checked : appConfig.autoUpdateEnabled !== false,
    updateCheckInterval: Math.max(5, parseFloat(document.getElementById("updateCheckInterval")?.value || appConfig.updateCheckInterval || 30) || 30),
    adsenseWebEnabled: document.getElementById("adsenseWebEnabled") ? !!document.getElementById("adsenseWebEnabled")?.checked : appConfig.adsenseWebEnabled === true,
    adsensePublisherId: (document.getElementById("adsensePublisherId")?.value || appConfig.adsensePublisherId || "").trim(),
    adsenseBannerSlot: (document.getElementById("adsenseBannerSlot")?.value || appConfig.adsenseBannerSlot || "").trim()
  };
}

function salvarConfigSync() {
  if (!exigirAcessoNuvem()) return;

  syncConfig = {
    ...syncConfig,
    ...lerConfigSyncCampos()
  };

  appConfig = {
    ...appConfig,
    ...lerConfigAppCampos()
  };

  salvarDados();
  registrarHistorico("Configuração", "Sincronização atualizada");
  iniciarAutoBackup();
  iniciarMonitorAtualizacao();
  configurarMonetizacaoAds();
  alert("Configurações salvas");
  renderApp();
}

function criarBillingConfigBackup() {
  return {
    ...billingConfig,
    ownerMode: false,
    windowsDownloadUrl: "",
    registeredDevices: normalizarDispositivosLicenca(),
    deviceLimits: getLimitesDispositivos(),
    cloudSyncPaidOnly: false
  };
}

function criarSnapshotBackup() {
  const exportadoEm = new Date();
  const escopo = obterEscopoBackupAtual();
  const clientesOperacionais = coletarClientesOperacionaisParaSync();
  return {
    versao: 4,
    app: SYSTEM_NAME,
    exportadoEm: exportadoEm.toISOString(),
    exportadoEmLocal: exportadoEm.toLocaleString("pt-BR"),
    deviceId,
    escopo: {
      email: escopo.email,
      userId: escopo.userId,
      clientId: escopo.clientId,
      companyId: escopo.companyId
    },
    resumo: {
      geradoEm: exportadoEm.toLocaleString("pt-BR"),
      usuario: escopo.email || "",
      empresa: appConfig.businessName || appConfig.appName || SYSTEM_NAME,
      pedidos: Array.isArray(pedidos) ? pedidos.length : 0,
      estoque: Array.isArray(estoque) ? estoque.length : 0,
      caixa: Array.isArray(caixa) ? caixa.length : 0,
      clientes: clientesOperacionais.length,
      configuracoesIncluidas: true
    },
    data: {
      estoque,
      caixa,
      pedidos,
      clientesOperacionais,
      orcamentos,
      historico,
      securityLogs,
      auditLogs,
      diagnostics,
      sugestoes,
      saasClients,
      saasPlans: garantirPlanosSaas(),
      saasSubscriptions,
      saasPayments,
      saasSessions,
      usageCounters,
      usuarios: normalizarUsuarios(usuarios),
      appConfig,
      billingConfig: criarBillingConfigBackup(),
      configuracoes: {
        cloudUrl: syncConfig.cloudUrl,
        deviceName: syncConfig.deviceName,
        driveFolderName: syncConfig.driveFolderName,
        driveFileName: syncConfig.driveFileName,
        driveLastSync: syncConfig.driveLastSync,
        autoBackupEnabled: syncConfig.autoBackupEnabled,
        autoBackupInterval: syncConfig.autoBackupInterval,
        autoBackupTarget: syncConfig.autoBackupTarget,
        autoBackupLastRun: syncConfig.autoBackupLastRun,
        autoBackupStatus: syncConfig.autoBackupStatus,
        supabaseEnabled: syncConfig.supabaseEnabled,
        supabaseUrl: syncConfig.supabaseUrl,
        supabaseEmail: syncConfig.supabaseEmail,
        supabaseUserId: syncConfig.supabaseUserId,
        supabaseLastLogin: syncConfig.supabaseLastLogin,
        supabaseLastSync: syncConfig.supabaseLastSync,
        lastActivityAt: syncConfig.lastActivityAt,
        ultimoBackup: syncConfig.ultimoBackup,
        ultimaSync: syncConfig.ultimaSync
      }
    }
  };
}

function obterEscopoBackupAtual() {
  const usuario = getUsuarioAtual();
  const email = normalizarEmail(usuario?.email || syncConfig.supabaseEmail || billingConfig.licenseEmail || billingConfig.ownerEmail || "");
  return {
    superadmin: isSuperAdmin(usuario),
    email,
    ownerId: getDataOwnerId(),
    userId: syncConfig.supabaseUserId || usuario?.supabaseUserId || usuario?.id || "",
    clientId: getClientIdAtual(usuario),
    companyId: usuario?.companyId || usuario?.company_id || billingConfig.companyId || ""
  };
}

function valorEscopoNormalizado(valor) {
  return String(valor || "").trim().toLowerCase();
}

function registroPertenceAoEscopoBackup(registro, escopo, permitirLegado = true) {
  if (escopo.superadmin) return true;
  if (!registro || typeof registro !== "object") return permitirLegado;

  const alvos = [
    escopo.ownerId,
    escopo.email,
    escopo.userId,
    escopo.clientId,
    escopo.companyId
  ].map(valorEscopoNormalizado).filter(Boolean);
  if (!alvos.length) return permitirLegado;

  const campos = [
    "id",
    "owner_id",
    "ownerId",
    "owner_user_id",
    "ownerUserId",
    "ownerEmail",
    "licenseEmail",
    "email",
    "user_id",
    "userId",
    "auth_user_id",
    "authUserId",
    "supabaseUserId",
    "client_id",
    "clientId",
    "company_id",
    "companyId"
  ];
  let possuiVinculo = false;

  for (const campo of campos) {
    const valor = valorEscopoNormalizado(registro[campo]);
    if (!valor) continue;
    possuiVinculo = true;
    if (alvos.includes(valor)) return true;
    if (campo.toLowerCase().includes("email") && escopo.email && normalizarEmail(registro[campo]) === escopo.email) return true;
  }

  return possuiVinculo ? false : permitirLegado;
}

function filtrarListaEscopoBackup(lista, escopo, permitirLegado = true) {
  return Array.isArray(lista)
    ? lista.filter((item) => registroPertenceAoEscopoBackup(item, escopo, permitirLegado))
    : [];
}

function filtrarUsageCountersEscopoBackup(contadores, escopo) {
  if (escopo.superadmin || !contadores || typeof contadores !== "object") return contadores || {};
  const alvos = [escopo.clientId, escopo.email, escopo.ownerId, escopo.userId, escopo.companyId]
    .map(valorEscopoNormalizado)
    .filter(Boolean);
  if (!alvos.length) return {};
  return Object.fromEntries(Object.entries(contadores).filter(([chave]) => {
    const chaveNormalizada = valorEscopoNormalizado(chave);
    return alvos.some((alvo) => chaveNormalizada.includes(alvo));
  }));
}

function criarSnapshotBackupUsuarioAtual() {
  atribuirDonoRemotoDadosLocais();
  const snapshot = criarSnapshotBackup();
  const escopo = obterEscopoBackupAtual();
  if (escopo.superadmin) return snapshot;

  snapshot.escopo = {
    email: escopo.email,
    userId: escopo.userId,
    clientId: escopo.clientId,
    companyId: escopo.companyId
  };
  snapshot.data = {
    ...snapshot.data,
    estoque: filtrarListaEscopoBackup(snapshot.data.estoque, escopo, true),
    caixa: filtrarListaEscopoBackup(snapshot.data.caixa, escopo, true),
    pedidos: filtrarListaEscopoBackup(snapshot.data.pedidos, escopo, true),
    clientesOperacionais: filtrarListaEscopoBackup(snapshot.data.clientesOperacionais, escopo, true),
    orcamentos: filtrarListaEscopoBackup(snapshot.data.orcamentos, escopo, true),
    historico: filtrarListaEscopoBackup(snapshot.data.historico, escopo, true),
    securityLogs: filtrarListaEscopoBackup(snapshot.data.securityLogs, escopo, true),
    auditLogs: filtrarListaEscopoBackup(snapshot.data.auditLogs, escopo, true),
    diagnostics: filtrarListaEscopoBackup(snapshot.data.diagnostics, escopo, true),
    sugestoes: filtrarListaEscopoBackup(snapshot.data.sugestoes, escopo, true),
    saasClients: filtrarListaEscopoBackup(snapshot.data.saasClients, escopo, false),
    saasSubscriptions: filtrarListaEscopoBackup(snapshot.data.saasSubscriptions, escopo, false),
    saasPayments: filtrarListaEscopoBackup(snapshot.data.saasPayments, escopo, false),
    saasSessions: filtrarListaEscopoBackup(snapshot.data.saasSessions, escopo, false),
    usuarios: filtrarListaEscopoBackup(snapshot.data.usuarios, escopo, false),
    usageCounters: filtrarUsageCountersEscopoBackup(snapshot.data.usageCounters, escopo)
  };
  return snapshot;
}

function nomeArquivoBackupUsuario() {
  const escopo = obterEscopoBackupAtual();
  const email = (escopo.email || "conta").replace(/[^a-z0-9@._-]/gi, "_");
  const data = dataHoraArquivo(new Date());
  return `backup-simplifica3d-${email}-${data}.json`;
}

function dataHoraArquivo(data = new Date()) {
  const pad = (valor) => String(valor).padStart(2, "0");
  return [
    data.getFullYear(),
    pad(data.getMonth() + 1),
    pad(data.getDate())
  ].join("") + "-" + [pad(data.getHours()), pad(data.getMinutes()), pad(data.getSeconds())].join("");
}

function textoArquivoSeguro(valor = "arquivo", fallback = "arquivo") {
  const texto = removerAcentos(String(valor || fallback))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return texto || fallback;
}

function tamanhoBackupMb(payload = criarSnapshotBackup()) {
  try {
    const texto = JSON.stringify(payload);
    if (typeof Blob !== "undefined") return new Blob([texto]).size / (1024 * 1024);
    return texto.length / (1024 * 1024);
  } catch (_) {
    return 0;
  }
}

function limiteBackupPlanoMb() {
  const plano = getPlanoSaasAtual();
  if (plano.maxStorageMb === null || plano.maxStorageMb === undefined) return null;
  return Math.max(1, Number(plano.maxStorageMb) || 25);
}

function verificarLimiteBackupPlano(payload = criarSnapshotBackup(), avisar = true) {
  const limite = limiteBackupPlanoMb();
  if (!limite) return true;
  const tamanho = tamanhoBackupMb(payload);
  if (tamanho <= limite) return true;
  if (avisar) {
    alert(`Seu backup está com ${tamanho.toFixed(1)} MB e o limite do plano atual é ${limite} MB. Seus dados continuam no aparelho; para sincronizar tudo na nuvem, reduza arquivos pesados ou altere o plano.`);
  }
  registrarAuditoria("limite armazenamento", { tamanhoMb: Number(tamanho.toFixed(2)), limiteMb: limite });
  return false;
}

function normalizarBackup(dados) {
  const origem = dados?.data || dados || {};
  return {
    estoque: Array.isArray(origem.estoque) ? origem.estoque : [],
    caixa: Array.isArray(origem.caixa) ? origem.caixa : [],
    pedidos: Array.isArray(origem.pedidos) ? origem.pedidos : [],
    clientesOperacionais: Array.isArray(origem.clientesOperacionais) ? origem.clientesOperacionais : [],
    orcamentos: Array.isArray(origem.orcamentos) ? origem.orcamentos : [],
    historico: Array.isArray(origem.historico) ? origem.historico : [],
    securityLogs: Array.isArray(origem.securityLogs) ? origem.securityLogs : [],
    auditLogs: Array.isArray(origem.auditLogs) ? origem.auditLogs : [],
    diagnostics: Array.isArray(origem.diagnostics) ? origem.diagnostics : [],
    sugestoes: Array.isArray(origem.sugestoes) ? origem.sugestoes : [],
    saasClients: Array.isArray(origem.saasClients) ? origem.saasClients : [],
    saasPlans: Array.isArray(origem.saasPlans) ? origem.saasPlans : [],
    saasSubscriptions: Array.isArray(origem.saasSubscriptions) ? origem.saasSubscriptions : [],
    saasPayments: Array.isArray(origem.saasPayments) ? origem.saasPayments : [],
    saasSessions: Array.isArray(origem.saasSessions) ? origem.saasSessions : [],
    usageCounters: origem.usageCounters && typeof origem.usageCounters === "object" ? origem.usageCounters : {},
    usuarios: normalizarUsuarios(origem.usuarios),
    appConfig: origem.appConfig && typeof origem.appConfig === "object" ? origem.appConfig : {},
    billingConfig: origem.billingConfig && typeof origem.billingConfig === "object" ? origem.billingConfig : {},
    configuracoes: origem.configuracoes && typeof origem.configuracoes === "object" ? origem.configuracoes : {}
  };
}

function aplicarBackup(dados, modo = "substituir") {
  const licencaBackendAntesBackup = capturarLicencaBackendFresca();
  const companySetupCompletedAntesBackup = appConfig.companySetupCompleted === true;
  const backup = normalizarBackup(dados);
  const escopoAtual = obterEscopoBackupAtual();
  const escopoBackup = dados?.escopo && typeof dados.escopo === "object" ? dados.escopo : {};
  const userIdBackup = String(escopoBackup.userId || backup.configuracoes.supabaseUserId || "").trim();
  if (userIdBackup && escopoAtual.userId && userIdBackup !== escopoAtual.userId) {
    registrarDiagnostico("Backup", "Backup de outra conta ignorado", `backup=${userIdBackup} atual=${escopoAtual.userId}`);
    return false;
  }

  if (modo === "mesclar" && dataScopeChangedOnCurrentSession) {
    modo = "substituir";
    registrarDiagnostico("Backup", "Troca de conta detectada", "Backup remoto aplicado como autoridade, sem mesclar cache local anterior.");
  }

  if (!escopoAtual.superadmin && escopoAtual.userId) {
    backup.estoque = filtrarListaEscopoBackup(backup.estoque, escopoAtual, true);
    backup.caixa = filtrarListaEscopoBackup(backup.caixa, escopoAtual, true);
    backup.pedidos = filtrarListaEscopoBackup(backup.pedidos, escopoAtual, true);
    backup.orcamentos = filtrarListaEscopoBackup(backup.orcamentos, escopoAtual, true);
  }

  if (modo === "mesclar") {
    estoque = mesclarListas(estoque, backup.estoque);
    caixa = mesclarListas(caixa, backup.caixa);
    pedidos = mesclarListas(pedidos, backup.pedidos);
    orcamentos = mesclarListas(orcamentos, backup.orcamentos).slice(0, 100);
    historico = mesclarListas(historico, backup.historico).slice(0, 250);
    securityLogs = mesclarListas(securityLogs, backup.securityLogs).slice(0, 300);
    auditLogs = mesclarListas(auditLogs, backup.auditLogs).slice(0, 500);
    diagnostics = mesclarListas(diagnostics, backup.diagnostics).slice(0, 150);
    sugestoes = mesclarListas(sugestoes, backup.sugestoes).slice(0, 100);
    saasClients = mesclarListas(saasClients, backup.saasClients).map(normalizarClienteSaas);
    saasPlans = mesclarListas(saasPlans, backup.saasPlans).map(normalizarPlanoSaas);
    saasSubscriptions = mesclarListas(saasSubscriptions, backup.saasSubscriptions).map(normalizarAssinaturaSaas);
    saasPayments = mesclarListas(saasPayments, backup.saasPayments).map(normalizarPagamentoSaas);
    saasSessions = mesclarListas(saasSessions, backup.saasSessions).map(normalizarSessaoSaas);
    usageCounters = { ...backup.usageCounters, ...usageCounters };
    usuarios = mesclarUsuarios(usuarios, backup.usuarios);
  } else {
    estoque = backup.estoque;
    caixa = backup.caixa;
    pedidos = backup.pedidos;
    orcamentos = backup.orcamentos.slice(0, 100);
    historico = backup.historico.slice(0, 250);
    securityLogs = backup.securityLogs.slice(0, 300);
    auditLogs = backup.auditLogs.slice(0, 500);
    diagnostics = backup.diagnostics.slice(0, 150);
    sugestoes = backup.sugestoes.slice(0, 100);
    saasClients = backup.saasClients.map(normalizarClienteSaas);
    saasPlans = backup.saasPlans.map(normalizarPlanoSaas);
    saasSubscriptions = backup.saasSubscriptions.map(normalizarAssinaturaSaas);
    saasPayments = backup.saasPayments.map(normalizarPagamentoSaas);
    saasSessions = backup.saasSessions.map(normalizarSessaoSaas);
    usageCounters = backup.usageCounters || {};
    usuarios = backup.usuarios.length ? normalizarUsuarios(backup.usuarios) : normalizarUsuarios(usuarios);
  }

  appConfig = {
    ...appConfig,
    ...backup.appConfig
  };
  appConfig.companySetupCompleted = companySetupCompletedAntesBackup || appConfig.companySetupCompleted === true;
  appConfig.appearanceSettings = normalizarAppearanceSettings(appConfig.appearanceSettings || {});

  billingConfig = {
    ...billingConfig,
    ...backup.billingConfig,
    ownerMode: false,
    registeredDevices: normalizarDispositivosLicenca(backup.billingConfig.registeredDevices || billingConfig.registeredDevices),
    deviceLimits: backup.billingConfig.deviceLimits || billingConfig.deviceLimits || { mobile: 1, desktop: 1 },
    cloudSyncPaidOnly: false
  };
  restaurarLicencaBackendFresca(licencaBackendAntesBackup);

  syncConfig = {
    ...syncConfig,
    cloudUrl: backup.configuracoes.cloudUrl || syncConfig.cloudUrl,
    deviceName: syncConfig.deviceName || backup.configuracoes.deviceName || "",
    driveFolderName: syncConfig.driveFolderName || backup.configuracoes.driveFolderName || "",
    driveFileName: syncConfig.driveFileName || backup.configuracoes.driveFileName || "erp3d-backup.json",
    driveLastSync: backup.configuracoes.driveLastSync || syncConfig.driveLastSync,
    autoBackupEnabled: typeof backup.configuracoes.autoBackupEnabled === "boolean" ? backup.configuracoes.autoBackupEnabled : syncConfig.autoBackupEnabled,
    autoBackupInterval: backup.configuracoes.autoBackupInterval || syncConfig.autoBackupInterval || 30,
    autoBackupTarget: ENABLE_GOOGLE_DRIVE_BACKUP
      ? backup.configuracoes.autoBackupTarget || syncConfig.autoBackupTarget || "supabase"
      : "supabase",
    autoBackupLastRun: backup.configuracoes.autoBackupLastRun || syncConfig.autoBackupLastRun,
    autoBackupStatus: backup.configuracoes.autoBackupStatus || syncConfig.autoBackupStatus,
    supabaseEnabled: typeof backup.configuracoes.supabaseEnabled === "boolean" ? backup.configuracoes.supabaseEnabled : syncConfig.supabaseEnabled,
    supabaseUrl: backup.configuracoes.supabaseUrl || syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL,
    supabaseEmail: backup.configuracoes.supabaseEmail || syncConfig.supabaseEmail,
    supabaseUserId: syncConfig.supabaseUserId || backup.configuracoes.supabaseUserId || "",
    supabaseLastLogin: syncConfig.supabaseLastLogin || backup.configuracoes.supabaseLastLogin || "",
    supabaseLastSync: backup.configuracoes.supabaseLastSync || syncConfig.supabaseLastSync,
    lastActivityAt: backup.configuracoes.lastActivityAt || syncConfig.lastActivityAt,
    ultimoBackup: backup.configuracoes.ultimoBackup || syncConfig.ultimoBackup,
    ultimaSync: backup.configuracoes.ultimaSync || syncConfig.ultimaSync
  };

  atribuirDonoRemotoDadosLocais();
  reconciliarOnboardingConcluido();
  dataScopeChangedOnCurrentSession = false;
  salvarDados();
  return true;
}

function mesclarListas(local, remoto) {
  const mapa = new Map();
  [...remoto, ...local].forEach((item) => {
    const id = item?.id || `${item?.data || ""}-${item?.descricao || item?.desc || item?.cliente || item?.nome || Math.random()}`;
    if (!mapa.has(id)) {
      mapa.set(id, item);
      return;
    }

    const atual = mapa.get(id);
    const dataAtual = getTimestampAlteracaoRegistro(atual);
    const dataNova = getTimestampAlteracaoRegistro(item);
    if (dataNova > dataAtual) {
      mapa.set(id, item);
    }
  });

  return Array.from(mapa.values());
}

function mesclarUsuarios(local, remoto) {
  const mapa = new Map();
  [...normalizarUsuarios(remoto), ...normalizarUsuarios(local)].forEach((usuario) => {
    if (!mapa.has(usuario.email)) {
      mapa.set(usuario.email, usuario);
      return;
    }

    const atual = mapa.get(usuario.email);
    const dataAtual = Date.parse(atual?.criadoEm || 0) || 0;
    const dataNova = Date.parse(usuario?.criadoEm || 0) || 0;
    const mesclado = dataNova >= dataAtual ? { ...atual, ...usuario } : { ...usuario, ...atual };
    const onboardingCompleted = atual?.onboardingCompleted === true || usuario?.onboardingCompleted === true;
    mesclado.onboardingCompleted = onboardingCompleted;
    mesclado.onboardingStep = onboardingCompleted ? 4 : Math.max(Number(atual?.onboardingStep) || 0, Number(usuario?.onboardingStep) || 0);
    mapa.set(usuario.email, mesclado);
  });
  return Array.from(mapa.values());
}

function cabecalhosSync() {
  const headers = { "Content-Type": "application/json" };
  if (syncConfig.token) {
    headers.Authorization = "Bearer " + syncConfig.token;
  }
  return headers;
}

function normalizarUrlSupabase(url = syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function atualizarConfigSupabaseCampos() {
  syncConfig = {
    ...syncConfig,
    ...lerConfigSyncCampos(),
    supabaseUrl: normalizarUrlSupabase(document.getElementById("supabaseUrl")?.value || syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL),
    supabaseAnonKey: (document.getElementById("supabaseAnonKey")?.value || syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY).trim(),
    supabaseEmail: normalizarEmail(document.getElementById("supabaseEmail")?.value || syncConfig.supabaseEmail || getEmailLicencaAtual())
  };
  salvarDados();
}

function validarSupabase(requerSessao = false) {
  if (!exigirAcessoNuvem()) return false;
  atualizarConfigSupabaseCampos();

  if (!syncConfig.supabaseUrl || !syncConfig.supabaseAnonKey) {
    alert("Configure a URL e a chave pública do Supabase.");
    return false;
  }

  if (requerSessao && (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId)) {
    alert("Entre no Supabase antes de sincronizar.");
    return false;
  }

  return true;
}

function cabecalhosSupabase(autenticado = true, extras = {}) {
  const token = autenticado ? syncConfig.supabaseAccessToken : "";
  return {
    apikey: syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY,
    Authorization: "Bearer " + (token || syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY),
    "Content-Type": "application/json",
    ...extras
  };
}

async function requisicaoSupabase(caminho, opcoes = {}, tentarRenovar = true) {
  try {
    const base = normalizarUrlSupabase();
    const autenticado = opcoes.auth !== false;
    const resposta = await fetch(base + caminho, {
      ...opcoes,
      headers: cabecalhosSupabase(autenticado, opcoes.headers || {})
    });

    if (resposta.status === 401 && autenticado && tentarRenovar && await renovarSessaoSupabase()) {
      return requisicaoSupabase(caminho, opcoes, false);
    }

    const texto = await resposta.text();
    let dados = null;
    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch (_) {
        dados = { message: texto };
      }
    }
    if (!resposta.ok) {
      const detalhe = dados?.message || dados?.error_description || dados?.error || texto || ("HTTP " + resposta.status);
      throw new AppError(detalhe, {
        code: "SUPABASE_REQUEST_FAILED",
        userMessage: ErrorService.toAppError(new Error(detalhe)).userMessage,
        details: { caminho, status: resposta.status }
      });
    }

    return dados;
  } catch (erro) {
    throw ErrorService.capture(erro, {
      area: "Supabase",
      action: caminho,
      errorKey: /rls|row-level security|permission|PGRST/i.test(String(erro?.message || erro)) ? "SUPABASE_RLS_DENIED" : "SUPABASE_SYNC_FAILED",
      telemetry: opcoes.telemetry !== false && !String(caminho || "").includes("register_app_error"),
      silent: true
    });
  }
}

async function registrarSecurityLogSupabaseSilencioso(log) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !syncConfig.supabaseUrl) return;
  try {
    await requisicaoSupabase("/rest/v1/security_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: syncConfig.supabaseUserId,
        actor_email: log.usuario,
        action: log.acao,
        result: log.resultado,
        details: log.detalhes,
        device_id: log.dispositivo,
        user_agent: log.userAgent
      })
    });
  } catch (_) {}
}

async function registrarAuditLogSupabaseSilencioso(log) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return;
  try {
    await requisicaoSupabase("/rest/v1/audit_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: syncConfig.supabaseUserId || null,
        client_id: log.clientId || null,
        action: log.acao,
        details: log.detalhes || {}
      })
    });
  } catch (_) {}
}

async function tocarAcessoClienteSupabaseSilencioso() {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return;
  try {
    await requisicaoSupabase("/rest/v1/rpc/touch_client_access", {
      method: "POST",
      body: JSON.stringify({})
    });
  } catch (_) {}
}

function mesclarListaPorId(atual, novos, normalizador) {
  const mapa = new Map();
  (Array.isArray(atual) ? atual : []).forEach((item) => {
    const normalizado = normalizador(item);
    if (normalizado?.id) mapa.set(String(normalizado.id), normalizado);
  });
  (Array.isArray(novos) ? novos : []).forEach((item) => {
    const normalizado = normalizador(item);
    if (!normalizado?.id) return;
    const existente = mapa.get(String(normalizado.id));
    mapa.set(String(normalizado.id), existente ? { ...existente, ...normalizado } : normalizado);
  });
  return Array.from(mapa.values());
}

async function carregarSaasSupabaseSilencioso(opcoes = {}) {
  const renderizar = !!opcoes.renderizar;
  const feedback = !!opcoes.feedback;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) {
    definirEstadoClientesSaasRemoto({
      status: "missing-token",
      message: "Entre com a conta Supabase do superadmin para carregar clientes remotos.",
      detail: "NO_ACCESS_TOKEN"
    });
    logSuperadminSupabaseDebug("clientes não carregados", { code: "NO_ACCESS_TOKEN" });
    if (feedback) mostrarToast("Entre com a conta Supabase do superadmin para carregar clientes remotos.", "info", 6500);
    if (renderizar && telaAtual === "clientes" && isSuperAdmin()) renderApp();
    return { ok: false, code: "NO_ACCESS_TOKEN" };
  }
  definirEstadoClientesSaasRemoto({
    status: "loading",
    message: "Carregando clientes do Supabase...",
    detail: ""
  });
  if (renderizar && telaAtual === "clientes" && isSuperAdmin()) renderApp();
  try {
    const avisosPermissao = [];
    const carregarPerfis = (rota, nome) => requisicaoSupabase(rota).catch((erro) => {
      registrarDiagnostico("Supabase/RLS", `${nome} não carregados`, erro.message);
      registrarErroAplicacaoSilencioso("SUPABASE_RLS_DENIED", erro, `${nome} não carregados`, { rota });
      const classificado = classificarFalhaClientesSaasRemoto(erro);
      avisosPermissao.push({ nome, status: classificado.status, detail: classificado.detail });
      logSuperadminSupabaseDebug(`${nome} não carregados`, classificado.log);
      return [];
    });
    const [clientesOnline, assinaturasOnline, pagamentosOnline, planosOnline, perfisOnline, perfisErpOnline] = await Promise.all([
      requisicaoSupabase(`/rest/v1/clients?select=*&order=created_at.desc&limit=${SUPERADMIN_PAGE_SIZE}`),
      requisicaoSupabase(`/rest/v1/subscriptions?select=*,plans(*)&order=created_at.desc&limit=${SUPERADMIN_PAGE_SIZE}`),
      requisicaoSupabase(`/rest/v1/payments?select=*&order=created_at.desc&limit=${SUPERADMIN_PAGE_SIZE}`),
      requisicaoSupabase("/rest/v1/plans?select=*&order=price.asc"),
      carregarPerfis(`/rest/v1/profiles?select=*&order=created_at.desc&limit=${SUPERADMIN_PAGE_SIZE}`, "profiles"),
      carregarPerfis(`/rest/v1/erp_profiles?select=*&order=created_at.desc&limit=${SUPERADMIN_PAGE_SIZE}`, "erp_profiles")
    ]);
    saasClients = mesclarListaPorId(saasClients, clientesOnline, normalizarClienteSaas);
    saasSubscriptions = mesclarListaPorId(saasSubscriptions, assinaturasOnline, normalizarAssinaturaSaas);
    saasPayments = mesclarListaPorId(saasPayments, pagamentosOnline, normalizarPagamentoSaas);
    saasPlans = mesclarListaPorId(saasPlans, planosOnline, normalizarPlanoSaas);
    usuarios = mesclarUsuariosSupabase(usuarios, [...perfisOnline, ...perfisErpOnline]);
    StateStore.set("usuarios", usuarios);
    salvarDados();
    if (avisosPermissao.some((aviso) => aviso.status === "permission-error")) {
      definirEstadoClientesSaasRemoto({
        status: "permission-warning",
        message: "Clientes carregados, mas parte dos perfis foi bloqueada por permissão/RLS.",
        detail: "PARTIAL_RLS"
      });
    } else {
      definirEstadoClientesSaasRemoto({
        status: "success",
        message: "Clientes remotos atualizados.",
        detail: ""
      });
    }
    if (feedback) mostrarToast("Clientes Supabase atualizados.", "sucesso", 4000);
    if (renderizar && telaAtual === "clientes" && isSuperAdmin()) renderApp();
    return { ok: true, clientes: Array.isArray(clientesOnline) ? clientesOnline.length : 0 };
  } catch (erro) {
    const classificado = classificarFalhaClientesSaasRemoto(erro);
    definirEstadoClientesSaasRemoto({
      status: classificado.status,
      message: classificado.message,
      detail: classificado.detail
    });
    logSuperadminSupabaseDebug("clientes não carregados", classificado.log);
    registrarDiagnostico("Supabase", "Dados SaaS online não carregados", erro.message);
    registrarErroAplicacaoSilencioso("LOAD_CLIENTS_FAILED", erro, "Carregar clientes Supabase", { status: classificado.status, detail: classificado.detail });
    if (feedback) mostrarToast(classificado.message, "erro", 6500);
    if (renderizar && telaAtual === "clientes" && isSuperAdmin()) renderApp();
    return { ok: false, code: classificado.detail };
  }
}

async function atualizarClientesSaasRemoto() {
  if (!isSuperAdmin()) return;
  await carregarSaasSupabaseSilencioso({ renderizar: true, feedback: true });
}

async function registrarClienteSaasSupabase({ nome, email, negocio, telefone, planSlug = "premium_trial" }) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return null;
  return await requisicaoSupabase("/rest/v1/rpc/register_saas_client", {
    method: "POST",
    body: JSON.stringify({
      p_name: negocio,
      p_responsible_name: nome,
      p_email: email,
      p_phone: telefone || null,
      p_plan_slug: planSlug,
      p_trial_days: DEFAULT_TRIAL_DAYS
    })
  });
}

function logFalhaSyncSaas(tabela, erro) {
  try {
    console.warn("[Supabase pós-login]", tabela, {
      mensagem: String(erro?.message || erro || "").slice(0, 180),
      status: erro?.details?.status || erro?.cause?.details?.status || "",
      rota: erro?.details?.caminho || erro?.cause?.details?.caminho || ""
    });
  } catch (_) {}
}

async function sincronizarUsuarioSaasAposLoginSupabase(usuario = getUsuarioAtual()) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl || !syncConfig.supabaseUserId) return null;
  const email = normalizarEmail(usuario?.email || syncConfig.supabaseEmail || "");
  const nome = usuario?.nome || email.split("@")[0] || "Usuario";
  const negocio = appConfig.businessName || saasClients.find((cliente) => normalizarEmail(cliente.email) === email)?.name || "Minha empresa 3D";
  const telefone = usuario?.phone || "";
  try {
    const resultado = await requisicaoSupabase("/rest/v1/rpc/sync_saas_user_after_login", {
      method: "POST",
      body: JSON.stringify({
        p_name: nome,
        p_business_name: negocio,
        p_phone: telefone
      })
    });
    if (resultado?.client_id) {
      const clientId = String(resultado.client_id);
      const companyId = resultado.company_id ? String(resultado.company_id) : "";
      if (usuario) usuario.clientId = clientId;
      if (usuario && companyId) usuario.companyId = companyId;
      billingConfig.clientId = clientId;
      if (companyId) billingConfig.companyId = companyId;
      billingConfig.licenseEmail = email || billingConfig.licenseEmail;
      if (resultado.subscription_id) billingConfig.subscriptionId = String(resultado.subscription_id);
      if (resultado.plan_slug) billingConfig.planSlug = String(resultado.plan_slug);
      if (resultado.status) billingConfig.licenseStatus = String(resultado.status);
      marcarUsuarioSupabaseSincronizado(usuario);
      salvarDados();
    }
    console.info("[Supabase pós-login] sync_saas_user_after_login OK", {
      clientId: resultado?.client_id || "",
      companyId: resultado?.company_id || "",
      subscriptionId: resultado?.subscription_id || "",
      plan: resultado?.plan_slug || ""
    });
    return resultado;
  } catch (erro) {
    logFalhaSyncSaas("sync_saas_user_after_login", erro);
    registrarDiagnostico("Supabase", "Sincronização pós-login falhou", erro.message);
    throw erro;
  }
}

async function garantirCadastroSaasOnlineAposLogin(usuario = getUsuarioAtual()) {
  if (!usuario || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return null;
  try {
    const sincronizado = await sincronizarUsuarioSaasAposLoginSupabase(usuario);
    if (sincronizado?.client_id) {
      usuario.clientId = String(sincronizado.client_id);
      if (sincronizado.company_id) usuario.companyId = String(sincronizado.company_id);
      billingConfig.clientId = usuario.clientId;
      if (usuario.companyId) billingConfig.companyId = usuario.companyId;
      if (sincronizado.subscription_id) billingConfig.subscriptionId = String(sincronizado.subscription_id);
      billingConfig.licenseEmail = normalizarEmail(usuario.email || syncConfig.supabaseEmail || billingConfig.licenseEmail);
      marcarUsuarioSupabaseSincronizado(usuario);
      salvarDados();
      const licencaSincronizada = await consultarLicencaSupabaseSilencioso();
      return licencaSincronizada?.client_id ? licencaSincronizada : sincronizado;
    }

    const licenca = await consultarLicencaSupabaseSilencioso();
    if (licenca?.client_id) {
      usuario.clientId = String(licenca.client_id);
      billingConfig.clientId = usuario.clientId;
      billingConfig.licenseEmail = normalizarEmail(usuario.email || syncConfig.supabaseEmail || billingConfig.licenseEmail);
      marcarUsuarioSupabaseSincronizado(usuario);
      salvarDados();
      return licenca;
    }

    const email = normalizarEmail(usuario.email || syncConfig.supabaseEmail || "");
    const clienteLocal = saasClients.find((cliente) => normalizarEmail(cliente.email) === email);
    const resultado = await registrarClienteSaasSupabase({
      nome: usuario.nome || clienteLocal?.responsibleName || email.split("@")[0],
      email,
      negocio: clienteLocal?.name || appConfig.businessName || "Minha empresa 3D",
      telefone: usuario.phone || clienteLocal?.phone || "",
      planSlug: "premium_trial"
    });

    if (resultado?.client_id) {
      const clientIdOnline = String(resultado.client_id);
      usuario.clientId = clientIdOnline;
      billingConfig.clientId = clientIdOnline;
      billingConfig.licenseEmail = email;
      if (clienteLocal) clienteLocal.id = clientIdOnline;
      if (resultado.client_code && clienteLocal) clienteLocal.clientCode = String(resultado.client_code);
      marcarUsuarioSupabaseSincronizado(usuario);
      salvarDados();
      registrarAuditoria("cadastro online sincronizado", { email }, clientIdOnline);
    }
    return resultado;
  } catch (erro) {
    marcarUsuarioSupabasePendente(usuario, erro.message);
    salvarDados();
    registrarDiagnostico("Supabase", "Cadastro SaaS online não sincronizado após login", erro.message);
    return null;
  }
}

async function consultarLicencaSupabaseSilencioso(options = {}) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return null;
  const targetUserId = String(options.targetUserId || options.userId || "").trim();
  const body = targetUserId ? { p_user_id: targetUserId } : {};
  try {
    const licenca = await requisicaoSupabase("/rest/v1/rpc/get_effective_license", {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (options.aplicar !== false) aplicarLicencaSaasOnline(licenca, { stale: false, source: "backend-rpc" });
    return licenca;
  } catch (erroNovo) {
    try {
      const licencaLegada = await requisicaoSupabase("/rest/v1/rpc/get_saas_license", {
        method: "POST",
        body: JSON.stringify({})
      });
      if (options.aplicar !== false) aplicarLicencaSaasOnline(licencaLegada, { stale: false, source: "backend-rpc-legacy" });
      return licencaLegada;
    } catch (erro) {
      registrarDiagnostico("Supabase", "Licença online não carregada", erro.message);
      registrarErroAplicacaoSilencioso("LOAD_SUBSCRIPTION_FAILED", erro, "Carregar licença SaaS", { newRpcError: erroNovo.message || String(erroNovo) });
      const cache = getLicencaEfetivaSnapshotLocal();
      if (cache && options.aplicar !== false) {
        billingConfig.effectiveLicenseStale = true;
        billingConfig.effectiveLicenseSource = "backend-rpc-cache-stale";
        salvarDados();
        return cache;
      }
      return null;
    }
  }
}

async function sincronizarLicencaEfetivaSePossivel(motivo = "manual") {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl || !syncConfig.supabaseUserId) return null;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    if (getLicencaEfetivaSnapshotLocal()) {
      billingConfig.effectiveLicenseStale = true;
      billingConfig.effectiveLicenseSource = "backend-rpc-cache-stale";
      salvarDados();
    }
    return null;
  }
  const agora = Date.now();
  const ultimo = Number(window.__simplificaEffectiveLicenseSyncAt || 0);
  if (agora - ultimo < 5000) return getLicencaEfetivaSnapshotLocal();
  window.__simplificaEffectiveLicenseSyncAt = agora;
  const licenca = await consultarLicencaSupabaseSilencioso({ motivo });
  if (licenca && ["assinatura", "minhaAssinatura", "admin"].includes(telaAtual)) renderizarPreservandoScroll();
  return licenca;
}

function aplicarLicencaSaasOnline(licenca = {}, options = {}) {
  if (!licenca || typeof licenca !== "object") return;
  const statusEfetivo = normalizarStatusLicencaEfetiva(licenca.effective_status || licenca.effectiveStatus || licenca.status);
  const isLicencaEfetiva = !!(licenca.effective_status || licenca.effectiveStatus || licenca.plan_code || licenca.planCode);
  const activePlanEfetivo = isLicencaEfetiva ? slugPlanoPorLicencaEfetiva(licenca) : "";
  if (licenca.client_id) billingConfig.clientId = String(licenca.client_id);
  if (licenca.company_id) billingConfig.companyId = String(licenca.company_id);
  if (licenca.subscription_id) billingConfig.subscriptionId = String(licenca.subscription_id);
  const licencaUserId = String(licenca.user_id || licenca.userId || "");
  const licencaEhDoUsuarioAtual = !licencaUserId || !syncConfig.supabaseUserId || licencaUserId === String(syncConfig.supabaseUserId);
  const usuarioAtualLicenca = licencaEhDoUsuarioAtual ? getUsuarioAtual() : null;
  if (usuarioAtualLicenca && licenca.client_id) {
    usuarioAtualLicenca.clientId = String(licenca.client_id);
    if (licenca.company_id) usuarioAtualLicenca.companyId = String(licenca.company_id);
    usuarioAtualLicenca.planStatus = statusLegadoPorLicencaEfetiva(statusEfetivo);
    usuarioAtualLicenca.planExpiresAt = licenca.premium_until || licenca.current_period_end || licenca.expires_at || usuarioAtualLicenca.planExpiresAt || "";
    marcarUsuarioSupabaseSincronizado(usuarioAtualLicenca);
  }
  if (isLicencaEfetiva) {
    billingConfig.effectiveUserId = String(licenca.user_id || syncConfig.supabaseUserId || "");
    billingConfig.effectivePlanCode = String(licenca.plan_code || licenca.planCode || "").toUpperCase();
    billingConfig.effectiveStatus = statusEfetivo;
    billingConfig.effectiveIsPremium = licenca.is_premium === true || licenca.has_full_access === true || [PLAN_ACCESS_STATES.TRIAL, PLAN_ACCESS_STATES.ACTIVE].includes(statusEfetivo);
    billingConfig.effectiveIsTrial = licenca.is_trial === true || licenca.is_trial_active === true || statusEfetivo === PLAN_ACCESS_STATES.TRIAL;
    billingConfig.effectiveIsPending = licenca.is_pending === true || statusEfetivo === PLAN_ACCESS_STATES.PENDING;
    billingConfig.effectiveIsBlocked = licenca.is_blocked === true || statusEfetivo === PLAN_ACCESS_STATES.BLOCKED;
    billingConfig.effectiveRemainingTrialDays = Math.max(0, Number(licenca.remaining_trial_days || licenca.remainingTrialDays || 0) || 0);
    billingConfig.effectiveLicenseSource = options.source || licenca.source || "backend-rpc";
    billingConfig.effectiveLicenseUpdatedAt = String(licenca.updated_at || new Date().toISOString());
    billingConfig.effectiveLicenseStale = options.stale === true;
    if (options.stale !== true) billingConfig.lastOnlineLicenseValidationAt = new Date().toISOString();
    billingConfig.activePlan = activePlanEfetivo;
    billingConfig.planSlug = activePlanEfetivo;
    billingConfig.licenseStatus = statusLegadoPorLicencaEfetiva(statusEfetivo);
  } else if (licenca.active_plan || licenca.plan_slug) {
    billingConfig.activePlan = normalizarSlugPlano(licenca.active_plan || licenca.plan_slug);
    billingConfig.planSlug = billingConfig.activePlan;
  }
  billingConfig.pendingPlan = licenca.pending_plan ? normalizarSlugPlano(licenca.pending_plan) : "";
  billingConfig.paymentStatus = normalizarStatusPagamento(licenca.payment_status || (statusEfetivo === PLAN_ACCESS_STATES.PENDING ? "pending" : "none"));
  billingConfig.subscriptionStatus = normalizarStatusAssinaturaDefinitivo(licenca.subscription_status || (billingConfig.activePlan === "premium_trial" ? "trialing" : billingConfig.activePlan === "premium" ? "active" : "free"));
  if (!isLicencaEfetiva) billingConfig.licenseStatus = normalizarStatusPlano(licenca.status || billingConfig.licenseStatus || "pending");
  billingConfig.licenseBlockLevel = String(licenca.block_level || (statusEfetivo === PLAN_ACCESS_STATES.BLOCKED ? "total" : "none"));
  billingConfig.planPrice = Math.max(0, Number(licenca.plan_price ?? billingConfig.planPrice ?? 0) || 0);
  billingConfig.priceLocked = licenca.price_locked === true || billingConfig.priceLocked === true;
  if (licenca.trial_start_at || licenca.trial_started_at) billingConfig.trialStartedAt = String(licenca.trial_start_at || licenca.trial_started_at);
  if (licenca.trial_end_at || licenca.trial_expires_at) billingConfig.trialExpiresAt = String(licenca.trial_end_at || licenca.trial_expires_at);
  if (licenca.trial_consumed_at) billingConfig.trialConsumedAt = String(licenca.trial_consumed_at);
  billingConfig.isTrialActive = licenca.is_trial_active === true || licenca.is_trial === true || statusEfetivo === PLAN_ACCESS_STATES.TRIAL;
  if (licenca.premium_until || licenca.current_period_end || licenca.expires_at) {
    billingConfig.paidUntil = String(licenca.premium_until || licenca.current_period_end || licenca.expires_at);
    billingConfig.planExpiresAt = billingConfig.paidUntil;
    billingConfig.premiumUntil = billingConfig.paidUntil;
  }
  billingConfig.blockedAt = licenca.blocked_at || "";
  billingConfig.blockedReason = licenca.blocked_reason || "";
  if (licenca.current_paid_price) billingConfig.monthlyPrice = Number(licenca.current_paid_price) || billingConfig.monthlyPrice;
  console.info("[Auth][license]", {
    auth_uid: syncConfig.supabaseUserId || "",
    effective_status: statusEfetivo,
    plan_code: billingConfig.effectivePlanCode || "",
    source: billingConfig.effectiveLicenseSource || options.source || "",
    stale: billingConfig.effectiveLicenseStale === true
  });

  let cliente = getClienteSaasPorId(billingConfig.clientId);
  if (!cliente && billingConfig.clientId) {
    cliente = normalizarClienteSaas({
      id: billingConfig.clientId,
      companyId: billingConfig.companyId || licenca.company_id || "",
      clientCode: licenca.client_code || "",
      name: appConfig.businessName || "Empresa 3D",
      email: billingConfig.licenseEmail || syncConfig.supabaseEmail || "",
      status: "active",
      planoAtual: licenca.active_plan || licenca.plan_slug || "free",
      statusAssinatura: licenca.status || "pending"
    });
    saasClients.push(cliente);
  }
  if (cliente) {
    if (licenca.client_code) cliente.clientCode = String(licenca.client_code);
    cliente.planoAtual = normalizarSlugPlano(licenca.active_plan || licenca.plan_slug || cliente.planoAtual);
    cliente.activePlan = billingConfig.activePlan;
    cliente.pendingPlan = billingConfig.pendingPlan;
    cliente.paymentStatus = billingConfig.paymentStatus;
    cliente.subscriptionStatus = billingConfig.subscriptionStatus;
    cliente.planPrice = billingConfig.planPrice;
    cliente.priceLocked = billingConfig.priceLocked;
    cliente.planExpiresAt = billingConfig.planExpiresAt;
    cliente.trialStartedAt = billingConfig.trialStartedAt;
    cliente.trialExpiresAt = billingConfig.trialExpiresAt;
    cliente.trialConsumedAt = billingConfig.trialConsumedAt || cliente.trialConsumedAt || "";
    cliente.isTrialActive = billingConfig.isTrialActive;
    cliente.statusAssinatura = normalizarStatusPlano(licenca.status || cliente.statusAssinatura);
    cliente.blockedAt = licenca.blocked_at || "";
    cliente.blockedReason = licenca.blocked_reason || "";
    cliente.archivedAt = licenca.archived_at || cliente.archivedAt || "";
    cliente.anonymizedAt = licenca.anonymized_at || cliente.anonymizedAt || "";
    cliente.status = statusEfetivo === PLAN_ACCESS_STATES.BLOCKED || licenca.block_level === "total" ? "blocked" : licenca.status === "past_due" ? "overdue" : cliente.status === "anonymized" ? "anonymized" : "active";
    cliente.updatedAt = new Date().toISOString();
  }

  const assinatura = getAssinaturaSaas(billingConfig.clientId);
  if (assinatura) {
    assinatura.status = billingConfig.licenseStatus === "active" ? "active" : billingConfig.licenseStatus;
    assinatura.statusAssinatura = String(licenca.status_assinatura || licenca.status || assinatura.statusAssinatura);
    assinatura.planSlug = normalizarSlugPlano(licenca.active_plan || licenca.plan_slug || assinatura.planSlug);
    assinatura.planId = assinatura.planSlug;
    assinatura.activePlan = billingConfig.activePlan;
    assinatura.pendingPlan = billingConfig.pendingPlan;
    assinatura.paymentStatus = billingConfig.paymentStatus;
    assinatura.subscriptionStatus = billingConfig.subscriptionStatus;
    assinatura.planPrice = billingConfig.planPrice;
    assinatura.priceLocked = billingConfig.priceLocked;
    assinatura.userId = licenca.user_id || assinatura.userId;
    assinatura.promoUsed = licenca.promo_used === true || assinatura.promoUsed === true;
    assinatura.billingVariant = normalizarBillingVariant(licenca.billing_variant || assinatura.billingVariant);
    assinatura.currentPeriodStart = licenca.current_period_start || assinatura.currentPeriodStart;
    assinatura.currentPeriodEnd = licenca.current_period_end || licenca.expires_at || assinatura.currentPeriodEnd;
    assinatura.expiresAt = assinatura.currentPeriodEnd || assinatura.expiresAt;
    assinatura.planExpiresAt = assinatura.currentPeriodEnd || assinatura.planExpiresAt;
    assinatura.trialStartedAt = licenca.trial_start_at || licenca.trial_started_at || assinatura.trialStartedAt;
    assinatura.trialExpiresAt = licenca.trial_end_at || licenca.trial_expires_at || assinatura.trialExpiresAt;
    assinatura.trialConsumedAt = licenca.trial_consumed_at || assinatura.trialConsumedAt || "";
    assinatura.isTrialActive = licenca.is_trial_active === true || licenca.is_trial === true || statusEfetivo === PLAN_ACCESS_STATES.TRIAL;
    assinatura.nextBillingAt = licenca.next_billing_at || assinatura.currentPeriodEnd || assinatura.nextBillingAt;
    assinatura.mercadoPagoSubscriptionId = licenca.mercado_pago_subscription_id || assinatura.mercadoPagoSubscriptionId;
    assinatura.effectiveStatus = statusEfetivo;
    assinatura.planCode = billingConfig.effectivePlanCode || assinatura.planCode || "";
    assinatura.manualOverride = licenca.manual_override === true || assinatura.manualOverride === true;
    assinatura.manualOverrideReason = licenca.manual_override_reason || assinatura.manualOverrideReason || "";
    assinatura.blockedAt = licenca.blocked_at || "";
    assinatura.blockedReason = licenca.blocked_reason || "";
    assinatura.archivedAt = licenca.archived_at || assinatura.archivedAt || "";
    assinatura.anonymizedAt = licenca.anonymized_at || assinatura.anonymizedAt || "";
  } else if (billingConfig.clientId) {
    saasSubscriptions.push(normalizarAssinaturaSaas({
      id: billingConfig.subscriptionId || "",
      clientId: billingConfig.clientId,
      companyId: billingConfig.companyId || licenca.company_id || "",
      userId: licenca.user_id || syncConfig.supabaseUserId || "",
      planSlug: licenca.active_plan || licenca.plan_slug || "free",
      activePlan: licenca.active_plan || licenca.plan_slug || "free",
      pendingPlan: licenca.pending_plan || "",
      paymentStatus: licenca.payment_status || "none",
      subscriptionStatus: licenca.subscription_status || "",
      planPrice: licenca.plan_price || 0,
      priceLocked: licenca.price_locked === true,
      status: licenca.status || "pending",
      promoUsed: licenca.promo_used === true,
      billingVariant: licenca.billing_variant || "",
      currentPeriodStart: licenca.current_period_start || "",
      currentPeriodEnd: licenca.current_period_end || licenca.expires_at || "",
      planExpiresAt: licenca.current_period_end || licenca.expires_at || "",
      trialStartedAt: licenca.trial_start_at || licenca.trial_started_at || "",
      trialExpiresAt: licenca.trial_end_at || licenca.trial_expires_at || "",
      trialConsumedAt: licenca.trial_consumed_at || "",
      isTrialActive: licenca.is_trial_active === true || licenca.is_trial === true || statusEfetivo === PLAN_ACCESS_STATES.TRIAL,
      expiresAt: licenca.expires_at || "",
      nextBillingAt: licenca.next_billing_at || "",
      mercadoPagoSubscriptionId: licenca.mercado_pago_subscription_id || "",
      effectiveStatus: statusEfetivo,
      planCode: billingConfig.effectivePlanCode || "",
      manualOverride: licenca.manual_override === true,
      manualOverrideReason: licenca.manual_override_reason || "",
      blockedAt: licenca.blocked_at || "",
      blockedReason: licenca.blocked_reason || "",
      archivedAt: licenca.archived_at || "",
      anonymizedAt: licenca.anonymized_at || ""
    }));
  }
  salvarDados();
  if (statusEfetivo === PLAN_ACCESS_STATES.BLOCKED && getUsuarioAtual() && !isSuperAdmin()) {
    if (window.__simplificaLastBlockedToast !== billingConfig.blockedAt) {
      window.__simplificaLastBlockedToast = billingConfig.blockedAt || new Date().toISOString();
      mostrarToast("Acesso bloqueado pelo Superadmin.", "erro", 7000);
    }
    if (!isTelaPublica(telaAtual)) {
      telaAtual = "acessoNegado";
      setTimeout(renderApp, 0);
    }
  }
}

async function alterarSenhaSupabaseSeConectado(novaSenha) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) return false;
  try {
    await requisicaoSupabase("/auth/v1/user", {
      method: "PUT",
      body: JSON.stringify({ password: novaSenha })
    });
    await requisicaoSupabase("/rest/v1/erp_profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: syncConfig.supabaseUserId,
        email: syncConfig.supabaseEmail || getUsuarioAtual()?.email || null,
        must_change_password: false,
        updated_at: new Date().toISOString()
      })
    }).catch((erro) => registrarDiagnostico("Supabase", "Flag de troca de senha não atualizada", erro.message));
    return true;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Senha local alterada, Supabase não atualizado", erro.message);
    return false;
  }
}

async function solicitarRecuperacaoSenha() {
  const emailInformado = await solicitarEntradaTexto({
    titulo: "Recuperar senha",
    mensagem: "Informe o e-mail para recuperação de senha.",
    tipo: "email"
  });
  const email = normalizarEmail(emailInformado || "");
  if (!email || !emailValido(email)) {
    alert("Se este e-mail existir, enviaremos instruções de recuperação.");
    return;
  }

  const token = "reset-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  passwordResetTokens = passwordResetTokens.filter((item) => Date.parse(item.expiresAt || 0) > Date.now() && item.email !== email);
  if (usuarios.some((usuario) => usuario.email === email)) {
    passwordResetTokens.push({
      email,
      token,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      usado: false
    });
  }

  try {
    atualizarConfigSupabaseCampos();
    if (syncConfig.supabaseUrl && syncConfig.supabaseAnonKey) {
      await requisicaoSupabase("/auth/v1/recover", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          redirect_to: montarRedirectSupabaseEmail("recovery")
        })
      });
    }
  } catch (erro) {
    registrarDiagnostico("Supabase", "Recuperação online não enviada", erro.message);
  }

  salvarDados();
  registrarSeguranca("Recuperação de senha solicitada", "sucesso", "Mensagem genérica", email);
  alert("Se este e-mail existir, enviaremos instruções de recuperação.");
}

function salvarSessaoSupabase(dados, email) {
  const sessao = dados?.session || dados || {};
  const usuario = obterUsuarioAuthResposta(dados) || {};
  if (!sessao.access_token || !usuario.id) return false;

  syncConfig.supabaseAccessToken = sessao.access_token;
  syncConfig.supabaseRefreshToken = sessao.refresh_token || syncConfig.supabaseRefreshToken || "";
  syncConfig.supabaseTokenExpiresAt = sessao.expires_at ? sessao.expires_at * 1000 : Date.now() + (Number(sessao.expires_in) || 3600) * 1000;
  syncConfig.supabaseUserId = usuario.id;
  syncConfig.supabaseEmail = normalizarEmail(usuario.email || email || syncConfig.supabaseEmail);
  syncConfig.supabaseEnabled = true;
  syncConfig.supabaseLastLogin = new Date().toISOString();
  registrarAtividadeUsuarioAtual("login", false);
  ativarEscopoDadosUsuarioAtual("supabase-session", { persistir: false });
  salvarSessaoSensivelSupabase();
  salvarDados();
  return true;
}

function obterUsuarioAuthResposta(dados) {
  if (!dados || typeof dados !== "object") return null;
  if (dados.user?.id) return dados.user;
  if (dados.session?.user?.id) return dados.session.user;
  if (dados.id && dados.email) return dados;
  return null;
}

function erroSupabaseEmailNaoConfirmado(erro) {
  const mensagem = String(erro?.message || erro || "").toLowerCase();
  return mensagem.includes("email_not_confirmed")
    || mensagem.includes("email not confirmed")
    || mensagem.includes("email não confirmado")
    || mensagem.includes("email nao confirmado")
    || (mensagem.includes("confirm") && mensagem.includes("email"));
}

function erroSupabaseCredenciaisInvalidas(erro) {
  const mensagem = String(erro?.message || erro || "").toLowerCase();
  return mensagem.includes("invalid login credentials")
    || mensagem.includes("invalid credentials")
    || mensagem.includes("credenciais")
    || mensagem.includes("invalid_grant");
}

function sessaoSupabaseValidaParaEmail(email) {
  const emailNormalizado = normalizarEmail(email);
  if (!emailNormalizado || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) return false;
  if (normalizarEmail(syncConfig.supabaseEmail) !== emailNormalizado) return false;
  const expiraEm = Number(syncConfig.supabaseTokenExpiresAt) || 0;
  return !expiraEm || expiraEm > Date.now() + 60000;
}

function deveConectarSupabaseNoLogin(usuario, email) {
  if (!usuario || !email || normalizarEmail(email) === SUPERADMIN_BOOTSTRAP_EMAIL) return false;
  if (!syncConfig.supabaseUrl || !syncConfig.supabaseAnonKey) return false;
  if (sessaoSupabaseValidaParaEmail(email)) return false;
  const clientId = String(usuario.clientId || "");
  return usuario.supabasePending === true
    || !usuario.supabaseUserId
    || !clientId
    || clientId.startsWith("client-");
}

function marcarUsuarioSupabasePendente(usuario, motivo = "") {
  if (!usuario) return;
  usuario.supabasePending = true;
  usuario.atualizadoEm = new Date().toISOString();
  if (motivo) registrarDiagnostico("Supabase", "Cadastro online pendente", motivo);
}

function marcarUsuarioSupabaseSincronizado(usuario) {
  if (!usuario) return;
  usuario.supabasePending = false;
  usuario.supabaseUserId = syncConfig.supabaseUserId || usuario.supabaseUserId || "";
  usuario.supabaseLastSyncAt = new Date().toISOString();
  usuario.atualizadoEm = usuario.supabaseLastSyncAt;
}

async function renovarSessaoSupabase() {
  if (!syncConfig.supabaseRefreshToken) return false;
  try {
    const dados = await requisicaoSupabase("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refresh_token: syncConfig.supabaseRefreshToken })
    }, false);
    return salvarSessaoSupabase(dados, syncConfig.supabaseEmail);
  } catch (erro) {
    registrarDiagnostico("Supabase", "Sessão expirada", erro.message);
    return false;
  }
}

async function autenticarSupabase(criarConta = false) {
  if (!validarSupabase(false)) return;

  const email = normalizarEmail(document.getElementById("supabaseEmail")?.value || syncConfig.supabaseEmail || getEmailLicencaAtual());
  const senha = document.getElementById("supabasePassword")?.value || "";
  if (!email || !senha) {
    alert("Informe e-mail e senha do Supabase.");
    return;
  }

  try {
    const caminho = criarConta ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    const payload = { email, password: senha };
    if (criarConta) payload.redirect_to = montarRedirectSupabaseEmail("signup");
    const dados = await requisicaoSupabase(caminho, {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });

    if (!salvarSessaoSupabase(dados, email)) {
      syncConfig.supabaseEmail = email;
      salvarDados();
      alert("Conta criada. Se o Supabase pedir confirmação de e-mail, confirme antes de entrar.");
      return;
    }

    await salvarPerfilSupabase();
    registrarHistorico("Supabase", criarConta ? "Conta criada/conectada" : "Login realizado");
    alert("Supabase conectado");
    renderApp();
  } catch (erro) {
    alert("Não foi possível autenticar no Supabase: " + erro.message);
  }
}

async function carregarPerfilSaasSupabase(usuario) {
  if (!syncConfig.supabaseUserId || !usuario) return usuario;
  let perfil = null;
  try {
    const linhas = await requisicaoSupabase(`/rest/v1/erp_profiles?select=*&id=eq.${encodeURIComponent(syncConfig.supabaseUserId)}&limit=1`, {
      method: "GET"
    });
    perfil = Array.isArray(linhas) ? linhas[0] : null;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Perfil online não carregado", erro.message);
  }

  if (!perfil) {
    try {
      const linhas = await requisicaoSupabase(`/rest/v1/profiles?select=*&user_id=eq.${encodeURIComponent(syncConfig.supabaseUserId)}&limit=1`, {
        method: "GET"
      });
      perfil = Array.isArray(linhas) ? linhas[0] : null;
    } catch (_) {}
  }

  if (perfil) {
    usuario.nome = perfil.display_name || perfil.name || usuario.nome;
    usuario.phone = normalizePhoneBR(perfil.phone || usuario.phone || "") || perfil.phone || usuario.phone || "";
    usuario.papel = normalizarPapel(perfil.role || usuario.papel);
    usuario.ativo = perfil.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = perfil.must_change_password === true && !usuario.passwordUpdatedAt;
    usuario.clientId = perfil.client_id || usuario.clientId || billingConfig.clientId || "";
    usuario.companyId = perfil.company_id || usuario.companyId || billingConfig.companyId || "";
    usuario.acceptedTermsAt = perfil.accepted_terms_at || usuario.acceptedTermsAt || "";
    const onboardingRemotoConcluido = perfil.onboarding_completed === true || perfil.onboardingCompleted === true;
    usuario.onboardingCompleted = usuario.onboardingCompleted === true || onboardingRemotoConcluido || onboardingConcluidoLocalmente(usuario);
    usuario.onboardingStep = usuario.onboardingCompleted
      ? 4
      : Math.max(Number(usuario.onboardingStep) || 0, Number(perfil.onboarding_step ?? perfil.onboardingStep) || 0);
    if (usuario.onboardingCompleted) {
      appConfig.companySetupCompleted = true;
      registrarOnboardingConcluidoLocalmente(usuario, true);
    }
  }

  if (await verificarSuperadminSupabaseSilencioso()) {
    usuario.papel = "superadmin";
    usuario.ativo = true;
    usuario.bloqueado = false;
  }

  if (usuario.clientId) {
    billingConfig.clientId = usuario.clientId;
    if (usuario.companyId) billingConfig.companyId = usuario.companyId;
    try {
      const clientesOnline = await requisicaoSupabase(`/rest/v1/clients?select=*&id=eq.${encodeURIComponent(usuario.clientId)}&limit=1`, {
        method: "GET"
      });
      const clienteOnline = Array.isArray(clientesOnline) ? clientesOnline[0] : null;
      if (clienteOnline) {
        const cliente = normalizarClienteSaas(clienteOnline);
        saasClients = saasClients.filter((item) => item.id !== cliente.id);
        saasClients.push(cliente);
      }
    } catch (_) {}

    try {
      const assinaturasOnline = await requisicaoSupabase(`/rest/v1/subscriptions?select=*,plans(*)&client_id=eq.${encodeURIComponent(usuario.clientId)}&limit=1`, {
        method: "GET"
      });
      const assinaturaOnline = Array.isArray(assinaturasOnline) ? assinaturasOnline[0] : null;
      if (assinaturaOnline) {
        const planoOnline = assinaturaOnline.plans ? normalizarPlanoSaas(assinaturaOnline.plans) : getPlanoSaas(billingConfig.planSlug);
        saasPlans = saasPlans.filter((item) => item.slug !== planoOnline.slug);
        saasPlans.push(planoOnline);
        const assinatura = normalizarAssinaturaSaas({
          ...assinaturaOnline,
          clientId: assinaturaOnline.client_id,
          planSlug: planoOnline.slug
        });
        saasSubscriptions = saasSubscriptions.filter((item) => item.id !== assinatura.id && item.clientId !== assinatura.clientId);
        saasSubscriptions.push(assinatura);
        billingConfig.subscriptionId = assinatura.id;
        billingConfig.planSlug = planoOnline.slug;
        billingConfig.licenseStatus = assinatura.status;
        billingConfig.paidUntil = assinatura.expiresAt;
        usuario.planStatus = assinatura.status;
        usuario.planExpiresAt = assinatura.expiresAt;
      }
    } catch (_) {}
  }

  await consultarLicencaSupabaseSilencioso().catch((erro) => {
    registrarDiagnostico("Supabase", "Licença efetiva não carregada após perfil", erro.message || erro);
  });
  salvarDados();
  return usuario;
}

async function verificarSuperadminSupabaseSilencioso() {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !syncConfig.supabaseUrl) return false;
  try {
    const resultado = await requisicaoSupabase("/rest/v1/rpc/erp_is_superadmin", {
      method: "POST",
      body: JSON.stringify({}),
      telemetry: false
    });
    if (resultado === true) return true;
    if (Array.isArray(resultado)) return resultado.some((item) => item === true || item?.erp_is_superadmin === true);
    if (resultado && typeof resultado === "object") return Object.values(resultado).some((valor) => valor === true);
  } catch (erro) {
    ErrorService.capture(erro, {
      area: "Supabase",
      action: "Verificar permissão superadmin",
      errorKey: "SUPERADMIN_RPC_UNAVAILABLE",
      silent: true
    });
  }

  const userId = encodeURIComponent(syncConfig.supabaseUserId);
  const consultas = [
    `/rest/v1/erp_profiles?select=role,status&id=eq.${userId}&limit=1`,
    `/rest/v1/profiles?select=role,status&user_id=eq.${userId}&limit=1`
  ];
  for (const caminho of consultas) {
    try {
      const linhas = await requisicaoSupabase(caminho, { method: "GET" });
      const perfil = Array.isArray(linhas) ? linhas[0] : null;
      if (perfil?.role === "superadmin" && perfil.status !== "blocked" && perfil.status !== "inactive") {
        return true;
      }
    } catch (erro) {
      ErrorService.capture(erro, {
        area: "Supabase",
        action: "Verificar perfil superadmin",
        errorKey: "SUPERADMIN_PROFILE_UNAVAILABLE",
        silent: true
      });
    }
  }
  return false;
}

async function loginUsuarioSupabase(email, senha) {
  syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
  syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
  const dados = await requisicaoSupabase("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password: senha })
  });
  if (!salvarSessaoSupabase(dados, email)) return null;

  try {
    await sincronizarUsuarioSaasAposLoginSupabase({
      nome: email.split("@")[0],
      email
    });
  } catch (erro) {
    logFalhaSyncSaas("loginUsuarioSupabase", erro);
  }

  let perfil = null;
  try {
    const linhas = await requisicaoSupabase(`/rest/v1/erp_profiles?select=*&id=eq.${encodeURIComponent(syncConfig.supabaseUserId)}&limit=1`, {
      method: "GET"
    });
    perfil = Array.isArray(linhas) ? linhas[0] : null;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Perfil online não carregado", erro.message);
  }

  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === email);
  if (!usuario) {
    usuario = normalizarUsuario({
      nome: perfil?.display_name || email.split("@")[0],
      email,
      clientId: perfil?.client_id || "",
      companyId: perfil?.company_id || "",
      phone: normalizePhoneBR(perfil?.phone || "") || perfil?.phone || "",
      papel: normalizarPapel(perfil?.role || "user"),
      ativo: perfil?.status !== "blocked" && perfil?.status !== "inactive",
      bloqueado: perfil?.status === "blocked" || perfil?.status === "inactive",
      mustChangePassword: !!perfil?.must_change_password,
      acceptedTermsAt: perfil?.accepted_terms_at || ""
    });
    usuarios.push(usuario);
  } else {
    usuario.nome = perfil?.display_name || usuario.nome;
    usuario.phone = normalizePhoneBR(perfil?.phone || usuario.phone || "") || perfil?.phone || usuario.phone || "";
    usuario.papel = normalizarPapel(perfil?.role || usuario.papel);
    usuario.ativo = perfil?.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil?.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = perfil && "must_change_password" in perfil ? perfil.must_change_password === true && !usuario.passwordUpdatedAt : usuario.mustChangePassword;
    usuario.clientId = perfil?.client_id || usuario.clientId || "";
    usuario.companyId = perfil?.company_id || usuario.companyId || "";
    usuario.acceptedTermsAt = perfil?.accepted_terms_at || usuario.acceptedTermsAt || "";
  }

  await carregarPerfilSaasSupabase(usuario);
  marcarUsuarioSupabaseSincronizado(usuario);
  await definirSenhaUsuario(usuario, senha, !!usuario.mustChangePassword);
  salvarDados();
  return usuario;
}

async function criarContaSupabaseParaUsuarioLocal(usuario, senha) {
  if (!usuario || !senha || normalizarEmail(usuario.email) === SUPERADMIN_BOOTSTRAP_EMAIL) return null;
  syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
  syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;

  const email = normalizarEmail(usuario.email);
  const clienteLocal = saasClients.find((cliente) => String(cliente.id) === String(usuario.clientId))
    || saasClients.find((cliente) => normalizarEmail(cliente.email) === email);
  const nome = usuario.nome || clienteLocal?.responsibleName || email.split("@")[0];
  const negocio = clienteLocal?.name || appConfig.businessName || "Minha empresa 3D";
  const telefone = usuario.phone || clienteLocal?.phone || "";
  const dados = await requisicaoSupabase("/auth/v1/signup", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email,
      password: senha,
      redirect_to: montarRedirectSupabaseEmail("signup"),
      data: {
        owner_name: nome,
        name: nome,
        company_name: negocio,
        business_name: negocio,
        phone: telefone,
        cnpj: clienteLocal?.cnpj || "",
        accepted_terms: true
      }
    })
  });

  if (!salvarSessaoSupabase(dados, email)) {
    syncConfig.supabaseEmail = email;
    marcarUsuarioSupabasePendente(usuario, "Aguardando confirmação de e-mail");
    salvarDados();
    return null;
  }

  const cadastroOnline = await registrarClienteSaasSupabase({
    nome,
    email,
    negocio,
    telefone,
    planSlug: normalizarSlugPlano(clienteLocal?.planoAtual || billingConfig.planSlug || "premium_trial")
  });

  if (cadastroOnline?.client_id) {
    const clientIdOnline = String(cadastroOnline.client_id);
    usuario.clientId = clientIdOnline;
    billingConfig.clientId = clientIdOnline;
    billingConfig.licenseEmail = email;
    if (clienteLocal) {
      clienteLocal.id = clientIdOnline;
      if (cadastroOnline.client_code) clienteLocal.clientCode = String(cadastroOnline.client_code);
    }
    if (cadastroOnline.subscription_id) billingConfig.subscriptionId = String(cadastroOnline.subscription_id);
    marcarUsuarioSupabaseSincronizado(usuario);
    await salvarPerfilSupabase();
    salvarDados();
  }

  return usuario;
}

function entrarSupabase() {
  autenticarSupabase(false);
}

function criarContaSupabase() {
  autenticarSupabase(true);
}

function obterUrlPublicaApp() {
  const origemAtual = typeof location !== "undefined" ? String(location.origin || "") : "";
  if (/^https?:\/\//i.test(origemAtual) && !/^(http:\/\/127\.0\.0\.1|http:\/\/localhost)/i.test(origemAtual)) {
    return origemAtual.replace(/\/+$/, "") + "/";
  }
  return String(APP_PUBLIC_URL || origemAtual || "").replace(/\/+$/, "") + "/";
}

function montarRedirectSupabaseEmail(fluxo = "") {
  const url = new URL(obterUrlPublicaApp());
  if (fluxo) url.searchParams.set("auth_flow", fluxo);
  return url.toString();
}

function montarRedirectSupabaseOAuth() {
  return location.origin + location.pathname;
}

function limparParametrosOAuthSupabase() {
  if (typeof window === "undefined" || !window.history) return;
  const url = new URL(location.href);
  ["auth_flow", "error", "error_code", "error_description", "msg", "type"].forEach((parametro) => url.searchParams.delete(parametro));
  url.hash = "";
  window.history.replaceState(null, document.title, url.pathname + (url.search ? url.search : ""));
}

function obterErroOAuthSupabase() {
  const search = new URLSearchParams(String(location.search || "").replace(/^\?/, ""));
  const hash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  const erro = search.get("error") || hash.get("error") || search.get("error_code") || hash.get("error_code");
  const descricao = search.get("error_description") || hash.get("error_description") || search.get("msg") || hash.get("msg") || "";
  if (!erro && !descricao) return null;
  return {
    erro: String(erro || "oauth_error"),
    descricao: String(descricao || "Login Google não concluído.")
  };
}

function obterTipoRetornoAuthSupabase() {
  const search = new URLSearchParams(String(location.search || "").replace(/^\?/, ""));
  const hash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  return String(hash.get("type") || search.get("auth_flow") || search.get("type") || "").toLowerCase();
}

function erroLinkAuthExpirado(erroOAuth) {
  const texto = `${erroOAuth?.erro || ""} ${erroOAuth?.descricao || ""}`.toLowerCase();
  return texto.includes("expired")
    || texto.includes("expir")
    || texto.includes("otp_expired")
    || texto.includes("token")
    || texto.includes("invalid");
}

async function garantirUsuarioLocalParaAuthSupabase(user) {
  const email = normalizarEmail(user?.email || syncConfig.supabaseEmail || "");
  if (!email) return null;
  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === email);
  if (!usuario) {
    const metadata = user?.user_metadata || {};
    usuario = normalizarUsuario({
      id: syncConfig.supabaseUserId || user?.id || criarIdUsuario(),
      nome: metadata.name || metadata.full_name || metadata.owner_name || email.split("@")[0],
      email,
      papel: "user",
      ativo: true,
      supabaseUserId: syncConfig.supabaseUserId || user?.id || "",
      supabasePending: false
    });
    usuarios.push(usuario);
  }
  await garantirCadastroSaasOnlineAposLogin(usuario);
  await carregarPerfilSaasSupabase(usuario);
  await sincronizarFilaOfflinePendente("auth-email").catch((erro) => registrarDiagnostico("sync", "Fila offline auth e-mail falhou", erro.message));
  return usuario;
}

async function atualizarSenhaSupabaseComSessao(novaSenha) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) {
    throw new Error("Sessão de recuperação inválida.");
  }
  await requisicaoSupabase("/auth/v1/user", {
    method: "PUT",
    body: JSON.stringify({ password: novaSenha })
  });
  registrarSeguranca("Senha redefinida", "sucesso", "Link de recuperação Supabase", syncConfig.supabaseEmail);
  registrarAuditoria("senha_redefinida", { origem: "supabase_recovery_link" });
}

function abrirModalRedefinicaoSenhaSupabase() {
  const popup = document.getElementById("popup");
  if (!popup) {
    mostrarToast("Abra o app novamente e entre com sua nova senha.", "info", 6000);
    return;
  }
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal-card" id="supabaseRecoveryPasswordForm">
        <div class="modal-header">
          <h2>Redefinir senha</h2>
          <button class="icon-button" type="button" id="supabaseRecoveryClose" title="Fechar">×</button>
        </div>
        <p class="muted">Crie uma nova senha para sua conta do Simplifica 3D.</p>
        <label class="field">
          <span>Nova senha</span>
          <input id="supabaseRecoveryPassword" type="password" autocomplete="new-password" required>
        </label>
        <label class="field">
          <span>Confirmar senha</span>
          <input id="supabaseRecoveryPasswordConfirm" type="password" autocomplete="new-password" required>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" id="supabaseRecoveryCancel">Depois</button>
          <button class="btn" type="submit" id="supabaseRecoverySave">Salvar senha</button>
        </div>
      </form>
    </div>
  `;
  const form = document.getElementById("supabaseRecoveryPasswordForm");
  const senhaInput = document.getElementById("supabaseRecoveryPassword");
  const confirmarInput = document.getElementById("supabaseRecoveryPasswordConfirm");
  const botao = document.getElementById("supabaseRecoverySave");
  const cancelar = () => fecharPopup();
  document.getElementById("supabaseRecoveryClose")?.addEventListener("click", cancelar, { once: true });
  document.getElementById("supabaseRecoveryCancel")?.addEventListener("click", cancelar, { once: true });
  popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) cancelar();
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const senha = senhaInput?.value || "";
    const confirmar = confirmarInput?.value || "";
    const erroSenha = mensagemValidacaoSenha(senha);
    if (erroSenha) {
      mostrarToast(erroSenha, "erro", 5000);
      return;
    }
    if (senha !== confirmar) {
      mostrarToast("As senhas não conferem.", "erro", 4500);
      return;
    }
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Salvando...";
    }
    try {
      await atualizarSenhaSupabaseComSessao(senha);
      fecharPopup();
      mostrarToast("Senha atualizada com sucesso.", "sucesso", 5000);
    } catch (erro) {
      ErrorService.capture(erro, { area: "Supabase", action: "Redefinir senha por link", silent: true });
      mostrarToast("Não foi possível salvar a nova senha. Solicite um novo link.", "erro", 6500);
      if (botao) {
        botao.disabled = false;
        botao.textContent = "Salvar senha";
      }
    }
  });
  setTimeout(() => senhaInput?.focus(), 120);
}

function loginGoogleSupabase() {
  syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
  syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
  if (!syncConfig.supabaseGoogleOAuthEnabled) {
    mostrarToast("Login Google desativado até o provedor ser habilitado no Supabase.", "erro", 7000);
    registrarDiagnostico("Supabase", "Login Google bloqueado localmente", "Provider desativado na configuração do app");
    return;
  }
  const redirectTo = montarRedirectSupabaseOAuth();
  const url = `${syncConfig.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  sessionStorage.setItem("supabaseOAuthProvider", "google");
  sessionStorage.setItem("supabaseOAuthRedirectTo", redirectTo);
  registrarAuditoria("login", { provider: "google_redirect" });
  mostrarToast("Abrindo login com Google...", "info", 2500);
  window.location.assign(url);
}

async function processarRetornoOAuthSupabase() {
  const tipoRetorno = obterTipoRetornoAuthSupabase();
  const providerRetorno = sessionStorage.getItem("supabaseOAuthProvider") || "";
  const erroOAuth = obterErroOAuthSupabase();
  if (erroOAuth) {
    registrarDiagnostico("Supabase", "Retorno de autenticação recusado", `${erroOAuth.erro}: ${erroOAuth.descricao}`);
    const mensagem = erroLinkAuthExpirado(erroOAuth)
      ? "Este link expirou. Solicite um novo e-mail."
      : erroOAuth.descricao.includes("Unsupported provider") || providerRetorno === "google"
        ? "Login Google ainda não está ativado no Supabase."
        : "Não foi possível concluir a autenticação.";
    mostrarToast(mensagem, "erro", 7000);
    sessionStorage.removeItem("supabaseOAuthProvider");
    sessionStorage.removeItem("supabaseOAuthRedirectTo");
    limparParametrosOAuthSupabase();
    return false;
  }

  const hash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  if (!accessToken) return false;

  const refreshToken = hash.get("refresh_token") || "";
  const expiresIn = Number(hash.get("expires_in") || 3600) || 3600;
  try {
    syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
    syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
    const resposta = await fetch(syncConfig.supabaseUrl + "/auth/v1/user", {
      headers: {
        apikey: syncConfig.supabaseAnonKey,
        Authorization: "Bearer " + accessToken
      }
    });
    if (!resposta.ok) throw new Error("OAuth inválido");
    const user = await resposta.json();
    const sessaoSalva = salvarSessaoSupabase({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      user
    }, user.email);
    if (!sessaoSalva) throw new Error("Sessão de autenticação inválida.");

    const usuario = await garantirUsuarioLocalParaAuthSupabase(user);
    sessionStorage.removeItem("supabaseOAuthProvider");
    sessionStorage.removeItem("supabaseOAuthRedirectTo");
    limparParametrosOAuthSupabase();
    if (usuario) concluirLoginUsuario(usuario);
    if (tipoRetorno === "recovery") {
      setTimeout(abrirModalRedefinicaoSenhaSupabase, 250);
    } else if (["signup", "email", "email_change"].includes(tipoRetorno)) {
      mostrarToast("Conta confirmada no Simplifica 3D.", "sucesso", 5000);
    }
    return true;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Retorno de autenticação não concluído", erro.message);
    limparParametrosOAuthSupabase();
    mostrarToast("Não foi possível concluir a autenticação. Tente entrar novamente.", "erro", 6500);
    return false;
  }
}

function sairSupabase() {
  const escopoAtual = getEscopoDadosAtual();
  if (escopoAtual) salvarCacheDadosUsuario(escopoAtual);
  pararRealtimeSyncUsuario("sair-supabase");
  limparSessaoSensivelSupabase();
  syncConfig.supabaseUserId = "";
  syncConfig.supabaseEmail = "";
  scopedDataCacheReady = false;
  localStorage.removeItem(ACTIVE_DATA_SCOPE_KEY);
  limparDadosOperacionaisLocais();
  limparCacheTemporarioContaAnterior();
  salvarDados();
  registrarHistorico("Supabase", "Sessão encerrada");
  renderApp();
}

async function salvarPerfilSupabase() {
  if (!syncConfig.supabaseUserId || !syncConfig.supabaseEmail) return false;
  try {
    const resultado = await sincronizarUsuarioSaasAposLoginSupabase(getUsuarioAtual() || {
      nome: syncConfig.supabaseEmail.split("@")[0],
      email: syncConfig.supabaseEmail
    });
    return !!resultado?.client_id;
  } catch (erro) {
    logFalhaSyncSaas("salvarPerfilSupabase", erro);
    registrarDiagnostico("Supabase", "Perfil não sincronizado", erro.message);
    return false;
  }
}

function tratarErroSupabase(erro) {
  if (/relation .*erp_backups|Could not find the table|schema cache/i.test(erro.message)) {
    return "Tabelas Supabase ainda não criadas. Rode: npx supabase link --project-ref qsufnnivlgdidmjuaprb && npx supabase db push";
  }
  return erro.message;
}

async function obterBackupSupabase() {
  const userId = encodeURIComponent(syncConfig.supabaseUserId);
  const linhas = await requisicaoSupabase(`/rest/v1/erp_backups?select=payload,updated_at&user_id=eq.${userId}&limit=1`, {
    method: "GET"
  });
  return Array.isArray(linhas) && linhas[0] ? linhas[0].payload : null;
}

async function obterRegistrosErpSupabase() {
  const userId = encodeURIComponent(syncConfig.supabaseUserId);
  const linhas = await requisicaoSupabase(`/rest/v1/erp_records?select=collection,record_id,user_id,owner_id,data,created_at,updated_at,deleted_at&user_id=eq.${userId}&deleted_at=is.null&limit=1000`, {
    method: "GET"
  });
  return Array.isArray(linhas) ? linhas : [];
}

function aplicarRegistrosErpSupabase(registros = []) {
  let alterou = false;
  (Array.isArray(registros) ? registros : []).forEach((registro) => {
    if (!registro || registro.deleted_at) return;
    alterou = aplicarRegistroRemotoRealtime(registro) || alterou;
  });
  if (alterou) {
    atribuirDonoRemotoDadosLocais();
    salvarDados();
  }
  return alterou;
}

async function aplicarBackupRemotoAntesDeUploadSeNecessario(motivo = "sync") {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) {
    return { remoto: null, aplicado: false };
  }

  const localTemDados = possuiDadosOperacionaisLocais();
  const pendentes = recomporFilaSyncPendente();
  if (localTemDados || pendentes.length) {
    return { remoto: null, aplicado: false };
  }

  const remoto = await obterBackupSupabase();
  if (backupTemDadosOperacionais(remoto)) {
    aplicarBackup(remoto, "substituir");
    registrarDiagnostico("Supabase", "Backup remoto aplicado antes do upload", motivo);
    return { remoto, aplicado: true };
  }

  const registros = await obterRegistrosErpSupabase();
  if (aplicarRegistrosErpSupabase(registros)) {
    registrarDiagnostico("Supabase", "Registros remotos aplicados antes do upload", motivo);
    return { remoto: null, aplicado: true };
  }

  return { remoto, aplicado: false };
}

async function salvarBackupSupabase() {
  const payload = criarSnapshotBackupUsuarioAtual();
  if (!verificarLimiteBackupPlano(payload, true)) return false;
  await requisicaoSupabase("/rest/v1/erp_backups?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: syncConfig.supabaseUserId,
      owner_id: getDataOwnerId(),
      device_id: deviceId,
      payload
    })
  });
  return true;
}

async function enviarBackupSupabase() {
  if (!validarSupabase(true)) return;
  if (!confirm("Enviar um backup completo para o Supabase?")) return;

  try {
    await salvarPerfilSupabase();
    if (!await salvarBackupSupabase()) return;
    const agora = new Date().toISOString();
    syncConfig.supabaseLastSync = agora;
    syncConfig.ultimoBackup = agora;
    syncConfig.ultimaSync = agora;
    salvarDados();
    registrarHistorico("Supabase", "Backup enviado");
    alert("Backup enviado para o Supabase");
    renderApp();
  } catch (erro) {
    alert("Não foi possível enviar para o Supabase: " + tratarErroSupabase(erro));
    registrarErroAplicacaoSilencioso("SUPABASE_SYNC_FAILED", erro, "Enviar backup Supabase");
  }
}

async function restaurarBackupSupabase() {
  if (!validarSupabase(true)) return;
  if (!confirm("Restaurar do Supabase vai substituir os dados locais deste aparelho. Continuar?")) return;

  try {
    const remoto = await obterBackupSupabase();
    if (!remoto) {
      alert("Nenhum backup Supabase encontrado para esta conta.");
      return;
    }
    aplicarBackup(remoto, "substituir");
    const agora = new Date().toISOString();
    syncConfig.supabaseLastSync = agora;
    syncConfig.ultimaSync = agora;
    salvarDados();
    registrarHistorico("Supabase", "Backup restaurado");
    alert("Backup restaurado do Supabase");
    renderApp();
  } catch (erro) {
    alert("Não foi possível restaurar do Supabase: " + tratarErroSupabase(erro));
    registrarErroAplicacaoSilencioso("SUPABASE_SYNC_FAILED", erro, "Restaurar backup Supabase");
  }
}

async function sincronizarSupabase() {
  if (!validarSupabase(true)) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    syncConfig.autoBackupStatus = "Offline";
    salvarDados();
    atualizarIndicadorSincronizacao("pending", "Na fila");
    mostrarToast("Erro de conexão", "erro", 5000);
    renderizarStatusSyncSeVisivel();
    return;
  }

  try {
    syncConfig.autoBackupStatus = "Sincronizando...";
    salvarDados();
    atualizarIndicadorSincronizacao("syncing", "Salvando");
    renderizarStatusSyncSeVisivel();
    mostrarToast("Sincronizando...", "info", 1800);
    await salvarPerfilSupabase();
    const preDownload = await aplicarBackupRemotoAntesDeUploadSeNecessario("sync-manual");
    await sincronizarFilaOfflinePendente("sync-manual");
    if (!await salvarBackupSupabase()) return;
    const remoto = preDownload.remoto || await obterBackupSupabase();
    if (remoto) {
      aplicarBackup(remoto, "mesclar");
    }
    await sincronizarFilaOfflinePendente("sync-manual-pos-merge");
    if (!await salvarBackupSupabase()) return;
    marcarSincronizacaoVisual("sync-manual");
    syncConfig.autoBackupStatus = "Sincronizado";
    salvarDados();
    registrarHistorico("Supabase", remoto ? "Dados mesclados e enviados" : "Backup inicial criado");
    atualizarIndicadorSincronizacao("success", "Salvo");
    mostrarToast("Dados sincronizados", "sucesso", 2800);
    renderizarStatusSyncSeVisivel();
  } catch (erro) {
    syncConfig.autoBackupStatus = "Erro ao sincronizar";
    salvarDados();
    console.warn("[Sync/Supabase] Falha ao sincronizar", erro);
    registrarErroAplicacaoSilencioso("SUPABASE_SYNC_FAILED", erro, "Sincronizar Supabase");
    atualizarIndicadorSincronizacao("error", "Offline");
    mostrarToast("Erro de conexão", "erro", 5000);
    renderizarStatusSyncSeVisivel();
  }
}

async function sincronizarSupabaseSilencioso() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    syncConfig.autoBackupStatus = "Offline";
    salvarDados();
    return false;
  }
  if (!temAcessoNuvem()) {
    syncConfig.autoBackupStatus = "Entre para sincronizar";
    salvarDados();
    return false;
  }

  if (!syncConfig.supabaseEnabled || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) {
    syncConfig.autoBackupStatus = "Entre no Supabase";
    salvarDados();
    return false;
  }

  const preDownload = await aplicarBackupRemotoAntesDeUploadSeNecessario("sync-silencioso");
  await sincronizarFilaOfflinePendente("sync-silencioso");
  if (!await salvarBackupSupabase()) return false;
  const remoto = preDownload.remoto || await obterBackupSupabase();
  if (remoto) {
    aplicarBackup(remoto, "mesclar");
  }
  await sincronizarFilaOfflinePendente("sync-silencioso-pos-merge");
  if (!await salvarBackupSupabase()) return false;

  marcarSincronizacaoVisual("sync-silencioso");
  syncConfig.autoBackupStatus = remoto ? "Supabase sincronizado" : "Backup criado no Supabase";
  salvarDados();
  registrarHistorico("Auto-backup", syncConfig.autoBackupStatus);
  return true;
}

function validarUrlNuvem() {
  if (!exigirAcessoNuvem()) return false;

  syncConfig = {
    ...syncConfig,
    ...lerConfigSyncCampos()
  };

  if (!syncConfig.cloudUrl) {
    alert("Configure a URL da nuvem primeiro");
    return false;
  }

  return true;
}

function navegadorSuportaPastaDrive() {
  return "showDirectoryPicker" in window;
}

function atualizarConfigDriveCampos() {
  if (!temAcessoNuvem()) return;

  syncConfig = {
    ...syncConfig,
    ...lerConfigSyncCampos()
  };
  salvarDados();
}

async function escolherPastaDrive() {
  if (!ENABLE_GOOGLE_DRIVE_BACKUP) {
    alert("Google Drive está desativado nesta versão. Use a sincronização pelo Supabase ou exporte um backup local.");
    return;
  }
  if (!exigirAcessoNuvem()) return;

  if (!navegadorSuportaPastaDrive()) {
    alert("Este navegador não permite escolher uma pasta local. No Windows, abra pelo Chrome ou Edge em http://localhost:5173.");
    return;
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: "erp3d-google-drive",
      mode: "readwrite"
    });

    driveFolderHandle = handle;
    await salvarDriveHandle(handle);
    syncConfig = {
      ...syncConfig,
      ...lerConfigSyncCampos(),
      driveFolderName: handle.name
    };
    salvarDados();
    registrarHistorico("Google Drive", "Pasta selecionada: " + handle.name);
    alert("Pasta do Google Drive selecionada");
    renderApp();
  } catch (erro) {
    if (erro.name !== "AbortError") {
      alert("Não foi possível selecionar a pasta: " + erro.message);
    }
  }
}

async function garantirPastaDrive() {
  atualizarConfigDriveCampos();

  const handle = await carregarDriveHandle();
  if (!handle) {
    alert("Escolha primeiro uma pasta dentro do Google Drive.");
    return null;
  }

  const opcoes = { mode: "readwrite" };
  if (handle.queryPermission && await handle.queryPermission(opcoes) !== "granted") {
    if (!handle.requestPermission || await handle.requestPermission(opcoes) !== "granted") {
      alert("Permissão negada para gravar na pasta do Google Drive.");
      return null;
    }
  }

  return handle;
}

async function escreverBackupDrive(handle, dados) {
  const nomeArquivo = syncConfig.driveFileName || "erp3d-backup.json";
  const arquivo = await handle.getFileHandle(nomeArquivo, { create: true });
  const writable = await arquivo.createWritable();
  await writable.write(JSON.stringify(dados, null, 2));
  await writable.close();
}

async function lerBackupDrive(handle) {
  try {
    const nomeArquivo = syncConfig.driveFileName || "erp3d-backup.json";
    const arquivo = await handle.getFileHandle(nomeArquivo);
    const file = await arquivo.getFile();
    return JSON.parse(await file.text());
  } catch (erro) {
    if (erro.name === "NotFoundError") {
      return null;
    }
    throw erro;
  }
}

async function enviarBackupGoogleDrive() {
  if (!ENABLE_GOOGLE_DRIVE_BACKUP) {
    alert("Google Drive está desativado nesta versão. Use a sincronização pelo Supabase ou exporte um backup local.");
    return;
  }
  if (!exigirAcessoNuvem()) return;

  const handle = await garantirPastaDrive();
  if (!handle) return;

  if (!confirm("Salvar um backup dentro da pasta escolhida do Google Drive? O Google Drive Desktop poderá enviar esse arquivo para a nuvem.")) return;

  try {
    await escreverBackupDrive(handle, criarSnapshotBackupUsuarioAtual());
    syncConfig.driveLastSync = new Date().toISOString();
    syncConfig.ultimoBackup = syncConfig.driveLastSync;
    salvarDados();
    registrarHistorico("Google Drive", "Backup salvo em " + syncConfig.driveFileName);
    alert("Backup salvo na pasta do Google Drive");
    renderApp();
  } catch (erro) {
    alert("Não foi possível salvar no Google Drive: " + erro.message);
  }
}

async function restaurarBackupGoogleDrive() {
  if (!ENABLE_GOOGLE_DRIVE_BACKUP) {
    alert("Google Drive está desativado nesta versão. Use a sincronização pelo Supabase ou importe um backup JSON.");
    return;
  }
  if (!exigirAcessoNuvem()) return;

  const handle = await garantirPastaDrive();
  if (!handle) return;

  if (!confirm("Restaurar o backup da pasta do Google Drive vai substituir os dados locais deste aparelho. Continuar?")) return;

  try {
    const dados = await lerBackupDrive(handle);
    if (!dados) {
      alert("Nenhum arquivo " + syncConfig.driveFileName + " foi encontrado nessa pasta.");
      return;
    }

    aplicarBackup(dados, "substituir");
    syncConfig.driveLastSync = new Date().toISOString();
    salvarDados();
    registrarHistorico("Google Drive", "Backup restaurado de " + syncConfig.driveFileName);
    alert("Backup restaurado do Google Drive");
    renderApp();
  } catch (erro) {
    alert("Não foi possível restaurar do Google Drive: " + erro.message);
  }
}

async function sincronizarGoogleDrive() {
  if (!ENABLE_GOOGLE_DRIVE_BACKUP) {
    alert("Google Drive está desativado nesta versão. Use a sincronização pelo Supabase.");
    return;
  }
  if (!exigirAcessoNuvem()) return;

  const handle = await garantirPastaDrive();
  if (!handle) return;

  if (!confirm("Sincronizar agora vai ler o backup da pasta do Google Drive, mesclar com este aparelho e gravar o resultado de volta na pasta. Continuar?")) return;

  try {
    const dadosRemotos = await lerBackupDrive(handle);
    if (dadosRemotos) {
      aplicarBackup(dadosRemotos, "mesclar");
    }

    await escreverBackupDrive(handle, criarSnapshotBackupUsuarioAtual());
    syncConfig.driveLastSync = new Date().toISOString();
    syncConfig.ultimoBackup = syncConfig.driveLastSync;
    syncConfig.ultimaSync = syncConfig.driveLastSync;
    salvarDados();
    registrarHistorico("Google Drive", dadosRemotos ? "Dados mesclados e salvos" : "Backup inicial criado");
    alert(dadosRemotos ? "Sincronização pelo Google Drive concluída" : "Backup inicial criado no Google Drive");
    renderApp();
  } catch (erro) {
    alert("Não foi possível sincronizar com o Google Drive: " + erro.message);
  }
}

async function sincronizarGoogleDriveSilencioso() {
  if (!ENABLE_GOOGLE_DRIVE_BACKUP) return false;
  if (!temAcessoNuvem()) {
    syncConfig.autoBackupStatus = "Entre para sincronizar";
    salvarDados();
    return false;
  }

  const handle = await garantirPastaDriveSilenciosa();
  if (!handle) return false;

  const dadosRemotos = await lerBackupDrive(handle);
  if (dadosRemotos) {
    aplicarBackup(dadosRemotos, "mesclar");
  }

  await escreverBackupDrive(handle, criarSnapshotBackupUsuarioAtual());
  const agora = new Date().toISOString();
  syncConfig.driveLastSync = agora;
  syncConfig.ultimoBackup = agora;
  syncConfig.ultimaSync = agora;
  syncConfig.autoBackupLastRun = agora;
  syncConfig.autoBackupStatus = dadosRemotos ? "Drive sincronizado" : "Backup criado no Drive";
  salvarDados();
  registrarHistorico("Auto-backup", syncConfig.autoBackupStatus);
  return true;
}

async function garantirPastaDriveSilenciosa() {
  atualizarConfigDriveCampos();

  const handle = await carregarDriveHandle();
  if (!handle) {
    syncConfig.autoBackupStatus = "Escolha a pasta Drive";
    salvarDados();
    return null;
  }

  const opcoes = { mode: "readwrite" };
  if (handle.queryPermission && await handle.queryPermission(opcoes) !== "granted") {
    syncConfig.autoBackupStatus = "Permissão Drive pendente";
    salvarDados();
    return null;
  }

  return handle;
}

async function sincronizarUrlSilencioso() {
  if (!temAcessoNuvem()) {
    syncConfig.autoBackupStatus = "Entre para sincronizar";
    salvarDados();
    return false;
  }

  if (!syncConfig.cloudUrl) {
    syncConfig.autoBackupStatus = "Configure a URL da nuvem";
    salvarDados();
    return false;
  }

  let remoto = null;
  const leitura = await fetch(syncConfig.cloudUrl, {
    method: "GET",
    headers: cabecalhosSync()
  });

  if (leitura.ok) {
    remoto = await leitura.json();
    aplicarBackup(remoto, "mesclar");
  }

  const escrita = await fetch(syncConfig.cloudUrl, {
    method: "PUT",
    headers: cabecalhosSync(),
    body: JSON.stringify(criarSnapshotBackup())
  });

  if (!escrita.ok) {
    throw new Error("HTTP " + escrita.status);
  }

  const agora = new Date().toISOString();
  syncConfig.ultimoBackup = agora;
  syncConfig.ultimaSync = agora;
  syncConfig.autoBackupLastRun = agora;
  syncConfig.autoBackupStatus = remoto ? "URL sincronizada" : "Backup enviado para URL";
  salvarDados();
  registrarHistorico("Auto-backup", syncConfig.autoBackupStatus);
  return true;
}

function obterIntervaloAutoBackupMs() {
  return Math.max(30, Number(syncConfig.autoBackupInterval) || 30) * 60 * 1000;
}

function iniciarAutoBackup() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }

  if (!temAcessoNuvem()) {
    syncConfig.autoBackupStatus = "Entre para sincronizar";
    salvarDados();
    return;
  }

  if (!syncConfig.autoBackupEnabled) {
    syncConfig.autoBackupStatus = "Desativado";
    salvarDados();
    return;
  }

  const intervalo = obterIntervaloAutoBackupMs();
  autoBackupTimer = setInterval(executarAutoBackup, intervalo);

  const ultimo = Date.parse(syncConfig.autoBackupLastRun || 0) || 0;
  if (!ultimo || Date.now() - ultimo >= intervalo) {
    setTimeout(executarAutoBackup, 10000);
  }
}

async function executarAutoBackup(forcar = false) {
  if ((!syncConfig.autoBackupEnabled && !forcar) || autoBackupRodando) return;

  autoBackupRodando = true;
  try {
    if (syncConfig.autoBackupTarget === "supabase") {
      await sincronizarSupabaseSilencioso();
    } else if (syncConfig.autoBackupTarget === "url") {
      await sincronizarUrlSilencioso();
    } else if (ENABLE_GOOGLE_DRIVE_BACKUP) {
      await sincronizarGoogleDriveSilencioso();
    } else {
      syncConfig.autoBackupTarget = "supabase";
      await sincronizarSupabaseSilencioso();
    }
  } catch (erro) {
    syncConfig.autoBackupStatus = "Erro: " + erro.message;
    salvarDados();
    registrarHistorico("Auto-backup", syncConfig.autoBackupStatus);
  } finally {
    autoBackupRodando = false;
    if (telaAtual === "config" || telaAtual === "dashboard") {
      agendarRenderizacaoPreservandoScroll(120);
    }
  }
}

async function executarAutoBackupManual() {
  if (!exigirAcessoNuvem()) return;

  syncConfig = {
    ...syncConfig,
    ...lerConfigSyncCampos()
  };
  salvarDados();
  await executarAutoBackup(true);
  alert(syncConfig.autoBackupStatus || "Auto-backup executado");
}

async function enviarBackupNuvem() {
  if (!validarUrlNuvem()) return;
  if (!confirm("Enviar pedidos, estoque, caixa, histórico e configurações para a nuvem configurada?")) return;

  try {
    const payload = criarSnapshotBackup();
    const resposta = await fetch(syncConfig.cloudUrl, {
      method: "PUT",
      headers: cabecalhosSync(),
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      throw new Error("HTTP " + resposta.status);
    }

    syncConfig.ultimoBackup = new Date().toISOString();
    syncConfig.ultimaSync = syncConfig.ultimoBackup;
    salvarDados();
    registrarHistorico("Nuvem", "Backup enviado");
    alert("Backup enviado para a nuvem");
    renderApp();
  } catch (erro) {
    alert("Não foi possível enviar para a nuvem: " + erro.message);
  }
}

async function restaurarBackupNuvem() {
  if (!validarUrlNuvem()) return;
  if (!confirm("Restaurar da nuvem vai substituir os dados locais deste aparelho. Continuar?")) return;

  try {
    const resposta = await fetch(syncConfig.cloudUrl, {
      method: "GET",
      headers: cabecalhosSync()
    });

    if (!resposta.ok) {
      throw new Error("HTTP " + resposta.status);
    }

    const dados = await resposta.json();
    aplicarBackup(dados, "substituir");
    syncConfig.ultimaSync = new Date().toISOString();
    salvarDados();
    registrarHistorico("Nuvem", "Backup restaurado");
    alert("Backup restaurado da nuvem");
    renderApp();
  } catch (erro) {
    alert("Não foi possível restaurar da nuvem: " + erro.message);
  }
}

async function sincronizarNuvem() {
  if (!validarUrlNuvem()) return;

  try {
    let remoto = null;
    const leitura = await fetch(syncConfig.cloudUrl, {
      method: "GET",
      headers: cabecalhosSync()
    });

    if (leitura.ok) {
      remoto = await leitura.json();
      aplicarBackup(remoto, "mesclar");
    }

    const payload = criarSnapshotBackup();
    const escrita = await fetch(syncConfig.cloudUrl, {
      method: "PUT",
      headers: cabecalhosSync(),
      body: JSON.stringify(payload)
    });

    if (!escrita.ok) {
      throw new Error("HTTP " + escrita.status);
    }

    syncConfig.ultimaSync = new Date().toISOString();
    syncConfig.ultimoBackup = syncConfig.ultimaSync;
    salvarDados();
    registrarHistorico("Nuvem", remoto ? "Dados mesclados e enviados" : "Dados enviados");
    alert("Sincronização concluída");
    renderApp();
  } catch (erro) {
    alert("Não foi possível sincronizar: " + erro.message);
  }
}

function importarBackup(arquivo) {
  if (!arquivo) return;
  if (!confirm("Importar este backup vai substituir os dados locais deste aparelho. Continuar?")) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(leitor.result);
      aplicarBackup(dados, "substituir");
      registrarHistorico("Backup", "Backup local importado");
      alert("Backup importado");
      renderApp();
    } catch (erro) {
      alert("Arquivo de backup inválido");
    }
  };
  leitor.readAsText(arquivo);
}

function zerarDadosAdmin() {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como admin para gerenciar os dados");
    return;
  }

  if (!confirm("Zerar todos os pedidos, estoque, caixa e histórico deste aparelho?")) return;
  if (!confirm("Confirme novamente: esta ação apaga os dados locais.")) return;

  estoque = [];
  caixa = [];
  pedidos = [];
  historico = [];
  itensPedido = [];
  clientePedido = "";
  clienteTelefonePedido = "";
  pedidoEditando = null;
  registrarHistorico("Admin", "Dados locais zerados");
  salvarDados();
  renderApp();
}

function atualizarClientePedido(valor) {
  clientePedido = valor;
}

function atualizarTelefoneClientePedido(valor) {
  clienteTelefonePedido = valor;
}

function editarNome(i, nome) {
  if (!itensPedido[i]) return;
  itensPedido[i].nome = nome;
}

function editarQtd(i, qtd) {
  if (!itensPedido[i]) return;
  let quantidade = 1;
  try {
    quantidade = InventoryService.parseNumberStrict(qtd, "quantidade", { min: 1 });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedido", action: "Editar quantidade" });
    return;
  }
  itensPedido[i].qtd = quantidade;
  itensPedido[i].total = quantidade * (Number(itensPedido[i].valor) || 0);
  renderApp();
}

function editarTipoImpressaoItem(i, tipo) {
  if (!itensPedido[i]) return;
  itensPedido[i].tipoImpressao = tipo === "RESINA" ? "RESINA" : "FDM";
  renderApp();
}

function editarTempoItem(i, tempo) {
  if (!itensPedido[i]) return;
  try {
    itensPedido[i].tempoHoras = InventoryService.parseNumberStrict(tempo, "tempo", { min: 0 });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedido", action: "Editar tempo" });
  }
}

function editarPreco(i, preco) {
  if (!itensPedido[i]) return;
  let valor = 0;
  try {
    valor = InventoryService.parseNumberStrict(preco, "valor", { min: 0 });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedido", action: "Editar valor" });
    return;
  }
  itensPedido[i].valor = valor;
  itensPedido[i].total = valor * (Number(itensPedido[i].qtd) || 1);
  renderApp();
}

async function iniciarAdicionarItemPedido() {
  const abrir = await solicitarConfirmacaoAcao({
    titulo: "Adicionar item",
    mensagem: "Deseja abrir a calculadora para calcular este item?",
    confirmar: "Sim, abrir calculadora",
    cancelar: "Adicionar manual"
  });
  if (abrir) {
    abrirCalculadora();
    return;
  }
  adicionarProdutoManual();
}

async function garantirRuntimeIAAtivo({ silent = false } = {}) {
  if (assistantRuntimeReady) return true;
  if (assistantRuntimePromise) return assistantRuntimePromise;
  const ativo = getModeloIAOfflineAtivoInstalado();
  if (!ativo) return false;
  assistantRuntimeLoading = true;
  if (!silent) renderizarPreservandoScroll();
  assistantRuntimePromise = promiseComTimeout(
    getAIPlugin()?.loadAiModel?.({
      modelId: ativo.modelo.id,
      modelPath: ativo.path,
      proAllowed: podeUsarAssistenteIAOfflinePro(),
      timeoutMs: 120000
    }),
    125000,
    "Carregamento da IA demorou demais."
  )
    .then((runtime) => {
      if (!runtime?.ok) throw new Error(runtime?.message || "A IA não carregou neste aparelho.");
      setAIModelLocalState(ativo.modelo.id, {
        status: AI_INSTALL_STATUS.INSTALLED_READY,
        runtimeLoadedAt: new Date().toISOString(),
        progress: 100,
        lastError: ""
      });
      assistantRuntimeReady = true;
      assistantRuntimeDiagnostics = null;
      obterDiagnosticoRuntimeIA({ force: true }).catch(() => {});
      return true;
    })
    .catch((erro) => {
      assistantRuntimeReady = false;
      registrarFalhaIALocal("runtime_warmup", erro, { modelId: ativo.modelo.id });
      if (!silent) mostrarToast("IA instalada, mas não iniciou neste aparelho.", "erro", 5200);
      return false;
    })
    .finally(() => {
      assistantRuntimeLoading = false;
      assistantRuntimePromise = null;
      renderizarPreservandoScroll();
    });
  return assistantRuntimePromise;
}

async function removerItem(i) {
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Remover item",
    mensagem: "Remover este item do pedido?",
    confirmar: "Remover",
    cancelar: "Cancelar",
    perigo: true
  });
  if (!confirmado) return;
  itensPedido.splice(i, 1);
  renderApp();
}

function garantirMateriaisItem(i) {
  if (!itensPedido[i]) return [];
  itensPedido[i] = normalizarItemPedido(itensPedido[i]);
  if (!Array.isArray(itensPedido[i].materiais)) itensPedido[i].materiais = [];
  return itensPedido[i].materiais;
}

function editarMaterialItem(itemIndex, materialIndex, materialId) {
  const materiais = garantirMateriaisItem(itemIndex);
  const material = getMaterialEstoque(materialId);
  materiais[materialIndex] = {
    ...(materiais[materialIndex] || {}),
    materialId,
    nome: material?.nome || "",
    gramas: Number(materiais[materialIndex]?.gramas) || 0
  };
  renderApp();
}

function editarGramasItem(itemIndex, materialIndex, gramas) {
  const materiais = garantirMateriaisItem(itemIndex);
  try {
    materiais[materialIndex] = {
      ...(materiais[materialIndex] || {}),
      gramas: InventoryService.parseNumberStrict(gramas, "gramas", { min: 0 })
    };
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Editar gramas" });
  }
}

function adicionarMaterialProduto(itemIndex) {
  const materiais = garantirMateriaisItem(itemIndex);
  materiais.push({ materialId: normalizarEstoque()[0]?.id || "", gramas: 0 });
  renderApp();
}

function removerMaterialProduto(itemIndex, materialIndex) {
  const materiais = garantirMateriaisItem(itemIndex);
  materiais.splice(materialIndex, 1);
  renderApp();
}

function adicionarProdutoManual() {
  itensPedido.push(normalizarItemPedido({
    nome: "Produto 3D",
    tipoImpressao: "FDM",
    qtd: 1,
    valor: 0,
    total: 0,
    materiais: []
  }));
  renderApp();
}

async function solicitarSenhaConfirmacaoAdmin(actionLabel = "continuar") {
  return new Promise((resolve) => {
    const popup = document.getElementById("popup");
    if (!popup) {
      resolve(null);
      return;
    }

    popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <form class="modal-card" id="adminPasswordConfirmForm">
          <div class="modal-header">
            <h2>Confirmar autorização</h2>
            <button class="icon-button" type="button" id="adminPasswordCancelTop" title="Fechar">✕</button>
          </div>
          <p class="muted">Para ${escaparHtml(actionLabel)}, confirme sua senha de administrador.</p>
          <label class="field">
            <span>Senha</span>
            <input id="adminPasswordConfirmInput" type="password" autocomplete="current-password" required>
          </label>
          <div class="actions">
            <button class="btn ghost" type="button" id="adminPasswordCancel">Cancelar</button>
            <button class="btn" type="submit">Confirmar</button>
          </div>
        </form>
      </div>
    `;

    const finalizar = (valor) => {
      fecharPopup();
      resolve(valor);
    };
    document.getElementById("adminPasswordConfirmForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      finalizar(document.getElementById("adminPasswordConfirmInput")?.value || "");
    }, { once: true });
    document.getElementById("adminPasswordCancel")?.addEventListener("click", () => finalizar(null), { once: true });
    document.getElementById("adminPasswordCancelTop")?.addEventListener("click", () => finalizar(null), { once: true });
    popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) finalizar(null);
    });
    setTimeout(() => document.getElementById("adminPasswordConfirmInput")?.focus(), 80);
  });
}

async function validarSenhaSupabaseUsuarioAtual(senha) {
  if (!senha) return false;
  const usuario = getUsuarioAtual();
  const email = normalizarEmail(usuario?.email || usuarioAtualEmail || syncConfig.supabaseEmail || "");
  if (!email || !syncConfig.supabaseUrl || !syncConfig.supabaseAnonKey || !syncConfig.supabaseUserId) {
    // TODO: manter esta rotina conectada ao Supabase Auth em produção. Sem auth.uid, não autorizar ações destrutivas.
    return false;
  }

  const dados = await requisicaoSupabase("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    telemetry: false,
    body: JSON.stringify({ email, password: senha })
  }, false);
  const authUser = obterUsuarioAuthResposta(dados);
  return String(authUser?.id || "") === String(syncConfig.supabaseUserId || "");
}

async function confirmAdminPassword(actionLabel = "continuar") {
  const agora = Date.now();
  if (adminAuthValidUntil && adminAuthValidUntil > agora) return true;
  const biometria = await confirmarBiometriaSeDisponivel(`Confirme para ${actionLabel}.`);
  if (biometria.disponivel && biometria.ok) {
    adminAuthValidUntil = Date.now() + 3 * 60 * 1000;
    registrarAuditoria("biometria_admin_validada", { action: actionLabel });
    registrarSeguranca("biometria_admin_validada", "sucesso", actionLabel);
    return true;
  }
  const senha = await solicitarSenhaConfirmacaoAdmin(actionLabel);
  if (senha === null) return false;
  if (!senha) {
    mostrarToast("Senha incorreta. Alteração não autorizada.", "erro", 5500);
    registrarAuditoria("senha_admin_falhou", { action: actionLabel, motivo: "senha_vazia" });
    registrarSeguranca("senha_admin_falhou", "erro", actionLabel);
    return false;
  }

  try {
    const ok = await validarSenhaSupabaseUsuarioAtual(senha);
    if (ok) {
      adminAuthValidUntil = Date.now() + 3 * 60 * 1000;
      registrarAuditoria("senha_admin_validada", { action: actionLabel });
      registrarSeguranca("senha_admin_validada", "sucesso", actionLabel);
      return true;
    }
  } catch (erro) {
    registrarDiagnostico("Auth", "Senha administrativa não validada", erro.message, { silent: true });
  }

  registrarAuditoria("senha_admin_falhou", { action: actionLabel });
  registrarSeguranca("senha_admin_falhou", "erro", actionLabel);
  mostrarToast(actionLabel.includes("excluir")
    ? "Senha incorreta. Exclusão não autorizada."
    : "Senha incorreta. Alteração não autorizada.", "erro", 6000);
  return false;
}

async function requireAdminPassword(actionName) {
  return confirmAdminPassword(actionName);
}

function registrarAuditoriaPedido(acao, pedido, detalhes = {}) {
  registrarAuditoria(acao, {
    pedidoId: pedido?.id || "",
    cliente: clienteDoPedido(pedido || {}),
    status: pedido?.status || "",
    total: totalPedido(pedido || {}),
    ...detalhes
  });
}

async function requestOrderEdit(orderId) {
  try {
    if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para editar pedidos.")) return;
    const pedido = pedidos.find((item) => Number(item.id) === Number(orderId));
    if (!pedido) return;
    if (!await confirmAdminPassword("editar este pedido")) return;
    abrirPedidoParaEdicaoAutorizada(orderId);
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedidos", action: "Solicitar edição de pedido", errorKey: "REQUEST_ORDER_EDIT_FAILED" });
  }
}

async function editarPedido(id) {
  return requestOrderEdit(id);
}

function abrirPedidoParaEdicaoAutorizada(id) {
  try {
    const pedido = pedidos.find((item) => Number(item.id) === Number(id));
    if (!pedido) return;
    const itens = Array.isArray(pedido.itens) && pedido.itens.length
      ? pedido.itens
      : [{
          nome: pedido.nome || "Item",
          qtd: 1,
          valor: totalPedido(pedido),
          total: totalPedido(pedido)
        }];

    itensPedido = JSON.parse(JSON.stringify(itens));
    clientePedido = clienteDoPedido(pedido);
    clienteTelefonePedido = telefoneDoPedido(pedido);
    pedidoEditando = pedido;
    pedidoEditandoOriginal = JSON.parse(JSON.stringify(pedido));
    registrarAuditoriaPedido("pedido_edicao_solicitada", pedido);
    trocarTela("pedido");
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedidos", action: "Abrir pedido para edição", errorKey: "OPEN_ORDER_FAILED" });
  }
}

function cancelarEdicaoPedido() {
  pedidoEditando = null;
  pedidoEditandoOriginal = null;
  itensPedido = [];
  clientePedido = "";
  clienteTelefonePedido = "";
  renderizarPreservandoScroll();
}

function pedidoPossuiConsumoEstoque(pedido) {
  return calcularConsumoMateriais(pedido?.itens || []).size > 0;
}

function movimentoCaixaPertenceAoPedido(movimento, pedido) {
  if (!movimento || !pedido) return false;
  const id = Number(pedido.id);
  if (Number(movimento.pedidoId) === id) return true;
  const total = totalPedido(pedido);
  const cliente = clienteDoPedido(pedido);
  return Number(movimento.valor) === total && descricaoCaixa(movimento) === "Pedido - " + cliente;
}

function movimentosCaixaPedido(pedido) {
  return caixa.filter((movimento) => movimentoCaixaPertenceAoPedido(movimento, pedido));
}

function pedidoJaCancelado(pedido) {
  return !!(pedido?.deleted_at || pedido?.deletedAt || String(pedido?.status || "").toLowerCase() === "cancelado");
}

function criarLancamentoReversoCaixaPedido(pedido, movimentos, agora) {
  if (!movimentos.length) return null;
  const jaTemReversao = caixa.some((movimento) => String(movimento.cancelamentoPedidoId || movimento.estornoPedidoId || "") === String(pedido.id));
  if (jaTemReversao) return null;

  const saldo = movimentos.reduce((soma, movimento) => {
    const valor = Number(movimento.valor) || 0;
    return soma + (String(movimento.tipo || "").toLowerCase() === "saida" ? -valor : valor);
  }, 0);
  if (Math.abs(saldo) < 0.01) return null;

  return prepararRegistroOnline({
    id: Date.now() + Math.floor(Math.random() * 1000),
    tipo: saldo > 0 ? "saida" : "entrada",
    valor: Math.abs(saldo),
    descricao: "Estorno pedido #" + pedido.id + " - " + clienteDoPedido(pedido),
    pedidoId: pedido.id,
    cancelamentoPedidoId: pedido.id,
    categoria: "estorno",
    data: agora,
    criadoEm: agora,
    atualizadoEm: agora
  });
}

async function cancelOrderSafely(orderId, options = {}) {
  try {
    if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para cancelar pedidos.")) return;
    const pedido = pedidos.find((item) => Number(item.id) === Number(orderId));
    if (!pedido) return;
    if (pedidoJaCancelado(pedido)) {
      mostrarToast("Este pedido já está cancelado.", "info", 4200);
      return;
    }

    const agora = new Date().toISOString();
    const movimentos = movimentosCaixaPedido(pedido);
    const devolverEstoque = options.returnStock === true && !pedido.stock_returned_at && !pedido.estoqueDevolvidoEm;
    if (devolverEstoque) devolverEstoquePedido(pedido, "cancelamento seguro");

    const reverso = criarLancamentoReversoCaixaPedido(pedido, movimentos, agora);
    if (reverso) caixa.push(reverso);

    const cancelado = marcarRegistroAlteradoParaSync(pedido, {
      status: "cancelado",
      deleted_at: agora,
      deletedAt: agora,
      cancelled_by: syncConfig.supabaseUserId || getUsuarioAtual()?.id || "",
      cancelledBy: syncConfig.supabaseUserId || getUsuarioAtual()?.id || "",
      cancel_reason: options.reason || "Cancelamento manual",
      cancelReason: options.reason || "Cancelamento manual",
      stock_returned_at: devolverEstoque ? agora : pedido.stock_returned_at || "",
      estoqueDevolvidoEm: devolverEstoque ? agora : pedido.estoqueDevolvidoEm || "",
      financial_reversed_at: reverso ? agora : pedido.financial_reversed_at || ""
    });
    pedidos = pedidos.map((item) => Number(item.id) === Number(orderId) ? cancelado : item);

    if (pedidoEditando && Number(pedidoEditando.id) === Number(orderId)) {
      cancelarEdicaoPedido();
    }

    salvarDados();
    agendarSyncSilenciosoDados("pedido-cancelado");
    registrarAuditoriaPedido("pedido_cancelado", cancelado, {
      devolveuEstoque: devolverEstoque,
      movimentosCaixa: movimentos.length,
      reversaoCaixa: !!reverso
    });
    registrarAuditoriaPedido("pedido_excluido", cancelado, { modo: "cancelamento_logico" });
    registrarHistorico("Pedido", "Pedido cancelado: " + clienteDoPedido(cancelado));
    mostrarToast("Pedido cancelado com sucesso.", "sucesso", 4200);
    renderizarPreservandoScroll();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedidos", action: "Cancelar pedido com segurança", errorKey: "CANCEL_ORDER_FAILED" });
  }
}

async function requestOrderDelete(orderId) {
  try {
    if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para excluir pedidos.")) return;
    const pedido = pedidos.find((item) => Number(item.id) === Number(orderId));
    if (!pedido) return;
    registrarAuditoriaPedido("pedido_exclusao_solicitada", pedido);

    const continuar = await solicitarConfirmacaoAcao({
      titulo: "Excluir pedido",
      mensagem: "Tem certeza que deseja excluir este pedido? Esta ação pode afetar histórico, caixa e estoque.",
      cancelar: "Cancelar",
      confirmar: "Continuar",
      perigo: true
    });
    if (!continuar) return;

    if (!await confirmAdminPassword("excluir este pedido")) return;

    let devolverEstoque = false;
    if (pedidoPossuiConsumoEstoque(pedido) && !pedido.stock_returned_at && !pedido.estoqueDevolvidoEm) {
      devolverEstoque = await solicitarConfirmacaoAcao({
        titulo: "Devolver estoque",
        mensagem: "Deseja devolver os materiais deste pedido ao estoque?",
        cancelar: "Não devolver",
        confirmar: "Devolver materiais",
        perigo: false
      });
    }

    await cancelOrderSafely(orderId, {
      returnStock: devolverEstoque,
      reason: "Cancelamento solicitado pelo usuário"
    });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedidos", action: "Solicitar exclusão de pedido", errorKey: "REQUEST_ORDER_DELETE_FAILED" });
  }
}

function removerPedido(id) {
  return requestOrderDelete(id);
}

// Baixa de estoque por diferença: evita descontar duas vezes ao editar e devolve no cancelamento.
function diffConsumoPedido(pedidoNovo, pedidoAntigo = null) {
  const novo = calcularConsumoMateriais(pedidoNovo?.itens || []);
  const antigo = calcularConsumoMateriais(pedidoAntigo?.itens || []);
  const ids = new Set([...novo.keys(), ...antigo.keys()]);
  return Array.from(ids).map((materialId) => ({
    materialId,
    kg: (novo.get(materialId) || 0) - (antigo.get(materialId) || 0)
  })).filter((item) => Math.abs(item.kg) > 0.000001);
}

function validarSaldoEstoque(diff) {
  try {
    return InventoryService.validateStockDiff(diff);
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Validar saldo" });
    return [ErrorService.toAppError(erro).userMessage];
  }
}

function aplicarDiffEstoque(diff, motivo = "pedido") {
  try {
    InventoryService.applyDiff(diff, motivo);
    return true;
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Aplicar baixa automática" });
    return false;
  }
}

function aplicarEstoquePedido(pedidoNovo, pedidoAntigo = null) {
  const diff = diffConsumoPedido(pedidoNovo, pedidoAntigo);
  const faltas = validarSaldoEstoque(diff);
  if (faltas.length) {
    alert("Estoque insuficiente:\n" + faltas.join("\n"));
    return false;
  }
  return aplicarDiffEstoque(diff, pedidoAntigo ? "edição de pedido" : "pedido");
}

function devolverEstoquePedido(pedido, motivo = "cancelamento") {
  const diff = diffConsumoPedido({ itens: [] }, pedido);
  aplicarDiffEstoque(diff, motivo);
}

async function fecharPedido() {
  try {
    if (pedidoSalvando) return;
    const planoAtual = getPlanoAtual();
    if (planoAtual.blockLevel === "total" || planoAtual.status === "bloqueado") {
      mostrarBloqueioPlano({ message: "Seu acesso está bloqueado. Regularize o plano para salvar pedidos." });
      return;
    }
    if (!pedidoEditando && !(await verificarLimitePedidosAntesCriar())) return;
    const campoCliente = document.getElementById("clienteNome");
    const cliente = (campoCliente?.value || clientePedido).trim();
    const telefoneCliente = normalizarTelefoneWhatsapp(document.getElementById("clienteTelefone")?.value || clienteTelefonePedido);

    if (!cliente) {
      alert("Digite o nome do cliente");
      return;
    }

    if (!pedidoEditando && !verificarLimiteClientesAntesPedido(cliente)) return;

    if (itensPedido.length === 0) {
      alert("Nenhum item no pedido");
      return;
    }

    const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
    const pedido = prepararRegistroOnline({
      id: pedidoEditando?.id || Date.now(),
      cliente,
      clienteTelefone: telefoneCliente,
      itens: JSON.parse(JSON.stringify(normalizarItensPedido(itensPedido))),
      total,
      status: document.getElementById("pedidoStatus")?.value || pedidoEditando?.status || "aberto",
      data: pedidoEditando?.data || new Date().toLocaleDateString("pt-BR"),
      criadoEm: pedidoEditando?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    });

    if (pedidoEditando && !window.__pedidoReviewConfirmed) {
      abrirRevisaoAlteracoesPedido(pedido, pedidoEditandoOriginal || pedidoEditando);
      return;
    }
    pedidoSalvando = true;

    if (!aplicarEstoquePedido(pedido, pedidoEditando)) {
      pedidoSalvando = false;
      window.__pedidoReviewConfirmed = false;
      return;
    }

    if (pedidoEditando) {
      const idAntigo = Number(pedidoEditando.id);
      pedidos = pedidos.filter((item) => Number(item.id) !== idAntigo);
      caixa = caixa.filter((movimento) => Number(movimento.pedidoId) !== idAntigo);
    }

    pedidos.push(pedido);
    caixa.push(prepararRegistroOnline({
      id: Date.now() + 1,
      tipo: "entrada",
      valor: total,
      descricao: "Pedido - " + cliente,
      pedidoId: pedido.id,
      data: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    }));

    salvarDados();
    agendarSyncSilenciosoDados(pedidoEditando ? "pedido-atualizado" : "pedido-fechado");
    if (pedidoEditando) registrarAuditoriaPedido("pedido_editado", pedido);
    registrarHistorico("Pedido", (pedidoEditando ? "Pedido atualizado: " : "Pedido fechado: ") + cliente);
    mostrarToast(pedidoEditando ? "Pedido atualizado com sucesso." : "Pedido salvo com sucesso.", "sucesso", 3500);
    registrarAcaoCompletaMonetizacao(pedidoEditando ? "order_updated" : "order_created");
    pedidoEditando = null;
    pedidoEditandoOriginal = null;
    itensPedido = [];
    clientePedido = "";
    clienteTelefonePedido = "";
    window.__pedidoReviewConfirmed = false;
    pedidoSalvando = false;
    if (appConfig.onboardingFirstOrderPending && deveMostrarOnboarding()) {
      finalizarOnboarding(false);
      return;
    }
    renderizarPreservandoScroll();
  } catch (erro) {
    pedidoSalvando = false;
    window.__pedidoReviewConfirmed = false;
    ErrorService.notify(erro, {
      area: "Pedidos",
      action: pedidoEditando ? "Atualizar pedido" : "Salvar pedido",
      errorKey: pedidoEditando ? "UPDATE_ORDER_FAILED" : "SAVE_ORDER_FAILED"
    });
  }
}

function descreverAlteracoesPedido(pedidoNovo, pedidoAntigo = {}) {
  const antigos = normalizarItensPedido(pedidoAntigo);
  const novos = normalizarItensPedido(pedidoNovo);
  const serializar = (item) => JSON.stringify({
    nome: item.nome,
    qtd: Number(item.qtd) || 1,
    valor: Number(item.valor) || 0,
    total: Number(item.total) || 0,
    tempoHoras: Number(item.tempoHoras) || 0,
    materiais: getMateriaisItem(item).map((mat) => ({ materialId: mat.materialId || "", gramas: Number(mat.gramas) || 0 }))
  });
  return {
    adicionados: novos.slice(antigos.length).map((item) => item.nome || "Item"),
    removidos: antigos.filter((_, index) => !novos[index]).map((item) => item.nome || "Item"),
    alterados: novos.filter((item, index) => antigos[index] && serializar(item) !== serializar(antigos[index])).map((item) => item.nome || "Item")
  };
}

function abrirRevisaoAlteracoesPedido(pedidoNovo, pedidoAntigo = {}) {
  const popup = document.getElementById("popup");
  if (!popup) return;
  const totalAnterior = totalPedido(pedidoAntigo);
  const novoTotal = totalPedido(pedidoNovo);
  const diff = descreverAlteracoesPedido(pedidoNovo, pedidoAntigo);
  const lista = (itens) => itens.length ? itens.map(escaparHtml).join(", ") : "Nenhum";
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal-card order-review-box">
        <div class="modal-header">
          <h2>Revise as alterações do pedido</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="sync-grid">
          <div class="metric"><span>Cliente</span><strong>${escaparHtml(clienteDoPedido(pedidoNovo))}</strong></div>
          <div class="metric"><span>Total anterior</span><strong>${formatarMoeda(totalAnterior)}</strong></div>
          <div class="metric"><span>Novo total</span><strong>${formatarMoeda(novoTotal)}</strong></div>
          <div class="metric"><span>Diferença</span><strong>${formatarMoeda(novoTotal - totalAnterior)}</strong></div>
        </div>
        <div class="history-list">
          <div class="history-item"><strong>Itens adicionados</strong><span class="muted">${lista(diff.adicionados)}</span></div>
          <div class="history-item"><strong>Itens removidos</strong><span class="muted">${lista(diff.removidos)}</span></div>
          <div class="history-item"><strong>Itens alterados</strong><span class="muted">${lista(diff.alterados)}</span></div>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" onclick="fecharPopup()">Voltar e editar</button>
          <button class="btn" type="button" onclick="confirmarRevisaoAlteracoesPedido()">Confirmar alterações</button>
          <button class="btn danger" type="button" onclick="cancelarEdicaoPedido();fecharPopup()">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

function confirmarRevisaoAlteracoesPedido() {
  window.__pedidoReviewConfirmed = true;
  fecharPopup();
  fecharPedido();
}

function alterarStatusPedido(id, status) {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar pedidos.")) return;
  const pedido = pedidos.find((item) => Number(item.id) === Number(id));
  if (!pedido) return;
  marcarRegistroLocalAlteradoParaSync(pedido, { status: status || "aberto" });
  salvarDados();
  agendarSyncSilenciosoDados("status-pedido");
  registrarHistorico("Produção", `Status do pedido ${id}: ${pedido.status}`);
  renderizarPreservandoScroll();
}

function addMaterial() {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar estoque.")) return;
  const tipo = document.getElementById("matTipo")?.value || "PLA";
  const cor = (document.getElementById("matCor")?.value || "").trim();
  const qtd = document.getElementById("matQtd")?.value;

  try {
    InventoryService.addMaterial({ tipo, cor, qtd });
    agendarSyncSilenciosoDados("estoque-adicionado");
    renderizarPreservandoScroll();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Adicionar material" });
  }
}

function editarMaterial(i) {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar estoque.")) return;
  normalizarEstoque();
  const material = estoque[i];
  if (!material) return;
  mostrarModalEdicaoMaterial(i, material);
}

function mostrarModalEdicaoMaterial(indice, material) {
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="stock-edit-cancel">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Editar material</h2>
          <button class="icon-button" type="button" data-action="stock-edit-cancel" title="Fechar">✕</button>
        </div>
        <label class="field">
          <span>Nome</span>
          <input id="stockEditName" value="${escaparAttr(material.nome)}">
        </label>
        <label class="field">
          <span>Quantidade em kg</span>
          <input id="stockEditQty" type="number" min="0" step="0.001" value="${escaparAttr(material.qtd)}">
        </label>
        <label class="field">
          <span>Cor</span>
          <input id="stockEditColor" value="${escaparAttr(material.cor || "")}" readonly>
          ${renderPaletaCoresMaterial("stockEditColor", material.cor || "")}
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="stock-edit-cancel">Cancelar</button>
          <button class="btn" type="button" data-action="stock-edit-save" data-index="${Number(indice)}">Salvar</button>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById("stockEditName")?.focus(), 50);
}

function salvarEdicaoMaterialEstoque(indice) {
  try {
    InventoryService.updateMaterial(indice, {
      nome: document.getElementById("stockEditName")?.value || "",
      qtd: document.getElementById("stockEditQty")?.value,
      cor: document.getElementById("stockEditColor")?.value || ""
    });
    fecharPopup();
    agendarSyncSilenciosoDados("estoque-editado");
    renderizarPreservandoScroll();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Editar material" });
  }
}

function removerMaterial(i) {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar estoque.")) return;
  if (!estoque[i]) return;
  if (!confirm("Remover este material?")) return;

  try {
    InventoryService.removeMaterial(i);
    agendarSyncSilenciosoDados("estoque-removido");
    renderizarPreservandoScroll();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Remover material" });
  }
}

function adicionarMovimentoCaixa() {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para lançar no caixa.")) return;
  const tipo = document.getElementById("caixaTipo")?.value || "entrada";
  let valor = 0;
  try {
    valor = InventoryService.parseNumberStrict(document.getElementById("caixaValor")?.value, "valor do caixa", { min: 0, allowZero: false });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Caixa", action: "Lançar movimento" });
    return;
  }
  const descricao = document.getElementById("caixaDescricao")?.value.trim() || "";

  if (tipo === "saida" && !descricao) {
    alert("Para lançar uma saída, informe a descrição. Ex.: 2 reais caneta");
    return;
  }

  caixa.push(prepararRegistroOnline({
    id: Date.now(),
    tipo,
    valor,
    descricao: descricao || "Movimento manual",
    data: new Date().toISOString()
  }));

  salvarDados();
  registrarHistorico("Caixa", (tipo === "saida" ? "Saída: " : "Entrada: ") + formatarMoeda(valor) + " - " + (descricao || "Movimento manual"));
  renderApp();
}

function removerMovimentoCaixa(i) {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar o caixa.")) return;
  if (!caixa[i]) return;
  if (!confirm("Remover este movimento do caixa?")) return;

  caixa.splice(i, 1);
  salvarDados();
  registrarHistorico("Caixa", "Movimento removido");
  renderApp();
}

function normalizarCalculadoraWidget(widget = {}) {
  const larguraTela = window.innerWidth || 1024;
  const alturaTela = window.innerHeight || 768;
  const margem = isMobile() ? 8 : 16;
  const recuoInferior = isMobile() ? 92 : 18;
  const larguraMaxima = Math.max(280, larguraTela - margem * 2);
  const alturaMaxima = Math.max(320, alturaTela - margem * 2);
  const larguraMinima = Math.min(320, larguraMaxima);
  const alturaMinima = Math.min(360, alturaMaxima);
  const larguraPadrao = isMobile() ? Math.min(420, larguraMaxima) : 430;
  const alturaPadrao = isMobile() ? Math.min(620, alturaMaxima) : 620;
  const w = Math.min(larguraMaxima, Math.max(larguraMinima, Number(widget.w) || larguraPadrao));
  const h = Math.min(alturaMaxima, Math.max(alturaMinima, Number(widget.h) || alturaPadrao));
  const temX = widget.x !== undefined && widget.x !== null && widget.x !== "";
  const temY = widget.y !== undefined && widget.y !== null && widget.y !== "";
  const xBase = temX ? Number(widget.x) || 0 : larguraTela - w - margem;
  const yBase = temY ? Number(widget.y) || 0 : alturaTela - h - recuoInferior;
  const xMaximo = Math.max(margem, larguraTela - w - margem);
  const yMaximo = Math.max(margem, alturaTela - h - margem);

  return {
    open: widget.open === true,
    x: Math.min(xMaximo, Math.max(margem, xBase)),
    y: Math.min(yMaximo, Math.max(margem, yBase)),
    w,
    h
  };
}

function salvarCalculadoraWidget(valores = {}, salvar = false) {
  const atual = normalizarCalculadoraWidget(appConfig.calculatorWidget || {});
  const proxima = normalizarCalculadoraWidget({ ...atual, ...valores });
  appConfig.calculatorWidget = proxima;

  const janela = document.querySelector(".calc-widget-window");
  if (janela) {
    janela.style.left = `${proxima.x}px`;
    janela.style.top = `${proxima.y}px`;
    janela.style.width = `${proxima.w}px`;
    janela.style.height = `${proxima.h}px`;
  }

  if (salvar) salvarDados();
  return proxima;
}

function normalizarTipoImpressoraCalculadora(tipo = "FDM") {
  return String(tipo || "FDM").trim().toUpperCase() === "RESINA" ? "RESINA" : "FDM";
}

function numeroCalculadora(valor, fallback = 0, minimo = 0) {
  if (valor === "" || valor === null || valor === undefined) return fallback;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? Math.max(minimo, numero) : fallback;
}

function valorCampoCalculadora(id, fallback = "") {
  const campo = document.getElementById(id);
  if (!campo) return fallback;
  return campo.value === undefined || campo.value === null ? fallback : String(campo.value);
}

function getConfiguracaoCalculadora() {
  const salvo = appConfig.calculatorDefaults && typeof appConfig.calculatorDefaults === "object" ? appConfig.calculatorDefaults : {};
  const tipo = normalizarTipoImpressoraCalculadora(salvo.printerType || appConfig.defaultPrinterType || "FDM");
  const modeloSalvo = salvo.printerModel || appConfig.defaultPrinterModel || "Ender 3";
  const modeloValido = printers[modeloSalvo]?.tipo === tipo
    ? modeloSalvo
    : Object.keys(printers).find((nome) => printers[nome].tipo === tipo) || "Ender 3";
  const impressora = printers[modeloValido] || printers["Ender 3"];
  const materialSalvo = salvo.materialId || appConfig.defaultMaterial || "";
  const materialIdValido = materialSalvo && getMaterialEstoque(materialSalvo) ? materialSalvo : "";
  return {
    printerType: tipo,
    printerModel: modeloValido,
    materialId: materialIdValido,
    peso: "",
    filamento: salvo.filamento ?? appConfig.defaultFilamentCost ?? 150,
    tempo: "",
    quantidade: salvo.quantidade ?? 1,
    energia: salvo.energia ?? appConfig.defaultEnergy ?? 0.85,
    consumo: salvo.consumo ?? impressora.consumo ?? "",
    custoHora: salvo.custoHora ?? impressora.custo ?? "",
    margem: salvo.margem ?? appConfig.defaultMargin ?? 100,
    taxaExtra: "",
    nomeItem: salvo.nomeItem || ""
  };
}

function salvarConfiguracaoCalculadora(persistir = true) {
  const atual = getConfiguracaoCalculadora();
  const printer = document.getElementById("printer")?.value || atual.printerModel;
  const tipo = normalizarTipoImpressoraCalculadora(document.getElementById("printerType")?.value || printers[printer]?.tipo || atual.printerType);
  const proxima = {
    printerType: tipo,
    printerModel: printer,
    materialId: document.getElementById("calcMaterial")?.value || "",
    peso: "",
    filamento: numeroCalculadora(valorCampoCalculadora("filamento", atual.filamento), atual.filamento),
    tempo: "",
    quantidade: numeroCalculadora(valorCampoCalculadora("quantidade", atual.quantidade), atual.quantidade, 1),
    energia: numeroCalculadora(valorCampoCalculadora("energia", atual.energia), atual.energia),
    consumo: numeroCalculadora(valorCampoCalculadora("consumo", atual.consumo), atual.consumo),
    custoHora: numeroCalculadora(valorCampoCalculadora("custoHora", atual.custoHora), atual.custoHora),
    margem: numeroCalculadora(valorCampoCalculadora("margem", atual.margem), atual.margem),
    taxaExtra: "",
    nomeItem: valorCampoCalculadora("nomeItem", atual.nomeItem).trim()
  };
  appConfig.calculatorDefaults = proxima;
  appConfig.defaultPrinterType = proxima.printerType;
  appConfig.defaultPrinterModel = proxima.printerModel;
  appConfig.defaultMaterial = proxima.materialId;
  appConfig.defaultFilamentCost = proxima.filamento;
  appConfig.defaultEnergy = proxima.energia;
  appConfig.defaultMargin = proxima.margem;
  if (persistir) salvarDados();
  return proxima;
}

function renderCalculadoraConteudo() {
  const config = getConfiguracaoCalculadora();
  return `
    <div class="calc-grid">
      <label class="field">
        <span>Tipo de impressora</span>
        <select id="printerType" onchange="preencherImpressoras(true)">
          <option value="FDM" ${config.printerType !== "RESINA" ? "selected" : ""}>FDM</option>
          <option value="RESINA" ${config.printerType === "RESINA" ? "selected" : ""}>RESINA</option>
        </select>
      </label>
      <label class="field">
        <span>Impressora</span>
        <select id="printer"></select>
      </label>
    </div>

    <div class="calc-material-row">
      <label class="field">
        <span>Material do estoque</span>
        <select id="calcMaterial" onchange="alterarMaterialCalculadora(this.value)"></select>
      </label>
    </div>
    <p class="muted calc-stock-hint">Use sem vínculo, selecione um material do estoque ou cadastre um material direto pela lista.</p>

    <div class="calc-grid">
      <label class="field">
        <span>Peso em gramas</span>
        <input id="peso" type="number" min="0" step="0.01" placeholder="Ex.: 80" value="${escaparAttr(config.peso)}">
      </label>
      <label class="field">
        <span>Material R$/kg</span>
        <input id="filamento" type="number" min="0" step="0.01" value="${escaparAttr(config.filamento)}" oninput="salvarConfiguracaoCalculadora()">
      </label>
      <label class="field">
        <span>Tempo em horas</span>
        <input id="tempo" type="number" min="0" step="0.01" placeholder="Ex.: 4.5" value="${escaparAttr(config.tempo)}">
      </label>
      <label class="field">
        <span>Quantidade</span>
        <input id="quantidade" type="number" min="1" step="1" value="${escaparAttr(config.quantidade)}" oninput="salvarConfiguracaoCalculadora()">
      </label>
      <label class="field">
        <span>Energia R$/kWh</span>
        <input id="energia" type="number" min="0" step="0.01" value="${escaparAttr(config.energia)}" oninput="salvarConfiguracaoCalculadora()">
      </label>
      <label class="field">
        <span>Consumo W</span>
        <input id="consumo" type="number" min="0" step="1" value="${escaparAttr(config.consumo)}" oninput="salvarConfiguracaoCalculadora()">
      </label>
      <label class="field">
        <span>Custo hora</span>
        <input id="custoHora" type="number" min="0" step="0.01" value="${escaparAttr(config.custoHora)}" oninput="salvarConfiguracaoCalculadora()">
      </label>
      <label class="field">
        <span>Margem %</span>
        <input id="margem" type="number" min="0" step="1" value="${escaparAttr(config.margem)}" oninput="salvarConfiguracaoCalculadora()">
      </label>
      <label class="field">
        <span>Taxa extra (R$)</span>
        <input id="taxaExtra" type="number" min="0" step="0.01" placeholder="0,00" value="${escaparAttr(config.taxaExtra)}">
      </label>
    </div>

    <label class="field">
      <span>Nome do item</span>
      <input id="nomeItem" placeholder="Ex.: suporte personalizado" value="${escaparAttr(config.nomeItem)}" oninput="salvarConfiguracaoCalculadora()">
    </label>

    <div class="actions">
      <button class="btn secondary" onclick="calcular()">Calcular</button>
      <button class="btn ghost" type="button" onclick="limparCalculo()">Novo cálculo</button>
      ${podeExibirAssistenteIAOffline() ? `<button class="btn ghost" type="button" onclick="sugerirCalculadoraComIA()">✨ Sugerir com IA</button>` : ""}
    </div>
    <div id="res" class="result-box">Preencha os dados e calcule o valor do item.</div>

    <div class="actions">
      <button class="btn" onclick="adicionarItem()">Adicionar como pedido</button>
      <button class="btn secondary" onclick="salvarOrcamento()">Salvar orçamento</button>
      <button class="btn ghost" onclick="gerarPdfCalculadora()">Gerar PDF</button>
      <button class="btn ghost" onclick="minimizarCalculadora()">Minimizar</button>
    </div>
  `;
}

function renderCalculadoraTela() {
  return `
    <section class="card calc-main-card">
      <div class="card-header">
        <h2>🧮 Calculadora 3D</h2>
        <span class="status-badge">Principal</span>
      </div>
      ${renderCalculadoraConteudo()}
    </section>
  `;
}

function renderCalculadoraFlutuante() {
  const root = document.getElementById("floatingCalculator");
  if (!root) return;
  if (!podeMostrarControlesFlutuantes()) {
    root.innerHTML = "";
    return;
  }

  const widget = normalizarCalculadoraWidget(appConfig.calculatorWidget || {});
  appConfig.calculatorWidget = widget;

  if (!widget.open) {
    root.innerHTML = `
      <button class="calc-float-ball" onclick="abrirCalculadora()" title="Abrir calculadora">
        <span>🧮</span>
      </button>
    `;
    return;
  }

  root.innerHTML = `
    <section class="calc-widget-window" style="left:${widget.x}px;top:${widget.y}px;width:${widget.w}px;height:${widget.h}px" role="dialog" aria-label="Calculadora flutuante">
      <div class="calc-widget-titlebar" onpointerdown="iniciarMoverCalculadora(event)">
        <div class="window-title">
          <span>🧮</span>
          <strong>Calculadora</strong>
        </div>
        <div class="window-actions">
          <button class="icon-button" onclick="minimizarCalculadora()" title="Minimizar">−</button>
          <button class="icon-button" onclick="minimizarCalculadora()" title="Voltar para bolinha">✕</button>
        </div>
      </div>
      <div class="calc-widget-content">
        ${renderCalculadoraConteudo()}
      </div>
      <div class="calc-widget-resize" onpointerdown="iniciarRedimensionarCalculadora(event)" title="Redimensionar"></div>
    </section>
  `;

  preencherImpressoras();
  preencherMateriaisCalculadora();
}

function abrirCalculadora() {
  ultimoCalculo = null;
  fecharPopup();
  salvarCalculadoraWidget({ open: true }, true);
  renderCalculadoraFlutuante();
}

function minimizarCalculadora() {
  salvarCalculadoraWidget({ open: false }, true);
  renderCalculadoraFlutuante();
}

function iniciarMoverCalculadora(event) {
  if (event.target.closest("button, input, select, textarea, a")) return;
  const janela = document.querySelector(".calc-widget-window");
  if (!janela) return;

  calcWidgetAction = {
    tipo: "move",
    startX: event.clientX,
    startY: event.clientY,
    original: normalizarCalculadoraWidget(appConfig.calculatorWidget || {})
  };

  janela.setPointerCapture?.(event.pointerId);
  janela.classList.add("is-moving");
  event.preventDefault();
}

function iniciarRedimensionarCalculadora(event) {
  const janela = document.querySelector(".calc-widget-window");
  if (!janela) return;

  calcWidgetAction = {
    tipo: "resize",
    startX: event.clientX,
    startY: event.clientY,
    original: normalizarCalculadoraWidget(appConfig.calculatorWidget || {})
  };

  janela.setPointerCapture?.(event.pointerId);
  janela.classList.add("is-resizing");
  event.preventDefault();
}

function moverCalculadora(event) {
  if (!calcWidgetAction) return;

  const { tipo, startX, startY, original } = calcWidgetAction;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;

  if (tipo === "move") {
    salvarCalculadoraWidget({
      x: original.x + dx,
      y: original.y + dy,
      w: original.w,
      h: original.h,
      open: true
    });
  } else {
    salvarCalculadoraWidget({
      x: original.x,
      y: original.y,
      w: original.w + dx,
      h: original.h + dy,
      open: true
    });
  }

  event.preventDefault();
}

function finalizarCalculadora() {
  if (!calcWidgetAction) return;

  document.querySelectorAll(".calc-widget-window.is-moving, .calc-widget-window.is-resizing").forEach((el) => {
    el.classList.remove("is-moving", "is-resizing");
  });
  salvarDados();
  calcWidgetAction = null;
}

function verificarDuploToqueForaCalculadora(event) {
  const widget = appConfig.calculatorWidget || {};
  if (!widget.open || calcWidgetAction) return;
  if (event.target.closest(".calc-widget-window, .calc-float-ball, button, input, select, textarea, a")) return;

  const agora = Date.now();
  if (agora - ultimoToqueForaCalculadora < 420) {
    ultimoToqueForaCalculadora = 0;
    minimizarCalculadora();
    return;
  }
  ultimoToqueForaCalculadora = agora;
}

function manterCalculadoraVisivel(salvar = false) {
  if (!appConfig.calculatorWidget) return;
  salvarCalculadoraWidget({}, salvar);
}

function preencherImpressoras(persistir = false) {
  const select = document.getElementById("printer");
  if (!select) return;
  const config = getConfiguracaoCalculadora();
  const tipoSelect = document.getElementById("printerType");
  const tipo = normalizarTipoImpressoraCalculadora(tipoSelect?.value || config.printerType || "FDM");

  select.innerHTML = "";
  let primeiroModelo = "";
  Object.entries(printers).filter(([, impressora]) => impressora.tipo === tipo).forEach(([nome]) => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    if (!primeiroModelo) primeiroModelo = nome;
    if (nome === config.printerModel) opt.selected = true;
    select.appendChild(opt);
  });
  if (!select.value && primeiroModelo) select.value = primeiroModelo;

  select.onchange = function () {
    const impressora = printers[this.value];
    const inicializando = this.dataset.initializing === "1";
    appConfig.defaultPrinterType = impressora?.tipo || tipo;
    appConfig.defaultPrinterModel = this.value;
    const consumo = document.getElementById("consumo");
    const custoHora = document.getElementById("custoHora");
    if (consumo && (!inicializando || !String(consumo.value || "").trim())) consumo.value = impressora?.consumo ?? "";
    if (custoHora && (!inicializando || !String(custoHora.value || "").trim())) custoHora.value = impressora?.custo ?? "";
    if (!inicializando) salvarConfiguracaoCalculadora();
  };

  select.dataset.initializing = "1";
  select.dispatchEvent(new Event("change"));
  delete select.dataset.initializing;
  if (persistir) salvarConfiguracaoCalculadora();
}

function preencherMateriaisCalculadora() {
  const select = document.getElementById("calcMaterial");
  if (!select) return;
  const configuracao = getConfiguracaoCalculadora();
  const valorAtual = select.value || configuracao.materialId || "";
  const materialSelecionado = getMaterialEstoque(valorAtual) ? valorAtual : "";
  select.innerHTML = renderMaterialOptions(materialSelecionado, { emptyLabel: "Sem vínculo com estoque", includeAdd: true });
  select.value = materialSelecionado;
}

function alterarMaterialCalculadora(materialId = "") {
  if (materialId === MATERIAL_ADD_OPTION) {
    const select = document.getElementById("calcMaterial");
    if (select) select.value = getConfiguracaoCalculadora().materialId || "";
    abrirCadastroMaterialCalculadora();
    return;
  }
  const material = getMaterialEstoque(materialId);
  if (materialId && !material) {
    document.getElementById("calcMaterial") && (document.getElementById("calcMaterial").value = "");
  }
  ultimoCalculo = null;
  salvarConfiguracaoCalculadora(true);
}

function abrirCadastroMaterialCalculadora() {
  if (!permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para cadastrar materiais.")) return;
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="calc-material-cancel">
      <form class="modal-card" id="calcMaterialQuickForm">
        <div class="modal-header">
          <h2>Cadastrar material</h2>
          <button class="icon-button" type="button" data-action="calc-material-cancel" title="Fechar">✕</button>
        </div>
        <p class="muted">Adicione um material ao estoque e continue o cálculo sem sair da tela.</p>
        <label class="field">
          <span>Tipo</span>
          <select id="calcQuickMatTipo">
            ${tiposMaterial.map((tipo) => `<option value="${escaparAttr(tipo)}">${escaparHtml(tipo)}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>Cor do material</span>
          <input id="calcQuickMatCor" placeholder="Escolha na paleta" readonly>
          ${renderPaletaCoresMaterial("calcQuickMatCor")}
        </label>
        <label class="field">
          <span>Quantidade em kg</span>
          <input id="calcQuickMatQtd" type="number" min="0.001" step="0.001" placeholder="Ex.: 1.000" required>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="calc-material-cancel">Cancelar</button>
          <button class="btn" type="submit">Adicionar e selecionar</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("calcMaterialQuickForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    salvarMaterialCalculadoraRapido();
  });
  setTimeout(() => document.getElementById("calcQuickMatQtd")?.focus(), 80);
}

function salvarMaterialCalculadoraRapido() {
  try {
    const tipo = document.getElementById("calcQuickMatTipo")?.value || "PLA";
    const cor = (document.getElementById("calcQuickMatCor")?.value || "").trim();
    const qtd = document.getElementById("calcQuickMatQtd")?.value;
    const lista = InventoryService.addMaterial({ tipo, cor, qtd });
    const nomeEsperado = [String(tipo || "PLA").trim(), cor].filter(Boolean).join(" ");
    const material = [...lista].reverse().find((item) => String(item.nome || "").toLowerCase() === nomeEsperado.toLowerCase())
      || lista[lista.length - 1]
      || null;
    if (material?.id) {
      appConfig.defaultMaterial = material.id;
      appConfig.calculatorDefaults = {
        ...(appConfig.calculatorDefaults || {}),
        materialId: material.id
      };
    }
    fecharPopup();
    preencherMateriaisCalculadora();
    if (material?.id) {
      const select = document.getElementById("calcMaterial");
      if (select) select.value = material.id;
      salvarConfiguracaoCalculadora(true);
    }
    agendarSyncSilenciosoDados("estoque-calculadora");
    mostrarToast("Material adicionado ao estoque.", "sucesso", 3200);
  } catch (erro) {
    ErrorService.notify(erro, { area: "Calculadora", action: "Adicionar material do estoque" });
  }
}

function calcular() {
  const usuarioMonetizacao = getUsuarioMonetizacao();
  if (window.MonetizationLimits && !window.MonetizationLimits.canUseCalculator(usuarioMonetizacao)) {
    mostrarModalDesbloqueioAnuncio({
      tipo: "calculator",
      titulo: "Limite diário da calculadora",
      texto: "Você usou os 30 cálculos gratuitos de hoje. Assista a um anúncio para liberar +20 cálculos ou assine o PRO para uso ilimitado."
    }).then((liberado) => {
      if (liberado) calcular();
    });
    return false;
  }

  let peso;
  let filamento;
  let tempo;
  let qtd;
  let energia;
  let consumo;
  let custoHora;
  let margem;
  let taxaExtra;
  try {
    peso = InventoryService.parseNumberStrict(document.getElementById("peso")?.value, "peso em gramas", { min: 0 });
    filamento = InventoryService.parseNumberStrict(document.getElementById("filamento")?.value, "custo do material", { min: 0 });
    tempo = InventoryService.parseNumberStrict(document.getElementById("tempo")?.value, "tempo de impressão", { min: 0 });
    qtd = InventoryService.parseNumberStrict(document.getElementById("quantidade")?.value, "quantidade", { min: 1 });
    energia = InventoryService.parseNumberStrict(document.getElementById("energia")?.value, "custo de energia", { min: 0 });
    consumo = InventoryService.parseNumberStrict(document.getElementById("consumo")?.value, "consumo elétrico", { min: 0 });
    custoHora = InventoryService.parseNumberStrict(document.getElementById("custoHora")?.value, "custo por hora", { min: 0 });
    margem = InventoryService.parseNumberStrict(document.getElementById("margem")?.value, "margem", { min: 0 });
    taxaExtra = InventoryService.parseNumberStrict(document.getElementById("taxaExtra")?.value, "taxa extra", { min: 0 });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Calculadora", action: "Calcular preço", errorKey: "CALCULATE_QUOTE_FAILED" });
    return false;
  }
  const printer = document.getElementById("printer")?.value || appConfig.defaultPrinterModel || "";
  const tipoImpressao = printers[printer]?.tipo || document.getElementById("printerType")?.value || "FDM";
  const materialId = document.getElementById("calcMaterial")?.value || "";
  const materialEstoque = getMaterialEstoque(materialId);

  const material = (peso / 1000) * filamento;
  const energiaC = (consumo / 1000) * tempo * energia;
  const maquina = tempo * custoHora;
  const custo = material + energiaC + maquina;
  const precoSemTaxa = custo * (1 + margem / 100);
  const preco = precoSemTaxa + taxaExtra;
  salvarConfiguracaoCalculadora(true);

  ultimoCalculo = {
    preco: preco / qtd,
    custo: custo / qtd,
    custoMaterial: material,
    custoEnergia: energiaC,
    custoMaquina: maquina,
    taxaExtra,
    precoSemTaxa,
    custoTotal: custo,
    precoTotal: preco,
    qtd,
    peso,
    tempo,
    printer,
    tipoImpressao,
    materialId,
    materialNome: materialEstoque?.nome || ""
  };

  document.getElementById("res").innerHTML = `
    <div class="result-grid">
      <span>Custo do material</span><strong>${formatarMoeda(material)}</strong>
      <span>Custo de energia</span><strong>${formatarMoeda(energiaC)}</strong>
      <span>Custo base</span><strong>${formatarMoeda(custo)}</strong>
      <span>Preço antes da taxa</span><strong>${formatarMoeda(precoSemTaxa)}</strong>
      <span>Taxa extra (R$)</span><strong>${formatarMoeda(taxaExtra)}</strong>
      <span>Preço sugerido de venda</span><strong>${formatarMoeda(preco)}</strong>
    </div>
    <label class="field inline-result-field">
      <span>Valor unitário para adicionar</span>
      <input id="valorManualItem" type="number" min="0" step="0.01" value="${(preco / qtd).toFixed(2)}">
    </label>
  `;
  if (window.MonetizationLimits?.registerCalculation) window.MonetizationLimits.registerCalculation(usuarioMonetizacao);
  else incrementarUsoMensal("calculadora");
  return true;
}

function limparCalculo() {
  ultimoCalculo = null;
  ["peso", "tempo", "taxaExtra", "nomeItem"].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.value = "";
  });
  const quantidade = document.getElementById("quantidade");
  if (quantidade) quantidade.value = "1";
  const resultado = document.getElementById("res");
  if (resultado) resultado.textContent = "Preencha os dados e calcule o valor do item.";
  salvarConfiguracaoCalculadora(true);
}

async function adicionarItem() {
  if (!ultimoCalculo) {
    alert("Clique em Calcular e revise o valor antes de adicionar.");
    return false;
  }

  if (!ultimoCalculo || ultimoCalculo.preco <= 0) {
    alert("Calcule um valor válido antes de adicionar");
    return false;
  }

  const nome = document.getElementById("nomeItem")?.value.trim() || "Item calculado";
  let qtd = 1;
  try {
    qtd = InventoryService.parseNumberStrict(document.getElementById("quantidade")?.value, "quantidade", { min: 1 });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Calculadora", action: "Adicionar item" });
    return false;
  }
  const valorManual = numeroCalculadora(document.getElementById("valorManualItem")?.value, ultimoCalculo.preco, 0);
  const confirmado = await solicitarConfirmacaoAcao({
    titulo: "Adicionar item ao pedido",
    mensagem: `Deseja adicionar "${nome}" ao pedido por ${formatarMoeda(valorManual)} cada?`,
    confirmar: "Adicionar item",
    cancelar: "Voltar e editar"
  });
  if (!confirmado) return false;

  itensPedido.push({
    id: "item-" + Date.now().toString(36),
    nome,
    tipoImpressao: ultimoCalculo.tipoImpressao,
    impressora: ultimoCalculo.printer,
    tempoHoras: ultimoCalculo.tempo,
    materialId: ultimoCalculo.materialId,
    material: ultimoCalculo.materialNome,
    materialGramsTotal: ultimoCalculo.peso,
    materiais: ultimoCalculo.materialId ? [{ materialId: ultimoCalculo.materialId, nome: ultimoCalculo.materialNome, gramas: ultimoCalculo.peso }] : [],
    custoMaterial: ultimoCalculo.custoMaterial,
    custoEnergia: ultimoCalculo.custoEnergia,
    custoTotal: ultimoCalculo.custoTotal,
    qtd,
    valor: valorManual,
    total: valorManual * qtd
  });

  limparCalculo();
  if (telaAtual !== "calculadora") minimizarCalculadora();
  trocarTela("pedido");
  return true;
}

function salvarOrcamento() {
  if (!ultimoCalculo) calcular();
  if (!ultimoCalculo || ultimoCalculo.preco <= 0) return;
  const nome = document.getElementById("nomeItem")?.value.trim() || "Orçamento 3D";
  orcamentos.unshift({
    id: Date.now(),
    nome,
    calculo: { ...ultimoCalculo },
    criadoEm: new Date().toISOString()
  });
  orcamentos = orcamentos.slice(0, 100);
  salvarDados();
  registrarHistorico("Orçamento", "Orçamento salvo: " + nome);
  alert("Orçamento salvo com sucesso.");
}

async function gerarPdfCalculadora() {
  if (!ultimoCalculo) calcular();
  const adicionado = await adicionarItem();
  if (!adicionado) return;
  setTimeout(() => gerarPDF(), 50);
}

function fecharPopup() {
  sideDrawerOpen = false;
  sideDrawerProgress = 0;
  sideDrawerGesture = null;
  const popup = document.getElementById("popup");
  if (popup) {
    popup.innerHTML = "";
  }
}

function solicitarConfirmacaoAcao({
  titulo = "Confirmar ação",
  mensagem = "Deseja continuar?",
  confirmar = "Confirmar",
  cancelar = "Cancelar",
  perigo = false
} = {}) {
  return new Promise((resolve) => {
    const popup = document.getElementById("popup");
    if (!popup) {
      resolve(window.confirm(mensagem));
      return;
    }

    popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-card">
          <div class="modal-header">
            <h2>${escaparHtml(titulo)}</h2>
            <button class="icon-button" type="button" id="confirmActionCancelTop" title="Fechar">✕</button>
          </div>
          <p class="muted">${escaparHtml(mensagem)}</p>
          <div class="actions">
            <button class="btn ghost" type="button" id="confirmActionCancel">${escaparHtml(cancelar)}</button>
            <button class="btn ${perigo ? "danger" : ""}" type="button" id="confirmActionOk">${escaparHtml(confirmar)}</button>
          </div>
        </div>
      </div>
    `;

    const finalizar = (valor) => {
      fecharPopup();
      resolve(valor);
    };
    document.getElementById("confirmActionOk")?.addEventListener("click", () => finalizar(true), { once: true });
    document.getElementById("confirmActionCancel")?.addEventListener("click", () => finalizar(false), { once: true });
    document.getElementById("confirmActionCancelTop")?.addEventListener("click", () => finalizar(false), { once: true });
    popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) finalizar(false);
    });
  });
}

function solicitarPlanoSuperadmin(planoAtual = "free") {
  return new Promise((resolve) => {
    const popup = document.getElementById("popup");
    if (!popup) {
      resolve(null);
      return;
    }
    const planos = garantirPlanosSaas().filter((plano) => ["free", "premium_trial", "premium"].includes(plano.slug));
    popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <form class="modal-card" id="adminPlanForm">
          <div class="modal-header">
            <h2>Alterar plano</h2>
            <button class="icon-button" type="button" id="adminPlanCancelTop" title="Fechar">✕</button>
          </div>
          <label class="field">
            <span>Plano</span>
            <select id="adminPlanSelect">
              ${planos.map((plano) => `<option value="${escaparAttr(plano.slug)}" ${plano.slug === planoAtual ? "selected" : ""}>${escaparHtml(plano.name)}</option>`).join("")}
            </select>
          </label>
          <div class="actions">
            <button class="btn ghost" type="button" id="adminPlanCancel">Cancelar</button>
            <button class="btn" type="submit">Continuar</button>
          </div>
        </form>
      </div>
    `;
    const select = document.getElementById("adminPlanSelect");
    const cancelar = () => {
      fecharPopup();
      resolve(null);
    };
    document.getElementById("adminPlanForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const valor = select?.value || "";
      fecharPopup();
      resolve(valor);
    }, { once: true });
    document.getElementById("adminPlanCancel")?.addEventListener("click", cancelar, { once: true });
    document.getElementById("adminPlanCancelTop")?.addEventListener("click", cancelar, { once: true });
    popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) cancelar();
    });
    setTimeout(() => select?.focus(), 50);
  });
}

function solicitarEntradaTexto({ titulo = "Informe os dados", mensagem = "", valor = "", tipo = "text", obrigatorio = false } = {}) {
  return new Promise((resolve) => {
    const popup = document.getElementById("popup");
    if (!popup) {
      resolve(valor || "");
      return;
    }

    const idInput = "controlledPromptInput";
    popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <form class="modal-card" id="controlledPromptForm">
          <div class="modal-header">
            <h2>${escaparHtml(titulo)}</h2>
            <button class="icon-button" type="button" id="controlledPromptCancelTop" title="Fechar">✕</button>
          </div>
          ${mensagem ? `<p class="muted">${escaparHtml(mensagem)}</p>` : ""}
          <label class="field">
            <span>Digite a informação solicitada</span>
            <input id="${idInput}" type="${escaparAttr(tipo)}" value="${escaparAttr(valor)}" ${obrigatorio ? "required" : ""}>
          </label>
          <div class="actions">
            <button class="btn ghost" type="button" id="controlledPromptCancel">Cancelar</button>
            <button class="btn" type="submit">Confirmar</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById("controlledPromptForm");
    const input = document.getElementById(idInput);
    const cancelar = () => {
      fecharPopup();
      resolve(null);
    };
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      fecharPopup();
      resolve(input?.value ?? "");
    }, { once: true });
    document.getElementById("controlledPromptCancel")?.addEventListener("click", cancelar, { once: true });
    document.getElementById("controlledPromptCancelTop")?.addEventListener("click", cancelar, { once: true });
    popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) cancelar();
    });
    setTimeout(() => input?.focus(), 50);
  });
}

function configurarEventListenersArquitetura() {
  if (window.__simplificaArchitectureListeners) return;
  window.__simplificaArchitectureListeners = true;
  document.addEventListener("click", (event) => {
    const elemento = event.target.closest("[data-action]");
    if (!elemento) return;
    const acao = elemento.dataset.action;

    if (["plan-modal-close", "stock-edit-cancel", "calc-material-cancel", "ai-suggestion-close", "ai-setup-cancel", "ai-wizard-cancel"].includes(acao)) {
      if (elemento.classList.contains("modal-backdrop") && event.target !== elemento) return;
      event.preventDefault();
      fecharPopup();
      return;
    }

    if (acao === "plan-upgrade") {
      event.preventDefault();
      fecharPopup();
      trocarTela("assinatura");
      return;
    }

    if (acao === "open-screen") {
      event.preventDefault();
      trocarTela(elemento.dataset.screen || "dashboard");
      return;
    }

    if (acao === "login-google") {
      event.preventDefault();
      loginGoogleSupabase();
      return;
    }

    if (acao === "open-payment") {
      event.preventDefault();
      abrirLinkMercadoPago(elemento.dataset.slug || billingConfig.planSlug || "premium");
      return;
    }

    if (acao === "plan-select") {
      event.preventDefault();
      escolherPlanoSaas(elemento.dataset.slug || "free");
      return;
    }

    if (acao === "plan-trial") {
      event.preventDefault();
      iniciarTesteGratis(elemento.dataset.slug || "premium_trial");
      return;
    }

    if (acao === "plan-payment") {
      event.preventDefault();
      criarPagamentoUnicoMercadoPago(elemento.dataset.slug || "premium");
      return;
    }

    if (acao === "plan-renew") {
      event.preventDefault();
      abrirLinkMercadoPago(elemento.dataset.slug || "premium");
      return;
    }

    if (acao === "plan-cancel") {
      event.preventDefault();
      cancelarAssinaturaCliente();
      return;
    }

    if (acao === "plan-support") {
      event.preventDefault();
      falarComSuporteAssinatura();
      return;
    }

    if (acao === "ai-setup-install") {
      event.preventDefault();
      fecharPopup();
      abrirWizardIAProLocal();
      return;
    }

    if (acao === "ai-setup-basic") {
      event.preventDefault();
      usarAssistenteBasicoAgora(elemento.dataset.origin || "assistente");
      return;
    }

    if (acao === "ai-wizard-install") {
      event.preventDefault();
      instalarIAAutomatica(elemento.dataset.modelId || "lite");
      return;
    }

    if (acao === "stock-edit-save") {
      event.preventDefault();
      salvarEdicaoMaterialEstoque(Number(elemento.dataset.index));
      return;
    }

    if (acao === "stock-add") {
      event.preventDefault();
      addMaterial();
      return;
    }

    if (acao === "stock-edit") {
      event.preventDefault();
      editarMaterial(Number(elemento.dataset.index));
      return;
    }

    if (acao === "stock-remove") {
      event.preventDefault();
      removerMaterial(Number(elemento.dataset.index));
      return;
    }

    if (acao === "superadmin-refresh-users") {
      event.preventDefault();
      atualizarUsuariosSuperAdminSupabase();
      return;
    }
  });
}

function dadosPedidoAtual() {
  const cliente = (document.getElementById("clienteNome")?.value || clientePedido || "Sem cliente").trim();
  const telefone = normalizarTelefoneWhatsapp(document.getElementById("clienteTelefone")?.value || clienteTelefonePedido);
  const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  return { cliente, telefone, total };
}

function removerAcentos(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarCampoPix(valor, limite) {
  return removerAcentos(valor)
    .replace(/[^\w\s.@+\-]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, limite);
}

function campoEmv(id, valor) {
  const texto = String(valor ?? "");
  return String(id).padStart(2, "0") + String(texto.length).padStart(2, "0") + texto;
}

function crc16Pix(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function gerarPayloadPix(valor, cliente = "") {
  const chave = String(appConfig.pixKey || "").trim();
  if (!chave) return "";

  const recebedor = normalizarCampoPix(appConfig.pixReceiverName || appConfig.businessName || appConfig.appName || SYSTEM_NAME, 25) || SYSTEM_NAME;
  const cidade = normalizarCampoPix(appConfig.pixCity || "FORTALEZA", 15) || "FORTALEZA";
  const descricao = normalizarCampoPix(appConfig.pixDescription || cliente || "PEDIDO SIMPLIFICA 3D", 40);
  const txid = normalizarCampoPix(("PED" + Date.now().toString(36)).toUpperCase(), 25);
  const merchantAccount = campoEmv("00", "br.gov.bcb.pix") + campoEmv("01", chave) + (descricao ? campoEmv("02", descricao) : "");
  const adicionais = campoEmv("05", txid);
  const base = [
    campoEmv("00", "01"),
    campoEmv("26", merchantAccount),
    campoEmv("52", "0000"),
    campoEmv("53", "986"),
    campoEmv("54", (Number(valor) || 0).toFixed(2)),
    campoEmv("58", "BR"),
    campoEmv("59", recebedor),
    campoEmv("60", cidade),
    campoEmv("62", adicionais)
  ].join("") + "6304";
  return base + crc16Pix(base);
}

function gerarQrPixDataUrl(payload) {
  try {
    if (!payload || typeof qrcode !== "function") return "";
    const qr = qrcode(0, "M");
    qr.addData(payload);
    qr.make();
    return qr.createDataURL(4, 2);
  } catch (erro) {
    registrarDiagnostico("pdf", "QR Pix não gerado", erro.message);
    return "";
  }
}

function carregarImagemDataUrl(src) {
  if (!src) return Promise.resolve("");
  if (String(src).startsWith("data:image/")) return Promise.resolve(src);

  return new Promise((resolve) => {
    if (typeof Image === "undefined" || typeof document === "undefined") {
      resolve("");
      return;
    }

    const imagem = new Image();
    if (/^https?:\/\//i.test(src)) imagem.crossOrigin = "anonymous";
    imagem.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = imagem.naturalWidth || imagem.width;
        canvas.height = imagem.naturalHeight || imagem.height;
        const contexto = canvas.getContext("2d");
        contexto.drawImage(imagem, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch (erro) {
        registrarDiagnostico("pdf", "Marca padrão não convertida", erro.message);
        resolve("");
      }
    };
    imagem.onerror = () => {
      registrarDiagnostico("pdf", "Marca padrão não carregou", src);
      resolve("");
    };
    imagem.src = src;
  });
}

async function obterMarcaPdfDataUrl() {
  if (!temAcessoPdfProfissional()) return "";
  return carregarImagemDataUrl(getMarcaProjetoSrc());
}

async function obterFundoPdfDataUrl() {
  if (!temAcessoPdfProfissional() || !appConfig.pdfBackgroundDataUrl) return "";
  return carregarImagemDataUrl(appConfig.pdfBackgroundDataUrl);
}

function temAcessoPdfProfissional() {
  return temAcessoCompleto() || window.AdMobService?.hasTemporaryUnlock?.("pdf") || window.MonetizationLimits?.hasUnlock?.("pdf", getUsuarioMonetizacao());
}

function tipoImagemDataUrl(dataUrl) {
  if (String(dataUrl || "").includes("image/jpeg")) return "JPEG";
  return "PNG";
}

function hexParaRgb(hex) {
  const limpo = String(hex || "").replace("#", "");
  const valor = limpo.length === 3
    ? limpo.split("").map((letra) => letra + letra).join("")
    : limpo.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(valor.slice(0, 2), 16) || 0,
    parseInt(valor.slice(2, 4), 16) || 168,
    parseInt(valor.slice(4, 6), 16) || 107
  ];
}

function adicionarMarcaPdf(doc, largura, altura, marcaDataUrl = "") {
  if (!temAcessoPdfProfissional() || !marcaDataUrl) return;

  try {
    const tipo = tipoImagemDataUrl(marcaDataUrl);
    if (appConfig.brandWatermarkEnabled !== false && doc.GState && doc.setGState) {
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.addImage(marcaDataUrl, tipo, largura / 2 - 36, altura / 2 - 36, 72, 72);
      doc.setGState(new doc.GState({ opacity: 1 }));
    }
  } catch (erro) {
    try {
      doc.addImage(marcaDataUrl, tipoImagemDataUrl(marcaDataUrl), largura / 2 - 28, altura / 2 - 28, 56, 56);
    } catch (_) {}
  }
}

function adicionarFundoPdf(doc, largura, altura, fundoDataUrl = "") {
  if (!temAcessoPdfProfissional() || !fundoDataUrl) return;
  try {
    const tipo = tipoImagemDataUrl(fundoDataUrl);
    if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.addImage(fundoDataUrl, tipo, 0, 0, largura, altura);
    if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
  } catch (erro) {
    registrarDiagnostico("pdf", "Fundo personalizado não aplicado", erro.message);
  }
}

function adicionarMarcaDaguaFreePdf(doc, largura, altura) {
  if (temAcessoPdfProfissional()) return;
  try {
    doc.setTextColor(180, 190, 205);
    doc.setFontSize(13);
    if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 0.18 }));
    doc.text("Simplifica 3D - Plano Free", largura / 2, altura / 2, { align: "center", angle: 35 });
    if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
  } catch (_) {
    doc.setTextColor(180, 190, 205);
    doc.setFontSize(10);
    doc.text("Simplifica 3D - Plano Free", largura / 2, altura - 10, { align: "center" });
  }
}

async function salvarOuCompartilharPdf(doc, nomeArquivo, titulo = "Pedido Simplifica 3D") {
  const nomeSeguro = String(nomeArquivo || "pedido-simplifica-3d.pdf")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const blob = doc.output("blob");

  if (isAndroid() && await salvarPdfAndroidNativo(doc, nomeSeguro)) {
    return true;
  }

  if (isAndroid() && typeof File !== "undefined" && navigator.canShare && navigator.share) {
    try {
      const arquivo = new File([blob], nomeSeguro, { type: "application/pdf" });
      if (navigator.canShare({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: titulo, text: "PDF do pedido" });
        return true;
      }
    } catch (erro) {
      if (erro?.name === "AbortError") return true;
      registrarDiagnostico("pdf", "Compartilhamento Android falhou", erro.message || erro);
    }
  }

  try {
    doc.save(nomeSeguro);
    return true;
  } catch (erro) {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeSeguro;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return true;
    } catch (erroAlternativo) {
      registrarDiagnostico("pdf", "Download do PDF falhou", erroAlternativo.message || erro.message);
      alert("Não foi possível baixar o PDF neste dispositivo. Tente abrir pelo navegador ou baixar novamente pelo pedido.");
      return false;
    }
  }
}

function arrayBufferParaBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  const tamanhoBloco = 0x8000;
  for (let i = 0; i < bytes.length; i += tamanhoBloco) {
    binario += String.fromCharCode.apply(null, bytes.subarray(i, i + tamanhoBloco));
  }
  return btoa(binario);
}

async function salvarPdfAndroidNativo(doc, nomeArquivo) {
  const plugin = window.Capacitor?.Plugins?.SimplificaFiles;
  if (!plugin?.savePdf) return false;

  try {
    const base64 = arrayBufferParaBase64(doc.output("arraybuffer"));
    const resultado = await plugin.savePdf({ fileName: nomeArquivo, base64 });
    if (resultado?.ok) {
      alert("PDF salvo em Downloads/Simplifica3D.");
      registrarHistorico("PDF", "PDF salvo no Android: " + nomeArquivo);
      return true;
    }
  } catch (erro) {
    registrarDiagnostico("pdf", "Salvamento Android falhou", erro.message || erro);
    alert("Não foi possível salvar em Downloads. Verifique a permissão de arquivos e tente baixar novamente.");
  }

  return false;
}

async function gerarPDF() {
  if (!(await verificarPermissaoPdfAntesGerar())) return;
  if (itensPedido.length === 0) {
    alert("Adicione itens ao pedido antes de gerar o PDF");
    return;
  }

  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    alert("Biblioteca de PDF não carregou. Verifique a internet e tente novamente.");
    return;
  }

  const { cliente, total } = dadosPedidoAtual();
  const doc = new jsPDF();
  const empresa = appConfig.businessName || appConfig.appName || SYSTEM_NAME;
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 14;
  const cor = appConfig.accentColor || "#073b4b";
  const corRgb = hexParaRgb(cor);
  const agoraPdf = new Date();
  const data = agoraPdf.toLocaleDateString("pt-BR");
  const pedidoId = pedidoEditando?.id || Date.now();
  const cidade = appConfig.pixCity || "Não informada";
  window.__simplificaExportandoPdf = true;
  try {
  const telefoneCliente = await obterTelefoneWhatsappPedido(pedidoEditando);
  const marcaPdf = await obterMarcaPdfDataUrl();
  const fundoPdf = await obterFundoPdfDataUrl();

  adicionarFundoPdf(doc, largura, altura, fundoPdf);
  adicionarMarcaPdf(doc, largura, altura, marcaPdf);
  adicionarMarcaDaguaFreePdf(doc, largura, altura);

  doc.setFillColor(corRgb[0], corRgb[1], corRgb[2]);
  doc.rect(0, 0, largura, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(empresa, margem, 14);
  doc.setFontSize(10);
  doc.text("Pedido #" + pedidoId, margem, 23);
  if (appConfig.pdfHeaderText && temAcessoPdfProfissional()) doc.text(String(appConfig.pdfHeaderText).slice(0, 60), margem, 29);
  doc.text(data, largura - margem, 23, { align: "right" });

  if (temAcessoPdfProfissional() && marcaPdf) {
    try {
      doc.addImage(marcaPdf, tipoImagemDataUrl(marcaPdf), largura - 32, 6, 18, 18);
    } catch (erro) {
      registrarDiagnostico("pdf", "Logo não aplicada no cabeçalho", erro.message);
    }
  }

  doc.setTextColor(17, 24, 39);
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(margem, 40, largura - margem * 2, 38, 3, 3, "F");
  doc.setFontSize(11);
  doc.text("Cliente", margem + 4, 49);
  doc.setFontSize(13);
  doc.text(cliente || "Sem cliente", margem + 4, 58);
  doc.setFontSize(10);
  doc.text("Empresa: " + empresa, largura - margem - 4, 49, { align: "right" });
  doc.text("Pedido: #" + pedidoId, largura - margem - 4, 56, { align: "right" });
  doc.text("Cidade: " + cidade, margem + 4, 68);
  doc.text(telefoneCliente ? "Telefone cliente: " + telefoneCliente : "Telefone cliente: não informado", largura - margem - 4, 68, { align: "right" });

  let y = 90;
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(margem, y - 7, largura - margem * 2, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Item", margem + 4, y);
  doc.text("Qtd", 118, y, { align: "right" });
  doc.text("Unit.", 145, y, { align: "right" });
  doc.text("Total", largura - margem - 4, y, { align: "right" });
  y += 10;

  doc.setTextColor(17, 24, 39);
  itensPedido.forEach((item, i) => {
    if (y > 250) {
      doc.addPage();
      adicionarFundoPdf(doc, largura, altura, fundoPdf);
      adicionarMarcaPdf(doc, largura, altura, marcaPdf);
      adicionarMarcaDaguaFreePdf(doc, largura, altura);
      y = 24;
    }

    const nomeLinhas = doc.splitTextToSize(`${i + 1}. ${item.nome}`, 86);
    const linhaAltura = Math.max(12, nomeLinhas.length * 5 + 5);
    doc.setDrawColor(220, 226, 235);
    doc.line(margem, y + linhaAltura - 4, largura - margem, y + linhaAltura - 4);
    doc.setFontSize(10);
    doc.text(nomeLinhas, margem + 4, y);
    doc.text(String(item.qtd), 118, y, { align: "right" });
    doc.text(formatarMoeda(item.valor || 0), 145, y, { align: "right" });
    doc.text(formatarMoeda(item.total || 0), largura - margem - 4, y, { align: "right" });
    y += linhaAltura;
  });

  y += 4;
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(largura - 78, y, 64, 18, 3, 3, "F");
  doc.setFontSize(10);
  doc.text("Total do pedido", largura - 46, y + 7, { align: "center" });
  doc.setFontSize(15);
  doc.text(formatarMoeda(total), largura - 46, y + 15, { align: "center" });
  y += 28;

  const payloadPix = gerarPayloadPix(total, cliente);
  if (payloadPix) {
    if (y > 218) {
      doc.addPage();
      adicionarFundoPdf(doc, largura, altura, fundoPdf);
      adicionarMarcaPdf(doc, largura, altura, marcaPdf);
      adicionarMarcaDaguaFreePdf(doc, largura, altura);
      y = 24;
    }

    const qrData = gerarQrPixDataUrl(payloadPix);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margem, y, largura - margem * 2, qrData ? 48 : 34, 3, 3, "F");
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.text("Pagamento via Pix", margem + 5, y + 9);
    doc.setFontSize(8);
    const linhasPix = doc.splitTextToSize(payloadPix, qrData ? largura - 76 : largura - margem * 2 - 10);
    doc.text(linhasPix.slice(0, 5), margem + 5, y + 18);
    if (qrData) {
      doc.addImage(qrData, "PNG", largura - margem - 38, y + 5, 32, 32);
    }
    y += qrData ? 56 : 42;
  }

  if (appConfig.documentFooter) {
    doc.setTextColor(95, 107, 122);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(appConfig.documentFooter, largura - margem * 2), margem, Math.min(y + 6, altura - 18));
  }

  registrarHistorico("PDF", "PDF gerado para " + cliente);
  const salvou = await salvarOuCompartilharPdf(doc, nomeArquivoPdfPedido(pedidoId, cliente, agoraPdf), "Pedido " + cliente);
  if (salvou) {
    window.MonetizationLimits?.registerPdfExport?.(getUsuarioMonetizacao());
  }
  } finally {
    window.__simplificaExportandoPdf = false;
  }
}

async function enviarWhats() {
  if (!permitirAcaoPlanoCompleto()) return;
  if (itensPedido.length === 0) {
    alert("Adicione itens ao pedido antes de enviar");
    return;
  }

  const { cliente, total } = dadosPedidoAtual();
  const linhas = itensPedido.map((item) => {
    return `- ${item.nome} | Qtd: ${item.qtd} | Total: ${formatarMoeda(item.total)}`;
  });

  const mensagem = [
    "Pedido " + (appConfig.businessName || appConfig.appName || SYSTEM_NAME),
    "Cliente: " + cliente,
    "",
    ...linhas,
    "",
    "Total: " + formatarMoeda(total),
    appConfig.documentFooter ? "\n" + appConfig.documentFooter : ""
  ].join("\n");

  const numero = await obterTelefoneWhatsappPedido();
  const destino = numero ? "https://api.whatsapp.com/send?phone=" + numero + "&text=" : "https://api.whatsapp.com/send?text=";
  window.open(destino + encodeURIComponent(mensagem), "_blank");
}

async function baixarPdfPedidoSalvo(id) {
  const pedido = pedidos.find((item) => Number(item.id) === Number(id));
  if (!pedido) return;
  const estadoAnterior = {
    itensPedido,
    clientePedido,
    clienteTelefonePedido,
    pedidoEditando
  };

  try {
    itensPedido = normalizarItensPedido(pedido);
    clientePedido = clienteDoPedido(pedido);
    clienteTelefonePedido = telefoneDoPedido(pedido);
    pedidoEditando = pedido;
    await gerarPDF();
  } finally {
    itensPedido = estadoAnterior.itensPedido;
    clientePedido = estadoAnterior.clientePedido;
    clienteTelefonePedido = estadoAnterior.clienteTelefonePedido;
    pedidoEditando = estadoAnterior.pedidoEditando;
  }
}

async function enviarWhatsPedidoSalvo(id) {
  if (!permitirAcaoPlanoCompleto()) return;
  const pedido = pedidos.find((item) => Number(item.id) === Number(id));
  if (!pedido) return;
  const itens = normalizarItensPedido(pedido);
  const linhas = itens.map((item) => `- ${item.nome} | Qtd: ${item.qtd} | Total: ${formatarMoeda(item.total)}`);
  const cliente = clienteDoPedido(pedido);
  const mensagem = [
    "Pedido " + (appConfig.businessName || appConfig.appName || SYSTEM_NAME),
    "Cliente: " + cliente,
    "",
    ...linhas,
    "",
    "Total: " + formatarMoeda(totalPedido(pedido)),
    appConfig.documentFooter ? "\n" + appConfig.documentFooter : ""
  ].join("\n");
  const numero = await obterTelefoneWhatsappPedido(pedido);
  if (numero && !pedido.clienteTelefone) {
    pedido.clienteTelefone = numero;
    pedido.atualizadoEm = new Date().toISOString();
    salvarDados();
  }
  const destino = numero ? "https://api.whatsapp.com/send?phone=" + numero + "&text=" : "https://api.whatsapp.com/send?text=";
  window.open(destino + encodeURIComponent(mensagem), "_blank");
}

function limparPedidoAtual() {
  if (itensPedido.length === 0 && !clientePedido && !pedidoEditando) {
    alert("Não há pedido em aberto");
    return;
  }

  if (!confirm("Limpar o pedido atual?")) return;

  itensPedido = [];
  clientePedido = "";
  pedidoEditando = null;
  registrarHistorico("Pedido", "Pedido atual limpo");
  renderApp();
}

function textoParaBase64Utf8(texto = "") {
  if (typeof TextEncoder !== "undefined") {
    return arrayBufferParaBase64(new TextEncoder().encode(String(texto)).buffer);
  }
  return btoa(unescape(encodeURIComponent(String(texto))));
}

async function salvarBackupAndroidNativo(conteudo, nomeArquivo) {
  const plugin = window.Capacitor?.Plugins?.SimplificaFiles;
  if (!isAndroid() || !plugin?.saveFile) return false;
  try {
    const resultado = await plugin.saveFile({
      fileName: nomeArquivo,
      mimeType: "application/json",
      base64: textoParaBase64Utf8(conteudo)
    });
    if (resultado?.ok) {
      registrarHistorico("Backup", "Backup salvo no Android: " + nomeArquivo);
      alert(`Backup salvo em Downloads/Simplifica3D.\nArquivo: ${nomeArquivo}`);
      return true;
    }
  } catch (erro) {
    registrarDiagnostico("Backup", "Salvamento Android falhou", erro.message || erro);
  }
  return false;
}

async function exportarBackup() {
  const agora = new Date().toISOString();
  syncConfig.ultimoBackup = agora;
  syncConfig.lastActivityAt = agora;
  salvarDados();
  const dados = criarSnapshotBackupUsuarioAtual();
  const nomeArquivo = nomeArquivoBackupUsuario();
  const conteudo = JSON.stringify(dados, null, 2);
  if (await salvarBackupAndroidNativo(conteudo, nomeArquivo)) return;

  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  registrarHistorico("Backup", "Backup local exportado: " + nomeArquivo);
  alert(`Backup exportado com sucesso.\nArquivo: ${nomeArquivo}\nGerado em: ${new Date(agora).toLocaleString("pt-BR")}`);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

function isAndroidNativeApp() {
  try {
    const capacitor = window.Capacitor;
    if (!capacitor) return false;
    if (typeof capacitor.getPlatform === "function") return capacitor.getPlatform() === "android";
    if (typeof capacitor.isNativePlatform === "function") return capacitor.isNativePlatform() && isAndroid();
    return !!capacitor.Plugins?.SimplificaFiles && isAndroid();
  } catch (_) {
    return false;
  }
}

function getAndroidDownloadUrl(manifest = {}) {
  return manifest.apkUrl || manifest.downloadUrl || billingConfig.androidDownloadUrl || ANDROID_RELEASES_URL;
}

function getAndroidManifestUrls() {
  return [
    appConfig.updateManifestUrl,
    ANDROID_UPDATE_MANIFEST_URL,
    ...ANDROID_UPDATE_MANIFEST_FALLBACK_URLS
  ].filter(Boolean).filter((url, index, lista) => lista.indexOf(url) === index);
}

function abrirDownloadAtualizacaoAndroid(url) {
  const destino = url || appConfig.updateDownloadUrl || billingConfig.androidDownloadUrl || ANDROID_RELEASES_URL;
  if (!destino) {
    alert("Link do APK não configurado.");
    return;
  }

  const janela = window.open(destino, "_blank");
  if (!janela) {
    window.location.href = destino;
  }
}

async function buscarManifestAtualizacaoAndroid() {
  const erros = [];
  for (const manifestUrl of getAndroidManifestUrls()) {
    try {
      const separador = manifestUrl.includes("?") ? "&" : "?";
      const resposta = await fetch(`${manifestUrl}${separador}t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!resposta.ok) {
        throw new Error("HTTP " + resposta.status);
      }

      const manifest = await resposta.json();
      const versao = String(manifest.version || manifest.versionName || "").trim();
      return {
        ...manifest,
        sourceUrl: manifestUrl,
        version: versao,
        versionCode: Number(manifest.versionCode || manifest.version_code || manifest.androidVersionCode || manifest.code || 0) || 0,
        apkUrl: getAndroidDownloadUrl(manifest)
      };
    } catch (erro) {
      erros.push(`${manifestUrl}: ${erro.message}`);
    }
  }

  throw new Error(erros.join(" | ") || "Manifesto não configurado");
}

function normalizarVersaoApp(valor = "") {
  return String(valor || "").trim().replace(/^v/i, "");
}

function compararVersoesApp(a = "", b = "") {
  const esquerda = normalizarVersaoApp(a).split(".").map((parte) => Number(parte) || 0);
  const direita = normalizarVersaoApp(b).split(".").map((parte) => Number(parte) || 0);
  const tamanho = Math.max(esquerda.length, direita.length, 3);
  for (let i = 0; i < tamanho; i += 1) {
    const diff = (esquerda[i] || 0) - (direita[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function getManifestAndroidVersionCode(manifest = {}) {
  return Number(manifest.versionCode || manifest.version_code || manifest.androidVersionCode || manifest.code || 0) || 0;
}

function getManifestAndroidVersionName(manifest = {}) {
  return normalizarVersaoApp(manifest.version || manifest.versionName || "");
}

function existeAtualizacaoAndroid(manifest) {
  const versionCodeRemoto = getManifestAndroidVersionCode(manifest);
  const versionNameRemoto = getManifestAndroidVersionName(manifest);
  if (versionCodeRemoto && APP_VERSION_CODE) return versionCodeRemoto > APP_VERSION_CODE;
  return !!versionNameRemoto && compararVersoesApp(versionNameRemoto, APP_VERSION) > 0;
}

function atualizacaoAndroidFoiOcultada(manifest = {}) {
  const versao = getManifestAndroidVersionName(manifest);
  const codigo = getManifestAndroidVersionCode(manifest);
  if (!versao) return false;
  if (codigo) return appConfig.updateDismissedVersion === versao && Number(appConfig.updateDismissedCode || 0) === codigo;
  return appConfig.updateDismissedVersion === versao;
}

function avisarAtualizacaoAndroid(manifest, forcarAviso = false) {
  const versao = getManifestAndroidVersionName(manifest) || "nova";
  const codigo = getManifestAndroidVersionCode(manifest);
  const jaAvisado = appConfig.updatePromptedVersion === versao && Number(appConfig.updateAvailableCode || 0) === codigo;

  if (!forcarAviso && (jaAvisado || atualizacaoAndroidFoiOcultada(manifest))) return;

  appConfig.updatePromptedVersion = versao;
  appConfig.updatePromptedAt = new Date().toISOString();
  appConfig.updateAvailableVersion = versao;
  appConfig.updateAvailableCode = codigo;
  appConfig.updateDownloadUrl = getAndroidDownloadUrl(manifest);
  salvarDados();
  mostrarToast(`Nova versão ${versao} disponível.`, "info", 3600);
}

async function verificarAtualizacaoAndroid(forcarAviso = false) {
  if (!isAndroid()) return false;

  try {
    const manifest = await buscarManifestAtualizacaoAndroid();
    appConfig.updateDownloadUrl = getAndroidDownloadUrl(manifest);

    if (existeAtualizacaoAndroid(manifest) && !atualizacaoAndroidFoiOcultada(manifest)) {
      appConfig.updateAvailableVersion = getManifestAndroidVersionName(manifest);
      appConfig.updateAvailableCode = getManifestAndroidVersionCode(manifest);
      salvarStatusAtualizacao(`APK ${appConfig.updateAvailableVersion} disponível`);
      const autoDownloadKey = `${appConfig.updateAvailableVersion}:${appConfig.updateAvailableCode || 0}`;
      if (!forcarAviso && appConfig.autoUpdateEnabled !== false && appConfig.updateAutoDownloadedKey !== autoDownloadKey) {
        appConfig.updateAutoDownloadedKey = autoDownloadKey;
        salvarDados();
        mostrarToast(`Baixando atualização ${appConfig.updateAvailableVersion}...`, "info", 3600);
        setTimeout(() => abrirDownloadAtualizacaoAndroid(appConfig.updateDownloadUrl), 500);
      }

      if (forcarAviso) {
        avisarAtualizacaoAndroid(manifest, forcarAviso);
      }
      return true;
    }

    appConfig.updateAvailableVersion = "";
    appConfig.updateAvailableCode = 0;
    appConfig.updateAutoDownloadedKey = "";
    salvarStatusAtualizacao("Sistema atualizado");
    if (forcarAviso) mostrarToast("Nenhuma atualização nova encontrada.", "info", 3200);
    return true;
  } catch (erro) {
    salvarStatusAtualizacao("Erro ao checar APK no GitHub");
    if (forcarAviso) alert("Não foi possível checar o APK no GitHub: " + erro.message);
    return true;
  }
}

async function baixarAtualizacaoAndroid(forcarBusca = false) {
  if (isAndroid() || forcarBusca) {
    try {
      const manifest = await buscarManifestAtualizacaoAndroid();
      appConfig.updateDownloadUrl = getAndroidDownloadUrl(manifest);
      if (existeAtualizacaoAndroid(manifest)) {
        appConfig.updateAvailableVersion = getManifestAndroidVersionName(manifest);
        appConfig.updateAvailableCode = getManifestAndroidVersionCode(manifest);
        salvarStatusAtualizacao(`APK ${appConfig.updateAvailableVersion} disponível`);
      } else {
        appConfig.updateAvailableVersion = "";
        appConfig.updateAvailableCode = 0;
        salvarStatusAtualizacao("Sistema atualizado");
      }
      abrirDownloadAtualizacaoAndroid(appConfig.updateDownloadUrl);
      if (appConfig.updateAvailableVersion) {
        appConfig.updateDismissedVersion = appConfig.updateAvailableVersion;
        appConfig.updateDismissedCode = appConfig.updateAvailableCode || 0;
        appConfig.updateAvailableVersion = "";
        appConfig.updateAvailableCode = 0;
        salvarDados();
      }
      return;
    } catch (erro) {
      salvarStatusAtualizacao("Erro ao buscar APK");
      alert("Não foi possível buscar o APK mais recente no GitHub: " + erro.message);
    }
  }

  abrirDownloadAtualizacaoAndroid(appConfig.updateDownloadUrl || billingConfig.androidDownloadUrl || ANDROID_RELEASES_URL);
}

function intervaloAtualizacaoMs() {
  return Math.max(5, Number(appConfig.updateCheckInterval) || 30) * 60 * 1000;
}

function salvarStatusAtualizacao(status) {
  appConfig.updateStatus = status;
  appConfig.updateLastCheck = new Date().toISOString();
  salvarDados();
}

function monitorarRegistroAtualizacao(registro) {
  if (!registro || registro.__erpMonitorado) return;
  registro.__erpMonitorado = true;

  registro.addEventListener("updatefound", () => {
    const worker = registro.installing;
    if (!worker) return;

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        salvarStatusAtualizacao("Atualização pronta");
        if (appConfig.autoUpdateEnabled !== false) {
          aplicarAtualizacaoAgora();
        } else {
          renderizarPreservandoScroll();
        }
      }
    });
  });
}

async function verificarAtualizacao(forcarAviso = false) {
  const atualizacaoAndroidTratada = await verificarAtualizacaoAndroid(forcarAviso);
  if (atualizacaoAndroidTratada) {
    if (forcarAviso || telaAtual === "config") renderizarPreservandoScroll();
    return;
  }

  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    salvarStatusAtualizacao("Atualização disponível só em http/https");
    if (forcarAviso) alert("Atualização automática funciona quando o app está em http/https ou instalado como PWA.");
    if (forcarAviso || telaAtual === "config") renderizarPreservandoScroll();
    return;
  }

  try {
    const registro = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register("sw.js");
    monitorarRegistroAtualizacao(registro);
    await registro.update();

    if (registro.waiting) {
      salvarStatusAtualizacao("Atualização pronta");
      if (appConfig.autoUpdateEnabled !== false) {
        aplicarAtualizacaoAgora();
      } else if (forcarAviso) {
        alert("Atualização encontrada. Clique em Aplicar agora para recarregar.");
      }
    } else {
      salvarStatusAtualizacao("Sistema atualizado");
      if (forcarAviso) alert("Nenhuma atualização nova encontrada.");
    }
  } catch (erro) {
    salvarStatusAtualizacao("Erro ao checar atualização");
    if (forcarAviso) alert("Não foi possível checar atualização: " + erro.message);
  }

  if (forcarAviso || telaAtual === "config") renderizarPreservandoScroll();
}

function verificarAtualizacaoManual() {
  appConfig = {
    ...appConfig,
    ...lerConfigAppCampos()
  };
  salvarDados();
  verificarAtualizacao(true);
}

async function aplicarAtualizacaoAgora() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    location.reload();
    return;
  }

  const registro = await navigator.serviceWorker.getRegistration();
  if (registro?.waiting) {
    registro.waiting.postMessage({ type: "SKIP_WAITING" });
    return;
  }

  location.reload();
}

function iniciarMonitorAtualizacao() {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }

  if (appConfig.autoUpdateEnabled === false) {
    appConfig.updateStatus = appConfig.updateStatus || "Atualização automática desligada";
    salvarDados();
    return;
  }

  updateTimer = setInterval(() => verificarAtualizacao(false), intervaloAtualizacaoMs());
  setTimeout(() => verificarAtualizacao(false), 2500);

  if (isAndroid() || !("serviceWorker" in navigator) || location.protocol === "file:") return;

  navigator.serviceWorker.getRegistration().then((registro) => {
    if (registro) monitorarRegistroAtualizacao(registro);
  }).catch(() => {});

  if (!window.__erpUpdateListener) {
    window.__erpUpdateListener = true;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__erpAtualizando) return;
      window.__erpAtualizando = true;
      if (appConfig.autoUpdateEnabled !== false) {
        location.reload();
      }
    });
  }

}

function processarParametrosAssinaturaUrl() {
  const params = new URLSearchParams(location.search || "");
  if (params.get("pagamento") || params.get("assinatura")) {
    telaAtual = "minhaAssinatura";
    setTimeout(() => alert("Pagamento recebido pelo Mercado Pago. O plano será liberado após confirmação do webhook."), 400);
  }
}

function processarRotaPublicaLegal() {
  const rota = String(location.pathname || "").replace(/\/+$/, "").toLowerCase();
  if (rota === "/privacy" || rota === "/privacidade") {
    telaAtual = "privacy";
  }
  if (rota === "/terms" || rota === "/termos") {
    telaAtual = "terms";
  }
}

function iniciarMonitorPlanoSaas() {
  verificarVencimentoPlanoLocal(true);
  setInterval(() => {
    verificarVencimentoPlanoLocal(true);
  }, 24 * 60 * 60 * 1000);
}

function iniciarMonitorLicencaOnline() {
  if (licenseMonitorTimer) clearInterval(licenseMonitorTimer);
  licenseMonitorTimer = setInterval(() => {
    if (!getUsuarioAtual() || !syncConfig.supabaseAccessToken || !estaOnline()) return;
    sincronizarLicencaEfetivaSePossivel("license-monitor")
      .then(() => sincronizarFilaOfflinePendente("license-monitor"))
      .catch((erro) => registrarDiagnostico("Supabase", "Monitor de licença falhou", erro.message));
  }, LICENSE_MONITOR_INTERVAL_MS);
}

function verificarLembreteBackupPlanoFree() {
  const usuario = getUsuarioAtual();
  if (!usuario) return;
  const plano = getPlanoSaasAtual();
  if (plano.slug !== "free") return;

  const agora = new Date();
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  if (minutos < BACKUP_REMINDER_START_MIN || minutos > BACKUP_REMINDER_END_MIN) return;

  const hoje = agora.toISOString().slice(0, 10);
  if (appConfig.backupReminderLastAt === hoje) return;
  appConfig.backupReminderLastAt = hoje;
  salvarDados();
  mostrarToast("Lembrete: mantenha seu backup em dia. A sincronização ajuda a proteger seus dados entre aparelhos.", "info", 8000);
}

function iniciarLembreteBackupPlanoFree() {
  setTimeout(verificarLembreteBackupPlanoFree, 4000);
  setInterval(verificarLembreteBackupPlanoFree, 15 * 60 * 1000);
}

async function verificarBancosDadosAoEntrar() {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return;
  try {
    const verificacoes = await Promise.allSettled([
      consultarLicencaSupabaseSilencioso(),
      carregarSaasSupabaseSilencioso(),
      sincronizarPersonalizacaoInicialSilencioso()
    ]);
    const personalizacaoAtualizada = verificacoes[2]?.status === "fulfilled" && verificacoes[2].value === true;
    await baixarAtualizacoesSupabaseSilencioso("startup-health").catch(() => false);
    await sincronizarFilaOfflinePendente("startup-health");
    const plano = getPlanoAtual();
    if ((plano.slug === "premium" || plano.slug === "premium_trial") && temAcessoNuvem()) {
      syncConfig.supabaseEnabled = true;
      syncConfig.autoBackupTarget = "supabase";
      await sincronizarSupabaseSilencioso();
    }
    syncConfig.autoBackupStatus = syncConfig.autoBackupStatus || "Banco verificado";
    salvarDados();
    if (personalizacaoAtualizada || ["dashboard", "backup", "config", "minhaAssinatura"].includes(telaAtual)) {
      agendarRenderizacaoPreservandoScroll(160);
    }
  } catch (erro) {
    registrarDiagnostico("Supabase", "Verificação inicial do banco falhou", erro.message);
  }
}

function nomeArquivoPdfPedido(pedidoId, cliente = "", data = new Date()) {
  const clienteSeguro = textoArquivoSeguro(cliente || "sem-cliente", "sem-cliente").toLowerCase();
  const idSeguro = textoArquivoSeguro(pedidoId || "novo", "novo").toLowerCase();
  return `pedido-${clienteSeguro}-${dataHoraArquivo(data)}-${idSeguro}.pdf`;
}

window.addEventListener("resize", () => {
  aplicarPersonalizacao();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const novoModoMobile = isMobile();
    if (novoModoMobile !== modoMobileAtual) {
      modoMobileAtual = novoModoMobile;
      renderApp();
      return;
    }

    ajustarJanelasDashboardAoWorkspace(false);
    manterCalculadoraVisivel(false);
  }, 120);
});

window.addEventListener("pagehide", () => {
  salvarCacheSessaoLocal();
  salvarDados();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    salvarCacheSessaoLocal();
    salvarDados();
    assistantRuntimeReady = false;
    try { getAIPlugin()?.unloadAiModel?.(); } catch (_) {}
  } else if (document.visibilityState === "visible") {
    sincronizarLicencaEfetivaSePossivel("visible").catch((erro) => registrarDiagnostico("Supabase", "Licença ao voltar para o app falhou", erro.message));
    sincronizarAlteracoesLocaisSilencioso("visible").catch((erro) => registrarDiagnostico("sync", "Sync ao voltar para o app falhou", erro.message));
  }
});

window.addEventListener("online", () => {
  sincronizarLicencaEfetivaSePossivel("online").catch((erro) => registrarDiagnostico("Supabase", "Licença ao voltar internet falhou", erro.message));
  sincronizarAlteracoesLocaisSilencioso("online").catch((erro) => registrarDiagnostico("sync", "Sync ao voltar internet falhou", erro.message));
});

document.addEventListener("DOMContentLoaded", () => {
  configurarTelemetriaErros();
  configurarMonetizacaoAds();
  iniciarIntroAbertura();
  configurarEventListenersArquitetura();
  configurarGestosDrawerLateral();
  processarRotaPublicaLegal();
  processarParametrosAssinaturaUrl();
  processarRetornoOAuthSupabase().then(async (processou) => {
    if (!processou) {
      await restaurarCacheSessaoLocal();
      if (!getUsuarioAtual() && !adminLogado && telaAtual === "dashboard") {
        telaAtual = "admin";
      }
      renderApp();
    }
  });
  iniciarAutoBackup();
  iniciarMonitorAtualizacao();
  iniciarMonitorPlanoSaas();
  iniciarMonitorLicencaOnline();
  iniciarLembreteBackupPlanoFree();
  setTimeout(verificarBancosDadosAoEntrar, 1800);
  monitorarSessao();
  document.addEventListener("pointermove", moverJanelaDashboard);
  document.addEventListener("pointermove", moverCalculadora);
  document.addEventListener("pointerdown", verificarDuploToqueForaCalculadora);
  document.addEventListener("pointerup", finalizarJanelaDashboard);
  document.addEventListener("pointerup", finalizarCalculadora);
  document.addEventListener("pointercancel", finalizarJanelaDashboard);
  document.addEventListener("pointercancel", finalizarCalculadora);
});

window.addEventListener("error", (event) => {
  registrarDiagnostico("erro", event.message || "Erro de execução", `${event.filename || ""}:${event.lineno || ""}:${event.colno || ""}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const motivo = event.reason?.message || String(event.reason || "Promessa rejeitada");
  registrarDiagnostico("promessa", motivo, event.reason?.stack || "");
});
