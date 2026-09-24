# Mount Contract — Home Carousel 3D

> Contrato conceitual de montagem, lifecycle e cleanup do carrossel na Home.
> Não é implementação. Baseado no código real de `home-carousel-engine.js` e `home-carousel-renderer.js`.

**Data:** 2026-09-21

---

## 1. Mount

### 1.1 Assinatura

```javascript
/**
 * Monta o carrossel em um container DOM.
 *
 * @param {HTMLElement} container — Elemento pai onde o canvas será criado
 * @param {Object} dependencies — Dependências do carrossel
 * @returns {CarouselMount} Instância montada
 */
function mount(container, dependencies) {
  // dependencies esperadas:
  //   - engine: SimplificaHomeCarouselEngine.createEngine(cards, options)
  //   - renderer: SimplificaHomeCarouselRenderer.createRenderer(canvas, engine, cards)
  //   - registry: SimplificaHomeCarouselRegistry.createRegistry(screens)
  //   - widgetState: SimplificaHomeCarouselState.createState(registry, saved)
  //   - dataSources: { production: ..., orders_recent: ..., ... }
  //   - presenters: { production: ..., orders_recent: ..., ... }
  //   - persistence: { load, save, clear } (opcional no momento da montagem)
  //
  // Retorna:
  //   { refresh, pause, resume, unmount, getState, getEngine, getRenderer }
}
```

### 1.2 O que o mount faz

1. Cria o elemento `<canvas>` dentro do `container`
2. Cria o `engine` com os cards e opções do config
3. Cria o `renderer` com o canvas, engine e cards
4. Registra event listeners no canvas para gestos (drag/touch)
5. Inicia o loop de animação (`requestAnimationFrame`)
6. Se `dependencies.persistence` existe, chama `load()` para obter estado salvo
7. Retorna a API de controle

### 1.3 Cards

Os cards vêm do `registry.active` (ou de um override passado nas dependencies). Cada card tem:
- `id` — identificador único
- `title` — texto exibido no card
- `source` — fonte de dados (ex: `"production"`, `"pedidos"`)
- `targetScreen` — tela de destino no click
- `targetMode` — `"screen"` ou `"dynamic"`
- `available` — se o card está disponível
- `defaultVisible` — se é visível por padrão
- `removable` — se pode ser removido

---

## 2. Refresh

### 2.1 Assinatura

```javascript
/**
 * Atualiza os dados dos widgets e notifica o renderer.
 *
 * @param {Object} rawData — Dados brutos de cada widget
 *   { production: ..., orders_recent: ..., day_summary: ...,
 *     cash_today: ..., stock: ..., customers: ..., storefront: ..., alerts: ... }
 */
function refresh(rawData) {
  // Para cada widget:
  //   1. dataSources.<widget>(rawData[widget]) → snapshot
  //   2. presenters.<widget>(snapshot) → ViewModel
  //   3. widgetModels.build<Widget>(vm) → VisualModel
  //   4. Marca engine como dirty para re-render
}
```

### 2.2 Frequência

- `refresh()` é chamado quando os dados mudam (ex: a cada N segundos, ou quando o usuário navega)
- Não é chamado a cada frame — apenas quando há novos dados

### 2.3 Comportamento durante refresh

- O engine continua rodando durante o refresh
- O renderer continua renderizando — se os dados mudaram, o próximo render usa os novos dados
- Não há flash ou limpeza do canvas durante refresh

---

## 3. Pause / Resume

### 3.1 Pause

```javascript
function pause() {
  engine.stopAutoplay();
  // Cancelar o requestAnimationFrame loop (sem destruir o engine)
  // O renderer não é desmontado — só pausado
}
```

### 3.2 Resume

```javascript
function resume() {
  engine.startAutoplay(severity); // severity opcional: força restart do autoplay
  // Reiniciar o requestAnimationFrame loop
}
```

### 3.3 Quando chamar

| Evento | Ação |
|---|---|
| `document.visibilityState === 'hidden'` | `pause()` |
| `document.visibilityState === 'visible'` | `resume()` |
| Usuário começa a arrastar o carrossel | `pause()` (o engine já faz isso internamente via `dragStart`) |
| Usuário solta o carrossel | `resume()` (se autoplay estava ativo antes) |

---

## 4. Unmount

### 4.1 Assinatura

```javascript
function unmount() {
  // 1. Cancelar requestAnimationFrame loop
  // 2. Remover event listeners do canvas
  // 3. Disconnect resize observer (se usado)
  // 4. Chamar renderer.dispose()
  // 5. Chamar engine.stopAutoplay()
  // 6. Remover o canvas do DOM (ou deixar o container vazio)
}
```

### 4.2 O que NÃO é feito pelo unmount

- Não salva estado (isso é responsibility da persistence, não do mount)
- Não remove cards do registry
- Não destrói o engine (o engine é imutável após criação)

---

## 5. Ownership de Listeners

### 5.1 Event listeners registrados pelo mount

| Listener | Elemento | Evento | Ação |
|---|---|---|---|
| `pointerdown` / `touchstart` | Canvas | Início de gesto | `engine.dragStart()`, capturar posição inicial |
| `pointermove` / `touchmove` | Canvas (ou window durante gesture) | Durante gesto | `engine.dragBy(deltaX)`, marcar dirty |
| `pointerup` / `touchend` | Canvas (ou window) | Fim de gesto | `engine.dragEnd(velocity)`, snap se necessário |
| `keydown` (opcional) | Window | Setas esquerda/direita | Navegar entre cards (acessibilidade) |

### 5.2 Cleanup obrigatória

Todos os listeners acima devem ser removidos no `unmount()`. Se não removidos, causam memory leak e comportamento inesperado se o container for reaproveitado.

---

## 6. Ownership de Animation Frame

### 6.1 Loop de animação

```javascript
let animationFrameId = null;
let lastTime = 0;

function loop(now) {
  if (!container.isConnected) return; // Container removido do DOM

  const dt = lastTime ? (now - lastTime) / 1000 : 0;
  lastTime = now;

  const needsRender = engine.tick(now, dt);
  if (needsRender) {
    renderer.render();
    engine.consumeRender();
  }

  animationFrameId = requestAnimationFrame(loop);
}

// Iniciar no mount:
animationFrameId = requestAnimationFrame(loop);
```

### 6.2 Cleanup no unmount

```javascript
function unmount() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  lastTime = 0;
}
```

### 6.3 Verificação de conexão

O `loop` verifica `container.isConnected` antes de continuar. Se o container foi removido do DOM (ex: navegação away), o loop para naturalmente no próximo frame.

---

## 7. Visibility Changes

| Estado visibility | Ação |
|---|---|
| `visible` | Se estava pausado por visibility, `resume()` |
| `hidden` | `pause()` — suspender loop e autoplay |

### 7.1 Implementação sugerida

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    pause();
  } else if (document.visibilityState === 'visible') {
    resume();
  }
});
```

---

## 8. Navigation Away / Back

### 8.1 Navigation away da Home

Quando o usuário sai da Home (ex: clica em um card e navega para outra tela):

1. O container do carrossel é removido do DOM (ou torna-se invisível)
2. `unmount()` é chamado
3. O loop é cancelado, listeners removidos, renderer desmontado

### 8.2 Volta para a Home

Quando o usuário volta para a Home:

1. Novo mount é feito (ou o mount anterior é reutilizado se o container ainda existe)
2. `refresh()` é chamado com os dados mais recentes
3. Autoplay é reiniciado se estava ativo

### 8.3 Reutilização do mount

Se o container da Home não é removido do DOM (ex: apenas escondido com CSS), o mount existe e pode ser reutilizado:

```javascript
// Na volta:
refresh(latestData);
resume();
```

Isso evita recriar engine e renderer desnecessariamente.

---

## 9. Screen Resize

### 9.1 Tratamento atual do renderer

O renderer já lida com resize internamente:

```javascript
function render() {
  const width = canvas.width = canvas.clientWidth * devicePixelRatio;
  const height = canvas.height = canvas.clientHeight * devicePixelRatio;
  // ... renderiza com as novas dimensões
}
```

### 9.2 Resize observer (opcional)

Se o container pode ter seu tamanho alterado por layout (ex: SplitView, responsive), um ResizeObserver pode ser usado:

```javascript
const resizeObserver = new ResizeObserver(() => {
  engine.consumeRender(); // Forçar re-render na próxima tick
  renderer.render();
});
resizeObserver.observe(container);
```

Cleanup no unmount: `resizeObserver.disconnect()`.

---

## 10. Orientation Change

### 10.1 Comportamento

Orientation change é tratado como um resize. O renderer recalculará o canvas size e os cards serão redesenhados na próxima tick.

### 10.2 Comportamento do engine

O engine não é afetado por orientation change. A posição dos cards é relativa ao tamanho do canvas, que é recalculado.

### 10.3 Autoplay durante orientation change

Se o autoplay estava ativo, ele continua. Se o usuário estava interagindo (arrastando), o `dragStart`/`dragEnd` já gerencia o pause/resume interno.

---

## 11. Resumo do Mount Contract

| Operação | Assinatura | O que faz | Cleanup necessário? |
|---|---|---|---|
| `mount(container, deps)` | Cria canvas, engine, renderer, listeners, loop | Sim — `unmount()` |
| `refresh(rawData)` | Atualiza dados dos widgets | Não |
| `pause()` | Stop autoplay, cancel frame loop | Não (é reversível com `resume()`) |
| `resume()` | Restart autoplay, frame loop | Não (é reversível com `pause()`) |
| `unmount()` | Remove listeners, cancela frame, dispose renderer | Sim — não há volta |

### 11.1 Lifecycle completo

```
Mount
  → Refresh (dados iniciais)
  → Loop (animation frames)
  → Refresh (dados atualizados)
  → Pause (visibility hidden / user drag)
  → Resume (visibility visible / drag end)
  → Refresh (dados atualizados)
  → Unmount (sair da Home)
```

---

## 12. Contexto do app.js — Como usar este documento

### 12.1 Tratamento contextual de app.js

> app.js é tratado como "quasi-3rd party" nesta leitura. Este documento descreve o
> contrato que app.js consome (via `mount()`, `refresh()`, `pause()`, `resume()`,
> `unmount()`), não como app.js é implementado internamente.

### 12.2 What app.js does (responsabilidades de app.js no ciclo do carrossel)

| Momento | O que app.js faz | O que o carousel espera |
|---|---|---|
| **Mount** | Decide quando montar o carrossel (ex: quando a Home é mostrada), cria o container, chama `mount(container, dependencies)` | Receber um container válido e dependencies completas |
| **Refresh de dados** | Periodicamente ou sob demanda, chama `carousel.refresh(rawData)` com os dados dos 8 widgets | Consumir os dados e renderizar na próxima tick |
| **Card click → routing** | Recebe o `targetScreen` do card clicado (emitido pelo carousel) e executa a navegação para a tela correspondente | Emitir o `targetScreen` — não navegar. Para `targetMode: "dynamic"` (alerts), app.js define o comportamento |
| **Autoplay lifecycle** | Gerencia quando o carrossel fica visível ou não e chama `pause()`/`resume()` apropriadamente | Fornecer `pause()`/`resume()` — app.js é o owner do ciclo |
| **Unmount (sair da Home)** | Quando o usuário sai da Home, chama `carousel.unmount()` para cleanup | Executar cleanup de listeners, animation frame, renderer |

### 12.3 O que NÃO é responsabilidade de app.js no contexto do carousel

| O que o carousel faz sozinho | Detalhe |
|---|---|
| Determinar posição dos cards | Engine calcula — app.js não move cards manualmente |
| Renderizar os cards | Renderer desenha no canvas — app.js não desenha |
| Gerenciar gestos | Engine gerencia drag/snap — app.js só conecta listeners |
| Animar cada widget | Animation drivers atualizam frame state — app.js fornece dt |
| Validar configs do editor | EditorCore valida — app.js só consome o estado |

### 12.4 Como usar este documento

1. **Quando integrar o carrossel na Home** — use as seções 1-4 como contrato de mount/refresh/pause/resume/unmount
2. **Ao implementar o handler de click** — use a seção 7 para saber quais targetScreens existem
3. **Ao testar lifecycle** — use a seção 11.1 como base para o plano de teste
4. **Ao revisar** — confirme que a implementação segue os contratos de ownership (seções 5 e 6)

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento não
> assume nada sobre a implementação interna de app.js, apenas sobre como ele interage
> com o carrossel através da API definida aqui.
