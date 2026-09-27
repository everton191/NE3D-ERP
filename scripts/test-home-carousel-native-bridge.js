"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

require(path.join(root, "src/features/home/carousel3d/config/home-carousel-config.js"));
const mountModule = require(path.join(root, "src/features/home/carousel3d/home-carousel-mount.js"));

const mount = read("src/features/home/carousel3d/home-carousel-mount.js");

assert.match(mount, /resolveNativeBridge/, "the mount must detect the native carousel bridge");
assert.match(mount, /Plugins\.SimplificaCarousel3D/, "the native bridge is the SimplificaCarousel3D plugin");
assert.match(mount, /createCss3dMount\(container, options, cards\)/, "the CSS 3D renderer stays as the fallback");
assert.match(mount, /bridge\.show\(/, "the native host must receive the mount payload");
assert.match(mount, /bridge\.setRect\(/, "scroll and resize must only move the native host");
assert.match(mount, /bridge\.hide\?/, "unmount must hide the native host");
assert.match(mount, /addListener\("select"/, "the native host must report taps back to the web");
assert.match(mount, /activeMount\?\.unmount\(\)/, "mount must replace the previous instance before creating another");
assert.match(mount, /controller\.abort\(\)/, "mount cleanup must abort gesture listeners");
assert.match(mount, /cancelAnimationFrame/, "mount cleanup must cancel animation frames");
assert.match(mount, /SimplificaHomeCarouselCss3dRenderer/, "Home must use the CSS 3D renderer instead of Canvas");
assert.match(mount, /readCardPresentations/, "the mount must consume the renderer-owned presentation data");
assert.match(mount, /gesture\.axis === "camera"/, "vertical camera gestures must stay separate from horizontal rotation");

function createContainer() {
  return {
    isConnected: true,
    tabIndex: 0,
    textContent: "",
    dataset: {
      homeCarouselPresentations: JSON.stringify({
        orders: { icon: "P", detail: "4 abertos", live: ["Hoje 2", "Concluídos 1"] },
        production: { icon: "P", detail: "3 em produção", live: ["Abertos 4", "Prontos 1"] }
      })
    },
    listeners: Object.create(null),
    rect: { left: 12, top: 34, width: 360, height: 315 },
    setAttribute() {},
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
    getBoundingClientRect() { return this.rect; }
  };
}

async function runNativeScenario() {
  const calls = { show: [], setRect: [], hide: 0, listeners: new Map() };
  const bridge = {
    show(payload) { calls.show.push(payload); return Promise.resolve(); },
    setRect(payload) { calls.setRect.push(payload); return Promise.resolve(); },
    hide() { calls.hide += 1; return Promise.resolve(); },
    addListener(name, handler) {
      calls.listeners.set(name, handler);
      return Promise.resolve({ remove() { calls.listeners.delete(name); } });
    }
  };

  globalThis.innerWidth = 1080;
  globalThis.innerHeight = 2448;
  globalThis.Capacitor = { isNativePlatform: () => true, Plugins: { SimplificaCarousel3D: bridge } };

  const container = createContainer();
  let navigated = null;
  let preferences = null;
  const api = mountModule.mount(container, {
    canAccessScreen: () => true,
    onNavigate: (screen) => { navigated = screen; },
    getPreferences: () => preferences
  });

  assert.ok(api, "the native mount must expose an api");
  assert.equal(calls.show.length, 1, "mount must push the modules and the card rect once");

  const payload = calls.show[0];
  assert.equal(payload.left, 12, "the rect is reported in CSS px relative to the viewport");
  assert.equal(payload.top, 34);
  assert.equal(payload.width, 360);
  assert.equal(payload.height, 315);
  assert.equal(payload.viewWidth, 1080, "the viewport size travels with the rect");
  assert.equal(payload.viewHeight, 2448);
  assert.equal(payload.modules.length, 5, "every accessible Home module is sent");
  assert.deepEqual(payload.modules[0], {
    id: "orders",
    title: "Pedidos",
    targetScreen: "pedidos",
    detail: "4 abertos",
    live: ["Hoje 2", "Concluídos 1"]
  }, "presentations must travel as the real tile content");

  await Promise.resolve();
  const select = calls.listeners.get("select");
  assert.equal(typeof select, "function", "the native host must be able to report a selected module");

  select({ id: "production", targetScreen: "producao" });
  assert.equal(navigated, "producao", "a native tap must navigate to the module screen");

  select({ id: "desconhecido", targetScreen: "" });
  assert.equal(navigated, "producao", "unknown modules must not navigate");

  api.refresh();
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(calls.setRect.length, 0, "an unchanged rect must not cross the native bridge again");

  container.rect = { ...container.rect, top: 48 };
  api.refresh();
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(calls.setRect.length, 1, "a moved carousel must update the native host");

  preferences = {
    visibleCardIds: ["production", "orders", "calculator", "inventory", "cash"],
    cardOrder: ["production", "orders", "calculator", "inventory", "cash"]
  };
  const reapplied = mountModule.remount();
  assert.ok(reapplied, "saved preferences must remount the active carousel");
  assert.equal(calls.show.length, 2, "remount must send a fresh module payload to native");
  assert.deepEqual(calls.show[1].modules.map((item) => item.id), preferences.cardOrder, "remount must apply the saved card order");

  mountModule.unmount();
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(calls.hide, 1, "unmount must hide the native host");
  assert.equal(calls.listeners.size, 0, "unmount must remove every native listener");

  const remounted = mountModule.mount(container, { canAccessScreen: () => true });
  assert.notEqual(remounted, api, "a destroyed mount must not be reused");
  remounted.unmount();
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(calls.hide, 2, "the remounted instance must hide the native host as well");

  delete globalThis.Capacitor;
}

runNativeScenario().then(() => {
  console.log("Home carousel native bridge: module payload, viewport rect, select navigation and cleanup passed.");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
