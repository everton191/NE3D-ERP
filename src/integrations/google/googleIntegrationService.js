(function (global) {
  "use strict";

  const config = typeof require === "function"
    ? require("./google.config.example.js")
    : global.SimplificaGoogleIntegrationConfig;

  const DISABLED_MESSAGE = "Google integrations are prepared but not enabled.";

  function disabledResponse(action, extra = {}) {
    return {
      ok: false,
      enabled: false,
      provider: "google",
      action,
      status: "disabled",
      reason: "GOOGLE_INTEGRATIONS_DISABLED",
      message: DISABLED_MESSAGE,
      ...extra
    };
  }

  function getDefaultGoogleFeatureFlags() {
    return { ...config.GOOGLE_FEATURE_FLAGS };
  }

  function isGoogleIntegrationsEnabled(flags = getDefaultGoogleFeatureFlags()) {
    return flags.google_integrations_enabled === true;
  }

  async function getGoogleIntegrationStatus() {
    return {
      ok: true,
      enabled: false,
      provider: "google",
      status: "disabled",
      flags: getDefaultGoogleFeatureFlags(),
      message: DISABLED_MESSAGE
    };
  }

  async function connectGoogleAccount() {
    return disabledResponse("connectGoogleAccount");
  }

  async function disconnectGoogleAccount() {
    return disabledResponse("disconnectGoogleAccount");
  }

  async function syncGoogleCalendar() {
    return disabledResponse("syncGoogleCalendar");
  }

  async function backupToGoogleDrive() {
    return disabledResponse("backupToGoogleDrive");
  }

  async function sendWithGmail() {
    return disabledResponse("sendWithGmail");
  }

  async function syncGoogleSheets() {
    return disabledResponse("syncGoogleSheets");
  }

  const api = {
    DISABLED_MESSAGE,
    getDefaultGoogleFeatureFlags,
    isGoogleIntegrationsEnabled,
    getGoogleIntegrationStatus,
    connectGoogleAccount,
    disconnectGoogleAccount,
    syncGoogleCalendar,
    backupToGoogleDrive,
    sendWithGmail,
    syncGoogleSheets
  };

  global.SimplificaGoogleIntegrationService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
