const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = path.join(__dirname, "prepare-web.js");
const source = fs.readFileSync(script, "utf8");
const boundary = source.indexOf("const files = [");
assert(boundary > 0, "Fingerprint must precede build output writes");
const inputs = ["src/features/config/config-appearance.js", "src/features/account/account-security.js"];

function fingerprint(changed) {
  // Execute the canonical hash calculation, with only an in-memory input change.
  const fakeFs = { existsSync: fs.existsSync, readFileSync(file) {
    const bytes = fs.readFileSync(file);
    return changed && path.resolve(file) === path.resolve(__dirname, "..", changed)
      ? Buffer.concat([bytes, Buffer.from("\n// synthetic fingerprint change\n")]) : bytes;
  } };
  return vm.runInNewContext(`(() => { ${source.slice(0, boundary)}
    return { buildId, buildInputs }; })()`, {
    __dirname, process: { argv: [] },
    require: (name) => name === "fs" ? fakeFs : require(name)
  });
}

const first = fingerprint(false);
for (const input of inputs) {
  assert(first.buildInputs.includes(input), `${input} must invalidate the web/service-worker build`);
  assert.notEqual(first.buildId, fingerprint(input).buildId, `${input} must change the build ID`);
}
assert.equal(first.buildId, fingerprint(false).buildId, "Unchanged inputs must have a deterministic build ID");
console.log("PASS deterministic web fingerprint includes appearance/account-security changes; no files rewritten by this test.");
