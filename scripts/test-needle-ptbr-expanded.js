"use strict";
const corpus = require("../src/ai/ptbr-evaluation-corpus.js");
if (corpus.cases.length !== 80 || corpus.tuning.length !== 65 || corpus.holdout.length !== 15) throw new Error("PTBR_CORPUS_SPLIT_INVALID");
if (new Set(corpus.cases.map((item) => item.id)).size !== 80) throw new Error("PTBR_CORPUS_DUPLICATE_ID");
const annotated = (cases) => cases.filter((item) => Object.keys(item.expectedFields || {}).length > 0);
const holdoutFields = annotated(corpus.holdout).flatMap((item) => Object.keys(item.expectedFields));
if (annotated(corpus.tuning).length !== 29 || annotated(corpus.holdout).length !== 1) throw new Error("PTBR_CORPUS_FIELD_COVERAGE_CHANGED");
if (holdoutFields.length !== 1 || holdoutFields[0] !== "customerName") throw new Error("PTBR_HOLDOUT_FIELD_DISTRIBUTION_CHANGED");
console.log("Needle PT-BR expanded corpus: 80 cases, 65 tuning, 15 holdout; field annotations: tuning 29/65, holdout 1/15 (customerName only).");
