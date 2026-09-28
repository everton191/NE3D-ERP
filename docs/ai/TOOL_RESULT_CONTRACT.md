# Contrato de resultado de Tool

Este lote não migra handlers existentes. Novas integrações devem normalizar seus resultados para:

```json
{ "ok": true, "data": {}, "error": null, "errorCode": null, "meta": {} }
```

- `ok`: sucesso operacional, não confiança de modelo.
- `data`: payload pequeno e já autorizado para a tool.
- `error` e `errorCode`: motivo seguro para falhas.
- `meta`: IDs de rastreio, origem e dados de paginação; não inclui registros completos ou segredo.

O envelope não autoriza WRITE e não substitui as proteções de `operation-safety.js`.
