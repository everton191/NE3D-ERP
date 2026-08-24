# Arquitetura operacional de IA v3

Fluxo alvo: contexto compacto da tela → busca determinística Top-K → modelo substituível → Action Registry → schema/permissão → pipeline de segurança → serviço de domínio → repository → armazenamento → envelope → renderer determinístico.

O modelo interpreta intenção e argumentos. Cálculo, IDs, permissão e regra pertencem ao código. READ comprovada pode executar; PREPARE nunca grava; WRITE exige operação preparada, confirmação vinculada ao hash/versão, idempotência e executor de domínio. O estado atual mantém WRITE fora do manifesto.

Fontes canônicas: `src/ai/action-registry.js`, `src/ai/capability-bundles.json` e artefatos em `generated/`. `ToolCallingModel` isola FunctionGemma/Needle/LFM/remote sem acoplar domínio.
