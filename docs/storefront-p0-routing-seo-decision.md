# Simplifica 3D — decisão P0 de roteamento e SEO

## Escopo desta etapa

- A rota pública canônica é `/loja/:slug`; links legados `/:slug` só redirecionam quando a loja publicada existe.
- A Function `api/storefront-page.js` consulta o Data API usando exclusivamente a chave publishable e as políticas RLS existentes. Uma loja, produto ou categoria não retornada pela policy recebe resposta HTTP 404 com `noindex`.
- O shell do ERP, Store Admin e Superadmin inicia com `meta robots=noindex,nofollow,noarchive`. A Function troca os metadados somente em páginas públicas válidas.
- `robots.txt` e `sitemap.xml` são Functions para obter o domínio do pedido e listar somente linhas atualmente visíveis para acesso público.
- O cache local pode continuar como dado auxiliar para o administrador, mas não autoriza uma vitrine pública. Uma leitura pública sem loja remove o cache persistido e marca a sessão como revogada.
- O Service Worker mantém o fallback de `index.html` somente para navegação offline; arquivos inexistentes devolvem erro, nunca HTML do app.

## Estratégia de validação sem publicar loja real

1. Os handlers são exercitados com respostas Supabase controladas no script `test:prepublication-p0`, cobrindo 200 público, metadata/OG/canonical, 404 e sitemap com loja/produto.
2. O Data API real é consultado em modo somente leitura para comprovar a quantidade de lojas publicamente visíveis. Nesta validação o resultado foi zero.
3. O roteador local da Vercel é usado para validar os status HTTP das rotas inexistentes, `robots.txt`, sitemap e asset ausente.

Nenhuma loja, produto ou policy é criada, alterada ou publicada nesta etapa. A validação E2E com uma loja real continua bloqueada até existir uma loja controlada aprovada pelo responsável.
