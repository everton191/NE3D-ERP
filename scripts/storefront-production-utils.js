const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const MAIN_PROJECT_REF = "qsufnnivlgdidmjuaprb";
const STAGING_PROJECT_REF = "dcaqiatgftkjxyewlhgi";
const TEMP_PROJECT_REF_PATH = path.join(ROOT, "supabase/.temp/project-ref");

function getCurrentLinkedProjectRef() {
  if (!fs.existsSync(TEMP_PROJECT_REF_PATH)) return "";
  return fs.readFileSync(TEMP_PROJECT_REF_PATH, "utf8").trim();
}

function assertLinkedToMain() {
  const linkedRef = getCurrentLinkedProjectRef();
  if (linkedRef !== MAIN_PROJECT_REF) {
    throw new Error(`Ref atual nao e o principal. Atual: ${linkedRef || "nenhum"}. Esperado: ${MAIN_PROJECT_REF}.`);
  }
}

function assertControlledProductionConfirm() {
  if (String(process.env.PRODUCTION_CONTROLLED_CONFIRM || "").toLowerCase() !== "true") {
    throw new Error("PRODUCTION_CONTROLLED_CONFIRM=true e obrigatorio para operacoes controladas no principal.");
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const windowsCommand = process.platform === "win32";
    const normalizedCommand = windowsCommand ? ({ npx: "npx.cmd", npm: "npm.cmd" }[command] || command) : command;
    const executable = windowsCommand ? (process.env.ComSpec || "cmd.exe") : normalizedCommand;
    const commandArgs = windowsCommand ? ["/d", "/s", "/c", normalizedCommand, ...args] : args;
    const child = spawn(executable, commandArgs, {
      cwd: ROOT,
      stdio: "inherit",
      shell: false,
      ...options,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} saiu com codigo ${code}.`));
    });
    child.on("error", reject);
  });
}

function supabaseArgs(args) {
  return ["supabase", ...args];
}

module.exports = {
  MAIN_PROJECT_REF,
  ROOT,
  STAGING_PROJECT_REF,
  assertControlledProductionConfirm,
  assertLinkedToMain,
  getCurrentLinkedProjectRef,
  run,
  supabaseArgs,
};
