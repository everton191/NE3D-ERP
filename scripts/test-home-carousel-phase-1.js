"use strict";

const assert = (value, message) => { if (!value) throw new Error(message); };
const screens = ["producao", "pedidos", "relatorios", "caixa", "estoque", "clientes", "lojaOnline", "administracao", "impressoras", "calculadora"];
require("../src/features/home/carousel3d/config/home-carousel-config.js");
const registryApi = require("../src/features/home/carousel3d/widgets/home-carousel-widget-registry.js");
const stateApi = require("../src/features/home/carousel3d/widgets/home-carousel-widget-state.js");
const engineApi = require("../src/features/home/carousel3d/core/home-carousel-engine.js");
const rendererApi = require("../src/features/home/carousel3d/visual/home-carousel-renderer.js");
const sceneApi = require("../src/features/home/carousel3d/core/home-carousel-scene.js");

const registry = registryApi.createRegistry(screens), state = stateApi.createState(registry), engine = engineApi.createEngine(() => state.visible(), { autoplayIntervalMs: 5 });
assert(registry.active.length === 10 && registry.future.length === 0, "registry requires the fixed 10 card catalog and no future cards");
assert(new Set(registry.all.map(x => x.id)).size === 10, "ids must be unique");
assert(registry.future.every(x => !x.available && !x.enabled && x.future), "future cards must remain disabled");
assert(!registry.get("orders_recent") && !registry.get("day_summary"), "obsolete Home cards must be absent");
assert(registry.active.every(x => screens.includes(x.targetScreen)), "active screens must exist");

const noop = function () {};
const context = { setTransform: noop, clearRect: noop, save: noop, restore: noop, translate: noop, transform: noop, beginPath: noop, roundRect: noop, fill: noop, stroke: noop, fillText: noop, createLinearGradient: () => ({ addColorStop: noop }) };
const listeners = {};
const canvas = { clientWidth: 360, clientHeight: 540, width: 0, height: 0, getContext: () => context, addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener: name => { delete listeners[name]; } };
const renderer = rendererApi.createRenderer(canvas, engine, () => state.visible()); renderer.render();
const oldRaf = global.requestAnimationFrame, oldCancel = global.cancelAnimationFrame;
global.requestAnimationFrame = () => 1; global.cancelAnimationFrame = noop;
const scene = sceneApi.createScene(canvas, { screens, autoplayIntervalMs: 50000 }); assert(scene.engine && scene.registry, "scene initializes engine and registry"); scene.mount(); listeners.pointerdown({ clientX: 10, timeStamp: 1 }); listeners.pointermove({ clientX: 40, timeStamp: 2 }); listeners.pointerup({ clientX: 40, timeStamp: 3 }); scene.unmount(); global.requestAnimationFrame = oldRaf; global.cancelAnimationFrame = oldCancel;
engine.dragStart(); engine.dragBy(130); engine.dragEnd(0); engine.snap(); assert(engine.selectedCard, "snap selects a central card");
const before = engine.selectedIndex; engine.startAutoplay(0); engine.tick(6, .016); assert(engine.selectedIndex !== before, "autoplay changes card");
engine.dragStart(); const paused = engine.selectedIndex; engine.tick(100, .016); assert(engine.selectedIndex === paused, "interaction pauses autoplay"); engine.dragEnd(0);
for (let i = 0; i < 40; i++) { engine.dragStart(); engine.dragBy(400); engine.dragEnd(0); engine.snap(); } assert(engine.selectedIndex >= 0 && engine.selectedIndex < state.visible().length, "loop keeps index valid");
for (const count of [5, 8, 13]) {
  const cards = Array.from({ length: count }, (_, index) => ({ id: `scale_${index}` }));
  const expanded = engineApi.createEngine(() => cards, { autoplayIntervalMs: 1000 });
  const stepPixels = 360 / count / engineApi.config.dragSensitivity;
  for (let index = 1; index <= count * 3; index++) {
    expanded.dragStart(); expanded.dragBy(-stepPixels); expanded.dragEnd(0); expanded.snap();
    assert(expanded.selectedIndex === index % count, `${count} cards must advance and wrap at step ${index}`);
    assert(expanded.selectedCard.id === cards[index % count].id, `${count} cards must retain their selected route`);
    assert(cards.every((_, face) => Number.isFinite(expanded.transform(face).depth)), `${count} cards must keep valid 3D transforms`);
  }
  expanded.startAutoplay(0); expanded.tick(1001, .016);
  assert(expanded.selectedIndex === 1, `${count} cards must autoplay across the wrap`);
}
const routesBefore = registry.active.map(x => x.targetScreen).join(","); state.hide("calculator"); assert(!state.visible().some(x => x.id === "calculator"), "state hides a card"); assert(registry.active.map(x => x.targetScreen).join(",") === routesBefore, "hiding does not alter routes");
const source = require("fs").readFileSync(require("path").join(__dirname, "..", "src", "features", "home", "carousel3d", "data", "widget-data-sources.js"), "utf8"); assert(source.includes("normalizeStockSnapshot"), "data layer preserved");
const newApi = [registryApi, stateApi, engineApi]; assert(!JSON.stringify(newApi).match(/SPB|Shell|Launcher/i), "new public API must not expose launcher identity");
console.log("Home carousel phase 1: engine, registry, state, physics, autoplay and isolation passed.");
