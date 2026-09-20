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

## Testes

```bash
node scripts/test-home-carousel-editor-view.js
```

Resultado: 38 PASS / 0 FAIL (A-P: 16 categorias)
