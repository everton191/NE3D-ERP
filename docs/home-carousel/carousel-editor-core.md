# Carousel Editor Core

Operacoes puras para editar o carrossel da Home.

## Principio

**EDITAR CARD nao significa EDITAR FUNCAO DO ERP.**

Se o usuario remove `orders_recent`, somente o card desaparece do carrossel. A funcionalidade de pedidos continua disponivel via:
- rota `/pedidos`
- renderer
- menu
- dock
- IA
- permissoes

## Arquitetura

```
REGISTRY -> EDITOR -> PREFERENCES -> WIDGET STATE
                |
                v
        [ UI do Editor (futuro) ]
```

## Estado

```js
{
  visibleCardIds: ["production", "orders_recent", ...],
  cardOrder: ["production", "orders_recent", ...],
  autoplay: true,
  autoplayInterval: 15000  // 3000 a 60000
}
```

## Operacoes

| Operacao | Descricao | Return |
|----------|-----------|--------|
| `addCard(id)` | Adiciona card disponivel | boolean |
| `removeCard(id)` | Remove card do carrossel | boolean |
| `moveCard(id, dir)` | Move card up(-1)/down(1) | boolean |
| `moveCardToIndex(id, index)` | Move card to an exact visible index | boolean |
| `restoreDefaults()` | Restaura config padrao | boolean |
| `setAutoplay(on)` | Liga/desliga autoplay | boolean |
| `setAutoplayInterval(ms)` | Define intervalo | boolean |
| `getState()` | Snapshot do estado | object |
| `canAdd(id)` | Verifica se pode adicionar | boolean |

## Regras

1. **future=true bloqueado**: Cards futuros (fiscal, accounts_payable, etc.) nao podem ser ativados
2. **available=false bloqueado**: Cards indisponiveis nao podem ser adicionados
3. **ID invalido rejeitado**: IDs inexistentes no registry sao rejeitados
4. **Sem duplicacao**: Nao e possivel adicionar um card ja visivel
5. **Sem acesso DOM**: Operacoes sao puras, sem efeitos colaterais
6. **Sem acesso Supabase**: Nao acessa banco de dados
7. **Sem acesso app.js**: Nao importa modulo principal

## Cards Futuros (bloqueados)

```
fiscal, accounts_payable, accounts_receivable, purchases,
shipping, crm, quality, maintenance
```

## Persistencia

Interface abstrata com implementacao em memoria:

```js
var persistence = E.createMemoryPersistence(initialState);

persistence.save(state);    // salva
persistence.load();         // carrega
persistence.clear();        // limpa
```

The adapter also exposes `loadPreferences()` and `savePreferences()` for the future integration boundary.

**Nao integra localStorage/appConfig** — persistencia real sera integrada depois.

## API

```js
var E = require("./carousel-editor-core");

// Criar editor com estado padrao
var editor = E.createEditor(null, registry);

// Ou com estado inicial
var editor = E.createEditor({
  visibleCardIds: ["production", "orders_recent"],
  cardOrder: ["production", "orders_recent"],
  autoplay: true,
  autoplayInterval: 15000
}, registry);

// Operacoes
editor.addCard("stock");
editor.removeCard("production");
editor.moveCard("stock", -1);
editor.moveCardToIndex("stock", 0);
editor.setAutoplay(false);
editor.setAutoplayInterval(10000);
editor.restoreDefaults();

// Estado atual
var state = editor.getState();
```

## Constantes

```js
E.MIN_INTERVAL    // 3000 (3 segundos)
E.MAX_INTERVAL    // 60000 (60 segundos)
E.DEFAULT_INTERVAL // 15000 (15 segundos)
```

## Testes

```bash
node scripts/test-home-carousel-editor-core.js
```

Resultado: 79 PASS / 0 FAIL (A-T: 20 categorias)

## Contexto do app.js — como usar este documento

> **Tratamento contextual:** app.js é o consumidor deste documento — trata-se de "quasi-3rd party" na leitura deste documento. Este documento descreve o que o editor core espera de app.js, não como app.js é implementado.

### O que app.js faz com este documento

| Responsabilidade | O que app.js faz | O que o editor core espera |
|---|---|---|
| **Fornecer o registry** | Passa o registry atualizado (com os cards ativos e futuros) para o editor core | `createEditor(initialState, registry)` recebe o registry completo |
| **Gerenciar estado do editor** | Quando o usuário edita o carrossel (adiciona/removes/move cards, altera autoplay), app.js lê o estado e o persiste | `editor.getState()` retorna o estado atual para app.js salvar |
| **Persistir configurações** | Salva as alterações do editor (visível cards, order, autoplay, interval) no storage apropriado | app.js é o owner da persistence — o editor core não acessa storage |
| **Validar operações** | Antes de chamar as operações do editor, app.js pode validar se o usuário tem permissão | O editor core valida regras técnicas (future=true, available=false, duplicação) mas não permissões de usuário |
| **Inicializar o editor** | Cria o editor com o estado inicial (pode ser vazio ou carregado do storage) | `createEditor(initialState, registry)` cria o editor com ou sem estado inicial |

### O que NÃO é responsabilidade de app.js neste documento

| O que o editor core faz sozinho | Detalhe |
|---|---|
| Validar se um card pode ser adicionado | `canAdd(id)` verifica: future=false, available=true, não duplicado |
| Validar se um ID existe no registry | `addCard/removeCard/moveCard` verificam se o ID é válido no registry fornecido |
| Gerenciar intervalo de autoplay | `setAutoplayInterval(ms)` clampa entre MIN_INTERVAL (3000) e MAX_INTERVAL (60000) |
| Restaurar defaults | `restoreDefaults()` restaura a configuração padrão do registry |
| Exportar constantes de intervalo | `E.MIN_INTERVAL`, `E.MAX_INTERVAL`, `E.DEFAULT_INTERVAL` |

### Como usar este documento

1. **Para integrar o editor na Home** — use este documento para entender as operações disponíveis e o contrato `createEditor()` / `getState()`
2. **Para testar o editor core** — os testes podem criar um registry mockado e verificar cada operação isoladamente
3. **Para estender o editor** — siga o padrão: funções puras, sem DOM, sem acesso a Supabase ou app.js
4. **Para revisar** — confirme que uma nova operação não introduz efeitos colaterais, acesso a storage, ou dependência de app.js

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento descreve o contrato que app.js consome, sem depender de como app.js é implementado internamente.
