const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const MAIN_PROJECT_REF = "qsufnnivlgdidmjuaprb";
const ENV_PATH = path.join(ROOT, ".env.staging");
const TEMP_PROJECT_REF_PATH = path.join(ROOT, "supabase/.temp/project-ref");

function loadStagingEnv() {
  const env = { ...process.env };
  if (fs.existsSync(ENV_PATH)) {
    const contents = fs.readFileSync(ENV_PATH, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in env) || !env[key]) env[key] = value;
    }
  }
  return env;
}

function getStagingProjectRef(env = loadStagingEnv()) {
  return String(env.SUPABASE_STAGING_PROJECT_REF || env.SUPABASE_PROJECT_REF_STAGING || "").trim();
}

function getCurrentLinkedProjectRef() {
  if (!fs.existsSync(TEMP_PROJECT_REF_PATH)) return "";
  return fs.readFileSync(TEMP_PROJECT_REF_PATH, "utf8").trim();
}

function assertNotMainProject(ref, label = "SUPABASE_STAGING_PROJECT_REF") {
  if (!ref) throw new Error(`${label} nao configurado em .env.staging.`);
  if (ref === MAIN_PROJECT_REF) {
    throw new Error(`Bloqueado: ${label} aponta para o projeto principal (${MAIN_PROJECT_REF}).`);
  }
}

function assertStagingConfirmed(env = loadStagingEnv()) {
  if (String(env.STAGING_CONFIRM || "").toLowerCase() !== "true") {
    throw new Error("STAGING_CONFIRM=true e obrigatorio para qualquer acao remota de staging.");
  }
}

function assertLinkedToStaging(env = loadStagingEnv()) {
  const stagingRef = getStagingProjectRef(env);
  assertNotMainProject(stagingRef);
  const linkedRef = getCurrentLinkedProjectRef();
  if (linkedRef !== stagingRef) {
    throw new Error(`Projeto local esta linkado em ${linkedRef || "nenhum"}, nao no staging ${stagingRef}. Rode npm run supabase:staging:link depois de configurar .env.staging.`);
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
  ENV_PATH,
  MAIN_PROJECT_REF,
  ROOT,
  assertLinkedToStaging,
  assertNotMainProject,
  assertStagingConfirmed,
  getCurrentLinkedProjectRef,
  getStagingProjectRef,
  loadStagingEnv,
  run,
  supabaseArgs,
};
