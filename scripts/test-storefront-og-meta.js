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
  "apple-touch-icon"
];

const missing = required.filter((item) => !app.includes(item) && !html.includes(item));
const hasAppVersion = /app\.js\?v=[^"]+/.test(html);

if (missing.length || !hasAppVersion) {
  const failures = [...missing, ...(!hasAppVersion ? ["app.js versionado"] : [])];
  console.error("Open Graph/SEO basico incompleto:", failures.join(", "));
  process.exit(1);
}

console.log("Storefront OG/meta: title, description, image, canonical e theme-color presentes.");
