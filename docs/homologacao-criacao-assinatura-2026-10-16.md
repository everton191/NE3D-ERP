# Homologação local — criação e persistência da assinatura

Data: 16/10/2026. Branch `codex/melhorias-setembro-2026`. Base da rodada: `330bff2`; proteção de tentativas: `34cd69e`.

## Problemas corrigidos

O handler `mercadopago-create-subscription` consultava o alias legado `premium` no catálogo canônico e ignorava erros/retornos vazios das escritas. Podia devolver sucesso com contrato externo criado e assinatura local sem confirmação, além de substituir campos de uma licença paga por dados de checkout pendente.

A nova RPC de serviço `persist_mercadopago_checkout` confirma, antes do gateway, vínculo persistido do usuário/empresa, autorização administrativa efetiva e catálogo Start/Pro. A mesma autorização é repetida na gravação; identificadores fornecidos pelo navegador não são prova de autorização. A RPC é invoker com `search_path=pg_catalog`, sem EXECUTE para anon/authenticated. A autenticação do usuário continua online pela API Auth na Edge Function.

O superadmin é reconhecido pelo registro ativo em `superadmins` ou por `erp_profiles` superadmin ativo, como a autoridade atual do servidor; um rótulo isolado em `profiles` não amplia privilégios. Membros comuns ativos podem iniciar compra para a própria empresa. Um superadmin autorizado pode fazê-lo em nome de outra empresa, sem permitir substituição arbitrária de vínculos.

A criação externa só é informada como sucesso após confirmação de uma transação única para assinatura, espelho do cliente e auditoria. Catalogação e billing persistidos usam Start/Pro; aliases externos compatíveis e preços efetivamente cobrados continuam na configuração de cobrança existente, sem usar preço informativo dos cards.

Checkout registra intenção, não concessão: conserva plano, preço, validade, bloqueio, concessão manual e cancelamento existentes. Se não houver assinatura, cria o estado Free sem acesso pago. Um contrato já vinculado impede nova criação nesse endpoint; repetição da mesma persistência é idempotente. Um contrato concorrente diferente não pode substituir o vencedor.

Provider e banco não compartilham transação. Depois de POST com resposta ambígua/timeout, retorna `503 CHECKOUT_PROVIDER_REVIEW_REQUIRED`, `providerCreated:null`, sem sugerir repetição. Com ID externo confirmado mas persistência não confirmada, retorna `503 CHECKOUT_PERSISTENCE_REVIEW_REQUIRED`, ID e `retryable:false`. Não cancela contratos nem tenta outro POST automaticamente. Rejeição definitiva de entrada/autenticação pelo gateway permanece erro sem gravação.

## Arquivos

- `supabase/functions/mercadopago-create-subscription/index.ts`.
- `supabase/migrations/20261016124127_persist_canonical_subscription_checkout_atomically.sql`.
- `scripts/test-subscription-checkout-runtime.js`.
- `scripts/test-subscription-checkout-supabase-api.js`.
- `scripts/fixtures/subscription-checkout-atomicity-assertions.sql`.
- `package.json`: comandos `test:subscription-checkout-runtime` e `test:subscription-checkout-local`.
- Este relatório.

Não foram alterados OptiCore (inclusive sua alteração preexistente), IA, interface, preços de cards, configuração Android ou contratos/dados reais. Não houve acesso remoto, deploy, push, APK ou AAB.

## Validação executada

Auth, PostgreSQL e PostgREST locais reais, API somente `http://127.0.0.1:28065`. Handler efetivo carregado pelo harness Node; somente a resposta do gateway é sintética. Isso não equivale a execução em Edge/Deno real ou compra no sandbox Mercado Pago.

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Start/Pro em Free | PASS | Contrato e intenção persistidos, sem concessão paga; canonicalização confirmada no banco. |
| Membro comum da própria empresa | PASS | Membership `role=user`, sem atalho de owner; compra autorizada e gravações confirmadas. |
| Usuário comum em outra empresa | PASS | Negado antes do POST externo; estado da outra empresa intacto. |
| Superadmin entre empresas | PASS | Registro administrativo ativo permite operação; revogação e rótulo de perfil isolado são negados. |
| Auth e acesso direto à RPC | PASS | Anônimo e sessões comuns não executam a RPC de serviço; vínculo revogado nega checkout. |
| Persistência entre sessões | PASS | Segunda sessão Auth independente relê contrato e pendência remotos. Não é prova visual de dois navegadores físicos. |
| Pro pago e Start manual existentes | PASS | Licença, validade, preço, bloqueio e cancelamento permanecem iguais durante checkout. |
| Falha ou resposta perdida da gravação | PASS | Runtime exige retorno confirmado; resposta perdida não vira sucesso nem faz segundo POST. |
| Atomicidade SQL | PASS | Falha forçada na auditoria ou trigger que suprime UPDATE do cliente desfaz assinatura, cliente e auditoria. |
| Timeout/resposta externa ambígua | PASS | Sem gravação local, sem sucesso falso e sem repetição automática. |
| Repetição e concorrência | PASS | Mesma persistência não duplica auditoria; duas criações concorrentes têm um contrato vinculado e perdedor exige reconciliação externa. |
| Estorno antigo e checkout sem pagamento | PASS | Refund/chargeback com contrato ausente ou diferente, seguidos de reaprovação, conservam B; validade Pro permanece ativa e não se repete crédito. |
| Primeiro crédito atrasado | PASS | A recebe um período sem apagar B nem substituir plano mais recente; B com contrato correspondente resolve sua própria intenção. |
| Suíte integrada | PASS | 18 usuários sintéticos na versão final, removidos por identidades exatas; nenhuma chamada real ao gateway. |
| Runtime e contratos existentes | PASS | Novo runtime, Start authority, plans SaaS, checkout payment states, cancel authorization, webhook/runtime, P0 e hardening. |
| Build web/sintaxe | PASS | Build web sem modelos locais; node --check e revisão de diferenças. Nenhum build Android. |

A primeira execução da fixture usava o papel sintético inexistente `member`. O schema real permite `user`; a fixture foi corrigida sem alterar o banco nem relaxar o teste. A versão final exige uma linha de membro confirmada e não usa o privilégio de proprietário como substituto da autorização comum.

### Esquema completo e integridade

As duas migrations novas foram instaladas integralmente, em ordem de nome, no segundo banco local completo `s3d_reconciliation_replay_20261014`. As fixtures SQL de checkout e tentativa passaram nos dois bancos com rollback. Funções finais idênticas nos dois bancos:

- Checkout: `db2683a0cb751c794eac22f76a188541`.
- Projeção de tentativa: `79dac485a4e31d304b7b465dda2a2d4d`.
- Trigger de pagamento: `e1f5eb581274e460f73de73cff957e4c`.
- Ingestão do pagamento: `82768d63ec4ab289fe3dedb83f737cd3`.

Hashes dos 10 clientes e 10 assinaturas anteriores do clone ficaram idênticos e o banco retornou a zero pagamentos após limpeza sintética. A prova completa de backfill está no [relatório de tentativas](homologacao-tentativas-pagamento-2026-10-16.md). As iterações foram locais, sem simular ledger de implantação remota.

## Estado atualizado e próxima rodada

1. **PASS local:** criação canônica, confirmação de gravação, proteção da licença existente, isolamento de empresa e autoridade do superadmin.
2. **PASS local:** status de pagamentos distintos e checkout ainda sem pagamento protegidos; estorno preserva validade/revisão.
3. **PENDENTE / gate:** homologação em staging isolado com Edge/Deno real e Mercado Pago sandbox. Confirmar a identidade do contrato retornada em pagamentos recorrentes. Sem vínculo confiável, o sistema preserva a pendência por segurança, mesmo com crédito válido.
4. **PENDENTE / gate:** inventário e revisão dos históricos de criação/aprovação desconhecidas, antes de implantação. Os novos fatos não inventam datas nem reconstroem recibos comerciais antigos.
5. **PENDENTE:** reconciliação operacional dos resultados externos incertos. A corrida pode criar dois contratos externos antes da gravação, embora apenas um fique vinculado. Não há garantia de exactly-once do provider; não repetir/cancelar sem conferir o gateway e obter autorização.
6. **PENDENTE:** fluxo separado para substituir/renovar contrato recorrente já vinculado. Este endpoint bloqueia a duplicação inclusive para contratos antigos vinculados; não cancela ou migra contratos automaticamente.
7. **PENDENTE manual:** dois navegadores/aparelhos, ida/retorno do checkout, reconexão e apresentação dos erros de revisão na interface existente. Os testes locais exercitam sessões independentes, não UI física.
8. **PENDENTE de ambiente:** investigar a ocorrência anterior intermitente de JWT futuro. Não apareceu nos testes desta rodada; nenhuma validação de Auth foi relaxada.
9. **NÃO AUTORIZADO nesta rodada:** implantação em produção. Aplicar migrations em ordem somente no ambiente aprovado e antes de ativar o handler novo. Restaurar primeiro o handler anterior para rollback antes de remover a RPC; preservar fatos e auditorias financeiras.
10. **SEPARADO:** preparação Play, assinatura e validação AAB somente quando solicitadas. Nenhum pacote Android novo nesta rodada.

O advisor local de segurança não apresentou achados; a varredura completa manteve 263 avisos de performance fora do escopo, descritos no relatório de tentativas. Eles não foram suprimidos nem tratados por refatoração global.

Pronto para próxima homologação isolada, **não para implantar automaticamente nem READY TO PUBLISH**. A lista de pendências do relatório anterior de ordem de planos é atualizada por estes dois relatórios; não implica aprovação dos gates externos.

Referências: [funções de banco Supabase](https://supabase.com/docs/guides/database/functions), [API de consulta de pagamento](https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/get-payment/get).
