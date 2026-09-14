"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const screens=require("../src/navigation/screen-registry.js"); assert(screens.registry.validate().ok); assert.equal(screens.registry.resolve("home").id,"dashboard"); assert.equal(screens.registry.resolve("orders").id,"pedidos"); assert.equal(screens.registry.resolve("missing"),null);
const index=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),loader=fs.readFileSync("src/services/ai-runtime-loader.js","utf8"); assert(index.includes("screen-registry.js")); assert(index.includes("ai-runtime-loader.js")); assert.match(index,/IA opcional: carregada por ensureAiRuntimeLoaded/); assert.match(app,/SimplificaScreenRegistry.*registry/); assert.match(app,/ensureAiRuntimeLoaded/); assert.match(loader,/if \(promise\) return promise/);
console.log("Structure Phase 2 screen bridge and AI lazy loader contract passed.");
