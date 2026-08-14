# Contexto e memória

O `ContextManager` mantém um snapshot controlado da tela atual:

- `screen`, `routeId` e rota;
- referências explícitas de entidades;
- capacidades de leitura, navegação e escrita;
- data da última atualização.

Trocar de tela atualiza o contexto, mas não apaga a conversa. Remover um chip elimina apenas aquela referência de entidade.

A memória da conversa é separada por aplicativo e conta. Ela preserva mensagens, fatos, correções e resumo compacto. Uma nova conversa cria outro identificador e limpa apenas o estado da assistente; pedidos, clientes, estoque e caixa não são apagados.

Regras:

- o contexto enviado ao modelo é limitado e serializável;
- anexos ficam fora do texto e usam IDs privados;
- mensagens persistidas têm tamanho e quantidade limitados;
- correções mais recentes substituem fatos anteriores conflitantes;
- dados de um pack não entram no namespace de outro;
- o contexto de referência é 8192, sujeito ao runtime realmente ativo.
