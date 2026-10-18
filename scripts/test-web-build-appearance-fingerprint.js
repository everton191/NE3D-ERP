const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = path.join(__dirname, "prepare-web.js");
const source = fs.readFileSync(script, "utf8");
const boundary = source.indexOf("const files = [");
assert(boundary > 0, "Fingerprint must precede build output writes");
const input = "src/features/config/config-appearance.js";
const absolute = path.resolve(__dirname, "..", input);

function fingerprint(changed) {
  // Execute the canonical hash calculation, with only an in-memory input change.
  const fakeFs = { existsSync: fs.existsSync, readFileSync(file) {
    const bytes = fs.readFileSync(file);
    return changed && path.resolve(file) === absolute
      ? Buffer.concat([bytes, Buffer.from("\n// synthetic fingerprint change\n")]) : bytes;
  } };
  return vm.runInNewContext(`(() => { ${source.slice(0, boundary)}
    return { buildId, buildInputs }; })()`, {
    __dirname, process: { argv: [] },
    require: (name) => name === "fs" ? fakeFs : require(name)
  });
}

const first = fingerprint(false);
assert(first.buildInputs.includes(input), "Appearance corrections must invalidate the web/service-worker build");
assert.equal(first.buildId, fingerprint(false).buildId, "Unchanged inputs must have a deterministic build ID");
assert.notEqual(first.buildId, fingerprint(true).buildId, "Changing the canonical appearance source must change the build ID");
console.log("PASS deterministic web fingerprint includes appearance changes; no files rewritten by this test.");
