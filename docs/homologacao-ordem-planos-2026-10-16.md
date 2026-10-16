# Homologação local — pagamentos distintos e autoridade dos planos

Data: 16/10/2026. Branch confirmada: `codex/melhorias-setembro-2026`. Base: `d3cfe7d`.

## Escopo e causa

O teste na base reproduziu um Start aprovado anteriormente chegando depois de um Pro mais recente e substituindo indevidamente o plano/preço. A causa era o trigger tratar todo primeiro crédito como nova autoridade comercial, pela ordem de processamento.

Esta etapa separa crédito de dias e projeção comercial. A regra existente de um período de 30 dias por pagamento aprovado permanece, sem prorrateio nem prioridade fixa de Pro sobre Start. Estorno/chargeback continua preservando a validade e exigindo revisão.

## Alterações

- Nova migration `20261016104412_preserve_newer_paid_plan_during_late_credit.sql`, sem editar migrations históricas.
- Fatos do primeiro crédito congelados na tabela privada existente: data da aprovação, plano e valor. Revisões posteriores do registro financeiro não reescrevem esses fatos.
- Uma aprovação comprovadamente anterior continua creditando seus dias uma única vez, sem substituir o plano/preço posterior. A ordem é a aprovação do pagamento, não a entrega do webhook nem a última atualização de um estorno.
- Empate equivalente concede os dois créditos sem revisão comercial. Empate conflitante preserva a tupla já vigente e registra `billing_payment_projection_review_required`, razão `ambiguous_approval_time`; não usa UUID ou prioridade de plano como desempate.
- Aprovação não apaga outro checkout pendente criado posteriormente. Preservar plano/preço não deixa a própria tentativa já resolvida eternamente pendente.
- Se o plano pago comprovado já venceu, o período novo reativa esse mesmo plano, sem trocar seu preço ou desfazer cancelamento ao fim do período. Bloqueios, arquivamento, anonimização e casos em revisão impedem essa reativação automática.
- Alterações manuais posteriores, inclusive Free, são protegidas por `private.manual_plan_projection_authority`, gravada pelo helper administrativo já autenticado/autorizado na mesma transação da alteração. A data é do banco.
- As tabelas privadas mantêm RLS e nenhum acesso de anon, authenticated ou service_role. O trigger conserva `SECURITY DEFINER`, ACL restrita e `search_path = pg_catalog`; a ingestão continua pela RPC de serviço já existente.
- Índice privado por cliente/assinatura/data evita varrer todo o histórico para cada crédito.

Arquivos da etapa:

1. `supabase/migrations/20261016104412_preserve_newer_paid_plan_during_late_credit.sql`.
2. `scripts/test-payment-plan-order-supabase-api.js`.
3. `scripts/fixtures/payment-plan-order-assertions.sql`.
4. `package.json`: comando `test:payment-plan-order-local`.
5. Este relatório.

Não foram alterados OptiCore, IA, interface, preços dos cards nem configuração Android. A alteração preexistente em OptiCore permanece fora do checkpoint.

## Segurança da autoridade administrativa

A revisão encontrou que `public.audit_logs` permite INSERT de diagnósticos pelo aplicativo. Por isso, uma ação ou data nessa tabela **não é prova administrativa**. A solução final não lê auditoria pública para decidir plano, prioridade ou autorização e não reconstrói autoridade a partir dela.

O teste autenticado comprovou um INSERT de auditoria forjada, por usuário comum de outra empresa, com data futura e ação administrativa. O pagamento legítimo continuou alterando corretamente o plano: a forja não tem autoridade. Essa tabela geral continua sendo um registro de origem mista; não deve ser tratada como trilha administrativa inviolável em outros consumidores.

Apenas a operação real de concessão/Free escreve o marcador privado. Uma falha nessa gravação desfaz também a mudança do plano e do cliente, sem sucesso falso. Concessões temporárias anteriores à migration continuam tendo a proteção do `manual_override_at` já persistido; não são inventados marcadores para decisões antigas sem prova.

## Evidências locais

Ambiente: Auth, PostgREST e PostgreSQL locais, API exclusivamente `http://127.0.0.1:28065`. Contas e dados sintéticos; Mercado Pago substituído somente na fronteira de rede. Nenhum gateway/cliente real, staging remoto ou produção foi acessado nesta etapa.

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Reproduzir defeito original | PASS | Antes da migration, Start antigo substituía Pro: `start !== pro`. |
| Aprovações Start/Pro fora de ordem e em ordem | PASS | Plano/preço seguem aprovação comprovada; cada ID recebe exatamente um crédito. |
| Empates equivalentes e conflitantes | PASS | Dois períodos, nenhuma escolha arbitrária; conflito gera uma revisão. |
| Concessão manual posterior e Free | PASS | RPC pública real com superadmin e sessão Auth; aprovação antiga não reativa Free. |
| Auditoria pública forjada | PASS | INSERT real pela sessão comum, retorno 201 e releitura independente; nenhuma influência comercial. |
| Checkout próprio e outro checkout posterior | PASS | Própria pendência resolvida; a posterior permanece intacta mesmo quando muda o plano pago. |
| Reativação após vencimento | PASS | Licença real volta de Free/expirada a Pro/ACTIVE com os 30 dias novos e o preço correto. |
| Concorrência de handlers e RPCs | PASS | Duas ordens controladas de resposta e duas aprovações simultâneas; exatamente 60 dias. |
| Imutabilidade e reaprovação | PASS | Alterações posteriores de data/valor/plano seguidas de estorno/reaprovação não mudam o recibo original nem recreditam. |
| Histórico desconhecido | PASS | Fixture sem fatos originais preserva plano/preço atual, credita uma vez e registra revisão. |
| Atomicidade e ACL | PASS | Falha da revisão desfaz crédito; falha do marcador administrativo desfaz alteração manual; tabelas privadas inacessíveis. |
| Bloqueio e arquivamento | PASS | Crédito antigo não desbloqueia a assinatura; arquivamento somente na assinatura também impede reativação. |
| Nova suíte de ordem | PASS | `test:payment-plan-order-local`: 16 usuários sintéticos, dois modos de concorrência e limpeza exata. |
| Regressões existentes | PASS | payment-snapshot-local, payment-plans-local, billing-webhook-local, licensing-supabase-local e subscription-reconciliation-local. |
| Regressões estáticas/runtime | PASS | billing-webhook-runtime, billing-webhook, prepublication-p0, plan-cancellation-flow, storefront-plan-publication e phase3-rpc-hardening. |
| Preparação de replay | PASS | licensing-homolog-replay reconhece 92 arquivos; isso não certifica replay integral do zero. |
| Advisor e sintaxe | PASS | Advisor local `results: []`, `node --check` e `git diff --check`. |

Durante a implementação, os testes detectaram que preservar a tupla comercial deixava uma aprovação empatada ainda pendente e uma renovação vencida sem acesso, apesar do crédito. Os caminhos foram corrigidos e os testes mantidos. A primeira execução do novo harness também exigia `pro` no histórico financeiro, mas o backend atual escreve o alias compatível `premium`; a expectativa foi alinhada sem mudar o histórico nem a licença canônica Pro.

### Segundo banco local completo

A migration final foi executada integralmente em `s3d_reconciliation_replay_20261014`, sobre o esquema completo anteriormente preparado. Para repetir a instalação final, foram revertidos nesse clone somente os objetos experimentais novos desta etapa, após confirmar ausência de recibos; os marcadores de crédito e dados anteriores foram preservados.

As fixtures SQL rodaram com rollback. Hashes da base sintética anterior permaneceram idênticos antes/depois:

- 10 clientes: `2dc11259b50d220856cd319b848ecdd9`.
- 10 assinaturas: `69958ac79defacede4a6aa268777bde4`.
- Zero pagamentos: `d41d8cd98f00b204e9800998ecf8427e`.

As iterações foram por SQL local, sem criar entradas artificiais no ledger de migrations.

Corpos finais idênticos nos dois bancos: trigger `b48f733006eb5103da62317e691834e2`, helper manual `5597bf2e08e0492388a8098aee5c8dae`.

Na repetição final, a suíte de reconciliação apresentou `JWT issued at future`. Foram coletados os horários: Windows aproximadamente 32,8 s à frente de Linux/PostgreSQL, estes alinhados entre si. Isso não comprova a causa exata. A mesma suíte passou em uma repetição sem mudanças no código, nos testes, nos tokens nem nas regras de autenticação. Nenhum relógio foi alterado. A ocorrência fica registrada como instabilidade do ambiente, não ocultada como um PASS incondicional de autenticação externa.

## Pendências e limites — não publicar ainda

1. **PENDENTE / gate de implantação:** recibos anteriores não tiveram sua aprovação/plano/preço original reconstruídos por suposição. Se houver recibo sem data comprovada e uma compra diferente tentar mudar a tupla, o sistema preserva o plano/preço vigente, aplica seu crédito único e exige revisão (`historical_approval_unknown`). Isso pode segurar um upgrade/downgrade legítimo, inclusive de Free, até revisão. Inventariar e resolver esse histórico em homologação antes de implantar; não é apenas aviso informativo.
2. **PENDENTE:** eventos negativos de pagamentos distintos ainda precisam de projeção própria de tentativa/status. Rejeição, cancelamento ou estorno antigo pode interferir na pendência global de checkout posterior. Esta etapa protege a escolha paga e a pendência no caminho de aprovação; não certifica todo o fluxo negativo.
3. **PENDENTE:** corrigir lookup legado e confirmação de gravação de `mercadopago-create-subscription`, já identificado anteriormente.
4. **PENDENTE:** testar em staging isolado, runtime Edge/Deno real, Mercado Pago de teste e dois navegadores/dispositivos. A prova atual usa API/Auth reais locais e provedor sintético.
5. **NÃO VERIFICADO:** escritores SQL privilegiados externos à RPC, decisões administrativas históricas sem marcador e a utilização de auditoria pública como autoridade por outros módulos. Escritores legados sem `paid_at` preservam seu comportamento anterior; não recebem garantia de ordenação comercial.
6. **PENDENTE:** preparação Play futura: flavor, IA desativada, atualizador de APK, privacidade e AAB em tarefa separada. Nenhum APK/AAB foi gerado.
7. **PENDENTE de ambiente:** investigar a ocorrência intermitente de JWT futuro/relógios antes de usar esta stack como certificação contínua; não relaxar validação de tokens para contorná-la.

Implantação futura exige autorização expressa, conferência das dependências e transição controlada dos writers/workers. Para rollback, restaurar os corpos anteriores do trigger e do helper manual antes de remover os novos campos/tabela; não apagar marcadores de crédito ou evidência de revisão para forçar replay.

Referências verificadas: [datas da API de pagamentos](https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/get-payment/get), [funções de banco Supabase](https://supabase.com/docs/guides/database/functions). O changelog atual foi consultado; não houve atualização de dependências.

Status: correção desta etapa PASS local, com a ocorrência de ambiente documentada. Produção e publicação permanecem bloqueadas pelas pendências acima. **Não READY TO PUBLISH.**
