# Storefront Integration Layer

Camada técnica da Fase 3 da Loja Online do Simplifica 3D.

Esta pasta não altera a UI atual do ERP por conta própria. Ela prepara:

- services públicos e administrativos;
- adapters entre ERP, loja, carrinho e pedido;
- regras de plano;
- política de estoque;
- modelo do painel Loja Online.

## Services

- `services/storefront-public.service.ts`: leitura pública de loja ativa, categorias visíveis e produtos visíveis.
- `services/storefront-admin.service.ts`: gestão privada da loja do usuário logado, leads e rascunhos.
- `services/storefront-leads.service.ts`: criação de lead a partir do carrinho e mensagem de WhatsApp.
- `services/storefront-analytics.service.ts`: visitas, eventos e métricas básicas.

## Adapters

- `adapters/product.adapter.ts`: transforma produto interno do ERP em produto público da loja sem expor custo, margem ou lucro.
- `adapters/cart.adapter.ts`: normaliza itens do carrinho, subtotal e mensagem de WhatsApp.
- `adapters/order.adapter.ts`: transforma lead em pedido rascunho revisável.

## Segurança

As tabelas e policies ficam em:

- `supabase/migrations/20260522103000_storefront_phase3.sql`

Aplicar a migration somente quando a etapa de release for aprovada.
