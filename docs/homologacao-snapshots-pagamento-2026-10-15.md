# Homologação local — revisões de pagamento fora de ordem

Data: 15/10/2026. Branch verificada: `codex/melhorias-setembro-2026`.
Base desta rodada: `cc7a0c8`. Não houve acesso a produção, gateway real, deploy, push, APK ou AAB.

## Resultado e causa

PASS após correção local. No handler da base, o teste com uma resposta pendente retida até depois da aprovação falhou: `payments`, `erp_payments`, cliente e assinatura voltaram a pendente. A validade não foi duplicada, mas a projeção financeira regrediu e uma auditoria incorreta foi acrescentada.

A causa era dupla: ausência de comparação de versão do pagamento e gravações REST independentes, incluindo uma leitura de assinatura seguida de atualização do cliente vulnerável a concorrência.

A nova RPC `apply_mercadopago_payment` reúne pagamento, trigger existente de crédito/revisão, ERP, projeção do cliente e auditoria financeira na mesma transação. É `SECURITY INVOKER`, com `search_path = pg_catalog` e EXECUTE exclusivo de `service_role`. Sessões do aplicativo, inclusive superadmin, não podem invocá-la.

O leitor autenticado do provedor continua no webhook. Os parâmetros da RPC não são uma interface para dados de pagamento enviados pelo navegador. A identidade já persistida de empresa, usuário e assinatura não pode ser trocada; vínculos legados nulos podem ser preenchidos uma vez. Checkouts autorizados do superadmin em nome de outro cliente continuam aceitos.

## Regra de versão

- A ordem considera `date_last_updated` do provedor para revisões do **mesmo pagamento**, nunca a hora de chegada do webhook.
- Versão anterior: reconhecida e ignorada, sem alterações financeiras.
- Mesma versão e mesmos dados financeiros: sem crédito/auditoria repetidos. Se faltar o espelho ERP legado, ele pode ser reparado sem aplicar o crédito novamente.
- Mesma versão com estado, valor, plano, variante, contrato ou data de aprovação conflitante: falha, sem gravação parcial; exige nova consulta.
- Versão ausente/inválida e aprovação sem `date_approved`: falha fechada, sem inventar horário. Datas relativas, infinitas ou sem fuso não são aceitas.
- Estorno/chargeback: permanece a política autorizada de preservar a validade e sinalizar revisão. O crédito único continua no trigger já existente.
- A projeção não apaga um bloqueio existente somente no cliente ao receber pendência ou reparar ERP; o desbloqueio explícito de um primeiro pagamento aprovado continua sendo responsabilidade do trigger existente.

Referência do campo e de sua semântica: [Mercado Pago — consultar pagamento](https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/get-payment/get). Essa data não define a ordem comercial entre pagamentos diferentes.

## Arquivos desta rodada

- `supabase/migrations/20261015230259_apply_ordered_payment_snapshot_atomically.sql`: nova RPC e verificação de dependência do índice ERP.
- `supabase/functions/mercadopago-webhook/index.ts`: troca da sequência de gravações pela RPC, com confirmação de resultado.
- `scripts/test-payment-snapshot-supabase-api.js`: regressões pelo handler real, Auth/API reais e provedor sintético.
- `scripts/fixtures/payment-snapshot-atomicity-assertions.sql`: ACL, falhas injetadas e rollback integral.
- `scripts/test-billing-webhook-runtime.js`: acompanha a nova fronteira RPC; a cobertura interna de falhas foi transferida para os testes SQL reais, não removida.
- `scripts/test-billing-webhook-supabase-api.js`: datas de provedor explícitas e estáveis nas fixtures.
- `package.json`: comando `test:payment-snapshot-local`.
- Este relatório.

OptiCore mantém sua alteração preexistente fora do checkpoint. IA, interface e configuração Android não foram alteradas.

## Evidências e resultados

Ambiente: API exclusivamente `http://127.0.0.1:28065`, Auth, PostgREST e PostgreSQL locais. Todas as gravações usaram contas sintéticas desta execução. Leituras ao Mercado Pago foram substituídas por respostas sintéticas; não se usaram assinaturas reais.

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Reproduzir a regressão na base | PASS | Handler obtido por `git show HEAD:...`, sem trocar arquivos; o teste falhou na comparação após liberar o pending antigo, demonstrando o defeito. |
| Resposta antiga após aprovação | PASS | Comparação integral de pagamento, ERP, assinatura, cliente e auditorias permanece idêntica. |
| Duplicação, estorno e aprovação antiga | PASS | Uma revisão, nenhuma validade revogada/duplicada; espelhos preservam o estorno. |
| Versões conflitantes, ausentes e datas inválidas | PASS | HTTP 500 e estado financeiro integralmente inalterado. |
| ACL, identidade e isolamento | PASS | Anon/usuário/superadmin frontend recebem 42501; ID existente não muda de empresa nem de usuário. |
| Mesmo ID novo disputado por duas empresas | PASS | Um HTTP 200, um HTTP 500, um pagamento/ERP global e um único crédito. |
| Dois IDs distintos do mesmo plano | PASS | Exatamente 60 dias adicionais e espelhos consistentes. Não prova a escolha do plano entre IDs distintos. |
| Superadmin criando checkout para outro cliente | PASS | Webhook de serviço processa; frontend continua sem acesso à RPC. |
| Atomicidade de cada gravação | PASS | Falhas reais por constraints em payments/subscriptions/clients/ERP/audit desfazem todos os efeitos, inclusive marcador privado. |
| Plano indisponível e UPDATE com zero linhas | PASS | Falha fechada e rollback; testes SQL substituem as antigas simulações internas do handler. |
| Links legados nulos, ERP ausente e bloqueio do cliente | PASS | Preenchimento compatível, reparo sem novo crédito/auditoria e bloqueio preservado. |
| `test:payment-snapshot-local` | PASS | Onze grupos funcionais; limpeza exata de dois usuários sintéticos, auditoria preservada. |
| `test:billing-webhook-local` | PASS | Start e Pro, falha de finalização, recuperação controlada, cancelamento e concorrência. |
| `test:payment-plans-local` | PASS | Créditos únicos, renovação, aliases, permissões, rejeição e publicação da loja. |
| `test:subscription-reconciliation-local` | PASS | Isolamento, login/cadastro, planos, vencimentos e resposta canônica. |
| `test:licensing-supabase-local` | PASS | Concessões, renovação, permissões, auditoria e cards entre sessões; preço comercial preservado. |
| Demais regressões | PASS | billing-webhook-runtime, billing-webhook, plan-cancellation-flow, prepublication-p0, storefront-plan-publication e phase3-rpc-hardening. |
| Preparação do replay | PASS | `test:licensing-homolog-replay`: 91 arquivos, duas adaptações. Não equivale a executar todo o histórico do zero. |
| Dependência ausente na instalação | PASS | Retirada temporária do índice completo dentro de transação local: o guard da migration recusou a instalação com mensagem específica; a transação foi desfeita. |
| Sintaxe e higiene | PASS | `node --check` dos scripts alterados, execução/transpilação do handler nos testes e `git diff --check`. |
| Advisor local de segurança | PASS | `results: []`; não substitui revisão de aplicação nem homologação remota. |

A fixture SQL inicialmente pressupunha ausência de auditoria após cadastro; a stack cria auditoria legítima no Auth. A expectativa foi corrigida para comparar o estado anterior integralmente, preservando a verificação de rollback.

### Segundo esquema local completo

A RPC e a fixture também foram validadas em `s3d_reconciliation_replay_20261014`, clone local já utilizado nas rodadas anteriores, sem novos acessos remotos. A primeira execução revelou que esse clone não tinha a migration prévia `20261015152405_support_erp_payment_upsert.sql`: havia somente o índice parcial antigo. Aplicada exclusivamente nesse clone a migration já versionada, o teste passou. A nova migration agora verifica essa dependência antes de instalar a RPC.

O corpo final da RPC tem o mesmo hash nos dois bancos: `21e24554f211ebfb17473a7f0f754f95`. A instalação e os testes com rollback preservaram integralmente a base sintética anterior do clone:

- 10 clientes: `2dc11259b50d220856cd319b848ecdd9`.
- 10 assinaturas: `69958ac79defacede4a6aa268777bde4`.
- Zero pagamentos: `d41d8cd98f00b204e9800998ecf8427e`.

As iterações locais foram aplicadas diretamente por SQL; não avançaram artificialmente o ledger de migrations. A migration nova é aditiva e não reescreve registros históricos.

## Pendências e implantação controlada

PENDENTE: repetir em staging isolado, runtime real de Edge/Deno, Mercado Pago de teste e dois navegadores/dispositivos. Os testes atuais não certificam a integração externa completa.

PENDENTE: ordenar a projeção de plano/preço/pendência entre **pagamentos distintos**. Um estorno de um pagamento antigo pode ter atualização mais recente que uma renovação: não se deve usar `date_last_updated` como ordem comercial global. A escolha exige política explícita para aprovações cronológicas/empates; nenhum preço, plano ou contrato real foi corrigido por inferência nesta rodada.

PENDENTE: histórico que já estava estornado/rejeitado/pendente antes do marcador de crédito não permite reconstrução automática segura. Esta alteração não backfillou créditos ou auditorias faltantes por suposição.

PENDENTE da rodada anterior: revisar lookup legado e confirmação de gravação em `mercadopago-create-subscription`, separadamente e sem chamar gateway real.

Antes de qualquer implantação futura autorizada:

1. Confirmar o projeto de destino e as migrations anteriores, especialmente o índice ERP e o marcador privado de crédito.
2. Homologar o conjunto em staging e guardar evidências, incluindo a política de estorno.
3. Planejar interrupção controlada de entregas/replays e aguardar término de workers antigos; instalar migrations, trocar o handler e retomar entregas com acompanhamento.
4. Não misturar escritores antigos ou SQL privilegiado direto com a nova RPC: eles podem adquirir locks em ordem inversa. Se houver deadlock/falha, o handler retorna erro para retry, nunca sucesso artificial; essa disputa externa não foi certificada nesta rodada.
5. Para rollback, reverter o chamador antes de remover a RPC. Não apagar marcadores de crédito nem pagamentos para tentar reprocessá-los.

Status final: correção local desta etapa PASS; homologação remota e preparação para produção PENDENTES. **Não READY TO PUBLISH.**
