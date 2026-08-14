# Fase 2E — validação Android descartável

Data: 2026-08-12
Dispositivo: Zenfone físico (`RBAISCBR000F2X2`)
Pacote obrigatório: `br.com.ne3d.erp`

## Objetivo

Provar o caminho manual real de `ORDER.CREATE`, seus efeitos locais e sua recuperação sob falha sem disponibilizar WRITE para a IA nem deixar dados de homologação no aparelho ou no backup remoto.

## Proteções do harness

O harness aborta antes de interagir se não encontrar exatamente o pacote do Simplifica 3D em foreground, o PID correspondente, a WebView Android visível e o executor esperado. Ele usa CDP direcionado à WebView validada e não usa `adb input`, taps ou texto genérico.

Durante o ensaio, `simplifica_order_validation_sandbox=1` sobrevive ao reinício do processo e bloqueia fila offline, Realtime, download silencioso, polling, backup Supabase e agendamento de sync do pedido. A marca é removida ao final. O snapshot inclui pedidos, caixa, estoque, histórico e fila pendente.

## Pedido manual executado

- Cliente: marcador `HOMOLOGAÇÃO DESCARTÁVEL <timestamp>`
- Item: Chaveiro homologação
- Quantidade: 2
- Valor unitário: R$ 7,00
- Total: R$ 14,00
- Entrada: R$ 1,00
- Status: confirmado
- Material: primeiro material real com saldo suficiente, consumido pelo mesmo fluxo manual

O teste chamou `fecharPedido()` e observou 2 → 3 pedidos e 4 → 5 lançamentos de caixa. Em seguida restaurou integralmente o estado 2/4/5.

## Fault injection e reinício

Foram injetadas falhas em `BEFORE_LOCAL_PERSIST` e `AFTER_LOCAL_PERSIST`. Nos dois casos, o pedido de falha não existiu após o rollback e pedidos/caixa/estoque permaneceram em 2/4/5. Depois de `am force-stop` e nova abertura, a assinatura completa de pedidos, caixa e estoque continuou idêntica ao snapshot.

## Sincronização remota

As primeiras execuções revelaram que polling e backup remoto podiam reintroduzir o registro descartável depois da restauração local. Os registros de homologação foram removidos pelo RPC já existente e o backup remoto foi substituído pelo snapshot limpo. O harness agora isola todos os caminhos conhecidos de sync durante o ensaio. Após a execução final e espera adicional de 12 segundos: 2 pedidos, 4 caixas, 5 itens de estoque, zero pedidos descartáveis e nenhuma marca de sandbox.

Nenhuma migration, policy, tabela ou função Supabase foi alterada.

## Evidência visual

`output/ai-order-manual-disposable.png` mostra o componente real da lista de Pedidos com o pedido descartável como Pedido 3, status confirmado e total de R$ 14,00. A captura é feita via CDP antes da restauração; o componente é montado somente pelo harness e não altera a UI do aplicativo em produção.

## Estado da IA após o teste

- `writeMode`: `DRY_RUN`
- `order_create`: `UNAVAILABLE`
- executor transacional exposto à IA: não
- dados descartáveis remanescentes: zero

## Comandos

- `npm run test:simplifica3d-ai-order-disposable-contract`
- `npm run test:simplifica3d-ai-order-device-disposable`
- `node scripts/android-ai-order-disposable-harness.js --diagnostics`
- `node scripts/android-ai-order-disposable-harness.js --cleanup-only` (somente recuperação seletiva)

## Limite desta prova

A paridade estrutural e transacional automatizada já cobre preparação, pedido, caixa, estoque, rollback e persistência local. A captura confirma a apresentação do registro na lista. Uma inspeção humana tocando e navegando por todos os detalhes do pedido no aparelho ainda é uma prova manual separada; não é simulada pelo harness.
