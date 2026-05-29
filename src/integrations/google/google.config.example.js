(function (global) {
  "use strict";

  const GOOGLE_FEATURE_FLAGS = Object.freeze({
    google_integrations_enabled: false,
    google_auth_enabled: false,
    google_calendar_enabled: false,
    google_drive_enabled: false,
    google_gmail_enabled: false,
    google_sheets_enabled: false
  });

  const GOOGLE_ENV_KEYS = Object.freeze([
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "GOOGLE_ENCRYPTION_KEY"
  ]);

  const GOOGLE_INTEGRATION_CONFIG = Object.freeze({
    provider: "google",
    status: "disabled",
    enabled: false,
    flags: GOOGLE_FEATURE_FLAGS,
    envKeys: GOOGLE_ENV_KEYS,
    scopes: Object.freeze({
      auth: Object.freeze([]),
      calendar: Object.freeze([]),
      drive: Object.freeze([]),
      gmail: Object.freeze([]),
      sheets: Object.freeze([])
    })
  });

  const api = {
    GOOGLE_ENV_KEYS,
    GOOGLE_FEATURE_FLAGS,
    GOOGLE_INTEGRATION_CONFIG
  };

  global.SimplificaGoogleIntegrationConfig = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
