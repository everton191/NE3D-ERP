(function initPrinterMonitoringService(global) {
  "use strict";

  const STATUSES = Object.freeze({
    idle: { label: "Ociosa", tone: "neutral" },
    printing: { label: "Imprimindo", tone: "success" },
    paused: { label: "Pausada", tone: "warning" },
    finished: { label: "Finalizada", tone: "success" },
    error: { label: "Erro", tone: "danger" },
    offline: { label: "Offline", tone: "muted" },
    unknown: { label: "Desconhecido", tone: "muted" },
    maintenance: { label: "Manutenção", tone: "warning" }
  });

  const CONNECTORS = Object.freeze([
    { key: "manual", name: "Manual", automatic: false, modes: ["manual"] },
    { key: "octoprint", name: "OctoPrint", automatic: true, modes: ["browser_local", "local_agent", "cloud_supported"] },
    { key: "moonraker", name: "Klipper / Moonraker", automatic: true, modes: ["browser_local", "local_agent", "cloud_supported"] },
    { key: "prusalink", name: "PrusaLink", automatic: true, modes: ["browser_local", "local_agent", "cloud_supported"] },
    { key: "bambu", name: "Bambu Lab", automatic: true, modes: ["local_agent", "cloud_supported"] }
  ]);

  const BRANDS = Object.freeze([
    { slug: "creality", name: "Creality", models: ["Ender 3", "Ender 3 S1", "K1"], connectors: ["manual", "octoprint", "moonraker"] },
    { slug: "bambu-lab", name: "Bambu Lab", models: ["A1", "P1P", "X1 Carbon"], connectors: ["manual", "bambu"] },
    { slug: "prusa", name: "Prusa", models: ["MK4", "MK3S+"], connectors: ["manual", "prusalink", "octoprint"] },
    { slug: "voron", name: "Voron", models: ["2.4"], connectors: ["manual", "moonraker"] },
    { slug: "anycubic", name: "Anycubic", models: ["Kobra", "Photon"], connectors: ["manual", "octoprint", "moonraker"] },
    { slug: "elegoo", name: "Elegoo", models: ["Neptune 4", "Mars", "Saturn"], connectors: ["manual", "octoprint", "moonraker"] },
    { slug: "outra", name: "Outra", models: [], connectors: ["manual", "octoprint", "moonraker"] }
  ]);

  function status(value) {
    return STATUSES[String(value || "").toLowerCase()] || STATUSES.unknown;
  }

  function connector(value) {
    return CONNECTORS.find((item) => item.key === String(value || "").toLowerCase()) || CONNECTORS[0];
  }

  function brand(value) {
    const key = String(value || "").toLowerCase();
    return BRANDS.find((item) => item.slug === key || item.name.toLowerCase() === key) || BRANDS[BRANDS.length - 1];
  }

  function suggestedConnectors(brandValue) {
    const selected = brand(brandValue);
    return selected.connectors.map((key) => connector(key));
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    if (!total) return "Não informado";
    const hours = Math.floor(total / 3600);
    const minutes = Math.ceil((total % 3600) / 60);
    if (hours && minutes) return `${hours}h ${minutes}min`;
    if (hours) return `${hours}h`;
    return `${minutes}min`;
  }

  function calculateCosts(printer, durationMinutes, kwhPrice) {
    const hours = Math.max(0, Number(durationMinutes) || 0) / 60;
    const hourlyCost = Math.max(0, Number(printer?.hourly_cost) || 0);
    const powerWatts = Math.max(0, Number(printer?.power_watts) || 0);
    const energyRate = Math.max(0, Number(kwhPrice) || 0);
    const machine = hours * hourlyCost;
    const energy = (powerWatts / 1000) * hours * energyRate;
    return { hours, machine, energy, total: machine + energy };
  }

  function errorMessage(code) {
    const messages = {
      UNAUTHENTICATED: "Entre novamente para acessar as impressoras.",
      COMPANY_NOT_LINKED: "A conta ainda não está vinculada a uma empresa.",
      COMPANY_ACCESS_DENIED: "Seu usuário não pertence a esta empresa.",
      SUBSCRIPTION_INACTIVE: "Regularize o plano para continuar.",
      ROLE_BLOCKED: "Seu perfil não pode executar esta ação.",
      AUTOMATIC_CONNECTOR_REQUIRES_PRO: "Atualize o aplicativo: a conexão automática agora também está disponível no Free.",
      AUTOMATIC_PRINTER_LIMIT_REACHED: "O limite de impressoras automáticas do plano foi atingido. Impressoras manuais continuam ilimitadas.",
      PRINTER_LIMIT_REACHED: "O limite de impressoras automáticas do plano foi atingido.",
      LOCAL_NETWORK_REQUIRES_AGENT: "Endereços da rede local precisam do Simplifica Local Agent.",
      STATUS_IS_RECEIVED_FROM_LOCAL_AGENT: "O status desta impressora é recebido pelo agente local.",
      BROWSER_LOCAL_TEST_REQUIRED: "Teste esta conexão no mesmo navegador e rede da impressora.",
      BROWSER_LOCAL_CORS_BLOCKED: "O navegador bloqueou a leitura local. Use o Simplifica Local Agent.",
      CONNECTOR_UNAUTHORIZED: "Credencial rejeitada pela impressora.",
      CONNECTOR_TIMEOUT: "A impressora não respondeu dentro do tempo esperado.",
      BAMBU_AUTHORIZED_GATEWAY_REQUIRED: "A Bambu exige um gateway HTTPS compatível e autorizado.",
      BAMBU_LOGIN_FIELDS_REQUIRED: "Informe o e-mail e a senha da conta Bambu.",
      BAMBU_LOGIN_REJECTED: "A Bambu recusou o login. Confira os dados ou use o código de verificação.",
      BAMBU_LOGIN_TIMEOUT: "A Bambu demorou demais para responder. Tente novamente.",
      BAMBU_SERVICE_UNAVAILABLE: "O serviço comunitário de conexão Bambu está indisponível no momento.",
      BAMBU_VERIFICATION_CODE_REQUIRED: "A Bambu solicitou um código de verificação. Informe o código recebido e continue.",
      BAMBU_NO_PRINTERS_FOUND: "A conta foi conectada, mas nenhuma impressora vinculada foi encontrada.",
      BAMBU_ACCOUNT_NOT_CONNECTED: "Conecte a conta Bambu antes de selecionar uma impressora.",
      BAMBU_DEVICE_NOT_FOUND: "A impressora selecionada não foi encontrada nessa conta Bambu.",
      BAMBU_PRINTER_REQUIRED: "Este login só pode ser usado em uma impressora Bambu.",
      PRINTER_CREDENTIALS_SECRET_NOT_CONFIGURED: "A criptografia de credenciais ainda não foi configurada no servidor.",
      PRINTER_NAME_REQUIRED: "Informe um nome para a impressora.",
      INVALID_CONNECTOR: "O tipo de conexão selecionado não é válido.",
      INVALID_CONNECTION_MODE: "O modo de conexão selecionado não é válido.",
      HOST_REQUIRED: "Informe o IP ou endereço da impressora.",
      LOCAL_AGENT_NOT_FOUND: "Selecione um Agente Local ativo.",
      BACKEND_NOT_CONFIGURED: "O serviço de impressoras ainda não está configurado.",
      ACTION_NOT_ALLOWED: "Ação não permitida nesta versão somente leitura."
    };
    return messages[String(code || "")] || String(code || "Não foi possível concluir a operação.");
  }

  async function request(config, action, payload = {}) {
    const url = String(config?.url || "").replace(/\/+$/, "");
    const token = String(config?.accessToken || "");
    const anonKey = String(config?.anonKey || "");
    if (!url || !token) throw new Error("UNAUTHENTICATED");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const result = await fetch(`${url}/functions/v1/printer-monitor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action, ...payload }),
        signal: controller.signal
      });
      const data = await result.json().catch(() => ({}));
      if (!result.ok || data?.ok === false) throw new Error(data?.error || `HTTP_${result.status}`);
      return data?.data;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("CONNECTOR_TIMEOUT");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function localBaseUrl(config = {}) {
    const host = String(config.host || "").trim();
    if (!host) throw new Error("HOST_REQUIRED");
    const url = new URL(/^https?:\/\//i.test(host) ? host : `http://${host}`);
    if (config.port && !url.port) url.port = String(config.port);
    return url.toString().replace(/\/+$/, "");
  }

  async function localRead(url, headers = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", ...headers },
        signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) throw new Error("CONNECTOR_UNAUTHORIZED");
      if (!response.ok) throw new Error(`CONNECTOR_HTTP_${response.status}`);
      return response.json();
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("CONNECTOR_TIMEOUT");
      if (error instanceof TypeError) throw new Error("BROWSER_LOCAL_CORS_BLOCKED");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function testBrowserLocal(config = {}) {
    const root = localBaseUrl(config);
    const type = String(config.connectorType || "").toLowerCase();
    if (type === "octoprint") {
      const data = await localRead(`${root}/api/printer`, config.apiToken ? { "X-Api-Key": config.apiToken } : {});
      return { connected: true, state: data?.state?.text || "unknown" };
    }
    if (type === "moonraker") {
      const data = await localRead(`${root}/printer/objects/query?webhooks&print_stats`, config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {});
      return { connected: true, state: data?.result?.status?.print_stats?.state || data?.result?.status?.webhooks?.state || "unknown" };
    }
    if (type === "prusalink") {
      const headers = {};
      if (config.apiToken) headers.Authorization = `Bearer ${config.apiToken}`;
      else if (config.username || config.password) headers.Authorization = `Basic ${btoa(`${config.username || ""}:${config.password || ""}`)}`;
      const data = await localRead(`${root}/api/v1/status`, headers);
      return { connected: true, state: data?.printer?.state || data?.state || "unknown" };
    }
    throw new Error(type === "bambu" ? "BAMBU_AUTHORIZED_GATEWAY_REQUIRED" : "CONNECTOR_NOT_AUTOMATIC");
  }

  global.PrinterMonitoringService = Object.freeze({
    STATUSES,
    CONNECTORS,
    BRANDS,
    status,
    connector,
    brand,
    suggestedConnectors,
    formatDuration,
    calculateCosts,
    errorMessage,
    request,
    testBrowserLocal
  });
})(window);
