"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const appUi = read("src/features/app-ui/app-ui-renderers.js");
const app = read("app.js");
const index = read("index.html");
const prepare = read("scripts/prepare-web.js");
const mount = read("src/features/home/carousel3d/home-carousel-mount.js");

assert.match(index, /home-carousel-mount\.js/, "the Home mount module must load before the renderer");
assert.match(prepare, /home-carousel-mount\.js/, "prepare-web must copy the Home mount module");
assert.match(appUi, /unmountHomeCarousel\(\)/, "each Home tree refresh must cleanup the previous mount");
assert.match(appUi, /mountHomeCarousel\(app\.querySelector\("\[data-home-carousel-host\]"\)\)/, "the renderer must mount after the Home tree exists");
assert.match(appUi, /data-home-carousel-host/, "the Home must expose one explicit carousel host");
assert.doesNotMatch(appUi, /dashboard-carousel-stage/, "the legacy carousel must not be rendered by the Home renderer");
assert.match(app, /function mountHomeCarousel/, "app.js keeps only the Home carousel bridge");
assert.match(mount, /controller\.abort\(\)/, "mount cleanup must abort gesture listeners");
assert.match(mount, /cancelAnimationFrame/, "mount cleanup must cancel animation frames");
assert.match(mount, /activeMount\?\.unmount\(\)/, "mount must replace the previous instance before creating another");

console.log("Home carousel integration: single mount, cleanup bridge, packaged asset and legacy renderer removal passed.");
