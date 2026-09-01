# Teste controlado da loja pública — preparado, não executado

Status: **PARADO ANTES DE WRITE**

## Candidato

- Loja: `ne3d`
- ID: `00000000-0000-4000-8000-00000000f371`
- Estado remoto observado: `active=false`
- Produtos: 3
- Produtos visíveis: 0

As outras duas lojas existentes não possuem produtos. A loja `ne3d` é o único candidato útil, mas ativá-la ou tornar produtos visíveis alteraria produção. Nenhum dado foi modificado nesta preparação.

## Fluxo controlado quando houver autorização

1. Registrar contagens iniciais de `store_visits`, `store_events`, `store_cart_leads` e `store_order_drafts` para o ID acima.
2. Ativar somente a loja candidata e tornar visível somente um produto de teste aprovado.
3. Abrir `/loja/ne3d` em sessão anônima e confirmar storefront e produto.
4. Registrar uma visita e um `product_view`.
5. Adicionar o produto ao carrinho e criar um lead/rascunho com identificação explícita de teste.
6. Confirmar no admin que visita, evento, lead e rascunho pertencem à mesma loja.
7. Remover os registros de teste identificados e restaurar exatamente os estados anteriores de loja/produto.

## Gates

- Não reutilizar contato de cliente real.
- Não converter o rascunho em pedido real.
- Não enviar WhatsApp.
- Não publicar Vercel ou APK.
- Interromper se a restauração exata do estado anterior não estiver garantida.
