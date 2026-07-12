const assert = require("assert");
const domain = require("../src/services/calculatorDomain.js");

const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: esperado ${expected}, recebido ${actual}`);
const base = { materialPricePerKg: 0, energyPricePerKwh: 0, powerWatts: 0, machineCostPerHour: 0, markupPercent: 0 };

close(domain.calculate({ ...base, weightGrams: 250, materialPricePerKg: 100 }).materialCost, 25, "material");
close(domain.calculate({ ...base, timeMinutes: 300, powerWatts: 200, energyPricePerKwh: 1 }).energyCost, 1, "energia");
close(domain.calculate({ ...base, timeMinutes: 150, machineCostPerHour: 4 }).machineCost, 10, "custo por hora");
close(domain.calculate({ ...base, weightGrams: 1000, materialPricePerKg: 100, markupPercent: 50 }).totalPrice, 150, "markup");

const perPiece = domain.calculate({ ...base, weightGrams: 120, timeMinutes: 150, batchActive: true, quantity: 10, batchMode: "per_piece" });
assert.equal(perPiece.totalWeightGrams, 1200);
assert.equal(perPiece.totalTimeMinutes, 1500);
assert.equal(perPiece.quantity, 10);

const wholeBatch = domain.calculate({ ...base, weightGrams: 1200, timeMinutes: 1500, batchActive: true, quantity: 10, batchMode: "whole_batch" });
assert.equal(wholeBatch.totalWeightGrams, 1200);
assert.equal(wholeBatch.totalTimeMinutes, 1500);

const percentFee = domain.calculate({ ...base, weightGrams: 1000, materialPricePerKg: 100, extraFeeEnabled: true, extraFeeType: "percent", extraFeePercent: 6 });
close(percentFee.extraFeeAmount, 6, "taxa percentual");
close(percentFee.totalPrice, 106, "total percentual");

const fixedFee = domain.calculate({ ...base, weightGrams: 1000, materialPricePerKg: 100, extraFeeEnabled: true, extraFeeType: "fixed", extraFeeFixed: 7.5 });
close(fixedFee.extraFeeAmount, 7.5, "taxa fixa");
close(fixedFee.totalPrice, 107.5, "total fixo");

assert.deepEqual(domain.formatMinutes(domain.toMinutes(0, 90)), { hours: 1, minutes: 30, label: "1h 30min" });
assert.equal(domain.calculate({ ...base, batchActive: true, quantity: 1 }).quantity, 2);
assert.equal(domain.calculate({ ...base, batchActive: false, quantity: 99 }).quantity, 1);

console.log("CalculatorDomain: material, energia, hora, markup, lote, taxas e normalização validados.");
