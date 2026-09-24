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
const cssRenderer = read("src/features/home/carousel3d/visual/home-carousel-css3d-renderer.js");

assert.match(index, /home-carousel-mount\.js/, "the Home mount module must load before the renderer");
assert.match(index, /home-carousel-css3d-renderer\.js/, "the CSS 3D renderer must load");
assert.match(prepare, /home-carousel-mount\.js/, "prepare-web must copy the Home mount module");
assert.match(appUi, /unmountHomeCarousel\(\)/, "each Home tree refresh must cleanup the previous mount");
assert.match(appUi, /mountHomeCarousel\(app\.querySelector\("\[data-home-carousel-host\]"\)\)/, "the renderer must mount after the Home tree exists");
assert.match(appUi, /data-home-carousel-host/, "the Home must expose one explicit carousel host");
assert.doesNotMatch(appUi, /dashboard-carousel-stage/, "the legacy carousel must not be rendered by the Home renderer");
assert.match(app, /function mountHomeCarousel/, "app.js keeps only the Home carousel bridge");
assert.match(mount, /controller\.abort\(\)/, "mount cleanup must abort gesture listeners");
assert.match(mount, /cancelAnimationFrame/, "mount cleanup must cancel animation frames");
assert.match(mount, /activeMount\?\.unmount\(\)/, "mount must replace the previous instance before creating another");
assert.match(mount, /SimplificaHomeCarouselCss3dRenderer/, "Home must use the CSS 3D renderer instead of Canvas");
assert.match(cssRenderer, /rotateY\(/, "faces must receive real CSS rotationY transforms");
assert.match(cssRenderer, /translateZ\(/, "faces must receive real CSS depth transforms");
assert.doesNotMatch(mount, /createElement\("canvas"\)/, "the Home mount must not create the legacy Canvas renderer");
assert.doesNotMatch(read("src/features/home/carousel3d/config/home-carousel-config.js"), /day_summary/, "daily summary must be absent from the Home dataset");
assert.doesNotMatch(app, /renderPedidosRecentesDashboard\(\)<\/div>/, "recent orders must not be rendered by the Home");

console.log("Home carousel integration: single mount, cleanup bridge, packaged asset and legacy renderer removal passed.");
