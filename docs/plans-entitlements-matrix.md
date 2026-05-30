# Matriz de Planos

| Funcionalidade | Free | Start | Pro |
| --- | --- | --- | --- |
| Preco | R$ 0,00 | R$ 29,90/mes | R$ 59,90/mes |
| Calculadora | Sim | Sim | Sim |
| Pedidos | 5/dia + 5 com anuncio opcional | Ilimitado | Ilimitado |
| Clientes | Sim | Sim | Sim |
| Estoque | Basico | Basico | Completo |
| Caixa | Simples | Simples | Avancado |
| PDF | Basico | Basico | Completo |
| WhatsApp/orcamento | Basico | Basico | Completo |
| Loja editavel | Sim | Sim | Sim |
| Preview da loja | Sim | Sim | Sim |
| Publicacao da loja | Nao | Sim | Sim |
| Link compartilhavel | Nao | Sim | Sim |
| Produtos da loja | Ate 25 | Ate 300 | Ilimitado |
| Categorias | Basicas | Basicas | Premium |
| Personalizacao | Preview simples | Basica | Premium completa |
| Relatorios | Basico | Basico | Avancado |
| Backup | 50 MB | 256 MB | 1 GB |
| Funcionarios | Nao | Nao | Sim |
| Multiusuario | Nao | Nao | Sim |
| Permissoes avancadas | Nao | Nao | Sim |
| Anuncios | Sim, apenas no Free | Nao | Nao |
| IA futura | Desligada | Desligada | Desligada |
| Google futuro | Desligado | Desligado | Desligado |

## Regras de seguranca

- O Free pode editar e visualizar a loja, mas nao publicar nem compartilhar link publico funcional.
- O Start libera publicacao e link publico, mas nao recebe recursos premium do Pro.
- O Pro preserva acesso premium atual e nao deve ser reduzido por causa da entrada do Start.
- Na duvida, manter recurso bloqueado no Start ate decisao explicita.

## Fase 5C.1

Os IDs comerciais Start e Pro foram configurados no backend, mas a matriz nao muda para o usuario final enquanto `START_PLAN_ENABLED=false`.

- Free continua editando loja sem publicar.
- Start permanece preparado para publicar loja e compartilhar link apos ativacao controlada.
- Pro continua premium e preservado.
