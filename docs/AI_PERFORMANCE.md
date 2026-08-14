# Performance e lifecycle da IA

## Auditável hoje

`load()` do plugin agenda `ensure_model` em single-thread executor, portanto não bloqueia diretamente a thread principal. Abrir o chat consulta status e pode iniciar preparação. A geração ocorre no mesmo executor. Não há métricas de cold start, prewarm, tokens/s, memória, temperatura, GPU, unload ou timeout neste checkout.

## Riscos

Provider externo controla lifecycle; `load()` pode disparar download/preparo cedo; não há cancelamento; tamanho/modelo não são verificáveis; o app não diferencia formalmente `AI_CORE_READY` e `LLM_READY`.

## Gate futuro

Medir abertura do app com/sem modelo, tempo até core ready, load e primeiro token, tokens/s, pico de RAM/VRAM, tamanho/hash, backend real, timeout/cancelamento e liberação. Meta funcional: ERP abre sem modelo; core inicia sem inferência; modelo carrega lazy/background; falha degrada somente o chat.
