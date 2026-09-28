# Lacunas técnicas da arquitetura de IA

## CRITICAL

1. Não há `IntentRegistry` executável nem `ActionPlan` único. O router, o fluxo de draft e as capabilities legadas usam vocabulários distintos.
2. `Simplifica3dAiRuntime.predictTool()` não chama LFM: hoje só retorna o resultado determinístico ou `LOCAL_LLM_TOOL_ADAPTER_NOT_VALIDATED`.
3. O manifesto web marca LFM Q4/Q6 como `experimental-unavailable`, enquanto `SimplificaLocalAiPlugin.kt` possui catálogo, hash, tamanho e importação local para QAD Q4/Q6. Não há fonte única de verdade de modelo.

## HIGH

1. Apenas 16 das 52 actions estão `READY`; bindings canônicos cobrem uma fração dos handlers declarados.
2. `orders.create` existe como workflow legado `ORDER.CREATE`, mas não existe como intent/action/tool canônica única.
3. `ConversationMemory` e `ConversationSession` persistem contexto independente, com sobreposição de conversa, entidades e dados de workflow.
4. FunctionGemma ainda possui código Android, adapters, runtimes web/nativo, testes, telemetria e documentação. Não é a rota principal LFM atual, mas pode interferir em futura seleção de provider se não for isolado por manifesto.

## MEDIUM

1. `customers.get`, `inventory.get_roll` e todos os nós fiscal/financeiro futuro não têm handler real.
2. Operações PREPARE/WRITE de estoque, caixa e produção são declaradas, mas `DEGRADED`; documentação não pode promovê-las.
3. `products.search` não prova que representa produtos da Loja Online; a equivalência com `storefront.products` permanece parcial.
4. O provider atual não expõe chat template, tool call estruturado, embeddings, download ou health completo ao JavaScript.

## LOW

1. A telemetria ainda usa `functiongemma` como nome padrão de rota não determinística.
2. Documentos históricos descrevem 39 actions, mas o registry atual contém 52.
3. O `assistant-core` já possui armazenamento web de artifacts, mas não é a fonte usada pelo plugin Android atual.

## Memória: separação futura

| Estrutura atual | Responsabilidade observada | Destino conceitual futuro |
|---|---|---|
| `ConversationMemory` | mensagens recentes, facts, decisões, correções e entidades atuais | RecentMemory + FactMemory + EpisodicMemory |
| `ConversationSession` | tarefa ativa, draft, slots, entidades resolvidas, confirmação e resultados | WorkflowMemory + DraftManager |

Dados de `activeDraft`, `pendingAction`, `missingSlots`, `resolvedEntities` e `taskStack` pertencem ao workflow. Mensagens, fatos explícitos, decisões e correções pertencem à conversa. Nenhuma migração é feita neste lote.

## LEGACY_MODEL_CLEANUP

FunctionGemma permanece inventariado, sem remoção:

- Android: `FunctionGemmaModelInstaller.kt`, `FunctionGemmaToolPolicy.kt`, `FunctionGemmaToolRuntime.kt`.
- Web: `functiongemma-adapter.js`, `functiongemma-native-runtime.js`, `functiongemma-web-runtime.js`.
- Validação: scripts e testes `test-functiongemma-*`.
- Telemetria/autenticação: referências a `functiongemma` como provider/modelo.

É código executável e testado, não dead code comprovado. A futura integração Needle deve usar provider e manifesto próprios, sem reutilizar prompt/template FunctionGemma.

## Conflito LFM documentado

| Fonte | Q4 | Q6 |
|---|---|---|
| Manifesto web | `lfm2.5-1.2b-q4_0`, sem arquivo/hash/tamanho, `experimental-unavailable` | `lfm2.5-1.2b-q6_k`, sem arquivo/hash/tamanho, `experimental-unavailable` |
| Catálogo Android | `LFM2.5-1.2B-Instruct-QAD-Q4_0.gguf`, 695755488 bytes, SHA `bb741e...a0cb3e1` | `LFM2.5-1.2B-Instruct-Q6_K.gguf`, 962843456 bytes, SHA `c5e895...beacd9a2` |

Resolver esse conflito pertence ao lote de ModelManifest; nenhum descriptor foi mudado agora.
