# Tool Registry

O modelo não chama funções arbitrárias. Toda operação precisa estar registrada com nome, tipo, schema, adapter e estado testado.

Tools ligadas no Simplifica:

- `HOME.SUMMARY` → resumo da Home;
- `ORDER.SEARCH` e `ORDER.HISTORY` → pedidos;
- `CUSTOMER.SEARCH` → clientes;
- `STOCK.SEARCH` e `STOCK.SUMMARY` → estoque;
- `CASH.SUMMARY` → caixa;
- `PRICE.CALCULATE` → domínio da calculadora.

`READ`, `NAVIGATION` e `CALCULATE` podem executar quando o manifest, a permissão e os parâmetros permitem. Tools desconhecidas, schemas inválidos e operações sem adapter são bloqueadas.

`WRITE` segue outra fronteira: interpretação → preparação → validação do domínio → resumo → confirmação explícita → executor determinístico. A IA nunca calcula preço por conta própria, nunca salva pedido diretamente e nunca recebe autorização implícita por ter produzido um JSON válido.

Resultados usam estados `SUCCESS`, `AMBIGUOUS`, `NOT_FOUND`, `INVALID`, `BLOCKED` e `FAILURE`, convertidos em mensagens e cards amigáveis.
