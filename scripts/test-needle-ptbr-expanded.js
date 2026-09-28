"use strict";
const corpus = require("../src/ai/ptbr-evaluation-corpus.js");
if (corpus.cases.length !== 80 || corpus.tuning.length !== 65 || corpus.holdout.length !== 15) throw new Error("PTBR_CORPUS_SPLIT_INVALID");
if (new Set(corpus.cases.map((item) => item.id)).size !== 80) throw new Error("PTBR_CORPUS_DUPLICATE_ID");
console.log("Needle PT-BR expanded corpus: 80 cases, 65 tuning, 15 holdout.");
