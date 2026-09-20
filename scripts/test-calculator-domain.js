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
assert.equal(domain.formatTimeInput(-2, 76), "0:59");
assert.equal(domain.formatTimeInput(3.9, 7.9), "3:07");
assert.equal(domain.calculate({ ...base, batchActive: true, quantity: 1 }).quantity, 2);
assert.equal(domain.calculate({ ...base, batchActive: false, quantity: 99 }).quantity, 1);
assert.equal(domain.normalizePrinterType("resina"), "RESINA");
assert.equal(domain.normalizePrinterType("other"), "FDM");
assert.equal(domain.normalizeNumber("12,5", 0, 3), 12.5);
assert.equal(domain.normalizeNumber("", 7, 0), 7);
assert.deepEqual(domain.normalizeWidget({}, { width: 390, height: 844, mobile: true }), { open: false, x: 8, y: 132, w: 374, h: 620 });
assert.deepEqual(domain.calculateExtraFee({ base: 100, mode: "percent", percent: 6 }), { value: 6, label: "6%", mode: "percent" });
assert.deepEqual(domain.calculateExtraFee({ base: 100, mode: "manual", value: 7.5 }), { value: 7.5, label: "R$", mode: "manual" });
assert.equal(domain.getDisplayedExtraFee({ mode: "manual", value: 7.5, percent: 6 }), 7.5);
assert.deepEqual(domain.calculateBatchPreview({ active: true, quantity: 3, mode: "per_piece", weightGrams: 10, timeMinutes: 20 }), { active: true, quantity: 3, mode: "per_piece", weightGrams: 10, timeMinutes: 20, totalWeightGrams: 30, totalTimeMinutes: 60 });
assert.deepEqual(domain.parseFormattedTime(" 3h 07 "), { hours: 3, minutes: 7 });
assert.equal(domain.parseFormattedTime("3:60"), null);

console.log("CalculatorDomain: material, energia, hora, markup, lote, taxas e normalização validados.");
