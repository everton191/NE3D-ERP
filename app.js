// ==========================================================
// Simplifica 3D - layout mobile/desktop corrigido
// ==========================================================

const APP_VERSION = "2026.05.07-delete-test-fix";
const SYSTEM_NAME = "Simplifica 3D";
const PROJECT_COVER_IMAGE = "assets/simplifica-brand-cover.jpg";
const PROJECT_ICON_IMAGE = "assets/icon-512.png";
const INTRO_VIDEO_SRC = "assets/intro.mp4";
const INTRO_VIDEO_ASPECT_RATIO = "2160 / 2264";
const INTRO_VIDEO_FRAME_WIDTH = "min(100vw, 95.4064dvh)";
const INTRO_VIDEO_FRAME_HEIGHT = "min(100dvh, 104.8148vw)";
const SUPABASE_DEFAULT_URL = String(globalThis?.__SUPABASE_URL__ || "https://qsufnnivlgdidmjuaprb.supabase.co");
const SUPABASE_DEFAULT_ANON_KEY = String(globalThis?.__SUPABASE_ANON_KEY__ || "sb_publishable_lyLrAr-NKPVrnrO5_J-5Ow_WJDyq8t-");
const SUPPORT_EMAIL = "paessilvae@gmail.com";
const SUPERADMIN_BOOTSTRAP_EMAIL = "";
const SUPERADMIN_BOOTSTRAP_HASH = "pbkdf2$120000$7IdXWxbOcEGHYrhsgKxbwQ==$zi+SJZy2LcZmhy0NiWxjIZ43/A9GJZiW0B5/hDSIwJg=";
const SECURITY_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SECURITY_SESSION_WARNING_MS = 2 * 60 * 1000;
const LOGIN_LOCK_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
// TODO: Reativar WhatsApp 2FA somente com Edge Function/backend, provedor oficial, armazenamento com expiração e validação server-side.
const WHATSAPP_2FA_BACKEND_ENABLED = false;
const DEFAULT_SAAS_PLANS = [
  { id: "free", slug: "free", name: "Free", price: 0, maxUsers: 1, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: 25, active: true, recommended: false, allowPdf: false, allowReports: false, allowPermissions: false, kind: "free", showsAds: true },
  { id: "premium_trial", slug: "premium_trial", name: "Teste gratis", price: 0, maxUsers: 5, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: null, active: true, recommended: false, allowPdf: true, allowReports: true, allowPermissions: true, kind: "trial", durationDays: 7, showsAds: false },
  { id: "premium", slug: "premium", name: "Pago", price: 19.9, maxUsers: 5, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: null, active: true, recommended: true, allowPdf: true, allowReports: true, allowPermissions: true, kind: "paid", showsAds: false }
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
const PLAN_DEBUG_ENABLED = true;
const PAID_PRICE_TIERS = [
  { limit: 100, price: 19.9 },
  { limit: 200, price: 24.9 },
  { limit: Infinity, price: 29.9 }
];
const PREMIUM_FIRST_MONTH_PRICE = PAID_PRICE_TIERS[0].price;
const PREMIUM_MONTHLY_PRICE = PAID_PRICE_TIERS[0].price;
const AD_MIN_INTERVAL_MS = 20 * 60 * 1000;
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
const LIST_PAGE_SIZE = 50;
const SUPERADMIN_PAGE_SIZE = 50;
const LOCAL_SESSION_CACHE_KEY = "simplifica3dSessionCache";
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
let pedidoVisualizandoId = null;
let modoMobileAtual = window.innerWidth < 768;
let resizeTimer = null;
let adminLogado = sessionStorage.getItem("adminLogado") === "sim";
let usuarioAtualEmail = sessionStorage.getItem("usuarioAtualEmail") || "";
let twoFactorPending = null;
let updateTimer = null;
let dashboardWindowAction = null;
let calcWidgetAction = null;
let sessionTimer = null;
let sessionWarned = false;
let assistantOpen = false;
let assistantMinimized = false;
let assistantMessages = [];

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
  brandWatermarkEnabled: true,
  theme: "dark",
  accentColor: "#073b4b",
  compactMode: false,
  showBrandInHeader: true,
  defaultMargin: 100,
  defaultEnergy: 0.85,
  defaultFilamentCost: 150,
  defaultPrinterType: "FDM",
  defaultPrintType: "",
  defaultMaterial: "",
  companySetupCompleted: false,
  defaultPrinterModel: "Ender 3",
  defaultResinCost: 180,
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
  updateDownloadUrl: "",
  updateManifestUrl: "",
  updatePromptedVersion: "",
  updatePromptedAt: "",
  browserPasswordSaveOffer: true,
  keepSessionCache: true,
  biometricEnabled: false,
  biometricOfferDismissed: false,
  backupReminderLastAt: "",
  telemetryEnabled: true,
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
        `${appError.message}${contexto.detail ? " | " + contexto.detail : ""}`
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
  } catch (erro) {
    registrarDiagnostico("AdMob", "Configuração de monetização falhou", erro.message || erro);
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
    hasError: !!document.querySelector(".feedback-status.error, .saas-sync-state.error, .toast-erro")
  };
}

function shouldShowAds(user = getUsuarioMonetizacao(), context = contextoInterstitialSeguro()) {
  if (isSuperAdmin() || adminLogado) return false;
  const estadoPlano = resolverEstadoPlano(user || getUsuarioAtual(), { source: "shouldShowAds" });
  if (estadoPlano.hasPremium) return false;
  const tela = String(context?.screenName || telaAtual || "").toLowerCase();
  if (["admin", "assinatura", "minhaassinatura", "planos", "conta", "seguranca", "superadmin", "onboarding", "acessonegado", "privacy", "terms"].includes(tela)) return false;
  if (context?.isEditingOrder || context?.isCalculating || context?.isExportingPdf || context?.isModalOpen || context?.isTyping || context?.hasError) return false;
  const ultimo = Date.parse(user?.lastAdShownAt || billingConfig.lastAdShownAt || 0) || 0;
  if (ultimo && Date.now() - ultimo < AD_MIN_INTERVAL_MS) return false;
  return estadoPlano.adsAllowed;
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
    const contexto = contextoInterstitialSeguro("screen_view");
    const resultado = window.AdMobService?.syncBannerForScreen?.(getUsuarioMonetizacao(), contexto);
    if (resultado?.catch) resultado.catch(() => {});
  } catch (erro) {
    registrarErroAplicacaoSilencioso("ADMOB_BANNER_SYNC_FAILED", erro, "Banner AdMob", { tela: telaAtual });
  }
}

function mostrarModalDesbloqueioAnuncio({ tipo = "orders", titulo = "", texto = "" } = {}) {
  return new Promise((resolve) => {
    const popup = document.getElementById("popup");
    if (!popup) {
      alert(texto || "Assine o Premium para continuar.");
      resolve(false);
      return;
    }

    const rewardType = tipo === "pdf" ? "pdf" : "orders";
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
        const resultado = await window.AdMobService?.showRewardedAd?.({
          user: getUsuarioMonetizacao(),
          rewardType,
          onReward: () => {
            if (rewardType === "pdf") window.MonetizationLimits?.unlockPdfByAd?.(getUsuarioMonetizacao());
            else window.MonetizationLimits?.unlockOrdersByAd?.(getUsuarioMonetizacao());
          },
          onError: (erro) => registrarErroAplicacaoSilencioso("ADMOB_REWARDED_LOAD_FAILED", erro, "Rewarded Ad", { rewardType })
        });
        if (resultado?.rewarded) {
          mostrarToast(rewardType === "pdf" ? "Exportação extra liberada." : "Novos pedidos liberados por 30 minutos.", "sucesso", 4500);
          finalizar(true);
          return;
        }
        mostrarToast("Anúncio cancelado. Nenhuma recompensa foi aplicada.", "info", 4500);
        setBotaoLoading(botao, false);
      } catch (erro) {
        registrarErroAplicacaoSilencioso("ADMOB_REWARDED_LOAD_FAILED", erro, "Rewarded Ad", { rewardType });
        mostrarToast("Não foi possível carregar o anúncio agora. Tente novamente em alguns instantes.", "erro", 5000);
        setBotaoLoading(botao, false);
      }
    };

    document.getElementById("rewardAdWatch")?.addEventListener("click", assistir);
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
      StateStore.set("usuarios", normalizarUsuarios(usuarios));
      let usuario = usuarios.find((item) => item.email === email);
      let senhaValida = false;
      let erroLoginOnline = null;
      let source = "local";

      if (usuario && !usuarioEstaBloqueado(usuario)) {
        senhaValida = await verificarSenhaUsuario(usuario, senha);
      }

      if (!senhaValida) {
        try {
          usuario = await this.loginWithSupabase(email, senha);
          senhaValida = !!usuario && !usuarioEstaBloqueado(usuario);
          source = "supabase";
        } catch (erro) {
          erroLoginOnline = erro;
          ErrorService.capture(erro, { area: "Supabase", action: "Login online falhou", errorKey: "LOGIN_FAILED", silent: true });
        }
      } else if (deveConectarSupabaseNoLogin(usuario, email)) {
        try {
          const usuarioOnline = await this.loginWithSupabase(email, senha);
          if (usuarioOnline) {
            usuario = usuarioOnline;
            senhaValida = !usuarioEstaBloqueado(usuario);
            source = "supabase";
          }
        } catch (erro) {
          erroLoginOnline = erro;
          usuario = await this.recoverOnlineAccount(usuario, senha, erro);
          senhaValida = !!usuario && !usuarioEstaBloqueado(usuario);
          source = usuario?.supabasePending ? "local-pending" : "supabase";
        }
      }

      if (!usuario || !senhaValida) {
        const motivo = !usuario ? "Usuário inexistente" : "Senha inválida ou usuário inativo";
        registrarFalhaLogin(email, motivo);
        throw ErrorService.toAppError(erroLoginOnline || new Error(motivo), {
          code: "AUTH_INVALID_CREDENTIALS",
          userMessage: erroSupabaseEmailNaoConfirmado(erroLoginOnline)
            ? "Confirme seu e-mail antes de entrar pelo Supabase."
            : "Usuário ou senha inválidos."
        });
      }

      const hidratado = await this.hydrateAuthenticatedUser(usuario, { source });
      return { usuario: hidratado || usuario, source };
    } catch (erro) {
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
    let cadastroOnline = null;
    let cadastroAguardandoConfirmacao = false;
    if (!emailValido(email)) {
      throw new AppError("E-mail inválido", {
        code: "AUTH_INVALID_EMAIL",
        userMessage: "Informe um e-mail válido."
      });
    }
    try {
      syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
      syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
      const dados = await requisicaoSupabase("/auth/v1/signup", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          password: senha,
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
        cadastroAguardandoConfirmacao = true;
        syncConfig.supabaseUserId = usuarioAuth.id;
        syncConfig.supabaseEmail = email;
        salvarDados();
      }
    } catch (erro) {
      const appError = ErrorService.capture(erro, { area: "Supabase", action: "Cadastro online", errorKey: "SIGNUP_FAILED", silent: true });
      if (appError.code === "AUTH_ALREADY_REGISTERED") throw appError;
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
    await definirSenhaUsuario(local.usuario, senha, false);
    salvarDados();
    return { ...local, cadastroOnline, cadastroAguardandoConfirmacao };
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
  localStorage.setItem("estoque", JSON.stringify(estoque));
  localStorage.setItem("caixa", JSON.stringify(caixa));
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
  localStorage.setItem("orcamentos", JSON.stringify(orcamentos));
  localStorage.setItem("historico", JSON.stringify(historico));
  localStorage.setItem("diagnostics", JSON.stringify(diagnostics));
  localStorage.setItem("sugestoes", JSON.stringify(sugestoes));
  localStorage.setItem("securityLogs", JSON.stringify(securityLogs));
  localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
  localStorage.setItem("passwordResetTokens", JSON.stringify(passwordResetTokens));
  localStorage.setItem("saasClients", JSON.stringify(saasClients));
  localStorage.setItem("saasPlans", JSON.stringify(saasPlans));
  localStorage.setItem("saasSubscriptions", JSON.stringify(saasSubscriptions));
  localStorage.setItem("saasPayments", JSON.stringify(saasPayments));
  localStorage.setItem("saasSessions", JSON.stringify(saasSessions));
  localStorage.setItem("usageCounters", JSON.stringify(usageCounters));
  localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  localStorage.setItem("syncConfig", JSON.stringify(criarSyncConfigPersistente()));
  localStorage.setItem("appConfig", JSON.stringify(appConfig));
  localStorage.setItem("billingConfig", JSON.stringify(billingConfig));
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

async function restaurarCacheSessaoLocal() {
  if (appConfig.keepSessionCache === false) return false;
  if (usuarioAtualEmail) {
    try {
      const emailSessaoAtual = normalizarEmail(usuarioAtualEmail);
      carregarSessaoSensivelSupabase();
      if (emailSessaoAtual && syncConfig.supabaseRefreshToken && !sessaoSupabaseValidaParaEmail(emailSessaoAtual)) {
        const renovada = await renovarSessaoSupabase();
        if (!renovada) {
          mostrarToast("Sua sessão expirou. Faça login novamente.", "erro", 7000);
          return false;
        }
      }
      await sincronizarLicencaEfetivaSePossivel("restoreSession-active");
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
    if (appConfig.biometricEnabled && isAndroid()) {
      const biometria = await confirmarBiometriaSeDisponivel("Confirme sua identidade para abrir seus dados.");
      if (biometria.disponivel && !biometria.ok) return false;
    }

    if (syncConfig.supabaseRefreshToken && !sessaoSupabaseValidaParaEmail(email)) {
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

function registrarDiagnostico(tipo, mensagem, detalhes = "") {
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
  mostrarToast(String(mensagem || "Erro registrado").slice(0, 120), "erro");
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
    onboardingCompleted: usuario?.onboardingCompleted === true || usuario?.onboarding_completed === true,
    onboardingStep: Math.max(0, Math.min(4, Number(usuario?.onboardingStep ?? usuario?.onboarding_step ?? 0) || 0)),
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
    const usuario = normalizarUsuario({
      ...local,
      ...remoto,
      papel,
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
  const clientesPagos = new Set();
  saasSubscriptions.forEach((assinatura) => {
    const normalizada = normalizarAssinaturaSaas(assinatura);
    if (normalizada.activePlan === "premium" || (normalizada.priceLocked && normalizada.planPrice > 0)) {
      clientesPagos.add(String(normalizada.clientId || normalizada.id));
    }
  });
  const total = clientesPagos.size;
  const tier = PAID_PRICE_TIERS.find((item) => total < item.limit) || PAID_PRICE_TIERS[PAID_PRICE_TIERS.length - 1];
  return tier.price;
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
  return {
    id: sessao.id || criarIdLocal("session"),
    clientId: sessao.clientId || sessao.client_id || "",
    userId: sessao.userId || sessao.user_id || "",
    deviceId: sessao.deviceId || sessao.device_id || deviceId,
    ip: sessao.ip || "",
    userAgent: sessao.userAgent || sessao.user_agent || navigator.userAgent || "",
    startedAt: sessao.startedAt || sessao.started_at || new Date().toISOString(),
    lastSeenAt: sessao.lastSeenAt || sessao.last_seen_at || new Date().toISOString(),
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
  if (!canUsePremiumFeatures()) return false;
  const plano = getPlanoSaasAtual();
  if (recurso === "pdf") return !!plano.allowPdf;
  if (recurso === "reports") return !!plano.allowReports;
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
    return `
      <div class="danger-zone">
        <h2 class="section-title">Verificação em duas etapas</h2>
        <p class="muted">2FA WhatsApp desativado temporariamente. Entre com e-mail e senha.</p>
        <div class="actions">
          <button class="btn" onclick="cancelar2FA()">Voltar ao login</button>
        </div>
      </div>
    `;
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
  const usuario = getUsuarioAtual();
  return isSuperAdmin(usuario) ? "superadmin" : normalizarEmail(usuario?.email || billingConfig.licenseEmail || deviceId);
}

function prepararRegistroOnline(registro = {}) {
  // Preparação para Supabase: todo dado novo recebe owner_id sem remover o localStorage atual.
  return {
    ...registro,
    owner_id: registro.owner_id || getDataOwnerId()
  };
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

  if (usuarioEhDonoDaLicenca(emailLicenca)) return true;

  const tipo = detectarTipoDispositivo();
  const limites = getLimitesDispositivos();
  const lista = normalizarDispositivosLicenca();
  const atual = lista.find((item) => item.email === emailLicenca && item.tipo === tipo && item.id === deviceId);

  if (!atual && lista.filter((item) => item.email === emailLicenca).length >= limites.total) {
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

function renderMarcaProjeto(classe = "brand-logo", alt = "Marca do projeto", tipo = "") {
  const variant = tipo || (classe.includes("side-brand-logo") ? "icon" : "cover");
  const src = getMarcaProjetoSrc(variant);
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
  if (!getUsuarioAtual() && !adminLogado) return;
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
  const trialActive = activePlan === "premium_trial" && trial.active;

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

  const snapshot = {
    state,
    source,
    activePlan,
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
      descricao: "Acesso total de superadmin"
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
    [PLAN_ACCESS_STATES.TRIAL]: "Trial",
    [PLAN_ACCESS_STATES.ACTIVE]: "Pago",
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

function exigirPlanoCompleto() {
  return PlanService.exigirPlanoCompleto();
}

function permitirAcaoPlanoCompleto() {
  const resultado = exigirPlanoCompleto();
  if (resultado.allowed) return true;
  mostrarBloqueioPlano(resultado);
  return false;
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
            "Para dúvidas: paessilvae@gmail.com"
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
          "paessilvae@gmail.com"
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
  if (!window.MonetizationLimits) {
    if (!limitePedidosAtingido()) return true;
    mostrarModalLimitePlano("Limite atingido. Assine o Premium para continuar.");
    return false;
  }
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

  document.body.classList.toggle("compact-mode", !!appConfig.compactMode);
  document.body.dataset.screenFit = appConfig.screenFit || "auto";
  document.body.dataset.screenProfile = detectarPerfilTela();

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
  document.querySelectorAll(".menu-button, .side-nav-button, .popup-nav-button").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.tela === telaAtual);
  });
}

function renderApp() {
  const app = document.getElementById("app");
  if (!app) return;
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
  preencherImpressoras();
  preencherMateriaisCalculadora();
}

function podeMostrarControlesFlutuantes() {
  return !!getUsuarioAtual() && !isTelaPublica(telaAtual) && telaAtual !== "onboarding";
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
        ${renderTopbar()}
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
      <label class="topbar-search">
        <span>🔎</span>
        <input placeholder="Buscar pedido, cliente ou material" onkeydown="buscarGlobal(event, this.value)">
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
  const termo = String(valor || "").trim().toLowerCase();
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

  alert("Nada encontrado para: " + valor);
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

function deveMostrarOnboarding(usuario = getUsuarioAtual()) {
  if (!usuario || isSuperAdmin(usuario)) return false;
  return usuario.onboardingCompleted !== true;
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

function abrirAssistente() {
  assistantOpen = true;
  assistantMinimized = false;
  if (!assistantMessages.length) {
    assistantMessages.push({
      role: "assistant",
      text: "Olá! Sou o assistente local do Simplifica 3D. Posso ajudar com pedido, estoque, calculadora, backup, PDF, plano, login e Supabase."
    });
  }
  renderApp();
}

function fecharAssistente() {
  assistantOpen = false;
  assistantMinimized = false;
  renderApp();
}

function minimizarAssistente() {
  assistantMinimized = true;
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
  abrirAssistente();
}

function obterRespostaAssistente(texto, contexto = montarContextoAssistenteEnxuto(texto)) {
  const pergunta = normalizarTextoAssistente(texto);
  const resposta = assistantResponses.find((item) => item.keywords.some((keyword) => pergunta.includes(normalizarTextoAssistente(keyword))));
  const estimado = estimarTokensTexto(JSON.stringify(contexto));
  window.__assistantLastTokenEstimate = estimado;
  console.debug("[Assistente] Contexto enxuto estimado", { tokens: estimado, tela: contexto.tela });
  return resposta?.answer || "Ainda não sei responder isso. Procure o suporte ou tente usar palavras como pedido, estoque, backup, PDF ou plano.";
}

function enviarMensagemAssistente(event) {
  event?.preventDefault?.();
  const input = document.getElementById("assistantInput");
  const texto = (input?.value || "").trim();
  if (!texto) return;
  const contexto = montarContextoAssistenteEnxuto(texto);
  assistantMessages.push({ role: "user", text: texto });
  assistantMessages.push({ role: "assistant", text: obterRespostaAssistente(texto, contexto) });
  limitarMensagensAssistente();
  renderApp();
  setTimeout(() => document.getElementById("assistantInput")?.focus(), 0);
}

function renderAssistenteVirtual() {
  if (!podeMostrarControlesFlutuantes()) return "";

  if (!assistantOpen) {
    return `<button class="assistant-fab" onclick="abrirAssistente()" title="Assistente local">💬</button>`;
  }

  if (assistantMinimized) {
    return `
      <button class="assistant-fab assistant-fab-open" onclick="abrirAssistente()" title="Abrir assistente">
        💬
      </button>
    `;
  }

  const mensagens = assistantMessages.map((msg) => `
    <div class="assistant-message ${msg.role === "user" ? "assistant-user" : "assistant-bot"}">
      ${escaparHtml(msg.text)}
    </div>
  `).join("");

  return `
    <section class="assistant-panel" aria-label="Assistente virtual local">
      <div class="assistant-header">
        <div>
          <strong>Assistente Simplifica 3D</strong>
          <span>Local/offline</span>
        </div>
        <div class="row-actions">
          <button class="icon-button" onclick="limparConversaAssistente()" title="Limpar conversa">🧹</button>
          <button class="icon-button" onclick="minimizarAssistente()" title="Minimizar">−</button>
          <button class="icon-button danger" onclick="fecharAssistente()" title="Fechar">×</button>
        </div>
      </div>
      <div class="assistant-body">${mensagens}</div>
      <form class="assistant-form" onsubmit="enviarMensagemAssistente(event)">
        <input id="assistantInput" placeholder="Pergunte sobre pedido, estoque, PDF..." autocomplete="off">
        <button class="btn" type="submit">Enviar</button>
      </form>
    </section>
  `;
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
      <div class="side-brand">
        <button class="icon-button side-menu-toggle" onclick="alternarMenuLateral()" title="${recolhido ? "Mostrar menu" : "Esconder menu"}">☰</button>
        ${renderMarcaProjeto("side-brand-logo", "Capa do projeto")}
        <div class="side-brand-text">
          <strong>${escaparHtml(appConfig.appName || SYSTEM_NAME)}</strong>
          <span>${escaparHtml(getPlanoAtual().nome)}</span>
        </div>
      </div>
      ${grupos.map((grupo) => `
        <div class="side-section">
          <span>${escaparHtml(grupo.titulo)}</span>
          ${grupo.itens.map(renderBotaoLateral).join("")}
        </div>
      `).join("")}
    </aside>
  `;
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
        { tela: "backup", icone: "☁️", texto: "Backup" },
        { tela: "preferencias", icone: "⚙️", texto: "Preferências" },
        { tela: "conta", icone: "👤", texto: "Conta" },
        { tela: "seguranca", icone: "🔒", texto: "Segurança" },
        { tela: "feedback", icone: "💡", texto: "Feedback" },
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

function abrirMenuPopup() {
  if (!isMobile()) {
    alternarMenuLateral();
    return;
  }

  const popup = document.getElementById("popup");
  if (!popup) return;

  const itens = getItensMenuPopup();
  const grupos = getMenuGroups().map((grupo) => grupo.titulo);
  popup.innerHTML = `
    <div class="side-drawer-backdrop" role="dialog" aria-modal="true" aria-label="Menu do aplicativo" onclick="fecharPopup()">
      <aside class="side-menu side-drawer" onclick="event.stopPropagation()">
        <div class="side-brand">
          <button class="icon-button side-menu-toggle" onclick="fecharPopup()" title="Fechar">✕</button>
          ${renderMarcaProjeto("side-brand-logo", "Capa do projeto")}
          <div class="side-brand-text">
            <strong>${escaparHtml(appConfig.appName || SYSTEM_NAME)}</strong>
            <span>${escaparHtml(getPlanoAtual().nome)}</span>
          </div>
        </div>
        ${grupos.map((grupo) => `
          <div class="side-section">
            <span>${grupo}</span>
            ${itens.filter((item) => item.grupo === grupo).map(renderBotaoLateral).join("")}
          </div>
        `).join("")}
        <div class="actions single">
          <button class="btn secondary" onclick="abrirCalculadora()">🧮 Calculadora</button>
        </div>
      </aside>
    </div>
  `;
  atualizarMenu();
}

function abrirTelaMenuPopup(tela) {
  fecharPopup();
  trocarTela(tela);
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
    <div class="mobile-home">
      ${renderAtualizacaoAndroidDownload()}
      ${home}
      ${renderAcoesRapidas()}
    </div>
    ${painelAberto ? renderPainelMobile(telaAtual) : ""}
    ${renderMobileBottomNav()}
  `;
}

function getMobileBottomNavItems() {
  return [
    { tela: "dashboard", icone: "📊", texto: "Dashboard" },
    { tela: "pedidos", icone: "📋", texto: "Pedidos" },
    { tela: "calculadora", icone: "🧮", texto: "Calculadora" },
    { tela: "estoque", icone: "📦", texto: "Estoque" },
    { tela: "mais", icone: "☰", texto: "Mais" }
  ].filter((item) => canAccessScreen(item.tela));
}

function getMobileBottomNavActive() {
  const principais = new Set(["dashboard", "pedidos", "calculadora", "estoque"]);
  return principais.has(telaAtual) ? telaAtual : "mais";
}

function renderMobileBottomNav() {
  const ativo = getMobileBottomNavActive();
  const itens = getMobileBottomNavItems();
  if (!itens.length || !getUsuarioAtual()) return "";
  return `
    <nav class="mobile-bottom-nav" aria-label="Navegação principal">
      ${itens.map((item) => `
        <button class="mobile-bottom-nav-button ${ativo === item.tela ? "active" : ""}" type="button" onclick="trocarTela('${item.tela}')" aria-label="${escaparAttr(item.texto)}">
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
        <button class="icon-button" onclick="trocarTela('config')" title="Configurações">⚙️</button>
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
    { tela: "calculadora", icone: "🧮", texto: "Calc 3D" },
    { tela: "pedidos", icone: "📋", texto: "Pedidos" },
    { tela: "producao", icone: "🖨️", texto: "Produção" },
    { tela: "estoque", icone: "📦", texto: "Estoque" },
    { tela: "caixa", icone: "💰", texto: "Caixa" },
    { tela: "clientes", icone: "👥", texto: "Clientes" },
    { tela: "backup", icone: "☁️", texto: "Backup" },
    { tela: "assinatura", icone: "💳", texto: "Planos" }
  ];
  if (isAndroid()) acoes.unshift({ acao: "verificarAtualizacaoManual()", icone: "⬇️", texto: "Atualizar APK" });
  if (!getUsuarioAtual() || podeGerenciarUsuarios()) acoes.push({ tela: "usuarios", icone: "🔐", texto: "Admin" });
  if (getUsuarioAtual()) acoes.push({ tela: "conta", icone: "👤", texto: "Conta" });
  if (isSuperAdmin()) acoes.push({ tela: "superadmin", icone: "🛡️", texto: "Super" });

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
        <div class="metric"><span>Último acesso</span><strong>${usuario.lastLoginAt ? new Date(usuario.lastLoginAt).toLocaleString("pt-BR") : "Não registrado"}</strong></div>
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
  if (!isAndroid()) return "";
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

function hojeIsoData() {
  return new Date().toISOString().slice(0, 10);
}

function dataPedidoIso(pedido) {
  if (pedido?.criadoEm) return String(pedido.criadoEm).slice(0, 10);
  const data = String(pedido?.data || "");
  const partes = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (partes) return `${partes[3]}-${partes[2]}-${partes[1]}`;
  return "";
}

function getDashboardStats() {
  const hoje = hojeIsoData();
  const pedidosHoje = pedidos.filter((pedido) => dataPedidoIso(pedido) === hoje);
  const faturamentoDia = pedidosHoje.reduce((total, pedido) => total + totalPedido(pedido), 0);
  const pedidosAbertos = pedidos.filter((pedido) => !["entregue", "cancelado", "finalizado"].includes(String(pedido.status || "aberto"))).length;
  const producoesAtivas = pedidos.filter((pedido) => String(pedido.status || "") === "producao").length;
  const estoqueBaixo = normalizarEstoque().filter((material) => (Number(material.qtd) || 0) <= estoqueMinimoKg).length;
  const lucroEstimado = pedidos.reduce((total, pedido) => {
    const itens = normalizarItensPedido(pedido);
    const custo = itens.reduce((soma, item) => soma + (Number(item.custoTotal) || 0), 0);
    return total + Math.max(0, totalPedido(pedido) - custo);
  }, 0);
  return { faturamentoDia, pedidosHoje: pedidosHoje.length, pedidosAbertos, producoesAtivas, estoqueBaixo, lucroEstimado };
}

function abrirBlocoDashboard(tela, filtro = "") {
  if (tela === "pedidos") {
    window.__pedidosFiltroDashboard = filtro || "";
  }
  trocarTela(tela || "dashboard");
}

function renderDashboard() {
  const totaisCaixa = calcularTotaisCaixa();
  const stats = getDashboardStats();
  const plano = getPlanoAtual();

  const cards = [
    { icone: "💸", titulo: "Faturamento do dia", valor: formatarMoeda(stats.faturamentoDia), badge: "Hoje", tela: "caixa" },
    { icone: "📋", titulo: "Pedidos do dia", valor: stats.pedidosHoje, badge: "Operação", tela: "pedidos", filtro: "hoje" },
    { icone: "🕒", titulo: "Pedidos em aberto", valor: stats.pedidosAbertos, badge: stats.pedidosAbertos ? "Ação" : "OK", tela: "pedidos", filtro: "abertos" },
    { icone: "🖨️", titulo: "Produções ativas", valor: stats.producoesAtivas, badge: "Produção", tela: "producao" },
    { icone: "📦", titulo: "Estoque baixo", valor: stats.estoqueBaixo, badge: stats.estoqueBaixo ? "Atenção" : "OK", tela: "estoque" },
    { icone: "📈", titulo: "Lucro estimado", valor: formatarMoeda(stats.lucroEstimado), badge: "Margem", tela: "relatorios" },
    { icone: "💳", titulo: "Status do plano", valor: plano.nome, badge: plano.status, tela: "assinatura" },
    { icone: "⏳", titulo: "Dias restantes", valor: plano.diasRestantes >= 9999 ? "Ativo" : plano.diasRestantes, badge: "Plano", tela: "assinatura" }
  ];

  return `
    <section class="dashboard-pro">
      <div class="dashboard-hero card">
        <div class="project-cover">
          ${renderMarcaProjeto("project-cover-image", "Capa do projeto")}
          <div class="project-cover-text">
            <strong>${escaparHtml(appConfig.businessName || appConfig.appName || SYSTEM_NAME)}</strong>
            <span>${escaparHtml(plano.descricao || "Dashboard profissional de impressão 3D")}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn" onclick="trocarTela('calculadora')">🧮 Calculadora 3D</button>
          <button class="btn secondary" onclick="trocarTela('pedidos')">📋 Pedidos</button>
          <button class="btn ghost" onclick="trocarTela('planos')">Ver plano</button>
        </div>
      </div>

      <div class="dashboard-kpis">
        ${cards.map((card) => `
          <button class="kpi-card kpi-card-button" onclick="abrirBlocoDashboard('${card.tela}', '${card.filtro || ""}')">
            <span class="kpi-icon">${card.icone}</span>
            <div>
              <span>${escaparHtml(card.titulo)}</span>
              <strong>${escaparHtml(card.valor)}</strong>
            </div>
            <em class="status-badge ${classeStatusPlano(String(card.badge).toLowerCase())}">${escaparHtml(card.badge)}</em>
          </button>
        `).join("")}
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

function renderPedido() {
  const planoAtual = getPlanoAtual();
  if (planoAtual.blockLevel === "total" || planoAtual.status === "bloqueado") return renderBloqueioPlano("Novo pedido");
  const titulo = pedidoEditando ? "✏️ Editando pedido" : "📦 Novo pedido";
  const botao = pedidoEditando ? "Atualizar pedido" : "Fechar pedido";
  itensPedido = normalizarItensPedido(itensPedido);
  const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  const statusAtual = pedidoEditando?.status || "aberto";

  const itensHtml = itensPedido.length
    ? itensPedido.map((item, i) => `
        <div class="order-item product-item">
          <label class="field">
            <span>Produto</span>
            <input value="${escaparAttr(item.nome)}" oninput="editarNome(${i}, this.value)">
          </label>
          <label class="field">
            <span>Tipo impressão</span>
            <select onchange="editarTipoImpressaoItem(${i}, this.value)">
              <option value="FDM" ${item.tipoImpressao !== "RESINA" ? "selected" : ""}>FDM</option>
              <option value="RESINA" ${item.tipoImpressao === "RESINA" ? "selected" : ""}>RESINA</option>
            </select>
          </label>
          <label class="field">
            <span>Qtd</span>
            <input type="number" min="1" step="1" value="${Number(item.qtd) || 1}" onchange="editarQtd(${i}, this.value)">
          </label>
          <label class="field">
            <span>Tempo (h)</span>
            <input type="number" min="0" step="0.01" value="${Number(item.tempoHoras) || 0}" onchange="editarTempoItem(${i}, this.value)">
          </label>
          <label class="field">
            <span>Valor</span>
            <input type="number" min="0" step="0.01" value="${(Number(item.valor) || 0).toFixed(2)}" onchange="editarPreco(${i}, this.value)">
          </label>
          <div class="material-editor">
            <div class="row-title">
              <strong>Materiais usados</strong>
              <span class="muted">${getMateriaisItem(item).length > 1 ? "Multifilamento" : "Material único"}</span>
            </div>
            ${renderMateriaisItemPedido(item, i)}
            <button class="btn ghost" onclick="adicionarMaterialProduto(${i})">Adicionar material</button>
          </div>
          <button class="icon-button danger" onclick="removerItem(${i})" title="Remover item">✕</button>
        </div>
      `).join("")
    : `<p class="empty">Nenhum item adicionado. Use a calculadora para criar o primeiro item do pedido.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>${titulo}</h2>
        ${pedidoEditando ? `<button class="icon-button" onclick="cancelarEdicaoPedido()" title="Cancelar edição">↩</button>` : ""}
      </div>
      <label class="field">
        <span>Cliente</span>
        <input id="clienteNome" placeholder="Nome do cliente" value="${escaparAttr(clientePedido)}" oninput="atualizarClientePedido(this.value)">
      </label>
      <label class="field">
        <span>WhatsApp do cliente</span>
        <input id="clienteTelefone" inputmode="tel" placeholder="Ex.: 5585999999999" value="${escaparAttr(clienteTelefonePedido)}" oninput="atualizarTelefoneClientePedido(this.value)">
      </label>
      <label class="field">
        <span>Status</span>
        <select id="pedidoStatus">
          ${["aberto", "producao", "pausado", "entregue", "cancelado"].map((status) => `<option value="${status}" ${statusAtual === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>

      ${itensHtml}

      <div class="total-line">
        <span>Total</span>
        <strong>${formatarMoeda(total)}</strong>
      </div>

      <div class="actions">
        <button class="btn secondary" onclick="abrirCalculadora()">🧮 Calcular item</button>
        <button class="btn ghost" onclick="adicionarProdutoManual()">Adicionar produto manual</button>
        <button class="btn ghost" onclick="gerarPDF()">📄 PDF</button>
        <button class="btn ghost" onclick="enviarWhats()">📲 WhatsApp</button>
        <button class="btn" onclick="fecharPedido()">✅ ${botao}</button>
      </div>
    </section>
  `;
}

function renderMaterialOptions(selectedId = "") {
  const materiais = normalizarEstoque();
  if (!materiais.length) return `<option value="">Cadastre estoque primeiro</option>`;
  return materiais.map((material) => `
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
  const podeOperar = temAcessoCompleto();
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
      ${podeOperar ? "" : `<p class="muted">Seu plano está inativo. Visualização liberada; alterações voltam após regularização.</p>`}
      ${podeOperar ? `
      <label class="field">
        <span>Tipo de material</span>
        <select id="matTipo">
          ${tiposMaterial.map((tipo) => `<option value="${tipo}">${tipo}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>Cor do material</span>
        <input id="matCor" placeholder="Ex.: Preto, Branco, Transparente">
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
  const podeOperar = temAcessoCompleto();
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
              <button class="btn danger" onclick="event.stopPropagation(); removerPedido(${id})">Remover</button>` : ""}
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
  if (!planoPermiteRecurso("reports")) return renderBloqueioPlano("Relatórios");
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
  const podeOperar = temAcessoCompleto();
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
      <button class="btn" onclick="adicionarMovimentoCaixa()">Lançar movimento</button>` : `<p class="muted">Seu plano está inativo. Visualização liberada; lançamentos voltam após regularização.</p><div class="actions"><button class="btn" type="button" data-action="open-payment">Pagar agora</button></div>`}
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
        <div class="danger-zone">
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
        </div>

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
          ${renderMarcaProjeto("auth-logo", "Simplifica 3D", "icon")}
          <div>
            <h1>Simplifica 3D</h1>
            <p>Organize seus pedidos sem complicação</p>
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

function renderPersonalizacao() {
  const corAtual = appConfig.accentColor || "#073b4b";
  const resolucaoAtual = `${window.innerWidth || 0} x ${window.innerHeight || 0}`;
  const acessoMarca = temAcessoCompleto();
  const marcaAtual = getMarcaProjetoSrc();
  return `
    <section class="card">
      <div class="card-header">
        <h2>🎨 Personalização</h2>
        <span class="status-badge">${escaparHtml(appConfig.theme === "light" ? "Claro" : appConfig.theme === "auto" ? "Automático" : "Escuro")}</span>
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
        <h2 class="section-title">PDF, Pix e marca</h2>
        <p class="muted">Esses dados aparecem no PDF do pedido. A marca d'água e o logotipo ficam liberados no plano completo.</p>
        <div class="brand-preview">
          <img src="${escaparAttr(marcaAtual)}" alt="Prévia da marca no PDF">
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
            <input id="brandLogoFileConfig" class="file-input" type="file" accept="image/png,image/jpeg" ${acessoMarca ? "" : "disabled"}>
          </label>
          <div class="metric">
            <span>Marca no PDF</span>
            <strong>${acessoMarca ? (appConfig.brandLogoDataUrl ? "Logo salva" : "Capa padrão") : "Bloqueado"}</strong>
          </div>
        </div>
        <label class="checkbox-row">
          <input id="brandWatermarkEnabledConfig" type="checkbox" ${appConfig.brandWatermarkEnabled !== false ? "checked" : ""} ${acessoMarca ? "" : "disabled"}>
          <span>Usar logo como marca d'água no PDF</span>
        </label>
        ${appConfig.brandLogoDataUrl && acessoMarca ? `<button class="btn ghost" onclick="removerLogoMarca()">Remover logo salva</button>` : ""}
      </div>

      <div class="sync-grid">
        <label class="field">
          <span>Tema</span>
          <select id="themeConfig">
            <option value="dark" ${appConfig.theme === "dark" ? "selected" : ""}>Escuro</option>
            <option value="light" ${appConfig.theme === "light" ? "selected" : ""}>Claro</option>
            <option value="auto" ${appConfig.theme === "auto" ? "selected" : ""}>Automático</option>
          </select>
        </label>
        <label class="field">
          <span>Cor principal</span>
          <input id="accentColorConfig" type="color" value="${escaparAttr(corAtual)}">
        </label>
      </div>

      <div class="color-swatches">
        ${["#073b4b", "#ff941c", "#2f6fed", "#e11d48", "#f59e0b", "#0f766e"].map((cor) => `
          <button class="color-swatch" style="--swatch:${cor}" onclick="selecionarCor('${cor}')" title="${cor}"></button>
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
    </section>
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

      <div class="plan-state-panel">
        <div class="metric">
          <span>Plano atual</span>
          <strong>${escaparHtml(plano.nome)}</strong>
        </div>
        <div class="metric">
          <span>Status</span>
          <strong>${superadmin ? "Acesso interno" : isTrial ? "Teste ativo" : isPremiumAtivo ? "Premium ativo" : estadoPlano.pending ? "Pagamento pendente" : "Gratuito"}</strong>
        </div>
        <div class="metric">
          <span>Dias restantes</span>
          <strong>${superadmin || plano.diasRestantes >= 9999 ? "Ativo" : isTrial ? diasTrial : isPremiumAtivo ? diasPlano : "-"}</strong>
        </div>
        <div class="metric">
          <span>Preço Premium</span>
          <strong>${formatarMoeda(precoVigente)}/mês</strong>
        </div>
      </div>

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
    <div class="plan-status-card trial" aria-label="Teste Premium Ativo">
      <div class="plan-card-top">
        <span class="plan-badge plan-badge-trial">Teste Premium Ativo</span>
        <strong class="plan-days">${textoDias}</strong>
      </div>
      <h3>Você está testando o Premium gratuitamente</h3>
      <p>Ao final do período, sua conta volta para o plano gratuito caso você não assine.</p>
      <div class="actions">
        <button class="btn plan-primary-button" type="button" data-action="open-payment" data-slug="premium">Assinar Premium</button>
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
        <span class="plan-badge">Premium Ativo</span>
        <span class="status-badge badge-pago">${escaparHtml(validade)}</span>
      </div>
      <h3>Premium</h3>
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
      <h3>${isPremium ? "Premium" : "Free"}</h3>
      ${isPremium
        ? `<div class="plan-price">${formatarMoeda(preco)}<small>/mês</small></div>`
        : `<p class="plan-free-copy">Para continuar sem custo, com anúncios leves e recursos básicos.</p>`}
      ${renderPlanBenefitList(beneficios)}
      ${isPremium && options.isTrial ? `<p class="muted plan-card-note">Assinar agora não cancela o teste atual; o acesso Premium continua normalmente enquanto o pagamento é confirmado.</p>` : ""}
      <div class="actions single">
        ${superadmin
          ? `<button class="btn ghost" type="button" disabled>Não aplicável</button>`
          : isPremium
            ? `<button class="btn plan-primary-button" type="button" data-action="open-payment" data-slug="premium">Assinar Premium</button>`
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
  const planPrice = Math.max(0, Number(dados.plan_price ?? dados.planPrice ?? dados.amount ?? dados.valor ?? getPrecoPagoVigenteLocal()) || getPrecoPagoVigenteLocal());
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
    const planPrice = getPrecoPagoVigenteLocal();
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
    const planPrice = getPrecoPagoVigenteLocal();
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
  const input = document.getElementById("accentColorConfig");
  if (input) {
    input.value = cor;
  }
}

function lerPersonalizacaoCampos() {
  return {
    appName: (document.getElementById("appNameConfig")?.value || SYSTEM_NAME).trim(),
    businessName: (document.getElementById("businessNameConfig")?.value || "Minha empresa 3D").trim(),
    whatsappNumber: normalizePhoneBR(document.getElementById("whatsappNumberConfig")?.value || ""),
    documentFooter: (document.getElementById("documentFooterConfig")?.value || "").trim(),
    pixKey: (document.getElementById("pixKeyConfig")?.value || "").trim(),
    pixReceiverName: (document.getElementById("pixReceiverNameConfig")?.value || "").trim(),
    pixCity: (document.getElementById("pixCityConfig")?.value || "").trim(),
    pixDescription: (document.getElementById("pixDescriptionConfig")?.value || "Pedido Simplifica 3D").trim(),
    brandWatermarkEnabled: document.getElementById("brandWatermarkEnabledConfig") ? !!document.getElementById("brandWatermarkEnabledConfig")?.checked : appConfig.brandWatermarkEnabled !== false,
    theme: document.getElementById("themeConfig")?.value || "dark",
    accentColor: document.getElementById("accentColorConfig")?.value || "#073b4b",
    compactMode: !!document.getElementById("compactModeConfig")?.checked,
    showBrandInHeader: !!document.getElementById("showBrandInHeaderConfig")?.checked,
    defaultMargin: Math.max(0, parseFloat(document.getElementById("defaultMarginConfig")?.value) || 100),
    defaultEnergy: Math.max(0, parseFloat(document.getElementById("defaultEnergyConfig")?.value) || 0.85),
    defaultFilamentCost: Math.max(0, parseFloat(document.getElementById("defaultFilamentCostConfig")?.value) || 150),
    screenFit: document.getElementById("screenFitConfig")?.value === "manual" ? "manual" : "auto",
    uiScale: Math.min(140, Math.max(70, parseFloat(document.getElementById("uiScaleConfig")?.value) || 100)),
    desktopCardMinWidth: Math.min(560, Math.max(220, parseFloat(document.getElementById("desktopCardMinWidthConfig")?.value) || 320)),
    desktopMaxWidth: Math.min(3200, Math.max(900, parseFloat(document.getElementById("desktopMaxWidthConfig")?.value) || 1480))
  };
}

function lerLogoMarcaSelecionada() {
  const arquivo = document.getElementById("brandLogoFileConfig")?.files?.[0];
  if (!arquivo || !temAcessoCompleto()) return Promise.resolve(appConfig.brandLogoDataUrl || "");

  if (!arquivo.type.startsWith("image/")) {
    alert("Escolha uma imagem válida para a logo.");
    return Promise.resolve(appConfig.brandLogoDataUrl || "");
  }

  if (!["image/png", "image/jpeg"].includes(arquivo.type)) {
    alert("Use uma logo em PNG ou JPG para garantir compatibilidade com o PDF.");
    return Promise.resolve(appConfig.brandLogoDataUrl || "");
  }

  if (arquivo.size > 700 * 1024) {
    alert("Use uma logo menor que 700 KB para não pesar o backup.");
    return Promise.resolve(appConfig.brandLogoDataUrl || "");
  }

  return new Promise((resolve) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result || ""));
    leitor.onerror = () => {
      alert("Não foi possível carregar a logo.");
      resolve(appConfig.brandLogoDataUrl || "");
    };
    leitor.readAsDataURL(arquivo);
  });
}

async function salvarPersonalizacao() {
  const logo = await lerLogoMarcaSelecionada();
  appConfig = {
    ...appConfig,
    ...lerPersonalizacaoCampos(),
    brandLogoDataUrl: logo
  };
  salvarDados();
  registrarHistorico("Personalização", "Preferências do app atualizadas");
  renderApp();
}

function removerLogoMarca() {
  if (!confirm("Remover a logo salva do PDF?")) return;
  appConfig.brandLogoDataUrl = "";
  salvarDados();
  registrarHistorico("Personalização", "Logo removida do PDF");
  renderApp();
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
    brandWatermarkEnabled: true,
    theme: "dark",
    accentColor: "#073b4b",
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
  renderApp();
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

function mostrarToast(mensagem, tipo = "info", duracao = 4200) {
  if (typeof document === "undefined" || !document.body || !mensagem) return;
  let area = document.getElementById("toastArea");
  if (!area) {
    area = document.createElement("div");
    area.id = "toastArea";
    area.className = "toast-area";
    document.body.appendChild(area);
  }

  const toast = document.createElement("div");
  toast.className = "app-toast toast-" + (tipo || "info");
  const icone = tipo === "erro" ? "×" : tipo === "sucesso" ? "✓" : tipo === "loading" ? "•••" : "!";
  toast.innerHTML = `<span class="toast-icon">${icone}</span><strong>${escaparHtml(mensagem)}</strong>`;
  area.appendChild(toast);

  if (tipo !== "loading") {
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
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  usuario.lastLoginAt = new Date().toISOString();
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
    sincronizarSupabaseSilencioso().catch((erro) => registrarDiagnostico("sync", "Sync Supabase pós-login falhou", erro.message));
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
  usuarioAtualEmail = "";
  adminLogado = false;
  sessionStorage.removeItem("usuarioAtualEmail");
  sessionStorage.removeItem("adminLogado");
  sessionStorage.removeItem("sessionLastActivity");
  limparSessaoSensivelSupabase();
  localStorage.removeItem(LOCAL_SESSION_CACHE_KEY);
  registrarSeguranca("Logout", "sucesso", "", email);
  salvarDados();
  renderApp();
}

function registrarAtividadeSessao() {
  if (!usuarioAtualEmail && !adminLogado) return;
  sessionStorage.setItem("sessionLastActivity", String(Date.now()));
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
    updateCheckInterval: Math.max(5, parseFloat(document.getElementById("updateCheckInterval")?.value || appConfig.updateCheckInterval || 30) || 30)
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
  return {
    versao: 3,
    app: SYSTEM_NAME,
    exportadoEm: new Date().toISOString(),
    deviceId,
    data: {
      estoque,
      caixa,
      pedidos,
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
  const data = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `backup-simplifica3d-${email}-${data}.json`;
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
  const backup = normalizarBackup(dados);

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

  billingConfig = {
    ...billingConfig,
    ...backup.billingConfig,
    ownerMode: false,
    registeredDevices: normalizarDispositivosLicenca(backup.billingConfig.registeredDevices || billingConfig.registeredDevices),
    deviceLimits: backup.billingConfig.deviceLimits || billingConfig.deviceLimits || { mobile: 1, desktop: 1 },
    cloudSyncPaidOnly: false
  };

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
    ultimoBackup: backup.configuracoes.ultimoBackup || syncConfig.ultimoBackup,
    ultimaSync: backup.configuracoes.ultimaSync || syncConfig.ultimaSync
  };

  salvarDados();
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
    const dataAtual = Date.parse(atual?.atualizadoEm || atual?.data || atual?.createdAt || 0) || 0;
    const dataNova = Date.parse(item?.atualizadoEm || item?.data || item?.createdAt || 0) || 0;
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
    mapa.set(usuario.email, dataNova >= dataAtual ? { ...atual, ...usuario } : atual);
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
  if (licenca && ["assinatura", "minhaAssinatura", "admin", "dashboard"].includes(telaAtual)) renderApp();
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
          redirect_to: location.origin + location.pathname
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
    const dados = await requisicaoSupabase(caminho, {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password: senha })
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

function montarRedirectSupabaseOAuth() {
  return location.origin + location.pathname;
}

function limparParametrosOAuthSupabase() {
  if (typeof window === "undefined" || !window.history) return;
  const url = new URL(location.href);
  ["error", "error_code", "error_description", "msg"].forEach((parametro) => url.searchParams.delete(parametro));
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
  const erroOAuth = obterErroOAuthSupabase();
  if (erroOAuth) {
    registrarDiagnostico("Supabase", "Login Google recusado", `${erroOAuth.erro}: ${erroOAuth.descricao}`);
    mostrarToast(
      erroOAuth.descricao.includes("Unsupported provider")
        ? "Login Google ainda não está ativado no Supabase."
        : "Login Google não concluído.",
      "erro",
      7000
    );
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
    salvarSessaoSupabase({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      user
    }, user.email);

    const email = normalizarEmail(user.email);
    usuarios = normalizarUsuarios(usuarios);
    let usuario = usuarios.find((item) => item.email === email);
    if (!usuario) {
      const nomeGoogle = user.user_metadata?.name || user.user_metadata?.full_name || email.split("@")[0];
      try {
        const local = criarClienteSaasLocal({
          nome: nomeGoogle,
          email,
          senha: "",
          negocio: appConfig.businessName || `Empresa de ${nomeGoogle}`,
          telefone: "",
          planSlug: "premium_trial",
          trial: true
        });
        usuario = local.usuario;
      } catch (_) {
        usuario = normalizarUsuario({
          nome: nomeGoogle,
          email,
          papel: "user",
          ativo: true
        });
        usuarios.push(usuario);
      }
    }
    await carregarPerfilSaasSupabase(usuario);
    await garantirCadastroSaasOnlineAposLogin(usuario);
    sessionStorage.removeItem("supabaseOAuthProvider");
    sessionStorage.removeItem("supabaseOAuthRedirectTo");
    limparParametrosOAuthSupabase();
    concluirLoginUsuario(usuario);
    return true;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Login Google não concluído", erro.message);
    limparParametrosOAuthSupabase();
    return false;
  }
}

function sairSupabase() {
  limparSessaoSensivelSupabase();
  syncConfig.supabaseUserId = "";
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
    alert("Você está offline. Os dados locais continuam salvos e podem ser sincronizados quando a conexão voltar.");
    renderApp();
    return;
  }

  try {
    syncConfig.autoBackupStatus = "Salvando...";
    salvarDados();
    renderApp();
    await salvarPerfilSupabase();
    const remoto = await obterBackupSupabase();
    if (remoto) {
      aplicarBackup(remoto, "mesclar");
    }
    if (!await salvarBackupSupabase()) return;
    const agora = new Date().toISOString();
    syncConfig.supabaseLastSync = agora;
    syncConfig.ultimoBackup = agora;
    syncConfig.ultimaSync = agora;
    syncConfig.autoBackupStatus = "Sincronizado";
    salvarDados();
    registrarHistorico("Supabase", remoto ? "Dados mesclados e enviados" : "Backup inicial criado");
    alert("Sincronização concluída.");
    renderApp();
  } catch (erro) {
    syncConfig.autoBackupStatus = "Erro ao sincronizar";
    salvarDados();
    console.warn("[Sync/Supabase] Falha ao sincronizar", erro);
    registrarErroAplicacaoSilencioso("SUPABASE_SYNC_FAILED", erro, "Sincronizar Supabase");
    alert("Erro ao sincronizar.");
    renderApp();
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

  const remoto = await obterBackupSupabase();
  if (remoto) {
    aplicarBackup(remoto, "mesclar");
  }
  if (!await salvarBackupSupabase()) return false;

  const agora = new Date().toISOString();
  syncConfig.supabaseLastSync = agora;
  syncConfig.ultimoBackup = agora;
  syncConfig.ultimaSync = agora;
  syncConfig.autoBackupLastRun = agora;
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
      renderApp();
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

function removerItem(i) {
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

function usuarioPodeEditarPedidoSemSenha(usuario = getUsuarioAtual()) {
  if (adminLogado && !usuario) return true;
  return !!usuario && ["superadmin", "admin"].includes(usuario.papel);
}

async function autorizarEdicaoPedido() {
  const usuario = getUsuarioAtual();
  if (usuarioPodeEditarPedidoSemSenha(usuario)) return true;

  const senha = await solicitarEntradaTexto({
    titulo: "Autorizar edição",
    mensagem: "Para editar este pedido, informe a senha de um admin.",
    tipo: "password",
    obrigatorio: true
  });
  if (senha === null) return false;
  if (!senha) {
    alert("Senha obrigatória para editar pedido.");
    return false;
  }

  if (isAmbienteLocal() && senha === "123") {
    registrarSeguranca("Autorização edição pedido", "bloqueado", "Senha padrão local desativada");
    alert("A senha padrão local foi desativada. Use a senha real de um admin.");
    return false;
  }

  const clientId = usuario?.clientId || getClientIdAtual();
  const autorizadores = normalizarUsuarios(usuarios).filter((item) => {
    if (!["superadmin", "admin"].includes(item.papel)) return false;
    if (usuarioEstaBloqueado(item)) return false;
    return !clientId || !item.clientId || item.clientId === clientId || item.papel === "superadmin";
  });

  for (const autorizador of autorizadores) {
    if (await verificarSenhaUsuario(autorizador, senha)) {
      registrarSeguranca("Autorização edição pedido", "sucesso", autorizador.email, usuario?.email || "");
      return true;
    }
  }

  registrarSeguranca("Autorização edição pedido", "erro", "Senha inválida", usuario?.email || "");
  alert("Senha de autorização inválida.");
  return false;
}

async function editarPedido(id) {
  try {
    if (!permitirAcaoPlanoCompleto()) return;
    if (!await autorizarEdicaoPedido()) return;
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
    trocarTela("pedido");
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedidos", action: "Abrir pedido para edição", errorKey: "OPEN_ORDER_FAILED" });
  }
}

function cancelarEdicaoPedido() {
  pedidoEditando = null;
  itensPedido = [];
  clientePedido = "";
  clienteTelefonePedido = "";
  renderApp();
}

function removerPedido(id) {
  try {
    if (!permitirAcaoPlanoCompleto()) return;
    const pedido = pedidos.find((item) => Number(item.id) === Number(id));
    if (!pedido) return;
    if (!confirm("Remover este pedido?")) return;

    const total = totalPedido(pedido);
    const cliente = clienteDoPedido(pedido);
    devolverEstoquePedido(pedido, "cancelamento");
    pedidos = pedidos.filter((item) => Number(item.id) !== Number(id));
    caixa = caixa.filter((movimento) => {
      if (Number(movimento.pedidoId) === Number(id)) return false;
      return !(Number(movimento.valor) === total && descricaoCaixa(movimento) === "Pedido - " + cliente);
    });

    if (pedidoEditando && Number(pedidoEditando.id) === Number(id)) {
      cancelarEdicaoPedido();
    }

    salvarDados();
    registrarHistorico("Pedido", "Pedido removido: " + cliente);
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Pedidos", action: "Remover pedido", errorKey: "DELETE_ORDER_FAILED" });
  }
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

    if (!aplicarEstoquePedido(pedido, pedidoEditando)) return;

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
      data: new Date().toISOString()
    }));

    salvarDados();
    registrarHistorico("Pedido", (pedidoEditando ? "Pedido atualizado: " : "Pedido fechado: ") + cliente);
    registrarAcaoCompletaMonetizacao(pedidoEditando ? "order_updated" : "order_created");
    pedidoEditando = null;
    itensPedido = [];
    clientePedido = "";
    clienteTelefonePedido = "";
    if (appConfig.onboardingFirstOrderPending && deveMostrarOnboarding()) {
      finalizarOnboarding(false);
      return;
    }
    telaAtual = isMobile() ? "pedidos" : telaAtual;
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, {
      area: "Pedidos",
      action: pedidoEditando ? "Atualizar pedido" : "Salvar pedido",
      errorKey: pedidoEditando ? "UPDATE_ORDER_FAILED" : "SAVE_ORDER_FAILED"
    });
  }
}

function alterarStatusPedido(id, status) {
  if (!permitirAcaoPlanoCompleto()) return;
  const pedido = pedidos.find((item) => Number(item.id) === Number(id));
  if (!pedido) return;
  pedido.status = status || "aberto";
  pedido.atualizadoEm = new Date().toISOString();
  salvarDados();
  registrarHistorico("Produção", `Status do pedido ${id}: ${pedido.status}`);
  renderApp();
}

function addMaterial() {
  if (!permitirAcaoPlanoCompleto()) return;
  const tipo = document.getElementById("matTipo")?.value || "PLA";
  const cor = (document.getElementById("matCor")?.value || "").trim();
  const qtd = document.getElementById("matQtd")?.value;

  try {
    InventoryService.addMaterial({ tipo, cor, qtd });
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Adicionar material" });
  }
}

function editarMaterial(i) {
  if (!permitirAcaoPlanoCompleto()) return;
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
          <input id="stockEditColor" value="${escaparAttr(material.cor || "")}">
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
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Editar material" });
  }
}

function removerMaterial(i) {
  if (!permitirAcaoPlanoCompleto()) return;
  if (!estoque[i]) return;
  if (!confirm("Remover este material?")) return;

  try {
    InventoryService.removeMaterial(i);
    renderApp();
  } catch (erro) {
    ErrorService.notify(erro, { area: "Estoque", action: "Remover material" });
  }
}

function adicionarMovimentoCaixa() {
  if (!permitirAcaoPlanoCompleto()) return;
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
  if (!permitirAcaoPlanoCompleto()) return;
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

function renderCalculadoraConteudo() {
  return `
    <div class="calc-grid">
      <label class="field">
        <span>Tipo de impressora</span>
        <select id="printerType" onchange="preencherImpressoras()">
          <option value="FDM" ${appConfig.defaultPrinterType !== "RESINA" ? "selected" : ""}>FDM</option>
          <option value="RESINA" ${appConfig.defaultPrinterType === "RESINA" ? "selected" : ""}>RESINA</option>
        </select>
      </label>
      <label class="field">
        <span>Impressora</span>
        <select id="printer"></select>
      </label>
    </div>

    <label class="field">
      <span>Material do estoque</span>
      <select id="calcMaterial"></select>
    </label>

    <div class="calc-grid">
      <label class="field">
        <span>Peso em gramas</span>
        <input id="peso" type="number" min="0" step="0.01" placeholder="Ex.: 80">
      </label>
      <label class="field">
        <span>Material R$/kg</span>
        <input id="filamento" type="number" min="0" step="0.01" value="${Number(appConfig.defaultFilamentCost) || 150}">
      </label>
      <label class="field">
        <span>Tempo em horas</span>
        <input id="tempo" type="number" min="0" step="0.01" placeholder="Ex.: 4.5">
      </label>
      <label class="field">
        <span>Quantidade</span>
        <input id="quantidade" type="number" min="1" step="1" value="1">
      </label>
      <label class="field">
        <span>Energia R$/kWh</span>
        <input id="energia" type="number" min="0" step="0.01" value="${Number(appConfig.defaultEnergy) || 0.85}">
      </label>
      <label class="field">
        <span>Consumo W</span>
        <input id="consumo" type="number" min="0" step="1">
      </label>
      <label class="field">
        <span>Custo hora</span>
        <input id="custoHora" type="number" min="0" step="0.01">
      </label>
      <label class="field">
        <span>Margem %</span>
        <input id="margem" type="number" min="0" step="1" value="${Number(appConfig.defaultMargin) || 100}">
      </label>
      <label class="field">
        <span>Taxa extra</span>
        <input id="taxaExtra" type="number" min="0" step="0.01" value="0">
      </label>
    </div>

    <label class="field">
      <span>Nome do item</span>
      <input id="nomeItem" placeholder="Ex.: suporte personalizado">
    </label>

    <button class="btn secondary" onclick="calcular()">Calcular</button>
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

function manterCalculadoraVisivel(salvar = false) {
  if (!appConfig.calculatorWidget) return;
  salvarCalculadoraWidget({}, salvar);
}

function preencherImpressoras() {
  const select = document.getElementById("printer");
  if (!select) return;
  const tipoSelect = document.getElementById("printerType");
  const tipo = tipoSelect?.value || appConfig.defaultPrinterType || "FDM";

  select.innerHTML = "";
  Object.entries(printers).filter(([, impressora]) => impressora.tipo === tipo).forEach(([nome]) => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    if (nome === appConfig.defaultPrinterModel) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = function () {
    const impressora = printers[this.value];
    appConfig.defaultPrinterType = impressora?.tipo || tipo;
    appConfig.defaultPrinterModel = this.value;
    document.getElementById("consumo").value = impressora.consumo;
    document.getElementById("custoHora").value = impressora.custo;
    salvarDados();
  };

  select.dispatchEvent(new Event("change"));
}

function preencherMateriaisCalculadora() {
  const select = document.getElementById("calcMaterial");
  if (!select) return;
  select.innerHTML = `<option value="">Sem vínculo com estoque</option>` + renderMaterialOptions(select.value);
}

function calcular() {
  const plano = getPlanoSaasAtual();
  if (plano.maxCalculatorUses && getUsoMensal("calculadora") >= plano.maxCalculatorUses) {
    mostrarModalLimitePlano("Você atingiu o limite de usos da calculadora do seu plano. Faça upgrade para continuar.");
    return;
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
    return;
  }
  const printer = document.getElementById("printer")?.value || appConfig.defaultPrinterModel || "";
  const tipoImpressao = printers[printer]?.tipo || document.getElementById("printerType")?.value || "FDM";
  const materialId = document.getElementById("calcMaterial")?.value || "";
  const materialEstoque = getMaterialEstoque(materialId);

  const material = (peso / 1000) * filamento;
  const energiaC = (consumo / 1000) * tempo * energia;
  const maquina = tempo * custoHora;
  const custo = material + energiaC + maquina + taxaExtra;
  const preco = custo * (1 + margem / 100);

  ultimoCalculo = {
    preco: preco / qtd,
    custo: custo / qtd,
    custoMaterial: material,
    custoEnergia: energiaC,
    custoMaquina: maquina,
    taxaExtra,
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
      <span>Custo total</span><strong>${formatarMoeda(custo)}</strong>
      <span>Preço sugerido de venda</span><strong>${formatarMoeda(preco)}</strong>
    </div>
  `;
  incrementarUsoMensal("calculadora");
}

function adicionarItem() {
  if (!ultimoCalculo) {
    calcular();
  }

  if (!ultimoCalculo || ultimoCalculo.preco <= 0) {
    alert("Calcule um valor válido antes de adicionar");
    return;
  }

  const nome = document.getElementById("nomeItem")?.value.trim() || "Item calculado";
  let qtd = 1;
  try {
    qtd = InventoryService.parseNumberStrict(document.getElementById("quantidade")?.value, "quantidade", { min: 1 });
  } catch (erro) {
    ErrorService.notify(erro, { area: "Calculadora", action: "Adicionar item" });
    return;
  }

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
    valor: ultimoCalculo.preco,
    total: ultimoCalculo.preco * qtd
  });

  if (telaAtual !== "calculadora") minimizarCalculadora();
  trocarTela("pedido");
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

function gerarPdfCalculadora() {
  if (!ultimoCalculo) calcular();
  adicionarItem();
  setTimeout(() => gerarPDF(), 50);
}

function fecharPopup() {
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
            <span>Valor</span>
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

    if (["plan-modal-close", "stock-edit-cancel"].includes(acao)) {
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
  if (!temAcessoCompleto()) return "";
  return carregarImagemDataUrl(getMarcaProjetoSrc());
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
  if (!temAcessoCompleto() || !marcaDataUrl) return;

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
  const data = new Date().toLocaleDateString("pt-BR");
  const pedidoId = pedidoEditando?.id || Date.now();
  const cidade = appConfig.pixCity || "Não informada";
  window.__simplificaExportandoPdf = true;
  try {
  const telefoneCliente = await obterTelefoneWhatsappPedido(pedidoEditando);
  const marcaPdf = await obterMarcaPdfDataUrl();

  adicionarMarcaPdf(doc, largura, altura, marcaPdf);

  doc.setFillColor(corRgb[0], corRgb[1], corRgb[2]);
  doc.rect(0, 0, largura, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(empresa, margem, 14);
  doc.setFontSize(10);
  doc.text("Pedido #" + pedidoId, margem, 23);
  doc.text(data, largura - margem, 23, { align: "right" });

  if (temAcessoCompleto() && marcaPdf) {
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
      adicionarMarcaPdf(doc, largura, altura, marcaPdf);
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
      adicionarMarcaPdf(doc, largura, altura, marcaPdf);
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
  const salvou = await salvarOuCompartilharPdf(doc, `pedido-${pedidoId}-${cliente}.pdf`, "Pedido " + cliente);
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

function exportarBackup() {
  const dados = criarSnapshotBackupUsuarioAtual();

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoBackupUsuario();
  link.click();
  URL.revokeObjectURL(url);
  registrarHistorico("Backup", "Backup local exportado");
  alert("Backup exportado com sucesso.");
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent || "");
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
        apkUrl: getAndroidDownloadUrl(manifest)
      };
    } catch (erro) {
      erros.push(`${manifestUrl}: ${erro.message}`);
    }
  }

  throw new Error(erros.join(" | ") || "Manifesto não configurado");
}

function existeAtualizacaoAndroid(manifest) {
  return !!manifest?.version && manifest.version !== APP_VERSION;
}

function avisarAtualizacaoAndroid(manifest, forcarAviso = false) {
  const versao = manifest.version || "nova";
  const url = getAndroidDownloadUrl(manifest);
  const jaAvisado = appConfig.updatePromptedVersion === versao;

  if (!forcarAviso && jaAvisado) return;

  appConfig.updatePromptedVersion = versao;
  appConfig.updatePromptedAt = new Date().toISOString();
  salvarDados();

  alert(`Nova versão ${versao} disponível. O download do APK vai abrir agora.`);
  abrirDownloadAtualizacaoAndroid(url);
}

async function verificarAtualizacaoAndroid(forcarAviso = false) {
  if (!isAndroid()) return false;

  try {
    const manifest = await buscarManifestAtualizacaoAndroid();
    appConfig.updateDownloadUrl = getAndroidDownloadUrl(manifest);

    if (existeAtualizacaoAndroid(manifest)) {
      appConfig.updateAvailableVersion = manifest.version;
      salvarStatusAtualizacao(`APK ${manifest.version} disponível`);

      if (appConfig.autoUpdateEnabled !== false || forcarAviso) {
        avisarAtualizacaoAndroid(manifest, forcarAviso);
      }
      return true;
    }

    appConfig.updateAvailableVersion = "";
    salvarStatusAtualizacao("Sistema atualizado");
    if (forcarAviso) alert("Nenhuma atualização nova encontrada.");
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
      appConfig.updateAvailableVersion = existeAtualizacaoAndroid(manifest) ? manifest.version : "";
      salvarStatusAtualizacao(existeAtualizacaoAndroid(manifest) ? `APK ${manifest.version} disponível` : "Sistema atualizado");
      abrirDownloadAtualizacaoAndroid(appConfig.updateDownloadUrl);
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
          renderApp();
        }
      }
    });
  });
}

async function verificarAtualizacao(forcarAviso = false) {
  const atualizacaoAndroidTratada = await verificarAtualizacaoAndroid(forcarAviso);
  if (atualizacaoAndroidTratada) {
    if (forcarAviso || telaAtual === "config") renderApp();
    return;
  }

  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    salvarStatusAtualizacao("Atualização disponível só em http/https");
    if (forcarAviso) alert("Atualização automática funciona quando o app está em http/https ou instalado como PWA.");
    if (forcarAviso || telaAtual === "config") renderApp();
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

  if (forcarAviso || telaAtual === "config") renderApp();
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
    await Promise.allSettled([
      consultarLicencaSupabaseSilencioso(),
      carregarSaasSupabaseSilencioso()
    ]);
    const plano = getPlanoAtual();
    if ((plano.slug === "premium" || plano.slug === "premium_trial") && temAcessoNuvem()) {
      syncConfig.supabaseEnabled = true;
      syncConfig.autoBackupTarget = "supabase";
      await sincronizarSupabaseSilencioso();
    }
    syncConfig.autoBackupStatus = syncConfig.autoBackupStatus || "Banco verificado";
    salvarDados();
    if (["dashboard", "backup", "config", "minhaAssinatura"].includes(telaAtual)) renderApp();
  } catch (erro) {
    registrarDiagnostico("Supabase", "Verificação inicial do banco falhou", erro.message);
  }
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
  } else if (document.visibilityState === "visible") {
    sincronizarLicencaEfetivaSePossivel("visible").catch((erro) => registrarDiagnostico("Supabase", "Licença ao voltar para o app falhou", erro.message));
  }
});

window.addEventListener("online", () => {
  sincronizarLicencaEfetivaSePossivel("online").catch((erro) => registrarDiagnostico("Supabase", "Licença ao voltar internet falhou", erro.message));
});

document.addEventListener("DOMContentLoaded", () => {
  configurarTelemetriaErros();
  configurarMonetizacaoAds();
  iniciarIntroAbertura();
  configurarEventListenersArquitetura();
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
  iniciarLembreteBackupPlanoFree();
  setTimeout(verificarBancosDadosAoEntrar, 1800);
  monitorarSessao();
  document.addEventListener("pointermove", moverJanelaDashboard);
  document.addEventListener("pointermove", moverCalculadora);
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
