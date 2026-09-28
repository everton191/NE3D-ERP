# LOTE 3 — Tool Registry e roteamento semântico

`ToolRegistry` deriva um perfil por intent do `IntentRegistry` e referencia actions reais no `ActionRegistry`; não cria handlers paralelos. Uma tool só tem `modelExposed=true` quando a action vinculada está `READY`, é READ/PREPARE e possui handler.

`ToolCandidateRetriever` aplica intent/workflow antes de texto. Depois avalia contexto, aliases, exemplos positivos/negativos e estado operacional. Ele devolve até cinco candidatos, seus sinais, rejeições e `routeConfidence` independente de confiança de entidade ou de provider.

Intent correta não é sinônimo de disponibilidade: por exemplo, `inventory.low_stock` retorna a semântica correta mas permanece indisponível até existir action segura. WRITE continua nunca exposto.

`buildNeedleProviderInput()` é somente leitura e produz o subconjunto de schemas já filtrado para um provider futuro. `NeedleProviderContract` só declara capacidades esperadas; não contém JNI, binário, download ou execução nativa.
