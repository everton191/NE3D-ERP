# Fase 7C.3 - Validacao da loja online premium

## Escopo

A Storefront V2 recebeu uma camada visual final sem alterar regras de negocio,
publicacao, planos, checkout ou persistencia. O editor guiado continua usando a
arquitetura existente e a loja publica permanece protegida pelos guards de modo.

## Alteracoes validadas

- Home publica mais curta: banner, beneficios, categorias, produtos e contato.
- Tema publico claro com contraste controlado para banners enviados pelo usuario.
- Grid responsivo: quatro colunas em desktop, duas em tablet/mobile e uma coluna
  em celulares estreitos.
- Carrinho flutuante compacto com icone e contador.
- Pagina de produto com composicao responsiva e opcoes visuais quando aplicavel.
- Contato publico sem blocos redundantes.
- Limites alinhados entre editor guiado e formularios avancados:
  banner 40, subtitulo 100, CTA 24, produto 60 e descricao 180 caracteres.
- Cache PWA atualizado para `simplifica-3d-v129-estavel-20260531-storefront-premium`.

## Matriz visual local

O editor foi validado no navegador lateral com `320`, `360`, `390`, `412`,
`430`, `768`, `1366`, `1440` e `1920` pixels de largura.

Resultados:

- nenhum overflow horizontal;
- um unico shell de loja ativo;
- toolbar desktop a partir de `1024px`;
- editor mobile com bottom sheet controlado;
- preview mobile em largura integral;
- hero com overlay claro e titulo legivel;
- grid sem cards espremidos.

## Validacoes automaticas

Executar:

```bash
npm run test:storefront-premium-7c3
npm run test:storefront-guided-editor
npm run test:storefront-pwa-upgrade
npm run test:restructuring-checks
npm run test:ui-overflow
npm run test:ui-theme-consistency
npm run test:ui-responsive-balance
npm run build:web
git diff --check
```

## Homologacao manual restante

- Validar a rota publica em ambiente com fallback SPA ou deploy real. O servidor
  estatico local de `dist/` responde `404` quando `/ne3d` e aberto diretamente.
- Executar CRUD descartavel de produto em conta de teste autenticada para conferir
  persistencia remota, detalhes publicos e link de WhatsApp.
- Republicar PWA e APK somente depois dessas duas conferencias.

## Rollback

Checkpoint anterior a esta fase:

```txt
checkpoint-before-phase-7c3-storefront-premium-20260531
```
