const fs = require("fs");

const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  layouts.includes(".sfe-shell--mobile .sfe-actions{padding-bottom:calc(16px + var(--app-safe-bottom,0px))}"),
  "Editor mobile actions deve ter padding-bottom >= 16px + safe-area para subir os botoes"
);

assert(
  layouts.includes("body.mobile-mode .sfe-workspace--mobile .sfe-shell{width:100%;height:auto;min-height:0;border:0}"),
  "Shell mobile deve usar height:auto para respeitar safe-area via inset sem overflow"
);

assert(
  layouts.includes("body.mobile-mode .sfe-workspace--mobile .sfe-scroll{height:100%;min-height:0;overflow:hidden}"),
  "Scroll mobile deve usar height:100% para caber dentro do shell"
);

assert(
  layouts.includes("body.mobile-mode .sfe-workspace--mobile .sfe-form{height:100%;min-height:0;overflow:hidden}"),
  "Form mobile deve usar height:100% para caber dentro do shell"
);

assert(
  layouts.includes(".sfe-actions{position:sticky;bottom:0;"),
  "Actions desktop continua sticky-bottom zero"
);

assert(
  layouts.includes("calc(8px + var(--app-safe-bottom,0px))"),
  "Padding base desktop preservado com safe-area"
);

assert(
  layouts.includes("body.mobile-mode .sfv3{padding-bottom:calc(var(--store-bottom-bar-height)"),
  "Padding-bottom do storefront mobile preservado para o bottom dock"
);

assert(
  layouts.includes("body.mobile-mode .sfv3-bottom-nav{position:fixed;right:0;bottom:0;left:0;"),
  "Bottom nav continua fixa no rodape"
);

const hasDesktopMedia = layouts.includes("@media(min-width:901px)");
assert(hasDesktopMedia, "Media query desktop continua presente");

const hasMobileMax560 = layouts.includes("@media(max-width:560px)");
assert(hasMobileMax560, "Media query mobile 560px continua presente");

const hasMobileMax430 = layouts.includes("@media(max-width:430px)");
assert(hasMobileMax430, "Media query mobile 430px continua presente");

const desktopShellRule = layouts.match(/\.sfe-shell--desktop\{[^}]+\}/);
assert(desktopShellRule && desktopShellRule[0].includes("height:100dvh"), "Shell desktop mantem height:100dvh");

console.log("Storefront mobile actions layout: padding mobile elevado, shell auto, desktop inalterado, bottom dock preservado validados.");
