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
| Printers | PARTIAL_MODULE | `src/features/printers/` | presentation helpers restantes |
| Orders | DOMAIN_LOGIC, PERSISTENCE, UI | `app.js` + use cases IA | auditoria antes de extração |
| Calculator | DOMAIN_LOGIC, PRESENTATION | `CalculatorDomain` + `app.js` | helpers puros sem duplicar fórmula |
| Cash | DOMAIN_LOGIC, PERSISTENCE, SUPABASE | `app.js` | selectors/formatters primeiro |
| Storefront | DOMAIN_LOGIC, DOM_EFFECT | `src/storefront/` + `app.js` | somente duplicação comprovada |
| Reports/Home | PARTIAL_MODULE | facades e módulos existentes | remover somente duplicação provada |
| AI | BRIDGE | `src/ai`, `src/ai-3d`, `ReadFacade` | preservar; não evoluir IA nesta fase |
| Bootstrap/eventos | BOOTSTRAP, EVENT_WIRING | `app.js` | permanece até o encerramento |

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
| Pedidos | PARTIAL | normalizers, renderer de lista/detalhe e repositório local validados | `renderListaPedidosLegacy` e `renderDetalhePedidoLegacy` ainda aguardam prova visual antes de remoção; handlers de edição/cancelamento e executor transacional continuam no `app.js` |
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

**Estado honesto atual:** `APP_JS_FINALIZED=NO`; `APP_JS_ROLE=STILL_CONTAINS_DOMAIN_LOGIC`; `READY_TO_RESUME_AI=NO` até que os blocos acima sejam modularizados e tenham paridade comprovada.

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
- Portanto: `APP_LOAD_VISUAL=PASS`, `ORDERS_CUSTOMERS_VISUAL_PARITY=NOT_PROVEN`, `DEVICE_PASS=NOT_TESTED`. Isso é evidência de carga, não prova suficiente para remover `renderListaPedidosLegacy`, `renderDetalhePedidoLegacy` ou `renderClientesLegacy`.
- Métricas atuais: bytes 2.616.744; linhas 49.695; funções 2.611; renderers 370; referências Supabase 635; listeners 161; bridges contabilizadas 24. As métricas não incluem uma conclusão de qualidade porque o working tree é compartilhado e já contém mudanças não relacionadas.
- Regressão nova: **NÃO**. `test-manual-production-ui.js` reproduziu exatamente o baseline: `Produção manual incompleta: Acompanhe somente Em fila, Imprimindo e Pronto.`

### Etapa 2.3 — paridade estrutural e mapa de fechamento

- `scripts/test-domain-renderer-parity.js` valida em DOM/string isolado os contratos canônicos de Pedidos (vazio, lista múltipla, status, busca, cliente, total, prazo, ações, detalhe, materiais e voltar) e Clientes (vazio, lista, busca, métricas e ação de abrir Pedidos). Não cria sessão no runtime de produção.
- Resultado: `ORDERS_RENDERER_STRUCTURAL_PARITY=PASS`, `CUSTOMERS_RENDERER_STRUCTURAL_PARITY=PASS`. A prova visual autenticada permanece pendência de release, não bloqueio estrutural.
- Consumidores estáticos dos legados: somente as declarações `renderListaPedidosLegacy`, `renderDetalhePedidoLegacy`, `renderClientesLegacy` e `renderClientesOperacionaisLegacy` foram encontradas. A remoção exige uma alteração grande e isolada, a ser feita após teste do executor e controller de Pedidos, para não confundir remoção de renderer com regressão de handlers.

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
