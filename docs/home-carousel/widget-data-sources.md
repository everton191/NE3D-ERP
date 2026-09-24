# Esboço — Widget Data Sources (8 Widgets)

> Esboço técnico baseado no código real de `widget-data-sources.js`.
> Não é implementação. Atualizado em 2026-09-21.

---

## 1. Production — DataSource

```javascript
function normalizeProductionSnapshot(productionJobs, options) {
  // productionJobs: array de jobs de produção (raw do sistema)
  // options: { error?, excludeFinalized?, externalPrints? }
  // → retorna snapshot para o widget "production"
}
```

### Entrada
- `productionJobs` — array de jobs com campos: `status`, `blockedReason`/`blocked_reason`
- `options.error` — se true, retorna snapshot de erro
- `options.excludeFinalized` — se true (default), exclui jobs finalizados do total

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    inProgress: number,    // active + queue + externalPrints.length
    active: number,        // em_impressao + pausado + pos_processamento + controle_qualidade
    inQueue: number,       // liberado_para_producao + na_fila + proximo + aguardando_impressora
    pending: number,       // pendente + falhou + reimpressao_necessaria
    ready: number,         // pronto_para_entrega
    total: number,         // inProgress (se excludeFinalized) ou jobs.length
    blockedByMaterial: number // jobs com blockedReason === "aguardando_material"
  }
}
```

### Status dos jobs

| Status | Categoria |
|---|---|
| `em_impressao`, `pausado`, `pos_processamento`, `controle_qualidade` | active |
| `liberado_para_producao`, `na_fila`, `proximo`, `aguardando_impressora` | queue |
| `pendente`, `falhou`, `reimpressao_necessaria` | pending |
| `pronto_para_entrega` | ready |

### Lógica
- Se `options?.error` → snapshot de erro com todos os campos em 0
- Se `productionJobs.length === 0` → snapshot de empty
- Filtra jobs por status para cada categoria
- `blockedByMaterial` conta jobs onde `safeString(blockedReason || blocked_reason) === "aguardando_material"`
- `total` é `inProgress` se `excludeFinalized !== false`, senão `jobs.length`

---

## 2. Orders Recent — DataSource

```javascript
function normalizeOrdersRecentSnapshot(pedidos, options) {
  // pedidos: array de pedidos (raw do sistema)
  // options: { error?, limit? }
  // → retorna snapshot para o widget "orders_recent"
}
```

### Entrada
- `pedidos` — array de pedidos com campos: `id`, `cliente`/`nome`, `numeroPedido`/`numero_pedido`,
  `itens`, `prazo`/`dataPrazo`/`data`, `total`/`valor`/`totalPedido`, `status`
- `options.limit` — max itens a retornar (default: 4)

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    orders: [
      {
        id: string,
        client: string,        // "Cliente" se vazio
        orderNumber: string,
        itemCount: number,     // itens.length
        deadline: string,      // raw, sem formatação
        total: number,
        status: string
      }
    ],
    total: number            // total de pedidos (não apenas os retornados)
  }
}
```

### Lógica
- Ordenação por data (updatedAt → criadoEm → createdAt → data → Number(id)), descendente
- `limit` itens mais recentes
- `total` = `pedidos.length` (todos os pedidos, não apenas os recentes)
- `client` = `pedido.cliente || pedido.nome || "Cliente"`
- `deadline` = `pedido.prazo || pedido.dataPrazo || pedido.data || ""`

---

## 3. Day Summary — DataSource

```javascript
function normalizeDaySummarySnapshot(pedidos, options) {
  // pedidos: array de pedidos (raw)
  // options: { error? }
  // → retorna snapshot para o widget "day_summary"
}
```

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    faturamentoDia: number,    // R$ arredondado 2 casas
    lucroDiaEstimado: number,  // R$ arredondado 2 casas
    pedidosHoje: number
  }
}
```

### Lógica
- Filtra pedidos pelo período de hoje (meia-noite até meia-noite amanhã, local)
- Exclui: cancelados, orçamentos, rascunhos, deletados
- `faturamentoDia` = soma dos totais dos pedidos de hoje
- `lucroDiaEstimado` = soma de `max(0, total - soma(custoTotal dos itens))` para cada pedido
- `pedidosHoje` = count de pedidos de hoje

---

## 4. Cash Today — DataSource

```javascript
function normalizeCashTodaySnapshot(caixaMovimentos, options) {
  // caixaMovimentos: array de movimentos de caixa
  // options: { error?, session? }
  // → retorna snapshot para o widget "cash_today"
}
```

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    entradas: number,       // R$ arredondado 2 casas
    saidas: number,         // R$ arredondado 2 casas
    saldo: number,          // entradas - saidas
    cancelados: number,     // count de movimentos cancelados
    sessaoAberta: boolean   // options.session?.status === "open"
  }
}
```

### Lógica
- Filtra movimentos pelo período de hoje
- `sessaoAberta` = `options.session?.status === "open"`
- Ignora movimentos cancelados no cálculo de entradas/saidas (mas conta em `cancelados`)
- Arredonda valores para 2 casas decimais

---

## 5. Stock — DataSource

```javascript
function normalizeStockSnapshot(materiais, options) {
  // materiais: array de materiais de estoque
  // options: { error?, resolveStatus? }
  // → retorna snapshot para o widget "stock"
}
```

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    total: number,
    critical: number,
    low: number,
    normal: number,
    alertCount: number,      // critical + low
    alertItems: [
      {
        id: string,
        name: string,
        quantity: number,
        unit: string,
        status: "critical" | "low"
      }
    ]
  }
}
```

### Lógica
- Usa `options.resolveStatus(m)` se disponível, senão `m.stock_status || "normal"`
- Thresholds:
  - `critical`: `estoqueMinimo` alcançado ou < 10% do original
  - `low`: < 30% do original
  - `normal`: acima dos thresholds
- `alertItems` = materiais com status critical ou low, ordenados (critical primeiro)

---

## 6. Customers — DataSource

```javascript
function normalizeCustomersSnapshot(pedidos, options) {
  // pedidos: array de pedidos (raw)
  // options: { error? }
  // → retorna snapshot para o widget "customers"
}
```

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    uniqueCustomers: number,  // count de nomes únicos
    totalOrders: number,       // total de pedidos (todos)
    openOrders: number         // pedidos não terminal dos clientes únicos
  }
}
```

### Lógica
- Chave de unicidade: `pedido.cliente || pedido.nome`, com `.trim()`
- Agrupa por nome: conta pedidos, soma total, conta abertos
- `uniqueCustomers` = tamanho do mapa
- `openOrders` = soma de `abertos` de cada cliente (pedidos não terminal: não "entregue", "pago", "finalizado", "cancelado")

### Limitação documentada
> A chave de unicidade é o **nome do cliente** (string raw com `.trim()`).
> Não existe `customer_id` no fluxo operacional. Dois clientes com o mesmo nome são
> contados como um só. Esta limitação é herdada do sistema atual.

---

## 7. Storefront — DataSource

```javascript
function normalizeStorefrontSnapshot(storefrontData, options) {
  // storefrontData: objeto do storefront admin (raw)
  // options: {}
  // → retorna snapshot para o widget "storefront"
}
```

### Saída (Snapshot)
```javascript
{
  status: "ready",
  updatedAt: new Date().toISOString(),
  data: {
    active: boolean,
    publishedProducts: number,
    totalProducts: number,
    visits: number,          // eventos store_view (lifetime)
    newLeads: number,        // leads com status "novo"
    totalLeads: number,
    targetScreen: "lojaOnline"
  }
}
```

### Lógica
- `targetScreen` é sempre `"lojaOnline"` (hub admin mobile-enabled)
- `active` vem do dado cru
- Todos os demais campos são derivados do `storefrontData`

---

## 8. Alerts — DataSource

```javascript
function normalizeAlertsSnapshot(options) {
  // options: { error? }
  // → retorna snapshot para o widget "alerts"
}
```

### Saída (Snapshot)
```javascript
{
  status: "ready" | "empty",
  updatedAt: new Date().toISOString(),
  data: {
    alerts: [
      {
        type: "order_overdue" | "production_stopped" | "production_material" | "stock_critical" | "cash_no_session",
        severity: "warning" | "danger" | "info",
        title: string,
        summary: string,
        targetScreen: "pedidos" | "producao" | "estoque" | "caixa" | null,
        entityId: string | null
      }
    ],
    count: number
  }
}
```

### Tipos de alerta

| # | type | severity | Condição | targetScreen |
|---|---|---|---|---|
| 1 | `order_overdue` | warning | `pedido.prazo < now` e não terminal | `"pedidos"` |
| 2 | `production_stopped` | warning | status em [pausado, falhou, reimpressao_necessaria, pendente] | `"producao"` |
| 3 | `production_material` | warning | `blockedReason === "aguardando_material"` | `"estoque"` |
| 4 | `stock_critical` | danger | `stock_status === "critical"` | `"estoque"` |
| 5 | `cash_no_session` | warning | `!session && caixa.length > 0` | `"caixa"` |

### Lógica
- Se nenhum alerta ativo → `status: "empty"`, `alerts: []`, `count: 0`
- Se erro → `status: "error"`, `alerts: []`, `count: 0`

---

---

## Contexto do app.js — como usar este documento

> **Tratamento contextual:** app.js é o consumidor deste esboço — trata-se de "quasi-3rd party" na leitura deste documento. Este documento descreve o que os data sources esperam de app.js, não como app.js é implementado.

### O que app.js faz com este documento

| Responsabilidade | O que app.js faz | O que os data sources esperam |
|---|---|---|
| **Fornecer dados brutos de cada widget** | App.js busca os dados do sistema (productionJobs, pedidos, caixa, materiais, storefront, etc.) e os passa para os normalizadores | Cada `normalizeXxxSnapshot(data, options)` recebe um array ou objeto raw e retorna um snapshot puro |
| **Passar options relevantes** | App.js decide quais options passar para cada normalizador (ex: `session` para cash_today, `error` para todos, `resolveStatus` para stock) | Os normalizadores usam as options para decidir o comportamento (status de erro, sessão aberta, resolver status de material) |
| **Tratar erros de fonte** | Se uma fonte de dados está indisponível, app.js pode passar `options.error = true` para que o snapshot retorne erro | O normalizador retorna um snapshot com `status: "error"` e dados zerados quando `options.error` é true |
| **Atualizar dados periodicamente** | App.js chama os normalizadores com dados frescos quando o carrossel é atualizado (refresh) | Os normalizadores são stateless — cada chamada é independente e retorna um snapshot novo |

### O que NÃO é responsabilidade de app.js neste documento

| O que os data sources fazem sozinhos | Detalhe |
|---|---|
| Normalizar dados para o formato do snapshot | Cada função filtra, ordena, agrupa e formata os dados brutos |
| Calcular métricas derivadas | `faturamentoDia`, `lucroDiaEstimado`, `entradas`, `saidas`, `alertCount` são calculados pelos normalizadores |
| Definir status de cada widget | `ready`/`empty`/`error` é decidido pelo normalizador com base nos dados e options |
| Filtrar por período (hoje) | `daySummary` e `cashToday` filtram pelo período de hoje (meia-noite → meia-noite) |
| Grupar clientes por nome | `customers` agrupa pedidos por nome de cliente e conta pedidos abertos |

### Como usar este documento

1. **Para integrar os data sources no carrossel** — use este documento para entender cada normalizador e seus parâmetros
2. **Para testar os data sources** — cada normalizador pode ser testado passando dados mockados e verificando o snapshot resultante
3. **Para estender os data sources** — siga o padrão: funções puras, sem DOM, sem acesso a app.js ou Supabase
4. **Para revisar** — confirme que um novo widget não introduz efeitos colaterais, acesso a storage, ou dependência de app.js

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento descreve o contrato que app.js consome, sem depender de como app.js é implementado internamente.
