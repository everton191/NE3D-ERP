// ==========================================================
// ERP 3D - layout mobile/desktop corrigido
// ==========================================================

const APP_VERSION = "2026.04.27-users14";

const telas = {
  dashboard: "Início",
  pedido: "Novo pedido",
  estoque: "Estoque",
  pedidos: "Pedidos",
  caixa: "Caixa",
  config: "Configurações",
  personalizacao: "Personalizar",
  assinatura: "Plano",
  admin: "Admin",
  feedback: "Bugs e sugestões"
};

let telaAtual = "dashboard";
let telaAnterior = "dashboard";
let ultimoCalculo = null;
let itensPedido = [];
let clientePedido = "";
let pedidoEditando = null;
let modoMobileAtual = window.innerWidth < 768;
let resizeTimer = null;
let adminLogado = sessionStorage.getItem("adminLogado") === "sim";
let usuarioAtualEmail = sessionStorage.getItem("usuarioAtualEmail") || "";
let twoFactorPending = null;
let updateTimer = null;
let dashboardWindowAction = null;
let calcWidgetAction = null;

let estoque = carregarLista("estoque");
let caixa = carregarLista("caixa");
let pedidos = carregarLista("pedidos");
let historico = carregarLista("historico");
let diagnostics = carregarLista("diagnostics");
let sugestoes = carregarLista("sugestoes");
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
  ultimaSync: ""
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
let billingConfig = carregarObjeto("billingConfig", {
  ownerMode: true,
  ownerName: "",
  ownerEmail: "",
  licenseStatus: "free",
  trialStartedAt: "",
  trialDays: 7,
  monthlyPrice: 10,
  mercadoPagoLink: "",
  licenseEmail: "",
  paidUntil: "",
  androidDownloadUrl: "",
  windowsDownloadUrl: "",
  supportUrl: ""
});
let usuarios = carregarLista("usuarios");
let deviceId = localStorage.getItem("deviceId") || criarDeviceId();
let driveFolderHandle = null;
let autoBackupTimer = null;
let autoBackupRodando = false;

const printers = {
  "Ender 3": { consumo: 120, custo: 1 },
  "Ender 3 V2": { consumo: 130, custo: 1.2 },
  "Anycubic Kobra": { consumo: 140, custo: 1.3 },
  "Creality K1": { consumo: 220, custo: 2.2 },
  "Prusa MK3S+": { consumo: 150, custo: 1.8 },
  "Elegoo Neptune 4": { consumo: 180, custo: 1.9 },
  "Bambu A1": { consumo: 220, custo: 2.2 },
  "Bambu P1P": { consumo: 250, custo: 2.5 },
  "Bambu X1": { consumo: 300, custo: 3 },
  "Bambu X1 Carbon": { consumo: 320, custo: 3.2 }
};

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
  localStorage.setItem("historico", JSON.stringify(historico));
  localStorage.setItem("diagnostics", JSON.stringify(diagnostics));
  localStorage.setItem("sugestoes", JSON.stringify(sugestoes));
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  localStorage.setItem("syncConfig", JSON.stringify(syncConfig));
  localStorage.setItem("appConfig", JSON.stringify(appConfig));
  localStorage.setItem("billingConfig", JSON.stringify(billingConfig));
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
  return ["dono", "admin", "operador"].includes(papel) ? papel : "operador";
}

function normalizarUsuario(usuario) {
  const email = normalizarEmail(usuario?.email);
  if (!email) return null;

  return {
    id: usuario?.id || criarIdUsuario(),
    nome: String(usuario?.nome || email.split("@")[0] || "Usuário").trim(),
    email,
    senha: String(usuario?.senha || "123"),
    papel: normalizarPapel(usuario?.papel),
    ativo: usuario?.ativo !== false,
    criadoEm: usuario?.criadoEm || new Date().toISOString()
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

function garantirUsuarioDono(nome = billingConfig.ownerName, email = billingConfig.ownerEmail, senha = "") {
  const emailDono = normalizarEmail(email);
  if (!emailDono) return null;

  usuarios = normalizarUsuarios(usuarios);
  const existente = usuarios.find((usuario) => normalizarEmail(usuario.email) === emailDono);
  if (existente) {
    existente.nome = String(nome || existente.nome || "Dono").trim();
    existente.senha = senha || existente.senha || "123";
    existente.papel = "dono";
    existente.ativo = true;
    return existente;
  }

  const novo = {
    id: criarIdUsuario(),
    nome: String(nome || "Dono").trim(),
    email: emailDono,
    senha: senha || "123",
    papel: "dono",
    ativo: true,
    criadoEm: new Date().toISOString()
  };
  usuarios.unshift(novo);
  return novo;
}

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
  return (emailDono && emailAtual === emailDono) || usuario?.papel === "dono";
}

function isAdminCliente() {
  const usuario = getUsuarioAtual();
  return usuario?.papel === "admin" || usuario?.papel === "dono";
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
  return !usuario || ["dono", "admin"].includes(usuario.papel);
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

function totalPedido(pedido) {
  return Number(pedido?.total ?? pedido?.valor ?? 0) || 0;
}

function clienteDoPedido(pedido) {
  return pedido?.cliente || pedido?.nome || "Sem cliente";
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

function getPlanoAtual() {
  if (isDono()) {
    return {
      nome: "Dono",
      completo: true,
      descricao: "Seu e-mail de dono libera o aplicativo inteiro"
    };
  }

  if (billingConfig.ownerMode) {
    return {
      nome: "Dono",
      completo: true,
      descricao: "Acesso completo do proprietário"
    };
  }

  if (billingConfig.licenseStatus === "active") {
    const vence = Date.parse(billingConfig.paidUntil || 0) || 0;
    const ativo = !vence || vence >= Date.now();
    return {
      nome: ativo ? "Completo" : "Expirado",
      completo: ativo,
      descricao: ativo ? "Assinatura ativa" : "Pagamento vencido"
    };
  }

  if (billingConfig.trialStartedAt) {
    const inicio = Date.parse(billingConfig.trialStartedAt);
    const dias = Math.max(1, Number(billingConfig.trialDays) || 7);
    const fim = inicio + dias * 24 * 60 * 60 * 1000;
    const restante = Math.ceil((fim - Date.now()) / (24 * 60 * 60 * 1000));
    return {
      nome: restante > 0 ? "Teste" : "Grátis",
      completo: restante > 0,
      descricao: restante > 0 ? `${restante} dia(s) grátis restantes` : "Teste encerrado"
    };
  }

  return {
    nome: "Grátis",
    completo: false,
    descricao: "Calculadora liberada"
  };
}

function temAcessoCompleto() {
  return getPlanoAtual().completo;
}

function exigirPlanoCompleto() {
  if (temAcessoCompleto()) return true;
  alert("Recurso disponível no plano completo. A calculadora continua liberada no grátis.");
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
  const titulo = document.getElementById("appTitle");
  if (titulo) {
    titulo.textContent = appConfig.showBrandInHeader ? nome : "ERP";
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

  if (telaAtual !== tela) {
    telaAnterior = telaAtual;
  }

  telaAtual = tela;
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
  app.innerHTML = mobile ? renderMobile() : renderDesktop();
  atualizarMenu();
  ajustarJanelasDashboardAoWorkspace(false);
  renderCalculadoraFlutuante();
}

function renderDesktop() {
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
  const configuracoes = ["config", "personalizacao", "assinatura", "admin"];

  if (configuracoes.includes(telaAtual)) {
    return `<div class="desktop-focus">${renderTela(telaAtual)}</div>`;
  }

  if (telaAtual !== "dashboard") {
    return `
      <div class="desktop-focus">${renderTela(telaAtual)}</div>
      <div class="desktop-side-preview">${renderDashboard()}</div>
    `;
  }

  return renderDashboardOrganizavel();
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
  const principais = [
    { tela: "dashboard", icone: "📊", texto: "Resumo" },
    { tela: "pedido", icone: "➕", texto: "Novo pedido" },
    { tela: "estoque", icone: "📦", texto: "Estoque" },
    { tela: "pedidos", icone: "📋", texto: "Pedidos" },
    { tela: "caixa", icone: "💰", texto: "Caixa" }
  ];

  const configs = [
    { tela: "config", icone: "☁️", texto: "Backup" },
    { tela: "personalizacao", icone: "🎨", texto: "Personalizar" },
    { tela: "assinatura", icone: "💳", texto: "Planos" },
    { tela: "feedback", icone: "💡", texto: "Bugs e sugestões" },
    { tela: "admin", icone: "🔐", texto: "Admin" }
  ];

  return `
    <aside class="side-menu ${recolhido ? "is-collapsed" : ""}" aria-label="Menu lateral">
      <div class="side-brand">
        <button class="icon-button side-menu-toggle" onclick="alternarMenuLateral()" title="${recolhido ? "Mostrar menu" : "Esconder menu"}">☰</button>
        <div class="side-brand-text">
          <strong>${escaparHtml(appConfig.appName || "ERP 3D")}</strong>
          <span>${escaparHtml(getPlanoAtual().nome)}</span>
        </div>
      </div>
      <div class="side-section">
        <span>Principal</span>
        ${principais.map(renderBotaoLateral).join("")}
      </div>
      <div class="side-section">
        <span>Configurações</span>
        ${configs.map(renderBotaoLateral).join("")}
      </div>
    </aside>
  `;
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
  return [
    { tela: "dashboard", icone: "📊", texto: "Resumo", grupo: "Principal" },
    { tela: "pedido", icone: "➕", texto: "Novo pedido", grupo: "Principal" },
    { tela: "estoque", icone: "📦", texto: "Estoque", grupo: "Principal" },
    { tela: "pedidos", icone: "📋", texto: "Pedidos", grupo: "Principal" },
    { tela: "caixa", icone: "💰", texto: "Caixa", grupo: "Principal" },
    { tela: "config", icone: "☁️", texto: "Backup", grupo: "Configurações" },
    { tela: "personalizacao", icone: "🎨", texto: "Personalizar", grupo: "Configurações" },
    { tela: "assinatura", icone: "💳", texto: "Planos", grupo: "Configurações" },
    { tela: "feedback", icone: "💡", texto: "Bugs e sugestões", grupo: "Configurações" },
    { tela: "admin", icone: "🔐", texto: "Admin", grupo: "Configurações" }
  ];
}

function abrirMenuPopup() {
  if (!isMobile()) {
    alternarMenuLateral();
    return;
  }

  const popup = document.getElementById("popup");
  if (!popup) return;

  const itens = getItensMenuPopup();
  const grupos = ["Principal", "Configurações"];
  popup.innerHTML = `
    <div class="side-drawer-backdrop" role="dialog" aria-modal="true" aria-label="Menu do aplicativo" onclick="fecharPopup()">
      <aside class="side-menu side-drawer" onclick="event.stopPropagation()">
        <div class="side-brand">
          <button class="icon-button side-menu-toggle" onclick="fecharPopup()" title="Fechar">✕</button>
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
  const painelAberto = telaAtual !== "dashboard";

  return `
    <div class="mobile-home">
      ${renderDashboard(true)}
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
  switch (tela) {
    case "pedido":
      return renderPedido();
    case "estoque":
      return renderEstoque();
    case "pedidos":
      return renderListaPedidos();
    case "caixa":
      return renderCaixa();
    case "config":
      return renderConfig();
    case "personalizacao":
      return renderPersonalizacao();
    case "assinatura":
      return renderAssinatura();
    case "feedback":
      return renderFeedback();
    case "admin":
      return renderAdmin();
    default:
      return renderDashboard();
  }
}

function renderAcoesRapidas() {
  const acoes = [
    { tela: "pedido", icone: "➕", texto: "Novo pedido" },
    { tela: "estoque", icone: "📦", texto: "Estoque" },
    { tela: "pedidos", icone: "📋", texto: "Pedidos" },
    { tela: "caixa", icone: "💰", texto: "Caixa" },
    { tela: "config", icone: "☁️", texto: "Nuvem" },
    { tela: "personalizacao", icone: "🎨", texto: "Tema" },
    { tela: "assinatura", icone: "💳", texto: "Plano" },
    { tela: "admin", icone: "🔐", texto: "Admin" }
  ];

  return `
    <div class="quick-actions">
      ${acoes.map((acao) => `
        <button class="quick-action" onclick="trocarTela('${acao.tela}')">
          <span>${acao.icone}</span>
          <strong>${acao.texto}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderDashboard() {
  const totaisCaixa = calcularTotaisCaixa();
  const valorPedidos = pedidos.reduce((total, pedido) => total + totalPedido(pedido), 0);
  const estoqueKg = estoque.reduce((total, material) => total + (Number(material.qtd) || 0), 0);
  const plano = getPlanoAtual();

  return `
    <section class="card summary-card">
      <div class="card-header">
        <h2>📊 Resumo</h2>
        <button class="icon-button" onclick="trocarTela('assinatura')" title="Plano">💳</button>
      </div>
      <div class="metrics">
        <div class="metric">
          <span>Saldo</span>
          <strong>${formatarMoeda(totaisCaixa.saldo)}</strong>
        </div>
        <div class="metric">
          <span>Pedidos</span>
          <strong>${pedidos.length}</strong>
        </div>
        <div class="metric">
          <span>Vendas</span>
          <strong>${formatarMoeda(valorPedidos)}</strong>
        </div>
        <div class="metric">
          <span>Estoque</span>
          <strong>${estoqueKg.toFixed(2)} kg</strong>
        </div>
        <div class="metric">
          <span>Gastos</span>
          <strong>${formatarMoeda(totaisCaixa.saidas)}</strong>
        </div>
        <div class="metric">
          <span>Nuvem</span>
          <strong>${syncConfig.ultimaSync ? "Ativa" : "Pendente"}</strong>
        </div>
        <div class="metric">
          <span>Plano</span>
          <strong>${escaparHtml(plano.nome)}</strong>
        </div>
        <div class="metric">
          <span>Acesso</span>
          <strong>${plano.completo ? "Completo" : "Grátis"}</strong>
        </div>
      </div>
      <div class="actions">
        <button class="btn secondary" onclick="abrirCalculadora()">🧮 Calculadora grátis</button>
        <button class="btn ghost" onclick="trocarTela('assinatura')">Ver planos</button>
      </div>
    </section>
  `;
}

function renderPedido() {
  if (!temAcessoCompleto()) return renderBloqueioPlano("Novo pedido");
  const titulo = pedidoEditando ? "✏️ Editando pedido" : "📦 Novo pedido";
  const botao = pedidoEditando ? "Atualizar pedido" : "Fechar pedido";
  const total = itensPedido.reduce((soma, item) => soma + (Number(item.total) || 0), 0);

  const itensHtml = itensPedido.length
    ? itensPedido.map((item, i) => `
        <div class="order-item">
          <label class="field">
            <span>Item</span>
            <input value="${escaparAttr(item.nome)}" oninput="editarNome(${i}, this.value)">
          </label>
          <label class="field">
            <span>Qtd</span>
            <input type="number" min="1" step="1" value="${Number(item.qtd) || 1}" onchange="editarQtd(${i}, this.value)">
          </label>
          <label class="field">
            <span>Valor</span>
            <input type="number" min="0" step="0.01" value="${(Number(item.valor) || 0).toFixed(2)}" onchange="editarPreco(${i}, this.value)">
          </label>
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

      ${itensHtml}

      <div class="total-line">
        <span>Total</span>
        <strong>${formatarMoeda(total)}</strong>
      </div>

      <div class="actions">
        <button class="btn secondary" onclick="abrirCalculadora()">🧮 Calcular item</button>
        <button class="btn ghost" onclick="gerarPDF()">📄 PDF</button>
        <button class="btn ghost" onclick="enviarWhats()">📲 WhatsApp</button>
        <button class="btn" onclick="fecharPedido()">✅ ${botao}</button>
      </div>
    </section>
  `;
}

function renderEstoque() {
  if (!temAcessoCompleto()) return renderBloqueioPlano("Estoque");
  const linhas = estoque.length
    ? estoque.map((material, i) => `
        <div class="stock-row">
          <div class="row-title">
            <strong>${escaparHtml(material.nome)}</strong>
            <span class="muted">${(Number(material.qtd) || 0).toFixed(2)} kg</span>
          </div>
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
        <span>Material</span>
        <select id="matTipo">
          <option>PLA</option>
          <option>PETG</option>
          <option>ABS</option>
          <option>TPU</option>
        </select>
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
  const linhas = lista.length
    ? lista.map((pedido) => {
        const id = Number(pedido.id);
        const itens = Array.isArray(pedido.itens) ? pedido.itens.length : 1;
        return `
          <div class="list-row">
            <div class="row-title">
              <strong>${escaparHtml(clienteDoPedido(pedido))}</strong>
              <span class="muted">${escaparHtml(pedido.data || "")}</span>
            </div>
            <div class="muted">${itens} item(ns) • ${formatarMoeda(totalPedido(pedido))}</div>
            <div class="row-actions">
              <button class="btn ghost" onclick="editarPedido(${id})">✏️ Editar</button>
              <button class="btn danger" onclick="removerPedido(${id})">Remover</button>
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
      ${linhas}
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
        <span class="status-badge">${escaparHtml(plano.nome)}</span>
      </div>
      <p class="muted">Este recurso faz parte do plano completo. No plano grátis, a calculadora continua disponível.</p>
      <div class="actions">
        <button class="btn secondary" onclick="abrirCalculadora()">🧮 Abrir calculadora</button>
        <button class="btn" onclick="trocarTela('assinatura')">Ver plano completo</button>
      </div>
    </section>
  `;
}

function renderConfig() {
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
        </div>
      </div>

      <div class="danger-zone">
        <h2 class="section-title">Google Drive Desktop</h2>
        <p class="muted">Use uma pasta dentro do Google Drive instalado no Windows. O navegador grava o arquivo abaixo nessa pasta e o Google Drive sincroniza com a nuvem.</p>
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
            <input id="usuarioLoginEmail" type="email" value="${escaparAttr(usuarioAtualEmail)}" placeholder="seu@email.com">
          </label>
          <label class="field">
            <span>Senha do usuário</span>
            <input id="usuarioLoginSenha" type="password" placeholder="Senha cadastrada">
          </label>
        </div>
        <div class="actions">
          <button class="btn" onclick="loginUsuario()">Entrar por e-mail</button>
          ${usuarioAtual ? `<button class="btn ghost" onclick="logoutUsuario()">Sair do usuário</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Ver plano</button>`}
        </div>

        <div class="danger-zone">
          <h2 class="section-title">Acesso local</h2>
          <p class="muted">Use para configurar o dono no seu aparelho ou fazer manutenção rápida.</p>
          <label class="field">
            <span>Senha do admin local</span>
            <input id="adminSenha" type="password" placeholder="Digite a senha">
          </label>
          <button class="btn secondary" onclick="loginAdmin()">Entrar com senha 123</button>
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
  const podeCriarDono = isDono() || (adminLogado && !usuarioAtual);

  return `
    <section class="card">
      <div class="card-header">
        <h2>🔐 Admin</h2>
        <button class="icon-button" onclick="logoutAdmin()" title="Sair">↩</button>
      </div>
      <p class="muted">Logado como ${escaparHtml(perfilAtual)}. Dono tem acesso completo sem assinatura; admins gerenciam configurações e usuários do cliente.</p>

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
        <h2 class="section-title">Dono e usuários</h2>
        <p class="muted">Salve seu e-mail como dono para liberar todas as funções no seu aparelho. Para cliente, crie um admin e operadores separados.</p>
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
            <span>Senha</span>
            <input id="novoUsuarioSenha" type="password" placeholder="Senha de acesso">
          </label>
          <label class="field">
            <span>Função</span>
            <select id="novoUsuarioPapel">
              ${podeCriarDono ? `<option value="dono">Dono</option>` : ""}
              <option value="admin">Admin</option>
              <option value="operador" selected>Operador</option>
            </select>
          </label>
        </div>
        <button class="btn secondary" onclick="adicionarUsuario()">Adicionar usuário</button>
        ${renderUsuariosAdmin()}
      </div>

      <div class="danger-zone">
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
            <input id="monthlyPriceAdmin" type="number" min="0" step="0.01" value="${Number(billingConfig.monthlyPrice) || 10}">
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
          <span>Link Windows .exe</span>
          <input id="windowsDownloadUrlAdmin" value="${escaparAttr(billingConfig.windowsDownloadUrl)}" placeholder="https://.../ERP3D-Setup.exe">
        </label>
        <div class="actions">
          <button class="btn" onclick="salvarConfigComercial()">Salvar comercial</button>
          <button class="btn secondary" onclick="ativarLicencaLocal()">Ativar completo local</button>
          <button class="btn ghost" onclick="voltarParaGratis()">Voltar para grátis</button>
        </div>
      </div>

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
            <span class="muted">${escaparHtml(usuario.email)}</span>
          </div>
          <span class="status-badge">${escaparHtml(usuario.papel)}</span>
          <button class="icon-button danger" onclick="removerUsuario('${escaparAttr(usuario.id)}')" title="Remover">×</button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPersonalizacao() {
  const corAtual = appConfig.accentColor || "#00a86b";
  const resolucaoAtual = `${window.innerWidth || 0} x ${window.innerHeight || 0}`;
  const acessoMarca = temAcessoCompleto();
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
            <strong>${acessoMarca ? (appConfig.brandLogoDataUrl ? "Logo salva" : "Plano completo") : "Bloqueado"}</strong>
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
  const preco = Number(billingConfig.monthlyPrice) || 10;
  const diasTeste = Number(billingConfig.trialDays) || 7;
  const temLinkPagamento = !!billingConfig.mercadoPagoLink;
  const downloadAndroid = billingConfig.androidDownloadUrl;
  const downloadWindows = billingConfig.windowsDownloadUrl;

  return `
    <section class="card">
      <div class="card-header">
        <h2>💳 Planos</h2>
        <span class="status-badge">${escaparHtml(plano.nome)}</span>
      </div>
      <p class="muted">${escaparHtml(plano.descricao)}. O modo grátis mantém a calculadora liberada; o plano completo libera pedidos, estoque, caixa, PDF, WhatsApp, backup e admin.</p>

      <div class="admin-grid">
        <div class="plan-card">
          <div class="row-title">
            <strong>Grátis</strong>
            <span class="muted">R$ 0</span>
          </div>
          <p class="muted">Calculadora de impressão 3D liberada para testar preço de peças.</p>
          <button class="btn secondary" onclick="abrirCalculadora()">Usar calculadora</button>
        </div>
        <div class="plan-card featured">
          <div class="row-title">
            <strong>Completo</strong>
            <span class="muted">${formatarMoeda(preco)}/mês</span>
          </div>
          <p class="muted">${diasTeste} dias grátis, depois assinatura mensal. Libera o ERP inteiro.</p>
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
          <span>E-mail</span>
          <strong>${billingConfig.licenseEmail ? escaparHtml(billingConfig.licenseEmail) : "Não informado"}</strong>
        </div>
      </div>

      <label class="field">
        <span>E-mail do assinante</span>
        <input id="licenseEmailInput" value="${escaparAttr(billingConfig.licenseEmail)}" placeholder="cliente@email.com">
      </label>
      <button class="btn ghost" onclick="salvarEmailLicenca()">Salvar e-mail</button>

      <div class="danger-zone">
        <h2 class="section-title">Baixar aplicativo</h2>
        <div class="actions">
          <button class="btn ghost" onclick="abrirDownload('android')" ${downloadAndroid ? "" : "disabled"}>Android APK</button>
          <button class="btn ghost" onclick="abrirDownload('windows')" ${downloadWindows ? "" : "disabled"}>Windows .exe</button>
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

  if (!billingConfig.trialStartedAt) {
    billingConfig.trialStartedAt = new Date().toISOString();
    billingConfig.licenseStatus = "trial";
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
  billingConfig.licenseEmail = (document.getElementById("licenseEmailInput")?.value || "").trim();
  salvarDados();
  registrarHistorico("Assinatura", "E-mail de licença atualizado");
  renderApp();
}

function abrirDownload(tipo) {
  const url = tipo === "android" ? billingConfig.androidDownloadUrl : billingConfig.windowsDownloadUrl;
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

function loginAdmin() {
  const senha = document.getElementById("adminSenha")?.value || "";
  if (senha !== "123") {
    alert("Senha incorreta");
    return;
  }

  if (precisa2FA()) {
    iniciarVerificacao2FA("admin");
    return;
  }

  concluirLoginAdmin();
}

function concluirLoginAdmin() {
  adminLogado = true;
  usuarioAtualEmail = "";
  sessionStorage.setItem("adminLogado", "sim");
  sessionStorage.removeItem("usuarioAtualEmail");
  registrarHistorico("Admin", "Login realizado");
  renderApp();
}

function logoutAdmin() {
  adminLogado = false;
  usuarioAtualEmail = "";
  sessionStorage.removeItem("adminLogado");
  sessionStorage.removeItem("usuarioAtualEmail");
  renderApp();
}

function loginUsuario() {
  const email = normalizarEmail(document.getElementById("usuarioLoginEmail")?.value || "");
  const senha = document.getElementById("usuarioLoginSenha")?.value || "";
  usuarios = normalizarUsuarios(usuarios);

  const usuario = usuarios.find((item) => item.email === email && item.ativo);
  if (!usuario || usuario.senha !== senha) {
    alert("E-mail ou senha incorretos.");
    return;
  }

  if (precisa2FA(usuario)) {
    iniciarVerificacao2FA("usuario", usuario);
    return;
  }

  concluirLoginUsuario(usuario);
}

function concluirLoginUsuario(usuario) {
  usuarioAtualEmail = usuario.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  registrarHistorico("Usuário", `Login de ${usuario.nome}`);
  renderApp();
}

function logoutUsuario() {
  usuarioAtualEmail = "";
  adminLogado = false;
  sessionStorage.removeItem("usuarioAtualEmail");
  sessionStorage.removeItem("adminLogado");
  renderApp();
}

function salvarDonoSistema() {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como dono ou admin para salvar o dono.");
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
  usuarioAtualEmail = usuarioDono.email;
  sessionStorage.setItem("usuarioAtualEmail", usuarioAtualEmail);
  adminLogado = false;
  sessionStorage.removeItem("adminLogado");
  salvarDados();
  registrarHistorico("Dono", `Dono salvo: ${email}`);
  renderApp();
}

function loginComoDono() {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como admin para usar esta ação.");
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

function adicionarUsuario() {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como dono ou admin para adicionar usuários.");
    return;
  }

  const nome = (document.getElementById("novoUsuarioNome")?.value || "").trim();
  const email = normalizarEmail(document.getElementById("novoUsuarioEmail")?.value || "");
  const senha = document.getElementById("novoUsuarioSenha")?.value || "";
  const papel = normalizarPapel(document.getElementById("novoUsuarioPapel")?.value || "operador");
  const podeCriarDono = isDono() || (adminLogado && !getUsuarioAtual());

  if (!email || !senha) {
    alert("Informe e-mail e senha do usuário.");
    return;
  }

  if (papel === "dono" && !podeCriarDono) {
    alert("Somente o dono ou o admin local pode criar outro dono.");
    return;
  }

  usuarios = normalizarUsuarios(usuarios);
  const existente = usuarios.find((usuario) => usuario.email === email);
  if (existente) {
    existente.nome = nome || existente.nome;
    existente.senha = senha;
    existente.papel = papel;
    existente.ativo = true;
  } else {
    usuarios.push({
      id: criarIdUsuario(),
      nome: nome || email.split("@")[0],
      email,
      senha,
      papel,
      ativo: true,
      criadoEm: new Date().toISOString()
    });
  }

  salvarDados();
  registrarHistorico("Usuários", `Usuário ${email} salvo como ${papel}`);
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
  renderApp();
}

function salvarConfigComercial() {
  if (!podeGerenciarUsuarios()) {
    alert("Entre como admin para alterar o comercial.");
    return;
  }

  billingConfig = {
    ...billingConfig,
    ownerMode: !!document.getElementById("ownerModeAdmin")?.checked,
    trialDays: Math.max(1, parseFloat(document.getElementById("trialDaysAdmin")?.value) || 7),
    monthlyPrice: Math.max(0, parseFloat(document.getElementById("monthlyPriceAdmin")?.value) || 10),
    mercadoPagoLink: (document.getElementById("mercadoPagoLinkAdmin")?.value || "").trim(),
    androidDownloadUrl: (document.getElementById("androidDownloadUrlAdmin")?.value || "").trim(),
    windowsDownloadUrl: (document.getElementById("windowsDownloadUrlAdmin")?.value || "").trim()
  };

  salvarDados();
  registrarHistorico("Comercial", "Configuração comercial atualizada");
  renderApp();
}

function ativarLicencaLocal() {
  if (!podeGerenciarUsuarios()) {
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
  if (!podeGerenciarUsuarios()) {
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
  const autoBackupInterval = Math.max(1, parseFloat(document.getElementById("autoBackupInterval")?.value || syncConfig.autoBackupInterval || 5) || 5);
  return {
    cloudUrl: (document.getElementById("syncCloudUrl")?.value || syncConfig.cloudUrl || "").trim(),
    token: (document.getElementById("syncToken")?.value || syncConfig.token || "").trim(),
    deviceName: (document.getElementById("syncDeviceName")?.value || syncConfig.deviceName || "").trim(),
    driveFileName: arquivoDrive.endsWith(".json") ? arquivoDrive : arquivoDrive + ".json",
    autoBackupEnabled: autoBackupEnabledEl ? autoBackupEnabledEl.checked : !!syncConfig.autoBackupEnabled,
    autoBackupInterval,
    autoBackupTarget: document.getElementById("autoBackupTarget")?.value || syncConfig.autoBackupTarget || "drive"
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
      historico,
      diagnostics,
      sugestoes,
      usuarios: normalizarUsuarios(usuarios),
      appConfig,
      billingConfig,
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
    historico: Array.isArray(origem.historico) ? origem.historico : [],
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
    historico = mesclarListas(historico, backup.historico).slice(0, 250);
    diagnostics = mesclarListas(diagnostics, backup.diagnostics).slice(0, 150);
    sugestoes = mesclarListas(sugestoes, backup.sugestoes).slice(0, 100);
    usuarios = mesclarUsuarios(usuarios, backup.usuarios);
  } else {
    estoque = backup.estoque;
    caixa = backup.caixa;
    pedidos = backup.pedidos;
    historico = backup.historico.slice(0, 250);
    diagnostics = backup.diagnostics.slice(0, 150);
    sugestoes = backup.sugestoes.slice(0, 100);
    usuarios = backup.usuarios.length ? normalizarUsuarios(backup.usuarios) : normalizarUsuarios(usuarios);
  }

  appConfig = {
    ...appConfig,
    ...backup.appConfig
  };

  billingConfig = {
    ...billingConfig,
    ...backup.billingConfig
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

function validarUrlNuvem() {
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
  syncConfig = {
    ...syncConfig,
    ...lerConfigSyncCampos()
  };
  salvarDados();
}

async function escolherPastaDrive() {
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
    if (syncConfig.autoBackupTarget === "url") {
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
  const pedido = {
    id: pedidoEditando?.id || Date.now(),
    cliente,
    itens: JSON.parse(JSON.stringify(itensPedido)),
    total,
    data: new Date().toLocaleDateString("pt-BR")
  };

  if (pedidoEditando) {
    const idAntigo = Number(pedidoEditando.id);
    pedidos = pedidos.filter((item) => Number(item.id) !== idAntigo);
    caixa = caixa.filter((movimento) => Number(movimento.pedidoId) !== idAntigo);
  }

  pedidos.push(pedido);
  caixa.push({
    id: Date.now() + 1,
    tipo: "entrada",
    valor: total,
    descricao: "Pedido - " + cliente,
    pedidoId: pedido.id,
    data: new Date().toISOString()
  });

  salvarDados();
  registrarHistorico("Pedido", (pedidoEditando ? "Pedido atualizado: " : "Pedido fechado: ") + cliente);
  pedidoEditando = null;
  itensPedido = [];
  clientePedido = "";
  telaAtual = isMobile() ? "pedidos" : telaAtual;
  renderApp();
}

function addMaterial() {
  if (!exigirPlanoCompleto()) return;
  const nome = document.getElementById("matTipo")?.value;
  const qtd = parseFloat(document.getElementById("matQtd")?.value) || 0;

  if (!nome || qtd <= 0) {
    alert("Quantidade inválida");
    return;
  }

  const existente = estoque.find((material) => material.nome === nome);
  if (existente) {
    existente.qtd = (Number(existente.qtd) || 0) + qtd;
  } else {
    estoque.push({ id: Date.now(), nome, qtd });
  }

  salvarDados();
  registrarHistorico("Estoque", "Material adicionado: " + nome + " (" + qtd + " kg)");
  renderApp();
}

function editarMaterial(i) {
  if (!exigirPlanoCompleto()) return;
  const material = estoque[i];
  if (!material) return;

  const nome = prompt("Nome do material:", material.nome);
  const qtd = prompt("Quantidade em kg:", material.qtd);

  if (nome !== null && nome.trim()) {
    material.nome = nome.trim();
  }

  if (qtd !== null) {
    material.qtd = parseFloat(qtd) || 0;
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

  caixa.push({
    id: Date.now(),
    tipo,
    valor,
    descricao: descricao || "Movimento manual",
    data: new Date().toISOString()
  });

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
    <label class="field">
      <span>Impressora</span>
      <select id="printer"></select>
    </label>

    <div class="calc-grid">
      <label class="field">
        <span>Peso em gramas</span>
        <input id="peso" type="number" min="0" step="0.01" placeholder="Ex.: 80">
      </label>
      <label class="field">
        <span>Filamento R$/kg</span>
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
    </div>

    <label class="field">
      <span>Nome do item</span>
      <input id="nomeItem" placeholder="Ex.: suporte personalizado">
    </label>

    <button class="btn secondary" onclick="calcular()">Calcular</button>
    <div id="res" class="result-box">Preencha os dados e calcule o valor do item.</div>

    <div class="actions">
      <button class="btn" onclick="adicionarItem()">Adicionar ao pedido</button>
      <button class="btn ghost" onclick="minimizarCalculadora()">Minimizar</button>
    </div>
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

  select.innerHTML = "";
  Object.keys(printers).forEach((nome) => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });

  select.onchange = function () {
    const impressora = printers[this.value];
    document.getElementById("consumo").value = impressora.consumo;
    document.getElementById("custoHora").value = impressora.custo;
  };

  select.dispatchEvent(new Event("change"));
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

  const material = (peso / 1000) * filamento;
  const energiaC = (consumo / 1000) * tempo * energia;
  const maquina = tempo * custoHora;
  const custo = material + energiaC + maquina;
  const preco = custo * (1 + margem / 100);

  ultimoCalculo = {
    preco: preco / qtd,
    custo: custo / qtd
  };

  document.getElementById("res").innerHTML = `
    Custo mínimo: <strong>${formatarMoeda(custo / qtd)}</strong><br>
    Preço sugerido: <strong>${formatarMoeda(preco / qtd)}</strong>
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
    nome,
    qtd,
    valor: ultimoCalculo.preco,
    total: ultimoCalculo.preco * qtd
  });

  minimizarCalculadora();
  trocarTela("pedido");
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

function adicionarMarcaPdf(doc, largura, altura) {
  if (!temAcessoCompleto() || !appConfig.brandLogoDataUrl) return;

  try {
    const tipo = tipoImagemDataUrl(appConfig.brandLogoDataUrl);
    if (appConfig.brandWatermarkEnabled !== false && doc.GState && doc.setGState) {
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.addImage(appConfig.brandLogoDataUrl, tipo, largura / 2 - 36, altura / 2 - 36, 72, 72);
      doc.setGState(new doc.GState({ opacity: 1 }));
    }
  } catch (erro) {
    try {
      doc.addImage(appConfig.brandLogoDataUrl, tipoImagemDataUrl(appConfig.brandLogoDataUrl), largura / 2 - 28, altura / 2 - 28, 56, 56);
    } catch (_) {}
  }
}

function gerarPDF() {
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

  adicionarMarcaPdf(doc, largura, altura);

  doc.setFillColor(corRgb[0], corRgb[1], corRgb[2]);
  doc.rect(0, 0, largura, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(empresa, margem, 14);
  doc.setFontSize(10);
  doc.text("Pedido #" + pedidoId, margem, 23);
  doc.text(data, largura - margem, 23, { align: "right" });

  if (temAcessoCompleto() && appConfig.brandLogoDataUrl) {
    try {
      doc.addImage(appConfig.brandLogoDataUrl, tipoImagemDataUrl(appConfig.brandLogoDataUrl), largura - 32, 6, 18, 18);
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
      adicionarMarcaPdf(doc, largura, altura);
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
      adicionarMarcaPdf(doc, largura, altura);
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
  doc.save(`pedido-${cliente.replace(/\s+/g, "-").toLowerCase()}.pdf`);
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
