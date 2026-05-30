# Diagnosticos, Bugs e Sugestoes - Fase 6A

Data: 2026-05-29

## Eventos Start - Fase 5A.2

Eventos preparados para ativacao controlada do Start:

- `start_plan_checkout_requested`
- `start_plan_checkout_created`
- `start_plan_checkout_failed`
- `start_plan_payment_pending_real`
- `start_plan_payment_approved`
- `start_plan_payment_failed`
- `start_plan_subscription_created`
- `start_plan_subscription_cancel_requested`
- `start_plan_subscription_cancel_at_period_end`
- `start_plan_subscription_expired`
- `start_to_pro_upgrade_requested`
- `start_to_pro_upgrade_approved`
- `webhook_start_plan_resolved`
- `webhook_start_plan_resolution_failed`

Esses eventos nao podem salvar token, secret, authorization, dados de cartao, CPF ou payload integral do Mercado Pago.

## Fase 5C.1

Smokes remotos sem cobranca confirmaram eventos/fluxos de seguranca:

- webhook sem assinatura recusado;
- webhook com assinatura invalida recusado;
- payloads continuam sanitizados pelo service de diagnostico;
- eventos Start e webhook seguem registrados apenas por nomes e metadados seguros.

## Objetivo

A Fase 6A cria uma base segura para coletar erros tecnicos, relatos manuais, sugestoes, eventos de diagnostico, clusters de bugs e relatorios tecnicos para correcao via Codex.

Nenhuma IA real foi ativada. Nenhum provider externo e chamado.

## Tabelas

- `app_error_logs`: erros tecnicos deduplicados por `fingerprint`, com tela, acao, versao, plataforma, plano no momento e severidade.
- `app_error_log_users`: relacao entre erro e usuarios afetados sem duplicar detalhes tecnicos.
- `app_feedback_reports`: relatos manuais, sugestoes, melhorias, duvidas e reclamacoes.
- `app_diagnostic_events`: eventos operacionais como falha de sync, editor da loja, checkout, pagamento, webhook, PWA/cache e PDF.
- `app_bug_clusters`: agrupamento de erros semelhantes por fingerprint, telas, versoes e plataformas afetadas.
- `app_bug_reports_exports`: relatorios tecnicos gerados para correcao.
- `app_ai_analysis_runs`: preparacao futura para analise por IA, sempre desativada nesta fase.
- `app_ai_knowledge_base`: base futura de contexto tecnico, sem uso por IA nesta fase.

## Privacidade

O frontend usa `sanitizeDiagnosticPayload()` antes de registrar metadados. Campos como `access_token`, `refresh_token`, `password`, `authorization`, `apikey`, `api_key`, `card`, `document`, `cpf`, `cnpj`, `secret` e `webhook_secret` sao substituidos por `[redacted]`.

Nao salvar:

- senhas;
- tokens;
- cartao;
- payload completo de pagamento;
- segredo de webhook;
- chaves de API;
- refresh token.

## Frontend

O arquivo `src/services/diagnosticsService.js` expoe:

- `reportAppError(error, context)`;
- `reportFeedback(payload)`;
- `reportDiagnosticEvent(eventType, payload)`;
- `generateErrorFingerprint(error, context)`;
- `sanitizeDiagnosticPayload(payload)`;
- `flushPendingDiagnosticsQueue()`;
- `generateCodexTechnicalReport(data)`;
- `generateDiagnosticsSummaryReport(filters, data)`.

O envio nunca deve quebrar o app. Quando offline ou em falha de rede, o item fica em fila local temporaria e pode ser reenviado quando a conexao voltar.

## Captura automatica

O service registra eventos globais de:

- `window.onerror`;
- `window.onunhandledrejection`;
- fila offline com `online`.

O `app.js` configura o contexto atual com usuario, versao, tela, rota, plataforma, modo PWA/APK e estado de plano quando disponivel.

## Deduplicacao

`generateErrorFingerprint()` normaliza a mensagem, tela, acao e versao. Numeros variaveis sao normalizados para reduzir duplicacao de erros semelhantes.

Quando o backend usar `register_app_error`, o comportamento esperado e:

- incrementar `occurrence_count`;
- atualizar `last_seen_at`;
- registrar usuario afetado em `app_error_log_users`;
- permitir agrupamento posterior em `app_bug_clusters`.

## Eventos de planos e Mercado Pago preparados

Eventos aceitos para diagnostico futuro:

- `checkout_opened`;
- `checkout_abandoned`;
- `checkout_returned_without_payment`;
- `payment_pending_real`;
- `payment_approved`;
- `payment_failed`;
- `subscription_created`;
- `subscription_cancel_requested`;
- `subscription_cancel_at_period_end`;
- `subscription_reactivated`;
- `subscription_expired`;
- `webhook_received`;
- `webhook_validation_failed`;
- `webhook_ignored_duplicate`;
- `webhook_plan_resolved`;
- `webhook_plan_resolution_failed`.

Estes eventos apenas registram diagnostico. Eles nao alteram regra de plano, assinatura, pagamento ou checkout.

## RLS

A migration `20260529162000_diagnostics_bugs_feedback_codex.sql` ativa RLS em todas as tabelas novas.

Regra geral:

- usuario comum pode criar e ler seus proprios logs/feedbacks/eventos;
- superadmin pode listar agregados, alterar status/severidade e gerar relatorios;
- sistema/service role pode usar as operacoes administrativas conforme Supabase.

Nao ha policy publica `using (true)` ou `with check (true)` nas novas tabelas da fase.

## Validacao e endurecimento - Fase 6B

A Fase 6B adicionou a migration `20260529173500_diagnostics_validation_hardening.sql`.

Validacoes/correcoes:

- `app_error_logs` recebeu `admin_notes` e compatibilidade com `affected_users_count`.
- `refresh_app_bug_cluster_from_error()` cria ou atualiza `app_bug_clusters` sempre que um erro e inserido/atualizado.
- O cluster usa `fingerprint`, ou `error_key` como fallback, para agrupar erros repetidos.
- `occurrence_count`, usuarios afetados, versoes, telas e plataformas afetadas sao recalculados pelo trigger.
- Se um cluster marcado como `fixed` ou `ignored` receber nova ocorrencia posterior, ele pode voltar como `regression`.
- Testes validam sanitizacao, eventos de planos, fila offline, relatorio Codex e flags de IA desligadas.

Limites:

- A migration precisa estar aplicada no Supabase remoto para validar dados reais.
- A validacao autenticada do painel Superadmin deve ser repetida com conta real apos deploy/migration.

## Aplicacao remota e RLS - Fase 6C

As migrations de IA desativada e diagnosticos foram aplicadas no projeto remoto principal `qsufnnivlgdidmjuaprb` em 2026-05-29 por execucao individual controlada:

- `20260529141000_ai_foundation_disabled.sql`;
- `20260529162000_diagnostics_bugs_feedback_codex.sql`;
- `20260529173500_diagnostics_validation_hardening.sql`.

O fluxo evitou `db push` geral porque o dry-run indicou migrations antigas fora de escopo pendentes antes da fase atual. Depois da aplicacao individual, o historico remoto foi reparado apenas para essas tres versoes com `supabase migration repair --status applied`.

Validacao remota executada:

- tabelas de IA e diagnosticos existem no schema publico;
- RLS esta ativo em todas as tabelas novas;
- nenhuma policy das tabelas novas usa `using (true)` ou `with check (true)`;
- `app_ai_settings` permanece com IA desligada (`ai_enabled=false`, provider `disabled`, limite `0`);
- trigger `refresh_app_bug_cluster_after_error` esta instalado;
- usuario comum consegue inserir/ler o proprio feedback, erro, evento e tentativa bloqueada de IA;
- usuario comum nao consegue ler clusters globais nem alterar severidade;
- superadmin reconhecido por `erp_is_superadmin()` consegue ler cluster, alterar bug/feedback e criar export para Codex;
- a validacao usa transacao com `rollback`, sem deixar dados de teste permanentes.

Comando repetivel:

```bash
npm run supabase:diagnostics:validate
```

Observacao: o dry-run global ainda aponta migrations antigas de storefront/financeiro fora do escopo desta fase. Elas nao devem ser enviadas junto com diagnosticos sem uma revisao propria.

## Deploy e smoke remoto - Fase 6D

Deploy web publicado em 2026-05-29:

- commit base: `80d4852`;
- deploy Vercel: `dpl_GWXFJVvQxrGJtX2Zqyb9SkL5gu8z`;
- URL validada: `https://erpne3d.vercel.app`;
- cache publicado: `simplifica-3d-v119-estavel-20260529-diagnostics-6b`.

Validacoes executadas:

- `npm run supabase:diagnostics:validate` retornou `diagnostics_remote_validation_ok`;
- `dist/src/services/diagnosticsService.js` publicado com HTTP 200;
- tela publica e tela protegida carregam sem erro de console no smoke sem login;
- o bundle publico nao carrega service de IA nem service Google.

Limite da fase:

- envio manual de feedback com usuario real, acoes de Superadmin e geracao visual de relatorio Codex precisam de sessao autenticada. Sem credenciais nesta execucao, esses pontos ficaram registrados como smoke manual pendente, nao como falha automatica.

## Fase 5A.1 - Diagnosticos do webhook Mercado Pago

O webhook central registra eventos sanitizados em `app_diagnostic_events`:

- `webhook_received`;
- `webhook_validation_failed`;
- `webhook_ignored_duplicate`.

O payload persistido passa por sanitizacao no backend. A tabela interna `billing_webhook_events` preserva idempotencia e nao fica acessivel ao frontend.

O smoke remoto permitido usa somente uma notificacao sem assinatura e confirma resposta HTTP `401`. Ele nao cria pagamento, preferencia ou assinatura.
