const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const publicModule = fs.readFileSync("src/features/storefront/storefront-public.js", "utf8");
const hay = `${app}\n${publicModule}`;
const migration = fs.readFileSync("supabase/migrations/20260622211500_storefront_smart_product_ranking.sql", "utf8");
const securityMigration = fs.readFileSync("supabase/migrations/20261012013350_restrict_storefront_ranking_to_published_or_owner.sql", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(hay.includes("function ordenarProdutosLojaInteligente"), "Ordenacao inteligente ausente");
assert(hay.includes('product_view: 1'), "Peso de visualizacao ausente");
assert(hay.includes('add_to_cart: 5'), "Peso de carrinho ausente");
assert(hay.includes('lead_created: 9'), "Peso de interesse de compra ausente");
assert(hay.includes('fallback.productRanking || []'), "Ranking nao aplicado ao catalogo publico");
assert(hay.includes('/rpc/get_storefront_product_ranking'), "RPC de ranking nao consumida pela loja");
assert(hay.includes('registrarVisualizacaoProdutoLojaPublica(route)'), "Visualizacao da rota de produto nao registrada");
assert(migration.includes("security definer"), "RPC publica sem autoridade controlada");
assert(migration.includes("set search_path = public, pg_temp"), "RPC sem search_path seguro");
assert(migration.includes("e.created_at >= now() - interval '90 days'"), "Ranking sem janela temporal");
assert(securityMigration.includes("public.storefront_publication_allowed(s.id)"), "RPC deve aplicar gate de publicacao");
assert(securityMigration.includes("s.owner_id = auth.uid()"), "Proprietario deve manter acesso ao ranking");
assert(securityMigration.includes("set search_path = pg_catalog"), "RPC corrigida sem search_path restrito");
assert(securityMigration.includes("grant execute on function public.get_storefront_product_ranking(uuid) to anon, authenticated"), "RPC deve manter contrato de EXECUTE");
assert(!migration.includes("metadata_json"), "RPC nao deve expor metadados dos clientes");

console.log("Storefront smart ranking tests passed.");
