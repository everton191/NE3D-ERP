# Store Preview Module - Fase 4A

Responsabilidade: preview isolado da loja.

O preview simula a loja sem controlar runtime global e sem alterar o shell principal.

## Pode conter

- preview desktop/tablet/mobile;
- render controlado de blocos;
- simulacao visual de tema;
- viewport isolada.

## Nao deve conter

- mutacoes persistentes;
- listeners globais;
- injeçao de CSS global;
- carrinho real do cliente;
- dependencias diretas de overlays publicos.

## Regras de isolamento

- scroll proprio controlado;
- largura/altura confinadas;
- estado visual separado do editor;
- nunca escrever em `#popup`.
