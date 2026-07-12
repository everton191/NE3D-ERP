# Guia de migração UI V3

1. Migrar uma rota por vez e envolver sua nova árvore em `[data-ui-version="v3"]`.
2. Montar `AppShell` somente quando a rota assumir o shell inteiro; caso contrário usar o shell V3 já ativo.
3. Substituir container, grid e scroller antes do polimento visual.
4. Migrar overlays para o controlador Portal, sem aliases do popup legado.
5. Remover CSS antigo apenas após teste visual autenticado nos viewports oficiais.
6. Não misturar classes de Storefront/ERP legado dentro da árvore V3.

Esta etapa não migrou nenhuma rota real.
