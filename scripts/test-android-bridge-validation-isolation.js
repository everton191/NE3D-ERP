"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const settings = read("android/settings.gradle");
const gradle = read("android/bridge-validation/build.gradle");
const activity = read("android/bridge-validation/src/main/java/br/com/ne3d/erp/bridgevalidation/ValidationBridgeActivity.java");
const html = read("android/bridge-validation/src/main/assets/public/index.html");
const fixture = read("android/bridge-validation/src/main/assets/public/validation.js");
const test = read("android/bridge-validation/src/androidTest/java/br/com/ne3d/erp/bridgevalidation/BridgeMediaDeviceTest.java");

assert.match(settings, /if \(providers\.gradleProperty\('simplificaBridgeValidation'\)\.orNull == 'true'\)\s*\{\s*include ':bridge-validation'\s*\}/);
assert.match(gradle, /applicationId 'br\.com\.ne3d\.erp\.bridgevalidation'/);
assert.match(gradle, /testApplicationId 'br\.com\.ne3d\.erp\.bridgevalidation\.test'/);
assert.match(gradle, /beforeVariants\(selector\(\)\.withBuildType\('release'\)\)[\s\S]*variant\.enable = false/);
for (const flag of ["AI_ENABLED", "SELF_UPDATE_ENABLED", "EXTERNAL_CHECKOUT_ENABLED"]) {
  assert(gradle.includes(`buildConfigField 'boolean', '${flag}', 'false'`));
  assert(activity.includes(`BuildConfig.${flag}`), `${flag} must be checked before starting the host`);
}
const included = gradle.match(/java\.includes = \[([\s\S]*?)\]/)?.[1].match(/'[^']+'/g);
assert.deepEqual(included, [
  "'br/com/ne3d/erp/SimplificaFilesPlugin.java'",
  "'br/com/ne3d/erp/PendingDownloadWriter.java'",
  "'br/com/ne3d/erp/bridgevalidation/ValidationBridgeActivity.java'"
]);
assert.doesNotMatch(gradle, /implementation project\(['"]:app['"]\)|admob|externalNativeBuild|signingConfigs/);
assert.match(gradle, /jniLibs\.excludes \+= \['\*\*\/\*\.so'\]/);
assert.match(gradle, /from\('\.\.\/\.\.\/src\/features\/company'\) \{ include 'pdf-document-delivery\.js' \}/);
assert.match(gradle, /from\('\.\.\/\.\.\/src\/features\/cash'\) \{ include 'cash-renderer\.js' \}/);
assert.doesNotMatch(gradle, /from\([^\n]*(?:dist|assets|models|config)\b/);

for (const kind of ["main", "androidTest"]) {
  const manifest = read(`android/bridge-validation/src/${kind}/AndroidManifest.xml`);
  for (const permission of ["INTERNET", "ACCESS_NETWORK_STATE", "READ_CONTACTS", "CAMERA"]) {
    assert(manifest.includes(`android:name="android.permission.${permission}" tools:node="remove"`));
  }
  assert.match(manifest, /android:allowBackup="false"/);
  const permissions = manifest.match(/<uses-permission\b[^>]*>/g) || [];
  assert(permissions.every((item) => item.includes('tools:node="remove"')));
  assert.doesNotMatch(manifest, /<service\b|<receiver\b|MAIN|LAUNCHER|br\.com\.ne3d\.erp\.MainActivity/);
}
assert.match(read("android/bridge-validation/src/main/AndroidManifest.xml"), /android:name="\.ValidationBridgeActivity" android:exported="false"/);
assert.match(activity, /registerPlugin\(SimplificaFilesPlugin\.class\)/);
assert.equal((activity.match(/registerPlugin\(/g) || []).length, 1);
assert.match(activity, /checkPermission\(Manifest\.permission\.INTERNET/);
assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(html, /https?:\/\/|\bcapture\b/);
assert.match(html, /type="file" accept="image\/jpeg,image\/png,image\/webp"/);
assert.doesNotMatch(fixture, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.share\(|clipboard\.writeText\(/);
assert.match(fixture, /simplifica-bridge-validation-/);
assert.doesNotMatch(activity, /br\.com\.ne3d\.erp\.MainActivity|startActivity\(/);
assert.deepEqual(JSON.parse(read("android/bridge-validation/src/main/assets/capacitor.plugins.json")), []);
assert.equal((test.match(/@Test\b/g) || []).length, 8);
assert.match(test, /assertNoPrintWindows\(\);[\s\S]*ActivityScenario\.launch/);
assert.match(test, /printOpensSystemDialogThenCancelsOwnJobAndDestroysOnlyOwnHost/);
assert.match(test, /printNames\.contains\(String\.valueOf\(job\.getInfo\(\)\.getLabel\(\)\)\)/);
assert.match(test, /assertEquals\(Lifecycle\.State\.DESTROYED, scenario\.getState\(\)\)/);
assert.match(test, /assertTrue\("Only the disposable host must be destroyed", activity\.isDestroyed\(\)\)/);
assert.doesNotMatch(test, /performGlobalAction|GLOBAL_ACTION_|sendKey|pressBack|\.click\(/,
  "the harness must not act on any external system window");
for (const guard of ["created.containsKey(uri)", "MediaStore.MediaColumns.OWNER_PACKAGE_NAME",
  "assertEquals(DIRECTORY, cursor.getString(1))", "assertEquals(PACKAGE, cursor.getString(2))",
  "requireFixture(entry.getKey(), entry.getValue())", "discoverOnlyPlannedFixtureUris()"]) {
  assert(test.includes(guard), `Required fixture cleanup guard missing: ${guard}`);
}
assert.doesNotMatch(test, /delete\(MediaStore\.Downloads\.EXTERNAL_CONTENT_URI|br\.com\.ne3d\.erp\.MainActivity|clipboard\.writeText\(/);
console.log("BRIDGE VALIDATION: opt-in host, distinct IDs, no network/personal permissions, canonical-source whitelist and no ERP entry PASS (static only).");
