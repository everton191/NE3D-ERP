# Store Editor Module - Fase 4A

Responsabilidade: edicao e configuracao da loja.

Este modulo prepara a separacao do editor em relacao a storefront publica. A migracao deve ser gradual e sem alterar fluxos criticos nesta fase.

## Pode conter

- configuracoes da loja;
- edicao de blocos;
- produtos/categorias no contexto admin;
- validacao de publicacao;
- uploads e feedbacks do editor.

## Nao deve conter

- render publico final;
- carrinho do cliente;
- checkout publico;
- scroll global do app;
- overlays em `#popup`.

## Regra

Editor usa camadas do App Shell (`modal-layer`, `drawer-layer`, `overlay-layer`) e nao compartilha scroll principal com o preview.
