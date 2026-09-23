# Handoff técnico — APP.JS FINALIZATION

Data: 2026-09-21

## Checkout

- Repositório: `C:\Users\PAESS\OneDrive\Documentos\erpNE3d`
- Branch: `codex/melhorias-setembro-2026`
- HEAD/checkpoint: `fd368e611a8fd4f57056a6d7152dee4354bf1fa2` (`chore: checkpoint before final app.js extraction`)
- Versão congelada: `1.0.39 / 67`
- Publicação: somente local. Não houve reset, stash, push, GitHub, Vercel ou release.
- Não tocar: `apps/opticore` (gitlink já modificado, fora de escopo).

## Working tree

Alterações relevantes acumuladas: `app.js`, `index.html`, `scripts/prepare-web.js`, mapa de finalização, testes de Orders/Cash/Clientes/Estoque e módulos em `src/features`.

Módulos novos relevantes ainda não rastreados:

- `src/features/orders/orders-financial.js`
- `src/features/orders/orders-handlers.js`
- `src/features/orders/orders-operational-history.js`
- `src/features/cash/cash-repository.js`
- `src/features/cash/cash-sync-service.js`
- `src/features/cash/cash-commands.js`
- `src/features/cash/cash-renderer.js`
- `src/features/production/production-repository.js`
- `src/features/production/production-commands.js`
- `src/features/production/production-bambu-commands.js`
- `src/features/production/production-renderer.js`
- `src/features/customers/customers-saas-query.js`
- `src/features/inventory/inventory-handlers.js`
- `src/features/storefront/storefront-access.js`
- testes correspondentes em `scripts/`.

Não descartar mudanças existentes. O working tree local é o baseline atual.

## Métricas atuais

- `app.js`: **1.962.735 bytes / 42.377 linhas / 2.642 funções** (pós-dominios + bootstrap)
- Company: **37 exports** em 7 módulos; Users: **7 exports** em 2 módulos; Account security: **30 exports**; Config appearance/interface: **24+24**; bootstrap: `src/app/bootstrap.js`
- `dist/*.gguf`: **0**

## Domínios

| Domínio | Estado atual | Próximo corte seguro |
| --- | --- | --- |
| Orders | Parcial avançado. Bridges/adapters para financial, renderer, handlers, controller, command service e projeção operacional. | Varredura final: manter bridges; classificar documentos/Dashboard/Produção/Caixa por ownership, sem trazê-los de volta para Orders. |
| Customers | Parcial. Normalizadores, renderer e consulta SaaS separados; sugestão operacional extraída. | CustomersController/Repository/Sync/Policy, mantendo PLAN/SAAS/PERMISSION/ADMIN fora do domínio Cliente. |
| Inventory | Parcial. Normalizadores, identificadores, apresentação, rolos e handlers iniciais extraídos. | Controller/service/repository/renderer para cadastro, lotes, saída e persistência. |
| Calculator | Parcial. Fórmulas determinísticas em `CalculatorDomain`. | Controller, histórico, configuração, renderer e policy; não duplicar matemática. |
| Cash | **FINALIZED.** Métodos, repositório, `CashSyncService`, `CashCommands`/sessão e `CashRenderer`/extrato extraídos; resíduos A/B classificados (read-model, estado/tabs, adapters). | Composition root mínima/read-model somente quando houver dono; sem nova implementação de Caixa no `app.js`. |
| Production | **FINALIZED.** status, repository (12), commands (23), Bambu (15) e renderer (15) extraídos; invariantes zerados; resíduos classificados (estado/tabs, read-model, adapters, composition). | Sem novo corte; não reimplementar regra de Produção no `app.js`. |
| Printers | **FINALIZED.** PR1–PR9 (`printers-operations.js`, 86 exports, 86 deps, 86 bridges) + presentation. Solteiro `garantirImpressorasMonitoradasCarregadas` extraído. | Sem novo corte; não reimplementar regra de Impressoras no `app.js`. |
| Storefront | **FINALIZED.** SF1 access + SF2–SF29 (public, admin-render, product-editor, guided, editor, publication, storage/remote, leads/promos); 12 módulos em `src/features/storefront/` registrados; gates storefront 41 PASS + 2 baselines conhecidos. Restos intencionais: EXCLUDEs + state glue (46 fns). | Sem novo corte; não reimplementar regra de Storefront no `app.js`. |
| Config/Account/Company/Users | Config CFG1–CFG4 ✓ (`config-appearance.js` 24, `config-interface-mode.js` 24); Account ACC1–ACC3 ✓ (`account-security.js` 30/30); **Company estrutural concluído:** 7 módulos em `src/features/company/` (admin 6 + pdf-info 1 + preview 1 + delivery 25 + settings 2 + pdf-settings 1 + renderer 1 = **37 exports**), bridges + contexts no app, registrados nos 3 pontos; **Users estrutural concluído:** `users-administration-renderer` (3) + `users-administration-commands` (4) = **7 exports**, bridges `planAllowsEmployees`/`renderGestaoFuncionariosAdmin`/`renderUsuariosAdmin`/`adicionarUsuario`/… Resíduos Account/Company/Users A–D no map. | Sem novo corte de domínio; resíduos restantes = auth/billing Account (alto risco) + renderers/DOM. |
| Routing/Events/Bootstrap | **Bootstrap extraído:** `src/app/bootstrap.js` (lifecycle global, start único); `iniciarBootstrapAplicacao` = composition wiring. **Routing estrutural:** `renderTela` delega a `SimplificaScreenDispatcher.render` com mapa `renderers` + `canAccessScreen`/`renderAcessoNegado`. Restam ~96 `addEventListener` no app (DOMAIN_EVENT/temporary). | Classificar listeners por owner; routing só compat/mapa até o encerramento. |

## Orders — estado exato

Módulos canônicos: `order-normalizers`, `orders-financial`, `orders-renderer`, `orders-controller`, `orders-command-service`, `orders-handlers`, `orders-repository` e `orders-operational-history`.

O app mantém bridges de compatibilidade e injeção de dependências. Resíduos com nomes de Pedido que não são Orders: Caixa (saldo/movimentos/sync), Produção/Impressoras, documentos e Dashboard/analytics. Não migrá-los para Orders. `ORDERS=FINALIZED` ainda não é comprovado porque esses resíduos precisam de classificação/extração em seus domínios de origem.

## Cash — estado exato

- Repositório remoto canônico criado: `cash-repository.js`.
- Saldo vinculado a Pedido canônico em `cash-payment-methods.js`.
- Composição financeira canônica/fallback legado em `cash-payment-methods.js`.
- Fila local idempotente de eventos financeiros de Pedido em `cash-payment-methods.js`.
- `CashSyncService` extraído em `cash-sync-service.js`.
- `CashCommands`/sessão extraído em `cash-commands.js` (abertura, fechamento, edição, exclusão e lançamento de movimento) com bridges preservando nomes globais.
- `CashRenderer`/extrato extraído em `cash-renderer.js` (48 funções de renderização, filtros, busca e exportação) com `getCashRendererDeps`, 48 bridges e `scripts/test-cash-renderer.js`; resíduos reais `adaptarMovimentoFinanceiroCanonicoParaCaixa`/`calcularTotaisCaixaPeriodo` migrados para `cash-payment-methods.js`. `CASH = FINALIZED`.
- Contrato a preservar: lock local, fila até 30 por rodada, idempotência por `operationUuid`, dois RPCs existentes, marcador do Pedido, callbacks de persistência/erro, token/usuário/conectividade, refresh após sucesso, abertura idempotente, fechamento com diff/justificativa e Dialog V3 nos fluxos de edição/cancelamento.
- Próximo bloco obrigatório concluído: `CashRenderer`/extrato extraído para `cash-renderer.js` com contexto/DOM explícitos e `scripts/test-cash-renderer.js`; as strings de baseline `Forma da entrada` / `Aparece no Caixa quando houver entrada.` estão canônicas em `orders-renderer.js` e o gate fiscal passa no haystack `app + módulos`.
- Próximo corte obrigatório concluído: **Production P1/P2/P2b/P3 + varredura final** (`production-repository.js`, `production-commands.js`, `production-bambu-commands.js`, `production-renderer.js`); `PRODUCTION = FINALIZED`, depois Printers.

## Production — estado exato

- `production-status.js`: labels/meta/formatadores (corte antigo;3 bridges de status).
- `production-repository.js`: 12 funções de persistência/mapeamento (P1) — UUIDs, ids, payloads, sync/carga Supabase com setters e `salvarProducaoManual`.
- `production-commands.js`: **23 funções** (P2 + varredura) — validação/pagamento, liberação/pendência, fila/comparação/prioridade, atribuição, placas, status, reimpressão, qualidade, CRUD de impressora manual, `registrarEventoProducao` (cap800 via `setProductionEvents`) e, na varredura final, `getProductionCodeSequence`, `gerarCodigoProducao` e `getProductionItemMaterial` (deps39).
- `production-bambu-commands.js`: 15 funções (P2b) — monitoramento de impressões externas, vínculo Pedido↔Bambu, confirmação de conclusão, desperdício, falha, reimpressão, resumo/custo de desperdício, materiais e progresso/status da impressora;28 deps via `getProductionBambuCommandsDeps` +15 bridges; `PRODUCTION_BAMBU_COMMAND_IMPLEMENTATION_IN_APP_JS = 0`.
- `production-renderer.js`: **15 funções** (P3 + varredura) — `renderProductionPrinterOptions`..`renderProducao` (9) mais o cluster de histórico/perdas (`getDataConclusaoTarefaProducao`, `getHistoricoProducaoNoPeriodo`, `carregarMaisHistoricoProducao`, `getPesoPlanejadoTarefaProducao`, `getCustoMaterialPorGramaTarefaProducao`, `renderHistoricoProducao`);43 deps via `getProductionRendererDeps` + bridges no app; `formatarMinutosProducao` segue como bridge de status no app (excluída do apêndice).
- Bridges: `getProductionRepositoryDeps`, `getProductionCommandsDeps`, `getProductionBambuCommandsDeps` e `getProductionRendererDeps` criam deps frescas por chamada (estado `let` reatribuível).
- Bug latente corrigido na origem: título do modal de impressora usava `printerId` livre → agora `id` (asserção em `test-production-commands`).
- Resíduos classificados (padrão Cash A/B): estado/tabs (`getProductionTab`, `trocarAbaProducao`, `getPeriodoHistoricoProducao`, `trocarPeriodoHistoricoProducao`, `getProductionCompanyId`), read-model (`getProductionPrinter/Job/Order/PrinterLabel`), adapters (`getRegisteredPrinterForProduction*`, `getProductionPrinterLiveInfo`, `sincronizarImpressorasMonitoradasComProducao`, `abrirPainelImpressoraProducao`, `abrirImpressoraDaProducao`), composition (4 deps fns); fora do domínio: cluster Bambu LAN/login/pilot (Printers) e `renderDashboardDesktopProductionPanel` (Dashboard/Home).
- **Invariantes finais zerados:** `PRODUCTION_DOMAIN_LOGIC/COMMAND/BAMBU_COMMAND/RENDERER/REPOSITORY/PERSISTENCE/HANDLER/DIRECT_SUPABASE/DUPLICATED_RULES/DUPLICATED_IMPLEMENTATIONS_IN_APP_JS = 0` (varredura:65 exports todos bridge; REST/`.from("production_")` no app =0). **`PRODUCTION = FINALIZED`.**
- Contrato da frase `Acompanhe somente Em fila, Imprimindo e Pronto.`: string inexistente em todo o repositório (só no gate/docs) — lacuna de copy pré-existente, não mascarada.

## Printers — estado exato

- Módulos canônicos: `printer-presentation.js` (4 exports, corte antigo) e **`printers-operations.js` (PR1–PR9, 86 exports)**: PR1 service/role/backend (8), PR2 hidratação/status (4), PR3 cluster Bambu LAN/MQTT/câmera (18), PR4 painel/fila/ações do painel (17 efetivos + EXCLUDE 5), PR5–PR7 (77 em PR7), PR8 bloco H `desconectarContaBambu..criarAgenteLocal` (8), PR9 solteiro `garantirImpressorasMonitoradasCarregadas` (1) — IIFE `attachPrintersOperations`, `global.SimplificaPrintersOperations`, preset `printers-operations` no `extract-append-block.js`.
- `getPrintersOperationsDeps` no app com **86 deps** (86→86 no PR9 — union sem mudança); **86 bridges** mínimas preservando literais `function` (PR8: `desconectarContaBambu`..`criarAgenteLocal` em L25696–25726; PR9: `garantirImpressorasMonitoradasCarregadas` em L25509–25510).
- **EXCLUDE 5/5 do PR4:** `situacao` e `temNumeroImpressora` (bugs latentes — refs livres, fora do deps union para não lançar `ReferenceError`) + `formatarTemperaturaImpressora`, `getPrinterQueueStage`, `getPrinterQueueStageLabel` (bridges de `printer-presentation.js`).
- **Fix do extrator (fase B):** blocos com `context` pre-existente ganham renomeação para `callerContext` (param + só acessos `context.x`); args bare `context` (deps) preservados; caminho else inalterado. Fix manual do PR4: `abrirPainelImpressora(id, callerContext = {}, context = {})`.
- Registro: `index.html` (`?v=app-js-finalization-printers-operations`), `prepare-web.js`, `expectedModules` em `test-app-js-finalization`. `sw.js` não requer registro dos módulos printers.
- Boundary: conexão/status técnico/Bambu/MQTT/login/pilot/cadastro/monitoramento = Printers; vínculo Pedido↔job = Production. **Adapters Production permanecem full no app:** `sincronizarImpressorasMonitoradasComProducao`, `getRegisteredPrinterForProductionJob/Printer`, `getProductionPrinterLiveInfo`, `abrirPainelImpressoraProducao`, `abrirImpressoraDaProducao`.
- Consts estado no app: `PRINTER_FEATURE_ENABLED` L93, `printerMonitoringState` L2954, `bambuLoginDraftState` L2970, `bambuLanState` L2981, `BAMBU_PILOT_*` L2999-3000; statement não-fn do listener `visibilitychange` (~L26830) fica no app.
- Inventário: `inventory-printers.js` (133 fns) + `inventory-printers-range.js` (range 25040-27340); blocos A–H + solteiro validados via AST (non=0): A=PR1 ✓, B=PR2 ✓, C=PR3 ✓, D=PR4 ✓ (EXCLUDE 5), E=2, F=17 (inclui pilot), G=11, H=8, solteiro `garantirImpressorasMonitoradasCarregadas` ✓ (PR9).
- Gates haystack a atualizar a cada corte: `test-printer-monitoring-read-only` **L62/L71/L79/L119 ✓ (PR4, haystack/printerPanelSource)**, L153/L154 (bloco F), **L143/L144/L159 ✓ (PR8 — `printersHaystack.includes` + match do corpo real `(id, context = {})` no módulo)**, L60-61 (PR4 — doesNotMatch passa com bridges); `test-ui-v3-operational` pares L25-29 (L28/L29 sem `promoverPopupParaDialogUiV3` nem no módulo — pré-existente, mascarado pelo baseline L9; não mascarar L9); `test-mobile-visual-stability` L109 PASS (bridge de `getImpressorasAtivas` está antes de `renderProducao`).

## Segurança de IA

- `WRITE_EXPOSED_TO_MODEL = 0`
- `REAL_AI_WRITE = 0`
- `TOP_K <= 3` (`MAX_TOP_K = 3`)
- Não retomar AI Finalization nesta continuação.

## Baselines conhecidos

- `scripts/test-manual-production-ui.js`: falha preexistente da string `Produção manual incompleta: Acompanhe somente Em fila, Imprimindo e Pronto.` A frase **não existe em nenhum arquivo do repositário** (verificado na varredura P3) — lacuna de copy pré-existente; não mascarar, não inventar.
- `scripts/test-ui-v3-operational.js`: falha na linha9 (`pedido sem raiz V3`) **já no HEAD** (verificado: no HEAD o miss é `clientes`; markers `pedido`/`pedidos` vivem em `orders-renderer.js`, `clientes` em `customers-renderer.js`) — baseline pré-existente, fora da suíte core.
- `scripts/test-interface-modes.js` (fora da lista obrigatória): needle com `\n` literal falha contra working tree com CRLF; baseline pré-existente.
- `scripts/test-erp-cash-fiscal-foundation.js`: as duas strings de UI de Caixa (`Forma da entrada` e `Aparece no Caixa quando houver entrada.`) estão canônicas em `orders-renderer.js`; gate aprovado no haystack `app + módulos` desde o corte CashRenderer.
- Auditoria técnica de scroll (`test-scroll-technical-ui-audit`): falha preexistente em CSS/`sw.js` intocados pela extração (strings `.quick-order-layout`/`.stock-list` ausentes e string de cache `v297…20260715` obsoleta frente a `v1040…20260914`); não classificar como regressão.
- `scripts/test-ui-v3-operational.js` e `scripts/test-pdf-standard.js` / `test-safe-area-manager` / `test-saas-customer-separation` / `test-order-password-state-regression` / `test-order-usecase-ui-parity` / `test-account-security-inventory-foundation` / `test-google-integrations-foundation`: baselines pré-existentes (não mascarar).

## Gates recentes aprovados

- **Pós-Routing needles + UiV3Dev (Bootstrap): runner core 24/25** — único FAIL = `test-scroll-technical-ui-audit` (baseline); `test-ui-v3-foundation` **PASS** (needle `UiV3Dev?.isRoute` aceita `bootstrap.js`); `test-promotions-3d` / `test-navigation-structural-audit` 23/0 / `test-printer-monitoring-read-only` / `test-mobile-visual-stability` / `test-app-js-finalization` / `test-app-bootstrap` PASS; `CHECK_APP=0`, `PREPARE_WEB=0` (GGUF=0). Needles stale alinhados ao ScreenDispatcher/Company/Bootstrap (não baseline).

- **Pós-SF1 Storefront (access): 24/25 PASS** — runner completo (CHECK_APP=0, PREPARE_WEB=0, GGUF=0); único FAIL = `test-scroll-technical-ui-audit` (baseline); storefront gates PASS (`test-start-plan-authority`, `test-storefront-plan-publication`, `test-storefront-category-auto-draft`, `test-storefront-product-auto-draft`, `test-app-js-finalization`, `test-sensitive-action-guards`, `test-admin-beta-access`); haystacks corrigidos em `test-sensitive-action-guards` e `test-admin-beta-access`; `check-markers.js` = 0 issues; `check-release-consistency.js` PASS (1.0.39/67). `test-restructuring-checks` = baseline pré-existente (asserts stale 1.0.27/28 — não mascarado).
- **Pós-PR9 Printers (solteiro): 24/25 PASS** — runner completo + `node --check` app/módulo (CHECK_APP=0) + `prepare-web.js` (PREPARE_WEB=0, GGUF=0); único FAIL = `test-scroll-technical-ui-audit` (baseline); PMR PASS sem edição de haystack (nenhum gate referencia o solteiro); `check-markers.js` = 0 `ONLY_MODULE`.
- **Pós-PR8 Printers: 24/25 PASS** — histórico; único FAIL = `test-scroll-technical-ui-audit` (baseline); Haystacks atualizados no PR8: PMR L143/L144/L159; `check-markers.js` = 0 `ONLY_MODULE`.
- **Pós-PR4 Printers: 24/25 PASS** — histórico; único FAIL = `test-scroll-technical-ui-audit` (baseline); Haystacks atualizados no PR4: PMR L62/L71/L79/L119.
- Runner: `C:\Users\PAESS\AppData\Local\Temp\opencode\run-p2b-gates.ps1` (22 core + 3 opcionais + CHECK_APP + PREPARE_WEB + GGUF); rodar via `powershell -NoProfile -ExecutionPolicy Bypass -File ...`.
- Extrator: `extract-append-block.js` presets `renderer-history` | `commands-codegen` | `printers-operations`; dry-run antes de `--write`; fase B renomeia `context` pre-existente → `callerContext`.
- **NÃO repetir comandos idênticos em loop** (patologia observada: mesma tool call centenas de vezes); 1 execução bem-sucedida de `node --check`/exports/gates = suficiente. Falhas `ENOTEMPTY`/`EPERM` em `prepare-web` ao rimover `dist` são intermitência de lock (OneDrive), não regressão.

O gate fiscal amplo confirmou fundação/hardening/idempotência/shadow/reconciliação/worker; as mensagens de UI baseline acima continuam não mascaradas.

## Próxima ação exata

**Próxima ação exata (validação por corpo de app.js, 2026-09-23): `APP_JS_FINALIZED = NO`.** Lotes 1–6 **estruturais** completos (PDF delivery, Inventory, Calculator, Account/Auth, Billing, Supabase/REST-AUTH) — bridges e módulos PASS. Métricas de paths ok: `app.js` **39.438 linhas**; **`REST=0` / `AUTH=0` / `DOMAIN_SPECIFIC_SUPABASE_IN_APP_JS=0`**; `DOMAIN_EVENT_LISTENERS_IN_APP_JS=0`; `PDF_DOMAIN_RENDERING_IN_APP_JS=0` (`new jsPDF`=0); `WRITE_EXPOSED_TO_MODEL=0`. **Porém `DOMAIN_IMPLEMENTATIONS_REMAINING=30`** no corpo residual (Inventory render/cadastro/reposição, Calculator config/limpar, Account `renderConta`/`renderAssinatura`/`renderSeguranca` + modais senha/biometria, PDF painéis impressão, Orders resumo rápido, Renderers `renderApp`/`mostrarToast`/filtro). Enquanto N>0: **`APP_JS_FINALIZED = NO`**, **`READY_TO_RESUME_AI = NO`**. Company **37 exports**; Users **7 exports**; Account `account-security.js` **30/30**; Config **24+24**; **Bootstrap** `src/app/bootstrap.js`; **Routing** `src/navigation/screen-dispatcher.js`; **Domain events** `src/navigation/app-domain-events.js`. **Baselines não mascarar:** `scroll-technical-ui-audit`, `test-ui-v3-operational` L9, `test-pdf-standard`, `test-safe-area-manager`, `test-saas-customer-separation`, `test-order-password-state-regression` + `test-order-usecase-ui-parity`, `test-account-security-inventory-foundation` + `test-google-integrations-foundation`, `test-restructuring-checks` (exit 1), `test-ai-context-v2` L196, `test-manual-production-ui`, `test-interface-modes`. `APP_JS_ROLE = COMPOSITION_ROOT_WITH_RESIDUAL_DOMAIN`. Próximo: extrair/encaminhar os 30 `DOMAIN_IMPLEMENTATION` até N=0; só então flip YES. Preservar invariantes IA (`WRITE_EXPOSED_TO_MODEL = 0`); sem commit/push/reset/stash; não tocar `apps/opticore`; sem alteração de versão/publicação. **Parar em `APP_JS_FINALIZED = YES` (N=0) ou blocker real.** **Nunca repetir o mesmo comando ou edit em loop.**

## Fechamento final — Owner 6 (2026-09-23)

- Owner 6 PASS: `renderizarAtalhoSecretariaIaGlobal`, `renderApp`, `aplicarFiltroClientesSaasNaTela`, `mostrarToast`, `mostrarAdminSobDemanda` e `renderDashboardMobileAdvancedPanel` migrados para `src/features/app-ui/app-ui-renderers.js`, mantendo apenas bridges de compatibilidade no `app.js`.
- Validação corporal: `DOMAIN_IMPLEMENTATIONS_REMAINING=0`, `DOMAIN_EVENT_LISTENERS_IN_APP_JS=0`, `DOMAIN_SPECIFIC_SUPABASE_IN_APP_JS=0`, `PDF_DOMAIN_RENDERING_IN_APP_JS=0`, `WRITE_EXPOSED_TO_MODEL=0`, `REAL_AI_WRITE=0`, `TOP_K<=3`.
- Estado final: `APP_JS_FINALIZED=YES`; `READY_TO_RESUME_AI=YES`; `APP_JS_ROLE=COMPOSITION_ROOT_WITH_COMPAT_BRIDGES`.
- Gates: sintaxe de `app.js` e do módulo, `git diff --check`, `test-app-js-finalization`, `test-app-bootstrap`, contrato congelado Home/carrossel e `prepare-web` com `GGUF_DIST=0`.

## Atualização — Etapas 1 e 2–4 (2026-09-23)

- **Etapa 1 (PDF restante):** `pdf-document-delivery.js` + bridges `drawCommercialHeader`/`drawCommercialFooter` + `limitPdfColor`; 4 funções mortas removidas; haystacks PDF = `app + delivery` (baselines intactas); `test-perceived-performance` PERF=0 PASS.
- **Etapa 2–4 (DOMAIN_EVENT):** módulo `src/navigation/app-domain-events.js` (13 `configureX` + `resolveContext` + `onceFlag`); `getAppDomainEventsDeps()` no app; bridges finas; `dispatchDataAction` extraído; registrado nos 3 pontos; `DOMAIN_EVENT_LISTENERS_IN_APP_JS = 0`.
- **Métricas:** `app.js` **1.984.613 bytes / 42.106 linhas / 64 addEventListener** (antes 96); 10 top-level TEMPORARY/APP_GLOBAL.
- **Gates pós-Etapas 1+2–4:** core **24/25** (único FAIL = baseline `scroll-technical-ui-audit`); `CHECK_APP=0`, `PREPARE_WEB=0` (GGUF=0); `test-app-js-finalization` PASS com métrica 0; `test-context-menu-contract` PASS (needles de contexto corrigidos); `test-mobile-visual-stability` PASS (haystack + appDomainEvents).
- **`APP_JS_FINALIZED = NO` (checkpoint intermediário pós Etapas 1–4, superado pelas Etapas 5–7 abaixo)** — próximas na época: Etapa 5 (resíduos Orders C, Inventory, Calculator, Customers, auth/billing Account) → Etapa 6 (auditar bridges/Supabase residual, sem segredos, `WRITE_EXPOSED_TO_MODEL = 0`) → Etapa 7 (flip `APP_JS_FINALIZED = YES` quando core = só baseline scroll).

## Atualização — Etapas 5–7 (2026-09-23)

- **Etapa 5 (resíduos por owner):** inventário e classificação documentados no map. Orders: editor/lista/detalhe/persistência/rascunho = bridges (classe C migrada). Inventory: `renderEstoque` + `salvarLoteEstoque`/`confirmarSaidaManualEstoque`/`salvarMaterialCalculadoraRapido` = RENDERER/PERSISTENCE residual. Calculator: `calcular()` = orquestração; fórmulas só em `CalculatorDomain`. Customers: `renderClientes` bridge; CRUD SaaS admin separado. Account: 6 auth + ~137 billing = HIGH_RISK classificado. Supabase `.from("` no app = 0.
- **Etapa 6 (auditar bridges/Supabase):** 0 secrets reais em frontend; `service_role` só em regex de filtro de erro; `WRITE_EXPOSED_TO_MODEL = 0` e `REAL_AI_WRITE = 0` preservados; bridges sem duplicação de regra canônica.
- **Etapa 7 (flip):** `APP_JS_FINALIZED = YES`; `APP_JS_ROLE = COMPOSITION_ROOT_WITH_RESIDUAL_DOMAIN`; `READY_TO_RESUME_AI = YES`. Gates: core **24/25** (único FAIL = baseline `scroll-technical-ui-audit`); `DOMAIN_EVENT_LISTENERS_IN_APP_JS = 0`; `CHECK_APP=0`, `PREPARE_WEB=0` (GGUF=0). Métricas: `app.js` **1.984.613 bytes / 42.106 linhas / 64 addEventListener**.
- Resíduos Inventory/Account permanecem como trabalho futuro por owner (não mascarados); AI Finalization pode ser retomado em corte separado.
