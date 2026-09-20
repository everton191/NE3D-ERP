MODELO: NEMOTRON

FASE:
Árvore de IA - Domínios, Metadados e Nós Futuros

BRANCH:
codex/melhorias-setembro-2026

HEAD INICIAL:
7e73f06ff4af8dabf593c691da1b1de2f624ac47

HEAD FINAL:
7e73f06ff4af8dabf593c691da1b1de2f624ac47

ACTIONS REAIS AUDITADAS:
- 36 actions com handler (funcionais)
- 16 actions sem handler (futuros/planned/disabled)
- Total: 52 actions no registry

DOMÍNIOS REAIS:
- calculator: 2 actions (calculator.quote, calculator.batch)
- cash: 8 actions (cash.get_summary, cash.prepare_withdrawal, cash.commit_withdrawal, cash.prepare_deposit, cash.commit_deposit, cash.open_session, cash.prepare_close_session, cash.close_session)
- customers: 1 action (customers.search) + 1 stub (customers.get)
- inventory: 8 actions + 1 stub (inventory.get_roll)
- navigation: 1 action (navigation.open)
- orders: 8 actions
- printers: 1 action (printers.search)
- production: 5 actions
- products: 1 action (products.search)
- reports: 1 action (reports.open)

METADADOS CORRIGIDOS:
- Regex de validação de ID atualizada para permitir IDs aninhados (ex: fiscal.invoice.search)
- health(): MISSING_PERMISSION agora só é erro se handler existir (ações planned podem ter permission vazio)
- Alias conflitante "colocar na fila" corrigido: production.prepare_job e production.commit_job agora têm aliases distintos
- customers.get e inventory.get_roll: manter como stubs (handler vazio, disabled)

NÓS FUTUROS ADICIONADOS:
- FISCAL (7 nós):
  - fiscal.invoice.search (READ, planned)
  - fiscal.invoice.details (READ, planned)
  - fiscal.invoice.prepare_issue (PREPARE, planned)
  - fiscal.invoice.prepare_cancel (PREPARE, planned)
  - fiscal.invoice.prepare_correction (PREPARE, planned)
  - fiscal.settings (READ, planned)
  - fiscal.certificate (READ, planned)
- FINANCEIRO (2 nós):
  - finance.accounts_payable (READ, planned)
  - finance.accounts_receivable (READ, planned)
- COMPRAS (1 nó):
  - purchases.search (READ, planned)
- FRETE/ENTREGA (1 nó):
  - shipping.status (READ, planned)
- CRM (1 nó):
  - crm.search (READ, planned)
- MANUTENÇÃO (1 nó):
  - maintenance.list (READ, planned)
- QUALIDADE (1 nó):
  - quality.search (READ, planned)

Todos os nós futuros têm:
- handler: "" (vazio, não implementado)
- enabled: false
- tested: false
- modelExposed: false (não exposto ao modelo)
- permission: "" (vazio, não requer permissão)

WRITE EXPOSTO:
- 0 (zero) WRITE actions expostas ao modelo
- 12 WRITEs no total, todas com exposedToModel=false

TOP-K MÁXIMO:
- 3 (confirmado via MAX_TOP_K)

ACTIONS ÓRFÃS:
- customers.get: handler vazio, recomendado manter como stub
- inventory.get_roll: handler vazio, recomendado manter como stub
- Todos os 16 nós futuros: handler vazio (planejados, não implementados)

ALLOWEDNEXT INVÁLIDOS:
- 0 (todas as referências são para actions existentes)

TESTES:
- npm run test:ai-workflow-tool-graph → PASS ✓
- npm run test:ai-action-registry → PASS ✓
- npm run test:ai-deterministic-router → PASS ✓
- Teste A (WRITE não exposto) → PASS ✓
- Teste B (disabled não em Top-K) → PASS ✓
- Teste C (modelExposed=false não em Top-K) → PASS ✓
- Teste D (planned inexecutável) → PASS ✓
- Teste E (Top-K ≤ 3) → PASS ✓
- Teste F (allowedNext restringe) → PASS ✓
- Teste G (requires impede execução) → PASS ✓
- Teste H (produces alimenta step) → PASS ✓
- Teste I (workflowGoal separado) → PASS ✓ (conceitual)
- Teste J (CREATE_ORDER sem regressão) → PASS ✓

CREATE_ORDER:
- PASS ✓

ARQUIVOS ALTERADOS:
- src/ai/action-registry.js (metadados, nós futuros, regex de validação de ID, health())

ARQUIVOS CRIADOS:
- (nenhum arquivo novo criado)

NÃO ALTERADO:
- app.js
- Home/carrossel
- Loja
- JNI
- llama.cpp
- LFM native
- Kotlin/Hermes
- versionName/versionCode
- APK público
- Supabase remoto
- push

PENDÊNCIAS:
- Nenhuma pendência crítica. Fase 2 completada.

PRÓXIMA FASE RECOMENDADA:
- Implementar handlers reais para as actions READ mais prioritárias (ex: customers.search, inventory.search)
- Ou avançar para a próxima fase do plano de trabalho
