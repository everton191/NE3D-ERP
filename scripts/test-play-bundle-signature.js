"use strict";
const assert = require("node:assert/strict");
const { validateJarsignerVerification: verify, verifyUploadCertificate, JARSIGNER_VERIFY_LOCALE_ARGS } = require("./lib/play-bundle-signature");
const cases = [
  [0, "jar verified.\n", "", true],
  [0, "\njar verified.\nWarning: signer certificate is self-signed.", "", true],
  [1, "", "tool not found", false],
  [null, "jar verified.", "", false],
  [0, "", "", false],
  [0, "jar is unsigned.", "", false],
  [1, "jar verified.", "digest error", false],
  [0, "jar verified.\nThis jar contains unsigned entries", "", false],
  [0, "jarsigner: java.lang.SecurityException: digest error", "", false],
  [0, "pretend jar verified. message", "", false]
];
for (const [exitCode, stdout, stderr, expected] of cases) assert.equal(verify({ exitCode, stdout, stderr }).verified, expected);
assert.equal(verifyUploadCertificate({ certificatePem: "bad", expectedSha256: "" }).verified, false);
assert.equal(verifyUploadCertificate({ certificatePem: "bad", expectedSha256: "a".repeat(64) }).verified, false);
assert.deepEqual(JARSIGNER_VERIFY_LOCALE_ARGS, ["-J-Duser.language=en", "-J-Duser.country=US"]);
console.log("PASS 12 fail-closed signature/certificate cases and fixed verification locale; real certificate checked by the bundle inspector.");
