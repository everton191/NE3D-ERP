(function attachAccountSecurity(global) {
  "use strict";





function gerarSaltSenha(context = {}) {
  const { Uint8Array, bytesParaBase64, window } = context;
  const bytes = new Uint8Array(16);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesParaBase64(bytes);
}

async function gerarHashSenha(senha, salt, iterations = 120000, context = {}) {
  const { base64ParaBytes, bytesParaBase64, crypto, cryptoDisponivel, unescape } = context;
  if (salt === undefined) salt = gerarSaltSenha(context);
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

async function verificarHashSenha(senha, hash, context = {}) {
  const { unescape } = context;
  if (!hash) return false;
  if (hash.startsWith("local$")) {
    const partesLocal = hash.split("$");
    return hash === "local$" + partesLocal[1] + "$" + btoa(unescape(encodeURIComponent(partesLocal[1] + ":" + senha)));
  }
  const partes = String(hash).split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") return false;
  const esperado = await gerarHashSenha(senha, partes[2], Number(partes[1]) || 120000, context);
  return esperado === hash;
}

function senhaEhObvia(senha, context = {}) {
  const { removerAcentos } = context;
  const alvo = removerAcentos(String(senha || "").toLowerCase()).replace(/\s+/g, "");
  return ["123456", "12345678", "senha123", "admin123", "admin", "password", "qwerty123", "ne3d123"].includes(alvo);
}

function avaliarForcaSenha(senha, context = {}) {
  const texto = String(senha || "");
  const regras = {
    tamanho: texto.length >= 8,
    maiuscula: /[A-Z]/.test(texto),
    minuscula: /[a-z]/.test(texto),
    numero: /\d/.test(texto),
    especial: /[^A-Za-z0-9]/.test(texto),
    naoObvia: !senhaEhObvia(texto, context)
  };
  const pontos = Object.values(regras).filter(Boolean).length;
  return {
    regras,
    pontos,
    nivel: pontos >= 6 ? "forte" : pontos >= 4 ? "media" : "fraca",
    valida: pontos >= 6
  };
}

function mensagemValidacaoSenha(senha, context = {}) {
  const forca = avaliarForcaSenha(senha, context);
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

function chaveTentativaLogin(email, context = {}) {
  const { normalizarEmail } = context;
  return normalizarEmail(email || "admin-local") || "visitante";
}

function getTentativaLogin(email, context = {}) {
  const { LOGIN_MAX_ATTEMPTS, loginAttempts } = context;
  const chave = chaveTentativaLogin(email, context);
  const atual = loginAttempts[chave] || { count: 0, lockedUntil: 0 };
  if ((Number(atual.lockedUntil) || 0) < Date.now()) {
    atual.lockedUntil = 0;
    if ((Number(atual.count) || 0) >= LOGIN_MAX_ATTEMPTS) atual.count = 0;
  }
  loginAttempts[chave] = atual;
  return atual;
}

function loginEstaBloqueado(email, context = {}) {
  const { alert } = context;
  const tentativa = getTentativaLogin(email, context);
  const ate = Number(tentativa.lockedUntil) || 0;
  if (ate > Date.now()) {
    const minutos = Math.ceil((ate - Date.now()) / 60000);
    alert(`Muitas tentativas incorretas. Tente novamente em ${minutos} minuto(s).`);
    return true;
  }
  return false;
}

function registrarFalhaLogin(email, motivo = "Usuário ou senha inválidos", context = {}) {
  const { LOGIN_LOCK_MS, LOGIN_MAX_ATTEMPTS, loginAttempts, registrarSeguranca, salvarDados } = context;
  const chave = chaveTentativaLogin(email, context);
  const tentativa = getTentativaLogin(chave, context);
  tentativa.count = (Number(tentativa.count) || 0) + 1;
  tentativa.lastFailureAt = new Date().toISOString();
  if (tentativa.count >= LOGIN_MAX_ATTEMPTS) {
    tentativa.lockedUntil = Date.now() + LOGIN_LOCK_MS;
  }
  loginAttempts[chave] = tentativa;
  salvarDados();
  registrarSeguranca("Falha de login", "erro", motivo, email);
}

function limparFalhasLogin(email, context = {}) {
  const { loginAttempts, salvarDados } = context;
  delete loginAttempts[chaveTentativaLogin(email, context)];
  salvarDados();
}

async function definirSenhaUsuario(usuario, senha, temporaria = false, context = {}) {
  usuario.passwordHash = await gerarHashSenha(senha, undefined, undefined, context);
  usuario.senha = "";
  usuario.mustChangePassword = !!temporaria;
  usuario.senhaTemporaria = !!temporaria;
  usuario.passwordUpdatedAt = temporaria ? "" : new Date().toISOString();
  usuario.atualizadoEm = new Date().toISOString();
}

async function verificarSenhaUsuario(usuario, senha, context = {}) {
  const { salvarDados } = context;
  if (!usuario) return false;
  if (usuario.passwordHash && await verificarHashSenha(senha, usuario.passwordHash, context)) return true;
  if (usuario.senha && usuario.senha === senha) {
    await definirSenhaUsuario(usuario, senha, usuario.senhaTemporaria || usuario.mustChangePassword, context);
    salvarDados();
    return true;
  }
  return false;
}


function focarCampoSenha(inputOrId, selecionar = false, context = {}) {
  const { document, requestAnimationFrame } = context;
  const input = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
  if (!input) return;
  const aplicarFoco = () => {
    try {
      input.focus({ preventScroll: true });
    } catch (_) {
      input.focus();
    }
    if (selecionar) {
      try { input.select(); } catch (_) {}
    }
  };
  requestAnimationFrame(() => {
    aplicarFoco();
    setTimeout(aplicarFoco, 80);
  });
}

async function validarSenhaLocalUsuarioAtual(senha, context = {}) {
  const { getUsuarioAtual, registrarDiagnostico, verificarSenhaUsuario } = context;
  const usuario = getUsuarioAtual();
  if (!usuario || !senha) return false;
  try {
    return await verificarSenhaUsuario(usuario, senha);
  } catch (erro) {
    registrarDiagnostico("Auth", "Fallback local de senha falhou", erro.message, { silent: true });
    return false;
  }
}

async function validarSenhaContaAtual(senha, { preferRemote = true, allowLocalFallback = true } = {}, context = {}) {
  const { estaOnline, getUsuarioAtual, loginUsuarioSupabase, normalizarEmail, registrarDiagnostico, syncConfig, usuarioAtualEmail } = context;
  if (!senha) return { ok: false, source: "", reason: "empty" };
  const usuario = getUsuarioAtual();
  const email = normalizarEmail(usuario?.email || usuarioAtualEmail || syncConfig.supabaseEmail || "");
  const podeValidarRemoto = !!(email && syncConfig.supabaseUrl && syncConfig.supabaseAnonKey && estaOnline());

  if (preferRemote && podeValidarRemoto) {
    try {
      const remoto = await loginUsuarioSupabase(email, senha);
      if (!syncConfig.supabaseUserId || String(remoto?.id || "") === String(syncConfig.supabaseUserId || "")) {
        return { ok: true, source: "supabase" };
      }
    } catch (erro) {
      registrarDiagnostico("Auth", "Senha remota não validada, tentando fallback local", erro.message, { silent: true });
    }
  }

  if (allowLocalFallback && await validarSenhaLocalUsuarioAtual(senha, context)) {
    return { ok: true, source: "local" };
  }

  if (!podeValidarRemoto && !allowLocalFallback) return { ok: false, source: "", reason: "offline" };
  return { ok: false, source: "", reason: podeValidarRemoto ? "invalid" : "offline" };
}

async function concluirDesbloqueioLocalComSenha(senha, context = {}) {
  const { ErrorService, consultarLicencaSupabaseSilencioso, desativarTravaLocal, estaOnline, fecharPopup, mostrarToast, registrarDiagnostico, renderApp, sincronizarFilaOfflinePendente, window } = context;
  if (!window.__simplificaLocalLockActive) return true;
  if (!senha) return false;
  try {
    const validacao = await validarSenhaContaAtual(senha, { preferRemote: true, allowLocalFallback: true }, context);
    if (!validacao.ok) {
      if (validacao.reason === "offline") mostrarToast("Sem conexão agora. Se esta senha já foi validada neste aparelho, tente novamente.", "aviso", 6500);
      return false;
    }
    if (estaOnline()) await consultarLicencaSupabaseSilencioso().catch((erro) => registrarDiagnostico("Supabase", "Licença após desbloqueio falhou", erro.message));
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


function mensagemErroSegurancaConta(codigo = "", context = {}) {
  return ({
    EMAIL_DELIVERY_FAILED: "Não foi possível enviar o código por e-mail.",
    RESEND_TOO_SOON: "Aguarde 60 segundos antes de solicitar outro código.",
    INVALID_OR_EXPIRED_CODE: "Código inválido ou expirado.",
    CODE_EXPIRED: "Código expirado.",
    TOO_MANY_ATTEMPTS: "Muitas tentativas. Solicite um novo código.",
    OWNER_REQUIRED: "Somente o proprietário pode realizar esta ação.",
    PENDING_DELETION: "Esta ação está bloqueada enquanto a conta aguarda exclusão.",
    UNAUTHENTICATED: "Sua sessão expirou. Entre novamente."
  })[String(codigo || "")] || String(codigo || "Não foi possível concluir a ação.");
}

async function accountSecurityRequest(action, payload = {}, context = {}) {
  const { SUPABASE_DEFAULT_ANON_KEY, SUPABASE_DEFAULT_URL, fetch, normalizarUrlSupabase, syncConfig } = context;
  if (!syncConfig.supabaseAccessToken) throw new Error("UNAUTHENTICATED");
  const resposta = await fetch(`${normalizarUrlSupabase(syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL)}/functions/v1/account-security`, {
    method: "POST",
    headers: {
      apikey: syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY,
      Authorization: `Bearer ${syncConfig.supabaseAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok || data?.ok !== true) throw new Error(data?.error || `HTTP_${resposta.status}`);
  return data.data;
}

function renderVerificacao2FA(context = {}) {
  const { twoFactorPending } = context;
  if (!twoFactorPending) return "";
  return `
    <div class="danger-zone">
      <h2 class="section-title">Verificação em duas etapas</h2>
      <p class="muted">Enviamos um código de segurança para seu e-mail. Digite o código para continuar.</p>
      <label class="field">
        <span>Código recebido</span>
        <input id="twoFactorCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">
      </label>
      <div class="actions">
        <button class="btn" onclick="confirmarCodigo2FA()">Confirmar código</button>
        <button class="btn ghost" onclick="cancelar2FA()">Cancelar</button>
      </div>
    </div>
  `;
}

function abrirModalCodigoSeguranca({ title, action, challenge, reason = "" }, context = {}) {
  const { document, escaparHtml, promoverPopupParaDialogUiV3 } = context;
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card security-code-modal" id="securityCodeForm" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>${escaparHtml(title)}</h2><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>
        <p class="muted">Enviamos um código de 6 dígitos para seu e-mail.</p>
        <label class="field"><span>Código</span><input id="securityActionCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" required></label>
        <div class="actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button><button class="btn" type="submit">Confirmar</button></div>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title });
  document.getElementById("securityCodeForm")?.addEventListener("submit", (event) => confirmarAcaoSegurancaConta(event, { action, challengeId: challenge.id, reason }, context));
  setTimeout(() => document.getElementById("securityActionCode")?.focus(), 80);
}

async function solicitarCodigoSegurancaConta(requestAction, confirmAction, title, reason = "", context = {}) {
  const { mostrarToast } = context;
  try {
    const challenge = await accountSecurityRequest(requestAction, undefined, context);
    abrirModalCodigoSeguranca({ title, action: confirmAction, challenge, reason }, context);
  } catch (erro) {
    mostrarToast(mensagemErroSegurancaConta(erro?.message, context), "erro", 6000);
  }
}

async function confirmarAcaoSegurancaConta(event, { action, challengeId, reason = "" }, context = {}) {
  const { carregarSegurancaConta, document, fecharPopup, getUsuarioAtual, mostrarToast, renderApp, salvarSessaoSupabase, syncConfig } = context;
  event.preventDefault();
  const code = (document.getElementById("securityActionCode")?.value || "").replace(/\D/g, "").slice(0, 6);
  if (code.length !== 6) return mostrarToast("Digite os 6 dígitos do código.", "aviso");
  const button = event.currentTarget?.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    const data = await accountSecurityRequest(action, { challenge_id: challengeId, code, reason }, context);
    if (data?.session) salvarSessaoSupabase(data.session, syncConfig.supabaseEmail || getUsuarioAtual()?.email || "");
    fecharPopup();
    await carregarSegurancaConta(true);
    renderApp();
    const messages = {
      verify_2fa: data?.purpose === "disable_2fa" ? "Autenticação em dois fatores desativada." : "Autenticação em dois fatores ativada com sucesso.",
      confirm_account_deletion: "Conta marcada para exclusão com carência de 15 dias.",
      confirm_cancel_deletion: "A exclusão da conta foi cancelada."
    };
    mostrarToast(messages[action] || "Confirmação concluída.", "sucesso", 6000);
  } catch (erro) {
    mostrarToast(mensagemErroSegurancaConta(erro?.message, context), "erro", 6000);
    if (button) button.disabled = false;
  }
}

function solicitarAtivacao2FAEmail(context = {}) {
  return solicitarCodigoSegurancaConta("request_2fa_enable", "verify_2fa", "Ativar 2FA por e-mail", undefined, context);
}

function solicitarDesativacao2FAEmail(context = {}) {
  return solicitarCodigoSegurancaConta("request_2fa_disable", "verify_2fa", "Desativar 2FA", undefined, context);
}

function solicitarExclusaoConta(context = {}) {
  const { confirm } = context;
  if (!confirm("Solicitar exclusão desta conta? A exclusão permanente será agendada para 15 dias.")) return;
  return solicitarCodigoSegurancaConta("request_account_deletion", "confirm_account_deletion", "Confirmar exclusão da conta", undefined, context);
}

function cancelarExclusaoConta(context = {}) {
  return solicitarCodigoSegurancaConta("request_cancel_deletion", "confirm_cancel_deletion", "Cancelar exclusão da conta", undefined, context);
}

async function exportarDadosContaSeguro(context = {}) {
  const { Blob, document, hojeIsoData, mostrarToast } = context;
  try {
    const data = await accountSecurityRequest("export_account_data", undefined, context);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `simplifica-conta-${hojeIsoData()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    mostrarToast("Dados da conta exportados.", "sucesso");
  } catch (erro) {
    mostrarToast(mensagemErroSegurancaConta(erro?.message, context), "erro", 6000);
  }
}

function contaPendenteExclusao(context = {}) {
  const { accountSecurityState } = context;
  return accountSecurityState.company?.deletion_status === "pending_deletion" || accountSecurityState.deletion?.status === "confirmed";
}

function renderAccountDeletionBanner(context = {}) {
  const { accountSecurityState, escaparHtml } = context;
  if (!contaPendenteExclusao(context)) return "";
  const date = accountSecurityState.deletion?.scheduled_delete_at || accountSecurityState.company?.deletion_scheduled_at;
  return `<div class="account-deletion-banner" role="status"><strong>Conta marcada para exclusão${date ? ` em ${escaparHtml(new Date(date).toLocaleDateString("pt-BR"))}` : ""}.</strong><button class="btn secondary" type="button" onclick="cancelarExclusaoConta()">Cancelar exclusão</button></div>`;
}
  const api = Object.freeze({ gerarSaltSenha, gerarHashSenha, verificarHashSenha, senhaEhObvia, avaliarForcaSenha, mensagemValidacaoSenha, chaveTentativaLogin, getTentativaLogin, loginEstaBloqueado, registrarFalhaLogin, limparFalhasLogin, definirSenhaUsuario, verificarSenhaUsuario, focarCampoSenha, validarSenhaLocalUsuarioAtual, validarSenhaContaAtual, concluirDesbloqueioLocalComSenha, mensagemErroSegurancaConta, accountSecurityRequest, renderVerificacao2FA, abrirModalCodigoSeguranca, solicitarCodigoSegurancaConta, confirmarAcaoSegurancaConta, solicitarAtivacao2FAEmail, solicitarDesativacao2FAEmail, solicitarExclusaoConta, cancelarExclusaoConta, exportarDadosContaSeguro, contaPendenteExclusao, renderAccountDeletionBanner });
  global.SimplificaAccountSecurity = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
