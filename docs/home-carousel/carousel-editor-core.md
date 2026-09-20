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

## Pendencias

- Integracao widget-model -> renderer
- UI visual do Editor
- Persistencia real (localStorage/appConfig)
- Integracao com Home
