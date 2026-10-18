"use strict";

// Local source contracts only; this does not simulate an Android permission dialog.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root,
  "android/app/src/main/java/br/com/ne3d/erp/SimplificaFilesPlugin.java"), "utf8");

function method(name) {
  const match = source.match(new RegExp(
    `(?:^|\\n)    (?:public|private) void ${name}\\(PluginCall call\\) \\{([\\s\\S]*?)\\n    \\}`));
  assert(match, `Canonical Java method ${name} must exist`);
  return match[1];
}

function requestedCallback(body) {
  const match = body.match(/requestPermissionForAlias\("storage", call, "([^"]+)"\);/);
  assert(match, "Storage permission must retain the original PluginCall");
  return match[1];
}

const endpoints = [
  { name: "savePdf", writer: "writePdf" },
  { name: "saveFile", writer: "writeFile" }
];
const callbackNames = endpoints.map(({ name }) => requestedCallback(method(name)));
assert.notEqual(callbackNames[0], callbackNames[1],
  "PDF and generic saves must resume their original method, not share extension-based dispatch");

for (const { name, writer } of endpoints) {
  const body = method(name);
  const callbackName = requestedCallback(body);
  const callback = method(callbackName);
  assert.match(body, /if \(Build\.VERSION\.SDK_INT < Build\.VERSION_CODES\.Q && getPermissionState\("storage"\) != PermissionState\.GRANTED\)/,
    `${name}: request storage only below API 29 when not granted`);
  assert.match(body, new RegExp(`requestPermissionForAlias\\("storage", call, "${callbackName}"\\);\\s*return;\\s*\\}\\s*${writer}\\(call\\);`),
    `${name}: already granted or scoped storage must call its original writer directly`);
  assert.match(source, new RegExp(`@PermissionCallback\\s+private void ${callbackName}\\(PluginCall call\\)`),
    `${callbackName}: Capacitor must be able to resolve the callback`);
  assert.match(callback, new RegExp(`if \\(getPermissionState\\("storage"\\) == PermissionState\\.GRANTED\\) \\{\\s*${writer}\\(call\\);\\s*\\} else \\{\\s*call\\.reject\\("Permissão de armazenamento negada\\."\\);\\s*\\}`),
    `${name}: granting preserves the original writer and denying rejects the operation`);
  assert.doesNotMatch(callback, /getString|fileName|endsWith|toLowerCase/,
    `${name}: filename absence, extension and locale cannot change dispatch`);
  const otherWriter = writer === "writePdf" ? "writeFile" : "writePdf";
  assert.doesNotMatch(callback, new RegExp(`\\b${otherWriter}\\(`),
    `${name}: callback may not switch the original save operation`);
}

assert.match(method("writePdf"), /writeBase64ToDownloads\(call, "application\/pdf", sanitizePdfFileName\(call\.getString\("fileName", "pedido-simplifica-3d\.pdf"\)\), "PDF"\);/,
  "PDF MIME/default filename must remain independent of permission state");
assert.match(method("writeFile"), /String mimeType = call\.getString\("mimeType", "application\/octet-stream"\);/);
assert.match(method("writeFile"), /sanitizeGenericFileName\(call\.getString\("fileName", "arquivo-simplifica-3d\.json"\)\)/,
  "Generic-file MIME/default filename must remain unchanged");

const permissionCheck = method("requestStoragePermission");
const permissionCheckCallback = requestedCallback(permissionCheck);
assert(!callbackNames.includes(permissionCheckCallback),
  "Permission-only requests must never become a save operation");
assert.match(permissionCheck, /Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.Q/);
assert.match(permissionCheck, /result\.put\("scoped", true\)/);
assert.match(permissionCheck, /result\.put\("scoped", false\)/);
assert.match(method(permissionCheckCallback), /result\.put\("granted", getPermissionState\("storage"\) == PermissionState\.GRANTED\);/);
assert.match(method(permissionCheckCallback), /result\.put\("scoped", false\);\s*call\.resolve\(result\);/);
assert.doesNotMatch(permissionCheck + method(permissionCheckCallback), /writePdf|writeFile|writeBase64ToDownloads/);

console.log("ANDROID FILE PERMISSIONS: original PDF/file routes, denied permission, API guard and unchanged defaults PASS (source contracts only; API 24–28 device validation pending).");
