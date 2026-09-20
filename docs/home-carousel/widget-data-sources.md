# Widget Data Sources — Contratos Finais

Data: 2026-09-18 (fechamento)
Branch: `codex/melhorias-setembro-2026`
HEAD: `7e73f06ff4af8dabf593c691da1b1de2f624ac47`

## Visão Geral

8 widgets do carrossel 3D da Home. Cada widget consolida dados reais existentes
em funções puras de normalização. Nenhuma regra de negócio foi duplicada.

Arquivo de dados: `src/features/home/carousel3d/data/widget-data-sources.js`
Testes: `scripts/test-home-carousel-data.js` (146 PASS / 0 FAIL)

### Contrato de Snapshot

```js
{
  status: "ready" | "empty" | "error",
  updatedAt: "2026-09-18T...",  // ISO string
  data: { ... }                 // campos do widget
}
```

| Status | Significado |
|--------|-------------|
| `ready` | Dados válidos disponíveis (array não vazio) |
| `empty` | Fonte existe mas retornou vazio (array vazio, null, undefined) |
| `error` | Fonte temporariamente indisponível ou dados corrompidos |

---

## 1. PRODUCTION

```js
{
  status: "ready",
  updatedAt: "...",
  data: {
    inProgress: number,      // active + queue + externalPrints
    active: number,          // em_impressao + pausado + pos_processamento + controle_qualidade
    inQueue: number,         // liberado_para_producao + na_fila + proximo + aguardando_impressora
    pending: number,         // pendente + falhou + reimpressao_necessaria
    ready: number,           // pronto_para_entrega
    total: number,           // inProgress (se excludeFinalized) ou total
    blockedByMaterial: number // blockedReason === "aguardando_material"
  }
}
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | `productionJobs` (app.js:941) |
| Normalizador | `normalizeProductionSnapshot(jobs, options)` |
| Rota destino | `producao` |
| EMPTY | array vazio → `{ inProgress: 0, ... }` |
| ERROR | `{ error: true }` → `{ inProgress: 0, ... }` |

---

## 2. ORDERS_RECENT

```js
{
  status: "ready",
  updatedAt: "...",
  data: {
    orders: Array<{
      id: string,
      client: string,        // "Cliente" se vazio
      orderNumber: string,
      itemCount: number,
      deadline: string,      // raw, sem formatação
      total: number,
      status: string
    }>,
    total: number            // total de pedidos (não apenas os retornados)
  }
}
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | `pedidos` (app.js:938) |
| Normalizador | `normalizeOrdersRecentSnapshot(pedidos, options)` |
| Ordenação | `updatedAt` → `criadoEm` → `createdAt` → `data` → `Number(id)`, descendente |
| Limite | `options.limit` (default: 4) |
| Paridade Home | **PASS** — usa `clienteDoPedido()`, `totalPedido()`, `labelStatusPedido()` |
| Rota destino | `pedidos` |
| EMPTY | `{ orders: [], total: 0 }` |
| ERROR | `{ orders: [], total: 0 }` |

---

## 3. DAY_SUMMARY

```js
{
  status: "ready",
  updatedAt: "...",
  data: {
    faturamentoDia: number,    // R$ arredondado 2 casas
    lucroDiaEstimado: number,  // R$ arredondado 2 casas
    pedidosHoje: number
  }
}
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | `pedidos` (filtrados por `pedidoContaParaAnalytics()`) |
| Normalizador | `normalizeDaySummarySnapshot(pedidos, options)` |
| Paridade Home | **PASS** — exclusão idêntica: cancelado/orçamento/rascunho/deletados |
| Range | Meia-noite hoje → meia-noite amanhã (local) |
| Lucro | `max(0, total - soma(custoTotal dos itens))` — estimado |
| Rota destino | `caixa` (faturamento/lucro) ou `pedidos` (contagem) |
| EMPTY | `{ faturamentoDia: 0, lucroDiaEstimado: 0, pedidosHoje: 0 }` |
| ERROR | `{ faturamentoDia: 0, lucroDiaEstimado: 0, pedidosHoje: 0 }` |

---

## 4. CASH_TODAY

```js
{
  status: "ready",
  updatedAt: "...",
  data: {
    entradas: number,       // R$ arredondado 2 casas
    saidas: number,         // R$ arredondado 2 casas
    saldo: number,          // entradas - saidas
    cancelados: number,     // contagem de movimentos cancelados
    sessaoAberta: boolean
  }
}
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | `caixa` (app.js:937) via `getMovimentosCaixaDaConta()` |
| Normalizador | `normalizeCashTodaySnapshot(caixaMovimentos, options)` |
| Filtro | Movimentos do dia corrente (meia-noite → meia-noite) |
| Sessão | `options.session` → `session.status === "open"` |

### Contrato semântico (decisão desta fase)

`calcularTotaisCaixa()` (app.js:8928) retorna **lifetime total** — sem filtro de período.
`calcularTotaisCaixaPeriodo(start, end)` (app.js:23392) filtra por período.

O card se chama **"Caixa hoje"**. Portanto o normalizador filtra por hoje.
**Isto NÃO é paridade com a Home** — é comportamento específico do card.

| Diferença | Home atual | Card carrossel |
|-----------|-----------|----------------|
| `calcularTotaisCaixa()` | Lifetime (sem filtro) | — |
| `normalizeCashTodaySnapshot()` | — | Filtra por hoje |

| Rota destino | `caixa` |
| EMPTY | `{ entradas: 0, saidas: 0, saldo: 0, cancelados: 0, sessaoAberta: false }` |
| ERROR | `{ entradas: 0, saidas: 0, saldo: 0, cancelados: 0, sessaoAberta: false }` |

---

## 5. STOCK

```js
{
  status: "ready",
  updatedAt: "...",
  data: {
    total: number,
    critical: number,
    low: number,
    normal: number,
    alertCount: number,      // critical + low
    alertItems: Array<{
      id: string,
      name: string,
      quantity: number,
      unit: string,
      status: "critical" | "low"
    }>
  }
}
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | `estoque` (app.js:936) via `normalizarMaterialEstoque()` |
| Normalizador | `normalizeStockSnapshot(materiais, options)` |
| Regra | Usa `stock_status` já computado por `resolverStatusEstoque()` |
| Threshold | Absoluto: `estoqueMinimo` / Percentual: 30% (low), 10% (critical) |
| Rota destino | `estoque` |
| EMPTY | `{ total: 0, critical: 0, low: 0, normal: 0, alertCount: 0, alertItems: [] }` |
| ERROR | `{ total: 0, critical: 0, low: 0, normal: 0, alertCount: 0, alertItems: [] }` |

---

## 6. CUSTOMERS

```js
{
  status: "ready",
  updatedAt: "...",
  data: {
    uniqueCustomers: number,
    totalOrders: number,
    openOrders: number
  }
}
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | `pedidos` (derivado, não armazenado separadamente) |
| Normalizador | `normalizeCustomersSnapshot(pedidos, options)` |
| Chave unicidade | Nome do cliente (`pedido.cliente \|\| pedido.nome`), com `.trim()` |

### LIMITAÇÃO DOCUMENTADA

A chave de unicidade é o **nome do cliente** (string raw com `.trim()`).
Não existe `customer_id` no fluxo operacional. Dois clientes com o mesmo
nome são contados como um só. Esta limitação é herdada do sistema atual
(`renderClientesOperacionais` linha 29766, `getDashboardStats` linha 23291).

Métricas que NÃO existem (não inventar):
- Aniversário / data de nascimento
- Fidelidade / pontos
- Taxa de retorno
- Novo vs recorrente
- Data de cadastro (operacional)
- Segmentação RFM
- Lifetime value

| Rota destino | `clientes` |
| EMPTY | `{ uniqueCustomers: 0, totalOrders: 0, openOrders: 0 }` |
| ERROR | `{ uniqueCustomers: 0, totalOrders: 0, openOrders: 0 }` |

---

## 7. STOREFRONT

```js
{
  status: "ready",
  updatedAt: "...",
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

| Propriedade | Valor |
|-------------|-------|
| Fonte | `getStorefrontAdminViewModel()` (app.js:18255) |
| Normalizador | `normalizeStorefrontSnapshot(storefrontData, options)` |
| targetScreen | `"lojaOnline"` |

### Decisão: targetScreen = "lojaOnline"

| screenId | Componente | Mobile | Propósito |
|----------|-----------|--------|-----------|
| `lojaOnline` | `renderLojaOnlineHub` | **Sim** | Admin hub/dashboard — overview, stats, QR code |
| `lojaAdmin` | `renderStorefrontAdminPanel` | Não | Editor de produtos/publicação (desktop) |
| `lojaPublica` | `renderLojaOnlinePublica` | Sim | Loja pública (clientes, sem auth) |

`lojaOnline` é o destino correto porque:
1. É o hub admin que mostra métricas (visitas, leads, produtos)
2. Funciona em mobile (obrigatório para o carrossel)
3. É o que o próprio dashboard usa (`trocarTela('lojaOnline')`)

| EMPTY | `{ active: false, publishedProducts: 0, ..., targetScreen: "lojaOnline" }` |
| ERROR | `{ active: false, publishedProducts: 0, ..., targetScreen: "lojaOnline" }` |

---

## 8. ALERTS

```js
{
  status: "ready" | "empty",
  updatedAt: "...",
  data: {
    alerts: Array<{
      type: string,
      severity: "warning" | "danger" | "info",
      title: string,
      summary: string,
      targetScreen: string | null,
      entityId: string       // opcional
    }>,
    count: number
  }
}
```

### Tipos de alerta e targetScreen

| # | type | severity | Condição | targetScreen |
|---|------|----------|----------|--------------|
| 1 | `order_overdue` | warning | `pedido.prazo < now` e não terminal | `"pedidos"` |
| 2 | `production_stopped` | warning | status em [pausado, falhou, reimpressao_necessaria, pendente] | `"producao"` |
| 3 | `production_material` | warning | `blockedReason === "aguardando_material"` | `"estoque"` |
| 4 | `stock_critical` | danger | `stock_status === "critical"` | `"estoque"` |
| 5 | `cash_no_session` | warning | `!session && caixa.length > 0` | `"caixa"` |

Todos os targetScreen são screenIds reais verificados em `UI_SCREEN_RELATIONS` e `NAVIGATION_AUDIT_REGISTRY`.

| EMPTY |nenhum alerta ativo → `{ alerts: [], count: 0 }` com `status: "empty"` |
| ERROR | `{ alerts: [], count: 0 }` com `status: "error"` |

---

## Dados Que Não Existem Ainda

Fiscal, contas a pagar/receber, compras, frete, CRM, qualidade, manutenção.

---

## Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `src/features/home/carousel3d/data/widget-data-sources.js` | Normalizadores puros (8 widgets) |
| `scripts/test-home-carousel-data.js` | 146 testes de validação |
| `docs/home-carousel/widget-data-sources.md` | Este documento |

## Arquivos Alterados

Nenhum. Apenas leitura de `app.js` para auditoria.

## Arquivos do Hermes alterados

0

## Home alterada

NÃO

## Regras de negócio duplicadas

0
