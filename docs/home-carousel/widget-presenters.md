# Widget Presenters

Camada pura de transformacao entre **snapshots** (data layer) e **view models** (renderer).

## Arquitetura

```
Hermes --> Data Sources (snapshots) --> Presenters (view models) --> Renderer (3D)
```

Cada presenter recebe um snapshot pronto e retorna um **ViewModel pequeno e previsivel** para o renderer.

## Contrato

### Input (Snapshot)

```js
{
  status: "ready" | "empty" | "error" | "loading",
  updatedAt: ISO string,
  data: { ... }
}
```

### Output (ViewModel)

```js
{
  id: "production",           // identificador do card
  title: "Producao",         // titulo amigavel
  state: "ready",             // ready | empty | error | loading
  primaryMetric: {
    value: 5,
    label: "em producao",
    formatted: "5"
  },
  secondaryMetrics: [
    { value: 3, label: "na fila", formatted: "3" }
  ],
  items: [],                  // maximo 3 para orders/stock/alerts
  badge: { text: "Aberto", tone: "success" },
  targetScreen: "producao",  // navegacao ao tocar no card
  animationKey: "production-flow",  // animacao 3D
  visualState: "working"     // estado visual para o renderer
}
```

## Visual States

| Estado | Descricao |
|--------|-----------|
| `loading` | Dados ainda carregando |
| `ready` | Dados validos disponiveis |
| `empty` | Fonte existe mas retornou vazio |
| `error` | Fonte temporariamente indisponivel |

### Visual States por Widget

| Widget | Possiveis visualStates |
|--------|----------------------|
| production | `working`, `queue`, `ready-state`, `idle` |
| orders_recent | `has-orders`, `empty` |
| day_summary | `active`, `idle` |
| cash_today | `open`, `closed` |
| stock | `critical`, `low`, `normal` |
| customers | `active`, `empty` |
| storefront | `active`, `inactive` |
| alerts | `has-alerts`, `clear` |

## Animation Keys

| Widget | animationKey |
|--------|-------------|
| production | `production-flow` |
| orders_recent | `order-stack` |
| day_summary | `metric-bars` |
| cash_today | `cash-flow` |
| stock | `stock-level` |
| customers | `customer-cards` |
| storefront | `storefront-showcase` |
| alerts | `alert-pulse` |

## Regras

1. **Funcoes puras** — sem DOM, sem Canvas, sem WebGL
2. **Nao mutam** o snapshot de entrada
3. **Nao recalcram** regra de negocio
4. **Formatacao visual** apenas (currency, integer, label)
5. **Maximo 3 itens** para orders_recent, stock alertItems, alerts
6. **targetScreen** preservado do normalizer (exceto alerts = null)

## API

```js
var P = require("./widget-presenters");

// Todos aceitam 4 status:
var vm1 = P.presentProduction(snapshotReady);
var vm2 = P.presentProduction(snapshotEmpty);
var vm3 = P.presentProduction(snapshotError);
var vm4 = P.presentProduction(snapshotLoading);

// null tambem trata como loading:
var vm5 = P.presentProduction(null);
```

## Testes

```bash
node scripts/test-home-carousel-presenters.js
```

Resultado: 161 PASS / 0 FAIL (A-P: 16 categorias)

## Contexto do app.js — como usar este documento

> **Tratamento contextual:** app.js é o consumidor deste documento — trata-se de "quasi-3rd party" na leitura deste documento. Este documento descreve o que os presenters esperam de app.js, não como app.js é implementado.

### O que app.js faz com este documento

| Responsabilidade | O que app.js faz | O que os presenters esperam |
|---|---|---|
| **Fornecer os snapshots** | App.js chama os data sources para obter snapshots, e depois passa cada snapshot para o presenter correspondente | Cada `presentXxx(snapshot)` recebe um snapshot pronto e retorna um ViewModel |
| **Gerenciar o fluxo de dados** | App.js é o orchestrator: dados brutos → data source → snapshot → presenter → ViewModel | Os presenters são stateless — cada chamada é independente e retorna um ViewModel novo |
| **Passar null para estados de loading** | Quando os dados ainda não estão prontos, app.js pode passar `null` para os presenters (o presenter trata como loading) | `presentXxx(null)` retorna um ViewModel de loading para todos os widgets |
| **Lidar com erros de fonte** | Se uma fonte de dados falhou, app.js pode passar um snapshot com `status: "error"` para o presenter | O presenter retorna um ViewModel de error quando `snapshot.status === "error"` |

### O que NÃO é responsabilidade de app.js neste documento

| O que os presenters fazem sozinhos | Detalhe |
|---|---|
| Transformar snapshot em ViewModel | Cada `presentXxx()` mapeia os dados do snapshot para o formato do ViewModel |
| Formatar valores | `formatCurrency()`, `formatInteger()` são usados pelos presenters para formatar valores |
| Definir visualState | Cada presenter define `visualState` baseado no estado e dados do snapshot |
| Limit aridade de itens | `orders_recent`, `stock` e `alerts` limitam a 3 itens no ViewModel |
| Preservar targetScreen | O `targetScreen` vem do snapshot (exceto alerts, que é null) |

### Como usar este documento

1. **Para integrar os presenters no carrossel** — use este documento para entender cada presenter e seu ViewModel resultante
2. **Para testar os presenters** — cada presenter pode ser testado passando snapshots mockados (ready, empty, error, loading) e verificando o ViewModel resultante
3. **Para estender os presenters** — siga o padrão: funções puras, sem DOM, sem Canvas, sem WebGL, sem mutação do snapshot
4. **Para revisar** — confirme que um novo presenter não introduz efeitos colaterais, acesso a DOM, ou dependência de app.js

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento descreve o contrato que app.js consome, sem depender de como app.js é implementado internamente.