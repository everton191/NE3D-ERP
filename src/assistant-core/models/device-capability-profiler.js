(function attachDeviceCapabilityProfiler(global) {
  "use strict";
  class DeviceCapabilityProfiler {
    constructor({ nativePlugin = null, webProvider = null } = {}) { this.nativePlugin = nativePlugin; this.webProvider = webProvider; }
    async profile() {
      if (this.nativePlugin?.profileDevice) { const [profile, status] = await Promise.all([this.nativePlugin.profileDevice(), this.nativePlugin.status()]); return { platform: "android", ...profile, compatible: status.compatible === true, modelReady: status.modelReady === true, state: status.state, reason: status.incompatibilityReason || "" }; }
      if (this.nativePlugin?.status) { const status = await this.nativePlugin.status(); return { platform: "android", conclusive: false, conservative: true, compatible: status.compatible === true, modelReady: status.modelReady === true, state: status.state, backendPolicy: status.backendPolicy, reason: status.incompatibilityReason || "" }; }
      if (this.webProvider?.profile) { const profile = await this.webProvider.profile(); return { platform: "web", conclusive: profile.adapterAvailable === true && profile.storageQuota > 0, compatible: profile.adapterAvailable === true, ...profile }; }
      return { platform: "unknown", conclusive: false, compatible: false, reason: "Capacidades não puderam ser verificadas." };
    }
  }
  const api = Object.freeze({ DeviceCapabilityProfiler });
  global.UniversalAssistantDeviceProfiler = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
