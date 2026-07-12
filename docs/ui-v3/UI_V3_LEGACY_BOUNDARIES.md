# Fronteiras com o legado

- V3 só existe sob `[data-ui-version="v3"]`.
- `style.css` não recebe regras V3.
- laboratório desabilita links CSS legados antes de montar.
- produção não monta `/dev/ui-v3` porque o host não é local.
- V3 não usa `#popup`, `.modal-backdrop`, shell V2, classes Storefront ou bottom-nav legada.
- Portal V3 só bloqueia o `ContentScroller` V3.
- nenhum grid, scroll, formulário ou tela real foi substituído automaticamente.

Arquivos legados continuam temporariamente intactos e só poderão ser removidos após migração comprovada.
