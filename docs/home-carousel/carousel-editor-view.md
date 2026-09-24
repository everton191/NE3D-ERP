# Carousel Editor View

UI isolada do editor do carrossel.

## Pipeline

```
REGISTRY -> EDITOR CORE -> EDITOR VIEW -> FUTURA PERSISTENCIA -> WIDGET STATE
```

## Contrato

```js
var view = V.createView(container, editor, registry);

view.render();    // renderiza a UI
view.destroy();   // limpa o container
```

## Estrutura

```
Editar Carrossel
  Cards no carrossel (N)
    [card] [up] [down] [remove]
    [card] [up] [down] [remove]
  Cards disponiveis (N)
    [card] [+ add]
  Em breve
    [card] (sem botao)
  Controles
    [x] Reproduzir automaticamente
    Intervalo (ms): [input]
    [Restaurar padrao]
```

## Linguagem

- **CORRETO**: "Remover do carrossel"
- **ERRADO**: "Excluir", "Desativar", "Deletar"

Remover um card nao remove a funcao do ERP.

## Cards Futuros (sem botao adicionar)

```
fiscal, accounts_payable, accounts_receivable, purchases,
shipping, crm, quality, maintenance
```

## Acessibilidade

- Buttons com aria-label
- Foco previsivel
- Keyboard activation (click events)
- Labels associados

## Visual

- Dark theme
- Teal/ciano
- Cards arredondados
- Estados ativos/inativos claros

## API

```js
var V = require("./carousel-editor-view");

var container = document.getElementById("editor-root");
var editor = E.createEditor(null, registry);
var view = V.createView(container, editor, registry);

// Renderizar
view.render();

// Apos operacoes no editor
editor.addCard("stock");
view.render();  // re-render necessario

// Destruir
view.destroy();
```

## Regras

1. Nao monta na Home
2. Nao usa app.js
3. Nao persiste em appConfig
4. Usa EditorCore para operacoes
5. Cards future/available=false nao podem ser adicionados

## Contexto do app.js — como usar este documento

> **Tratamento contextual:** app.js é o consumidor deste documento — trata-se de "quasi-3rd party" na leitura deste documento. Este documento descreve o que a editor view espera de app.js, não como app.js é implementado.

### O que app.js faz com este documento

| Responsabilidade | O que app.js faz | O que a editor view espera |
|---|---|---|
| **Fornecer o container** | Quando o editor é aberto, app.js cria ou fornece o container DOM e chama `createView(container, editor, registry)` | Um container DOM válido onde a UI do editor será renderizada |
| **Fornecer o editor e registry** | App.js cria o editor core e o registry, e passa ambos para a editor view | `editor` (com suas operações) e `registry` (com os cards ativos/futuros) |
| **Sincronizar estado após edições** | Quando app.js chama operações no editor core (`addCard`, `removeCard`, etc.), app.js deve chamar `view.render()` para re-renderizar a UI | A editor view não escuta mudanças automaticamente — app.js deve trigger o re-render |
| **Gerenciar lifecycle** | App.js é o owner da editor view — cria no mount e chama `view.destroy()` no unmount | `destroy()` limpa o container — app.js deve garantir que isso é chamado |
| **Não persiste direto** | App.js não deve chamar persistência diretamente a partir da editor view — a view apenas renderiza | A editor view não tem acesso a storage; a persistência é responsibility de app.js |

### O que NÃO é responsabilidade de app.js neste documento

| O que a editor view faz sozinho | Detalhe |
|---|---|
| Renderizar a UI do editor | `render()` cria a estrutura HTML/aria no container |
| Gerenciar cards ativos e disponíveis | A view lê `editor.getState()` e o registry para montar a UI |
| Bloquear cards futuros/available=false | A view não mostra botão "+" para cards que não podem ser adicionados |
| Usar linguagem correta | A view usa "Remover do carrossel" (não "Excluir", "Desativar", "Deletar") |
| Acessibilidade | A view garante aria-labels, foco previsível, keyboard activation |

### Como usar este documento

1. **Para integrar a editor view na Home** — use este documento para entender o contrato `createView()` / `render()` / `destroy()`
2. **Para testar a editor view** — os testes podem criar um container mockado, um editor mockado e verificar o HTML resultante
3. **Para estender a UI** — siga o padrão: sem app.js, sem persistência, usa editor core para operações
4. **Para revisar** — confirme que uma nova feature não introduz acesso a app.js, storage, ou DOM fora do container fornecido

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento descreve o contrato que app.js consome, sem depender de como app.js é implementado internamente.
