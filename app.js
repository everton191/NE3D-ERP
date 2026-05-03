// ==========================================================
// Simplifica 3D - layout mobile/desktop corrigido
// ==========================================================

const APP_VERSION = "2026.05.03-intro-ratio-lock";
const SYSTEM_NAME = "Simplifica 3D";
const PROJECT_COVER_IMAGE = "assets/simplifica-brand-cover.jpg";
const PROJECT_ICON_IMAGE = "assets/icon-512.png";
const INTRO_VIDEO_SRC = "assets/intro.mp4";
const INTRO_VIDEO_ASPECT_RATIO = "2160 / 2264";
const INTRO_VIDEO_FRAME_WIDTH = "min(100vw, 95.4064dvh)";
const INTRO_VIDEO_FRAME_HEIGHT = "min(100dvh, 104.8148vw)";
const SUPABASE_DEFAULT_URL = "https://qsufnnivlgdidmjuaprb.supabase.co";
const SUPABASE_DEFAULT_ANON_KEY = "sb_publishable_lyLrAr-NKPVrnrO5_J-5Ow_WJDyq8t-";
const SUPERADMIN_BOOTSTRAP_EMAIL = "paessilvae@gmail.com";
const SUPERADMIN_BOOTSTRAP_HASH = "pbkdf2$120000$7IdXWxbOcEGHYrhsgKxbwQ==$zi+SJZy2LcZmhy0NiWxjIZ43/A9GJZiW0B5/hDSIwJg=";
const SECURITY_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SECURITY_SESSION_WARNING_MS = 2 * 60 * 1000;
const LOGIN_LOCK_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const DEFAULT_SAAS_PLANS = [
  { id: "free", slug: "free", name: "Free", price: 0, maxUsers: 1, maxOrders: 10, maxClients: 10, maxCalculatorUses: 30, maxStorageMb: 25, active: true, recommended: false, allowPdf: false, allowReports: false, allowPermissions: false, kind: "free" },
  { id: "premium_trial", slug: "premium_trial", name: "Premium Trial", price: 0, maxUsers: 5, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: null, active: true, recommended: false, allowPdf: true, allowReports: true, allowPermissions: true, kind: "trial", durationDays: 7 },
  { id: "premium", slug: "premium", name: "Premium", price: 29.9, maxUsers: 5, maxOrders: null, maxClients: null, maxCalculatorUses: null, maxStorageMb: null, active: true, recommended: true, allowPdf: true, allowReports: true, allowPermissions: true, kind: "paid" }
];
const DEFAULT_TRIAL_DAYS = 7;
const PREMIUM_FIRST_MONTH_PRICE = 19.9;
const PREMIUM_MONTHLY_PRICE = 29.9;
const BILLING_VARIANTS = {
  premium_first_month: { id: "premium_first_month", planId: "premium", amount: PREMIUM_FIRST_MONTH_PRICE },
  premium_monthly: { id: "premium_monthly", planId: "premium", amount: PREMIUM_MONTHLY_PRICE }
};
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
  assinatura: "Plano",
  minhaAssinatura: "Minha Assinatura",
  usuarios: "Usuários",
  seguranca: "Segurança",
  planos: "Planos",
  admin: "Admin",
  superadmin: "Super Admin",
  feedback: "Bugs e sugestões",
  sobre: "Sobre",
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
  autoBackupTarget: "drive",
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
  { keywords: ["backup", "restaurar", "exportar", "supabase", "nuvem", "drive"], answer: "Em Backup você pode exportar um JSON local, restaurar um JSON, sincronizar por Supabase ou usar pasta do Google Drive Desktop. O backup local é o caminho mais seguro para cópia manual; Supabase sincroniza por usuário quando estiver conectado." },
  { keywords: ["pdf", "comprovante", "recibo"], answer: "Para gerar PDF, monte um pedido ou orçamento e clique em Gerar PDF. Trial ativo, plano pago e superadmin têm acesso ao PDF. No celular, se o download direto falhar, o sistema tenta abrir o arquivo em nova aba." },
  { keywords: ["plano", "trial", "pago", "vencido", "bloqueado", "premium"], answer: "O Premium Trial libera recursos por 7 dias. Free mantém limites básicos. Premium libera recursos completos. O primeiro pagamento usa a condição promocional e os seguintes usam o mensal normal. Superadmin sempre tem acesso total." },
  { keywords: ["superadmin", "super", "administrador principal"], answer: "Super Admin é exclusivo do administrador principal. Ele vê a aba Super Admin, gerencia usuários, planos, bloqueios, vencimentos e acessa todas as funções sem limite de aparelho." },
  { keywords: ["login", "entrar", "acesso", "sessao", "sessão"], answer: "Use a área Admin para entrar com e-mail e senha. A sessão expira após inatividade por segurança. Se aparecer Acesso negado, seu perfil não tem permissão para aquela tela ou o plano não libera o recurso." },
  { keywords: ["senha", "recuperar", "esqueci", "trocar"], answer: "Em Segurança você pode alterar sua senha. Use uma senha forte com 8 ou mais caracteres, maiúscula, minúscula, número e símbolo. Se esquecer, use Esqueci minha senha; com Supabase configurado, o reset usa o fluxo de autenticação online." },
  { keywords: ["usuario", "usuário", "usuarios", "usuários", "permissao", "permissão", "perfil"], answer: "Admin e superadmin podem criar usuários. Os perfis são superadmin, admin, operador e visualizador. Operador trabalha na operação; visualizador consulta; admin gerencia usuários e dados; superadmin acessa tudo." },
  { keywords: ["caixa", "financeiro", "relatorio", "relatório"], answer: "Em Caixa você registra entradas e saídas. Os pedidos finalizados entram como movimentação financeira. Relatórios mostram visão resumida para acompanhar faturamento, saldo e operação." },
  { keywords: ["producao", "produção", "impressao", "impressão"], answer: "A tela Produção acompanha pedidos em aberto ou em andamento. Atualize o status para organizar o fluxo de impressão, entrega e finalização." }
];
let billingConfig = carregarObjeto("billingConfig", {
  clientId: "",
  subscriptionId: "",
  planSlug: "free",
  licenseBlockLevel: "none",
  ownerMode: false,
  ownerName: "",
  ownerEmail: "",
  licenseStatus: "free",
  trialStartedAt: "",
  trialDays: DEFAULT_TRIAL_DAYS,
  lastDailyPlanCheck: "",
  blocked: false,
  monthlyPrice: PREMIUM_MONTHLY_PRICE,
  mercadoPagoLink: "",
  licenseEmail: "",
  paidUntil: "",
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
      ? lista.map((item) => item.email === email ? normalizarUsuario({ ...item, ...usuario }) : item)
      : [...lista, normalizarUsuario(usuario)];
    this.set("usuarios", proximaLista);
    if (usuario.clientId) this.set("billingConfig", { clientId: usuario.clientId });
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
          ErrorService.capture(erro, { area: "Supabase", action: "Login online falhou", silent: true });
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
      throw ErrorService.capture(erro, { area: "Autenticação", action: "Login" });
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
      throw ErrorService.capture(erro, { area: "Supabase", action: "Login com senha", silent: true });
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
      throw ErrorService.capture(erro, { area: "Autenticação", action: "Carregar perfil pós-login", detail: contexto.source || "" });
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
        name: "get_saas_license.rpc",
        run: () => requisicaoSupabase("/rest/v1/rpc/get_saas_license", { method: "POST", body: JSON.stringify({}) })
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
      return { ok: false, falhas };
    }
    registrarDiagnostico("Supabase/RLS", "Verificação RLS pós-login", "OK");
    return { ok: true, falhas: [] };
  },
  async signupSaas({ nome, email, senha, negocio, telefone }) {
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
            name: nome,
            business_name: negocio,
            phone: telefone,
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
      const appError = ErrorService.capture(erro, { area: "Supabase", action: "Cadastro online", silent: true });
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
    const sessaoSessao = JSON.parse(sessionStorage.getItem("supabaseSession") || "{}");
    sanitizarCacheSessaoLocalLegado();
    syncConfig = {
      ...syncConfig,
      supabaseAccessToken: sessaoSessao.supabaseAccessToken || syncConfig.supabaseAccessToken || "",
      supabaseRefreshToken: sessaoSessao.supabaseRefreshToken || syncConfig.supabaseRefreshToken || "",
      supabaseTokenExpiresAt: Number(sessaoSessao.supabaseTokenExpiresAt) || Number(syncConfig.supabaseTokenExpiresAt) || 0,
      supabaseUserId: sessaoSessao.supabaseUserId || syncConfig.supabaseUserId || "",
      supabaseEmail: sessaoSessao.supabaseEmail || syncConfig.supabaseEmail || ""
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
      supabaseTokenExpiresAt: Number(syncConfig.supabaseTokenExpiresAt) || 0
    }
  };
  localStorage.setItem(LOCAL_SESSION_CACHE_KEY, JSON.stringify(cache));
}

async function restaurarCacheSessaoLocal() {
  if (usuarioAtualEmail || appConfig.keepSessionCache === false) return false;
  try {
    const cache = JSON.parse(localStorage.getItem(LOCAL_SESSION_CACHE_KEY) || "{}");
    const email = normalizarEmail(cache.usuarioAtualEmail || cache.supabase?.supabaseEmail || "");
    if (!email || !normalizarUsuarios(usuarios).some((usuario) => usuario.email === email && usuario.ativo)) return false;

    carregarSessaoSensivelSupabase();
    if (!appConfig.biometricEnabled) return false;

    if (isAndroid()) {
      const biometria = await confirmarBiometriaSeDisponivel("Confirme sua identidade para abrir seus dados.");
      if (biometria.disponivel && !biometria.ok) return false;
    }

    usuarioAtualEmail = email;
    sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
    registrarAtividadeSessao();
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

function registrarSugestaoLocal(texto, origem = "cliente") {
  const titulo = String(texto || "").trim();
  const chave = normalizarTextoSugestao(titulo);
  if (chave.length < 4) return false;

  const existente = sugestoes.find((item) => item.chave === chave);
  if (existente) {
    existente.votos = (Number(existente.votos) || 1) + 1;
    existente.atualizadoEm = new Date().toISOString();
    existente.origem = origem;
  } else {
    sugestoes.unshift({
      id: Date.now(),
      titulo,
      chave,
      votos: 1,
      origem,
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
  if (alvo === "user" || alvo === "usuario") return "operador";
  return ["superadmin", "dono", "admin", "operador", "visualizador"].includes(alvo) ? alvo : "operador";
}

function normalizarUsuario(usuario) {
  const email = normalizarEmail(usuario?.email);
  if (!email) return null;
  const status = String(usuario?.status || "").toLowerCase();

  return {
    id: usuario?.id || criarIdUsuario(),
    clientId: usuario?.clientId || usuario?.client_id || billingConfig.clientId || "",
    nome: String(usuario?.nome || usuario?.name || usuario?.display_name || email.split("@")[0] || "Usuário").trim(),
    email,
    senha: String(usuario?.senha || ""),
    passwordHash: usuario?.passwordHash || usuario?.senhaHash || "",
    mustChangePassword: usuario?.mustChangePassword === true || usuario?.senhaTemporaria === true || usuario?.must_change_password === true,
    senhaTemporaria: usuario?.senhaTemporaria === true || usuario?.mustChangePassword === true || usuario?.must_change_password === true,
    phone: String(usuario?.phone || usuario?.telefone || "").trim(),
    papel: normalizarPapel(usuario?.papel || usuario?.role),
    ativo: status ? status === "active" : usuario?.ativo !== false,
    bloqueado: usuario?.bloqueado === true || status === "blocked",
    planStatus: usuario?.planStatus || "",
    planExpiresAt: usuario?.planExpiresAt || "",
    trialStartedAt: usuario?.trialStartedAt || "",
    trialDays: Math.max(1, Number(usuario?.trialDays) || Number(billingConfig.trialDays) || 7),
    acceptedTermsAt: usuario?.acceptedTermsAt || usuario?.accepted_terms_at || "",
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
    nome: perfil?.name || perfil?.display_name || perfil?.nome || email.split("@")[0],
    email,
    phone: perfil?.phone || perfil?.telefone || "",
    papel: perfil?.role || perfil?.papel || "operador",
    ativo: status === "active",
    bloqueado: status === "blocked",
    mustChangePassword: perfil?.must_change_password === true || perfil?.mustChangePassword === true,
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
  return {
    id: cliente.id || criarIdLocal("client"),
    clientCode: cliente.clientCode || cliente.client_code || cliente.clienteId || proximoClienteIdS3D(),
    name: String(cliente.name || cliente.nome || cliente.businessName || appConfig.businessName || "Empresa 3D").trim(),
    responsibleName: String(cliente.responsibleName || cliente.responsible_name || cliente.responsavel || cliente.name || "").trim(),
    email,
    phone: String(cliente.phone || cliente.telefone || "").trim(),
    status: ["active", "overdue", "blocked", "inactive", "cancelled"].includes(String(cliente.status || "")) ? cliente.status : "active",
    planoAtual: normalizarSlugPlano(cliente.planoAtual || cliente.plano_atual || "free"),
    statusAssinatura: String(cliente.statusAssinatura || cliente.status_assinatura || cliente.status || "active"),
    createdAt: cliente.createdAt || cliente.created_at || new Date().toISOString(),
    criadoEm: cliente.criadoEm || cliente.criado_em || cliente.createdAt || cliente.created_at || new Date().toISOString(),
    lastAccessAt: cliente.lastAccessAt || cliente.last_access_at || "",
    updatedAt: cliente.updatedAt || cliente.updated_at || new Date().toISOString(),
    inactiveMarkedAt: cliente.inactiveMarkedAt || "",
    deletionPolicy: cliente.deletionPolicy || "mark_only"
  };
}

function normalizarAssinaturaSaas(assinatura = {}) {
  const planoRelacional = assinatura.plans?.slug || assinatura.plan?.slug || "";
  const planSlug = normalizarSlugPlano(assinatura.planSlug || assinatura.plan_slug || planoRelacional || assinatura.planId || assinatura.plan_id || "free");
  const status = normalizarStatusPlano(assinatura.status || assinatura.statusAssinatura || assinatura.status_assinatura || "pending");
  const currentPeriodStart = assinatura.currentPeriodStart || assinatura.current_period_start || assinatura.startedAt || assinatura.started_at || assinatura.createdAt || assinatura.created_at || new Date().toISOString();
  const currentPeriodEnd = assinatura.currentPeriodEnd || assinatura.current_period_end || assinatura.expiresAt || assinatura.expires_at || assinatura.nextBillingAt || assinatura.next_billing_at || assinatura.proximoVencimento || assinatura.proximo_vencimento || "";
  return {
    id: assinatura.id || criarIdLocal("sub"),
    clientId: assinatura.clientId || assinatura.client_id || "",
    userId: assinatura.userId || assinatura.user_id || "",
    planId: planSlug,
    planSlug,
    status,
    statusAssinatura: normalizarStatusPlano(assinatura.statusAssinatura || assinatura.status_assinatura || status),
    promoUsed: assinatura.promoUsed === true || assinatura.promo_used === true,
    billingVariant: normalizarBillingVariant(assinatura.billingVariant || assinatura.billing_variant || (assinatura.promoUsed || assinatura.promo_used ? "premium_monthly" : "premium_first_month")),
    currentPeriodStart,
    currentPeriodEnd,
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
  if (!assinatura) return { status: "pending", blockLevel: "partial", diasAtraso: 0 };
  const status = normalizarStatusPlano(assinatura.status || assinatura.statusAssinatura);
  if (["cancelled", "expired"].includes(status)) return { status, blockLevel: "total", diasAtraso: 0 };
  if (status === "past_due") return { status, blockLevel: "total", diasAtraso: 1 };
  const vencimento = Date.parse(assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0) || 0;
  if ((status === "active" || status === "trialing") && vencimento && vencimento >= Date.now()) {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  if (assinatura.planSlug === "free" && status === "active") {
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
  const assinatura = getAssinaturaSaas();
  return getPlanoSaas(assinatura?.planSlug || billingConfig.planSlug || "free");
}

function limiteUsuariosAtingido() {
  if (isSuperAdmin() || isDono() || billingConfig.ownerMode) return false;
  const plano = getPlanoSaasAtual();
  return getUsuariosDoCliente().filter((usuario) => usuario.ativo !== false).length >= plano.maxUsers;
}

function limitePedidosAtingido() {
  if (isSuperAdmin() || isDono() || billingConfig.ownerMode) return false;
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
  billingConfig.cloudSyncPaidOnly = false;

  const planoAtual = getPlanoSaas(billingConfig.planSlug || "free");
  billingConfig.planSlug = planoAtual.slug;
  billingConfig.monthlyPrice = Number(billingConfig.monthlyPrice) || planoAtual.price;
  billingConfig.trialDays = Math.max(1, Number(billingConfig.trialDays) || DEFAULT_TRIAL_DAYS);

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
  const hoje = hojeIsoData();
  if (billingConfig.lastDailyPlanCheck === hoje && salvar) return;
  let alterou = false;

  saasSubscriptions.forEach((assinatura) => {
    const plano = getPlanoSaas(assinatura.planSlug);
    const vencimento = Date.parse(assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0) || 0;
    if (!vencimento || vencimento >= Date.now()) return;
    if (assinatura.planSlug === "free" || ["cancelled", "expired"].includes(assinatura.status)) return;

    const diasAtraso = Math.max(0, Math.floor((Date.now() - vencimento) / (24 * 60 * 60 * 1000)));
    if (plano.kind === "trial") {
      assinatura.planSlug = "free";
      assinatura.planId = "free";
      assinatura.status = "active";
      assinatura.statusAssinatura = "active";
      assinatura.currentPeriodEnd = "";
      assinatura.expiresAt = "";
      assinatura.nextBillingAt = "";
      assinatura.overdueSince = assinatura.overdueSince || new Date(vencimento).toISOString();
      const cliente = getClienteSaasPorId(assinatura.clientId);
      if (cliente) {
        cliente.planoAtual = "free";
        cliente.statusAssinatura = "active";
        cliente.updatedAt = new Date().toISOString();
      }
      if (billingConfig.clientId === assinatura.clientId) {
        billingConfig.planSlug = "free";
        billingConfig.licenseStatus = "free";
        billingConfig.licenseBlockLevel = "none";
      }
      registrarAuditoria("alteração plano", { motivo: "vencimento", planoAnterior: plano.slug }, assinatura.clientId);
      alterou = true;
    } else if (diasAtraso >= 0) {
      assinatura.status = "past_due";
      assinatura.statusAssinatura = "past_due";
      assinatura.overdueSince = assinatura.overdueSince || new Date(vencimento).toISOString();
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
  if (isSuperAdmin() || isDono() || billingConfig.ownerMode) return true;
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
    status: trial ? "trialing" : "pending",
    promoUsed: false,
    billingVariant: "premium_first_month",
    currentPeriodStart: agora,
    currentPeriodEnd: expiresAt,
    startedAt: agora,
    expiresAt,
    nextBillingAt: expiresAt || agora
  });
  const usuario = normalizarUsuario({
    id: criarIdUsuario(),
    clientId,
    nome,
    email: emailNormalizado,
    phone: telefone,
    papel: "admin",
    ativo: true,
    planStatus: assinatura.status,
    trialStartedAt: trial ? agora : "",
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
  billingConfig.licenseStatus = assinatura.status;
  billingConfig.trialStartedAt = trial ? agora : "";
  billingConfig.paidUntil = expiresAt;
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
  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === SUPERADMIN_BOOTSTRAP_EMAIL);
  const agora = new Date().toISOString();
  if (!usuario) {
    usuario = normalizarUsuario({
      nome: "Everton PAESS",
      email: SUPERADMIN_BOOTSTRAP_EMAIL,
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
  if (!billingConfig.ownerMode && normalizarEmail(billingConfig.ownerEmail) === SUPERADMIN_BOOTSTRAP_EMAIL) {
    billingConfig.ownerEmail = "";
    if (String(billingConfig.ownerName || "").trim() === "Everton PAESS") {
      billingConfig.ownerName = "";
    }
  }
  if (normalizarEmail(billingConfig.licenseEmail) === SUPERADMIN_BOOTSTRAP_EMAIL) {
    billingConfig.licenseEmail = "";
  }
}

function garantirUsuarioDono(nome = billingConfig.ownerName, email = billingConfig.ownerEmail, senha = "") {
  const emailDono = normalizarEmail(email);
  if (!emailDono) return null;

  usuarios = normalizarUsuarios(usuarios);
  const existente = usuarios.find((usuario) => normalizarEmail(usuario.email) === emailDono);
  if (existente) {
    existente.nome = String(nome || existente.nome || "Dono").trim();
    if (senha) existente.senha = senha;
    if (existente.papel !== "superadmin") existente.papel = "dono";
    existente.ativo = true;
    return existente;
  }

  const novo = {
    id: criarIdUsuario(),
    nome: String(nome || "Dono").trim(),
    email: emailDono,
    senha,
    papel: "dono",
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
  const emailAtual = normalizarEmail(usuarioAtualEmail);
  const emailDono = normalizarEmail(billingConfig.ownerEmail);
  const usuario = getUsuarioAtual();
  return (emailDono && emailAtual === emailDono) || usuario?.papel === "dono" || usuario?.papel === "superadmin";
}

function isSuperAdmin(usuario = getUsuarioAtual()) {
  return usuario?.papel === "superadmin";
}

function getSuperAdminPrincipal() {
  usuarios = normalizarUsuarios(usuarios);
  const emailDono = normalizarEmail(billingConfig.ownerEmail);
  return usuarios.find((usuario) => usuario.papel === "superadmin" && emailDono && usuario.email === emailDono)
    || usuarios.find((usuario) => usuario.papel === "superadmin")
    || null;
}

function isSuperAdminPrincipal(usuario) {
  const principal = getSuperAdminPrincipal();
  return !!usuario && !!principal && String(usuario.id) === String(principal.id);
}

function isAdminCliente() {
  const usuario = getUsuarioAtual();
  return usuario?.papel === "admin" || usuario?.papel === "dono" || usuario?.papel === "superadmin";
}

function podeGerenciarUsuarios() {
  return adminLogado || isAdminCliente();
}

function obterWhatsapp2FA() {
  return String(appConfig.twoFactorWhatsapp || appConfig.whatsappNumber || "").replace(/\D/g, "");
}

function doisFatoresValido() {
  const validade = Number(sessionStorage.getItem("twoFactorValidUntil") || 0);
  return validade > Date.now();
}

function precisa2FA(usuario = null) {
  if (!appConfig.twoFactorEnabled || doisFatoresValido()) return false;
  if (!obterWhatsapp2FA()) return false;
  if (appConfig.twoFactorScope === "todos") return true;
  return !usuario || ["superadmin", "dono", "admin"].includes(usuario.papel);
}

function gerarCodigo2FA() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function abrirWhats2FA() {
  if (!twoFactorPending) return;

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
  twoFactorPending = {
    tipo,
    email: usuario?.email || "",
    nome: usuario?.nome || (tipo === "admin" ? "Admin local" : "Usuário"),
    codigo: gerarCodigo2FA(),
    expiraEm: Date.now() + 5 * 60 * 1000
  };
  abrirWhats2FA();
  renderApp();
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
  return normalizarEmail(usuario?.email || billingConfig.licenseEmail || billingConfig.ownerEmail || "");
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
  return ["superadmin", "dono"].includes(usuario?.papel) || (billingConfig.ownerEmail && alvo === normalizarEmail(billingConfig.ownerEmail));
}

function dispositivoDentroDoLimite(email = getEmailLicencaAtual()) {
  const emailLicenca = normalizarEmail(email);
  if (!emailLicenca || billingConfig.ownerMode || usuarioEhDonoDaLicenca(emailLicenca)) return true;

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

  if (billingConfig.ownerMode || usuarioEhDonoDaLicenca(emailLicenca)) return true;

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
  if (!usuario || ["superadmin", "dono"].includes(usuario.papel) || billingConfig.ownerMode) return true;
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
  if (!usuario || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl || ["superadmin", "dono"].includes(usuario.papel)) return;
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
  return isDono() || (adminLogado && !getUsuarioAtual());
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

function normalizarTelefoneWhatsapp(numero = "") {
  let limpo = String(numero || "").replace(/\D/g, "");
  if (!limpo) return "";
  if (limpo.startsWith("00")) limpo = limpo.slice(2);
  if ((limpo.length === 10 || limpo.length === 11) && !limpo.startsWith("55")) {
    limpo = "55" + limpo;
  }
  return limpo;
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

// Regra central de planos/permissões: trial ativo, plano pago, dono e superadmin liberam premium.
function getRemainingDays(expiresAt) {
  const fim = Date.parse(expiresAt || 0) || 0;
  if (!fim) return 0;
  return Math.max(0, Math.ceil((fim - Date.now()) / (24 * 60 * 60 * 1000)));
}

function calcularFimTrial(inicio, dias = billingConfig.trialDays) {
  const dataInicio = Date.parse(inicio || 0) || 0;
  if (!dataInicio) return "";
  return new Date(dataInicio + Math.max(1, Number(dias) || 7) * 24 * 60 * 60 * 1000).toISOString();
}

function usuarioEstaBloqueado(user = getUsuarioAtual()) {
  const status = String(user?.planStatus || "").toLowerCase();
  return !!user?.bloqueado || user?.ativo === false || status === "blocked" || status === "bloqueado";
}

function planoGlobalBloqueado() {
  return billingConfig.licenseStatus === "blocked" || billingConfig.licenseBlockLevel === "total" || billingConfig.blocked;
}

function isTrialActive(user = getUsuarioAtual()) {
  if (usuarioEstaBloqueado(user)) return false;
  const inicioUsuario = user?.trialStartedAt || "";
  if (inicioUsuario) {
    return getRemainingDays(calcularFimTrial(inicioUsuario, user.trialDays)) > 0;
  }
  if (planoGlobalBloqueado()) return false;
  if (!billingConfig.trialStartedAt) return false;
  return getRemainingDays(calcularFimTrial(billingConfig.trialStartedAt, billingConfig.trialDays)) > 0;
}

function hasPremiumAccess(subscription = getAssinaturaSaas()) {
  if (!subscription) return false;
  const assinatura = normalizarAssinaturaSaas(subscription);
  const planId = normalizarSlugPlano(assinatura.planId || assinatura.planSlug);
  const status = normalizarStatusPlano(assinatura.status);
  const fim = Date.parse(assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0) || 0;
  if (!fim || fim < Date.now()) return false;
  if (planId === "premium_trial") return status === "trialing";
  if (planId === "premium") return status === "active";
  return false;
}

function hasActivePlan(user = getUsuarioAtual()) {
  if (isSuperAdmin(user)) return true;
  if (usuarioEstaBloqueado(user) || planoGlobalBloqueado()) return false;
  if (billingConfig.ownerMode || isDono()) return true;

  const assinatura = getAssinaturaSaas(user?.clientId || billingConfig.clientId || "");
  if (assinatura) {
    return hasPremiumAccess(assinatura);
  }

  if (isTrialActive(user)) return true;

  if (user?.planStatus === "paid" || user?.planStatus === "active") {
    return !user.planExpiresAt || getRemainingDays(user.planExpiresAt) > 0;
  }

  if (billingConfig.licenseStatus === "active" || billingConfig.licenseStatus === "paid") {
    return !billingConfig.paidUntil || getRemainingDays(billingConfig.paidUntil) > 0;
  }

  return false;
}

function canUsePremiumFeatures(user = getUsuarioAtual()) {
  if (!hasActivePlan(user)) return false;
  if (isSuperAdmin(user) || isDono() || billingConfig.ownerMode) return true;
  return dispositivoDentroDoLimite(user?.email || getEmailLicencaAtual());
}

function getPlanoAtual(user = getUsuarioAtual()) {
  if (isSuperAdmin(user)) {
    return {
      nome: "Super Admin",
      status: "superadmin",
      completo: true,
      diasRestantes: 9999,
      descricao: "Acesso total de superadmin"
    };
  }

  if (usuarioEstaBloqueado(user) || planoGlobalBloqueado()) {
    return {
      nome: "Bloqueado",
      status: "bloqueado",
      completo: false,
      diasRestantes: 0,
      descricao: "Acesso bloqueado pelo administrador"
    };
  }

  if (billingConfig.ownerMode || isDono()) {
    return {
      nome: "Dono",
      status: "dono",
      completo: true,
      diasRestantes: 9999,
      descricao: "Acesso completo do proprietário"
    };
  }

  const assinaturaSaas = getAssinaturaSaas(user?.clientId || billingConfig.clientId || "");
  if (assinaturaSaas) {
    const planoSaas = getPlanoSaas(assinaturaSaas.planSlug);
    const licenca = calcularStatusAssinatura(assinaturaSaas);
    const diasPlano = getRemainingDays(assinaturaSaas.currentPeriodEnd || assinaturaSaas.expiresAt || assinaturaSaas.nextBillingAt);
    const completo = hasPremiumAccess(assinaturaSaas);
    const nomeStatus = licenca.status === "trialing" ? "Trial" : planoSaas.name;
    const mensagens = {
      trialing: `${diasPlano || DEFAULT_TRIAL_DAYS} dia(s) restantes no teste grátis`,
      active: "Plano ativo",
      pending: "Pagamento pendente",
      past_due: "Plano vencido",
      expired: "Plano vencido",
      cancelled: "Plano cancelado"
    };
    return {
      nome: nomeStatus,
      status: licenca.status === "active" && planoSaas.slug !== "free" ? "pago" : licenca.status === "trialing" ? "trial" : licenca.status === "past_due" ? "atrasado" : licenca.status === "pending" ? "pendente" : licenca.status === "active" ? "gratis" : "bloqueado",
      completo,
      blockLevel: licenca.blockLevel,
      diasRestantes: diasPlano,
      descricao: mensagens[licenca.status] || "Não foi possível confirmar o pagamento",
      plano: planoSaas
    };
  }

  const trialFim = user?.trialStartedAt
    ? calcularFimTrial(user.trialStartedAt, user.trialDays)
    : calcularFimTrial(billingConfig.trialStartedAt, billingConfig.trialDays);
  const diasTrial = getRemainingDays(trialFim);
  if (diasTrial > 0) {
    return {
      nome: "Trial",
      status: "trial",
      completo: true,
      diasRestantes: diasTrial,
      descricao: `${diasTrial} dia(s) grátis restantes com acesso completo`
    };
  }

  const vencimento = user?.planExpiresAt || billingConfig.paidUntil || "";
  const diasPlano = getRemainingDays(vencimento);
  if (hasActivePlan(user)) {
    return {
      nome: "Pago",
      status: "pago",
      completo: true,
      diasRestantes: diasPlano || 9999,
      descricao: diasPlano ? `${diasPlano} dia(s) restantes no plano pago` : "Assinatura paga ativa"
    };
  }

  if (billingConfig.trialStartedAt || user?.trialStartedAt || billingConfig.paidUntil || user?.planExpiresAt) {
    return {
      nome: "Expirado",
      status: "expirado",
      completo: false,
      diasRestantes: 0,
      descricao: "Plano vencido. Renove para liberar recursos premium."
    };
  }

  return {
    nome: "Grátis",
    status: "gratis",
    completo: false,
    diasRestantes: 0,
    descricao: "Calculadora liberada, sem recursos premium"
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
  const data = "30/04/2026";
  if (tipo === "privacidade") {
    return {
      titulo: "Política de Privacidade",
      subtitulo: `Como o ${nomeApp} trata dados da conta e da operação.`,
      secoes: [
        {
          titulo: "Dados usados",
          itens: [
            "Nome, e-mail, telefone opcional e nome do negócio.",
            "Dados operacionais cadastrados pelo usuário, como pedidos, produção, estoque, caixa, clientes e relatórios.",
            "Dados de assinatura, pagamentos, status de plano, logs de segurança e registros de auditoria."
          ]
        },
        {
          titulo: "Finalidade",
          itens: [
            "Criar e manter a conta, liberar recursos contratados e validar limites do plano.",
            "Sincronizar dados com Supabase quando configurado e manter o funcionamento do app.",
            "Gerar relatórios, backups, comprovantes, histórico de ações e suporte ao cliente."
          ]
        },
        {
          titulo: "Compartilhamento",
          itens: [
            "Dados podem ser processados por serviços necessários ao funcionamento, como Supabase Auth, banco Supabase e provedor de pagamento.",
            "O sistema não vende dados dos clientes.",
            "Chaves secretas e tokens privados de pagamento não ficam salvos no aplicativo."
          ]
        },
        {
          titulo: "Controle do cliente",
          itens: [
            "O cliente pode exportar seus dados pelo próprio sistema.",
            "Pedidos de correção, anonimização ou exclusão manual podem ser solicitados ao responsável pelo serviço.",
            "Clientes com pagamento recente ou conta ativa não são excluídos automaticamente."
          ]
        },
        {
          titulo: "Segurança",
          itens: [
            "Senhas são tratadas pelo Supabase Auth, pelo hash local do usuário ou pelo gerenciador de senhas do navegador quando o próprio usuário aceitar.",
            "Tokens de sessão podem ser mantidos em cache local para preservar o login entre aberturas do app, sem gravar a senha em texto puro.",
            "O usuário deve manter seu e-mail, senha e aparelho protegidos.",
            "Logs de acesso, login, pagamento, bloqueio e alterações importantes podem ser registrados para segurança."
          ]
        }
      ],
      rodape: `Última atualização: ${data}.`
    };
  }

  return {
    titulo: "Termos de Uso",
    subtitulo: `Regras básicas para uso do ${nomeApp}.`,
    secoes: [
      {
        titulo: "Uso do sistema",
        itens: [
          `${nomeApp} é um sistema SaaS para controle de pedidos, produção 3D, estoque, caixa e relatórios.`,
          "O usuário é responsável por conferir os dados lançados, preços, prazos, arquivos, materiais e informações comerciais.",
          "O sistema pode exibir limites conforme o plano contratado."
        ]
      },
      {
        titulo: "Conta e acesso",
        itens: [
          "O cadastro exige nome, e-mail, senha, nome do negócio e aceite destes termos.",
          "A conta criada para o negócio recebe perfil de administrador inicial.",
          "O acesso pode ser bloqueado em caso de inadimplência, cancelamento, uso indevido ou violação de segurança."
        ]
      },
      {
        titulo: "Planos e pagamentos",
        itens: [
          "O Plano Free permite 1 usuário, até 10 pedidos ativos, 30 usos da calculadora e backup online limitado.",
          "O Premium Trial libera recursos completos por 7 dias para novas contas.",
          "O Premium usa primeiro pagamento de R$ 19,90 quando a condição inicial ainda não foi usada e mensalidade de R$ 29,90 nos pagamentos seguintes.",
          "Pagamentos pendentes, vencidos ou não confirmados podem limitar criação de novos dados, mantendo acesso para visualização e regularização."
        ]
      },
      {
        titulo: "Responsabilidades",
        itens: [
          "O usuário deve manter backups quando necessário e revisar documentos antes de enviar a clientes.",
          "O sistema não substitui conferência técnica, contábil, fiscal ou jurídica do negócio.",
          "É proibido usar o serviço para fraude, acesso não autorizado ou violação de direitos de terceiros."
        ]
      },
      {
        titulo: "Dados e encerramento",
        itens: [
          "Clientes inativos podem ser marcados para revisão sem exclusão automática por padrão.",
          "Exportação, anonimização e exclusão manual podem ser feitas conforme as regras do sistema.",
          "Dados necessários para auditoria, segurança ou obrigações legais podem permanecer registrados pelo período necessário."
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

function verificarLimitePedidosAntesCriar() {
  if (getPlanoAtual().blockLevel === "partial") {
    mostrarModalLimitePlano("Seu pagamento está pendente. Regularize para evitar bloqueio.");
    return false;
  }
  if (!limitePedidosAtingido()) return true;
  mostrarModalLimitePlano("Limite atingido. Assine o Premium para continuar.");
  return false;
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

  aplicarPersonalizacao();
  const mobile = isMobile();
  document.body.classList.toggle("mobile-mode", mobile);
  app.innerHTML = (mobile ? renderMobile() : renderDesktop()) + renderAssistenteVirtual();
  atualizarMenu();
  ajustarJanelasDashboardAoWorkspace(false);
  renderCalculadoraFlutuante();
  preencherImpressoras();
  preencherMateriaisCalculadora();
}

function renderDesktop() {
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

  const configuracoes = ["config", "backup", "personalizacao", "empresa", "preferencias", "assinatura", "minhaAssinatura", "planos", "admin", "usuarios", "seguranca", "superadmin", "acessoNegado"];
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
  return ["calculadora", "admin", "assinatura", "minhaAssinatura", "planos", "sobre", "acessoNegado"].includes(tela);
}

function canAccessScreen(tela, usuario = getUsuarioAtual()) {
  if (isTelaPublica(tela)) return true;
  if (adminLogado && !usuario) return tela !== "superadmin";
  if (!usuario) return false;
  if (isSuperAdmin(usuario) || usuario.papel === "dono") return true;

  const permissoes = {
    admin: ["dashboard", "pedido", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "config", "empresa", "preferencias", "personalizacao", "usuarios", "seguranca", "feedback"],
    operador: ["dashboard", "pedido", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "seguranca", "feedback"],
    visualizador: ["dashboard", "pedidos", "producao", "estoque", "clientes", "caixa", "relatorios", "backup", "seguranca", "feedback"]
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

function obterRespostaAssistente(texto) {
  const pergunta = normalizarTextoAssistente(texto);
  const resposta = assistantResponses.find((item) => item.keywords.some((keyword) => pergunta.includes(normalizarTextoAssistente(keyword))));
  return resposta?.answer || "Ainda não sei responder isso. Procure o suporte ou tente usar palavras como pedido, estoque, backup, PDF ou plano.";
}

function enviarMensagemAssistente(event) {
  event?.preventDefault?.();
  const input = document.getElementById("assistantInput");
  const texto = (input?.value || "").trim();
  if (!texto) return;
  assistantMessages.push({ role: "user", text: texto });
  assistantMessages.push({ role: "assistant", text: obterRespostaAssistente(texto) });
  assistantMessages = assistantMessages.slice(-20);
  renderApp();
  setTimeout(() => document.getElementById("assistantInput")?.focus(), 0);
}

function renderAssistenteVirtual() {
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
        { tela: "minhaAssinatura", icone: "💳", texto: "Minha Assinatura" }
      ]
    },
    {
      titulo: "Configurações",
      itens: [
        { tela: "empresa", icone: "🏢", texto: "Empresa" },
        { tela: "backup", icone: "☁️", texto: "Backup" },
        { tela: "preferencias", icone: "⚙️", texto: "Preferências" },
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
    case "seguranca":
      return renderSeguranca();
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
    { tela: "minhaAssinatura", icone: "💳", texto: "Assinatura" }
  ];
  if (isAndroid()) acoes.unshift({ acao: "verificarAtualizacaoManual()", icone: "⬇️", texto: "Atualizar APK" });
  if (!getUsuarioAtual() || podeGerenciarUsuarios()) acoes.push({ tela: "usuarios", icone: "🔐", texto: "Admin" });
  if (getUsuarioAtual()) acoes.push({ tela: "seguranca", icone: "🔒", texto: "Segurança" });
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
    { icone: "💳", titulo: "Status do plano", valor: plano.nome, badge: plano.status, tela: "minhaAssinatura" },
    { icone: "⏳", titulo: "Dias restantes", valor: plano.diasRestantes >= 9999 ? "Livre" : plano.diasRestantes, badge: "Plano", tela: "minhaAssinatura" }
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
          <p class="muted">Backup JSON permanece disponível. Nuvem e Google Drive ficam claros no painel para não simular uma integração que ainda não foi configurada.</p>
          <div class="actions">
            <button class="btn secondary" onclick="exportarBackup()">Exportar backup</button>
            <button class="btn ghost" onclick="trocarTela('backup')">Configurar backup</button>
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
  const pedidoSelecionado = pedidos.find((pedido) => String(pedido.id) === String(pedidoVisualizandoId));
  const detalhe = pedidoSelecionado ? renderDetalhePedido(pedidoSelecionado) : "";
  const linhas = lista.length
    ? lista.map((pedido) => {
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
    cancelled: "cancelado"
  };
  return mapa[status] || status || "ativo";
}

function getClientesSaasFiltrados() {
  marcarClientesInativosLocal();
  const filtros = window.__clientesSaasFiltros || {};
  const termoNome = String(filtros.nome || "").toLowerCase();
  const termoEmail = String(filtros.email || "").toLowerCase();
  const plano = String(filtros.plano || "");
  const status = String(filtros.status || "");
  return saasClients.filter((cliente) => {
    if (normalizarEmail(cliente.email) === SUPERADMIN_BOOTSTRAP_EMAIL) return false;
    const assinatura = getAssinaturaSaas(cliente.id);
    const planoCliente = getPlanoSaas(assinatura?.planSlug || cliente.planoAtual || "free");
    if (termoNome && !cliente.name.toLowerCase().includes(termoNome)) return false;
    if (termoEmail && !cliente.email.toLowerCase().includes(termoEmail)) return false;
    if (plano && planoCliente.slug !== plano) return false;
    if (status && cliente.status !== status) return false;
    return true;
  });
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
  if (totalFiltrado === 0) {
    return `<p class="empty">Nenhum cliente corresponde aos filtros atuais.</p>`;
  }
  if (estado.status === "success" && estado.updatedAt) {
    return `<div class="saas-sync-state success">Clientes remotos atualizados.</div>`;
  }
  return "";
}

function renderClientesSaas() {
  garantirEstruturaSaasLocal();
  const lista = getClientesSaasFiltrados();
  const clientesVisiveis = saasClients.filter((cliente) => normalizarEmail(cliente.email) !== SUPERADMIN_BOOTSTRAP_EMAIL);
  const total = clientesVisiveis.length;
  const ativos = clientesVisiveis.filter((cliente) => cliente.status === "active").length;
  const atrasados = clientesVisiveis.filter((cliente) => cliente.status === "overdue").length;
  const inativos = clientesVisiveis.filter((cliente) => cliente.status === "inactive").length;
  const filtros = window.__clientesSaasFiltros || {};

  const linhasClientes = lista.map((cliente) => {
    const assinatura = getAssinaturaSaas(cliente.id);
    const plano = getPlanoSaas(assinatura?.planSlug || cliente.planoAtual || "free");
    const usuarioPrincipal = getUsuariosDoCliente(cliente.id)[0];
    return `
      <div class="client-admin-row">
        <div>
          <strong>${escaparHtml(cliente.name)}</strong>
          <span class="muted">ID: ${escaparHtml(cliente.clientCode || cliente.id)}</span>
          <span class="muted">${escaparHtml(cliente.email)}${cliente.phone ? " • " + escaparHtml(cliente.phone) : ""}</span>
          <span class="muted">user_id: ${escaparHtml(assinatura?.userId || usuarioPrincipal?.id || "-")}</span>
          <span class="muted">plan_id: ${escaparHtml(assinatura?.planSlug || cliente.planoAtual || "free")} • status: ${escaparHtml(normalizarStatusPlano(assinatura?.status || cliente.statusAssinatura || "active"))}</span>
          <span class="muted">promo_used: ${assinatura?.promoUsed ? "true" : "false"} • expira: ${assinatura?.currentPeriodEnd ? new Date(assinatura.currentPeriodEnd).toLocaleDateString("pt-BR") : "-"}</span>
        </div>
        <span class="status-badge">${escaparHtml(plano.name)}</span>
        <span class="status-badge ${classeStatusPlano(cliente.status)}">${escaparHtml(rotuloStatusCliente(cliente.status))}</span>
        <div class="client-meta">
          <span>${cliente.lastAccessAt ? new Date(cliente.lastAccessAt).toLocaleDateString("pt-BR") : "sem acesso"}</span>
          <span>${new Date(cliente.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
        <div class="row-actions">
          <button class="btn ghost" onclick="editarClienteSaas('${escaparAttr(cliente.id)}')">Editar</button>
          <button class="btn warning" onclick="alterarStatusClienteSaas('${escaparAttr(cliente.id)}', '${cliente.status === "blocked" ? "active" : "blocked"}')">${cliente.status === "blocked" ? "Reativar" : "Bloquear"}</button>
          <button class="btn ghost" onclick="alterarPlanoClienteSaas('${escaparAttr(cliente.id)}')">Alterar plano</button>
          <button class="btn ghost" onclick="exportarClienteSaas('${escaparAttr(cliente.id)}')">Exportar</button>
          <button class="btn danger" onclick="anonimizarClienteSaas('${escaparAttr(cliente.id)}')">Anonimizar</button>
          <button class="btn danger" onclick="excluirClienteSaasManual('${escaparAttr(cliente.id)}')">Excluir</button>
        </div>
      </div>
    `;
  }).join("");
  const estadoRemoto = renderEstadoClientesSaasRemoto(total, lista.length);
  const linhas = `${estadoRemoto}${linhasClientes}`;

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
          <input value="${escaparAttr(filtros.nome || "")}" oninput="filtrarClientesSaas('nome', this.value)" placeholder="empresa">
        </label>
        <label class="field">
          <span>E-mail</span>
          <input value="${escaparAttr(filtros.email || "")}" oninput="filtrarClientesSaas('email', this.value)" placeholder="cliente@email.com">
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
            ${["active", "overdue", "blocked", "inactive", "cancelled"].map((status) => `<option value="${status}" ${filtros.status === status ? "selected" : ""}>${rotuloStatusCliente(status)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="btn secondary" onclick="atualizarClientesSaasRemoto()">Atualizar Supabase</button>
        <button class="btn secondary" onclick="marcarClientesInativosAcao()">Marcar inativos &gt;90 dias</button>
        <button class="btn ghost" onclick="exportarClientesSaas()">Exportar dados</button>
      </div>
      <div class="history-list users-list">${linhas}</div>
    </section>
  `;
}

function filtrarClientesSaas(campo, valor) {
  window.__clientesSaasFiltros = {
    ...(window.__clientesSaasFiltros || {}),
    [campo]: valor
  };
  renderApp();
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
  cliente.phone = telefone === null ? cliente.phone : telefone.trim();
  cliente.updatedAt = new Date().toISOString();
  salvarDados();
  registrarAuditoria("cliente editado", { email: cliente.email }, cliente.id);
  renderApp();
}

function alterarStatusClienteSaas(id, status) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  cliente.status = status;
  cliente.updatedAt = new Date().toISOString();
  if (status === "active") cliente.lastAccessAt = cliente.lastAccessAt || new Date().toISOString();
  salvarDados();
  registrarAuditoria(status === "active" ? "reativado" : "bloqueio", { email: cliente.email, status }, cliente.id);
  renderApp();
}

async function alterarPlanoClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const planoAtual = getPlanoSaas(getAssinaturaSaas(id)?.planSlug || cliente.planoAtual || "free");
  const respostaPlano = await solicitarEntradaTexto({
    titulo: "Alterar plano",
    mensagem: "Use: free, premium_trial ou premium.",
    valor: planoAtual.slug,
    obrigatorio: true
  });
  if (respostaPlano === null) return;
  const novoPlano = normalizarSlugPlano(respostaPlano || "");
  const plano = getPlanoSaas(novoPlano);
  if (!["free", "premium_trial", "premium"].includes(novoPlano)) {
    alert("Plano inválido.");
    return;
  }
  let assinatura = getAssinaturaSaas(id);
  if (!assinatura) {
    assinatura = normalizarAssinaturaSaas({ clientId: id, planSlug: plano.slug, status: "pending" });
    saasSubscriptions.push(assinatura);
  }
  const agora = new Date();
  const fim = new Date(agora);
  if (plano.slug === "premium_trial") fim.setDate(fim.getDate() + DEFAULT_TRIAL_DAYS);
  if (plano.slug === "premium") fim.setDate(fim.getDate() + 30);
  const statusPlano = plano.slug === "premium_trial" ? "trialing" : "active";
  assinatura.planSlug = plano.slug;
  assinatura.planId = plano.slug;
  assinatura.status = statusPlano;
  assinatura.statusAssinatura = statusPlano;
  assinatura.promoUsed = plano.slug === "premium";
  assinatura.billingVariant = assinatura.promoUsed ? "premium_monthly" : "premium_first_month";
  assinatura.currentPeriodStart = plano.slug === "free" ? "" : agora.toISOString();
  assinatura.currentPeriodEnd = plano.slug === "free" ? "" : fim.toISOString();
  assinatura.expiresAt = assinatura.currentPeriodEnd;
  assinatura.nextBillingAt = assinatura.currentPeriodEnd;
  cliente.planoAtual = plano.slug;
  cliente.statusAssinatura = statusPlano;
  cliente.updatedAt = new Date().toISOString();
  salvarDados();
  registrarAuditoria("alteração plano", { email: cliente.email, plano: plano.slug }, cliente.id);
  renderApp();
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

function anonimizarClienteSaas(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  if (!confirm("Anonimizar dados pessoais deste cliente?")) return;
  cliente.name = "Cliente anonimizado";
  cliente.responsibleName = "";
  cliente.email = `anon-${Date.now()}@anon.local`;
  cliente.phone = "";
  cliente.status = "inactive";
  cliente.updatedAt = new Date().toISOString();
  usuarios.filter((usuario) => usuario.clientId === id).forEach((usuario) => {
    usuario.nome = "Usuário anonimizado";
    usuario.email = `anon-${usuario.id}@anon.local`;
    usuario.phone = "";
    usuario.ativo = false;
    usuario.bloqueado = true;
  });
  salvarDados();
  registrarAuditoria("anonimizado", {}, id);
  renderApp();
}

function excluirClienteSaasManual(id) {
  if (!isSuperAdmin()) return;
  const cliente = getClienteSaasPorId(id);
  if (!cliente) return;
  const ultimoAcesso = Date.parse(cliente.lastAccessAt || 0) || 0;
  const recente = ultimoAcesso && Date.now() - ultimoAcesso < INACTIVE_CLIENT_DAYS * 24 * 60 * 60 * 1000;
  if (recente || clienteTemPagamentoRecente(id)) {
    alert("Este cliente tem acesso ou pagamento recente. Exporte os dados e bloqueie antes de excluir.");
    return;
  }
  if (!confirm("Excluir manualmente este cliente?")) return;
  exportarClienteSaas(id);
  saasClients = saasClients.filter((clienteItem) => clienteItem.id !== id);
  saasSubscriptions = saasSubscriptions.filter((assinatura) => assinatura.clientId !== id);
  saasPayments = saasPayments.filter((pagamento) => pagamento.clientId !== id);
  usuarios = usuarios.filter((usuario) => usuario.clientId !== id);
  salvarDados();
  registrarAuditoria("excluído", { email: cliente.email }, id);
  renderApp();
}

function marcarClientesInativosAcao() {
  if (!isSuperAdmin()) return;
  const antes = saasClients.filter((cliente) => cliente.status === "inactive").length;
  marcarClientesInativosLocal();
  salvarDados();
  const depois = saasClients.filter((cliente) => cliente.status === "inactive").length;
  alert(`${Math.max(0, depois - antes)} cliente(s) marcado(s) como inativo >90 dias.`);
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
          <button class="btn secondary" onclick="exportarBackup()">Exportar backup local</button>
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
        <h2>☁️ Backup e sincronização</h2>
        <span class="status-badge">${syncConfig.ultimaSync ? "Sincronizado" : "Local"}</span>
      </div>
      <p class="muted">Para Android e Windows sincronizarem, configure aqui uma URL de nuvem que aceite GET e PUT com JSON. O app envia pedidos, estoque, caixa, histórico e configurações sem salvar o token dentro do backup.</p>

      <label class="field">
        <span>Nome deste aparelho</span>
        <input id="syncDeviceName" value="${escaparAttr(syncConfig.deviceName)}" placeholder="Ex.: celular oficina">
      </label>
      <label class="field">
        <span>URL da nuvem</span>
        <input id="syncCloudUrl" value="${escaparAttr(syncConfig.cloudUrl)}" placeholder="https://seu-servidor.com/erp3d.json">
      </label>
      <label class="field">
        <span>Token da nuvem</span>
        <input id="syncToken" type="password" value="${escaparAttr(syncConfig.token)}" placeholder="Opcional">
      </label>

      <div class="danger-zone">
        <h2 class="section-title">Supabase online</h2>
        <p class="muted">Sincronização real usando Supabase Auth e RLS. O localStorage continua funcionando; o Supabase entra como backup online por usuário.</p>
        <label class="checkbox-row">
          <input id="supabaseEnabled" type="checkbox" ${syncConfig.supabaseEnabled ? "checked" : ""}>
          <span>Ativar Supabase neste aparelho</span>
        </label>
        <label class="checkbox-row">
          <input id="supabaseGoogleOAuthEnabled" type="checkbox" ${syncConfig.supabaseGoogleOAuthEnabled ? "checked" : ""}>
          <span>Login Google habilitado no projeto Supabase</span>
        </label>
        <div class="sync-grid">
          <label class="field">
            <span>URL do Supabase</span>
            <input id="supabaseUrl" value="${escaparAttr(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL)}" placeholder="https://projeto.supabase.co">
          </label>
          <label class="field">
            <span>Chave pública</span>
            <input id="supabaseAnonKey" value="${escaparAttr(syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY)}" placeholder="sb_publishable_...">
          </label>
          <label class="field">
            <span>E-mail Supabase</span>
            <input id="supabaseEmail" type="email" value="${escaparAttr(syncConfig.supabaseEmail || getEmailLicencaAtual())}" placeholder="cliente@email.com">
          </label>
          <label class="field">
            <span>Senha Supabase</span>
            <input id="supabasePassword" type="password" placeholder="Não fica salva no backup">
          </label>
        </div>
        <div class="sync-grid">
          <div class="metric">
            <span>Status Supabase</span>
            <strong>${syncConfig.supabaseAccessToken ? "Conectado" : "Desconectado"}</strong>
          </div>
          <div class="metric">
            <span>Usuário online</span>
            <strong>${escaparHtml(syncConfig.supabaseEmail || "Nenhum")}</strong>
          </div>
          <div class="metric">
            <span>Último Supabase</span>
            <strong>${syncConfig.supabaseLastSync ? new Date(syncConfig.supabaseLastSync).toLocaleString("pt-BR") : "Nunca"}</strong>
          </div>
        </div>
        <div class="actions">
          <button class="btn" onclick="entrarSupabase()">Entrar</button>
          <button class="btn secondary" onclick="criarContaSupabase()">Criar conta</button>
          <button class="btn secondary" onclick="sincronizarSupabase()">Sincronizar Supabase</button>
          <button class="btn ghost" onclick="enviarBackupSupabase()">Enviar Supabase</button>
          <button class="btn ghost" onclick="restaurarBackupSupabase()">Restaurar Supabase</button>
          <button class="btn ghost" onclick="sairSupabase()">Sair</button>
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Segurança</h2>
        <label class="checkbox-row">
          <input id="twoFactorEnabled" type="checkbox" ${appConfig.twoFactorEnabled ? "checked" : ""}>
          <span>Ativar verificação em duas etapas pelo WhatsApp</span>
        </label>
        <div class="sync-grid">
          <label class="field">
            <span>WhatsApp da verificação</span>
            <input id="twoFactorWhatsapp" value="${escaparAttr(appConfig.twoFactorWhatsapp || appConfig.whatsappNumber || "")}" placeholder="Ex.: 5585999999999">
          </label>
          <label class="field">
            <span>Proteger</span>
            <select id="twoFactorScope">
              <option value="admin" ${appConfig.twoFactorScope !== "todos" ? "selected" : ""}>Dono e admins</option>
              <option value="todos" ${appConfig.twoFactorScope === "todos" ? "selected" : ""}>Todos os usuários</option>
            </select>
          </label>
          <label class="field">
            <span>Lembrar neste aparelho por minutos</span>
            <input id="twoFactorRememberMinutes" type="number" min="1" step="1" value="${Number(appConfig.twoFactorRememberMinutes) || 60}">
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
          <button class="btn secondary" onclick="verificarAtualizacaoManual()">Checar atualização</button>
          <button class="btn ghost" onclick="aplicarAtualizacaoAgora()">Aplicar agora</button>
          <button class="btn ghost" onclick="baixarAtualizacaoAndroid(true)">Baixar APK</button>
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Google Drive Desktop</h2>
        <p class="muted">Backup no Google Drive ainda não está configurado como integração online oficial. Por enquanto, use uma pasta do Google Drive Desktop; o backup JSON manual continua sendo o caminho garantido.</p>
        <label class="field">
          <span>Arquivo do backup</span>
          <input id="driveFileName" value="${escaparAttr(syncConfig.driveFileName || "erp3d-backup.json")}" placeholder="erp3d-backup.json">
        </label>
        <div class="sync-grid">
          <div class="metric">
            <span>Pasta selecionada</span>
            <strong>${syncConfig.driveFolderName ? escaparHtml(syncConfig.driveFolderName) : "Nenhuma"}</strong>
          </div>
          <div class="metric">
            <span>Último Drive</span>
            <strong>${syncConfig.driveLastSync ? new Date(syncConfig.driveLastSync).toLocaleString("pt-BR") : "Nunca"}</strong>
          </div>
        </div>
        <div class="actions">
          <button class="btn" onclick="escolherPastaDrive()">Escolher pasta Drive</button>
          <button class="btn secondary" onclick="sincronizarGoogleDrive()">Sync Drive</button>
          <button class="btn ghost" onclick="enviarBackupGoogleDrive()">Backup no Drive</button>
          <button class="btn ghost" onclick="restaurarBackupGoogleDrive()">Restaurar Drive</button>
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Backup automático</h2>
        <label class="checkbox-row">
          <input id="autoBackupEnabled" type="checkbox" ${syncConfig.autoBackupEnabled ? "checked" : ""}>
          <span>Ativar backup automático</span>
        </label>
        <div class="sync-grid">
          <label class="field">
            <span>Intervalo em minutos</span>
            <input id="autoBackupInterval" type="number" min="30" step="30" value="${Number(syncConfig.autoBackupInterval) || 30}">
          </label>
          <label class="field">
            <span>Destino automático</span>
            <select id="autoBackupTarget">
              <option value="drive" ${syncConfig.autoBackupTarget === "drive" ? "selected" : ""}>Google Drive</option>
              <option value="url" ${syncConfig.autoBackupTarget === "url" ? "selected" : ""}>URL da nuvem</option>
              <option value="supabase" ${syncConfig.autoBackupTarget === "supabase" ? "selected" : ""}>Supabase</option>
            </select>
          </label>
        </div>
        <div class="sync-grid">
          <div class="metric">
            <span>Último automático</span>
            <strong>${syncConfig.autoBackupLastRun ? new Date(syncConfig.autoBackupLastRun).toLocaleString("pt-BR") : "Nunca"}</strong>
          </div>
          <div class="metric">
            <span>Status automático</span>
            <strong>${escaparHtml(syncConfig.autoBackupStatus || "Aguardando")}</strong>
          </div>
        </div>
        <div class="actions">
          <button class="btn" onclick="salvarConfigSync()">Salvar auto-backup</button>
          <button class="btn secondary" onclick="executarAutoBackupManual()">Executar agora</button>
        </div>
      </div>

      <div class="actions">
        <button class="btn" onclick="salvarConfigSync()">Salvar config</button>
        <button class="btn secondary" onclick="sincronizarNuvem()">Sincronizar agora</button>
        <button class="btn ghost" onclick="enviarBackupNuvem()">Enviar backup</button>
        <button class="btn ghost" onclick="restaurarBackupNuvem()">Restaurar nuvem</button>
      </div>

      <div class="sync-grid">
        <div class="metric">
          <span>Último backup</span>
          <strong>${syncConfig.ultimoBackup ? new Date(syncConfig.ultimoBackup).toLocaleString("pt-BR") : "Nunca"}</strong>
        </div>
        <div class="metric">
          <span>Última sync</span>
          <strong>${syncConfig.ultimaSync ? new Date(syncConfig.ultimaSync).toLocaleString("pt-BR") : "Nunca"}</strong>
        </div>
      </div>

      <div class="danger-zone">
        <label class="field">
          <span>Importar backup local</span>
          <input class="file-input" type="file" accept="application/json" onchange="importarBackup(this.files[0])">
        </label>
      </div>

      <div class="actions single">
        <button class="btn ghost" onclick="voltarTela()">← Voltar para a tela anterior</button>
        <button class="btn ghost" onclick="voltarInicio()">Ir para o início</button>
        <button class="btn warning" onclick="limparPedidoAtual()">Limpar pedido atual</button>
        <button class="btn secondary" onclick="exportarBackup()">Exportar backup</button>
        <button class="btn ghost" onclick="trocarTela('admin')">Área admin</button>
      </div>
    </section>
  `;
}

function renderAdmin() {
  const usuarioAtual = getUsuarioAtual();
  const podeAdmin = podeGerenciarUsuarios();

  if (!podeAdmin) {
    return `
      <section class="card">
        <div class="card-header">
          <h2>🔐 Admin</h2>
          ${usuarioAtual ? `<button class="icon-button" onclick="logoutUsuario()" title="Sair">↩</button>` : ""}
        </div>
        <div class="login-brand-panel">
          ${renderMarcaProjeto("login-brand-logo", "Logo Simplifica 3D")}
          <div>
            <strong>Simplifica 3D</strong>
            <span class="muted">Acesso seguro ao sistema</span>
          </div>
        </div>
        ${usuarioAtual ? `
          <p class="muted">Você está logado como ${escaparHtml(usuarioAtual.nome)} (${escaparHtml(usuarioAtual.papel)}), mas este usuário não gerencia o sistema.</p>
        ` : `
          <p class="muted">Entre com o e-mail do dono ou de um admin cadastrado. O acesso local por senha continua disponível para manutenção.</p>
        `}
        ${renderVerificacao2FA()}
        <div class="sync-grid">
          <label class="field">
            <span>E-mail do usuário</span>
            <input id="usuarioLoginEmail" type="email" value="${escaparAttr(usuarioAtualEmail || syncConfig.supabaseEmail || "")}" placeholder="seu@email.com" autocomplete="username">
          </label>
          <label class="field">
            <span>Senha do usuário</span>
            <div class="password-row">
              <input id="usuarioLoginSenha" type="password" placeholder="Senha cadastrada" autocomplete="current-password" onkeydown="if(event.key==='Enter') loginUsuario()">
              <button class="icon-button" type="button" onclick="alternarSenhaVisivel('usuarioLoginSenha')" title="Mostrar/ocultar senha">👁</button>
            </div>
          </label>
        </div>
        <div class="actions">
          <button id="loginUsuarioBtn" class="btn" onclick="loginUsuario()">Entrar por e-mail</button>
          ${renderGoogleAuthButton("Login com Google")}
          <button class="btn ghost" onclick="entrarComCredencialSalva()">Senha salva/digital</button>
          <button class="btn ghost" onclick="solicitarRecuperacaoSenha()">Esqueci minha senha</button>
          ${usuarioAtual ? `<button class="btn ghost" onclick="logoutUsuario()">Sair do usuário</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Ver plano</button>`}
        </div>
        <label class="checkbox-row">
          <input id="lembrarSenhaNavegador" type="checkbox" ${appConfig.browserPasswordSaveOffer !== false ? "checked" : ""}>
          <span>Oferecer salvar login neste navegador</span>
        </label>

        <div class="danger-zone">
          <h2 class="section-title">Criar conta</h2>
          <div class="sync-grid">
            <label class="field">
              <span>Nome</span>
              <input id="signupNome" placeholder="Seu nome">
            </label>
            <label class="field">
              <span>E-mail</span>
              <input id="signupEmail" type="email" placeholder="seu@email.com" autocomplete="email">
            </label>
            <label class="field">
              <span>Senha</span>
              <div class="password-row">
                <input id="signupSenha" type="password" autocomplete="new-password" oninput="renderIndicadorForcaSenha('signupSenha', this)">
                <button class="icon-button" type="button" onclick="alternarSenhaVisivel('signupSenha')" title="Mostrar/ocultar senha">👁</button>
              </div>
              <small class="password-strength" data-strength-for="signupSenha">Digite uma senha forte</small>
            </label>
            <label class="field">
              <span>Confirmar senha</span>
              <input id="signupConfirmarSenha" type="password" autocomplete="new-password">
            </label>
            <label class="field">
              <span>Nome do negócio</span>
              <input id="signupNegocio" placeholder="Ex.: Minha Impressão 3D">
            </label>
            <label class="field">
              <span>Telefone opcional</span>
              <input id="signupTelefone" inputmode="tel" placeholder="5585999999999">
            </label>
          </div>
          <div class="checkbox-row terms-consent-row">
            <input id="signupAceite" type="checkbox" aria-label="Aceitar Termos de Uso e Política de Privacidade">
            <span>
              Li e aceito os
              <button class="inline-link" type="button" onclick="abrirDocumentoLegal('termos', event)">Termos de Uso</button>
              e
              <button class="inline-link" type="button" onclick="abrirDocumentoLegal('privacidade', event)">Política de Privacidade</button>
            </span>
          </div>
          <div class="actions">
            <button id="signupBtn" class="btn" onclick="cadastrarClienteSaas()">Criar conta</button>
            ${renderGoogleAuthButton("Criar/entrar com Google")}
            <button class="btn ghost" onclick="trocarTela('assinatura')">Ver planos</button>
          </div>
        </div>

        <div class="danger-zone">
          <h2 class="section-title">Acesso local</h2>
          <p class="muted">Disponível apenas em ambiente local para manutenção. Em produção, use usuário/senha ou Supabase.</p>
          <label class="field">
            <span>Senha do admin local</span>
            <div class="password-row">
              <input id="adminSenha" type="password" placeholder="Digite a senha">
              <button class="icon-button" type="button" onclick="alternarSenhaVisivel('adminSenha')" title="Mostrar/ocultar senha">👁</button>
            </div>
          </label>
          <button id="loginAdminBtn" class="btn secondary" onclick="loginAdmin()">Entrar manutenção local</button>
        </div>
      </section>
    `;
  }

  const totais = calcularTotaisCaixa();
  const ultimosEventos = historico.slice(0, 12).map((item) => `
    <div class="history-item">
      <strong>${escaparHtml(item.acao)}</strong>
      <span class="muted">${new Date(item.data).toLocaleString("pt-BR")} • ${escaparHtml(item.detalhes || "")}</span>
    </div>
  `).join("") || `<p class="empty">Nenhum histórico registrado ainda.</p>`;
  const perfilAtual = usuarioAtual ? `${usuarioAtual.nome} (${usuarioAtual.papel})` : "Admin local";
  const podeCriarDono = isDono() || isSuperAdmin(usuarioAtual) || (adminLogado && !usuarioAtual);
  const podeComercial = podeGerenciarComercial();

  return `
    <section class="card">
      <div class="card-header">
        <h2>🔐 Admin</h2>
        <button class="icon-button" onclick="logoutAdmin()" title="Sair">↩</button>
      </div>
      <p class="muted">Logado como ${escaparHtml(perfilAtual)}. Dono gerencia comercial e licença; admin do cliente gerencia usuários e operação sem alterar preço ou modo dono.</p>

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
        ${podeComercial ? `
          <p class="muted">Salve seu e-mail como dono para liberar todas as funções para você. Para cliente, deixe o modo dono desligado e crie um admin com o e-mail dele.</p>
          <div class="sync-grid">
            <label class="field">
              <span>Nome do dono</span>
              <input id="ownerNameAdmin" value="${escaparAttr(billingConfig.ownerName || "")}" placeholder="Seu nome ou empresa">
            </label>
            <label class="field">
              <span>E-mail do dono</span>
              <input id="ownerEmailAdmin" type="email" value="${escaparAttr(billingConfig.ownerEmail || "")}" placeholder="seu@email.com">
            </label>
          </div>
          <label class="field">
            <span>Senha do dono</span>
            <input id="ownerPasswordAdmin" type="password" placeholder="Deixe vazio para manter a senha atual">
          </label>
          <div class="actions">
            <button class="btn" onclick="salvarDonoSistema()">Salvar dono</button>
            <button class="btn ghost" onclick="loginComoDono()">Entrar como dono</button>
          </div>
        ` : `
          <p class="muted">Você está como admin do cliente. Pode adicionar operadores e organizar o uso do app sem alterar configurações comerciais.</p>
        `}

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
              ${podeCriarDono ? `<option value="dono">Dono</option>` : ""}
              <option value="admin">Admin</option>
              <option value="operador" selected>Operador</option>
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
        <label class="checkbox-row">
          <input id="ownerModeAdmin" type="checkbox" ${billingConfig.ownerMode ? "checked" : ""}>
          <span>Modo dono neste aparelho</span>
        </label>
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
  const plano = getPlanoAtual();
  const diasTeste = Number(billingConfig.trialDays) || 7;
  const downloadAndroid = billingConfig.androidDownloadUrl || ANDROID_RELEASES_URL;
  const downloadWindows = billingConfig.windowsWebUrl || billingConfig.windowsDownloadUrl || location.origin;
  const planoSaas = getPlanoSaasAtual();
  const planos = garantirPlanosSaas().filter((item) => ["free", "premium"].includes(item.slug));

  return `
    <section class="card">
      <div class="card-header">
        <h2>💳 Planos</h2>
        <span class="status-badge ${classeStatusPlano(plano.status)}">${escaparHtml(plano.nome)}</span>
      </div>
      <p class="muted">${escaparHtml(plano.descricao)}.</p>

      <div class="admin-grid">
        ${planos.map((item) => renderPlanoSaasCard(item, planoSaas.slug, diasTeste)).join("")}
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Upgrade</h2>
        <div class="comparison-grid">
          <div class="metric"><span>Plano atual</span><strong>${escaparHtml(planoSaas.name)}</strong></div>
          <div class="metric"><span>Usuários</span><strong>${planoSaas.maxUsers}</strong></div>
          <div class="metric"><span>Pedidos</span><strong>${planoSaas.maxOrders ? planoSaas.maxOrders + "/mês" : "Ilimitados"}</strong></div>
          <div class="metric"><span>Recomendado</span><strong>Premium R$ 29,90</strong></div>
        </div>
      </div>

      <div class="sync-grid">
        <div class="metric">
          <span>Status</span>
          <strong>${escaparHtml(plano.nome)}</strong>
        </div>
        <div class="metric">
          <span>Dias restantes</span>
          <strong>${plano.diasRestantes >= 9999 ? "Livre" : plano.diasRestantes}</strong>
        </div>
        <div class="metric">
          <span>E-mail</span>
          <strong>${billingConfig.licenseEmail ? escaparHtml(billingConfig.licenseEmail) : "Não informado"}</strong>
        </div>
      </div>

      <label class="field">
        <span>E-mail da conta/licença</span>
        <input id="licenseEmailInput" value="${escaparAttr(billingConfig.licenseEmail)}" placeholder="cliente@email.com">
      </label>
      <label class="field">
        <span>Senha da conta</span>
        <input id="licensePasswordInput" type="password" placeholder="Opcional para criar/atualizar conta">
      </label>
      <div class="actions">
        <button class="btn ghost" onclick="salvarEmailLicenca()">Salvar e vincular este aparelho</button>
        <button class="btn secondary" onclick="criarContaLicenca()">Criar/entrar conta</button>
        <button class="btn" onclick="trocarTela('minhaAssinatura')">Minha assinatura</button>
      </div>

      ${renderDispositivosLicenca()}

      <div class="danger-zone">
        <h2 class="section-title">Baixar aplicativo</h2>
        <div class="actions">
          <button class="btn ghost" onclick="abrirDownload('android')" ${downloadAndroid ? "" : "disabled"}>Android APK</button>
          <button class="btn ghost" onclick="abrirDownload('windows')" ${downloadWindows ? "" : "disabled"}>Abrir no Windows/navegador</button>
        </div>
      </div>
    </section>
  `;
}

function renderPlanoSaasCard(plano, planoAtualSlug, diasTeste) {
  const selecionado = plano.slug === planoAtualSlug;
  const linhas = [
    `${plano.maxUsers} usuário(s)`,
    plano.maxOrders ? `${plano.maxOrders} pedidos/mês` : "pedidos ilimitados",
    plano.maxClients ? `${plano.maxClients} clientes` : "clientes ilimitados",
    plano.maxCalculatorUses ? `${plano.maxCalculatorUses} usos da calculadora` : "calculadora ilimitada",
    plano.maxStorageMb ? `${plano.maxStorageMb} MB de backup` : "backup ampliado",
    plano.allowPdf ? "PDF liberado" : "sem PDF",
    plano.allowReports ? "relatórios" : "",
    plano.allowPermissions ? "permissões" : ""
  ].filter(Boolean);
  return `
    <div class="plan-card ${plano.recommended ? "featured" : ""}">
      <div class="row-title">
        <strong>${escaparHtml(plano.name)}${plano.recommended ? " • recomendado" : ""}</strong>
        <span class="muted">${formatarMoeda(plano.price)}/mês</span>
      </div>
      <p class="muted">${linhas.join(" • ")}</p>
      <div class="actions single">
        <button class="btn ${selecionado ? "secondary" : ""}" type="button" data-action="plan-select" data-slug="${escaparAttr(plano.slug)}">${selecionado ? "Plano atual" : plano.price > 0 ? "Assinar" : "Usar Free"}</button>
        ${plano.slug === "free" ? `<button class="btn ghost" type="button" data-action="plan-trial" data-slug="premium_trial">Trial ${diasTeste} dias</button>` : `<button class="btn ghost" type="button" data-action="plan-payment" data-slug="${escaparAttr(plano.slug)}">Pagamento avulso</button>`}
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

function renderFeedback() {
  const podeVerDiagnosticos = isSuperAdmin() || (adminLogado && !getUsuarioAtual());
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
        <span class="muted">${Number(item.votos) || 1} ocorrência(s) • ${new Date(item.atualizadoEm || item.criadoEm).toLocaleString("pt-BR")}</span>
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
      <p class="muted">Sugestões ficam salvas neste aparelho. Registros técnicos são reservados para suporte.</p>

      ${podeVerDiagnosticos ? `<label class="checkbox-row">
        <input id="telemetryEnabledConfig" type="checkbox" ${appConfig.telemetryEnabled !== false ? "checked" : ""}>
        <span>Registrar erros locais do funcionamento</span>
      </label>
      <button class="btn ghost" onclick="salvarFeedbackConfig()">Salvar configuração</button>` : ""}

      <div class="danger-zone">
        <h2 class="section-title">Nova sugestão</h2>
        <label class="field">
          <span>Descreva a melhoria</span>
          <input id="novaSugestaoTexto" placeholder="Ex.: adicionar relatório mensal de vendas">
        </label>
        <button class="btn secondary" onclick="adicionarSugestao()">Adicionar sugestão</button>
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

function votarSugestao(id) {
  const item = sugestoes.find((sugestao) => String(sugestao.id) === String(id));
  if (!item) return;
  registrarSugestaoLocal(item.titulo, "repetida");
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
  const clientId = getClientIdAtual() || billingConfig.clientId || criarIdLocal("client");
  if (!billingConfig.clientId) billingConfig.clientId = clientId;
  let assinatura = getAssinaturaSaas(clientId);
  if (!assinatura) {
    assinatura = normalizarAssinaturaSaas({ clientId, planSlug: plano.slug, status: "pending" });
    saasSubscriptions.push(assinatura);
  }
  assinatura.planSlug = plano.slug;
  assinatura.planId = plano.slug;
  if (assinatura.status === "cancelled") assinatura.status = "pending";
  billingConfig.planSlug = plano.slug;
  billingConfig.monthlyPrice = plano.price;
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
  if (billingConfig.ownerMode) {
    alert("Modo dono já tem acesso completo.");
    return;
  }

  const plano = getPlanoSaas(slug);
  const email = normalizarEmail(document.getElementById("licenseEmailInput")?.value || billingConfig.licenseEmail || usuarioAtualEmail || "");
  if (!email) {
    alert("Informe o e-mail da conta antes de iniciar o teste grátis.");
    return;
  }

  if (!billingConfig.trialStartedAt) {
    billingConfig.licenseEmail = email;
    billingConfig.planSlug = plano.slug;
    billingConfig.monthlyPrice = plano.price;
    billingConfig.trialStartedAt = new Date().toISOString();
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
    assinatura.status = "trialing";
    assinatura.statusAssinatura = "trialing";
    assinatura.promoUsed = false;
    assinatura.billingVariant = "premium_first_month";
    assinatura.startedAt = billingConfig.trialStartedAt;
    assinatura.currentPeriodStart = billingConfig.trialStartedAt;
    assinatura.currentPeriodEnd = calcularFimTrial(billingConfig.trialStartedAt, billingConfig.trialDays);
    assinatura.expiresAt = assinatura.currentPeriodEnd;
    assinatura.nextBillingAt = assinatura.currentPeriodEnd;
    billingConfig.subscriptionId = assinatura.id;
    billingConfig.paidUntil = assinatura.expiresAt;
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
  assinatura.planSlug = plano.slug;
  assinatura.planId = plano.slug;
  assinatura.status = normalizarStatusPlano(status);
  assinatura.statusAssinatura = assinatura.status;
  assinatura.promoUsed = detalhes.promoUsed === true || assinatura.promoUsed === true;
  assinatura.billingVariant = normalizarBillingVariant(detalhes.billingVariant || getBillingVariantAssinatura(assinatura));
  assinatura.currentPeriodStart = agora;
  assinatura.currentPeriodEnd = expiresAt;
  assinatura.startedAt = assinatura.startedAt || agora;
  assinatura.expiresAt = expiresAt;
  assinatura.nextBillingAt = expiresAt;
  assinatura.overdueSince = "";

  const cliente = getClienteSaasPorId(clientId);
  if (cliente) {
    cliente.planoAtual = plano.slug;
    cliente.statusAssinatura = assinatura.statusAssinatura;
    cliente.status = status === "blocked" ? "blocked" : "active";
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
    billingConfig.licenseStatus = status;
    billingConfig.licenseBlockLevel = "none";
    billingConfig.paidUntil = expiresAt;
    billingConfig.monthlyPrice = plano.price;
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
  const pagamento = normalizarPagamentoSaas({
    clientId,
    subscriptionId: assinatura.id,
    mercadoPagoSubscriptionId: dados.subscriptionId || assinatura.mercadoPagoSubscriptionId || "",
    preferenceId: dados.preference_id || dados.preferenceId || "",
    externalReference: dados.external_reference || "",
    planSlug: plano.slug,
    billingVariant,
    amount: Number(dados.amount || dados.valor || getPrecoBillingVariant(billingVariant)),
    status: "pending",
    paymentMethod: "mercado_pago",
    createdAt: new Date().toISOString()
  });
  saasPayments.unshift(pagamento);
  saasPayments = saasPayments.slice(0, 500);
  if (dados.subscriptionId) assinatura.mercadoPagoSubscriptionId = String(dados.subscriptionId);
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
    const dados = await chamarFuncaoSaas("mercadopago-create-payment", {
      clienteId: clientId,
      plan_id: plano.slug,
      billing_variant: billingVariant,
      plan: plano.slug,
      planSlug: plano.slug,
      email: getEmailLicencaAtual()
    });
    if (!dados?.init_point) throw new Error("Link de pagamento não retornado.");
    registrarPagamentoLocalPendente(plano, dados, "payment");
    window.open(dados.init_point, "_blank");
  } catch (erro) {
    registrarDiagnostico("Mercado Pago", "Pagamento não criado", erro.message);
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
    const dados = await chamarFuncaoSaas("mercadopago-create-payment", {
      clienteId: clientId,
      plan_id: plano.slug,
      billing_variant: billingVariant,
      plan: plano.slug,
      planSlug: plano.slug,
      email: getEmailLicencaAtual()
    });
    if (!dados?.init_point) throw new Error("Link de pagamento não retornado.");
    registrarPagamentoLocalPendente(plano, dados, "payment");
    window.open(dados.init_point, "_blank");
  } catch (erro) {
    registrarDiagnostico("Mercado Pago", "Pagamento não criado", erro.message);
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

  ativarPlanoClienteLocal(clientId, "free", "cancelled", 0, { origem: "cancelamento_cliente" });
  alert("Assinatura cancelada localmente. Seus dados foram mantidos.");
  renderApp();
}

function falarComSuporteAssinatura() {
  const texto = `Olá, preciso de suporte na assinatura do ${SYSTEM_NAME}. Cliente: ${getClienteCodigoAtual() || getEmailLicencaAtual() || "não identificado"}`;
  if (billingConfig.supportUrl) {
    window.open(billingConfig.supportUrl, "_blank");
    return;
  }
  const whats = String(appConfig.whatsappNumber || "").replace(/\D/g, "");
  if (whats) {
    window.open(`https://wa.me/${whats}?text=${encodeURIComponent(texto)}`, "_blank");
    return;
  }
  window.open(`mailto:${SUPERADMIN_BOOTSTRAP_EMAIL}?subject=Suporte Simplifica 3D&body=${encodeURIComponent(texto)}`, "_blank");
}

function salvarEmailLicenca() {
  const email = normalizarEmail(document.getElementById("licenseEmailInput")?.value || "");
  if (!email) {
    alert("Informe um e-mail válido para vincular a licença.");
    return;
  }

  billingConfig.licenseEmail = email;
  if (!registrarDispositivoLicenca(email)) return;
  salvarDados();
  registrarHistorico("Assinatura", "E-mail de licença vinculado");
  renderApp();
}

async function criarContaLicenca() {
  const email = normalizarEmail(document.getElementById("licenseEmailInput")?.value || billingConfig.licenseEmail || "");
  const senha = document.getElementById("licensePasswordInput")?.value || "";
  if (!email) {
    alert("Informe o e-mail para criar ou entrar na conta.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === email);
  if (!usuario) {
    usuario = normalizarUsuario({
      id: criarIdUsuario(),
      clientId: billingConfig.clientId || getClientIdAtual(),
      nome: email.split("@")[0],
      email,
      papel: "admin",
      ativo: true,
      criadoEm: new Date().toISOString()
    });
    usuarios.push(usuario);
  }
  if (senha) {
    const erroSenha = mensagemValidacaoSenha(senha);
    if (erroSenha) {
      alert(erroSenha);
      return;
    }
    await definirSenhaUsuario(usuario, senha, false);
  }

  billingConfig.licenseEmail = email;
  if (!registrarDispositivoLicenca(email)) return;
  usuarioAtualEmail = email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  salvarDados();
  registrarHistorico("Conta", "Conta vinculada: " + email);
  sincronizarAposLogin();
  renderApp();
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
    whatsappNumber: (document.getElementById("whatsappNumberConfig")?.value || "").replace(/\D/g, ""),
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
    twoFactorEnabled: appConfig.twoFactorEnabled,
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
  const telefone = (document.getElementById("signupTelefone")?.value || "").replace(/[^\d+]/g, "");
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
  if (!["superadmin", "dono"].includes(usuario.papel) && !registrarDispositivoLicenca(usuario.email)) return;
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
  if (driveFolderHandle) {
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
      registrarSeguranca("Sessão expirada", "erro", "Inatividade");
      alert("Sessão expirada");
      logoutUsuario();
      return;
    }
    if (!sessionWarned && inativo >= SECURITY_SESSION_TIMEOUT_MS - SECURITY_SESSION_WARNING_MS) {
      sessionWarned = true;
      alert("Sua sessão está prestes a expirar.");
    }
  }, 30000);
}

async function salvarDonoSistema() {
  if (!podeGerenciarComercial()) {
    alert("Entre como dono ou admin local para salvar o dono do produto.");
    return;
  }

  const nome = (document.getElementById("ownerNameAdmin")?.value || "Dono").trim();
  const email = normalizarEmail(document.getElementById("ownerEmailAdmin")?.value || "");
  const senha = document.getElementById("ownerPasswordAdmin")?.value || "";

  if (!email) {
    alert("Informe o e-mail do dono.");
    return;
  }
  if (!emailValido(email)) {
    alert("Informe um e-mail válido para o dono.");
    return;
  }

  billingConfig.ownerName = nome;
  billingConfig.ownerEmail = email;
  const usuarioDono = garantirUsuarioDono(nome, email, senha);
  usuarioDono.papel = "superadmin";
  if (senha) {
    const erroSenha = mensagemValidacaoSenha(senha);
    if (erroSenha) {
      alert(erroSenha);
      return;
    }
    await definirSenhaUsuario(usuarioDono, senha, true);
  }
  usuarioAtualEmail = usuarioDono.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  salvarDados();
  registrarHistorico("Dono", `Dono salvo: ${email}`);
  renderApp();
}

function loginComoDono() {
  if (!podeGerenciarComercial()) {
    alert("Entre como dono ou admin local para usar esta ação.");
    return;
  }

  const email = normalizarEmail(billingConfig.ownerEmail);
  if (!email) {
    alert("Salve o e-mail do dono primeiro.");
    return;
  }

  const usuarioDono = garantirUsuarioDono(billingConfig.ownerName || "Dono", email);
  usuarioAtualEmail = usuarioDono.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  salvarDados();
  registrarHistorico("Dono", "Login como dono realizado");
  renderApp();
}

async function adicionarUsuario() {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como dono ou admin para adicionar usuários.");
    return;
  }

  const nome = (document.getElementById("novoUsuarioNome")?.value || "").trim();
  const email = normalizarEmail(document.getElementById("novoUsuarioEmail")?.value || "");
  const phone = (document.getElementById("novoUsuarioTelefone")?.value || "").replace(/[^\d+]/g, "");
  const senha = document.getElementById("novoUsuarioSenha")?.value || "";
  const papel = normalizarPapel(document.getElementById("novoUsuarioPapel")?.value || "operador");
  const ativo = (document.getElementById("novoUsuarioStatus")?.value || "ativo") === "ativo";
  const podeCriarDono = isDono() || (adminLogado && !getUsuarioAtual());

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

  if (papel === "dono" && !podeCriarDono) {
    alert("Somente o dono ou o admin local pode criar outro dono.");
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
    alert("Entre como dono ou admin para remover usuários.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario) return;

  const donos = usuarios.filter((item) => item.papel === "dono");
  if (usuario.papel === "dono" && donos.length <= 1) {
    alert("Mantenha pelo menos um usuário dono cadastrado.");
    return;
  }

  if (isSuperAdminPrincipal(usuario)) {
    alert("O superadmin principal não pode ser removido.");
    return;
  }

  if (usuario.papel === "superadmin" && !isSuperAdmin()) {
    alert("Somente superadmin pode remover outro superadmin.");
    return;
  }

  if (normalizarEmail(usuario.email) === normalizarEmail(billingConfig.ownerEmail)) {
    alert("Altere o e-mail do dono antes de remover este usuário.");
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
    alert("Entre como dono ou admin local para alterar o comercial.");
    return;
  }

  const mobileLimit = Math.max(1, parseFloat(document.getElementById("mobileLimitAdmin")?.value) || 1);
  const desktopLimit = Math.max(1, parseFloat(document.getElementById("desktopLimitAdmin")?.value) || 1);

  billingConfig = {
    ...billingConfig,
    ownerMode: !!document.getElementById("ownerModeAdmin")?.checked,
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
    alert("Entre como dono ou admin local para ativar licença local.");
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
    alert("Entre como dono ou admin local para alterar licença.");
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
  return {
    cloudUrl: (document.getElementById("syncCloudUrl")?.value || syncConfig.cloudUrl || "").trim(),
    token: (document.getElementById("syncToken")?.value || syncConfig.token || "").trim(),
    deviceName: (document.getElementById("syncDeviceName")?.value || syncConfig.deviceName || "").trim(),
    driveFileName: arquivoDrive.endsWith(".json") ? arquivoDrive : arquivoDrive + ".json",
    autoBackupEnabled: autoBackupEnabledEl ? autoBackupEnabledEl.checked : !!syncConfig.autoBackupEnabled,
    autoBackupInterval,
    autoBackupTarget: document.getElementById("autoBackupTarget")?.value || syncConfig.autoBackupTarget || "drive",
    supabaseEnabled: supabaseEnabledEl ? supabaseEnabledEl.checked : !!syncConfig.supabaseEnabled,
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
    twoFactorEnabled: twoFactorEnabledEl ? twoFactorEnabledEl.checked : !!appConfig.twoFactorEnabled,
    twoFactorWhatsapp: (document.getElementById("twoFactorWhatsapp")?.value || appConfig.twoFactorWhatsapp || "").replace(/\D/g, ""),
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

  const ownerModeLocal = !!billingConfig.ownerMode;
  billingConfig = {
    ...billingConfig,
    ...backup.billingConfig,
    ownerMode: ownerModeLocal,
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
    autoBackupTarget: backup.configuracoes.autoBackupTarget || syncConfig.autoBackupTarget || "drive",
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
    throw ErrorService.capture(erro, { area: "Supabase", action: caminho, silent: true });
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
      const classificado = classificarFalhaClientesSaasRemoto(erro);
      avisosPermissao.push({ nome, status: classificado.status, detail: classificado.detail });
      logSuperadminSupabaseDebug(`${nome} não carregados`, classificado.log);
      return [];
    });
    const [clientesOnline, assinaturasOnline, pagamentosOnline, planosOnline, perfisOnline, perfisErpOnline] = await Promise.all([
      requisicaoSupabase("/rest/v1/clients?select=*&order=created_at.desc&limit=1000"),
      requisicaoSupabase("/rest/v1/subscriptions?select=*,plans(*)&order=created_at.desc&limit=1000"),
      requisicaoSupabase("/rest/v1/payments?select=*&order=created_at.desc&limit=1000"),
      requisicaoSupabase("/rest/v1/plans?select=*&order=price.asc"),
      carregarPerfis("/rest/v1/profiles?select=*&order=created_at.desc&limit=1000", "profiles"),
      carregarPerfis("/rest/v1/erp_profiles?select=*&order=created_at.desc&limit=1000", "erp_profiles")
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
      if (usuario) usuario.clientId = clientId;
      billingConfig.clientId = clientId;
      billingConfig.licenseEmail = email || billingConfig.licenseEmail;
      if (resultado.subscription_id) billingConfig.subscriptionId = String(resultado.subscription_id);
      if (resultado.plan_slug) billingConfig.planSlug = String(resultado.plan_slug);
      if (resultado.status) billingConfig.licenseStatus = String(resultado.status);
      marcarUsuarioSupabaseSincronizado(usuario);
      salvarDados();
    }
    console.info("[Supabase pós-login] sync_saas_user_after_login OK", {
      clientId: resultado?.client_id || "",
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

async function consultarLicencaSupabaseSilencioso() {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUrl) return null;
  try {
    const licenca = await requisicaoSupabase("/rest/v1/rpc/get_saas_license", {
      method: "POST",
      body: JSON.stringify({})
    });
    aplicarLicencaSaasOnline(licenca);
    return licenca;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Licença online não carregada", erro.message);
    return null;
  }
}

function aplicarLicencaSaasOnline(licenca = {}) {
  if (!licenca || typeof licenca !== "object") return;
  if (licenca.client_id) billingConfig.clientId = String(licenca.client_id);
  if (licenca.subscription_id) billingConfig.subscriptionId = String(licenca.subscription_id);
  if (licenca.plan_slug) billingConfig.planSlug = normalizarSlugPlano(licenca.plan_slug);
  billingConfig.licenseStatus = normalizarStatusPlano(licenca.status || billingConfig.licenseStatus || "pending");
  billingConfig.licenseBlockLevel = String(licenca.block_level || "none");
  if (licenca.current_period_end || licenca.expires_at) billingConfig.paidUntil = String(licenca.current_period_end || licenca.expires_at);

  let cliente = getClienteSaasPorId(billingConfig.clientId);
  if (!cliente && billingConfig.clientId) {
    cliente = normalizarClienteSaas({
      id: billingConfig.clientId,
      clientCode: licenca.client_code || "",
      name: appConfig.businessName || "Empresa 3D",
      email: billingConfig.licenseEmail || syncConfig.supabaseEmail || "",
      status: "active",
      planoAtual: licenca.plan_slug || "free",
      statusAssinatura: licenca.status || "pending"
    });
    saasClients.push(cliente);
  }
  if (cliente) {
    if (licenca.client_code) cliente.clientCode = String(licenca.client_code);
    cliente.planoAtual = normalizarSlugPlano(licenca.plan_slug || cliente.planoAtual);
    cliente.statusAssinatura = normalizarStatusPlano(licenca.status || cliente.statusAssinatura);
    cliente.status = licenca.block_level === "total" ? "blocked" : licenca.status === "past_due" ? "overdue" : "active";
    cliente.updatedAt = new Date().toISOString();
  }

  const assinatura = getAssinaturaSaas(billingConfig.clientId);
  if (assinatura) {
    assinatura.status = billingConfig.licenseStatus === "active" ? "active" : billingConfig.licenseStatus;
    assinatura.statusAssinatura = String(licenca.status_assinatura || licenca.status || assinatura.statusAssinatura);
    assinatura.planSlug = normalizarSlugPlano(licenca.plan_slug || assinatura.planSlug);
    assinatura.planId = assinatura.planSlug;
    assinatura.userId = licenca.user_id || assinatura.userId;
    assinatura.promoUsed = licenca.promo_used === true || assinatura.promoUsed === true;
    assinatura.billingVariant = normalizarBillingVariant(licenca.billing_variant || assinatura.billingVariant);
    assinatura.currentPeriodStart = licenca.current_period_start || assinatura.currentPeriodStart;
    assinatura.currentPeriodEnd = licenca.current_period_end || licenca.expires_at || assinatura.currentPeriodEnd;
    assinatura.expiresAt = assinatura.currentPeriodEnd || assinatura.expiresAt;
    assinatura.nextBillingAt = licenca.next_billing_at || assinatura.currentPeriodEnd || assinatura.nextBillingAt;
    assinatura.mercadoPagoSubscriptionId = licenca.mercado_pago_subscription_id || assinatura.mercadoPagoSubscriptionId;
  } else if (billingConfig.clientId) {
    saasSubscriptions.push(normalizarAssinaturaSaas({
      id: billingConfig.subscriptionId || "",
      clientId: billingConfig.clientId,
      userId: licenca.user_id || syncConfig.supabaseUserId || "",
      planSlug: licenca.plan_slug || "free",
      status: licenca.status || "pending",
      promoUsed: licenca.promo_used === true,
      billingVariant: licenca.billing_variant || "",
      currentPeriodStart: licenca.current_period_start || "",
      currentPeriodEnd: licenca.current_period_end || licenca.expires_at || "",
      expiresAt: licenca.expires_at || "",
      nextBillingAt: licenca.next_billing_at || "",
      mercadoPagoSubscriptionId: licenca.mercado_pago_subscription_id || ""
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
    usuario.phone = perfil.phone || usuario.phone || "";
    usuario.papel = normalizarPapel(perfil.role || usuario.papel);
    usuario.ativo = perfil.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = perfil.must_change_password === true && !usuario.passwordUpdatedAt;
    usuario.clientId = perfil.client_id || perfil.company_id || usuario.clientId || billingConfig.clientId || "";
    usuario.acceptedTermsAt = perfil.accepted_terms_at || usuario.acceptedTermsAt || "";
  }

  if (usuario.clientId) {
    billingConfig.clientId = usuario.clientId;
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

  salvarDados();
  return usuario;
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
      clientId: perfil?.client_id || perfil?.company_id || "",
      phone: perfil?.phone || "",
      papel: normalizarPapel(perfil?.role || "operador"),
      ativo: perfil?.status !== "blocked" && perfil?.status !== "inactive",
      bloqueado: perfil?.status === "blocked" || perfil?.status === "inactive",
      mustChangePassword: !!perfil?.must_change_password,
      acceptedTermsAt: perfil?.accepted_terms_at || ""
    });
    usuarios.push(usuario);
  } else {
    usuario.nome = perfil?.display_name || usuario.nome;
    usuario.phone = perfil?.phone || usuario.phone || "";
    usuario.papel = normalizarPapel(perfil?.role || usuario.papel);
    usuario.ativo = perfil?.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil?.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = perfil && "must_change_password" in perfil ? perfil.must_change_password === true && !usuario.passwordUpdatedAt : usuario.mustChangePassword;
    usuario.clientId = perfil?.client_id || perfil?.company_id || usuario.clientId || "";
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
        name: nome,
        business_name: negocio,
        phone: telefone,
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
          papel: "admin",
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
  const payload = criarSnapshotBackup();
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
  }
}

async function sincronizarSupabase() {
  if (!validarSupabase(true)) return;

  try {
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
    salvarDados();
    registrarHistorico("Supabase", remoto ? "Dados mesclados e enviados" : "Backup inicial criado");
    alert(remoto ? "Sincronização Supabase concluída" : "Backup inicial criado no Supabase");
    renderApp();
  } catch (erro) {
    alert("Não foi possível sincronizar com o Supabase: " + tratarErroSupabase(erro));
  }
}

async function sincronizarSupabaseSilencioso() {
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
  if (!exigirAcessoNuvem()) return;

  const handle = await garantirPastaDrive();
  if (!handle) return;

  if (!confirm("Salvar um backup dentro da pasta escolhida do Google Drive? O Google Drive Desktop poderá enviar esse arquivo para a nuvem.")) return;

  try {
    await escreverBackupDrive(handle, criarSnapshotBackup());
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
  if (!exigirAcessoNuvem()) return;

  const handle = await garantirPastaDrive();
  if (!handle) return;

  if (!confirm("Sincronizar agora vai ler o backup da pasta do Google Drive, mesclar com este aparelho e gravar o resultado de volta na pasta. Continuar?")) return;

  try {
    const dadosRemotos = await lerBackupDrive(handle);
    if (dadosRemotos) {
      aplicarBackup(dadosRemotos, "mesclar");
    }

    await escreverBackupDrive(handle, criarSnapshotBackup());
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

  await escreverBackupDrive(handle, criarSnapshotBackup());
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
    } else {
      await sincronizarGoogleDriveSilencioso();
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
  return !!usuario && ["superadmin", "dono", "admin"].includes(usuario.papel);
}

async function autorizarEdicaoPedido() {
  const usuario = getUsuarioAtual();
  if (usuarioPodeEditarPedidoSemSenha(usuario)) return true;

  const senha = await solicitarEntradaTexto({
    titulo: "Autorizar edição",
    mensagem: "Para editar este pedido, informe a senha de um admin ou dono.",
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
    alert("A senha padrão local foi desativada. Use a senha real de um admin ou dono.");
    return false;
  }

  const clientId = usuario?.clientId || getClientIdAtual();
  const autorizadores = normalizarUsuarios(usuarios).filter((item) => {
    if (!["superadmin", "dono", "admin"].includes(item.papel)) return false;
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
}

function cancelarEdicaoPedido() {
  pedidoEditando = null;
  itensPedido = [];
  clientePedido = "";
  clienteTelefonePedido = "";
  renderApp();
}

function removerPedido(id) {
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

function fecharPedido() {
  if (!permitirAcaoPlanoCompleto()) return;
  if (!pedidoEditando && !verificarLimitePedidosAntesCriar()) return;
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
  pedidoEditando = null;
  itensPedido = [];
  clientePedido = "";
  clienteTelefonePedido = "";
  telaAtual = isMobile() ? "pedidos" : telaAtual;
  renderApp();
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
    ErrorService.notify(erro, { area: "Calculadora", action: "Calcular preço" });
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
  if (!permitirAcaoPlanoCompleto()) return;
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
  if (!permitirAcaoPlanoCompleto()) return;
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
  await salvarOuCompartilharPdf(doc, `pedido-${pedidoId}-${cliente}.pdf`, "Pedido " + cliente);
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
  const dados = criarSnapshotBackup();

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "backup-erp-3d.json";
  link.click();
  URL.revokeObjectURL(url);
  registrarHistorico("Backup", "Backup local exportado");
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
  }
});

document.addEventListener("DOMContentLoaded", () => {
  iniciarIntroAbertura();
  configurarEventListenersArquitetura();
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
