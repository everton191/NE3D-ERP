# Ações mobile dos produtos da loja

Checkpoint visual do admin da loja para telas pequenas.

## Cards de catálogo

- Os cards mobile usam imagem compacta, título em até duas linhas, preço e badges reduzidas.
- `Editar` e o botão `...` ficam alinhados na mesma linha.
- Ações secundárias deixam de ocupar espaço permanente no card.
- Fotos continuam acessíveis no desktop e pelo menu de ações no mobile.

## Camadas por viewport

- Desktop: o botão `...` abre um dropdown ancorado ao card. O menu fecha ao clicar fora, rolar ou pressionar `Escape`.
- Mobile: o botão `...` usa `drawer-layer` e `overlay-layer` para abrir um bottom sheet.
- O bottom sheet possui fechamento externo, botão `Cancelar`, área segura inferior e ações para visualizar, duplicar, ocultar, copiar link, destacar, ordenar, adicionar foto e excluir.

## Formulário

- Em telas de até `768px`, o cadastro e a edição usam quatro etapas: `Dados`, `Preço`, `Fotos` e `Revisão`.
- Apenas a etapa atual fica visível no mobile; os valores continuam no mesmo formulário e não são perdidos ao avançar ou voltar.
- Campos obrigatórios são validados antes do avanço. O preço usa teclado decimal e a quantidade manual aceita digitação ou ajuste rápido por `-` e `+`.
- A barra inferior mobile alterna entre `Voltar`, `Continuar` e `Salvar alterações`, permanecendo sticky e respeitando `safe-area-inset-bottom`.
- No desktop, todas as seções continuam visíveis ao mesmo tempo e a barra final compacta mantém `Cancelar` e `Salvar alterações`.

## Escopo preservado

Não houve mudança em backend, banco, RLS, publicação, sincronização, planos, permissões, PWA ou APK.
