# Homologação local — ordem das tentativas de pagamento

Data: 16/10/2026. Branch: `codex/melhorias-setembro-2026`. Base: `330bff2`.

## Correção

Eventos de pagamentos distintos usavam a ordem de processamento para atualizar a pendência global. Antes da correção, uma rejeição antiga apagou um Pro pendente posterior (`pending_plan: null !== pro`). Uma revisão antiga ainda pendente também podia encobrir uma tentativa posterior já encerrada.

A migration aditiva `20261016124420_order_payment_attempt_status_by_provider_creation.sql` congela a criação de cada pagamento em `private.payment_license_effects.source_created_at`. O status global segue a criação da tentativa, não a entrega do webhook nem a última revisão financeira. O registro financeiro de cada ID continua recebendo suas revisões ordenadas pela versão do provedor.

Crédito de dias, escolha do plano pela aprovação e status da tentativa são decisões distintas. Cada pagamento aprovado continua concedendo um único período; estorno/chargeback mantém a validade e registra revisão, conforme decisão do proprietário.

Um checkout recorrente pode existir antes do primeiro pagamento. Quando há uma intenção pendente gravada pelo servidor, vinculada ao contrato atual, um pagamento de outro contrato ou sem vínculo não a resolve. A comparação usa a identidade do contrato, não o relógio de recebimento. A licença pode receber seu crédito independentemente dessa pendência.

Empates de criação ou histórico sem origem confiável preservam a projeção atual e registram uma revisão única. A ingestão exige datas de criação e atualização válidas e impede alteração da criação em novas revisões. Escritores SQL privilegiados legados sem origem mantêm seu contrato anterior; não recebem a garantia de ordenação.

## Arquivos

- `supabase/migrations/20261016124420_order_payment_attempt_status_by_provider_creation.sql`.
- `scripts/test-payment-attempt-order-supabase-api.js`.
- `scripts/test-payment-snapshot-supabase-api.js`: criação estável e distinta por ID nas fixtures que não testam empate.
- `scripts/fixtures/payment-attempt-order-assertions.sql`.
- `scripts/fixtures/payment-attempt-backfill-before.sql` e `payment-attempt-backfill-after.sql`.
- `package.json`: comando `test:payment-attempt-order-local`.
- Este relatório.

OptiCore, IA, interface, assinaturas Android e dados de clientes reais não foram alterados. A alteração preexistente de OptiCore foi preservada fora do commit.

## Evidências

Ambiente: Auth, PostgreSQL e PostgREST locais, API `http://127.0.0.1:28065`. Provedor substituído por respostas sintéticas somente na fronteira de rede; nenhum contrato externo criado ou cancelado. Nenhum acesso a staging remoto ou produção.

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Defeito original reproduzido | PASS | Antes da migration, rejeição antiga apaga pendência nova; a asserção falha. |
| Rejeição/cancelamento/estorno/chargeback antigos | PASS | Suíte API com 16 usuários sintéticos preserva pendência ou aprovação mais nova e o histórico financeiro individual. |
| Tentativa atual encerrada e revisão antiga pendente | PASS | Encerramento limpa somente a própria intenção; revisão antiga não volta a mascará-lo. |
| Crédito e licença | PASS | Datas, planos, preços e acesso pago preservados nos negativos; revisão de estorno única e sem revogação. |
| Empates, datas inválidas e criação imutável | PASS | Empate preserva estado; datas ausentes/inválidas/conflitantes falham sem efeitos parciais e permitem recuperação válida. |
| Concorrência | PASS | Duas ordens controladas de resposta e RPCs simultâneas convergem para a tentativa mais nova. |
| Permissões e atomicidade | PASS | Fixture SQL verifica owner postgres, invoker, search_path fixo, ACL privada, approved→approved antes do retorno antecipado e rollback de revisão obrigatória. |
| Histórico sem origem | PASS | Fixture mantém origem desconhecida, registra uma revisão, concede crédito aplicável uma vez e conserva a projeção da tentativa. |
| Checkout ainda sem pagamento | PASS | Fixture SQL nos dois bancos confirma que refund/reaprovação/crédito sem vínculo não apagam a intenção de outro contrato; pagamento do próprio contrato a resolve. |
| Backfill sobre esquema completo | PASS | Três históricos sintéticos: origem válida, inválida e ausente. Pagamento, licença, cliente, auditoria, crédito e revisão anterior ficam idênticos; apenas os novos fatos privados são preenchidos. |
| Regressões API | PASS | snapshot, ordem dos planos, pagamentos, webhook, licenciamento e reconciliação. |
| Regressões SQL anteriores | PASS | Seis fixtures anteriores executadas com rollback. |
| Regressões estáticas/runtime | PASS | Webhook, P0, cancelamento, RPC hardening e preparação de replay. |
| Build web e sintaxe | PASS | Build web sem GGUFs, node --check e git diff --check; nenhum build Android. |

O teste antigo de snapshots atribuía a mesma criação a todos os IDs, provocando dois novos registros legítimos de revisão e a falha `8 !== 6` no total de auditorias. As fixtures comuns passaram a usar criação estável e distinta por ID; a asserção de auditoria foi mantida e os empates continuam testados na suíte dedicada. A fixture SQL nova também foi corrigida para usar datas relativas e comparação nula segura: datas fixas antigas acionavam a expiração normal de 24 horas, fora do cenário de ambiguidade pretendido.

Durante a instalação local inicial, os helpers novos ficaram com owner diferente do trigger e seu EXECUTE privado foi negado. A migration final fixa explicitamente owner `postgres`; a execução integral no segundo banco completo passou, sem concessões às roles da API.

### Segundo banco local completo

As migrations finais de checkout e tentativa foram aplicadas integralmente, em ordem de nome, no clone local `s3d_reconciliation_replay_20261014`, sobre o esquema completo existente. As fixtures before/after confirmaram o backfill e removeram somente suas três identidades sintéticas, preservando a auditoria. Fixtures de assertivas usam rollback. Não foi um replay integral desde banco vazio; o teste de preparação reconhece 94 arquivos e não substitui essa prova.

Hashes dos registros anteriores permaneceram iguais antes/depois:

- 10 clientes: `2dc11259b50d220856cd319b848ecdd9`.
- 10 assinaturas: `69958ac79defacede4a6aa268777bde4`.
- Zero pagamentos: `d41d8cd98f00b204e9800998ecf8427e`.

As iterações foram SQL exclusivamente local, sem fabricar entradas no ledger de migrations.

## Riscos e próximos gates

1. **PENDENTE / gate de implantação:** inventariar histórico sem criação/aprovação comprovadas. A proteção conservadora pode manter uma pendência até revisão; não reconstruir datas por suposição nem apagar marcadores de crédito.
2. **PENDENTE:** confirmar no sandbox real como pagamentos recorrentes informam o contrato. Sem `preapproval_id`, `subscription_id` ou `metadata.mercado_pago_subscription_id` confiável, uma compra pode receber seu crédito e manter a intenção pendente por segurança. O provedor sintético prova a regra interna, não esse formato externo.
3. **PENDENTE:** homologação remota isolada, runtime Edge/Deno real, Mercado Pago de teste e dois navegadores/dispositivos. Não foi realizada nesta rodada.
4. **PENDENTE:** criação de checkout com contrato externo incerto ou concorrente requer reconciliação controlada; nenhuma promessa de transação distribuída ou cancelamento automático.
5. **NÃO VERIFICADO:** writers privilegiados externos aos caminhos cobertos. Migração e ativação remotas exigem autorização e transição controlada dos writers.
6. **PENDENTE de ambiente:** ocorrência anterior de JWT futuro não foi corrigida alterando tokens/regras/relógios. Não apareceu nas regressões API desta etapa; isso não encerra sua investigação.

O advisor local completo apresentou 263 avisos de performance (99 auth_rls_initplan, 162 multiple_permissive_policies e 2 duplicate_index), sem achados de segurança ou nível ERROR. Não foram feitas mudanças globais em RLS/índices para resolver avisos fora deste escopo.

Rollback: restaurar os corpos anteriores do trigger e da RPC antes de remover helpers/colunas; preservar os marcadores e evidências financeiras existentes. Nenhum deploy, push, APK ou AAB nesta rodada. **Não READY TO PUBLISH.**

Referências: [datas do pagamento Mercado Pago](https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/get-payment/get) e [funções Supabase](https://supabase.com/docs/guides/database/functions).
