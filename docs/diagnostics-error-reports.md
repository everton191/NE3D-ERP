# Diagnosticos, Bugs e Sugestoes - Fase 6A

Data: 2026-05-29

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
