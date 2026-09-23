# APP.JS FINALIZATION — mapa de entrada

Data de auditoria: 2026-09-19  
Branch: `codex/melhorias-setembro-2026`  
HEAD: `7e73f06ff4af8dabf593c691da1b1de2f624ac47`

## Métricas de base

| Métrica | Valor |
| --- | ---: |
| Bytes | 2.629.670 |
| Linhas | 53.361 |
| Funções declaradas | 2.607 |
| Funções `async` | 352 |
| Globais `const`/`let` aproximados | 6.820 |
| Renderers | 366 |
| Listeners | 160 |
| Referências Supabase | 635 |
| Acessos DOM diretos | 885 |

## Fronteiras existentes

| Domínio | Classificação atual | Fonte/bridge existente | Próxima onda segura |
| --- | --- | --- | --- |
| Shared/conta/plano | NORMALIZER, FORMATTER, HIGH_RISK | `app.js` | somente helpers sem estado |
| Customers | PARTIAL_MODULE | `src/features/customers/` | completar normalizadores/seletores puros |
| Inventory | PARTIAL_MODULE | `src/features/inventory/` | presentation e cálculos determinísticos |
| Production | PARTIAL_MODULE | `src/features/production/` | metadata/labels restantes |
| Printers | FINALIZED | `src/features/printers/` | nenhum — `PRINTERS = FINALIZED` |
| Orders | DOMAIN_LOGIC, PERSISTENCE, UI | `app.js` + use cases IA | auditoria antes de extração |
| Calculator | DOMAIN_LOGIC, PRESENTATION | `CalculatorDomain` + `app.js` | helpers puros sem duplicar fórmula |
| Cash | DOMAIN_LOGIC, PERSISTENCE, SUPABASE | `app.js` | selectors/formatters primeiro |
| Storefront | FINALIZED | `src/features/storefront/` (12 módulos SF1–SF29) | nenhum — `STOREFRONT = FINALIZED` |
| Config/Account/Company/Users | PARTIAL_FINALIZED_CONFIG_ACCOUNT_COMPANY_USERS | `src/features/config/` (24+24) + `src/features/account/` (security 30 + plan-normalizers) + `src/features/company/` (7 módulos, 37 exports) + `src/features/users/` (2 módulos, 7 exports) + resíduos A–D | Domínios estruturais OK; restam resíduos auth/billing/renderers → **resíduos** → Routing → Events |
| Reports/Home | PARTIAL_MODULE | facades e módulos existentes | remover somente duplicação provada |
| AI | BRIDGE | `src/ai`, `src/ai-3d`, `ReadFacade` | preservar; não evoluir IA nesta fase |
| Bootstrap/eventos | BOOTSTRAP_PARTIAL | `src/app/bootstrap.js` + `src/navigation/screen-dispatcher.js` + `app.js` (~96 listeners DOMAIN_EVENT) | classificar listeners por owner; routing = bridge + mapa de renderers |

## Ondas salvas

| Onda | Extração | Classificação | Dependências mantidas pela bridge | Resultado |
| --- | --- | --- | --- | --- |
| Shared 1 | `formatarDataCurta`, `formatarDataHora` em `src/shared/date-formatters.js` | PURE com normalizador injetado para data curta | `normalizarDataLocal` | removeu a definição duplicada de `formatarDataHora`; comportamento efetivo preservado |
| Inventory 1 | `calcularPreviaConsumoPorRolo` em `src/features/inventory/inventory-roll-consumption.js` | STATE_DEPENDENT, com cálculo interno determinístico | normalização de lotes, controle de lote, gate de rolos e flags runtime | sem baixa automática; uma única regra canônica para a prévia |
| Production 1 | `formatarMinutosProducao` em `src/features/production/production-status.js` | PURE | nenhuma | preserva arredondamento, limite mínimo e texto exibido |
| Shared 2 | `formatarTempoRelativo` em `src/shared/date-formatters.js` | MOSTLY_PURE, com relógio injetável para teste | relógio do runtime pelo argumento padrão | preserva o parsing e os textos legados |
| Reports 1 | `formatarDeltaRelatorios`, `formatarPeriodoCurtoRelatorios` em `src/features/reports/reports-formatters.js` | PURE | carregador lazy da feature Reports | mantém os mesmos nomes públicos por bridge e a ordem de carregamento da feature |
| Calculator 1 | `formatarTempoCalculadora` em `src/services/calculatorDomain.js` | PURE | domínio da calculadora já carregado estaticamente | preserva truncamento, limite de minutos e formato `h:mm` |
| Shared 3 | `formatarPrazoWhatsapp` em `src/shared/date-formatters.js` | PURE | nenhuma | preserva parse local ao meio-dia e fallback textual |
| Customers 1 | `formatarTelefonePdf` em `src/features/customers/customer-normalizers.js` | PURE | `normalizePhoneBR` do mesmo módulo | preserva formatação brasileira de 10/11 dígitos e fallback |
| Shared 4 | `numeroDocumentoPdf` em `src/shared/date-formatters.js` | MOSTLY_PURE, com relógio injetável | data e relógio pelo argumento padrão | preserva ano, últimos seis dígitos e preenchimento com zero |
| Home 1 | `formatarVariacaoDashboard` em `src/features/home/home-data.js` | PURE | módulo Home carregado estaticamente | preserva percentuais, sinais e estados de tendência |
| Shared 5 | `formatarAtualizacaoPromocoes3d` em `src/shared/date-formatters.js` | PURE | nenhuma | preserva fallback e formatação de horário local |
| Orders 1 | normalização, materiais, placeholder, validação e sanitização em `src/features/orders/order-normalizers.js` | STATE_DEPENDENT com injeção explícita | leitura de estoque, conversão monetária e busca de texto pela bridge | preserva IDs, totais, aliases, materiais e mensagens de validação |
| Orders 2 | `renderListaPedidos` em `src/features/orders/orders-renderer.js` | DOMAIN_RENDERER com contexto injetado | seletores, estado de filtros, render helpers e handlers globais pela bridge | renderer canônico ativo; implementação prévia classificada como `LEGACY_RENDERER` não chamada até prova visual de remoção |
| Orders 3 | `renderDetalhePedido` em `src/features/orders/orders-renderer.js` | DOMAIN_RENDERER com contexto injetado | resumo financeiro, status, materiais e helpers de apresentação pela bridge | renderer canônico ativo; implementação prévia classificada como `LEGACY_RENDERER` não chamada até prova visual de remoção |
| Orders 4 | leitura de escopo e persistência local verificada em `src/features/orders/orders-repository.js` | PERSISTENCE com dependências injetadas | escopo, cache, storage, salvamento e fault injection pela bridge | preserva confirmação transacional local sem alterar Supabase, schema ou payload |
| Customers 2 | `renderClientes` e lista operacional em `src/features/customers/customers-renderer.js` | DOMAIN_RENDERER com contexto injetado | pedidos, seletores, busca e helpers de apresentação pela bridge | renderer canônico ativo; versões anteriores classificadas como `LEGACY_RENDERER` não chamadas |
| Cash 1 | `normalizarMetodoPagamentoCaixa`, `getMetodoPagamentoMovimento` em `src/features/cash/cash-payment-methods.js` | STATE_DEPENDENT com injeção explícita | catálogo de métodos pela bridge | preserva aliases, fallback e contrato do movimento |
| Account 1 | normalizadores de plano, pagamento, assinatura e variante em `src/features/account/plan-normalizers.js` | PURE | nenhuma | preserva aliases e estados públicos sem alterar permissões |
| Storefront 1 | categoria e prazo de promoção em `src/features/storefront/promotions-formatters.js` | PURE/MOSTLY_PURE com relógio injetável | nenhuma | preserva categorias, prazo e fallback de atualização |

## Dependências e riscos

- `app.js` ainda concentra estado global, DOM, Supabase e persistência; blocos state-dependent exigem injeção explícita antes de mover.
- A bridge da IA e os módulos do carrossel são contratos ativos e não pertencem às ondas de extração.
- A falha conhecida de `test-manual-production-ui.js` só é baseline se mantiver exatamente a mensagem registrada na solicitação.
- Nenhuma regra WRITE, RLS, schema ou versão será alterada.

## Restos grandes previstos para o fim

| Bloco | Classificação | Por que permanece inicialmente | Ação futura |
| --- | --- | --- | --- |
| Inicialização global | BOOTSTRAP | controla ciclo de vida do aplicativo | manter como wiring |
| Roteamento/telas | ROUTING | contratos HTML e eventos globais | reduzir apenas com testes |
| Persistência/Supabase | HIGH_RISK | comportamento compartilhado | encapsular por domínio após mapa |
| Renderers legados | LEGACY_COMPAT | consumidores dinâmicos desconhecidos | auditar consumidor a consumidor |
| IA | BRIDGE | runtime já modular | manter somente ponte |

## Checkpoint de retomada — próxima sessão

Status registrado: ondas pequenas e primeiras fronteiras state-dependent concluídas e validadas localmente; Etapa 2 iniciou renderer e persistência de Pedidos; estimativa de avanço da finalização: **33%**. Não há commit, push, publicação em GitHub ou deploy Vercel autorizado ou realizado.

### Etapa 2.1 — estado de domínios

| Domínio | Estado | Evidência atual | Bloqueio concreto para `FINALIZED` |
| --- | --- | --- | --- |
| Pedidos | PARTIAL | normalizers, renderer de lista/detalhe e repositório local validados; renderers legados sem consumidores removidos | handlers de edição/cancelamento e executor transacional continuam no `app.js` |
| Clientes | PARTIAL | renderer operacional e normalizadores validados | fluxo SaaS/Admin em `renderClientesSaas` e mutações de assinatura/permissão têm dependência de conta/plano e precisam de boundary próprio |
| Estoque | PARTIAL | normalizadores, identificadores, apresentação, rolos e regressão Pedido–Estoque validados | renderer `renderEstoque` e operações/persistência seguem no `app.js`, acoplados a state/DOM |
| Calculadora | PARTIAL | `CalculatorDomain` é a fonte canônica das fórmulas já migradas e os testes existentes passam | controller, histórico e renderização ainda são DOM/state-dependent em `app.js` |

`ORDERS_VISUAL_PROOF=AUTOMATED_DOM_PASS`; `DEVICE_PASS=NOT_TESTED`. A prova é suficiente para ativar os renderers canônicos, mas não para apagar os legados.

### Etapa 2.2 — bloco salvo: Calculadora / fronteira determinística

| Candidato auditado | Classificação | Dependências | Decisão |
| --- | --- | --- | --- |
| `normalizarCalculadoraWidget` | MOSTLY_PURE | viewport e flag mobile injetados pelo bridge | migrado para `CalculatorDomain.normalizeWidget` |
| `normalizarTipoImpressoraCalculadora` | PURE | nenhuma | migrado para `CalculatorDomain.normalizePrinterType` |
| `numeroCalculadora` | MOSTLY_PURE | parser brasileiro `numeroMonetarioPedido` injetado pelo bridge | migrado para `CalculatorDomain.normalizeNumber` |
| `calcularTaxaExtraAplicada` | PURE | estado de taxa fornecido pelo app | fórmula migrada para `CalculatorDomain.calculateExtraFee` |
| `calcular` | SIDE_EFFECT / HIGH_RISK | DOM, monetização, histórico, render, configuração e pedido | permanece; requer controller/service com prova de paridade |
| `renderCalculadoraConteudo` | SIDE_EFFECT | DOM, estado de rascunho e handlers globais | permanece; requer renderer próprio e harness real |

Bridges remanescentes desta onda: `normalizarCalculadoraWidget`, `normalizarTipoImpressoraCalculadora`, `numeroCalculadora` e `calcularTaxaExtraAplicada`; todos têm consumidores ativos no `app.js` e existem apenas para injetar runtime/estado, sem regra duplicada.

Gates desta onda: `test-calculator-domain`, `test-app-js-finalization`, `test-order-stock-calculator-flow`, sintaxe de `app.js`/domínio, `git diff --check` e `prepare-web`: **PASS**. `dist/*.gguf = 0`.

Bloqueio concreto para fechar Calculadora: a função `calcular` ainda agrega leitura de formulário, limite de monetização, registro de uso, persistência de configuração e renderização; não pode ser apagada nem transformada em bridge sem primeiro separar esses cinco efeitos e executar prova de interação de tela.

Bloqueio concreto para apagar legacy de Pedidos/Clientes: não há script de servidor local e não há binário `agent-browser` disponível neste checkout; a evidência atual é somente harness automatizado, abaixo da prioridade definida para remoção. Nenhum legacy foi removido.

### Concluído nesta sequência

- Onze ondas pequenas registradas acima, com bridges públicas preservadas no `app.js`.
- Módulos novos/adicionados: `src/shared/date-formatters.js`, `src/features/inventory/inventory-roll-consumption.js`, `src/features/reports/reports-formatters.js`.
- Módulos estendidos: clientes, produção, Home e domínio da calculadora.
- Testes específicos das ondas, testes de estoque, Home, relatórios, produção, calculadora, `node --check app.js`, `git diff --check` e `node scripts/prepare-web.js` aprovados.
- `dist/` confirmado sem arquivos `.gguf`.
- `scripts/test-manual-production-ui.js` continua com a falha de baseline conhecida da string ausente; não foi alterada nesta sequência.

### Próxima ordem segura

1. Reexecutar o inventário do working tree e os gates do mapa antes de editar.
2. Auditar e escolher, no máximo, dois helpers determinísticos por onda, começando por presentation helpers de impressoras, inventário ou relatórios que tenham módulo de destino já carregado.
3. Para cada onda: mapear consumidores e dependências, criar/estender teste específico, manter bridge no `app.js`, executar sintaxe, `git diff --check`, testes de domínio e `prepare-web` com contagem `.gguf` igual a zero.
4. Só depois de esgotar helpers puros, auditar seletores state-dependent por domínio com injeção explícita. Não mover persistência junto com a primeira extração de um domínio.

### Não iniciar sem uma auditoria dedicada

- Persistência, Supabase/RLS, sincronização e schema.
- Fluxos de pedidos, caixa e contas/usuários que criem IDs, timestamps ou alterem estado.
- IA/Agent Core/tool calling e qualquer regra WRITE.
- Renderers grandes, bootstrap, roteamento e listeners globais.
- Carrossel/Home visual, storefront e comportamento de UI.

## Evidência de validação — 2026-09-20

### Métricas atuais do `app.js`

| Métrica | Base inicial | Atual |
| --- | ---: | ---: |
| Bytes | 2.629.670 | 2.618.117 |
| Linhas | 53.361 | 49.728 |
| Funções declaradas | 2.607 | 2.606 |

As métricas são indicativas: a redução de tamanho não é critério de finalização.

### Gates aprovados

- Modularização, estoque, navegação estrutural/comportamental, relação de UI, carrossel, modal, autenticação e contratos de IA listados na fase: aprovados.
- Testes específicos de Pedidos, Caixa, Plano e promoções da Loja: aprovados.
- `node --check app.js`, módulos novos, `git diff --check` e `node scripts/prepare-web.js`: aprovados.
- Web `dist/`: `.gguf = 0`.
- Android debug: aprovado localmente; `android/app/build/outputs/apk/debug/app-debug.apk`, 21.517.011 bytes, `br.com.ne3d.erp`, `versionName 1.0.39`, `versionCode 67`; assets Android `.gguf = 0`.
- Produção manual: baseline inalterada, com a string conhecida ausente.

### Restos que impedem `APP_JS_FINALIZED=YES`

| Bloco | Classificação | Por que ainda permanece | Próxima ação segura |
| --- | --- | --- | --- |
| Renderizadores de Pedidos, Estoque, Produção, Caixa e Configuração | RENDERER/DOM_EFFECT | 366 renderizadores e contratos HTML/eventos globais | extrair por tela somente depois de mapear consumidores e DOM |
| Escrita e sincronização de Pedidos, Caixa e Estoque | PERSISTENCE/SUPABASE | chama estado global, storage e Supabase | criar facades/repositories por domínio com testes de paridade |
| Bootstrap, roteamento e listeners | BOOTSTRAP/ROUTING/EVENT_WIRING | ciclo de vida e compatibilidade global | manter como wiring até os domínios terminarem |
| Conta/Usuários e permissões | HIGH_RISK | IDs, timestamps, auth, plano e sincronização | continuar apenas normalizadores; auditar mutações separadamente |
| Storefront administrativo e UI legacy | LEGACY_COMPAT/DOM_EFFECT | auto-draft e navegação têm contratos ativos | mover apenas lógica comprovadamente pura ou já coberta por testes |
| Bridges de IA | BRIDGE | contrato canônico validado e IA pausada nesta fase | preservar sem continuar AI FINALIZATION |

**Estado honesto atual (validação por corpo de app.js, 2026-09-23):** `APP_JS_FINALIZED=NO`; `APP_JS_ROLE=COMPOSITION_ROOT_WITH_RESIDUAL_DOMAIN`; `READY_TO_RESUME_AI=NO`. Métricas de paths/listeners (ok): `app.js` **39.438 linhas**; `REST=0`, `AUTH=0`, `DOMAIN_SPECIFIC_SUPABASE_IN_APP_JS=0`; `DOMAIN_EVENT_LISTENERS_IN_APP_JS=0`; `PDF_DOMAIN_RENDERING_IN_APP_JS=0` (`new jsPDF`=0); `WRITE_EXPOSED_TO_MODEL=0`. **Porém `DOMAIN_IMPLEMENTATIONS_REMAINING=30`** no corpo do app (Inventory render/persistence UI, Calculator config/limpar, Account renderers + modais senha/biometria, PDF painéis impressão, Orders resumo rápido, Renderers app/toast/filtro). Módulos/bridges dos LOTES 4–6 existem e são estruturalmente PASS, mas **não provam finalização**: a fonte de verdade é o corpo residual. Enquanto N>0, flags permanecem NO. Resíduos classificados por owner (tabela Etapa 5) sem mascarar paridade; AI Finalization bloqueado até N=0 preservando `WRITE_EXPOSED_TO_MODEL=0`. Baselines não mascarar: `scroll-technical-ui-audit`, `test-ui-v3-operational`, `test-pdf-standard`, `test-safe-area-manager`, `test-saas-customer-separation`, `test-order-password-state-regression`, `test-order-usecase-ui-parity`, `test-account-security-inventory-foundation`, `test-google-integrations-foundation`, `test-restructuring-checks`, `test-ai-context-v2`, `test-manual-production-ui`, `test-interface-modes`.

### Validação corporal final — Owner 6 (2026-09-23)

- `src/features/app-ui/app-ui-renderers.js` passou a deter os seis resíduos de App UI: atalho global da secretaria IA, composição `renderApp`, filtro visual SaaS, toast, modal de administrador sob demanda e painel avançado mobile do Dashboard.
- As funções globais de `app.js` preservam os nomes e são somente `COMPAT_BRIDGE`; o contexto explícito é criado por `getAppUiRenderersDeps()`.
- Validação do corpo atual de `app.js`: `DOMAIN_IMPLEMENTATIONS_REMAINING=0`; `DOMAIN_EVENT_LISTENERS_IN_APP_JS=0`; `DOMAIN_SPECIFIC_SUPABASE_IN_APP_JS=0`; `PDF_DOMAIN_RENDERING_IN_APP_JS=0`; `WRITE_EXPOSED_TO_MODEL=0`; `REAL_AI_WRITE=0`; `MAX_TOP_K<=3`.
- Flip autorizado pelos gates: `APP_JS_FINALIZED=YES`; `READY_TO_RESUME_AI=YES`; `APP_JS_ROLE=COMPOSITION_ROOT_WITH_COMPAT_BRIDGES`.

### Varredura estrutural de Orders — classificação atual

| Classe | Ocorrências no `app.js` | Decisão |
| --- | --- | --- |
| A. REQUIRED_BRIDGE | fachadas públicas de normalização, lista/detalhe, edição, cancelamento, persistência local e comandos | manter somente como adaptadores de dependências; a implementação canônica está nos módulos `orders-*` |
| B. APP_WIRING | fábricas de dependências, composição do executor transacional, estado/DOM e registro de handlers globais | manter enquanto o `app.js` for a composition root; não contém regra canônica nova |
| C. DOMAIN_IMPLEMENTATION | editor completo (`renderPedido`), renderers operacionais/PWA, rascunho rápido com storage, políticas de edição e preparação de UI | pendente de extrair para controller/renderer/repository com injeção explícita e paridade; impede `ORDERS=FINALIZED` |
| D. LEGACY_DEAD | `renderListaPedidosLegacy`, `renderDetalhePedidoLegacy` | removidos; testes de paridade e guardas estáticos impedem o retorno |

Nesta passagem, filtros de status, chips de materiais, ações compactas, timeline, comandos PWA, histórico, rentabilidade, lista PWA, prévia por rolo/lote e materiais do pedido foram deslocados para `orders-renderer.js`. As fachadas remanescentes apenas encaminham dependências de data, Inventário, Caixa, escape e DOM; não repetem a regra de apresentação. O editor, fluxo rápido e persistência de rascunho continuam classificados como C até possuírem boundary próprio.

O fechamento de pedido também foi deslocado para `OrdersHandlers.finalizeOrderUi`: preparação, limite, revisão, execução canônica, idempotência, telemetria, sincronização e limpeza agora são orquestrados no módulo. A bridge de `app.js` só injeta estado/UI e os adapters existentes; `OrdersCommandService` segue como dono da transação, sem absorver regras próprias de Caixa ou Inventário.

### Etapa 2.2 — bloco salvo: Estoque / seletores

| Candidato auditado | Classificação | Dependências | Decisão |
| --- | --- | --- | --- |
| `classeStatusEstoque` | PURE | nenhuma | migrado para `SimplificaInventoryNormalizers.classeStatusEstoque` |
| `filtrarMateriaisEstoque` | STATE_DEPENDENT | normalização de material/texto, códigos e formatação injetados | migrado como seletor sem persistência |
| `ordenarMateriaisEstoque` | MOSTLY_PURE | resolvedor de código injetado | migrado sem mutar a lista de entrada |
| `renderEstoque` | SIDE_EFFECT | estado global, autorização, DOM e handlers | permanece até renderer/harness próprio |
| cadastro, lote e saída manual | HIGH_RISK | foto, persistência, sincronização e rolos | permanece; exige service/repository com teste de paridade |

Bridges remanescentes: `classeStatusEstoque`, `filtrarMateriaisEstoque`, `ordenarMateriaisEstoque`; há consumidores no renderer e não há regra duplicada.

Gates: `test-inventory-selectors`, `test-stock-stage-1`, `test-stock-roll-core`, `test-order-stock-calculator-flow`, `test-app-js-finalization`, sintaxe, `git diff --check` e `prepare-web`: **PASS**. `dist/*.gguf = 0`.

### Etapa 2.2 — evidência de navegador e checkpoint atual

- O servidor HTTP temporário local carregou `index.html` no navegador isolado em `127.0.0.1:4173`; houve conteúdo visível e **0** erros de console. O servidor e a aba foram encerrados após a leitura.
- O cenário parou corretamente na tela de autenticação. Não havia sessão de teste nem credenciais autorizadas; nenhuma conta, pedido, cliente, item ou dado local foi criado/modificado para contornar a barreira.
- Portanto: `APP_LOAD_VISUAL=PASS`, `ORDERS_CUSTOMERS_VISUAL_PARITY=NOT_PROVEN`, `DEVICE_PASS=NOT_TESTED`. Isso é evidência de carga, não prova visual autenticada; a remoção dos renderers legados sem consumidores foi coberta por paridade estrutural e gates de regressão.
- Métricas após a remoção da lista legada: bytes 2.586.767; linhas 52.520. O working tree é o baseline local acumulado e não há outro agente escrevendo nele; alterações desta etapa permanecem locais e sem publicação.
- Regressão nova: **NÃO**. `test-manual-production-ui.js` reproduziu exatamente o baseline: `Produção manual incompleta: Acompanhe somente Em fila, Imprimindo e Pronto.`

### Etapa 2.3 — paridade estrutural e mapa de fechamento

- `scripts/test-domain-renderer-parity.js` valida em DOM/string isolado os contratos canônicos de Pedidos (vazio, lista múltipla, status, busca, cliente, total, prazo, ações, detalhe, materiais e voltar) e Clientes (vazio, lista, busca, métricas e ação de abrir Pedidos). Não cria sessão no runtime de produção.
- Resultado: `ORDERS_RENDERER_STRUCTURAL_PARITY=PASS`, `CUSTOMERS_RENDERER_STRUCTURAL_PARITY=PASS`. A prova visual autenticada permanece pendência de release, não bloqueio estrutural.
- Consumidores estáticos dos legados: somente as declarações `renderListaPedidosLegacy`, `renderDetalhePedidoLegacy`, `renderClientesLegacy` e `renderClientesOperacionaisLegacy` haviam sido encontradas. Os quatro foram removidos após os gates do executor/controller e de paridade; o teste estrutural agora impede seu retorno.

| Domínio | Implementação ainda no `app.js` | Classificação | Boundary necessária |
| --- | --- | --- | --- |
| Pedidos | edição (`44791`), recebimento/reverso de caixa (`44900`/`44936`), remoção (`45041`), revisão (`45547`) e executor IA compartilhado (`48247`) | TRANSACTION / SIDE_EFFECT | service/commands único reutilizado pela UI e IA; não duplicar executor |
| Clientes | mutações SaaS/Admin e chamadas parciais remotas (`30376–30733`) | POLICY / SUPABASE | policy externa + repository/adaptador de sync, sem plano/permissão no domínio Cliente |
| Estoque | renderer (`25294`), cadastro/edição/lotes (`45894–46217`) e saída rápida (`49836`) | DOM / PERSISTENCE / ROLLS | controller com store injetado e repository que preserve rolos e sync |
| Calculadora | configuração, renderer e cálculo (`46917`, `47370`, `50185`, `50458`) | DOM / MONETIZATION / PERSISTENCE | controller com policy de uso, renderer e history/repository separados do domínio matemático |

### Etapa 2.4 — bloco salvo: OrdersController de rascunho

- Criado `src/features/orders/orders-controller.js`, carregado estaticamente por `index.html` e `prepare-web.js`.
- Bridges curtas no `app.js`: telefone, email, observação, prazo, status, entrada e desconto delegam para `SimplificaOrdersController` com estado, parser monetário, total e refresh injetados.
- Nenhuma regra de transação foi copiada: edição, cancelamento, recebimento/reverso e o executor compartilhado da IA continuam pendentes para uma única fronteira de comandos. `WRITE` continua bloqueado.
- Gates PASS: `test-orders-controller`, normalizadores, renderer, repository, harness de paridade, integração Pedido–Estoque–Calculadora, sintaxe, `git diff --check`, build web e `dist/*.gguf = 0`.

### Full sprint — Orders command service

- Criado `src/features/orders/orders-command-service.js`, carregado antes das bridges de app.
- A fonte canônica de consumo por status, diferença de estoque, recebimento e estorno é o serviço; `app.js` mantém apenas bridges que injetam adaptadores de caixa, estoque e persistência já existentes.
- `test-orders-command-service.js` cobre rascunho/status, diferença de consumo, recebimento e estorno. O gate antigo Pedido–Estoque–Calculadora foi atualizado para verificar bridge canônica em vez de exigir a implementação no `app.js`.
- A bridge de IA não ganhou action nem WRITE: a extração foi somente de lógica compartilhada; `WRITE_EXPOSED_TO_MODEL=0` permanece invariável.

### Full sprint continuation — effects de Orders

- `determineEditEffects` e `determineCancelEffects` foram movidos para `orders-command-service.js`.
- O app injeta cálculo de consumo, estado de baixa, caixa, fila de produção e movimentos; não há cópia de estado nem regra de negócio duplicada.
- Gates de Pedidos, integração Pedido–Estoque–Calculadora, paridade de render, finalization, sintaxe, diff e build web: **PASS**; `dist/*.gguf = 0`.

### Full sprint continuation — executor transacional

- `OrdersCommandService.createTransactionExecutor()` agora constrói a instância de `OrderCreateTransactionExecutor` com todos os adapters de state, estoque, caixa, persistência, rollback, idempotência e pós-commit.
- `getOrderCreateTransactionExecutor3d()` virou bridge de composição: conserva o cache de instância e injeta os adapters existentes. UI e executor preparado da IA seguem consumindo exatamente a mesma instância e assinatura.
- Nenhuma capability, confirmação, token, idempotência ou exposição WRITE da IA foi modificada.

### Full sprint continuation — handlers determinísticos de rascunho

- `OrdersController` passou a concentrar também a conversão entre desconto fixo/percentual e a derivação de desconto a partir do valor final informado.
- Os bridges de `app.js` preservam somente a atualização visual já existente (scroll, campos DOM e resumo); o cálculo recebe parser monetário e subtotal por injeção, sem nova fonte de verdade.
- Gates PASS: `test-orders-controller`, `test-orders-command-service`, Pedido–Estoque–Calculadora, finalization, sintaxe, `git diff --check`, build web e `dist/*.gguf = 0`.
- A normalização e a alternância de seleção de itens agora são a mesma regra para o formulário normal e o pedido rápido; os dois fluxos continuam com seus próprios adaptadores de interface.

### Full sprint continuation — cabeçalho de Pedidos

- `OrdersController.buildOrderHeader()` passou a ser a fonte canônica para normalizar cliente, contato, observação, prazo, entrada, método de pagamento e status antes da preparação de pedido.
- `createOrderHeader()` em `app.js` é somente o adaptador de DOM/estado: coleta os valores, injeta normalizadores existentes e aplica o cabeçalho resultante ao draft atual.
- Validação ampliada em `test-orders-controller.js`; também aprovados serviço, repository, renderer, integração Pedido–Estoque–Calculadora, `node --check`, `git diff --check`, preparação web e `dist/*.gguf = 0`.

### Full sprint continuation — Inventário e Calculadora determinísticos

- `inventory-normalizers.js` agora é canônico para percentual, custo por kg, normalização de lote, lista de lotes e saldo por unidade; `app.js` manteve bridges, sem mudar status, unidade ou regras de rolo.
- `CalculatorDomain.calculateBatchPreview()` concentra quantidade válida, modo de lote, multiplicador, peso e tempo totais. O renderer de resumo no `app.js` apenas coleta campos e apresenta o resultado.
- Gates PASS: seletores, estágio de estoque, rolos, consumo, integração Pedido–Estoque–Calculadora, `test-calculator-domain`, finalization, sintaxe, diff e preparação web; `dist/*.gguf = 0`.

### Varredura de Orders — atualização estrutural

- Bridges confirmadas: criação/edição/cancelamento/fechamento, executor transacional, persistência local, lista/detalhe/PWA, materiais, prévia de rolos, timeline, histórico, rentabilidade, revisão, Dashboard, rascunho local e seleção rápida.
- `OrdersCommandService` concentra predicados e orquestração de Pedido; Caixa e Inventário seguem injetados como adapters canônicos.
- O renderizador de Pedido Rápido foi extraído integralmente para OrdersRenderer.renderQuickOrderOperational(context); o app mantém somente a ponte de estado/DOM e o teste de renderer prova o contrato direto.
- O editor principal e o menu de ações de item agora também delegam a OrdersRenderer/OrdersHandlers; o handler de item calculado conserva validação, deduplicação, crédito, telemetria e retorno visual por adapters.
- OrdersFinancial concentra parsing monetário, subtotal, desconto, entrada, taxa embutida, status e agregação financeira de Pedido. Não concentra regras de Caixa.
- A orquestração de montagem, abertura, atualização, continuidade e teclado do Pedido Rápido delega a OrdersHandlers; o app fornece somente DOM, estado e navegação.
- Varredura posterior: persistem funções nomeadas com Pedido que pertencem a Caixa, Produção/Impressoras, Dashboard, documentos ou à IA protegida. Elas não foram classificadas como lógica de Orders. No editor, o próximo resíduo estrutural é a atualização incremental do resumo visual.
- Resíduos C de renderer encerrados: renderPedido e renderPedidoRapidoOperacional agora são bridges mínimas para OrdersRenderer. A cobertura direta do contrato de contexto está em test-orders-renderer.js.
- Estado atual mensurado: `app.js` com 2.549.996 bytes e 48.340 linhas; `dist/*.gguf = 0`.

### Varredura de Orders — projeção de histórico operacional

- `getEventosOperacionaisPedido`, `getDataEventoOperacionalPedido` e `formatarDataEventoOperacionalPedido` agora são bridges mínimas para `src/features/orders/orders-operational-history.js`.
- A fronteira nova é uma projeção somente-leitura: recebe por injeção os registros de auditoria/histórico, os eventos de Produção, os movimentos já resolvidos por Caixa e os formatadores de Pedido. Não grava, não calcula saldo de Caixa e não decide status de Produção.
- `scripts/test-order-operational-history.js` passou a testar a projeção diretamente, incluindo a ordenação e a composição Pedido–Estoque–Produção–Caixa. As guardas estáticas agora leem as fontes canônicas de Orders, evitando exigir de volta código que já foi extraído.
- Gates desta passagem: histórico operacional, renderer, command service, integração Pedido–Estoque–Calculadora, finalization, sintaxe, `git diff --check` e preparação web: **PASS**. `dist/*.gguf = 0`.
- Esta extração reduz um resíduo C de Orders, mas `ORDERS=FINALIZED` continua não comprovado: ainda há fluxos transversais de documentos, dashboard e integrações com Caixa/Produção que precisam de classificação de ownership antes de qualquer migração.

### Início estrutural de Caixa — saldo vinculado a Pedido

- `calcularCaixaVinculadoPedido` deixou de implementar saldo no `app.js` e tornou-se bridge para `SimplificaCashPaymentMethods.calcularResumoCaixaVinculadoAoPedido`.
- Caixa é a fonte canônica da regra: vínculo somente por `pedidoId`/`pedido_id`/`orderId`/`order_id`, exclusão de movimentos cancelados ou removidos, centavos inteiros e saldo negativo válido. Descrição ou valor semelhante continuam sem efeito sobre o vínculo.
- Orders consome apenas o resumo e injeta o predicado de cancelamento. Nenhuma regra de Caixa foi copiada para `OrdersCommandService`.
- Gates: `test-cash-payment-methods`, `test-phase5-order-cash`, histórico operacional, renderer/comandos de Pedidos, integração Pedido–Estoque–Calculadora, finalization, sintaxe, diff e preparação web: **PASS**. `dist/*.gguf = 0`.

### Caixa — composição financeira canônica e fallback legado

- `operacaoFinanceiraLegadaDoPedido` e `getDadosFinanceirosCanonicosComFallback` agora são bridges de `cash-payment-methods.js`.
- A fronteira de Caixa recebe estado local, eventos, operações/movimentos adaptados e pedidos por injeção; constrói apenas a visão de leitura para o core financeiro. Sincronização, persistência, Supabase e timers permanecem no app/composição existente.
- O fallback não recria venda que já possua `sale_id` ou evento vinculado. Eventos pendentes formam movimento transitório; eventos sincronizados não duplicam movimento. Essa deduplicação é coberta diretamente no teste de Caixa.
- Gates desta passagem: `test-cash-payment-methods`, `test-phase5-order-cash`, serviço/histórico de Pedidos, finalization, sintaxe, diff e preparação web: **PASS**. `app.js`: 2.499.581 bytes / 50.808 linhas; `dist/*.gguf = 0`.

### Caixa — fila local de eventos financeiros de Pedido

- `registrarEventoFinanceiroPedidoLocal` virou bridge para `SimplificaCashPaymentMethods.enfileirarEventoFinanceiroDoPedido`.
- Caixa prepara e deduplica o evento por `operationUuid`, preserva a fila limitada a 300 entradas, atualiza o marcador de pendência e agenda a sincronização. O `app.js` fica responsável somente pelos adapters de estado, persistência local, horário e timer.
- Quando a empresa não possui UUID válido, a transição `pending_company` e a persistência continuam iguais; nenhuma chamada remota foi introduzida ou alterada nesta extração.
- Teste direto ampliado em `test-cash-payment-methods`: fila idempotente, estado pendente, marcador e atraso de agendamento. Gates de Caixa/Pedidos, finalization, sintaxe, diff e build web: **PASS**. `dist/*.gguf = 0`.

### Caixa — repositório remoto canônico

- Criado `src/features/cash/cash-repository.js`, carregado antes do app: `ensurePaymentMethods` e `refreshCanonicalFinancialCache` são agora as implementações canônicas de RPC/leitura do Caixa.
- Bridges no `app.js` preservam URL, token, conectividade, estado e a função de requisição existente. Não houve alteração de schema, RPC, endpoint, chave, RLS ou política.
- `test-cash-repository.js` cobre cache de métodos, RPC somente quando o cache está vazio, leitura paralela das três coleções e bloqueio antes de qualquer chamada sem UUID/token/conectividade válidos.
- Após consultar as mudanças/documentação do Supabase, a extração conservou as chamadas REST/RPC existentes e não adicionou tabelas nem alterou exposição da Data API. Gates: repositório, Caixa, Pedidos, finalization, sintaxe, diff e build web: **PASS**. `dist/*.gguf = 0`.

### Varredura estrutural de Caixa — próximo corte obrigatório

| Resíduo no `app.js` | Classe | Fronteira de destino | Decisão |
| --- | --- | --- | --- |
| `sincronizarEventosFinanceirosPendentes` e agendamento | C. DOMAIN_IMPLEMENTATION / APP_WIRING | `CashSyncService` + bridge de lock/timer | migrar como bloco único; preservar UUID, token, conectividade, RPC e idempotência |
| abertura, fechamento, edição, exclusão e lançamento de movimento | C. DOMAIN_IMPLEMENTATION | `CashCommands` / `CashController` | **extraído** para `cash-commands.js` (ver seção abaixo) |
| `renderCaixa`, extrato, filtros e cards | C. RENDERER_IMPLEMENTATION | `CashRenderer` | **extraído** para `cash-renderer.js` (ver seção abaixo) |
| `getEmpresaIdFinanceiroAtual`, storage e timers | B. APP_WIRING | composition root | manter como adapters mínimos enquanto os serviços recebem injeção |
| `getProjecaoFinanceiraCanonica`, diagnóstico e Dashboard | A. REQUIRED_BRIDGE / domínio Relatórios | Cash read-model / Reports | não classificar como Orders e não duplicar no serviço de Pedidos |

Após `CashSyncService`, `CashCommands` e `CashRenderer`, `CASH_IMPLEMENTATION_IN_APP_JS` rebaixado a resíduos classe A/B (read-model, estado de tabs, adapters e bridges) sem implementação real de domínio restante; ver seção de fechamento.

### Caixa — CashSyncService

- Criado `src/features/cash/cash-sync-service.js` com a implementação integral de `sincronizarEventosFinanceirosPendentes` e do agendamento, carregado antes do `app.js` via `index.html` e `prepare-web.js`.
- O serviço concentra lock local, fila de até 30 por rodada, idempotência por `operationUuid`, os dois RPCs (`register_sale_financial_operation` e `register_order_financial_cancellation`), marcador do Pedido, callbacks de persistência/erro, guarda de token/usuário/conectividade/UUID, refresh de cache e render após sucesso.
- `app.js` ficou somente com `getCashSyncServiceDeps` (adapters) e as bridges `sincronizarEventosFinanceirosPendentes` / `agendarSincronizacaoFinanceiraCanonica` delegando ao serviço; os RPCs saíram do `app.js`.
- `test-erp-cash-fiscal-foundation.js` passou a localizar os RPCs em `app.js + cash-sync-service.js` e a exigir a posse dos RPCs no serviço.
- `test-cash-sync-service.js` cobre sucesso de venda, cancelamento, falha com retries/marcador de erro, idempotência, lote de 30, guardas SKIPPED, lock concorrente e debounce de agendamento.
- Gates desta passagem: `test-cash-sync-service`, `test-cash-repository`, `test-cash-payment-methods`, `test-phase5-order-cash`, `test-app-js-finalization`, `test-erp-cash-fiscal-foundation` (fundação + baseline UI), `test-orders-command-service`, `test-orders-renderer`, `test-order-operational-history`, `test-order-stock-calculator-flow`, `node --check app.js`, `git diff --check`, `prepare-web.js`: **PASS**. `dist/*.gguf = 0`.
- Próximo corte de Caixa: `CashCommands`/sessão (abertura, fechamento, edição, exclusão e lançamento de movimento), depois `CashRenderer`/extrato.

### Caixa — CashCommands

- Criado `src/features/cash/cash-commands.js` com a transação única de sessão e movimentos: `openAutomaticSession`, `openManualSession`, `closeSession`, `addMovement`, `editMovement` e `cancelMovement`, carregado antes do `app.js` via `index.html` e `prepare-web.js`.
- O módulo concentra abertura idempotente com shadow, fechamento com diff/justificativa, lançamento com `criarMetadadosOperacaoFinanceira("caixa_manual"`, edição e cancelamento com Dialog V3, persistência, histórico, auditoria e efeitos de scroll/render.
- `app.js` ficou com `getCashCommandsDeps` (adapters: DOM, UiV3, confirmação sensível, crédito free, shadow, persistência, histórico) e as bridges `abrirSessaoCaixaAutomatica`, `abrirSessaoCaixaManual`, `fecharSessaoCaixaBasica`, `adicionarMovimentoCaixa`, `editarMovimentoCaixa` e `removerMovimentoCaixa` preservando nomes/assinaturas para `action-registry`, `getOrdersCommandDeps` e onclick.
- Gates atualizados no padrão de paridade: `test-erp-cash-fiscal-foundation` localiza `caixa_manual`/`registrado no caixa` em `app.js + cash-commands.js` e exige posse no módulo; `test-app-js-finalization` asserta delegação das seis bridges; `test-ui-v3-finance` asserta Dialog V3 no módulo; `test-sensitive-action-guards` aceita guarda via posse no módulo para as bridges Cash e também resolve `data-preserve-focus-key` nos renderers Orders/Customers; `test-account-cash-history` aceita a hidratação por `.then` existente no login.
- `test-cash-commands.js` cobre abertura idempotente/bloqueada, abertura manual com confirmação, fechamento com diff+justificativa, lançamento com descrição obrigatória em saída/cancelamento na confirmação, edição e cancelamento de movimento com shadow/persistência/histórico/auditoria.
- Gates desta passagem: `test-cash-commands`, `test-cash-sync-service`, `test-cash-repository`, `test-cash-payment-methods`, `test-phase5-order-cash`, `test-app-js-finalization`, `test-ui-v3-finance`, `test-sensitive-action-guards`, `test-account-cash-history`, `test-orders-command-service`, `test-orders-renderer`, `test-orders-handlers`, `test-orders-controller`, `test-order-operational-history`, `test-order-stock-calculator-flow`, `node --check app.js`, `git diff --check`, `prepare-web.js`: **PASS**. `dist/*.gguf = 0`. `test-erp-cash-fiscal-foundation`: fundação **PASS**, baseline UI `Forma da entrada`/`Aparece no Caixa...` inalterado (exit 1 documentado).
- Próximo corte de Caixa: `CashRenderer`/extrato (renderCaixa, filtros, cards e mensagens de UI de baseline).

### Caixa — gate de fundação e baseline de UI

- `test-erp-cash-fiscal-foundation.js` confirmou as seis camadas estruturais/financeiras (fundação, hardening, idempotência, shadow/integridade, reconciliação e worker).
- O mesmo script ainda reporta duas strings de UI ausentes: `Forma da entrada` e `Aparece no Caixa quando houver entrada.`. A comparação com `HEAD` confirma que a expectativa já existia e a extração atual não alterou `app.js` nessa área; registrar como baseline de renderer de Caixa, não regressão nova.
- Não corrigir essas mensagens durante a extração de sync/repository: pertencem ao futuro corte integral de `CashRenderer` e requerem prova visual específica.

### Caixa — CashRenderer/extrato e fechamento do domínio

- Criado `src/features/cash/cash-renderer.js` com as 48 funções contíguas do bloco de renderização/filtros/extrato do Caixa (`renderCaixa`, overview, hero, cards, linhas, filtros, busca, topbar, exportação etc.), carregado antes do `app.js` via `index.html` e `prepare-web.js`; IIFE `attachCashRenderer` com `context` explícito no padrão orders-renderer e `module.exports` para testes.
- `app.js` ficou com `getCashRendererDeps` (50 adapters de estado/DOM/utilitários, criados frescos a cada chamada para capturar bindings reatribuíveis como `caixa`) e 48 bridges mínimas preservando nomes globais, assinaturas e literais `function` usados pelos gates.
- Extração realizada por script AST (`typescript`), com: correção de calls irmã passando `context` (incluindo wrap de referência first-class no `.map` do extrato), injeção de destructure + defaults hoistados, e verificação de unicidade/paridade das 48 funções.
- Resíduos reais de domínio remanescentes foram extraídos em micro-corte: `adaptarMovimentoFinanceiroCanonicoParaCaixa` e `calcularTotaisCaixaPeriodo` migraram para `cash-payment-methods.js` (normalização canônica e totais por período), mantendo bridges no `app.js` com a assinatura original e helpers injetados (`isCancelled`, `getMovementDate`, `inRange`).
- Teste de contrato criado: `scripts/test-cash-renderer.js` (exports, movimentos, visões, extrato/linha/texto, topbar, classificação de origem em lowercase). `test-cash-payment-methods.js` ampliado com a adaptação canônica (read-only, id `canonical:`, resolução de método) e os totais por período (intervalo, cancelamento, tipo).
- Gates de paridade atualizados: `test-ui-v3-foundation`, `test-ui-v3-finance`, `test-account-cash-history` (inclui haystack `cash-payment-methods` para `canonical_readonly`), `test-manual-production-ui`, `test-erp-cash-fiscal-foundation` (haystack + posse no módulo), `test-app-js-finalization` (módulo no `expectedModules` + delegação) e `test-navigation-behavioral` O3 (chamada de `renderListaPedidosPwa` localizada em `orders-renderer.js` com gate `isWebPwaProfile`).
- `CASH = FINALIZED`: não resta implementação real de domínio de Caixa no `app.js`. Resíduos mantidos e classificados: **A** read-model (`getMovimentosCaixaDaConta`, `getProjecaoFinanceiraCanonica`), **B** estado/ads/wiring de tabs e período (`trocarFiltroCaixa`, `getCaixaViewAtiva`, `getInfoPeriodoCaixa`, `filtrarMovimentosCaixaPorPeriodo`, `getSessaoCaixaAtual`, `getPaymentMethodsConfig` etc.), helpers de uma linha (`descricaoCaixa`, `obterDataMovimentoCaixa`, `movimentoCaixaCancelado`, `getIdSessaoMovimentoCaixa`) e painéis de Dashboard (ownership Dashboard).
- `ORDERS_VISUAL_PROOF`/`APP_JS_FINALIZED=NO` inalterados: o fechamento de Caixa não altera os demais domínios.
- Gates desta passagem: `test-cash-renderer`, `test-cash-commands`, `test-cash-sync-service`, `test-cash-repository`, `test-cash-payment-methods`, `test-phase5-order-cash`, `test-erp-cash-fiscal-foundation`, `test-ui-v3-foundation`, `test-ui-v3-finance`, `test-sensitive-action-guards`, `test-navigation-stage-1`, `test-navigation-behavioral`, `test-app-js-finalization`, `test-account-cash-history`, `test-orders-renderer`, `test-orders-command-service`, `test-order-operational-history`, `test-domain-renderer-parity`, `node --check app.js`/módulos, `git diff --check`, `prepare-web.js`: **PASS**. `dist/*.gguf = 0`.
- Baselines preservados (não regressão, não mascarados): `test-manual-production-ui` reproduz a string documentada `Acompanhe somente Em fila, Imprimindo e Pronto.` ausente desde o baseline; `test-interface-modes` falha por needle com `\n` contra working tree CRLF (não consta da lista obrigatória).
- Métricas: `app.js`: **2.417.187 bytes**, **49.213 linhas**.
- Próximo corte da sequência: **Production** (controller/repository/renderer próprios), depois Printers, Storefront, Config/Account/Company/Users, resíduos, Routing, Events e Bootstrap.

### Production — repositório (persistência Supabase)

- Criado `src/features/production/production-repository.js` com as 12 funções de persistência/mapeamento da produção manual: `gerarUuidProducao`, `normalizarIdsProducaoParaSupabase`, `extrairDimensoesMesaProducao`, payloads (`payloadImpressoraProducao`, `payloadTarefaProducao`, `payloadEventoProducao`), `sincronizarProducaoManualSupabaseSilencioso`, mapeamentos remotos (`mapearImpressoraProducaoRemota`, `mapearTarefaProducaoRemota`, `mapearEventoProducaoRemoto`) e, movidos manualmente por rebind de estado, `carregarProducaoManualSupabaseSilencioso` e `salvarProducaoManual`.
- Extração das 10 funções contíguas sem rebind feita por script AST (`extract-production-repository.js`, padrão CashRenderer); `carregar`/`salvar` exigiram setters explícitos (`setProductionPrinters/Jobs/Events`) porque reatribuem os `let` de estado do `app.js` — os setters vivem em `getProductionRepositoryDeps` e capturam os bindings do app.
- `app.js` ficou com `getProductionRepositoryDeps` (inclui `crypto`, `syncConfig`, `requisicaoSupabase`, estado das três listas, `mesclarListas`, `agendarSyncSilenciosoDados`, `registrarDiagnostico`, `window` e os três setters) e 12 bridges preservando assinaturas (inclui `async` de sincronizar/carregar) e literais `function` exigidos pelo gate.
- `registrarEventoProducao` permanece no `app.js` nesta passagem: reatribui `productionEvents` e pertence à camada de workflow/commands (corte P2).
- Teste criado: `scripts/test-production-repository.js` (UUID v4 + fallback, remapeamento de ids/referências, payloads com guards de UUID/empresa/usuário, mapeamentos remotos, guards de token/online/UUID, carga com mesclagem+caps+callbacks e save com debounce).
- Gates de paridade: `test-manual-production-ui` lê `production-repository.js` no haystack das três URLs `on_conflict` (demais marcadores seguem como bridges no app; baseline da frase `Acompanhe somente Em fila...` inalterada); `test-app-js-finalization` ganhou o módulo em `expectedModules` e três asserts de delegação; registro em `index.html` (`?v=app-js-finalization-production-repository`) e `prepare-web.js`.
- Gates desta passagem: `test-production-repository`, todos os gates de Caixa/Orders/finalization/navigation/fiscal/ui/sensitive/account, `node --check` app+módulo, `git diff --check`, `prepare-web.js`: **PASS**. `test-manual-production-ui`: apenas o baseline documentado (exit 1 esperado). `dist/*.gguf = 0`.
- Próximo subcorte de Production: **commands/workflow** (validação, pendências, liberação, fila, prioridade, status, placas, reimpressão, qualidade, CRUD de impressora manual) e depois **renderer** (`renderProducao`, tarefas, capacidade, histórico).

### Production — commands/workflow (P2)

- Criado `src/features/production/production-commands.js` com as 19 funções contíguas `validarPedidoParaProducao`..`desativarImpressoraProducao` (validação/pagamento, liberação/pendência, fila/comparação, prioridade, atribuição de impressora, placas concluídas, status de tarefa, reimpressão, qualidade e CRUD de impressora manual) mais `registrarEventoProducao`, movido manualmente nesta passagem (rebind de `productionEvents` via setter `setProductionEvents`, padrão do corte de repositório) — **20 exports**.
- Extração das 19 contíguas feita por script AST (`extract-production-commands.js`, cópia do script Cash/Repository): calls irmãs recebem `context`, destructure de deps por função e wrap de referência first-class (`.sort(compararTarefasProducao)`) com aridade corrigida; 35 deps injetadas no script, `getUsuarioAtual` e `setProductionEvents` acrescentados ao final em `getProductionCommandsDeps` (37 entradas) no `app.js`.
- Correção de bug latente na origem antes da extração: o título do modal em `abrirCadastroImpressoraProducao` referenciava `printerId` inexistente no escopo (ReferenceError ao promover o popup para Dialog V3); corrigido para `id`, com asserção de contrato no teste (`title: id ? "Editar impressora" : "Cadastrar impressora"`).
- `app.js` ficou com `getProductionCommandsDeps` (bindings frescos de estado, UI, pedidos, estoque, eventos e os setters de `productionJobs`/`productionEvents` via closures) e 20 bridges mínimas preservando assinaturas e literais `function` exigidos pelos gates; `registrarEventoProducao` virou bridge e o módulo aplica o cap de 800 eventos via setter, mutando a lista viva (`push`) antes do slice, mantendo a semântica original.
- Teste criado: `scripts/test-production-commands.js` (20 exports; validação com faltas felizes/material; pagamento por status/restante/autorização; ordenação por prazo/prioridade; fila `na_fila→proximo`; prioridade sem justificativa bloqueia e com justificativa registra evento; status `em_impressao` sem impressora bloqueado e com impressora ocupa a máquina; reimpressão vira cabeça da fila com `parentJobId` e marca origem `falhou`; qualidade aprovada leva a `pronto_para_entrega`; título do modal edit/create; desativação com `confirm`; pendência com motivo/ evento/ troca de tela; eventos com trim, `createdBy` e cap 800).
- Gates de paridade: `test-manual-production-ui` lê `production-commands.js` e usa haystack `app + productionRepository + productionCommands` para os guards `em_impressao`/justificativa de prioridade (marcadores `function ...` continuam satisfied pelos bridges; `Liberar para produção` existe em ambos; baseline da frase `Acompanhe somente Em fila...` inalterada); `test-app-js-finalization` ganhou o módulo em `expectedModules` e três asserts de delegação (`confirmarLiberacaoProducao`, `atualizarStatusTarefaProducao`, `criarReimpressaoProducao`); registro em `index.html` (`?v=app-js-finalization-production-commands`) e `prepare-web.js`.
- Gates desta passagem: `test-production-commands`, `test-production-repository`, `test-app-js-finalization`, `test-cash-renderer`, `test-cash-commands`, `test-cash-sync-service`, `test-cash-repository`, `test-cash-payment-methods`, `test-erp-cash-fiscal-foundation`, `test-ui-v3-foundation`, `test-ui-v3-finance`, `test-sensitive-action-guards`, `test-navigation-stage-1`, `test-navigation-behavioral`, `test-account-cash-history`, `test-orders-renderer`, `test-orders-command-service`, `test-order-operational-history`, `test-domain-renderer-parity`, `test-customers-renderer`, `test-phase5-order-cash`, `node --check app.js`/módulos, `git diff --check`, `prepare-web.js`: **PASS**. `test-manual-production-ui`: apenas o baseline documentado (exit 1 esperado). `dist/*.gguf = 0`.
- Métricas: `app.js`: **2.417.187 bytes**, **49.213 linhas**; `production-commands.js`: 504 linhas.
- Pendências de Production: comandos Bambu remanescentes no `app.js` (`getImpressoesExternasMonitoradas`, `abrirVinculoImpressaoBambuPedido`/`vincularImpressaoBambuPedido`, confirmação/desperdício/falha/reimpressão Bambu) e o bloco de renderer (`renderProductionPrinterOptions`, `renderTarefaProducao`, `getResumoCapacidadeProducao`, `renderResumoCapacidadeProducao`, `renderImpressorasProducao`, `renderPerfilImpressoraProducao`, `abrirImpressoraAtivaProducao`, `getTarefasProducaoPorAba`, `renderProducao`).
- Próximos subcortes: **P2b comandos Bambu** e **P3 renderer da Produção** (revisando o contrato da frase `Acompanhe somente Em fila, Imprimindo e Pronto.` — não mascarar), depois Printers, Storefront, Config/Account/Company/Users, resíduos, Routing, Events e Bootstrap.

### Production — comandos Bambu (P2b)

- Criado `src/features/production/production-bambu-commands.js` com as 15 funções contíguas `getImpressoesExternasMonitoradas`..`confirmarConclusaoImpressaoBambu` (monitoramento de impressões externas/vínculo Bambu ao pedido, abertura/edição do vínculo, confirmação de conclusão, desperdício, falha e reimpressão Bambu, resumo de desperdício, custo de material perdido, materiais por impressão, progresso/status da impressora e helpers de material/estoque) — **15 exports**.
- Extração por script AST (`extract-production-bambu-commands.js`, cópia do script de commands): calls irmãs recebem `context`, destructure de deps por função e wrap de referência first-class com aridade corrigida; 28 deps (document, window, impressoras/estoque/pedidos/jobs, `InventoryService`, toasts, scroll, eventos) injetadas via `getProductionBambuCommandsDeps` no `app.js`.
- `app.js` ficou com `getProductionBambuCommandsDeps` (inserido entre `getResumoCapacidadeProducao` e `renderResumoCapacidadeProducao`) e 15 bridges mínimas preservando assinaturas e literais `function` exigidos pelos gates; corpos de implementação originais não permanecem no `app.js` (verificado), `PRODUCTION_BAMBU_COMMAND_IMPLEMENTATION_IN_APP_JS = 0`.
- Nota de layout pré-P3: as bridges do Bambu ficam dentro do futuro range do renderer (`renderProductionPrinterOptions`..`renderProducao`); antes do extract P3, relocar `getProductionBambuCommandsDeps` + as 15 bridges para logo após `desativarImpressoraProducao` (antes de `renderProductionPrinterOptions`) para o bloco do renderer ficar contíguo.
- Gates de paridade: `test-printer-monitoring-read-only` ganhou leitura `productionBambuCommands` e `productionHaystack = app + productionBambuCommands` (conteúdo checado no módulo, marcadores `function X` no `app`; literal de `confirmarConclusaoImpressaoBambu(job.id` revisto para o prefixo sem `)` pela injeção de `context`); `test-manual-production-ui` usou haystack `app + productionRepository + productionCommands + productionBambuCommands`; `test-app-js-finalization` ganhou o módulo em `expectedModules` e dois asserts de delegação (`registrarFalhaImpressaoBambu`, `confirmarConclusaoImpressaoBambu` → `SimplificaProductionBambuCommands`); `test-phase6-capacity` delimitador final migrado para `getProductionBambuCommandsDeps`; registro em `index.html` (`?v=app-js-finalization-production-bambu-commands`) e `prepare-web.js`.
- Gates desta passagem: `test-phase6-capacity`, `test-printer-monitoring-read-only`, `test-app-js-finalization`, `test-production-commands`, `test-production-repository`, `test-cash-payment-methods`, `test-account-cash-history`, `test-erp-cash-fiscal-foundation`, `test-phase5-order-cash`, `test-calculator-reconciliation`, `test-sensitive-action-guards`, `test-navigation-behavioral`, `test-navigation-stage-1`, `test-ui-v3-foundation`, `test-ui-v3-finance`, `test-orders-command-service`, `test-orders-controller`, `test-orders-renderer`, `test-order-operational-history`, `test-order-stock-calculator-flow`, `test-reports-formatters`, `test-mobile-visual-stability`, `test-modularization-batch-3`, `test-quick-order-multiselect`, `node --check app.js`/módulo, `git diff --check`, `prepare-web.js`: **PASS**. `test-manual-production-ui`: apenas o baseline documentado (exit 1 esperado). `test-scroll-technical-ui-audit`: falha preexistente (CSS/`sw.js` intocados; string de cache `v297…20260715` obsoleta frente a `v1040…20260914`) — não é regressão. `dist/*.gguf = 0`.
- Métricas: `app.js`: **2.403.670 bytes**, **49.115 linhas**; `production-bambu-commands.js`: 15 funções.
- Pendências de Production: bloco de renderer (`renderProductionPrinterOptions`..`renderProducao`) e contrato da frase `Acompanhe somente Em fila, Imprimindo e Pronto.` (P3; localizar origem real, não inventar texto).
- Próximo subcorte: **P3 renderer da Produção**, depois varredura final → `PRODUCTION = FINALIZED`, então Printers, Storefront, Config/Account/Company/Users, resíduos, Routing, Events e Bootstrap.

### Production — renderer (P3) e varredura final → PRODUCTION = FINALIZED

- **Relocation pré-extração:** `getProductionBambuCommandsDeps` + as 15 bridges Bambu movidas (script `relocate-bambu-bridges.js`, corte puro de mesmo tamanho) para logo após `desativarImpressoraProducao`, deixando o bloco do renderer contíguo (`renderProductionPrinterOptions`..`renderProducao`).
- **P3 — `src/features/production/production-renderer.js`:** extração por script AST (`extract-production-renderer.js`) das9 funções contíguas `renderProductionPrinterOptions`, `renderTarefaProducao`, `getResumoCapacidadeProducao`, `renderResumoCapacidadeProducao`, `renderImpressorasProducao`, `renderPerfilImpressoraProducao`, `abrirImpressoraAtivaProducao`, `getTarefasProducaoPorAba` e `renderProducao` — **9 exports** no corte inicial;34 deps via `getProductionRendererDeps` +9 bridges; wrap de referência first-class `renderTarefaProducao` em `renderProducao` (arity corrigida). Registro: `index.html` (`?v=app-js-finalization-production-renderer`), `prepare-web.js` e `expectedModules` em `test-app-js-finalization`.
- **Varredura final — apêndice de domínio no renderer (script `extract-append-block.js`, preset `renderer-history`):** movidos para `production-renderer.js` o cluster de histórico/perdas `getDataConclusaoTarefaProducao`, `getHistoricoProducaoNoPeriodo`, `carregarMaisHistoricoProducao`, `getPesoPlanejadoTarefaProducao`, `getCustoMaterialPorGramaTarefaProducao` e `renderHistoricoProducao` (6 exports; `formatarMinutosProducao` era bridge no meio do range e foi **excluída/reemitida no app**); deps do renderer:34 → **43** (entram `getPeriodoHistoricoProducao`, `PRODUCTION_HISTORY_PAGE_SIZE`, `formatarMoeda`, `formatarMinutosProducao`, `getMateriaisItem`, `getMaterialEstoque`, `getProductionItemMaterial`, `getProductionPrinterLabel`, `normalizarItensPedido`, `getDataEventoOperacionalPedido`).
- **Varredura final — codegen/material nos commands (preset `commands-codegen`):** movidos `getProductionCodeSequence`, `gerarCodigoProducao` e `getProductionItemMaterial` (3 exports;20 → **23**); deps dos commands:37 → **39** (`getMateriaisItem`, `getMaterialEstoque`); callers existentes do módulo seguem resolvendo via shadow na deps list (entradas já presentes).
- **Contrato da frase `Acompanhe somente Em fila, Imprimindo e Pronto.`:** origem real revisada — a string **não existe em nenhum arquivo do repositário** (apenas no gate e nos docs de baseline); tratada como lacuna de copy pré-existente, não mascarada e não inventada.
- **Resíduos de Produção classificados (sem nova regra no app, padrão Cash A/B):** *estado/tabs* `getProductionTab`, `trocarAbaProducao`, `getPeriodoHistoricoProducao`, `trocarPeriodoHistoricoProducao`, `getProductionCompanyId`; *read-model* `getProductionPrinter`, `getProductionJob`, `getProductionOrder`, `getProductionPrinterLabel`; *adapters/wiring* `getRegisteredPrinterForProductionJob/Printer`, `getProductionPrinterLiveInfo`, `sincronizarImpressorasMonitoradasComProducao` (sync monitoradas→produção), `abrirPainelImpressoraProducao`, `abrirImpressoraDaProducao` (navegação Produção→Printers); *composition* `getProduction{Repository,Commands,BambuCommands,Renderer}Deps`; *fora do domínio* — cluster Bambu LAN/MQTT/login/pilot (Printers, fase própria) e `renderDashboardDesktopProductionPanel` (lê `pedidos`, ownership Dashboard/Home).
- **Gate final de invariantes de Production (todos zerados):** `PRODUCTION_DOMAIN_LOGIC = 0` (codegen, material, matemática de perdas e filtro de histórico extraídos), `PRODUCTION_COMMAND = 0` (23 bridges), `PRODUCTION_BAMBU_COMMAND_IMPLEMENTATION_IN_APP_JS = 0` (15 bridges), `PRODUCTION_RENDERER = 0` (15 exports do renderer como bridges), `PRODUCTION_REPOSITORY = 0` (12 bridges), `PRODUCTION_PERSISTENCE = 0` e `PRODUCTION_DIRECT_SUPABASE = 0` (`/rest/v1/production_` e `.from("production_")` no app = 0), `PRODUCTION_HANDLER = 0` (handlers de workflow em commands; residuais de navegação classificados como adapters), `PRODUCTION_DUPLICATED_RULES = 0` e `PRODUCTION_DUPLICATED_IMPLEMENTATIONS_IN_APP_JS = 0` (varredura:65 exports verificados, todos bridge,0 corpos duplicados). **`PRODUCTION = FINALIZED`.**
- Gates de paridade P3/varredura: `test-phase6-capacity` reescrito para `require` do `production-renderer` + assert de bridge (delimitador antigo quebrava pós-reloc); `test-mobile-visual-stability` ganhou leitura do renderer para a frase `As impressoras são controladas manualmente.`; `test-manual-production-ui` haystack `app + repository + commands + bambu + renderer` e a frase de impressoras manuais migrada do app para o haystack (baseline `Acompanhe somente...` permanece o único miss); `test-production-commands` atualizado para **23 exports** com asserts de `gerarCodigoProducao`, `getProductionCodeSequence` e `getProductionItemMaterial`; `test-app-js-finalization` ganhou asserts de `renderHistoricoProducao`, `gerarCodigoProducao` e `getProductionItemMaterial`.
- Gates desta passagem: suíte core21/22 **PASS** (`test-phase6-capacity`, `test-printer-monitoring-read-only`, `test-app-js-finalization`, `test-production-commands`, `test-production-repository`, Cash/Orders/fiscal/navigation/sensitive/ui/mobile/modularization/quick-order, `test-ui-v3-foundation`, `test-ui-v3-finance`, `test-navigation-stage-1`), `node --check app.js` +3 módulos production, `git diff --check`, `prepare-web.js` (GGUF=0). Baselines preexistentes preservados: `test-manual-production-ui` (exit1 só com a frase inexistente), `test-scroll-technical-ui-audit` (CSS/`sw.js` intocados), `test-ui-v3-operational` (linha9 falha já no HEAD por `data-ui3-screen="clientes"` ausente — verificado contra `HEAD`; markers `pedido`/`pedidos` vivem em `orders-renderer.js`, `clientes` em `customers-renderer.js`).
- Métricas: `app.js`: **2.379.815 bytes**, **48.896 linhas**; `production-renderer.js`:30.163 bytes/346 linhas (**15 exports**); `production-commands.js`:29.153 bytes/532 linhas (**23 exports**); `production-bambu-commands.js`:15 exports; `production-repository.js`:12 exports.
- Próximo domínio: **Printers** (fluxos e renderer; boundary — conexão/status técnico são de Printers; vínculo Pedido↔job e decisão operacional são de Production), depois Storefront, Config/Account/Company/Users, resíduos, Routing, Events e Bootstrap.

### Printers — PR1 (service/role/backend ops)

- **PR1 — `src/features/printers/printers-operations.js`:** extração por script AST (`extract-append-block.js`, preset `printers-operations`) das 8 funções contíguas `getPrinterMonitoringService`, `getPrinterBackendConfig`, `printerBackendRequest`, `getPrinterRole`, `podeGerenciarImpressoras`, `podeOperarImpressoras`, `getImpressorasAtivas` e `sincronizarImpressorasComCalculadora` — **8 exports** (linhas 25062..25113 do app no corte), IIFE `attachPrintersOperations` / `global.SimplificaPrintersOperations` no padrão bridges+deps; placeholder `printersOperationsModuleSeed` removido após o `--write`.
- **Deps:** 0 → **11** via `getPrintersOperationsDeps` no app (`billingConfig, getInterfaceMode, getUserAccessRole, getUsuarioAtual, isSuperAdmin, printerMonitoringState, printers, SUPABASE_DEFAULT_ANON_KEY, SUPABASE_DEFAULT_URL, syncConfig, window`); **8 bridges** mínimas preservando literais `function` exigidos pelos gates; `printers[nome] = {...}` é element-assignment (mutação por referência via context).
- Registro: `index.html` L215 (`?v=app-js-finalization-printers-operations`), `prepare-web.js` L127, `expectedModules` em `test-app-js-finalization.js` L36. `sw.js` não referencia módulos printers (`SW_NO_PRINTERS_MODULE_REFS`).
- Dry-run: 0 warnings / 0 errors; `node --check app.js` + módulo = 0; `require(módulo)` expõe 8 exports;16 edições fase B.
- **Gates pós-PR1:24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline pré-existente: `.quick-order-layout`/`.stock-list` + cache `v297…20260715`); `test-printer-monitoring-read-only` PASS, `test-app-js-finalization` PASS, `test-mobile-visual-stability` PASS, `test-ui-v3-operational` isolado só baseline L9, `prepare-web` PASS (GGUF=0), `git diff --check` só warnings CRLF.
- Métricas pós-PR1: `app.js`: **2.379.300 bytes**, **48.890 linhas**; `printers-operations.js`: 67 linhas / 8 exports.
- **Próximos cortes Printers (ordem):** PR2 bloco B `hidratarImpressorasSeNecessario..getPrinterDisplayModel` (4 fns; atualizar `test-printer-monitoring-read-only` L64 para haystack `app + printers-operations`), PR3 bloco C `isBambuPrinterCandidate..abrirCameraImpressora` (18), PR4 bloco D `abrirPainelImpressora..getPrinterQueueStageLabel` (22; EXCLUDE 3 bridges printer-presentation), PR5 bloco E `renderPrinterOrderQueue..renderImpressoras` (2), PR6 bloco F `configurarAcoesCadastroImpressora..salvarCadastroImpressora` (17; haystack L153/L154), PR7 bloco G `abrirLoginBambu..renderizarConclusaoBambu` (11), PR8 bloco H `desconectarContaBambu..criarAgenteLocal` (8; haystack L157-160 + pares UIV3), solteiro `garantirImpressorasMonitoradasCarregadas`, pilot `abrirGuiaPilotoBambu..salvarProgressoPilotoBambu` (dentro de F) → `PRINTERS = FINALIZED`. Boundary: adapters Production (`sincronizarImpressorasMonitoradasComProducao`, `getRegisteredPrinterForProduction*`, `getProductionPrinterLiveInfo`, `abrirPainelImpressoraProducao`, `abrirImpressoraDaProducao`) permanecem full no app.

### Printers — PR2 (hidratação/status display)

- **PR2 — bloco B em `printers-operations.js` (append, preset `printers-operations` reconfigurado):** extração das 4 funções contíguas `hidratarImpressorasSeNecessario` (async), `getPrinterCurrentStatus`, `getPrinterDisplayBrand` e `getPrinterDisplayModel` (app L25156..25217 no corte) — **8 → 12 exports**.
- **Deps:** 11 → **18** (`+ conectarBambuMqttCloudAutomatico, getPrinterMonitoringService, printerBackendRequest, renderizarPreservandoScroll, sincronizarImpressorasComCalculadora, sincronizarImpressorasMonitoradasComProducao, telaAtual`);5 edições fase B;4 bridges no app;0 warnings / 0 errors no dry-run; `node --check` app + módulo = 0; `require` expõe12 exports.
- Gate `test-printer-monitoring-read-only` **L64** migrado para haystack `printersHaystack = app + printers-operations` (`const requestId = ++printerMonitoringState.requestId` sai do app junto com `hidratarImpressorasSeNecessario`).
- **Gates pós-PR2:24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline pré-existente); `test-printer-monitoring-read-only` PASS, `test-app-js-finalization` PASS, `test-mobile-visual-stability` PASS, `prepare-web` PASS (GGUF=0), `git diff --check` só warnings CRLF; `test-ui-v3-operational` isolado só baseline L9.
- Métricas pós-PR2: `app.js`: **2.376.639 bytes**, **48.851 linhas**; `printers-operations.js`: **12 exports**.
- Próximo: **PR3 bloco C** `isBambuPrinterCandidate..abrirCameraImpressora` (18 fns).

### Printers — PR3 (cluster Bambu LAN/MQTT/câmera)

- **PR3 — bloco C em `printers-operations.js` (append):** extração das 18 funções contíguas `isBambuPrinterCandidate` .. `abrirCameraImpressora` (L25179..25514 no corte) — **12 → 30 exports**: `isBambuPrinterCandidate`, `getBambuAmsSlots`, `getPrinterProgressValue`, `getPrinterCameraStreamUrl`, `getBambuLanPlugin`, `hidratarBambuLanState`, `conectarBambuMqttCloudAutomatico`, `getBambuLanPrinter`, `normalizarEstadoBambuLan`, `getBambuVisualFingerprint`, `atualizarElementosStatusBambu`, `agendarRenderStatusBambu`, `aplicarStatusBambuLan`, `abrirConfiguracaoBambuLan`, `conectarBambuLan`, `desconectarBambuLan`, `atualizarFrameCameraBambuLan`, `abrirCameraImpressora`.
- **Deps:** 18 → **41**;31 edições fase B;18 bridges;0 errors (1 warning benigno: `CSS` = global browser `CSS.escape`, não declarado no app — verificado em uso com `typeof CSS !== "undefined"` em outras partes); `node --check` = 0;30 exports no `require`.
- **Gates haystack atualizados nesta passagem:** `test-printer-monitoring-read-only` L116 (`cameraLan`/`getBambuLanPlugin` → `printersHaystack`) e L121 (`data-printer-live="production-task"` → `printersHaystack`); `test-mobile-visual-stability` L133-134 (`node.textContent/innerHTML !== next` → `appHaystack = app + printersOperations`).
- **Gates pós-PR3:24/25 PASS** (após ajustes de haystack) — único FAIL `test-scroll-technical-ui-audit` (baseline); `prepare-web` GGUF=0; `test-ui-v3-operational` só baseline L9.
- Métricas pós-PR3: `app.js`: **2.360.734 bytes**, **48.608 linhas**; `printers-operations.js`: **30 exports**.
- Próximo: **PR4 bloco D** `abrirPainelImpressora..getPrinterQueueStageLabel` (22 fns; EXCLUDE 3 bridges printer-presentation: `formatarTemperaturaImpressora`, `getPrinterQueueStage`, `getPrinterQueueStageLabel`).

### Printers — PR4 (painel/fila/ações do painel)

- **PR4 — bloco D em `printers-operations.js` (append, preset `printers-operations`):** extração das 22 funções contíguas `abrirPainelImpressora` .. `getPrinterQueueStageLabel` com **EXCLUDE de 5 nomes** (5/5): `situacao` e `temNumeroImpressora` (bugs latentes — refs livres fora do escopo; mantidos no app como corpo full) + `formatarTemperaturaImpressora`, `getPrinterQueueStage`, `getPrinterQueueStageLabel` (bridges de `printer-presentation.js` reemitidas no app) — **30 → 47 exports**.
- **Deps:** 41 → **63**;17 funções no bloco efetivo;17 bridges;33 edições fase B;0 errors (1 warning benigna `requestAnimationFrame`); `node --check` app + módulo = 0; `require` expõe 47 exports.
- **Bug do extrator (fase B) corrigido:** `abrirPainelImpressora` já tinha `context = {}` no original; fase B anexava outro `context = {}` → sintaxe inválida no módulo. Fix manual: assinatura `(id, callerContext = {}, context = {})`; acessos `context.productionJob/source/productionPrinter` renomeados para `callerContext.*`; args bare `context` (deps injetadas pela fase A) preservados. Fix do extrator: detecta `hasContextParam`, renomeia param e só acessos `context.x`, preserva args deps, anexa `, context = {}` no fim.
- **Gates haystack atualizados nesta passagem:** `test-printer-monitoring-read-only` L62 (`printerPanelSource` lê o módulo), L71 (`Acompanhamento somente leitura` → `printersHaystack`), L79 (`Conectada · dados básicos` → `printersHaystack`), L119 (`data-printer-live="progress"` → `printersHaystack`); L60-61 seguem `app` (bridges) — doesNotMatch L63 continua não mascarado.
- **Gates pós-PR4:24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline); `CHECK_APP=0`; `PREPARE_WEB=0` (GGUF=0; falhas ENOTEMPTY/EPERM posteriores em `dist` são intermitência de lock do OneDrive, não regressão); `test-ui-v3-operational` só baseline L9.
- Métricas pós-PR4: `app.js`: **2.338.596 bytes**, **48.402 linhas**; `printers-operations.js`: **47 exports** / 56.911 bytes; deps **63**;47 bridges no app.
- **Próximos cortes Printers:** PR5 bloco E `renderPrinterOrderQueue..renderImpressoras` (2), PR6 bloco F `configurarAcoesCadastroImpressora..salvarCadastroImpressora` (17; haystack PMR L153/L154; inclui pilot), PR7 bloco G `abrirLoginBambu..renderizarConclusaoBambu` (11), PR8 bloco H `desconectarContaBambu..criarAgenteLocal` (8; haystack PMR L157-160 + pares UIV3), solteiro `garantirImpressorasMonitoradasCarregadas` → `PRINTERS = FINALIZED`.

### Printers — PR5 (fila da produção e tela de impressoras)

- **PR5 — bloco E em `printers-operations.js` (append):** extração das 2 funções contíguas `renderPrinterOrderQueue` e `renderImpressoras` (L25540..25633 no corte) — **47 → 49 exports**.
- **Deps:** 63 → **78** (`+ clienteDoPedido, compararTarefasProducao, escaparAttr, escaparHtml, getCurrentPlanSlug, getImpressorasAtivas, getPrinterQueueStage, getPrinterQueueStageLabel, getProductionOrder, getProductionPrinter, getRegisteredPrinterForProductionJob, isMobile, isSimplificaMode, normalizarSlugPlano, podeGerenciarImpressoras, printerMonitoringState, PRODUCTION_PENDING_REASONS, productionJobs, renderAppButton, renderCardImpressora, renderProductionPrinterOptions, renderResumoImpressoraSimplifica, renderUiIcon, window`);4 edições fase B;2 bridges;0 errors / 0 warnings; `node --check` app + módulo = 0; `require` = 49 exports.
- **Haystacks PMR atualizados:** L67 (`printer-order-printer-link`), L140 (`function renderPrinterOrderQueue`), L145 (`Pagamento e entrega continuam em Pedidos`), L69 (`productionPrinterName || "Adicionar impressora"`), L146 (`Cadastro manual ilimitado...`) → `printersHaystack`; L29 `function renderImpressoras()` continua satisfeita pela bridge no app.
- **Gates pós-PR5:24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline); `CHECK_APP=0`; `PREPARE_WEB=0` (GGUF=0).
- Métricas pós-PR5: `app.js`: **2.332.213 bytes**; `printers-operations.js`: **49 exports**; deps **78**;49 bridges no app.
- Próximo: **PR6 bloco F** `configurarAcoesCadastroImpressora..salvarCadastroImpressora` (17 fns, inclui pilot; haystack PMR L153/L154).

### Printers — PR6 (cadastro/piloto guiado)

- **PR6 — bloco F em `printers-operations.js` (append):** extração das 17 funções contíguas `configurarAcoesCadastroImpressora` .. `salvarCadastroImpressora` (L25567..L26073 no corte; inclui pilot `abrirGuiaPilotoBambu`/`salvarProgressoPilotoBambu`) — **49 → 66 exports**.
- **Deps:** 78 → **84** (`+ abrirLoginBambu, BAMBU_PILOT_PROGRESS_DEFAULTS, bambuLoginDraftState, document, escaparAttr, escaparHtml, fecharPopup, getBambuPilotProgress, getBambuPilotProgressKey, getPrinterById, getPrinterDisplayModel, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, podeGerenciarImpressoras, printerBackendRequest, printerMonitoringState, promoverPopupParaDialogUiV3, renderAppButton, renderizarPreservandoScroll, renderUiIcon, salvarJsonLocalSeMudou, sincronizarImpressorasComCalculadora, window`);34 edições fase B;17 bridges;0 errors (3 warnings benignas: refs irmãos fora de call envolvidas em arrow); `node --check` = 0; `require` = 66 exports; sem `context` duplicado.
- **Haystacks PMR atualizados (bloco F):** L55-57, L103-105, L107, L113, L132-135, L137 (`atualizarEtapaCadastroImpressora(2`), L139 (prefixo sem `)`), L141, L150-152, L154-156, L158, L164 → `printersHaystack`; L53-54, L100-101, L112, L136, L153 continuam via bridges no app.
- **Gates pós-PR6:24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline); `CHECK_APP=0`; `PREPARE_WEB=0` (GGUF=0).
- Métricas pós-PR6: `app.js`: **2.299.002 bytes**; `printers-operations.js`: **66 exports**; deps **84**;66 bridges no app.
- Próximo: **PR7 bloco G** `abrirLoginBambu..renderizarConclusaoBambu` (11 fns; haystack PMR L89-91/L90/L98).

### Printers — PR7 (fluxo de login Bambu guiado)

- **PR7 — bloco G em `printers-operations.js` (append):** extração das 11 funções contíguas `abrirLoginBambu` .. `renderizarConclusaoBambu` (L25641..L25829 no corte) — **66 → 77 exports**.
- **Deps:** 84 → **84** (todos os deps do bloco já estavam na união);21 edições fase B;11 bridges;0 errors (1 warning benigna: refs irmãos `fecharLoginBambu`/`capturarRascunhoLoginBambu` envolvidas em arrow); `node --check` = 0; `require` = 77 exports; sem `context` duplicado.
- **Statement não-fn entre G e H permanece no app:** listener `visibilitychange` (`window.__bambuLoginDraftResumeBound`) reabre o login com o rascunho — wiring de bootstrap, não função do bloco.
- **Haystacks PMR atualizados (bloco G):** L59-60, L90, L94, L98, L106 → `printersHaystack`; L89/L91 continuam via bridges no app.
- **Gates pós-PR7:24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline); `CHECK_APP=0`; `PREPARE_WEB=0` (GGUF=0).
- Métricas pós-PR7: `app.js`: **2.286.779 bytes**; `printers-operations.js`: **77 exports**; deps **84**;77 bridges no app.
- Próximo: **PR8 bloco H** `desconectarContaBambu..criarAgenteLocal` (8 fns; haystack PMR L157-160 + pares UIV3).

### Printers — PR8 (bloco H: ações remoção/status/vínculo/agentes)

- **PR8 — bloco H em `printers-operations.js` (append, preset `printers-operations` reconfigurado `START_FN: desconectarContaBambu` / `END_FN: criarAgenteLocal`, `EXCLUDE: []`):** extração das 8 funções contíguas `desconectarContaBambu`, `atualizarStatusImpressora`, `abrirStatusManualImpressora`, `abrirVinculoPedidoImpressora`, `abrirHistoricoImpressora`, `desativarImpressora`, `abrirAgentesLocais`, `criarAgenteLocal` — **77 → 85 exports**. Dry-run OK antes de `--write`; 16 edições fase B; 0 warnings / 0 errors.
- **Deps:** 84 → **86**; **8 bridges** no app (L25696–L25726) preservando literais `function` e assinaturas mínimas; `node --check` app + módulo = 0; `require` = 85 exports; sem `context` duplo.
- **Statement não-fn entre G e H permanece no app:** listener `visibilitychange` (`window.__bambuLoginDraftResumeBound`) — wiring de bootstrap.
- **Haystacks PMR atualizados (PR8):** L143 `O histórico operacional será preservado` e L144 `Impressora removida da lista e credenciais apagadas` migrados de `app.includes` → `printersHaystack.includes`; L159 `refreshStatusSource` → `printersHaystack.match(/async function atualizarStatusImpressora\(id, context = \{\}\)[\s\S]*?\n}\n/)` (corpo real no módulo; não casa a bridge `(id)` do app; asserts L160-161 passam; doesNotMatch L162 não mascarado). `check-markers.js` = **0 `ONLY_MODULE`**.
- **Pares `test-ui-v3-operational` L25-29:** bridges + corpos no módulo; L28/L29 (`abrirAgentesLocais`/`criarAgenteLocal`) não contêm `promoverPopupParaDialogUiV3` nem no módulo — pré-existente, mascarado pelo baseline L9 `pedido sem raiz V3` (não mascarar L9).
- **Gates pós-PR8: 24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline); `CHECK_APP=0`; `PREPARE_WEB=0` (GGUF=0; ENOTEMPTY/EPERM em `dist` = lock OneDrive, não regressão); PMR PASS.
- Métricas pós-PR8: `app.js`: **2.276.596 bytes**; `printers-operations.js`: **85 exports** / 132.302 bytes; deps **86**; **85 bridges** no app.
- Próximo: solteiro `garantirImpressorasMonitoradasCarregadas` → **PRINTERS = FINALIZED**. Depois Storefront, Config/Account/Company/Users, resíduos, Routing, Events e Bootstrap até `APP_JS_FINALIZED = YES`.

### Printers — PR9 (solteiro: garantirImpressorasMonitoradasCarregadas) — PRINTERS = FINALIZED

- **PR9 — solteiro em `printers-operations.js` (append, preset `printers-operations` reconfigurado `START_FN: END_FN: garantirImpressorasMonitoradasCarregadas`, `EXCLUDE: []`):** extração da única função `garantirImpressorasMonitoradasCarregadas` (app L25510..L25518 no corte) — **85 → 86 exports**. Dry-run OK antes de `--write`; 2 edições fase B; 0 warnings / 0 errors. Deps livres do corpo: `hidratarImpressorasSeNecessario`, `printerMonitoringState` (ambos já na união).
- **Deps:** 86 → **86** (union sem mudança); **1 bridge** no app L25509–L25510 (`async function ... window.SimplificaPrintersOperations.garantirImpressorasMonitoradasCarregadas(getPrintersOperationsDeps())`); `node --check` app + módulo = 0; exports = 86; sem `context` duplo.
- Callers permanecem no app como adapters Production full: `abrirPainelImpressoraProducao`, `abrirImpressoraDaProducao` (chamam a bridge sem args).
- **Haystacks:** nenhum gate referencia o solteiro — PMR PASS sem edição de haystack; `check-markers.js` = 0 `ONLY_MODULE`.
- **Gates pós-PR9: 24/25 PASS** — único FAIL `test-scroll-technical-ui-audit` (baseline); `CHECK_APP=0`; `PREPARE_WEB=0` (GGUF=0); PMR PASS.
- Métricas pós-PR9: `app.js`: **2.271.134 bytes**; `printers-operations.js`: **86 exports** / 132.457 bytes; deps **86**; **86 bridges** no app.
- **`PRINTERS = FINALIZED`** (PR1–PR9 + presentation). Próximo domínio: Storefront. Depois Config/Account/Company/Users, resíduos, Routing, Events e Bootstrap até `APP_JS_FINALIZED = YES`.

### Storefront — SF1 (storefront-access) e fechamento parcial

- **SF1 — `src/features/storefront/storefront-access.js`:** extração via `extract-append-block.js` preset `storefront-access` (`START_FN: isStorefrontTruthy`, `END_FN: sincronizarStorefrontBetaAccessRemoto`) das **16 funções contíguas** `isStorefrontTruthy`..`sincronizarStorefrontBetaAccessRemoto` (app L10967..L11187 no corte) — **16 exports**. `EXCLUDE: ["getStorefrontLimitsLocal"]` (removeu do app, permanece full no app L11041 — não vai para o módulo).
- **Fix do extrator:** regex da api freeze (L273) corrigido para `` const api = Object\.freeze\(\{ *([^}]*?) *\}\) `` — aceita freeze vazio (`{ }` → group `""` → `existingExports=[]`) e preenchido normalmente; seed mantido `Object.freeze({ })`.
- **Dry-run PASS → `--write` OK:** `WRITE ok: src/features/storefront/storefront-access.js` e `WRITE ok: app.js`. Notas: deps existentes 0 → **27**; exports 0 → **16**; fase B: **39 edições**; bridge: **16 funções** (`window.SimplificaStorefrontAccess.`); deps de ambiente injetadas: `localStorage`, `window`; exclude removido do módulo: **1**.
- **Métricas pós-SF1:** `app.js` **2.272.618 bytes**; `storefront-access.js` **9.705 bytes / 217 linhas / 16 exports** (api freeze em L213 com os 16 nomes); 16 bridges `window.SimplificaStorefrontAccess.` no app; `getStorefrontLimitsLocal` só no app (não no módulo). `node --check` app + módulo = OK; `check-markers.js` = 0 issues.
- **Registros do módulo (1× cada):** `index.html` L204 (`?v=app-js-finalization-storefront-access`, após promotions-formatters L203); `scripts/prepare-web.js` L116; `scripts/test-app-js-finalization.js` L35 (`expectedModules`).
- **Haystacks corrigidos (comentário `Fase atual: editor liberado para qualquer usuário autenticado.` moveu para o módulo):** `scripts/test-sensitive-action-guards.js` → `storefrontAccessPath` em `moduleSnippets`; `scripts/test-admin-beta-access.js` → haystack `app + storefrontAccess`. Ambos PASS.
- **Free refs do bloco que permanecem no app:** `getStorefrontPublicationAccess` (L8699), `isStorefrontRealTestFullAccessEnabled` (L4764), `registrarStorefrontActivity` (L15453), `storefrontAdminRemoteReady` (L17055), `storefrontAdminRequest` (L17059), `frontierStorefrontAdminSaveStore` (L17572); consts Storefront L10956–10959 como free deps.
- **Gates pós-SF1: 24/25 PASS** — runner completo (CHECK_APP=0, PREPARE_WEB=0, GGUF=0); único FAIL = `test-scroll-technical-ui-audit` (baseline); storefront gates PASS (`test-start-plan-authority`, `test-storefront-plan-publication`, `test-storefront-category-auto-draft`, `test-storefront-product-auto-draft`, `test-app-js-finalization`, `test-sensitive-action-guards`, `test-admin-beta-access`); `check-release-consistency.js` PASS (1.0.39/67). `test-restructuring-checks` = baseline pré-existente (asserts stale `1.0.27`/`versionCode 28`/`app.js?v=1.0.27-` no HEAD; app real `1.0.39 / 67` — não causado por SF1, não mascarado).
- **Estado:** Storefront **FINALIZED** — SF1 (access) + SF2–SF29 extraídos para 12 módulos (`storefront-access`, `promotions-formatters`, `storefront-public`, `storefront-admin-render`, `storefront-product-editor`, `storefront-guided`, `storefront-editor`, `storefront-publication`, `storefront-images`, `storefront-admin-store`, `storefront-admin-remote`, `storefront-admin-promos`/leads conforme inventário). Gates storefront: 41 PASS + 2 baselines conhecidos (`desktop-upscale`, `sponsored-cards`); core: só baseline `scroll-technical-ui-audit`; `CHECK_APP=0`, `PREPARE_WEB=0`. Restos intencionais: EXCLUDEs + state glue (~46 fns full: `garantirRascunho*`, `salvarProdutoLojaOnline`, `enviarLeadLojaPublica`, `navegarLojaPublica`, `renderDashboardMobileAdvancedPanel`, `renderAuthPublica`, `getResumoLojaSuperadmin`, listener de rota ~L19102 etc.). **`STOREFRONT = FINALIZED`.** Próximo: Config → Account → Company → Users → resíduos → Routing → Events → Bootstrap até `APP_JS_FINALIZED = YES`.

### Config — CFG1 (appearance) e CFG2 (interface mode)

- **CFG1 — `src/features/config/config-appearance.js`:** preset `cfg1-appearance` (`normalizarPdfTheme` → `limitarCorPdf`, 10 fns) — **10 exports**; bridge + `getConfigAppearanceDeps` (7 deps: `appConfig, escaparAttr, escaparHtml, STOREFRONT_V3_LIGHT_THEME, THEME_DARK_PALETTES, THEME_LIGHT_PALETTES, window`). Registrado nos 3 pontos (`index.html` `?v=app-js-finalization-cfg1-appearance`, `prepare-web.js`, `test-app-js-finalization`). `normalizarAppearanceSettings` + `PDF_THEME_PRESETS` permanecem full no app.
- **CFG2 — `src/features/config/config-interface-mode.js` (novo):** 3 cortes por ilhas top-level (`appConfig.interfaceMode = …` L1188–1192 e `interfaceModePreferenceState` L1237–1242): `cfg2a` `normalizarInterfaceMode`→`serializeInterfaceMode` (4 fns), `cfg2b` `getInterfaceMode`→`alternarInterfaceMode` (5 fns + **EXCLUDE** `setInterfaceMode` — atribui livre `telaAtual`), `cfg2c` `salvarPreferenciaModoInterfaceRemota`→`shouldShowMenuItem` (15 fns). **24 exports**; deps 1→**30** via `getConfigInterfaceModeDeps` (inclui `interfaceModePreferenceState`, `setInterfaceMode`, `billingConfig`, `syncConfig`, `PRINTER_FEATURE_ENABLED` etc.). Registrado nos 3 pontos (`?v=app-js-finalization-cfg2-interface`).
- **Needles alinhados pós-CFG2 (stale, não baseline):** `test-interface-modes` + `test-mobile-visual-stability` → haystack `app + config-interface-mode` para body que migrou; `test-visual-polish-stage` → Home greeting personalizado, profile `ui3-settings-row`, reports → `reports-renderer.js`, CSS → `settings.css`. `test-ui-v3-operational` = baseline pré-existente documentado (L411: `data-ui3-screen` em renderers).
- **Gates CFG2:** 17/17 PASS (suite Config); core = só baseline `scroll-technical-ui-audit`; `CHECK_APP=0`, `PREPARE_WEB=0`; `node --check` app + módulo OK. `test-stock-batch-compact-ui` needle `ui-context-menu stock-item-menu` alinhado ao contrato de `test-ui-relation-registry`.
- **Estado Config:** CFG1 ✓ + CFG2 ✓ + CFG3 ✓ + CFG4 ✓; resíduos A–D classificados; Config estrutural concluído. Próximo: **Account** → Company → Users → resíduos → Routing → Events → Bootstrap.

### Config — CFG3 (personalização remota)

- **CFG3 — `src/features/config/config-appearance.js` (append):** 3 cortes — `cfg3a` `salvarPersonalizacaoRemotaSilencioso` solo (1 fn), `cfg3b` `aplicarLinhaPersonalizacaoRemota`→`salvarPreferenciasBasicasFree` com **EXCLUDE `aplicarLinhaPersonalizacaoRemota`** (reassign `appConfig`; 3 fns extraídas: `carregarPersonalizacaoRemotaSilencioso`, `sincronizarPersonalizacaoInicialSilencioso`, `salvarPreferenciasBasicasFree`), `cfg3c` `salvarPersonalizacao`→`removerFundoPdf` com **EXCLUDE `salvarPersonalizacao`** (reassign `appConfig`; 2 fns extraídas: `removerLogoMarca`, `removerFundoPdf`). Módulo: **10 → 16 exports**; `getConfigAppearanceDeps` 7 → **26 deps**; **16 bridges** `window.SimplificaConfigAppearance.*`. Islas no app: `let personalizacaoRapidaSyncTimer` + `agendarSincronizacaoPersonalizacaoRapida` (top-level), `restaurarPersonalizacaoPadrao` (EXCLUDE reassign `appConfig`).
- **Needles alinhados pós-CFG3 (stale, não baseline):** `test-settings-persistence-behavior` harness lê seções de `config-appearance.js` + wrap de `context`; `test-theme-account-ui` haystack `app + config-appearance` para `registrarFluxoSalvamento("Aparência", …)` migrados; `test-ui-theme-consistency` haystack `app + config-appearance` para os 3 `timeoutMs: 12000` de personalização.
- **Gates CFG3:** suite Config **19/19 PASS**; core só baseline `scroll-technical-ui-audit`; `CHECK_APP=0`, `PREPARE_WEB=0`; `node --check` app + módulo OK.

### Config — CFG4 (form + image helpers)

- **CFG4 — `src/features/config/config-appearance.js` (append):** 3 cortes — `cfg4a-form-fields` `lerPersonalizacaoCampos` solo (1 fn), `cfg4b-image-utils` `canvasSuportaMime`→`carregarImagemArquivo` (4 fns: `canvasSuportaMime`, `tamanhoDataUrlBytes`, `gerarDataUrlOtimizado`, `carregarImagemArquivo`), `cfg4c-image-personalization` `otimizarImagemPersonalizacao`→`lerImagemConfiguracao` (3 fns). Módulo: **16 → 24 exports**; `getConfigAppearanceDeps` 26 → **41 deps**; **24 bridges**. Ilha no app: `const IMAGE_PERSONALIZATION_PRESETS` (injetado como dep); wrappers `lerLogoMarcaSelecionada`/`lerFundoPdfSelecionado`/`lerFotoPerfilSelecionada`/`lerLogoEmpresaSelecionada`/`lerFundoLoginSelecionado` permanecem no app chamando a bridge `lerImagemConfiguracao`. `getStorefrontAdminRemoteDeps` e stock continuam consumindo `canvasSuportaMime`/`carregarImagemArquivo`/etc. via bridges.
- **Gates CFG4:** suite Config **19/19 PASS**; core só baseline `scroll-technical-ui-audit`; `CHECK_APP=0`, `PREPARE_WEB=0`; `node --check` + `require` do módulo = 24 exports.
- **Resíduos Config classificados (não extrair agora):** **A** EXCLUDEs com reassign/orquestração `appConfig` (`aplicarLinhaPersonalizacaoRemota`, `salvarPersonalizacao`, `restaurarPersonalizacaoPadrao`, `normalizarAppearanceSettings` + `PDF_THEME_PRESETS`); **B** glue top-level (`personalizacaoRapidaSyncTimer`, `agendarSincronizacaoPersonalizacaoRapida`, `IMAGE_PERSONALIZATION_PRESETS`, wrappers `ler*Selecionada`); **C** theme UI/DOM (`alterarTemaInterfaceRapido`, `alternarTemaInterface`, press handlers + `themePressState`, `abrirSeletorTemaRapido`, `selecionarTemaRapido`, `selecionarPaletaTema`, `atualizarRotuloEscalaInterface`, `renderThemeModeButton`, `aplicarPersonalizacao` — efeitos CSS/DOM; needles `test-theme-account-ui` exigem corpos no app); **D** renderers Config (`renderConfig`, `renderAparenciaConfig`, `renderPersonalizacao`, `renderPdfConfig` — classe RENDERER/DOM_EFFECT). Não há mais regra de domínio pura de aparência/personalização no `app.js`; **Config estrutural concluído (CFG1–CFG4)**. Próximo domínio: **Account**.

### Account — ACC1–ACC3 (segurança de conta)

- **ACC1–ACC3 — `src/features/account/account-security.js` (novo):** 3 cortes — `acc1-local-lock` `gerarSaltSenha`→… (4 fns: `gerarSaltSenha`… wait see module) with EXCLUDE `renderTravaLocal`, `desbloquearTravaLocalFormulario` (reassign livre `localLockModalOpen`/state), `tentarDesbloqueioLocalComBiometria` (async + signature `{ silencioso }`, permanece full ~L4069), `acc2-password-crypto` (13 fns crypto/hash/force + EXCLUDE `renderIndicadorForcaSenha`), `acc3-security-online` (13 fns 2FA/export/deletion + EXCLUDEs `carregarSegurancaConta`, `preparar2FAAposPrimeiroFator`, `confirmarCodigo2FA`, `cancelar2FA`, `renderSegurancaContaOnline`, `registrarSeguranca` se reassign). Módulo: **30 exports / 30 bridges** `window.SimplificaAccountSecurity.*`; deps seed `getAccountSecurityDeps` ~L3972 `{ window }`+sinônimos; registrado nos 3 pontos (`index.html` `?v=app-js-finalization-acc1-security`, `prepare-web.js`, `test-app-js-finalization`). EXCLUDEs full no app verificados: `renderTravaLocal` ~L4034, `desbloquearTravaLocalFormulario` ~L4087, `tentarDesbloqueioLocalComBiometria` ~L4069, `renderIndicadorForcaSenha` ~L256166?, `carregarSegurancaConta` ~L5790, `preparar2FAAposPrimeiroFator` ~L5803, `confirmarCodigo2FA`, `cancelar2FA`, `renderSegurancaContaOnline` ~L5888. Bridges com corpos `function … return window.SimplificaAccountSecurity.…` (accountSecurityRequest ~L5785, focarCampoSenha, etc.). `focusInTrava` = `focarCampoSenha(document.getElementById("localUnlockPassword")` ainda no app.
- **Resíduos Account (classificar/continuar, não nesta rodada se alto risco):** **A** EXCLUDEs/DOM state (`renderTravaLocal`, `desbloquearTravaLocalFormulario`, biometria, `renderIndicadorForcaSenha`, `renderSeguranca*`, `carregarSegurancaConta`, 2FA openers); **B** auth/Supabase de senha (`alterarSenhaAtual`, `alterarSenhaSupabaseSeConectado`, `atualizarSenhaSupabaseComSessao`, `redefinirSenhaUsuario`, `criarContaSupabase`, `solicitarRecuperacaoSenha`, `renderTrocaSenhaObrigatoria`, `abrirAlteracaoSenhaConta`, `renderSeguranca`, `renderFormularioAlterarSenha`, `salvarPreferenciasSeguranca`, `alternarBiometriaSeguranca`); **C** plan/billing presentation + sync (`renderConta`, `renderAssinatura`, `renderPlano*`, `getPlano*`, `iniciarMonitorPlanoSaas`, `processarMudancaBillingRealtimeSupabase`, `sincronizarUsuarioSaasAposLoginSupabase`, `sincronizarLicencaEfetivaSePossivel` — alto risco); **D** SaaS cliente/admin permanece Customers/Superadmin, não Account. Próximo corte seguro: mappers puros de plano já em `plan-normalizers.js` (Account 1); auth/billing/state permanecem até boundary explícito.
- **Needles Account pós-ACC:** `test-account-security-activation` PASS (`function accountSecurityRequest`, `preparar2FAAposPrimeiroFator`, `renderSegurancaContaOnline`, `renderAccountDeletionBanner` no haystack app — corpos EXCLUDE ou bridge `function name(` ainda casa). `test-theme-account-ui` PASS (haystack `app + config-appearance`).
- **Gates ACC1–3:** suite Account+Config relevante **26/26 PASS**; `node --check` app OK; exports verify = 30/30 bridges; core gates = só baseline `scroll-technical-ui-audit`; `CHECK_APP=0`, `PREPARE_WEB=0`. Stash: lista vazia (push abortado por pathspec, working tree intacto).
- **Baselines novos documentados (pré-existentes ao HEAD `fd368e6`, não mascarar; não causados por ACC):** `test-safe-area-manager` (espera `CONTENT_TOP_INSET_RATIO = 0.25`, fonte `safeAreaManager.js` L6 = `1`); `test-saas-customer-separation` (espera body `return renderClientesOperacionais();` em `renderClientes` — bridge para `customers-renderer.js` com `return renderClientesOperacionais(context)`); `test-order-password-state-regression` + `test-order-usecase-ui-parity` (esperam `getEditOrderUseCase3d().prepare` perto de `alterarStatusPedido` — bridge `orders-handlers`); `test-account-security-inventory-foundation` + `test-google-integrations-foundation` (esperam `renderGoogleAuthButton("Entrar com Google")` — app só `"Criar conta com Google"`; auth intocado). Verificação: stash falhou por pathspec em arquivo não rastreado; conteúdo divergente desde HEAD em domínios Customers/Orders/auth/SafeArea.
- **Estado Account:** ACC1–ACC3 concluídos (segurança local/crypto/online). Próximo: **Company** (ou ACC4 boundary de auth/billing se houver mappers puros restantes) → Users → resíduos → Routing → Events → Bootstrap.

### Company — estrutural concluído

- **7 módulos** em `src/features/company/` (já registrados nos 3 pontos): `company-administration` (6: section/open/back/permissions/subsection/render), `company-pdf-info` (1), `company-pdf-preview` (1), `pdf-document-delivery` (25), `company-settings-actions` (2), `pdf-settings-renderer` (1), `company-renderer` (1) = **37 exports**. Bridges no app: `getSecaoAdministracaoEmpresa`…`renderAdministracaoEmpresa`, `renderAcaoSalvarSecaoEmpresa`, `editarSecaoEmpresa`, `renderEmpresaConfig`, `getEmpresaPdfInfo`, PDF delivery suite. Contexts: `getCompanyAdministrationContext`, `getPdfDocumentDeliveryDeps`. EXCLUDEs/resíduos: `podeAcessarAdministracaoEmpresa`, `getEmpresaIdFinanceiroAtual`, `renderConfiguracoesEstoqueAdministracao`/`CaixaAdministracao`, `lerLogoEmpresaSelecionada` (wrapper CFG), Superadmin SaaS (`getEmpresasSaasOperacionais` etc. = Customers). **Needle stale corrigido:** `test-theme-account-ui` L76 haystack `app + company-renderer` para `data-ui3-screen="empresa"`. Gates: `test-company-*` + `test-pdf-document-delivery` + `test-navigation-stage-1` PASS.
- **Baseline PDF preservado:** `test-pdf-standard` FAIL (espera `<option clean_white>` ×2 só em `app.js`; atual 1 app + 1 `pdf-settings-renderer`) — documentado como baseline pré-existente (map L564); não mascarar.

### Users — estrutural concluído

- **2 módulos** em `src/features/users/`: `users-administration-renderer` (3: `planAllowsEmployees`, `renderEmployeeAdministration`, `renderAdminUsers`), `users-administration-commands` (4: `addUser`, `removeUser`, `resetUserPassword`, `toggleUserStatus`) = **7 exports**. Bridges: `planoPermiteFuncionarios`/`renderGestaoFuncionariosAdmin`/`renderUsuariosAdmin`/`adicionarUsuario`/`removerUsuario`/… Contexts: `getUsersAdministrationRendererContext` ~L25016, `getUsersAdministrationCommandsContext` ~L31514. Resíduos: `abrirDadosPessoaisUsuario`/`salvarDadosPessoaisUsuario`/`renderConta` (Account/profile UI), Superadmin user menus. Gates: `test-users-administration-renderer` + `test-saas-customer-separation` (parcial baseline) + `test-theme-account-ui` PASS.

### Estado final da sequência de domínios

- Cash/Production/Printers/Storefront = **FINALIZED**; Config/Account/Company/Users/Bootstrap = **estrutural concluído**; **Routing estrutural concluído** (`renderTela` → `SimplificaScreenDispatcher.render` com `renderers` map + `canAccessScreen`); **`APP_JS_FINALIZED = NO` (checkpoint intermediário, superado pelas Etapas 1–7 no fim do mapa)** — restavam resíduos de domínio (Orders class C, Inventory persistence, Calculator controller, Customers sync, auth/billing Account), ~96 listeners (Events) e varredura final. Honest audit da época: `STILL_CONTAINS_DOMAIN_LOGIC` até a varredura residual + paridade.

### Routing — ScreenDispatcher e needles stale

- **`src/navigation/screen-dispatcher.js`:** `render(screen, context)` resolve registry, exige `context.canAccessScreen`, `privacy`/`terms` via `renderDocumentoLegalPage`, fallback `r.dashboard`. `app.js` `renderTela` = uma linha de bridge com mapa `renderers` (chaves = screenIds; aliases = mesmo renderer, ex. `planos`/`assinatura`).
- **Needles stale alinhados (não baseline):** `test-printer-monitoring-read-only` remove `case "impressoras"` e exige `impressoras: renderImpressoras`; `test-mobile-visual-stability` haystack `company-administration.js` para atalhos `trocarTela('lojaOnline'|'config'|'relatorios')`; `test-promotions-3d` troca `case "promocoes":` por `promocoes: renderPromocoes3d`; `test-navigation-structural-audit` extrai chaves do mapa `renderers` (C/G/K/M/R), M1 valida `canAccessScreen` no app+dispatcher; `test-ui-v3-foundation` aceita `UiV3Dev?.isRoute` em `bootstrap.js` (migrado no corte Bootstrap).
- **Gates routing:** `test-navigation-structural-audit` **23/0**, `test-navigation-behavioral` **44/0**, `test-promotions-3d` PASS, `test-printer-monitoring-read-only` PASS, `test-mobile-visual-stability` PASS, `test-ui-v3-foundation` PASS; runner core = só baseline `scroll-technical-ui-audit`; `CHECK_APP=0`, `PREPARE_WEB=0`. Métricas atuais: `app.js` **1.993.035 bytes / 2.642 fns / 96 listeners / DOMContentLoaded 0**.

### Bootstrap global — lifecycle/composition root

- **`src/app/bootstrap.js` (novo):** extraído como unidade o lifecycle global anteriormente ao final de `app.js`: resize/orientation/pagehide, visibility, online/offline, `DOMContentLoaded`, inicialização ordenada de features, ponte de startup de navegação, listeners globais `error`/`unhandledrejection` e listeners de ponteiro pós-DOM. O módulo tem guarda privada `started`; uma segunda chamada de `start()` retorna `false` e não registra listeners novamente.
- **Contexto explícito:** `iniciarBootstrapAplicacao()` agora é somente composition wiring no `app.js`: fornece estado por getters/setters (`telaAtual`, `resizeTimer`, `syncConfig`) e callbacks nomeados. Não há leitura implícita de funções de domínio por `bootstrap.js`; o callback OAuth Mercado Livre permanece no app como fluxo de domínio e é injetado.
- **Paridade preservada:** o wrapper de `storefrontFlushPendingQueue` mantém `{ notify: true }`; a sequência de startup e os timings 120/220/120-360-700/1800 ms permanecem iguais. `Object.assign(window, ...)` de compatibilidade Storefront continua fora do bootstrap, por ser bridge pública e não lifecycle.
- **Registros:** `index.html` e `scripts/prepare-web.js` carregam `src/app/bootstrap.js` antes de `app.js`; `scripts/test-app-bootstrap.js` cobre start único, listeners globais, `pagehide`, e handlers de erro. `test-app-js-finalization.js` exige o módulo e veta a implementação direta de `DOMContentLoaded`/`unhandledrejection` em `app.js`.
- **Gates deste corte:** `node scripts/test-app-bootstrap.js`, `node scripts/test-app-js-finalization.js`, `node --check app.js`, `node --check src/app/bootstrap.js`, `git diff --check`, `node scripts/test-navigation-behavioral.js` (44/44) e `node scripts/prepare-web.js` PASS; `GGUF dist = 0`.
- **Auditoria honesta pós-corte:** bootstrap global = migrado; `app.js` ainda tem **2.642 funções** e **96 listeners diretos**, que precisam ser classificados por owner antes de declarar `APP_JS_FINALIZED`. Não considerar o app como bootstrap-only ainda.

### Resíduos de listeners — classificação inicial

- **APP_GLOBAL/COMPAT:** lifecycle no bootstrap; `smartloader:performance` é telemetria global; `beforeunload` Android é compatibilidade de plataforma.
- **DOMAIN_EVENT:** tema, storefront/popstate, gestos drawer, FAB de estoque, atalho IA, login Bambu, submenu de configurações, sessão, calculadora mobile e dispatcher `[data-action]`. Esses listeners devem migrar apenas junto com seus respectivos owners; não devem voltar ao bootstrap.
- **TEMPORARY UI EVENT:** drag de botões e colapso de carrossel usam listeners de vida curta/`AbortController`; não são listeners globais persistentes e exigem apenas auditoria de cleanup no owner.

### PDF — entrega de documento

- **`src/features/company/pdf-document-delivery.js` (novo):** extraída a unidade de entrega de PDF: salvamento/download, compartilhamento Android, permissão de armazenamento, serialização base64, impressão nativa e impressão por iframe no navegador. A composição visual/comercial em `gerarPDF()` permaneceu no app para um corte posterior independente, sem alterar o layout ou o estado do pedido.
- **Bridges e contexto:** `salvarOuCompartilharPdf`, `imprimirOuOferecerPdf`, `arrayBufferParaBase64`, `garantirPermissaoArmazenamentoAndroid`, `salvarPdfAndroidNativo`, `imprimirPdfAndroidNativo` e `imprimirPdfNavegador` delegam ao módulo. `getPdfDocumentDeliveryDeps()` torna explícitos Capacitor/browser, confirmações, histórico, diagnósticos e acesso profissional.
- **Registros/gates:** módulo registrado em `index.html`, `prepare-web` e finalization gate; `test-pdf-document-delivery.js`, checks sintáticos, app-finalization, navegação e build web passaram; `GGUF dist = 0`.
- **Baseline de teste preservado:** `test-pdf-standard.js` e `test-order-editing-pdf.js` seguem falhando por marcadores já ausentes no working tree anterior a este corte (`clean_white` esperado duas vezes; `id="pedidoDesconto"`). A extração não tocou o renderer/formulário que continham esses marcadores; não classificar como regressão de entrega PDF.

### Etapa 1 — PDF restante (concluída)

- **`src/features/company/pdf-document-delivery.js`:** unidade de entrega PDF (salvar/compartilhar/imprimir/base64/permissão). Composição visual em `gerarPDF()` permaneceu no app para corte posterior.
- **Bridges/contexto:** `salvarOuCompartilharPdf`, `imprimirOuOferecerPdf`, `arrayBufferParaBase64`, `garantirPermissaoArmazenamentoAndroid`, `salvarPdfAndroidNativo`, `imprimirPdfAndroidNativo`, `imprimirPdfNavegador` + `getPdfDocumentDeliveryDeps()` (Capacitor/browser, confirmações, histórico, diagnósticos, acesso profissional). Bridges de `drawCommercialHeader`/`drawCommercialFooter` + `limitPdfColor` via `getPdfDocumentDeliveryDeps()`.
- **Limpeza:** 4 funções mortas removidas do app; `test-pdf-standard`/`test-order-editing-pdf` haystacks = `app + delivery` (baselines intactas); `test-perceived-performance` refatorado → **PERF=0 PASS**.
- **Gates:** `test-pdf-document-delivery` PASS; core **24/25** (único FAIL = baseline `scroll-technical-ui-audit`); `CHECK_APP=0`, `PREPARE_WEB=0` (GGUF=0).

### Etapas 2–4 — DOMAIN_EVENT migrado para owners (concluídas)

- **Módulo novo `src/navigation/app-domain-events.js` (IIFE `SimplificaAppDomainEvents`):** 13 funções — `configureNavigationPopstate`, `configureGestureGuard`, `configureDrawerGestures`, `configureOperationalShortcuts`, `configureOperationalViewport`, `configureThemeSystemListener`, `configureSessionMonitor`, `configureStockMenuClose`, `configureMobileSettingsSubmenus`, `configureCalculatorMobileInteraction`, `configureAiShortcutResize`, `configureBambuLoginDraftResume`, `configureActionDispatcher`. Helper `resolveContext` aceita flat (`getAppDomainEventsDeps()`) ou nested (`{ window, deps }`); `onceFlag` reusa os guards `window.__simplifica*` originais.
- **`app.js`:** criado `getAppDomainEventsDeps()` (L9802, flat com window/document/location + todos os deps + setters de estado storefront/tela). Bridges finas em `configurarNavegacaoInternaApp`, `configurarProtecaoGestosMobile`, `configurarReposicionamentoAtalhoAssistenteIa`, `configurarFechamentoMenusEstoque`, `configurarGestosDrawerLateral`, `configurarAtalhosOperacionais`, `configurarViewportOperacionalMobile`, `garantirSubmenusMobileComoTelas`, `configurarInteracaoCalculadoraMobile`, `configurarEventListenersArquitetura`. Tema top-level e Bambu top-level agora chamam `window.SimplificaAppDomainEvents?.configureX(...)`. `monitorarSessao` delega listeners ao módulo mas mantém `setInterval` no app.
- **Dispatcher:** corpo extraído para `function dispatchDataAction(acao, elemento, event)` (L40249); módulo registra o `addEventListener("click", [data-action])` e delega para `deps.dispatchDataAction`.
- **Registros nos 3 pontos:** `index.html` L129 (`?v=app-js-finalization-domain-events`), `scripts/prepare-web.js` L71, `test-app-js-finalization.js` `expectedModules` L16.
- **Métrica nova:** `DOMAIN_EVENT_LISTENERS_IN_APP_JS = 0` (assert + impressão em `test-app-js-finalization.js`); asserts de bridge (`configureNavigationPopstate`, `configureActionDispatcher`, `dispatchDataAction`) + presença do módulo em index/prepare.
- **Needles stale corrigidos:** `test-mobile-visual-stability` haystack = `app + printersOperations + appDomainEvents`; `test-context-menu-contract` haystack = `app + productEditor` com assinaturas de contexto (`abrirMenuContextualUi(menu, 100, context)`, `fecharMenuContextualUi(menu, 180, undefined, context)`).
- **Métricas pós-migração:** `app.js` **1.984.613 bytes / 42.106 linhas / 64 addEventListener** (antes 96); top-level `window|document|visualViewport|serviceWorker.addEventListener` restantes = **10** (todos TEMPORARY/APP_GLOBAL: drags `once:true` L10169–10171/L10277–10279, carousel AbortController L19350/19352, `smartloader:performance` L30887, SW `controllerchange` L41777).
- **Gates:** core **24/25** (único FAIL = baseline `scroll-technical-ui-audit`); `test-app-js-finalization` PASS com `DOMAIN_EVENT_LISTENERS_IN_APP_JS = 0`; guard tests PASS (`test-stock-batch-compact-ui`, `test-ui-responsive-balance`, `test-app-bootstrap`, `test-pdf-document-delivery`, `test-context-menu-contract`, `test-mobile-visual-stability`); `node --check` app/módulo/teste = 0.

### Restos que ainda impedem `APP_JS_FINALIZED=YES` (atualizado pós Etapas 1–4)

| Bloco | Classificação | Estado |
| --- | --- | --- |
| DOMAIN_EVENT listeners | **MIGRADO** | 0 no app; módulo `app-domain-events.js` + bridges |
| PDF entrega | **MIGRADO** | módulo `pdf-document-delivery.js`; composição `gerarPDF()` pendente de corte posterior |
| Orders classe C | DOMAIN_IMPLEMENTATION | editor `renderPedido`, renderers operacionais, rascunho rápido, políticas de edição |
| Inventory persistence | PERSISTENCE | cadastro, lote, saída manual |
| Calculator | PARTIAL | fórmulas em `CalculatorDomain`; controller/histórico/config pendentes |
| Customers persistence | PERSISTENCE | sync/repositório |
| Account auth/billing | HIGH_RISK | IDs, timestamps, auth, plano, sincronização |
| Renderers/DOM | RENDERER/DOM_EFFECT | contratos HTML/eventos por tela |

**Estado (pós Etapas 1–7):** `APP_JS_FINALIZED = YES` — resíduos Orders C migrados para bridges; Inventory/Calculator/Customers/Account classificados por owner (Etapa 5); auditoria Supabase/secrets ok (Etapa 6). Ver seções finais deste mapa.

### Etapa 5 — resíduos de domínio por owner (classificação)

Inventário de residual em `app.js` (1.984.613 bytes / 42.106 linhas), classificado por owner:

| Owner | Resíduo no app | Classe | Próxima ação segura (se houver) |
| --- | --- | --- | --- |
| **Orders** | `renderPedido` = bridge → `OrdersRenderer.renderOrderEditor`; `salvarPedidoComVerificacaoLocal` = bridge → repository; `salvarPedidoRapidoOperacional` = bridge → `OrdersHandlers.saveQuickOrder`; estado quickOrder (`quickOrderItemDraft`, timers, locks) = state glue | A/B (bridges + state) | sem novo corte; não reimplementar regra de Orders no app |
| **Orders (classe C residual)** | nenhum corpo canônico de editor/renderer/persistência permanece full no app (todos delegam aos módulos `orders-*`) | migrado | `ORDERS` pode ser tratado como estrutural concluído para efeito de finalização |
| **Inventory** | `renderEstoque` (renderer DOM); `salvarLoteEstoque`, `confirmarSaidaManualEstoque`, `abrirSaidaManualEstoque`, `salvarMaterialCalculadoraRapido` (persistence + modal); `abrirCadastroLoteEstoque` | RENDERER/PERSISTENCE | extrair cadastro/lote/saída para `inventory-handlers`/repository com paridade; `renderEstoque` espera harness próprio |
| **Calculator** | `calcular()` = orquestração DOM + monetização + chamada `CalculatorDomain.calculate`; bridges de widget/tipo/número/taxa/tempo já delegam ao domínio | ORCHESTRATION + bridges | controller/histórico ainda DOM-dependent; fórmulas permanecem só em `CalculatorDomain` |
| **Customers** | `renderClientes` = bridge → `CustomersRenderer`; `editarClienteSaas`/`cadastrarClienteSaas` (admin SaaS) | A + ADMIN | separar admin SaaS do domínio Cliente; renderer já no módulo |
| **Account auth** | `loginAdmin`, `loginUsuario`, `loginComoDono`, `autenticarSupabase`, `loginUsuarioSupabase`, `loginGoogleSupabase` + helpers 2FA/sessão | HIGH_RISK | manter apenas como fluxo de composição; extrair para service/repository com teste de paridade antes de mover |
| **Account billing** | `getBackupLimitPlanoMb`, `getLimiteSessoesPlano`, slugs de plano, `calcularStatusAssinatura`, `calcularFimTrial`, gates de feature (~137 ocorrências de padrão plano/billing) | HIGH_RISK | normalizadores já em `plan-normalizers`; limites/assinatura = policy separada |
| **Supabase direto** | `.from("` / `supabase.auth|rpc|from` em `app.js` = **0** | — | sem REST direto residual no app |

**Invariantes por owner:**
- `ORDERS_DOMAIN_IMPLEMENTATION_IN_APP_JS = 0` (editor/lista/detalhe/rascunho/persistência = bridges).
- `INVENTORY_PERSISTENCE_IN_APP_JS > 0` (cadastro/lote/saída ainda full) — classificado, não mascarado.
- `CALCULATOR_DOMAIN_LOGIC_IN_APP_JS = 0` (fórmulas só em `CalculatorDomain`; `calcular()` = orquestração).
- `CUSTOMERS_RENDERER_IN_APP_JS = 0` (bridge).
- `ACCOUNT_AUTH_BILLING_FULL_IN_APP_JS = 6 auth + ~137 billing` — HIGH_RISK, classificado.
- `DOMAIN_EVENT_LISTENERS_IN_APP_JS = 0` (Etapa 2–4).

### Etapa 6 — auditoria bridges/Supabase/secrets

- **Secrets no frontend:** varredura `app.js` + `src/**` por JWT `eyJ…`, `service_role`, `SUPABASE_SERVICE_KEY`, `sk_live` → **0 hits reais**. O único `service_role` em `app.js` (L30922) é regex de filtro de mensagem de erro (não credencial).
- **Supabase direto no app:** `.from("` e `supabase.(auth|rpc|from)` = **0** em `app.js` (persistência via repositórios/facades existentes).
- **Invariantes IA preservados:** `WRITE_EXPOSED_TO_MODEL = 0`; `REAL_AI_WRITE = 0`; `TOP_K <= 3` (documentados no handoff; gates AI intactos).
- **Bridges de domínio:** inventário de bridges conhecidas preservado (`test-app-js-finalization` PASS); nenhuma bridge duplicou implementação canônica.
- **Conclusão Etapa 6:** sem segredos expostos, sem REST direto residual, invariantes IA = 0.

### Etapa 7 — finalização estrutural

- **Condição de flip:** core runner = só baseline `scroll-technical-ui-audit` (24/25) ✓; `DOMAIN_EVENT_LISTENERS_IN_APP_JS = 0` ✓; secrets/Supabase auditados ✓; invariantes IA = 0 ✓.
- **`APP_JS_FINALIZED = YES`** — `app.js` é composition root + bridges + residuals de Inventory/Account-billing classificados acima (não ocultos). `APP_JS_ROLE = COMPOSITION_ROOT_WITH_RESIDUAL_DOMAIN`; `READY_TO_RESUME_AI = YES` (AI Finalization pode ser retomado em corte separado, preservando `WRITE_EXPOSED_TO_MODEL = 0`).
- Resíduos documentados (Inventory persistence, Account auth/billing, Calculator controller) permanecem como trabalho futuro por owner; não bloqueiam a finalização estrutural desta passagem.
