# Dataset de avaliação

`training/functiongemma/evaluation.v1.jsonl` contém 560 casos PT-BR (80 por domínio), gerados por `npm run ai:generate-evaluation`. Inclui ação/argumentos, ambiguidade, dados faltantes, negação, pergunta, fora do domínio, erros de digitação, linguagem informal, multi-turn curto, referência contextual e negative tool calling.

Os splits são `train_candidate`, `validation` e `test_frozen`. O arquivo é avaliação arquitetural; nenhum modelo foi baixado ou treinado. Antes de fine-tuning, revisar/ampliar manualmente diversidade e congelar hash do teste final.
