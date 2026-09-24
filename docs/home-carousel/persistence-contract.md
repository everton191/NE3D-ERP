# Contract de Persistência — Home Carousel

> Contrato conceitual. Não é implementação de storage real.
> Define estrutura, defaults, migration e recovery.

**Data:** 2026-09-21

---

## 1. Estrutura do Estado Persistido

```json
{
  "schemaVersion": 1,
  "activeWidgetIds": ["production", "orders_recent", "day_summary",
                      "cash_today", "stock", "customers", "storefront", "alerts"],
  "order": ["production", "orders_recent", "day_summary", "cash_today",
            "stock", "customers", "storefront", "alerts"],
  "autoplayEnabled": true,
  "autoplayInterval": 15000,
  "hiddenWidgetIds": []
}
```

### 1.1 Campo a campo

| Campo | Tipo | Descrição |
|---|---|---|
| `schemaVersion` | `number` | Versão do schema. Inicia em 1. Usado para migration. |
| `activeWidgetIds` | `string[]` | IDs dos cards visíveis no carrossel. Ordem não importa aqui; a ordem de render é definida por `order`. |
| `order` | `string[]` | Ordem de renderização dos cards. Reflete a ordem atual do carrossel. |
| `autoplayEnabled` | `boolean` | Se `true`, o autoplay está ativado. |
| `autoplayInterval` | `number` | Intervalo em milissegundos entre cards automáticos. Mínimo 3000, máximo 60000. |
| `hiddenWidgetIds` | `string[]` | IDs de cards que foram ocultados pelo usuário (botão "Remover do carrossel"). Diferente de `activeWidgetIds`: um card removido não aparece, mas ainda existe no registry. |

---

## 2. Defaults

### 2.1 Default completo (state vazio ou corrompido)

```javascript
const DEFAULT_STATE = Object.freeze({
  schemaVersion: 1,
  activeWidgetIds: ["production", "orders_recent", "day_summary",
                    "cash_today", "stock", "customers", "storefront", "alerts"],
  order: ["production", "orders_recent", "day_summary", "cash_today",
          "stock", "customers", "storefront", "alerts"],
  autoplayEnabled: true,
  autoplayInterval: 15000,
  hiddenWidgetIds: []
});
```

### 2.2 Origens dos defaults

| Campo | Fonte |
|---|---|
| `activeWidgetIds` | `config.home-carousel-config.js` — `active` array (todos `defaultVisible: true`) |
| `order` | `config.home-carousel-config.js` — ordem do `active` array (priority order) |
| `autoplayEnabled` | `true` (padrão do editor core) |
| `autoplayInterval` | `15000` (DEFAULT_INTERVAL do editor core) |
| `hiddenWidgetIds` | `[]` (nada oculto por padrão) |
| `schemaVersion` | `1` (versão inicial) |

---

## 3. Migration

### 3.1 Versões

| schemaVersion | Status | Notas |
|---|---|---|
| 1 | Atual | Versão inicial. Sem migration necessária. |

### 3.2 Estratégia de migration

```javascript
function migrate(state) {
  const version = state?.schemaVersion || 0;

  if (version > 1) {
    // Futuro: versão desconhecida — usar defaults
    return DEFAULT_STATE;
  }

  if (version === 0 || !state) {
    // Estado vazio ou sem versão — usar defaults
    return DEFAULT_STATE;
  }

  // state.version === 1 — 상태를 검증하고 반환
  return validateState(state);
}
```

### 3.3 Validação durante migration

A função `validateState` aplica as regras de recuperação de estado inválido (seção 4).

---

## 4. Recuperação de Estado Inválido

### 4.1 Regras de validação

```javascript
function validateState(state, registry) {
  // Clonar para não mutar o original
  const result = {
    schemaVersion: 1,
    activeWidgetIds: [],
    order: [],
    autoplayEnabled: true,
    autoplayInterval: 15000,
    hiddenWidgetIds: []
  };

  // activeWidgetIds: filtrar IDs válidos no registry
  const validIds = new Set(registry.active.map(c => c.id));
  if (Array.isArray(state.activeWidgetIds)) {
    result.activeWidgetIds = state.activeWidgetIds.filter(id => validIds.has(id));
  }
  // Se vazio após filtro, usar defaults
  if (result.activeWidgetIds.length === 0) {
    result.activeWidgetIds = DEFAULT_STATE.activeWidgetIds;
  }

  // order: filtrar IDs que estão em activeWidgetIds
  const activeSet = new Set(result.activeWidgetIds);
  if (Array.isArray(state.order)) {
    result.order = state.order.filter(id => activeSet.has(id));
  }
  // Se vazio, usar a ordem de activeWidgetIds
  if (result.order.length === 0) {
    result.order = result.activeWidgetIds.slice();
  }

  // autoplayEnabled
  result.autoplayEnabled = !!state.autoplayEnabled;

  // autoplayInterval: clamp [3000, 60000]
  const interval = Number(state.autoplayInterval);
  if (Number.isFinite(interval)) {
    result.autoplayInterval = Math.max(3000, Math.min(60000, Math.round(interval)));
  } else {
    result.autoplayInterval = 15000;
  }

  // hiddenWidgetIds: filtrar IDs válidos
  if (Array.isArray(state.hiddenWidgetIds)) {
    result.hiddenWidgetIds = state.hiddenWidgetIds.filter(id => validIds.has(id));
  }

  return result;
}
```

### 4.2 Tabela de recuperação

| Situação | Ação |
|---|---|
| `state` é `null` ou `undefined` | Retornar `DEFAULT_STATE` |
| `state.schemaVersion` não é número ou é 0 | Tratar como estado sem versão → `DEFAULT_STATE` |
| `state.schemaVersion` > 1 | Futuro: migrar ou usar `DEFAULT_STATE` se desconhecido |
| `activeWidgetIds` contém ID que não está no registry | Remover do array |
| `activeWidgetIds` está vazio após filtro | Usar `DEFAULT_STATE.activeWidgetIds` |
| `order` contém ID que não está em `activeWidgetIds` | Remover do order |
| `order` está vazio após filtro | Usar ordem de `activeWidgetIds` |
| `autoplayEnabled` não é boolean | Usar `true` |
| `autoplayInterval` < 3000 | Clamp para 3000 |
| `autoplayInterval` > 60000 | Clamp para 60000 |
| `autoplayInterval` não é número | Usar 15000 |
| `hiddenWidgetIds` contém ID inválido | Remover do array |
| JSON corrompido (JSON.parse falha) | Usar `DEFAULT_STATE` |
| Campo faltando no JSON | Usar default do campo |

---

## 5. Missing Widget Recovery

### 5.1 Cenário

Um widget que estava no carrossel é removido do `registry.active` (ex: feature desabilitada, config alterada).

### 5.2 Comportamento

| Aspecto | Comportamento |
|---|---|
| `activeWidgetIds` com ID removido do registry | Filtrado por `validateState` — o ID é removido |
| `order` com ID removido | Filtrado — o ID é removido do order |
| `hiddenWidgetIds` com ID removido | Filtrado — o ID é removido |
| Widget que se torna futuro | Se um widget ativo vira `future: true` no config, ele é removido do `activeWidgetIds` e `order` na próxima validação |

### 5.3 Sem erro

O carrossel não gera erro quando um widget desaparece. Ele simplesmente não renderiza o widget ausente. O `registry.active` é a fonte da verdade para quais widgets existem.

---

## 6. Future Widget Behavior

### 6.1 Cards futuros no estado

- Cards futuros (`future: true`) **nunca** são salvos no estado
- Eles não aparecem em `activeWidgetIds`, `order` ou `hiddenWidgetIds`
- O editor core valida: `isAvailable(id)` retorna `false` para `future: true` cards

### 6.2 Transição futuro → ativo

Quando um card futuro se torna ativo no config:

```javascript
// Exemplo: "fiscal" deixa de ser future e vira active
// NOVO config:
active: [..., { id: "fiscal", future: false, available: true, ... }]
future: [/* sem fiscal */]
```

- Na próxima carga de estado, o `validateState` vê o novo `registry.active`
- O card "fiscal" agora é válido e pode ser incluído em `activeWidgetIds`
- O estado salvo anterior não tem "fiscal" em `activeWidgetIds` — isso é normal
- O usuário pode adicionar "fiscal" manualmente pelo editor

### 6.3 Ocultação de widget futuro

- Não é possível ocultar um widget futuro (ele já não está no carrossel)
- `hiddenWidgetIds` nunca contém IDs de widgets futuros

---

## 7. Interface de Persistência (Contratual)

### 7.1 Operações requeridas

```javascript
// Storage interface (a implementar quando integrar com app.js)
const CarouselPersistence = {
  // Ler estado salvo
  load: () => Promise<CarouselState | null>,

  // Salvar estado
  save: (state: CarouselState) => Promise<void>,

  // Limpar estado (reset para defaults)
  clear: () => Promise<void>
};
```

### 7.2 CarouselState type

```typescript
interface CarouselState {
  schemaVersion: number;
  activeWidgetIds: string[];
  order: string[];
  autoplayEnabled: boolean;
  autoplayInterval: number;
  hiddenWidgetIds: string[];
}
```

### 7.3 Flow de integração

```
1. App.js monta o carrossel
2. CarouselPersistence.load() → state salvo ou null
3. validateState(state, registry) → estado válido
4. createEditor(validatedState, registry) → editor
5. createState(registry, { hidden: validatedState.hiddenWidgetIds }) → widgetState
6. Usuário edita carrossel
7. editor.getState() → novo estado
8. CarouselPersistence.save(novoEstado) → persiste
```

### 8. Perguntas frequentes / Como usar este documento

#### O que app.js faz com este contrato (responsabilidades de app.js)

> Tratamento contextual: app.js é o consumidor deste contrato — trata-se de "quasi-3rd
> party" na leitura deste documento. Este contrato descreve o que a persistência espera
> de app.js, não como app.js implementa storage.

| Responsabilidade | O que app.js faz | O que a persistência espera |
|---|---|---|
| **Fornecer o estado ao montar** | Quando o carrossel é montado, app.js lê o estado salvo (se existe) e passa para `validateState` | `CarouselPersistence.load()` retorna o state salvo ou `null` |
| **Salvar alterações do editor** | Quando o usuário edita o carrossel (adiciona/remove/move cards, altera autoplay), app.js salva o novo estado | `CarouselPersistence.save(novoEstado)` é chamado pelo editor via app.js |
| **Fornecer o registry ao validar** | app.js passa o `registry` atual para `validateState` para filtrar IDs válidos | `validateState(state, registry)` usa o registry para validar IDs |
| **Resetar para defaults** | app.js pode chamar `CarouselPersistence.clear()` para resetar o carrossel aos defaults | `clear()` remove o estado salvo — na próxima montagem, usa-se defaults |

#### O que NÃO é responsabilidade de app.js neste contrato

| O que a persistência faz sozinha | Detalhe |
|---|---|
| Validar estado salvo | `validateState` filtra IDs inválidos, clamps intervalos, aplica defaults |
| Migration de versão | `migrate` verifica `schemaVersion` e aplica transformações |
| Recuperar de estado corrompido | Se JSON inválido, usa `DEFAULT_STATE` |
| Gerenciar widgets futuros | Cards futuros nunca são salvos — é regra do schema, não de app.js |

#### Como usar este documento

1. **Quando implementar storage** — use a estrutura do item 1 e a interface do item 7 como contrato
2. **Quando integrar com app.js** — siga o flow do item 7.3 passo a passo
3. **Quando validar** — use as regras do item 4 como base para testes de recuperação
4. **Quando migrar** — adicione uma nova versão em `schemaVersion` e implemente a transformação no item 3.2

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, a implementação do storage
> é independente de como app.js é implementado, desde que respeite a interface definida.
