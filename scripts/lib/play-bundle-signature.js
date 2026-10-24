"use strict";

const { X509Certificate } = require("node:crypto");
const JARSIGNER_VERIFY_LOCALE_ARGS = ["-J-Duser.language=en", "-J-Duser.country=US"];

function validateJarsignerVerification({ exitCode, stdout = "", stderr = "" }) {
  const output = `${stdout}\n${stderr}`;
  if (exitCode !== 0) return { verified: false, reason: "verification-process-failed" };
  if (/jar is unsigned|unsigned entries|signatures? (?:are |is )?(?:invalid|not parsable)|digest error|SecurityException/i.test(output)) {
    return { verified: false, reason: "unsigned-or-invalid-content" };
  }
  return /^\s*jar verified\.\s*$/mi.test(output)
    ? { verified: true, reason: "verified" }
    : { verified: false, reason: "positive-verification-missing" };
}

function verifyUploadCertificate({ certificatePem, expectedSha256 }) {
  const expected = String(expectedSha256 || "").replace(/:/g, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(expected)) return { verified: false, reason: "expected-certificate-missing" };
  try {
    const certificate = new X509Certificate(certificatePem);
    const fingerprintSha256 = certificate.fingerprint256.replace(/:/g, "").toLowerCase();
    const subject = certificate.subject;
    const verified = fingerprintSha256 === expected && !/Android\s*Debug/i.test(subject);
    return { verified, reason: verified ? "verified" : "unexpected-or-debug-certificate", fingerprintSha256, subject };
  } catch (_) { return { verified: false, reason: "certificate-unreadable" }; }
}

module.exports = { JARSIGNER_VERIFY_LOCALE_ARGS, validateJarsignerVerification, verifyUploadCertificate };
