const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { bambuPrintToSnapshot } = require("./bambu-cloud");

const snapshot = bambuPrintToSnapshot({
  gcode_state: "RUNNING",
  mc_percent: 42,
  mc_remaining_time: 17,
  nozzle_temper: 215.5,
  nozzle_target_temper: 220,
  bed_temper: 59.8,
  bed_target_temper: 60,
  layer_num: 21,
  total_layer_num: 100,
  subtask_name: "teste.3mf",
  ams: { ams: [] },
});

assert.equal(snapshot.state, "printing");
assert.equal(snapshot.progress_percent, 42);
assert.equal(snapshot.remaining_seconds, 1020);
assert.equal(snapshot.nozzle_temp, 215.5);
assert.equal(snapshot.current_file, "teste.3mf");
assert.equal(snapshot.raw_payload.layer_num, 21);
assert.equal(snapshot.raw_payload.total_layer_num, 100);

const agent = fs.readFileSync(path.join(__dirname, "agent.js"), "utf8");
const setup = fs.readFileSync(path.join(__dirname, "bambu-setup.js"), "utf8");
assert.ok(agent.includes("startBambuMqttMonitor"), "agente deve assinar status Bambu por MQTT");
assert.ok(agent.includes("unprotectToken"), "agente deve abrir o token protegido apenas localmente");
assert.doesNotMatch(agent, /device\/\$\{[^}]+\}\/request|\.publish\s*\(/, "agente Bambu não pode publicar comandos MQTT");
assert.ok(setup.includes("askHidden"), "senha deve ser digitada sem eco no terminal");
assert.ok(setup.includes("protectToken(auth.accessToken)"), "token Bambu deve ser protegido antes de persistir");
assert.doesNotMatch(setup, /config\.(password|account)|config\[["'](?:password|account)["']\]/i, "arquivo de configuração não deve persistir conta ou senha");

console.log("Bambu cloud agent tests OK");
