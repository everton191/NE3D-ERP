# Storefront Module - Fase 4A

Responsabilidade: render publico da loja.

Este modulo define o contrato de arquitetura da storefront publica. A logica atual ainda vive em `app.js` e `style.css`; a migracao real acontece em fases posteriores.

## Pode conter

- catalogo publico;
- paginas de produto;
- categorias publicas;
- carrinho publico;
- links de compartilhamento;
- render visual da experiencia do cliente.

## Nao deve conter

- editor/admin;
- estado operacional do ERP;
- overlays legados;
- escrita em `#popup`;
- regras de billing/planos.

## Zonas oficiais

```txt
store-header
store-content
store-products
store-filters
store-cart
store-footer
```
