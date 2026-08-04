const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const motion = fs.readFileSync("src/services/googleMotionEnhancer.js", "utf8");
const motionCss = fs.readFileSync("src/styles/google-expressive-motion.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(css.includes('.ui-section[data-accordion-group="aparencia"]:first-child'), "Tema da Aparencia continua oculto no mobile");
assert(css.includes('.ui-section[data-accordion-group="aparencia"][open]'), "Secao expandida da Aparencia sem largura total");
assert(css.includes('body.gxm-motion-ready.mobile-mode:not([data-motion="high"])'), "Fallback de renderizacao mobile ausente");
assert(css.includes('opacity:1 !important'), "Blocos mobile podem permanecer invisiveis");
assert(css.includes('Estabilidade visual: atualizações de dados não reapresentam a tela inteira'), "Estabilidade global da tela ausente");
assert(css.includes('animation:none !important'), "Tela ainda pode reaplicar animacao durante atualizacoes");
assert(!app.includes('document.body.classList.add(`motion-${direcao}`)'), "Navegacao ainda reaplica animacao na tela inteira");
assert(motion.includes("function shouldAnimateScreen()"), "Controle de animacao por dispositivo ausente");
assert(motion.includes("return false;"), "Atualizacoes de dados ainda podem reanimar o container da tela");
assert(motion.includes('doc.body?.classList?.remove("gxm-force-motion")'), "Movimento continua forcado contra preferencia do dispositivo");
assert(!motion.includes('classList?.add("gxm-force-motion")'), "Movimento forcado ainda e ativado");
assert(motion.includes("options.initial"), "Primeira abertura deve marcar telas sem animar");
assert(!/:not\(\.gxm-seen\)\s*\{/.test(motionCss), "Primeira abertura nao pode depender de animacao por :not(.gxm-seen)");
assert(motionCss.includes("animation:none!important"), "PWA deve manter os containers opacos sem piscar");

console.log("Mobile render stability tests passed.");
