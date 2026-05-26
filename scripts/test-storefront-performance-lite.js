const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const required = [
  "loading=\"lazy\"",
  "decoding=\"async\"",
  "content-visibility:auto",
  "contain-intrinsic-size",
  "store-public-product-grid",
  "store-public-product-actions"
];

const missing = required.filter((item) => !app.includes(item) && !css.includes(item));

if (missing.length) {
  console.error("Performance lite incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront performance lite: lazy images, content-visibility e grid responsivo presentes.");
