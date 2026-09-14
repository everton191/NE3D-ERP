# AI tool audit — Phase 5

Audit checkpoint: `1aac958`. Registry inspection found 38 actions: 15 READ, 11 PREPARE and 12 WRITE; 14 are currently healthy and model-exposed. WRITE exposure is zero because graph health excludes every WRITE action.

| Classification | Actions |
|---|---|
| KEEP | navigation.open, orders.search, orders.get, customers.search, inventory.search, cash.get_summary, calculator.quote, production.list_queue, products.search, printers.search, reports.open |
| ADJUST | orders.prepare_create, orders.prepare_update, orders.prepare_cancel, production.prepare_job, production.prepare_change_status: require resolved entity IDs and remain PREPARE only |
| DISABLE | customers.get, inventory.get_roll, inventory.history, inventory.prepare_reservation, inventory.prepare_release, inventory.prepare_consume, calculator.batch, cash.prepare_withdrawal, cash.prepare_deposit, cash.prepare_close_session: not healthy/model-exposed until their handlers and tests exist |
| DETERMINISTIC | navigation.open, cash.get_summary, production.list_queue, calculator.quote, orders.get/search, customers.search, inventory.search, products.search, printers.search, reports.open for unambiguous commands |
| REVIEW | all 12 WRITE actions: orders.commit_create/update/cancel, inventory.reserve/release/consume, cash.commit_withdrawal/deposit/open_session/close_session, production.commit_job/change_status |

The registry metadata is the source of requires, produces and allowedNext. The graph rejects unhealthy, unauthorized, unmet-requirement and WRITE actions before ranking, then uses Top-K <= 3. Compact context contains route, screen, domain, selected IDs, permissions, known fields and at most three compact results; no DOM/HTML/full ERP state is sent.

Known issue retained for strong review: several disabled actions still have declarative aliases/schemas but no handler. They remain unavailable and must not be made model-visible merely to increase coverage.
