# Storefront Architecture - Fase 4A

Data: 2026-05-27

Escopo: desacoplamento arquitetural inicial. Esta fase nao move a logica critica da loja.

## Modulos

```txt
modules/
 ├── storefront
 ├── store-editor
 └── store-preview
```

## Responsabilidades

### `modules/storefront`

Render publico da loja:

- home publica;
- catalogo;
- categorias;
- paginas de produto;
- carrinho publico;
- compartilhamento.

Nao deve conter editor, configuracoes admin ou estado operacional do ERP.

### `modules/store-editor`

Experiencia administrativa da loja:

- configuracoes;
- blocos editaveis;
- produtos/categorias em contexto admin;
- validacao de publicacao;
- feedback de salvamento.

Nao deve renderizar diretamente a loja publica nem controlar o preview.

### `modules/store-preview`

Simulacao visual isolada:

- preview desktop/tablet/mobile;
- render controlado;
- scroll proprio;
- estado visual separado.

Nao deve alterar runtime global, shell principal ou persistencia.

## Regra de camadas

Novas interacoes da loja devem usar:

- `#modal-layer`;
- `#drawer-layer`;
- `#overlay-layer`.

`#popup` permanece apenas como legado temporario fora dos novos fluxos.
