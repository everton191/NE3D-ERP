const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { getBambuAccount, listBambuDevices, loginBambu, protectToken } = require("./bambu-cloud");

const configPath = path.resolve(process.argv[2] || process.env.SIMPLIFICA_AGENT_CONFIG || "config.json");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(String(answer || "").trim())));

function askHidden(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Execute este assistente em um terminal interativo para ocultar a senha.");
  }
  rl.pause();
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      rl.resume();
    };
    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      if (text === "\u0003") {
        finish();
        reject(new Error("Operacao cancelada."));
        return;
      }
      if (text === "\r" || text === "\n") {
        finish();
        resolve(value);
        return;
      }
      if (text === "\u0008" || text === "\u007f") value = value.slice(0, -1);
      else if (!/[\u0000-\u001f]/.test(text)) value += text;
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  if (process.platform !== "win32") throw new Error("Este assistente protege o token com o DPAPI do Windows.");
  if (!fs.existsSync(configPath)) throw new Error(`Crie primeiro o arquivo de configuracao: ${configPath}`);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  console.log("A senha sera usada somente nesta autenticacao e nao sera gravada.");
  const account = await ask("E-mail da conta Bambu: ");
  const useCode = (await ask("Usar codigo de verificacao em vez da senha? (s/N): ")).toLowerCase() === "s";
  const secret = useCode ? await ask("Codigo de verificacao: ") : await askHidden("Senha (entrada oculta): ");
  const auth = await loginBambu({ account, ...(useCode ? { code: secret } : { password: secret }) });
  const [accountInfo, devices] = await Promise.all([getBambuAccount(auth.accessToken), listBambuDevices(auth.accessToken)]);
  if (!devices.length) throw new Error("Nenhuma impressora vinculada foi encontrada na conta Bambu.");
  devices.forEach((device, index) => console.log(`${index + 1}. ${device.name} - ${device.model} - ${device.online ? "online" : "offline"}`));
  const selectedIndex = Number(await ask("Numero da impressora para vincular: ")) - 1;
  const selected = devices[selectedIndex];
  if (!selected) throw new Error("Selecao invalida.");
  const simplificaId = await ask("UUID da impressora cadastrada no Simplifica: ");
  if (!/^[0-9a-f-]{36}$/i.test(simplificaId)) throw new Error("UUID do Simplifica invalido.");
  const existing = Array.isArray(config.printers) ? config.printers : [];
  const printer = {
    id: simplificaId,
    name: selected.name,
    connector: "bambu",
    bambuDeviceId: selected.id,
    bambuMqttUsername: accountInfo.mqttUsername,
    bambuProtectedToken: protectToken(auth.accessToken),
  };
  config.printers = [...existing.filter((item) => String(item.id) !== simplificaId), printer];
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(`Vinculo salvo em ${configPath}. A senha foi descartada; somente o token protegido pelo usuario do Windows foi persistido.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
}).finally(() => rl.close());
