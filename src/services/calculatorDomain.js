(function initCalculatorDomain(globalScope) {
  "use strict";

  const finite = (value, fallback = 0) => {
    const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  };
  const nonNegative = (value, fallback = 0) => Math.max(0, finite(value, fallback));
  const integer = (value, fallback = 0) => Math.floor(nonNegative(value, fallback));
  const toMinutes = (hours = 0, minutes = 0) => integer(hours) * 60 + integer(minutes);
  const formatMinutes = (total = 0) => {
    const safe = integer(total);
    return { hours: Math.floor(safe / 60), minutes: safe % 60, label: `${Math.floor(safe / 60)}h ${String(safe % 60).padStart(2, "0")}min` };
  };

  function calculate(input = {}) {
    const batchActive = input.batchActive === true;
    const quantity = batchActive ? Math.max(2, Math.min(999, integer(input.quantity, 2))) : 1;
    const batchMode = input.batchMode === "whole_batch" ? "whole_batch" : "per_piece";
    const informedWeightGrams = nonNegative(input.weightGrams);
    const informedTimeMinutes = integer(input.timeMinutes);
    const multiplier = batchActive && batchMode === "per_piece" ? quantity : 1;
    const totalWeightGrams = informedWeightGrams * multiplier;
    const totalTimeMinutes = informedTimeMinutes * multiplier;
    const totalTimeHours = totalTimeMinutes / 60;
    const chargedHours = Math.max(totalTimeHours, nonNegative(input.minimumChargedHours));

    const materialCost = totalWeightGrams * (nonNegative(input.materialPricePerKg) / 1000);
    const energyCost = (nonNegative(input.powerWatts) / 1000) * chargedHours * nonNegative(input.energyPricePerKwh);
    const machineCost = chargedHours * nonNegative(input.machineCostPerHour);
    const baseCost = materialCost + energyCost + machineCost;
    const markupPercent = nonNegative(input.markupPercent);
    const profitAmount = baseCost * (markupPercent / 100);
    const subtotalBase = baseCost + profitAmount;

    const extraFeeEnabled = input.extraFeeEnabled === true;
    const extraFeeType = input.extraFeeType === "fixed" ? "fixed" : "percent";
    const extraFeePercent = Math.min(100, nonNegative(input.extraFeePercent));
    const extraFeeFixed = nonNegative(input.extraFeeFixed);
    const extraFeeAmount = !extraFeeEnabled ? 0 : extraFeeType === "fixed"
      ? extraFeeFixed
      : subtotalBase * (extraFeePercent / 100);
    const beforeRounding = subtotalBase + extraFeeAmount;
    const roundingStep = nonNegative(input.roundingStep);
    const totalPrice = roundingStep > 0 ? Math.ceil(beforeRounding / roundingStep) * roundingStep : beforeRounding;
    const unitPrice = totalPrice / quantity;

    return Object.freeze({
      batchActive, quantity, batchMode, multiplier,
      informedWeightGrams, informedTimeMinutes,
      totalWeightGrams, totalTimeMinutes, totalTimeHours, chargedHours,
      materialCost, energyCost, machineCost, baseCost,
      markupPercent, profitAmount, subtotalBase,
      extraFeeEnabled, extraFeeType, extraFeePercent, extraFeeFixed, extraFeeAmount,
      beforeRounding, roundingStep, roundingAdjustment: totalPrice - beforeRounding,
      totalPrice, unitPrice
    });
  }

  const api = Object.freeze({ calculate, toMinutes, formatMinutes });
  globalScope.CalculatorDomain = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
