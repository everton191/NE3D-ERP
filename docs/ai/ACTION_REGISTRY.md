# Action Registry

O catálogo possui 28 contratos v1 em sete domínios prioritários. IDs usam `<domain>.<verb>`. `npm run ai:validate-actions` verifica nome, schema, validator, permissão, handler/UseCase oficial, teste, confirmação e idempotência. Apenas estado `READY` com `exposedToModel=true` é exportado pelo manifesto compacto.

Não editar manifest/health manualmente: execute `npm run ai:generate-artifacts`. Registries anteriores permanecem durante migração, mas não são novas fontes de definição.
