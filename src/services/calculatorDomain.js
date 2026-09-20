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
  const formatTimeInput = (hours = 0, minutes = 0) => {
    const safeHours = Math.max(0, Math.floor(Number(hours) || 0));
    const safeMinutes = Math.max(0, Math.min(59, Math.floor(Number(minutes) || 0)));
    return `${safeHours}:${String(safeMinutes).padStart(2, "0")}`;
  };
  const normalizePrinterType = (type = "FDM") => String(type || "FDM").trim().toUpperCase() === "RESINA" ? "RESINA" : "FDM";
  const normalizeNumber = (value, fallback = 0, minimum = 0, parse = finite) => {
    if (value === "" || value === null || value === undefined) return fallback;
    const number = parse(value, NaN);
    return Number.isFinite(number) ? Math.max(minimum, number) : fallback;
  };
  const normalizeWidget = (widget = {}, viewport = {}) => {
    const width = Number(viewport.width) || 1024;
    const height = Number(viewport.height) || 768;
    const mobile = viewport.mobile === true;
    const margin = mobile ? 8 : 16;
    const bottomInset = mobile ? 92 : 18;
    const maxWidth = Math.max(280, width - margin * 2);
    const maxHeight = Math.max(320, height - margin * 2);
    const minWidth = Math.min(320, maxWidth);
    const minHeight = Math.min(360, maxHeight);
    const defaultWidth = mobile ? Math.min(420, maxWidth) : 430;
    const defaultHeight = mobile ? Math.min(620, maxHeight) : 620;
    const w = Math.min(maxWidth, Math.max(minWidth, Number(widget.w) || defaultWidth));
    const h = Math.min(maxHeight, Math.max(minHeight, Number(widget.h) || defaultHeight));
    const hasX = widget.x !== undefined && widget.x !== null && widget.x !== "";
    const hasY = widget.y !== undefined && widget.y !== null && widget.y !== "";
    const xBase = hasX ? Number(widget.x) || 0 : width - w - margin;
    const yBase = hasY ? Number(widget.y) || 0 : height - h - bottomInset;
    return Object.freeze({
      open: widget.open === true,
      x: Math.min(Math.max(margin, width - w - margin), Math.max(margin, xBase)),
      y: Math.min(Math.max(margin, height - h - margin), Math.max(margin, yBase)),
      w,
      h
    });
  };
  const calculateExtraFee = ({ base = 0, mode = "percent", percent = 0, value = 0 } = {}) => {
    const normalizedBase = nonNegative(base);
    if (mode === "manual") return Object.freeze({ value: nonNegative(value), label: "R$", mode: "manual" });
    const normalizedPercent = nonNegative(percent);
    return Object.freeze({ value: normalizedBase * (normalizedPercent / 100), label: `${normalizedPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`, mode: "percent" });
  };
  const getDisplayedExtraFee = (state = {}) => state.mode === "manual" ? nonNegative(state.value) : nonNegative(state.percent);
  const calculateBatchPreview = ({ active = false, quantity = 1, mode = "per_piece", weightGrams = 0, timeMinutes = 0 } = {}) => {
    const informedQuantity = Math.floor(Number(quantity));
    const safeQuantity = active === true && informedQuantity >= 2 && informedQuantity <= 999 ? informedQuantity : 1;
    const batchMode = mode === "whole_batch" ? "whole_batch" : "per_piece";
    const multiplier = active === true && batchMode === "per_piece" ? safeQuantity : 1;
    const weight = nonNegative(weightGrams), time = integer(timeMinutes);
    return Object.freeze({ active: active === true, quantity: safeQuantity, mode: batchMode, weightGrams: weight, timeMinutes: time, totalWeightGrams: weight * multiplier, totalTimeMinutes: time * multiplier });
  };
  const parseFormattedTime = (value = "") => {
    const parts = String(value || "").trim().replace(/[hH]/g, ":").replace(/\s+/g, "").split(":");
    const hours = Math.max(0, Number.parseInt(parts[0] || "0", 10) || 0);
    const minutes = parts.length > 1 ? Number.parseInt(parts[1] || "0", 10) : 0;
    return !Number.isFinite(minutes) || minutes < 0 || minutes > 59 ? null : Object.freeze({ hours, minutes });
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

  const api = Object.freeze({ calculate, toMinutes, formatMinutes, formatTimeInput, normalizePrinterType, normalizeNumber, normalizeWidget, calculateExtraFee, getDisplayedExtraFee, calculateBatchPreview, parseFormattedTime });
  globalScope.CalculatorDomain = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
