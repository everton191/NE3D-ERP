"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const settings = read("android/settings.gradle");
const gradle = read("android/media-validation/build.gradle");
const test = read("android/media-validation/src/androidTest/java/br/com/ne3d/erp/MediaStoreDownloadDeviceTest.java");

assert.match(settings, /if \(providers\.gradleProperty\('simplificaMediaValidation'\)\.orNull == 'true'\)\s*\{\s*include ':media-validation'\s*\}/,
  "validation module must remain explicitly opt-in");
assert.match(gradle, /applicationId 'br\.com\.ne3d\.erp\.validation'/);
assert.match(gradle, /testApplicationId 'br\.com\.ne3d\.erp\.validation\.test'/);
assert.match(gradle, /minSdkVersion 29/);
assert.match(gradle, /beforeVariants\(selector\(\)\.withBuildType\('release'\)\)[\s\S]*variant\.enable = false/,
  "validation release must stay disabled");
for (const flag of ["AI_ENABLED", "SELF_UPDATE_ENABLED", "EXTERNAL_CHECKOUT_ENABLED"]) {
  assert(gradle.includes(`buildConfigField 'boolean', '${flag}', 'false'`), `${flag} must stay false`);
}
assert.match(gradle, /java\.srcDirs = \['\.\.\/app\/src\/main\/java'\]/);
const includes = gradle.match(/java\.includes = \[([\s\S]*?)\]/)?.[1].match(/'[^']+'/g);
assert.deepEqual(includes, ["'br/com/ne3d/erp/SimplificaFilesPlugin.java'", "'br/com/ne3d/erp/PendingDownloadWriter.java'"],
  "reuse only the two canonical file-saving sources");
assert.match(gradle, /assets\.srcDirs = \[\]/);
assert.match(gradle, /jniLibs\.srcDirs = \[\]/);
assert.match(gradle, /ignoreAssetsPattern = '\*'/);
assert.match(gradle, /jniLibs\.excludes \+= \['\*\*\/\*\.so'\]/);
assert.doesNotMatch(gradle, /implementation project\(['"]:app['"]\)|admob|externalNativeBuild|signingConfigs/,
  "do not depend on ERP, ads, native AI builds or its signing configuration");

for (const file of ["android/media-validation/src/main/AndroidManifest.xml", "android/media-validation/src/androidTest/AndroidManifest.xml"]) {
  const xml = read(file);
  for (const permission of ["INTERNET", "ACCESS_NETWORK_STATE"]) {
    assert.match(xml, new RegExp(`android:name="android\\.permission\\.${permission}" tools:node="remove"`));
  }
  assert.match(xml, /android:allowBackup="false"/);
  assert.doesNotMatch(xml, /<activity\b|<service\b|<receiver\b|<provider\b/);
  const requested = xml.match(/<uses-permission\b[^>]*>/g) || [];
  assert(requested.every((element) => element.includes('tools:node="remove"')), "no personal-data/network permissions may be added");
}
assert.match(test, /@Before\s+public void requireIsolatedNetworklessTargetBeforeAnyWrite/);
assert(test.indexOf("@Before") < test.indexOf("@Test"));
for (const guard of ["assertEquals(TARGET_PACKAGE, context.getPackageName())", "assertEquals(TEST_PACKAGE, testContext.getPackageName())",
  "checkPermission(Manifest.permission.INTERNET, TARGET_PACKAGE)", "checkPermission(Manifest.permission.INTERNET, TEST_PACKAGE)",
  "target.activities == null || target.activities.length == 0", "getLaunchIntentForPackage(TARGET_PACKAGE)",
  "created.containsKey(uri)", "MediaStore.MediaColumns.OWNER_PACKAGE_NAME", "assertEquals(DIRECTORY, cursor.getString(1))",
  "assertEquals(TARGET_PACKAGE, cursor.getString(2))"]) assert(test.includes(guard), `required guard absent: ${guard}`);
assert.match(test, /@After\s+public void removeOnlyNewUrisWithConfirmedOwnerNameAndDirectory/);
assert.match(test, /requireOwnedFixture\(entry\.getKey\(\), entry\.getValue\(\)\);\s*assertEquals\([\s\S]*?resolver\.delete\(entry\.getKey\(\), null, null\)/);
assert.doesNotMatch(test, /startActivity\(|MainActivity|Runtime\.getRuntime|delete\(MediaStore\.Downloads\.EXTERNAL_CONTENT_URI/,
  "test may not launch ERP or delete a collection");
assert.equal((test.match(/@Test\b/g) || []).length, 12);
console.log("MEDIA VALIDATION: opt-in, distinct IDs, no network/assets/native code, canonical-source whitelist and scoped fixture cleanup PASS (static contracts only).");
