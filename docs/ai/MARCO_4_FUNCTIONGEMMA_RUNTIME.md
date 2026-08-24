# Marco 4 — runtime FunctionGemma no Zenfone 8

```ini
FUNCTIONGEMMA_ANDROID_Q8 = READY
FUNCTIONGEMMA_BASELINE = READY
AI_RUNTIME_PERFORMANCE = READY
DOMAIN_USECASE_PARITY = NOT_READY
FINE_TUNING_PREPARATION = NOT_READY
WRITE_EXPOSED = 0
```

## Relatório

```yaml
APK_BUILD: PASS
NATIVE_LIBS_IN_APK: PASS (7 bibliotecas ARM64; 2 variantes CPU)
JNI_ARM64: PASS
NATIVE_GENERATE: PASS
KOTLIN_BACKEND: PASS

GGUF_INSTALLED: PASS
SHA256_DEVICE: 595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47
MODEL_LOAD: PASS (1.36-1.49 s medidos)
WARMUP: PASS (17-18 ms)

SMOKE_3: PASS
SMOKE_18: PASS (18/18 após política fail-closed; 15/18 raw)
BASELINE_560: PASS (560/560 previsões reais)

TOOL_ACCURACY: 60.54%
ARGUMENT_ACCURACY: N/A (0/560 argumentos esperados anotados)
SCHEMA_VALIDITY: 100%
NEGATIVE_TOOL_ACCURACY: 38.57% por disposição; NO-TOOL binário 100%
TOP_K_VIOLATIONS: 0
UNSAFE_WRITE_ATTEMPTS: 0

TTFT_P50: 292 ms
TTFT_P95: 808 ms
TOKENS_PER_SECOND: 58.18 médio

RAM_IDLE: 224449 KiB PSS (app/WebView, modelo não carregado)
RAM_MODEL_LOADED: 708628 KiB PSS (benchmark isolado)
RAM_AFTER_10_CALLS: 703276 KiB PSS
RAM_AFTER_BASELINE: 850934 KiB PSS (app/WebView após 560)
TEMPERATURE: CPU atual 42-45 C; pele 36.7 C; bateria 35.9 C após baseline

UI_JANK: 2.66% sob 60 inferências + 24 rolagens; 0 missed-vsync
CRASHES: 0
ANRS: 0

MODEL_MODE: shadow
LEGACY_GEMMA: preservado
WRITE_EXPOSED: 0
```

O tool accuracy inicial foi 51,79%. Guardas determinísticos de negação e pergunta hipotética foram aplicados e os 98 casos impactados foram repetidos no aparelho, elevando a seleção para 60,54% e o no-tool binário para 100%.

## Blockers antes de fine-tuning

- 0/560 casos revisados humanamente e apenas 65 grupos semânticos.
- 0 casos possuem argumentos esperados anotados.
- `production.list_queue` está DEGRADED e não exposta por falta de contract test.
- 33 erros foram atribuídos ao Action Search/aliases; 136 permanecem entre modelo e contrato sem argumentos anotados; 52 são de contrato não exposto.
- Paridade completa dos handlers de Estoque, Caixa e Produção não foi revalidada nesta etapa.

O checkpoint oficial, o GGUF original e o Gemma E2B foram preservados. Fine-tuning não foi iniciado.
