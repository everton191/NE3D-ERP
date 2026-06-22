const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

const required = [
  "og:title",
  "og:description",
  "og:image",
  "og:site_name",
  "twitter:card",
  "theme-color",
  "canonical",
  "apple-touch-icon",
  "1.0.43-rc-security-mobile-release-20260622"
];

const missing = required.filter((item) => !app.includes(item) && !html.includes(item));

if (missing.length) {
  console.error("Open Graph/SEO basico incompleto:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront OG/meta: title, description, image, canonical e theme-color presentes.");
