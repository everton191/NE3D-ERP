"use strict";

const fs = require("fs");
const path = require("path");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const identifiers = require("../src/features/inventory/inventory-identifiers.js");
const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert(identifiers.getCodigoNumericoMaterialEstoque({ codigoEstoque: "12" }) === 12, "internal stock code is normalized");
assert(identifiers.getCodigoNumericoMaterialEstoque({ stock_code: 4.5 }) === 0, "non-integer stock code is rejected");
assert(identifiers.formatarCodigoMaterialEstoque({ stock_code: 7 }) === "#0007", "material code is formatted");
assert(identifiers.formatarCodigoMaterialEstoque(0) === "#----", "missing material code keeps fallback");
assert(identifiers.getProximoCodigoMaterialEstoque([{ codigoEstoque: 2 }, { stock_code: 9 }, { codigo: "4" }]) === 10, "next stock code uses the highest valid code");
assert(identifiers.getCodigoExternoMaterialEstoque({ barcode: "  EAN-123  " }) === "EAN-123", "external code fallback is trimmed");

const bridges = [
  "return window.SimplificaInventoryIdentifiers.getCodigoNumericoMaterialEstoque(material);",
  "return window.SimplificaInventoryIdentifiers.formatarCodigoMaterialEstoque(materialOuCodigo);",
  "return window.SimplificaInventoryIdentifiers.getProximoCodigoMaterialEstoque(lista);",
  "return window.SimplificaInventoryIdentifiers.getCodigoExternoMaterialEstoque(material);"
];
bridges.forEach((bridge) => assert(appSource.includes(bridge), `missing app.js identifier bridge: ${bridge}`));
assert(appSource.includes("getCodigoNumericoMaterialEstoque, getCodigoExternoMaterialEstoque"), "inventory normalizer retains identifier dependencies through bridges");

console.log("Batch 2 modularization: inventory identifier parity and bridges passed.");
