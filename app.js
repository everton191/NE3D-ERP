// ==========================================================
// ERP 3D - layout mobile/desktop corrigido
// ==========================================================

const APP_VERSION = "2026.04.28-password-fix";
const PROJECT_COVER_IMAGE = "assets/project-cover.jpg";
const SUPABASE_DEFAULT_URL = "https://qsufnnivlgdidmjuaprb.supabase.co";
const SUPABASE_DEFAULT_ANON_KEY = "sb_publishable_lyLrAr-NKPVrnrO5_J-5Ow_WJDyq8t-";
const SUPERADMIN_BOOTSTRAP_EMAIL = "paessilvae@gmail.com";
const SUPERADMIN_BOOTSTRAP_HASH = "pbkdf2$120000$7IdXWxbOcEGHYrhsgKxbwQ==$zi+SJZy2LcZmhy0NiWxjIZ43/A9GJZiW0B5/hDSIwJg=";
const SECURITY_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SECURITY_SESSION_WARNING_MS = 2 * 60 * 1000;
const LOGIN_LOCK_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const ANDROID_PUBLIC_REPO = "everton191/NE3D-ERP.apk";
const ANDROID_RELEASES_URL = `https://github.com/${ANDROID_PUBLIC_REPO}/raw/main/NE3D-ERP.apk`;
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
  usuarios: "Usuários",
  seguranca: "Segurança",
  planos: "Planos",
  admin: "Admin",
  superadmin: "Super Admin",
  feedback: "Bugs e sugestões",
  acessoNegado: "Acesso negado"
};

let telaAtual = "dashboard";
let telaAnterior = "dashboard";
let ultimoCalculo = null;
let itensPedido = [];
let clientePedido = "";
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
let passwordResetTokens = carregarLista("passwordResetTokens");
let loginAttempts = carregarObjeto("loginAttempts", {});
let syncConfig = carregarObjeto("syncConfig", {
  cloudUrl: "",
  token: "",
  deviceName: "",
  driveFolderName: "",
  driveFileName: "erp3d-backup.json",
  driveLastSync: "",
  autoBackupEnabled: true,
  autoBackupInterval: 5,
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
  supabaseLastSync: ""
});
let appConfig = carregarObjeto("appConfig", {
  appName: "ERP 3D",
  businessName: "Minha empresa 3D",
  whatsappNumber: "",
  documentFooter: "Obrigado pela preferência.",
  pixKey: "",
  pixReceiverName: "",
  pixCity: "",
  pixDescription: "Pedido ERP 3D",
  brandLogoDataUrl: "",
  brandWatermarkEnabled: true,
  theme: "dark",
  accentColor: "#00a86b",
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
  { keywords: ["plano", "trial", "pago", "vencido", "bloqueado", "premium"], answer: "O Trial libera recursos premium por 7 dias. Plano pago libera tudo até o vencimento. Plano vencido bloqueia recursos premium. Bloqueado impede acesso mesmo com dias restantes. Superadmin sempre tem acesso total." },
  { keywords: ["superadmin", "super", "administrador principal"], answer: "Super Admin é exclusivo do administrador principal. Ele vê a aba Super Admin, gerencia usuários, planos, bloqueios, vencimentos e acessa todas as funções sem limite de aparelho." },
  { keywords: ["login", "entrar", "acesso", "sessao", "sessão"], answer: "Use a área Admin para entrar com e-mail e senha. A sessão expira após inatividade por segurança. Se aparecer Acesso negado, seu perfil não tem permissão para aquela tela ou o plano não libera o recurso." },
  { keywords: ["senha", "recuperar", "esqueci", "trocar"], answer: "Em Segurança você pode alterar sua senha. Use uma senha forte com 8 ou mais caracteres, maiúscula, minúscula, número e símbolo. Se esquecer, use Esqueci minha senha; com Supabase configurado, o reset usa o fluxo de autenticação online." },
  { keywords: ["usuario", "usuário", "usuarios", "usuários", "permissao", "permissão", "perfil"], answer: "Admin e superadmin podem criar usuários. Os perfis são superadmin, admin, operador e visualizador. Operador trabalha na operação; visualizador consulta; admin gerencia usuários e dados; superadmin acessa tudo." },
  { keywords: ["caixa", "financeiro", "relatorio", "relatório"], answer: "Em Caixa você registra entradas e saídas. Os pedidos finalizados entram como movimentação financeira. Relatórios mostram visão resumida para acompanhar faturamento, saldo e operação." },
  { keywords: ["producao", "produção", "impressao", "impressão"], answer: "A tela Produção acompanha pedidos em aberto ou em andamento. Atualize o status para organizar o fluxo de impressão, entrega e finalização." }
];
let billingConfig = carregarObjeto("billingConfig", {
  ownerMode: false,
  ownerName: "",
  ownerEmail: "",
  licenseStatus: "free",
  trialStartedAt: "",
  trialDays: 7,
  blocked: false,
  monthlyPrice: 19.9,
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
  cloudSyncPaidOnly: true
});
let usuarios = carregarLista("usuarios");
let deviceId = localStorage.getItem("deviceId") || criarDeviceId();
let driveFolderHandle = null;
let autoBackupTimer = null;
let autoBackupRodando = false;

carregarSessaoSensivelSupabase();

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
  localStorage.setItem("passwordResetTokens", JSON.stringify(passwordResetTokens));
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
}

function carregarSessaoSensivelSupabase() {
  try {
    const sessao = JSON.parse(sessionStorage.getItem("supabaseSession") || "{}");
    syncConfig = {
      ...syncConfig,
      supabaseAccessToken: sessao.supabaseAccessToken || syncConfig.supabaseAccessToken || "",
      supabaseRefreshToken: sessao.supabaseRefreshToken || syncConfig.supabaseRefreshToken || "",
      supabaseTokenExpiresAt: Number(sessao.supabaseTokenExpiresAt) || Number(syncConfig.supabaseTokenExpiresAt) || 0,
      supabaseUserId: sessao.supabaseUserId || syncConfig.supabaseUserId || "",
      supabaseEmail: sessao.supabaseEmail || syncConfig.supabaseEmail || ""
    };
  } catch (_) {}
}

function limparSessaoSensivelSupabase() {
  syncConfig.supabaseAccessToken = "";
  syncConfig.supabaseRefreshToken = "";
  syncConfig.supabaseTokenExpiresAt = 0;
  sessionStorage.removeItem("supabaseSession");
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

function normalizarPapel(papel) {
  const alvo = String(papel || "").toLowerCase();
  if (alvo === "user" || alvo === "usuario") return "operador";
  return ["superadmin", "dono", "admin", "operador", "visualizador"].includes(alvo) ? alvo : "operador";
}

function normalizarUsuario(usuario) {
  const email = normalizarEmail(usuario?.email);
  if (!email) return null;

  return {
    id: usuario?.id || criarIdUsuario(),
    nome: String(usuario?.nome || email.split("@")[0] || "Usuário").trim(),
    email,
    senha: String(usuario?.senha || ""),
    passwordHash: usuario?.passwordHash || usuario?.senhaHash || "",
    mustChangePassword: usuario?.mustChangePassword === true || usuario?.senhaTemporaria === true,
    senhaTemporaria: usuario?.senhaTemporaria === true || usuario?.mustChangePassword === true,
    phone: String(usuario?.phone || usuario?.telefone || "").trim(),
    papel: normalizarPapel(usuario?.papel),
    ativo: usuario?.ativo !== false,
    bloqueado: usuario?.bloqueado === true,
    planStatus: usuario?.planStatus || "",
    planExpiresAt: usuario?.planExpiresAt || "",
    trialStartedAt: usuario?.trialStartedAt || "",
    trialDays: Math.max(1, Number(usuario?.trialDays) || Number(billingConfig.trialDays) || 7),
    criadoEm: usuario?.criadoEm || new Date().toISOString(),
    atualizadoEm: usuario?.atualizadoEm || usuario?.criadoEm || new Date().toISOString(),
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

  billingConfig.ownerEmail = billingConfig.ownerEmail || SUPERADMIN_BOOTSTRAP_EMAIL;
  billingConfig.ownerName = billingConfig.ownerName || usuario.nome;
  return usuario;
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
    `${appConfig.appName || "ERP 3D"} - verificação em duas etapas`,
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
  const limites = billingConfig.deviceLimits && typeof billingConfig.deviceLimits === "object" ? billingConfig.deviceLimits : {};
  return {
    mobile: Math.max(1, Number(limites.mobile) || 1),
    desktop: Math.max(1, Number(limites.desktop) || 1)
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
  return lista.filter((item) => item.email === emailLicenca && item.tipo === tipo).length < limites[tipo];
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

  if (!atual && lista.filter((item) => item.email === emailLicenca && item.tipo === tipo).length >= limites[tipo]) {
    if (!silencioso) {
      alert(`Limite da licença atingido: ${limites.mobile} celular e ${limites.desktop} Windows/navegador por e-mail.`);
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
        <span class="muted">${limites.mobile} celular + ${limites.desktop} Windows/navegador</span>
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

function getMarcaProjetoSrc() {
  return appConfig.brandLogoDataUrl || PROJECT_COVER_IMAGE;
}

function renderMarcaProjeto(classe = "brand-logo", alt = "Marca do projeto") {
  const src = getMarcaProjetoSrc();
  return src ? `<img class="${escaparAttr(classe)}" src="${escaparAttr(src)}" alt="${escaparAttr(alt)}">` : "";
}

function totalPedido(pedido) {
  return Number(pedido?.total ?? pedido?.valor ?? 0) || 0;
}

function clienteDoPedido(pedido) {
  return pedido?.cliente || pedido?.nome || "Sem cliente";
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
  return billingConfig.licenseStatus === "blocked" || billingConfig.blocked;
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

function hasActivePlan(user = getUsuarioAtual()) {
  if (isSuperAdmin(user)) return true;
  if (usuarioEstaBloqueado(user) || planoGlobalBloqueado()) return false;
  if (billingConfig.ownerMode || isDono()) return true;
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
  const plano = getPlanoAtual();
  if (canUsePremiumFeatures()) return true;
  if (plano.status === "bloqueado") {
    alert("Este acesso está bloqueado. Fale com o administrador.");
  } else if (plano.status === "expirado") {
    alert("Seu plano expirou. Renove para voltar a usar os recursos premium.");
  } else if (plano.completo) {
    alert("Este e-mail já atingiu o limite de aparelhos da licença.");
  } else {
    alert("Recurso premium. O trial ativo e o plano pago liberam esta função.");
  }
  trocarTela("assinatura");
  return false;
}

function temAcessoNuvem() {
  return billingConfig.cloudSyncPaidOnly === false || canUsePremiumFeatures();
}

function exigirAcessoNuvem() {
  if (temAcessoNuvem()) return true;
  alert("Backup em nuvem faz parte do plano completo ou do trial ativo. O backup JSON manual continua disponível.");
  trocarTela("assinatura");
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
  const cor = appConfig.accentColor || "#00a86b";
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

  const nome = appConfig.appName || "ERP 3D";
  document.title = nome;
  const titulo = document.getElementById("appTitleText") || document.getElementById("appTitle");
  if (titulo) {
    titulo.textContent = appConfig.showBrandInHeader ? nome : "ERP";
  }

  const logo = document.getElementById("appLogo");
  if (logo) {
    logo.src = getMarcaProjetoSrc();
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

  const configuracoes = ["config", "backup", "personalizacao", "empresa", "preferencias", "assinatura", "planos", "admin", "usuarios", "seguranca", "superadmin", "acessoNegado"];

  if (configuracoes.includes(telaAtual)) {
    return `<div class="desktop-focus">${renderTela(telaAtual)}</div>`;
  }

  if (telaAtual !== "dashboard") {
    return `
      <div class="desktop-focus">${renderTela(telaAtual)}</div>
      <div class="desktop-side-preview">${renderDashboard()}</div>
    `;
  }

  return renderDashboard();
}

function renderTopbar() {
  const usuario = getUsuarioAtual();
  const plano = getPlanoAtual(usuario);
  const nomeUsuario = usuario?.nome || (adminLogado ? "Admin local" : "Visitante");
  return `
    <section class="topbar">
      <div>
        <strong>${escaparHtml(appConfig.appName || "NE 3D ERP")}</strong>
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
  return ["calculadora", "admin", "assinatura", "planos", "acessoNegado"].includes(tela);
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
      text: "Olá! Sou o assistente local do NE3D ERP. Posso ajudar com pedido, estoque, calculadora, backup, PDF, plano, login e Supabase."
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
          <strong>Assistente NE3D</strong>
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
          <strong>${escaparHtml(appConfig.appName || "ERP 3D")}</strong>
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
        { tela: "clientes", icone: "👥", texto: "Clientes" }
      ]
    },
    {
      titulo: "Financeiro",
      itens: [
        { tela: "caixa", icone: "💰", texto: "Caixa" },
        { tela: "relatorios", icone: "📈", texto: "Relatórios" }
      ]
    },
    {
      titulo: "Configurações",
      itens: [
        { tela: "empresa", icone: "🏢", texto: "Empresa" },
        { tela: "backup", icone: "☁️", texto: "Backup" },
        { tela: "preferencias", icone: "⚙️", texto: "Preferências" },
        { tela: "seguranca", icone: "🔒", texto: "Segurança" },
        { tela: "feedback", icone: "💡", texto: "Feedback" }
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
            <strong>${escaparHtml(appConfig.appName || "ERP 3D")}</strong>
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
    case "feedback":
      return renderFeedback();
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
    { tela: "planos", icone: "💳", texto: "Plano" }
  ];
  if (!getUsuarioAtual() || podeGerenciarUsuarios()) acoes.push({ tela: "usuarios", icone: "🔐", texto: "Admin" });
  if (getUsuarioAtual()) acoes.push({ tela: "seguranca", icone: "🔒", texto: "Segurança" });
  if (isSuperAdmin()) acoes.push({ tela: "superadmin", icone: "🛡️", texto: "Super" });

  return `
    <div class="quick-actions">
      ${acoes.filter((acao) => canAccessScreen(acao.tela)).map((acao) => `
        <button class="quick-action" onclick="trocarTela('${acao.tela}')">
          <span>${acao.icone}</span>
          <strong>${acao.texto}</strong>
        </button>
      `).join("")}
    </div>
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

function renderDashboard() {
  const totaisCaixa = calcularTotaisCaixa();
  const stats = getDashboardStats();
  const plano = getPlanoAtual();

  const cards = [
    { icone: "💸", titulo: "Faturamento do dia", valor: formatarMoeda(stats.faturamentoDia), badge: "Hoje" },
    { icone: "📋", titulo: "Pedidos do dia", valor: stats.pedidosHoje, badge: "Operação" },
    { icone: "🕒", titulo: "Pedidos em aberto", valor: stats.pedidosAbertos, badge: stats.pedidosAbertos ? "Ação" : "OK" },
    { icone: "🖨️", titulo: "Produções ativas", valor: stats.producoesAtivas, badge: "Produção" },
    { icone: "📦", titulo: "Estoque baixo", valor: stats.estoqueBaixo, badge: stats.estoqueBaixo ? "Atenção" : "OK" },
    { icone: "📈", titulo: "Lucro estimado", valor: formatarMoeda(stats.lucroEstimado), badge: "Margem" },
    { icone: "💳", titulo: "Status do plano", valor: plano.nome, badge: plano.status },
    { icone: "⏳", titulo: "Dias restantes", valor: plano.diasRestantes >= 9999 ? "Livre" : plano.diasRestantes, badge: "Plano" }
  ];

  return `
    <section class="dashboard-pro">
      <div class="dashboard-hero card">
        <div class="project-cover">
          ${renderMarcaProjeto("project-cover-image", "Capa do projeto")}
          <div class="project-cover-text">
            <strong>${escaparHtml(appConfig.businessName || appConfig.appName || "ERP 3D")}</strong>
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
          <article class="kpi-card">
            <span class="kpi-icon">${card.icone}</span>
            <div>
              <span>${escaparHtml(card.titulo)}</span>
              <strong>${escaparHtml(card.valor)}</strong>
            </div>
            <em class="status-badge ${classeStatusPlano(String(card.badge).toLowerCase())}">${escaparHtml(card.badge)}</em>
          </article>
        `).join("")}
      </div>

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
  if (!temAcessoCompleto()) return renderBloqueioPlano("Novo pedido");
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
  if (!temAcessoCompleto()) return renderBloqueioPlano("Estoque");
  normalizarEstoque();
  const linhas = estoque.length
    ? estoque.map((material, i) => `
        <div class="stock-row">
          <div class="row-title">
            <strong>${escaparHtml(material.nome)}</strong>
            <span class="muted">${escaparHtml(material.tipo || inferirTipoMaterial(material.nome))}${material.cor ? " • " + escaparHtml(material.cor) : ""} • ${(Number(material.qtd) || 0).toFixed(3)} kg</span>
          </div>
          ${(Number(material.qtd) || 0) <= estoqueMinimoKg ? `<span class="status-badge badge-alerta">Estoque baixo</span>` : `<span class="status-badge badge-ativo">OK</span>`}
          <div class="row-actions">
            <button class="btn ghost" onclick="editarMaterial(${i})">✏️ Editar</button>
            <button class="btn danger" onclick="removerMaterial(${i})">Remover</button>
          </div>
        </div>
      `).join("")
    : `<p class="empty">Nenhum material cadastrado.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>📦 Estoque</h2>
      </div>
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
      <button class="btn" onclick="addMaterial()">Adicionar material</button>
      ${linhas}
    </section>
  `;
}

function renderListaPedidos() {
  if (!temAcessoCompleto()) return renderBloqueioPlano("Pedidos");
  const lista = [...pedidos].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
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
              <button class="btn ghost" onclick="event.stopPropagation(); editarPedido(${id})">✏️ Editar</button>
              <button class="btn danger" onclick="event.stopPropagation(); removerPedido(${id})">Remover</button>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="empty">Nenhum pedido fechado ainda.</p>`;

  return `
    <section class="card">
      <div class="card-header">
        <h2>📋 Pedidos</h2>
        <button class="icon-button" onclick="trocarTela('pedido')" title="Novo pedido">➕</button>
      </div>
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
      <p class="muted">Cliente: ${escaparHtml(clienteDoPedido(pedido))} • Total: ${formatarMoeda(total)}</p>
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

function renderRelatorios() {
  if (!temAcessoCompleto()) return renderBloqueioPlano("Relatórios");
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
      <p class="muted">Relatórios avançados por período ficam preparados para a futura camada online/Supabase, mantendo o localStorage atual funcionando.</p>
    </section>
  `;
}

function renderCaixa() {
  if (!temAcessoCompleto()) return renderBloqueioPlano("Caixa");
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
            <div class="row-actions">
              <button class="btn danger" onclick="removerMovimentoCaixa(${indice})">Remover</button>
            </div>
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
      <button class="btn" onclick="adicionarMovimentoCaixa()">Lançar movimento</button>
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
      <p class="muted">${escaparHtml(plano.descricao)}. Trial ativo, plano pago e superadmin liberam recursos premium.</p>
      <div class="actions">
        <button class="btn secondary" onclick="abrirCalculadora()">🧮 Abrir calculadora</button>
        <button class="btn" onclick="trocarTela('assinatura')">Ver plano completo</button>
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
          <span class="status-badge">Plano completo</span>
        </div>
        <p class="muted">A sincronização entre Android e Windows/navegador fica disponível no plano completo. No grátis, a calculadora continua liberada e o backup local manual ainda pode ser exportado.</p>
        <div class="admin-grid">
          <div class="metric">
            <span>Grátis</span>
            <strong>Calculadora</strong>
          </div>
          <div class="metric">
            <span>Completo</span>
            <strong>Nuvem + PDF</strong>
          </div>
        </div>
        <div class="actions">
          <button class="btn" onclick="trocarTela('assinatura')">Ver plano completo</button>
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
          <button class="btn ghost" onclick="baixarAtualizacaoAndroid()">Baixar APK</button>
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
            <input id="autoBackupInterval" type="number" min="1" step="1" value="${Number(syncConfig.autoBackupInterval) || 5}">
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
        ${usuarioAtual ? `
          <p class="muted">Você está logado como ${escaparHtml(usuarioAtual.nome)} (${escaparHtml(usuarioAtual.papel)}), mas este usuário não gerencia o sistema.</p>
        ` : `
          <p class="muted">Entre com o e-mail do dono ou de um admin cadastrado. O acesso local por senha continua disponível para manutenção.</p>
        `}
        ${renderVerificacao2FA()}
        <div class="sync-grid">
          <label class="field">
            <span>E-mail do usuário</span>
            <input id="usuarioLoginEmail" type="email" value="${escaparAttr(usuarioAtualEmail || SUPERADMIN_BOOTSTRAP_EMAIL)}" placeholder="seu@email.com" autocomplete="username">
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
          <button class="btn ghost" onclick="solicitarRecuperacaoSenha()">Esqueci minha senha</button>
          ${usuarioAtual ? `<button class="btn ghost" onclick="logoutUsuario()">Sair do usuário</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Ver plano</button>`}
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

      <div class="danger-zone">
        <button class="btn danger" onclick="zerarDadosAdmin()">Zerar dados locais</button>
      </div>

      <h2 class="section-title">Histórico</h2>
      <div class="history-list">
        ${ultimosEventos}
      </div>
    </section>
  `;
}

function renderUsuariosAdmin() {
  usuarios = normalizarUsuarios(usuarios);
  const lista = usuarios;
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

function alternarSenhaVisivel(idOuBotao) {
  const input = typeof idOuBotao === "string"
    ? document.getElementById(idOuBotao)
    : idOuBotao?.closest?.(".password-row")?.querySelector("input");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  input.focus();
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
        <p class="muted">Ao sair, tokens temporários e dados sensíveis da sessão são limpos deste aparelho.</p>
        <div class="actions">
          <button class="btn warning" onclick="logoutUsuario()">Sair com segurança</button>
          <button class="btn ghost" onclick="sairSupabase()">Encerrar Supabase</button>
        </div>
      </div>

      <h2 class="section-title">Logs de segurança</h2>
      <div class="history-list">${logs}</div>
    </section>
  `;
}

function statusUsuarioPlano(usuario) {
  if (usuarioEstaBloqueado(usuario)) return "bloqueado";
  if (usuario.papel === "superadmin") return "superadmin";
  if (isTrialActive(usuario)) return "trial";
  if ((usuario.planStatus === "paid" || usuario.planStatus === "active") && (!usuario.planExpiresAt || getRemainingDays(usuario.planExpiresAt) > 0)) return "pago";
  if (usuario.planExpiresAt || usuario.trialStartedAt) return "vencido";
  return "gratis";
}

function renderSuperAdmin() {
  if (!isSuperAdmin()) {
    return renderBloqueioPlano("Super Admin");
  }

  usuarios = normalizarUsuarios(usuarios);
  const termo = String(window.__superAdminBusca || "").toLowerCase();
  const lista = usuarios.filter((usuario) => !termo || usuario.email.includes(termo) || usuario.nome.toLowerCase().includes(termo));

  return `
    <section class="card">
      <div class="card-header">
        <h2>🛡️ Super Admin</h2>
        <span class="status-badge badge-superadmin">Acesso total</span>
      </div>
      <p class="muted">Painel local preparado para a futura camada online/Supabase. Superadmin vê todos os usuários locais e pode ajustar plano, vencimento e bloqueio.</p>

      <div class="sync-grid">
        <label class="field">
          <span>Buscar por e-mail</span>
          <input value="${escaparAttr(window.__superAdminBusca || "")}" oninput="filtrarSuperAdmin(this.value)" placeholder="cliente@email.com">
        </label>
        <label class="field">
          <span>E-mail para acesso manual</span>
          <input id="superEmail" type="email" placeholder="cliente@email.com">
        </label>
        <label class="field">
          <span>Tipo de plano</span>
          <select id="superPlanoTipo">
            <option value="trial">Trial</option>
            <option value="paid">Pago</option>
            <option value="free">Grátis</option>
          </select>
        </label>
        <label class="field">
          <span>Dias</span>
          <input id="superPlanoDias" type="number" min="1" step="1" value="7">
        </label>
      </div>
      <div class="actions">
        <button class="btn" onclick="salvarAcessoSuperAdmin()">Criar acesso manual</button>
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
                <button class="btn ghost" onclick="ajustarDiasUsuario('${escaparAttr(usuario.id)}', 90)">+90</button>
                <button class="btn ghost" onclick="ajustarDiasUsuario('${escaparAttr(usuario.id)}', 365)">+365</button>
                <button class="btn warning" onclick="alternarBloqueioUsuario('${escaparAttr(usuario.id)}')" ${principal ? "disabled" : ""}>${usuario.bloqueado ? "Desbloquear" : "Bloquear"}</button>
                <button class="btn danger" onclick="excluirUsuarioSuperAdmin('${escaparAttr(usuario.id)}')" ${principal ? "disabled" : ""}>Excluir</button>
              </div>
            </div>
          `;
        }).join("") || `<p class="empty">Nenhum usuário encontrado.</p>`}
      </div>
    </section>
  `;
}

function filtrarSuperAdmin(valor) {
  window.__superAdminBusca = valor || "";
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
    usuario = normalizarUsuario({ nome: email.split("@")[0], email, senha: "123", papel: "admin" });
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
  const corAtual = appConfig.accentColor || "#00a86b";
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
        <input id="appNameConfig" value="${escaparAttr(appConfig.appName)}" placeholder="ERP 3D">
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
            <input id="pixDescriptionConfig" maxlength="40" value="${escaparAttr(appConfig.pixDescription || "Pedido ERP 3D")}">
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
        ${["#00a86b", "#2f6fed", "#e11d48", "#f59e0b", "#7c3aed", "#0f766e"].map((cor) => `
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
  const preco = Number(billingConfig.monthlyPrice) || 19.9;
  const diasTeste = Number(billingConfig.trialDays) || 7;
  const temLinkPagamento = !!billingConfig.mercadoPagoLink;
  const downloadAndroid = billingConfig.androidDownloadUrl || ANDROID_RELEASES_URL;
  const downloadWindows = billingConfig.windowsWebUrl || billingConfig.windowsDownloadUrl || location.origin;
  const limites = getLimitesDispositivos();

  return `
    <section class="card">
      <div class="card-header">
        <h2>💳 Planos</h2>
        <span class="status-badge ${classeStatusPlano(plano.status)}">${escaparHtml(plano.nome)}</span>
      </div>
      <p class="muted">${escaparHtml(plano.descricao)}. O modo grátis mantém a calculadora liberada; o completo libera pedidos, estoque, caixa, PDF com Pix, WhatsApp, marca no PDF e sincronização entre Android e Windows/navegador.</p>

      <div class="admin-grid">
        <div class="plan-card">
          <div class="row-title">
            <strong>Grátis</strong>
            <span class="muted">R$ 0</span>
          </div>
          <p class="muted">Calculadora de impressão 3D liberada. Sem backup automático, sem nuvem e sem emissão completa.</p>
          <button class="btn secondary" onclick="abrirCalculadora()">Usar calculadora</button>
        </div>
        <div class="plan-card featured">
          <div class="row-title">
            <strong>Completo</strong>
            <span class="muted">${formatarMoeda(preco)}/mês</span>
          </div>
          <p class="muted">${diasTeste} dias grátis, depois assinatura mensal. Inclui ${limites.mobile} celular Android e ${limites.desktop} Windows/navegador por e-mail.</p>
          <div class="actions single">
            <button class="btn" onclick="iniciarTesteGratis()">Começar ${diasTeste} dias grátis</button>
            <button class="btn ghost" onclick="abrirLinkMercadoPago()" ${temLinkPagamento ? "" : "disabled"}>Assinar no Mercado Pago</button>
          </div>
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

function renderFeedback() {
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
        <span class="status-badge">${appConfig.telemetryEnabled === false ? "Pausado" : "Local"}</span>
      </div>
      <p class="muted">Registros ficam salvos neste aparelho e entram no backup. Nada é enviado para internet automaticamente.</p>

      <label class="checkbox-row">
        <input id="telemetryEnabledConfig" type="checkbox" ${appConfig.telemetryEnabled !== false ? "checked" : ""}>
        <span>Registrar erros locais do funcionamento</span>
      </label>
      <button class="btn ghost" onclick="salvarFeedbackConfig()">Salvar configuração</button>

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

      <div class="danger-zone">
        <h2 class="section-title">Erros recentes</h2>
        <div class="actions">
          <button class="btn ghost" onclick="registrarDiagnosticoManual()">Registrar teste</button>
          <button class="btn danger" onclick="limparDiagnosticos()">Limpar erros</button>
        </div>
        <div class="history-list">
          ${listaErros}
        </div>
      </div>
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

function iniciarTesteGratis() {
  if (billingConfig.ownerMode) {
    alert("Modo dono já tem acesso completo.");
    return;
  }

  const email = normalizarEmail(document.getElementById("licenseEmailInput")?.value || billingConfig.licenseEmail || usuarioAtualEmail || "");
  if (!email) {
    alert("Informe o e-mail da conta antes de iniciar o teste grátis.");
    return;
  }

  if (!billingConfig.trialStartedAt) {
    billingConfig.licenseEmail = email;
    billingConfig.trialStartedAt = new Date().toISOString();
    billingConfig.licenseStatus = "trial";
    if (!registrarDispositivoLicenca(email)) return;
    salvarDados();
    registrarHistorico("Assinatura", "Teste grátis iniciado");
  }

  renderApp();
}

function abrirLinkMercadoPago() {
  if (!billingConfig.mercadoPagoLink) {
    alert("Configure o link do plano do Mercado Pago no Admin.");
    return;
  }
  window.open(billingConfig.mercadoPagoLink, "_blank");
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

function criarContaLicenca() {
  const email = normalizarEmail(document.getElementById("licenseEmailInput")?.value || billingConfig.licenseEmail || "");
  const senha = document.getElementById("licensePasswordInput")?.value || "";
  if (!email) {
    alert("Informe o e-mail para criar ou entrar na conta.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  let usuario = usuarios.find((item) => item.email === email);
  if (!usuario) {
    usuario = {
      id: criarIdUsuario(),
      nome: email.split("@")[0],
      email,
      senha: senha || "123",
      papel: "admin",
      ativo: true,
      criadoEm: new Date().toISOString()
    };
    usuarios.push(usuario);
  } else if (senha) {
    usuario.senha = senha;
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
    appName: (document.getElementById("appNameConfig")?.value || "ERP 3D").trim(),
    businessName: (document.getElementById("businessNameConfig")?.value || "Minha empresa 3D").trim(),
    whatsappNumber: (document.getElementById("whatsappNumberConfig")?.value || "").replace(/\D/g, ""),
    documentFooter: (document.getElementById("documentFooterConfig")?.value || "").trim(),
    pixKey: (document.getElementById("pixKeyConfig")?.value || "").trim(),
    pixReceiverName: (document.getElementById("pixReceiverNameConfig")?.value || "").trim(),
    pixCity: (document.getElementById("pixCityConfig")?.value || "").trim(),
    pixDescription: (document.getElementById("pixDescriptionConfig")?.value || "Pedido ERP 3D").trim(),
    brandWatermarkEnabled: document.getElementById("brandWatermarkEnabledConfig") ? !!document.getElementById("brandWatermarkEnabledConfig")?.checked : appConfig.brandWatermarkEnabled !== false,
    theme: document.getElementById("themeConfig")?.value || "dark",
    accentColor: document.getElementById("accentColorConfig")?.value || "#00a86b",
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
    appName: "ERP 3D",
    businessName: "Minha empresa 3D",
    whatsappNumber: "",
    documentFooter: "Obrigado pela preferência.",
    pixKey: "",
    pixReceiverName: "",
    pixCity: "",
    pixDescription: "Pedido ERP 3D",
    brandLogoDataUrl: "",
    brandWatermarkEnabled: true,
    theme: "dark",
    accentColor: "#00a86b",
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

async function loginAdmin() {
  const senha = document.getElementById("adminSenha")?.value || "";
  if (!isAmbienteLocal()) {
    alert("Acesso de manutenção local indisponível neste ambiente.");
    registrarSeguranca("Acesso admin local negado", "erro", "Ambiente não local", "admin-local");
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

async function loginUsuario() {
  const email = normalizarEmail(document.getElementById("usuarioLoginEmail")?.value || "");
  const senha = document.getElementById("usuarioLoginSenha")?.value || "";
  usuarios = normalizarUsuarios(usuarios);

  if (!email || !senha) {
    alert("Campo obrigatório");
    registrarSeguranca("Falha de login", "erro", "Campo obrigatório", email);
    return;
  }
  if (loginEstaBloqueado(email)) return;

  setBotaoLoading("loginUsuarioBtn", true);
  let usuario = usuarios.find((item) => item.email === email);
  let senhaValida = usuario && !usuarioEstaBloqueado(usuario) && await verificarSenhaUsuario(usuario, senha);
  if (!senhaValida) {
    try {
      usuario = await loginUsuarioSupabase(email, senha);
      senhaValida = !!usuario && !usuarioEstaBloqueado(usuario);
    } catch (erro) {
      registrarDiagnostico("Supabase", "Login online falhou", erro.message);
    }
  }

  if (!usuario || !senhaValida) {
    registrarFalhaLogin(email, !usuario ? "Usuário inexistente" : "Senha inválida ou usuário inativo");
    alert("Usuário ou senha inválidos");
    setBotaoLoading("loginUsuarioBtn", false);
    return;
  }

  if (precisa2FA(usuario)) {
    iniciarVerificacao2FA("usuario", usuario);
    setBotaoLoading("loginUsuarioBtn", false);
    return;
  }

  limparFalhasLogin(email);
  concluirLoginUsuario(usuario);
  setBotaoLoading("loginUsuarioBtn", false);
}

function concluirLoginUsuario(usuario) {
  if (usuarioEstaBloqueado(usuario)) {
    alert("Este usuário está bloqueado. Fale com o administrador.");
    return;
  }
  if (!["superadmin", "dono"].includes(usuario.papel) && !registrarDispositivoLicenca(usuario.email)) return;
  usuarioAtualEmail = usuario.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  usuario.lastLoginAt = new Date().toISOString();
  salvarDados();
  registrarHistorico("Usuário", `Login de ${usuario.nome}`);
  registrarSeguranca("Login realizado", "sucesso", usuario.papel, usuario.email);
  registrarAtividadeSessao();
  sincronizarAposLogin();
  renderApp();
}

function sincronizarAposLogin() {
  if (!temAcessoNuvem()) return;
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

  const erroSenha = mensagemValidacaoSenha(senha);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }

  if (papel === "superadmin" && !isSuperAdmin()) {
    alert("Somente um superadmin pode criar outro superadmin.");
    return;
  }

  if (papel === "dono" && !podeCriarDono) {
    alert("Somente o dono ou o admin local pode criar outro dono.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  const existente = usuarios.find((usuario) => usuario.email === email);
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
  } else {
    const novo = normalizarUsuario({
      id: criarIdUsuario(),
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
  const senha = prompt("Digite a nova senha temporária para " + usuario.email);
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
    cloudSyncPaidOnly: true
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
  const autoBackupInterval = Math.max(1, parseFloat(document.getElementById("autoBackupInterval")?.value || syncConfig.autoBackupInterval || 5) || 5);
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
    cloudSyncPaidOnly: true
  };
}

function criarSnapshotBackup() {
  return {
    versao: 3,
    app: "ERP 3D",
    exportadoEm: new Date().toISOString(),
    deviceId,
    data: {
      estoque,
      caixa,
      pedidos,
      orcamentos,
      historico,
      securityLogs,
      diagnostics,
      sugestoes,
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

function normalizarBackup(dados) {
  const origem = dados?.data || dados || {};
  return {
    estoque: Array.isArray(origem.estoque) ? origem.estoque : [],
    caixa: Array.isArray(origem.caixa) ? origem.caixa : [],
    pedidos: Array.isArray(origem.pedidos) ? origem.pedidos : [],
    orcamentos: Array.isArray(origem.orcamentos) ? origem.orcamentos : [],
    historico: Array.isArray(origem.historico) ? origem.historico : [],
    securityLogs: Array.isArray(origem.securityLogs) ? origem.securityLogs : [],
    diagnostics: Array.isArray(origem.diagnostics) ? origem.diagnostics : [],
    sugestoes: Array.isArray(origem.sugestoes) ? origem.sugestoes : [],
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
    diagnostics = mesclarListas(diagnostics, backup.diagnostics).slice(0, 150);
    sugestoes = mesclarListas(sugestoes, backup.sugestoes).slice(0, 100);
    usuarios = mesclarUsuarios(usuarios, backup.usuarios);
  } else {
    estoque = backup.estoque;
    caixa = backup.caixa;
    pedidos = backup.pedidos;
    orcamentos = backup.orcamentos.slice(0, 100);
    historico = backup.historico.slice(0, 250);
    securityLogs = backup.securityLogs.slice(0, 300);
    diagnostics = backup.diagnostics.slice(0, 150);
    sugestoes = backup.sugestoes.slice(0, 100);
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
    cloudSyncPaidOnly: true
  };

  syncConfig = {
    ...syncConfig,
    cloudUrl: backup.configuracoes.cloudUrl || syncConfig.cloudUrl,
    deviceName: syncConfig.deviceName || backup.configuracoes.deviceName || "",
    driveFolderName: syncConfig.driveFolderName || backup.configuracoes.driveFolderName || "",
    driveFileName: syncConfig.driveFileName || backup.configuracoes.driveFileName || "erp3d-backup.json",
    driveLastSync: backup.configuracoes.driveLastSync || syncConfig.driveLastSync,
    autoBackupEnabled: typeof backup.configuracoes.autoBackupEnabled === "boolean" ? backup.configuracoes.autoBackupEnabled : syncConfig.autoBackupEnabled,
    autoBackupInterval: backup.configuracoes.autoBackupInterval || syncConfig.autoBackupInterval || 5,
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
    throw new Error(detalhe);
  }

  return dados;
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

async function alterarSenhaSupabaseSeConectado(novaSenha) {
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId) return false;
  try {
    await requisicaoSupabase("/auth/v1/user", {
      method: "PUT",
      body: JSON.stringify({ password: novaSenha })
    });
    return true;
  } catch (erro) {
    registrarDiagnostico("Supabase", "Senha local alterada, Supabase não atualizado", erro.message);
    return false;
  }
}

async function solicitarRecuperacaoSenha() {
  const email = normalizarEmail(prompt("Informe o e-mail para recuperação de senha") || "");
  if (!email) {
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
  const usuario = dados?.user || sessao.user || {};
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

async function loginUsuarioSupabase(email, senha) {
  syncConfig.supabaseUrl = normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL);
  syncConfig.supabaseAnonKey = syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY;
  const dados = await requisicaoSupabase("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password: senha })
  });
  if (!salvarSessaoSupabase(dados, email)) return null;

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
      phone: perfil?.phone || "",
      papel: normalizarPapel(perfil?.role || "operador"),
      ativo: perfil?.status !== "blocked" && perfil?.status !== "inactive",
      bloqueado: perfil?.status === "blocked" || perfil?.status === "inactive",
      mustChangePassword: !!perfil?.must_change_password
    });
    usuarios.push(usuario);
  } else {
    usuario.nome = perfil?.display_name || usuario.nome;
    usuario.phone = perfil?.phone || usuario.phone || "";
    usuario.papel = normalizarPapel(perfil?.role || usuario.papel);
    usuario.ativo = perfil?.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil?.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = !!perfil?.must_change_password || usuario.mustChangePassword;
  }

  await definirSenhaUsuario(usuario, senha, !!usuario.mustChangePassword);
  salvarDados();
  return usuario;
}

function entrarSupabase() {
  autenticarSupabase(false);
}

function criarContaSupabase() {
  autenticarSupabase(true);
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
    await requisicaoSupabase("/rest/v1/erp_profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: syncConfig.supabaseUserId,
        email: syncConfig.supabaseEmail,
        display_name: getUsuarioAtual()?.nome || syncConfig.supabaseEmail.split("@")[0],
        phone: getUsuarioAtual()?.phone || "",
        status: "active",
        last_login_at: new Date().toISOString()
      })
    });
    return true;
  } catch (erro) {
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
}

async function enviarBackupSupabase() {
  if (!validarSupabase(true)) return;
  if (!confirm("Enviar um backup completo para o Supabase?")) return;

  try {
    await salvarPerfilSupabase();
    await salvarBackupSupabase();
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
    await salvarBackupSupabase();
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
    syncConfig.autoBackupStatus = "Nuvem só no plano completo";
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
  await salvarBackupSupabase();

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
    syncConfig.autoBackupStatus = "Nuvem só no plano completo";
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
    syncConfig.autoBackupStatus = "Nuvem só no plano completo";
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
  return Math.max(1, Number(syncConfig.autoBackupInterval) || 5) * 60 * 1000;
}

function iniciarAutoBackup() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }

  if (!temAcessoNuvem()) {
    syncConfig.autoBackupStatus = "Nuvem só no plano completo";
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
  pedidoEditando = null;
  registrarHistorico("Admin", "Dados locais zerados");
  salvarDados();
  renderApp();
}

function atualizarClientePedido(valor) {
  clientePedido = valor;
}

function editarNome(i, nome) {
  if (!itensPedido[i]) return;
  itensPedido[i].nome = nome;
}

function editarQtd(i, qtd) {
  if (!itensPedido[i]) return;
  const quantidade = Math.max(parseFloat(qtd) || 1, 1);
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
  itensPedido[i].tempoHoras = Math.max(0, parseFloat(tempo) || 0);
}

function editarPreco(i, preco) {
  if (!itensPedido[i]) return;
  const valor = Math.max(parseFloat(preco) || 0, 0);
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
  materiais[materialIndex] = {
    ...(materiais[materialIndex] || {}),
    gramas: Math.max(0, parseFloat(gramas) || 0)
  };
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

function editarPedido(id) {
  if (!exigirPlanoCompleto()) return;
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
  pedidoEditando = pedido;
  trocarTela("pedido");
}

function cancelarEdicaoPedido() {
  pedidoEditando = null;
  itensPedido = [];
  clientePedido = "";
  renderApp();
}

function removerPedido(id) {
  if (!exigirPlanoCompleto()) return;
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
  const faltas = [];
  diff.forEach((item) => {
    if (item.kg <= 0) return;
    const material = getMaterialEstoque(item.materialId);
    const saldo = Number(material?.qtd) || 0;
    if (!material || saldo + 0.000001 < item.kg) {
      faltas.push(`${material?.nome || "Material"}: precisa ${item.kg.toFixed(3)} kg, saldo ${saldo.toFixed(3)} kg`);
    }
  });
  return faltas;
}

function aplicarDiffEstoque(diff, motivo = "pedido") {
  normalizarEstoque();
  diff.forEach((item) => {
    const material = getMaterialEstoque(item.materialId);
    if (!material) return;
    material.qtd = Math.max(0, (Number(material.qtd) || 0) - item.kg);
    const tipoMovimento = item.kg >= 0 ? "saída" : "entrada";
    registrarHistorico("Estoque", `${tipoMovimento} por ${motivo}: ${material.nome} (${Math.abs(item.kg).toFixed(3)} kg)`);
  });
}

function aplicarEstoquePedido(pedidoNovo, pedidoAntigo = null) {
  const diff = diffConsumoPedido(pedidoNovo, pedidoAntigo);
  const faltas = validarSaldoEstoque(diff);
  if (faltas.length) {
    alert("Estoque insuficiente:\n" + faltas.join("\n"));
    return false;
  }
  aplicarDiffEstoque(diff, pedidoAntigo ? "edição de pedido" : "pedido");
  return true;
}

function devolverEstoquePedido(pedido, motivo = "cancelamento") {
  const diff = diffConsumoPedido({ itens: [] }, pedido);
  aplicarDiffEstoque(diff, motivo);
}

function fecharPedido() {
  if (!exigirPlanoCompleto()) return;
  const campoCliente = document.getElementById("clienteNome");
  const cliente = (campoCliente?.value || clientePedido).trim();

  if (!cliente) {
    alert("Digite o nome do cliente");
    return;
  }

  if (itensPedido.length === 0) {
    alert("Nenhum item no pedido");
    return;
  }

  const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  const pedido = prepararRegistroOnline({
    id: pedidoEditando?.id || Date.now(),
    cliente,
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
  telaAtual = isMobile() ? "pedidos" : telaAtual;
  renderApp();
}

function alterarStatusPedido(id, status) {
  if (!exigirPlanoCompleto()) return;
  const pedido = pedidos.find((item) => Number(item.id) === Number(id));
  if (!pedido) return;
  pedido.status = status || "aberto";
  pedido.atualizadoEm = new Date().toISOString();
  salvarDados();
  registrarHistorico("Produção", `Status do pedido ${id}: ${pedido.status}`);
  renderApp();
}

function addMaterial() {
  if (!exigirPlanoCompleto()) return;
  const tipo = document.getElementById("matTipo")?.value || "PLA";
  const cor = (document.getElementById("matCor")?.value || "").trim();
  const nome = [tipo, cor].filter(Boolean).join(" ");
  const qtd = parseFloat(document.getElementById("matQtd")?.value) || 0;

  if (!nome || qtd <= 0) {
    alert("Quantidade inválida");
    return;
  }

  normalizarEstoque();
  const existente = estoque.find((material) => material.tipo === tipo && String(material.cor || "").toLowerCase() === cor.toLowerCase());
  if (existente) {
    existente.qtd = (Number(existente.qtd) || 0) + qtd;
  } else {
    estoque.push(prepararRegistroOnline(normalizarMaterialEstoque({ id: Date.now(), nome, tipo, cor, qtd })));
  }

  salvarDados();
  registrarHistorico("Estoque", "Material adicionado: " + nome + " (" + qtd + " kg)");
  renderApp();
}

function editarMaterial(i) {
  if (!exigirPlanoCompleto()) return;
  normalizarEstoque();
  const material = estoque[i];
  if (!material) return;

  const nome = prompt("Nome do material:", material.nome);
  const qtd = prompt("Quantidade em kg:", material.qtd);
  const cor = prompt("Cor do material:", material.cor || "");

  if (nome !== null && nome.trim()) {
    material.nome = nome.trim();
    material.tipo = inferirTipoMaterial(material.nome);
  }

  if (qtd !== null) {
    material.qtd = parseFloat(qtd) || 0;
  }

  if (cor !== null) {
    material.cor = cor.trim();
    material.nome = [material.tipo || inferirTipoMaterial(material.nome), material.cor].filter(Boolean).join(" ");
  }

  salvarDados();
  registrarHistorico("Estoque", "Material editado: " + material.nome);
  renderApp();
}

function removerMaterial(i) {
  if (!exigirPlanoCompleto()) return;
  if (!estoque[i]) return;
  if (!confirm("Remover este material?")) return;

  estoque.splice(i, 1);
  salvarDados();
  registrarHistorico("Estoque", "Material removido");
  renderApp();
}

function adicionarMovimentoCaixa() {
  if (!exigirPlanoCompleto()) return;
  const tipo = document.getElementById("caixaTipo")?.value || "entrada";
  const valor = parseFloat(document.getElementById("caixaValor")?.value) || 0;
  const descricao = document.getElementById("caixaDescricao")?.value.trim() || "";

  if (valor <= 0) {
    alert("Valor inválido");
    return;
  }

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
  if (!exigirPlanoCompleto()) return;
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
  const peso = parseFloat(document.getElementById("peso")?.value) || 0;
  const filamento = parseFloat(document.getElementById("filamento")?.value) || 0;
  const tempo = parseFloat(document.getElementById("tempo")?.value) || 0;
  const qtd = Math.max(parseFloat(document.getElementById("quantidade")?.value) || 1, 1);
  const energia = parseFloat(document.getElementById("energia")?.value) || 0;
  const consumo = parseFloat(document.getElementById("consumo")?.value) || 0;
  const custoHora = parseFloat(document.getElementById("custoHora")?.value) || 0;
  const margem = parseFloat(document.getElementById("margem")?.value) || 0;
  const taxaExtra = parseFloat(document.getElementById("taxaExtra")?.value) || 0;
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
  const qtd = Math.max(parseFloat(document.getElementById("quantidade")?.value) || 1, 1);

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
  if (!exigirPlanoCompleto()) return;
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

function dadosPedidoAtual() {
  const cliente = (document.getElementById("clienteNome")?.value || clientePedido || "Sem cliente").trim();
  const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  return { cliente, total };
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

  const recebedor = normalizarCampoPix(appConfig.pixReceiverName || appConfig.businessName || appConfig.appName || "ERP 3D", 25) || "ERP 3D";
  const cidade = normalizarCampoPix(appConfig.pixCity || "FORTALEZA", 15) || "FORTALEZA";
  const descricao = normalizarCampoPix(appConfig.pixDescription || cliente || "PEDIDO ERP 3D", 40);
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

async function gerarPDF() {
  if (!exigirPlanoCompleto()) return;
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
  const empresa = appConfig.businessName || appConfig.appName || "ERP 3D";
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 14;
  const cor = appConfig.accentColor || "#00a86b";
  const corRgb = hexParaRgb(cor);
  const data = new Date().toLocaleDateString("pt-BR");
  const pedidoId = pedidoEditando?.id || Date.now();
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
  doc.roundedRect(margem, 40, largura - margem * 2, 26, 3, 3, "F");
  doc.setFontSize(11);
  doc.text("Cliente", margem + 4, 50);
  doc.setFontSize(13);
  doc.text(cliente || "Sem cliente", margem + 4, 60);
  doc.setFontSize(10);
  doc.text("Emitido por " + empresa, largura - margem - 4, 50, { align: "right" });
  doc.text(appConfig.whatsappNumber ? "WhatsApp: " + appConfig.whatsappNumber : "Documento comercial", largura - margem - 4, 60, { align: "right" });

  let y = 78;
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
  try {
    doc.save(`pedido-${cliente.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  } catch (erro) {
    try {
      const url = URL.createObjectURL(doc.output("blob"));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (erroAlternativo) {
      registrarDiagnostico("pdf", "Download do PDF falhou", erroAlternativo.message || erro.message);
      alert("Não foi possível baixar o PDF neste dispositivo. Tente abrir pelo navegador ou exportar novamente.");
    }
  }
}

function enviarWhats() {
  if (!exigirPlanoCompleto()) return;
  if (itensPedido.length === 0) {
    alert("Adicione itens ao pedido antes de enviar");
    return;
  }

  const { cliente, total } = dadosPedidoAtual();
  const linhas = itensPedido.map((item) => {
    return `- ${item.nome} | Qtd: ${item.qtd} | Total: ${formatarMoeda(item.total)}`;
  });

  const mensagem = [
    "Pedido " + (appConfig.businessName || appConfig.appName || "ERP 3D"),
    "Cliente: " + cliente,
    "",
    ...linhas,
    "",
    "Total: " + formatarMoeda(total),
    appConfig.documentFooter ? "\n" + appConfig.documentFooter : ""
  ].join("\n");

  const numero = appConfig.whatsappNumber ? appConfig.whatsappNumber.replace(/\D/g, "") : "";
  const destino = numero ? "https://wa.me/" + numero + "?text=" : "https://wa.me/?text=";
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

function baixarAtualizacaoAndroid() {
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

  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;

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

  if (appConfig.autoUpdateEnabled === false) {
    appConfig.updateStatus = appConfig.updateStatus || "Atualização automática desligada";
    salvarDados();
    return;
  }

  updateTimer = setInterval(() => verificarAtualizacao(false), intervaloAtualizacaoMs());
  setTimeout(() => verificarAtualizacao(false), 2500);
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

document.addEventListener("DOMContentLoaded", () => {
  renderApp();
  iniciarAutoBackup();
  iniciarMonitorAtualizacao();
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
