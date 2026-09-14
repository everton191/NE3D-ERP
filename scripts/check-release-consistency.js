"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"); const read=(p)=>fs.readFileSync(p,"utf8"); const update=JSON.parse(read("downloads/update.json")); const gradle=read("android/app/build.gradle"); const manifest=JSON.parse(read("manifest.webmanifest"));
const version=String(update.version),code=Number(update.versionCode); const gradleVersion=gradle.match(/versionName[^\n]*:\s*"([^"]+)"/)?.[1],gradleCode=Number(gradle.match(/versionCode[^\n]*:\s*(\d+)/)?.[1]);
const result={version,code,gradleVersion,gradleCode,manifestName:manifest.name,ok:version===gradleVersion&&code===gradleCode}; if(process.argv.includes("--json")) console.log(JSON.stringify(result)); else console.log(result);
assert(result.ok,`release metadata mismatch: update=${version}/${code}, android=${gradleVersion}/${gradleCode}`);
