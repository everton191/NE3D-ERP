# Tool-calling Coverage V2 — Fase 0

Data: 2026-09-17

## Objetivo
Transformar o conjunto antigo de 560 frases em uma suíte de avaliação do Agent Core baseada nas funções reais do Simplifica 3D. Esta fase não habilita WRITE e não altera regra comercial.

## Fontes canônicas
- `src/ai/action-registry.js`: catálogo de actions.
- `src/ai/capability-bundles.json`: actions candidatas por contexto.
- `docs/quality/screen-inventory.md`: inventário de telas.
- `docs/ai/FUNCTION_AUDIT.md`: UseCases, serviços e lacunas.
- testes de domínio em `scripts/test-*.js`.
- `training/functiongemma/evaluation.v1.jsonl`: legado de 560 casos; referência histórica, não define o modelo atual.

## Diagnóstico do V1
O V1 possui 7 domínios x 80 casos, mas a variedade é majoritariamente repetição de poucos templates. Muitos casos `correct_arguments` possuem `expectedArguments: {}`. Portanto, 560 linhas não equivalem a 560 comportamentos funcionais.

O registry atual contém 37 actions em 10 domínios. O V1 exercita principalmente uma action por domínio e não cobre adequadamente PREPARE, argumentos, contexto de entidade, unidades, estados, confirmação ou workflows.

## Matriz alvo
| Domínio | Cobrir no V2 |
| --- | --- |
| navigation | rotas permitidas, aliases, rota restrita, inexistente e contexto atual |
| orders | busca/get/criação/edição/cancelamento; cliente, itens, quantidade, peso, material, status, observação e contexto |
| customers | busca/get; nome, ambiguidade, ID resolvido e cliente ausente |
| inventory | busca/rolo/histórico/reserva/liberação/consumo; material, cor, rolo, g/kg, quantidade, saldo insuficiente |
| cash | resumo/sangria/suprimento/abertura/fechamento; valores, período, sessão e confirmação |
| calculator | peso, tempo, quantidade, lote, unidade, taxas e dados faltantes; cálculo permanece determinístico no código |
| production | fila/job/status; pedido, impressora e estados válidos/inválidos |
| products | busca e desambiguação |
| printers | busca/status e referências contextuais |
| reports | abertura/navegação; filtros apenas quando houver contrato real |

## Telas/contextos conhecidos
dashboard, pedidos, pedido, calculadora, estoque, caixa, producao, clientes, relatorios, lojaOnline, lojaAdmin, conta, seguranca, empresa, config, backup, personalizacao, preferencias, usuarios, administracao, planos, assinatura, minhaAssinatura, superadmin, feedback, sobre, privacy, terms, onboarding e acessoNegado.

Nem toda tela deve virar ferramenta. O V2 distingue rota navegável de capacidade controlável pela IA.

## Dimensões obrigatórias por action
1. chamada direta correta; 2. argumentos; 3. paráfrase PT-BR; 4. typo/informal; 5. unidade equivalente; 6. contexto de tela; 7. entidade selecionada; 8. dado obrigatório ausente; 9. ambiguidade; 10. negação; 11. pergunta hipotética; 12. valor/estado inválido; 13. action próxima errada; 14. permissão/risco; 15. confirmação WRITE; 16. multi-turn curto.

## Disposições V2
`CALL`, `ASK_CLARIFICATION`, `ANSWER_ONLY`, `NO_CALL`, `OUT_OF_DOMAIN`, `CONFIRM`, `REJECT`.

WRITE não deve ser emitido livremente pelo modelo. O teste deve exigir operação preparada + confirmação vinculada quando o contrato real permitir execução.

## Context Snapshot mínimo
```json
{"screen":"orders.details","route":"pedidos","entityType":"order","entityId":"348","selectedItemId":"item-2","interactionMode":"edit","recentAction":"orders.get"}
```
Campos ausentes são omitidos, nunca inventados.

## Exemplos de ouro
```json
{"input":"coloca 350 gramas nesse item","context":{"screen":"orders.details","entityType":"order","entityId":"348","selectedItemId":"item-2"},"expectedAction":"orders.prepare_update","expectedArguments":{"order_id":"348","proposed":{"item_id":"item-2","weight_grams":350}},"expectedDisposition":"CALL"}
{"input":"muda para 0,35 kg","context":{"screen":"orders.details","entityType":"order","entityId":"348","selectedItemId":"item-2"},"expectedAction":"orders.prepare_update","expectedArguments":{"order_id":"348","proposed":{"item_id":"item-2","weight_grams":350}},"expectedDisposition":"CALL"}
{"input":"muda o peso","context":{"screen":"orders.details","entityType":"order","entityId":"348","selectedItemId":"item-2"},"expectedAction":null,"expectedArguments":{},"expectedDisposition":"ASK_CLARIFICATION"}
{"input":"quanto tem de PLA preto","context":{"screen":"inventory.list"},"expectedAction":"inventory.search","expectedArguments":{"query":"PLA preto"},"expectedDisposition":"CALL"}
{"input":"quanto entrou no caixa hoje?","context":{"screen":"cash.home"},"expectedAction":"cash.get_summary","expectedArguments":{"period":"today"},"expectedDisposition":"CALL"}
{"input":"tira 200 reais do caixa","context":{"screen":"cash.home"},"expectedAction":"cash.prepare_withdrawal","expectedArguments":{"amount":200},"expectedDisposition":"CALL"}
{"input":"calcula 120 gramas, 2 horas e meia, 3 peças","context":{"screen":"calculator"},"expectedAction":"calculator.quote","expectedArguments":{"weight_grams":120,"time_minutes":150,"quantity":3},"expectedDisposition":"CALL"}
{"input":"qual impressão está rodando?","context":{"screen":"production.queue"},"expectedAction":"production.list_queue","expectedArguments":{"status":"running"},"expectedDisposition":"CALL"}
```
IDs, tokens de confirmação e idempotency keys pertencentes ao código devem ser resolvidos/injetados pelo Agent Core, nunca alucinados pelo LLM.

## Cobertura e gates
A meta inicial é aproximadamente 1.200–2.000 casos úteis, mas o gate é cobertura, não contagem.

1. 100% das actions do registry inventariadas.
2. 100% das actions expostas possuem casos positivos e negativos.
3. 100% dos argumentos obrigatórios possuem teste de presença e ausência.
4. Peso/tempo/quantidade/dinheiro possuem normalização e limites.
5. Context references não inventam IDs.
6. WRITE não executa sem policy/confirmation.
7. Regressões reais não são regeneradas destrutivamente.
8. V1 permanece intacto para comparação histórica.

## Próxima implementação
Criar `training/agent-v2/` e gerador V2 separado, orientado por specs declarativas por domínio. Não sobrescrever `evaluation.v1.jsonl`. O gerador deve validar actions contra o registry e falhar se `expectedAction` não existir. Depois rodar LFM2.5 no Zenfone 8 e produzir métricas por action, argumento, disposição e contexto.
