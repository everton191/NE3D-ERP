const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const motion = fs.readFileSync("src/services/googleMotionEnhancer.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(css.includes('.ui-section[data-accordion-group="aparencia"]:first-child'), "Tema da Aparencia continua oculto no mobile");
assert(css.includes('.ui-section[data-accordion-group="aparencia"][open]'), "Secao expandida da Aparencia sem largura total");
assert(css.includes('body.gxm-motion-ready.mobile-mode:not([data-motion="high"])'), "Fallback de renderizacao mobile ausente");
assert(css.includes('opacity:1 !important'), "Blocos mobile podem permanecer invisiveis");
assert(css.includes('animation:mobileStableScreenFade 190ms ease-out both !important'), "Transicao mobile ainda pode piscar");
assert(css.includes('from{opacity:.96}'), "Transicao mobile ainda inicia invisivel");
assert(app.includes('isMobile() && document.body.dataset.motion !== "high"'), "Stagger pesado continua ativo por padrao no mobile");
assert(motion.includes("function shouldAnimateScreen()"), "Controle de animacao por dispositivo ausente");
assert(motion.includes('doc.body?.classList?.remove("gxm-force-motion")'), "Movimento continua forcado contra preferencia do dispositivo");
assert(!motion.includes('classList?.add("gxm-force-motion")'), "Movimento forcado ainda e ativado");

console.log("Mobile render stability tests passed.");
