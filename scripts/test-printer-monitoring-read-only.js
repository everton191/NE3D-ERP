const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

const app = read("app.js");
const style = read("style.css");
const service = read("src/services/printerMonitoringService.js");
const migration = read("supabase/migrations/20260630130000_printer_monitoring_read_only.sql");
const edge = read("supabase/functions/printer-monitor/index.ts");
const index = read("index.html");
const prepareWeb = read("scripts/prepare-web.js");
const serviceWorker = read("sw.js");
const localAgent = read("tools/simplifica-local-agent/agent.js");
const bambuLanPlugin = read("android/app/src/main/java/br/com/ne3d/erp/SimplificaBambuLanPlugin.java");
const androidMain = read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java");
const androidBuild = read("android/app/build.gradle");

[
  'impressoras: "Impressoras"',
  '{ tela: "impressoras", icone: "impressoras", texto: "Impressoras" }',
  'case "impressoras"',
  "function renderImpressoras()",
  "function abrirCadastroImpressora",
  "function atualizarStatusImpressora",
  "function abrirStatusManualImpressora",
  "function abrirVinculoPedidoImpressora",
  "function abrirHistoricoImpressora",
  "function abrirAgentesLocais",
  "printer_registry",
  "printer_monitoring",
  "printer_remote_control"
].forEach((marker) => assert.ok(app.includes(marker), `app deve conter ${marker}`));

assert.ok(index.includes("printerMonitoringService.js"), "servico de impressoras deve carregar antes do app");
assert.ok(prepareWeb.includes("src/services/printerMonitoringService.js"), "build deve copiar o servico de impressoras");
assert.ok(serviceWorker.includes("./src/services/printerMonitoringService.js"), "PWA deve armazenar o servico de impressoras");
assert.ok(service.includes("PrinterMonitoringService"), "servico global deve existir");
assert.ok(service.includes("calculateCosts"), "servico deve calcular custos da impressora");
assert.ok(service.includes("testBrowserLocal"), "servico deve testar leitura na rede local");
assert.ok(style.includes(".printer-grid"), "layout de impressoras deve existir");
assert.ok(style.includes(".printer-empty-onboarding"), "estado vazio deve permanecer centralizado e responsivo");
assert.ok(style.includes(".printer-bambu-step"), "etapas Bambu devem possuir cards responsivos próprios");
assert.ok(style.includes(".printer-wizard"), "fluxo de cadastro deve existir");
assert.ok(app.includes("const PRINTER_FEATURE_ENABLED = true"), "guia de impressoras deve estar habilitada para o piloto");
assert.ok(app.includes("BAMBU_PILOT_PROGRESS_STORAGE_PREFIX"), "piloto Bambu deve possuir armazenamento local próprio");
assert.ok(app.includes("function abrirGuiaPilotoBambu"), "guia de transparência do piloto Bambu deve existir");
assert.ok(app.includes("function salvarProgressoPilotoBambu"), "progresso local do piloto Bambu deve ser persistido");
assert.ok(app.includes('const bambuManaged = connector === "bambu"'), "cadastro Bambu deve isolar credenciais do formulário comum");
assert.ok(app.includes('api_token: bambuManaged ? ""'), "cadastro Bambu não deve enviar token pelo formulário comum");
assert.ok(app.includes('password: bambuManaged ? ""'), "cadastro Bambu não deve enviar senha pelo formulário comum");
assert.ok(app.includes('if (APP_VERSION.includes("-pilot")) return false'), "APK piloto não deve oferecer o feed estável como atualização");
assert.ok(app.includes("será descartado depois da chamada"), "descarte da senha após autenticação deve permanecer explícito");
assert.ok(app.includes("A Bambu pode alterar, limitar ou revogar o acesso"), "risco de alteração ou revogação deve permanecer explícito");
assert.ok(app.includes("function abrirPainelImpressora"), "cartão deve abrir painel detalhado da impressora");
const printerPanelSource = app.match(/function abrirPainelImpressora\([\s\S]*?function getPrinterConnectorLabel/)?.[0] || "";
assert.doesNotMatch(printerPanelSource, /printer-camera-preview|Conectar pela rede local|abrirConfiguracaoBambuLan/, "painel cloud não deve oferecer câmera ou conexão LAN");
assert.ok(app.includes("function getRegisteredPrinterForProductionJob"), "fila de produção deve localizar a impressora monitorada");
assert.ok(app.includes("function sincronizarImpressorasMonitoradasComProducao"), "impressoras monitoradas devem aparecer automaticamente na Produção em outros dispositivos");
assert.ok(app.includes("const requestId = ++printerMonitoringState.requestId"), "hidratação deve preservar o identificador da requisição entre dispositivos");
assert.ok(app.includes("printer-order-printer-link"), "impressora vinculada na produção deve abrir seu painel");
assert.ok(app.includes("function abrirImpressoraDaProducao"), "produção deve abrir painel ou encaminhar ao cadastro da impressora");
assert.ok(app.includes('productionPrinterName || "Adicionar impressora"'), "produção sem máquina deve exibir ação para adicionar impressora");
assert.ok(app.includes('preset: "manual"'), "cadastro vindo da produção deve preservar a escolha do tipo de conexão");
assert.ok(app.includes("Acompanhamento somente leitura"), "painel detalhado deve explicar o limite de leitura");
assert.ok(style.includes(".printer-device-panel"), "painel detalhado deve ter layout responsivo próprio");
assert.ok(style.includes(".printer-device-overview-grid.monitoring-only"), "trabalho atual deve ocupar toda a largura sem o card de câmera");
assert.ok(app.includes("function renderPrinterMoreActions"), "ações secundárias devem ser agrupadas em um único submenu");
assert.ok(app.includes("function abrirMenuAcoesImpressora"), "botão Mais deve abrir um menu explícito compatível com Android");
assert.ok(style.includes(".printer-actions-sheet-list"), "submenu de impressoras deve possuir layout próprio");
assert.ok(app.includes("function abrirPainelImpressoraProducao"), "cadastro manual da Produção deve abrir a impressora monitorada correspondente");
assert.ok(app.includes("getRegisteredPrinterForProductionPrinter"), "Produção deve associar cadastro manual e monitorado por nome ou modelo");
assert.ok(app.includes("Conectada · dados básicos"), "nuvem sem telemetria não pode aparentar impressão plenamente sincronizada");
assert.ok(app.includes("function aplicarStatusBambuLan"), "telemetria MQTT local deve alimentar o painel da impressora");
assert.ok(app.includes("function atualizarFrameCameraBambuLan"), "painel deve solicitar imagem da câmera pelo plugin Android");
assert.ok(androidMain.includes("registerPlugin(SimplificaBambuLanPlugin.class)"), "plugin Bambu LAN deve ser registrado no Android");
assert.ok(androidBuild.includes("org.eclipse.paho.client.mqttv3:1.2.5"), "APK deve incluir cliente MQTT nativo versionado");
assert.ok(bambuLanPlugin.includes('"ssl://" + ip + ":" + MQTT_PORT'), "plugin deve conectar diretamente ao MQTT TLS da impressora");
assert.ok(bambuLanPlugin.includes('"device/" + serial + "/report"'), "plugin deve assinar o tópico de telemetria da impressora");
assert.ok(bambuLanPlugin.includes('pushing.put("command", "pushall")'), "plugin deve solicitar o estado completo após conectar");
assert.ok(bambuLanPlugin.includes("KEY_ACCESS_CODE") && bambuLanPlugin.includes("SimplificaSecurePreferences"), "código LAN deve permanecer protegido pelo Android Keystore");
assert.ok(bambuLanPlugin.includes("CAMERA_PORT = 6000") && bambuLanPlugin.includes("header.putInt(4, 0x3000)"), "A1 deve usar autenticação nativa da câmera local");
assert.ok(app.includes("function renderEtapasLoginBambu"), "login Bambu deve apresentar etapas guiadas");
assert.ok(app.includes("Etapa 1 de 5") && app.includes("Etapa 4 de 5"), "fluxo Bambu deve informar o avanço ao usuário");
assert.ok(app.includes("function renderizarConclusaoBambu"), "fluxo Bambu deve terminar com confirmação e acesso ao painel");
assert.ok(style.includes(".printer-bambu-steps"), "etapas Bambu devem possuir indicador visual responsivo");
assert.ok(app.includes("bambuLoginDraftState"), "login Bambu deve manter rascunho somente em memória durante a troca de aplicativo");
assert.ok(app.includes("A conta Bambu já está conectada. Use Desconectar Bambu antes de entrar novamente."), "conta Bambu ativa não deve permitir logins repetidos");
assert.ok(edge.includes('if (!firstConnection) throw new Error("BAMBU_ACCOUNT_ALREADY_CONNECTED")'), "backend deve rejeitar novo login enquanto a conta Bambu estiver conectada");
const bambuDraftSource = app.match(/const bambuLoginDraftState = \{[\s\S]*?\n};/)?.[0] || "";
assert.doesNotMatch(bambuDraftSource, /localStorage|sessionStorage|salvar|supabase/i, "rascunho sensível Bambu não pode ser persistido");
assert.ok(app.includes('password: code?.value ? "" : password?.value || ""'), "código de verificação não pode ser enviado junto com a senha");
assert.ok(style.includes(".printer-pilot-card"), "piloto Bambu deve possuir apresentação visual própria");
assert.ok(app.includes("function aplicarPresetCadastroImpressora"), "cadastro deve oferecer configuração guiada");
assert.ok(app.includes("function atualizarEtapaCadastroImpressora"), "cadastro deve usar etapas guiadas consistentes com os pedidos");
assert.ok(style.includes(".printer-cadastro-step[hidden]{display:none !important;}"), "apenas uma etapa do cadastro pode aparecer por vez");
assert.ok(app.includes('data-printer-cadastro-step="1"'), "cadastro deve separar escolha de conexão da identificação da impressora");
assert.ok(app.includes('class="ui-tabs printer-cadastro-tabs"'), "cadastro deve usar as abas padrão do Simplifica");
assert.ok(app.includes('id="printerBambuPassword"'), "etapa Bambu deve pedir a senha sem usar o formulário manual");
assert.ok(app.includes('pattern="[0-9]{6}"'), "Bambu deve solicitar código de confirmação de seis dígitos");
assert.ok(app.includes("password: bambuPassword"), "senha Bambu digitada deve seguir somente para a autorização em memória");
assert.ok(edge.includes("const loginDetails = JSON.stringify(login || {}).toLowerCase()"), "backend deve detectar formatos alternativos de confirmação enviados pela Bambu");
assert.ok(style.includes(".printer-bambu-account-fields[hidden],.printer-lan-fields[hidden]"), "Bambu e LAN não podem exibir campos da outra opção");
assert.ok(style.includes(".ui3-dialog-portal:has(.printer-wizard)"), "cadastro mobile deve começar no topo útil abaixo da barra do aparelho");
assert.ok(style.includes("min-height:48px !important"), "botões do cadastro mobile devem ter área de toque padrão");
assert.ok(app.includes("function sincronizarConectorBambuPorIdentificacao"), "selecionar marca ou modelo Bambu deve ativar o fluxo automático");
assert.ok(app.includes('save.textContent = "Confirmar cadastro"'), "ação final deve ser neutra: a escolha Bambu acontece no card inicial");
assert.ok(style.includes(".printer-form-simple.is-bambu-quick .printer-simple-fields > :not(.field-wide)"), "fluxo Bambu não deve exibir campos manuais desnecessários");
assert.ok(app.includes("function conectarBambuMqttCloudAutomatico"), "Bambu cadastrada deve atualizar automaticamente para MQTT no aplicativo");
assert.ok(app.includes('const cameraLan = Boolean(getBambuLanPlugin() && bambuLanState.configured)'), "câmera deve depender de configuração LAN própria, mesmo com MQTT cloud");
assert.ok(app.includes("function marcarAtualizacaoVisualEmSegundoPlano"), "sincronização geral não deve remontar a tela ativa e perder o scroll");
assert.ok(app.includes("function atualizarElementosStatusBambu"), "telemetria deve atualizar somente os elementos visíveis sem remontar a tela");
assert.ok(app.includes('data-printer-live="progress"'), "progresso deve possuir alvo de atualização incremental");
assert.ok(app.includes("function getProductionPrinterLiveInfo"), "produção deve considerar o estado MQTT da impressora monitorada");
assert.ok(app.includes('data-printer-live="production-task"'), "produção deve exibir incrementalmente o arquivo em impressão");
assert.ok(app.includes("function getImpressoesExternasMonitoradas"), "produção deve contar impressões MQTT sem pedido vinculado");
assert.ok(app.includes("Impressão iniciada fora do Simplifica · nenhum pedido vinculado."), "impressão externa não pode criar pedido falso");
assert.ok(app.includes("function abrirVinculoImpressaoBambuPedido"), "impressão externa deve poder ser vinculada a uma tarefa da fila");
assert.ok(app.includes("function abrirConfirmacaoConclusaoImpressaoBambu"), "término MQTT deve pedir confirmação antes de concluir pedido");
assert.ok(app.includes("Confirmar placa concluída"), "pedido com várias placas deve confirmar cada placa antes de avançar");
assert.ok(app.includes("const concluido = completed >= total"), "pedido só pode ficar pronto após confirmar a quantidade total de placas");
assert.ok(app.includes("if (total === 1) return confirmarConclusaoImpressaoBambu(job.id)"), "pedido de uma placa deve concluir somente após o término confirmado pela máquina");
assert.ok(app.includes("bambu_vinculo_editado"), "vínculo de impressão deve permitir edição");
assert.ok(app.includes("function registrarFalhaImpressaoBambu"), "falha ou cancelamento MQTT não pode contabilizar mesa concluída");
assert.ok(app.includes("nenhuma mesa foi contabilizada"), "histórico deve diferenciar tentativa com erro de conclusão");
assert.ok(app.includes("Minha Bambu Lab"), "cadastro deve destacar o caminho Bambu com linguagem simples");
assert.ok(app.includes('data-printer-setup="lan"'), "cadastro deve oferecer fluxo guiado para impressora pela rede local");
assert.ok(app.includes("Rede local (LAN)"), "modo manual deve ser apresentado como rede local");
assert.ok(app.includes('id="printerLanAddress"'), "fluxo LAN deve guardar o endereço da impressora sem exigir conta");
assert.ok(app.includes("function atualizarOrientacaoLanCadastro"), "LAN deve orientar como localizar o IP por marca");
assert.ok(app.includes("atualizarEtapaCadastroImpressora(2)"), "escolher Bambu ou LAN deve avançar diretamente para a próxima etapa");
assert.ok(edge.includes("automaticConnectors.has(connectorType)"), "limite do plano deve continuar restrito a conectores automáticos, não ao cadastro manual pela rede");
assert.ok(app.includes('else aplicarPresetCadastroImpressora(initial?.preset === "manual" ? "lan" : "bambu")'), "novo cadastro comum deve iniciar no Bambu e tratar a origem manual como rede local");
assert.ok(app.includes("function renderPrinterOrderQueue"), "guia de impressoras deve reunir a fila operacional");
assert.ok(app.includes('data-action="printer-edit"'), "impressoras devem oferecer edição explícita");
assert.ok(app.includes("Remover</button>"), "impressoras devem oferecer remoção explícita");
assert.ok(app.includes("O histórico operacional será preservado"), "remoção deve explicar preservação do histórico");
assert.ok(app.includes("Impressora removida da lista e credenciais apagadas"), "remoção deve confirmar a limpeza das credenciais");
assert.ok(app.includes("Pagamento e entrega continuam em Pedidos"), "guia de impressoras deve separar produção do fluxo comercial");
assert.ok(app.includes("Cadastro manual ilimitado. Automáticas: 1 no Free, até 3 no Start e sem limite no Pro."), "interface deve explicar a cota de impressoras automáticas");
assert.ok(app.includes('printer_monitoring: { label: "Monitoramento de impressoras", requiredPlan: "free"'), "monitoramento automático deve estar disponível no Free");
assert.ok(style.includes(".printer-order-stages"), "fila de impressão deve manter três etapas responsivas");
assert.doesNotMatch(app.match(/function renderProducao\(\)[\s\S]*?function renderClientes\(\)/)?.[0] || "", /\["entregues",\s*"Entregues"\]|\["pagos",\s*"Pagos"\]/, "produção não deve expor abas comerciais");
assert.ok(app.includes("printer-form-simple"), "cadastro padrão deve usar formulário simplificado");
assert.ok(app.includes("printer-simple-fields"), "campos essenciais devem aparecer primeiro");
assert.ok(app.includes("printer-advanced-settings"), "campos técnicos devem ficar em configuração avançada");
assert.ok(app.includes("getPrinterModelSuggestionOptions"), "modelo deve oferecer sugestões sem exigir seleção técnica");
assert.ok(app.includes('id="printerSaveButton"'), "ação de salvar deve estar sempre visível");
assert.ok(app.includes("const saved = await printerBackendRequest"), "cadastro deve usar resposta confirmada do backend");
assert.ok(app.includes("printerMonitoringState.items.unshift(saved)"), "cadastro confirmado deve atualizar a lista imediatamente");
assert.doesNotMatch(app, /data-printer-step="4"|moverEtapaCadastroImpressora|printerWizardNext/, "cadastro não deve exigir assistente de quatro etapas");
assert.ok(app.includes('data-printer-cadastro-step="1"') && app.includes('data-printer-cadastro-step="3"'), "cadastro deve manter somente o fluxo guiado de três etapas");
const refreshStatusSource = app.match(/async function atualizarStatusImpressora\(id\)[\s\S]*?\n}\n/)?.[0] || "";
assert.ok(refreshStatusSource.includes("hidratarImpressorasSeNecessario(true, false)"), "atualização não deve reconstruir a tela da impressora");
assert.ok(refreshStatusSource.includes("atualizarElementosStatusBambu(impressoraAtualizada)"), "atualização deve preservar o painel e alterar apenas os dados visíveis");
assert.doesNotMatch(refreshStatusSource, /trocarTela|logout|sairDoSistema|fecharPopup/, "atualização de status não pode navegar ou encerrar a sessão");
assert.ok(style.includes(".printer-advanced-settings"), "configuração avançada deve possuir layout próprio");
assert.ok(app.includes('class="btn" id="printerSaveButton"'), "ação principal deve usar o mesmo botão padrão das etapas de Pedido");
assert.match(app, /Object\.assign\(window,\s*\{[\s\S]*abrirCadastroImpressora,[\s\S]*atualizarMarcaCadastroImpressora,[\s\S]*atualizarCamposConectorImpressora,[\s\S]*testarConexaoCadastroImpressora,/, "ações inline do cadastro devem estar ligadas explicitamente à interface global");

[
  "create table if not exists public.printer_brands",
  "create table if not exists public.printer_models",
  "create table if not exists public.printer_connector_types",
  "create table if not exists public.printer_brand_connector_suggestions",
  "create table if not exists public.printers",
  "create table if not exists public.printer_status_snapshots",
  "create table if not exists public.printer_order_links",
  "create table if not exists public.printer_events",
  "create table if not exists public.local_agents",
  "create table if not exists public.local_agent_printers",
  "credential_ciphertext text",
  "supports_remote_control is false",
  "alter table public.printers enable row level security",
  "grant insert, update, delete on public.printers",
  "to service_role",
  "'printer_remote_control'",
  '"enabled":false'
].forEach((marker) => assert.ok(migration.includes(marker), `migration deve conter ${marker}`));

assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i, "RLS nao pode ser aberta");
assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)[^;]+to\s+authenticated/i, "frontend nao pode escrever diretamente");

[
  'action === "list"',
  'action === "save"',
  'action === "test_connection"',
  'action === "fetch_status"',
  'action === "manual_status"',
  'action === "link_order"',
  'action === "history"',
  'action === "disable"',
  'action === "create_agent"',
  'action === "agent_status"',
  'action === "bambu_login"',
  'action === "bambu_select_device"',
  'action === "bambu_disconnect"',
  "AES-GCM",
  "PRINTER_CREDENTIALS_SECRET",
  "LOCAL_NETWORK_REQUIRES_AGENT",
  "local_agent_printers",
  "read_only: true"
].forEach((marker) => assert.ok(edge.includes(marker), `edge function deve conter ${marker}`));

assert.ok(edge.includes("function automaticConnectorLimit"), "backend deve separar limite automático do cadastro manual");
assert.ok(edge.includes('if (plan === "free") return 1'), "Free deve permitir uma impressora automática");
assert.doesNotMatch(edge, /if \(plan === "start"\) return 3/, "planos pagos devem acompanhar todas as impressoras Bambu da conta");
assert.ok(edge.includes("free_plan_last_printer_only"), "Free deve informar quando a conta possui mais de uma impressora e exibir apenas a última");
assert.ok(edge.includes("imported_printer_ids"), "planos pagos devem importar as demais impressoras da conta Bambu");
assert.ok(edge.includes('.in("connector_type", Array.from(automaticConnectors))'), "cota deve contar somente conectores automáticos");
assert.ok(edge.includes('throw new Error("AUTOMATIC_PRINTER_LIMIT_REACHED")'), "backend deve retornar erro específico da cota automática");
assert.doesNotMatch(edge, /context\.plan !== "pro"\) throw new Error\("(?:AUTOMATIC_CONNECTOR_REQUIRES_PRO|LOCAL_AGENT_REQUIRES_PRO)"\)/, "Free não deve ser bloqueado de conexão automática ou agente local");
assert.ok(edge.includes("credential_ciphertext: credentialCiphertext"), "token Bambu deve ser persistido somente cifrado");
assert.ok(edge.includes('device.dev_online === true ? "unknown" : "offline"'), "Bambu sem estado de tarefa não pode aparecer como ociosa apenas por estar online");
assert.doesNotMatch(edge, /return\s*\{[^}]*accessToken/s, "token Bambu não pode ser retornado ao aplicativo");
assert.doesNotMatch(edge, /metadata:\s*\{[^}]*password/s, "senha Bambu não pode ser registrada em eventos");

const forbiddenActions = [
  "start_print",
  "pause_print",
  "resume_print",
  "cancel_print",
  "send_file",
  "set_temperature",
  "move_axis",
  "run_gcode"
];
forbiddenActions.forEach((action) => {
  assert.doesNotMatch(edge, new RegExp(`action\\s*===\\s*["']${action}["']`, "i"), `acao proibida encontrada: ${action}`);
  assert.doesNotMatch(app, new RegExp(`onclick=["'][^"']*${action}`, "i"), `botao proibido encontrado: ${action}`);
});

assert.doesNotMatch(edge, /fetch\([^)]*\/api\/(printer|job)[^)]*,\s*\{[^}]*method:\s*["']POST/i, "OctoPrint deve ser somente leitura");
assert.doesNotMatch(edge, /printer\/gcode\/script|move\/axis|temperature\/set/i, "Moonraker nao pode receber comandos");
assert.ok(localAgent.includes("Somente leitura"), "agente local deve declarar modo somente leitura");
assert.ok(localAgent.includes('action: "agent_status"'), "agente local deve enviar apenas snapshots");
assert.doesNotMatch(localAgent, /createServer|listen\s*\(/, "agente local nao deve abrir porta");
assert.ok(localAgent.includes("startBambuMqttMonitor"), "agente local deve receber relatórios Bambu por MQTT");
assert.doesNotMatch(localAgent, /\.publish\s*\(/, "agente local não pode publicar comandos Bambu");

console.log("Printer monitoring read-only tests OK");
