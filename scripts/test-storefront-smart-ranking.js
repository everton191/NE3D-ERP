const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260622211500_storefront_smart_product_ranking.sql", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(app.includes("function ordenarProdutosLojaInteligente"), "Ordenacao inteligente ausente");
assert(app.includes('product_view: 1'), "Peso de visualizacao ausente");
assert(app.includes('add_to_cart: 5'), "Peso de carrinho ausente");
assert(app.includes('lead_created: 9'), "Peso de interesse de compra ausente");
assert(app.includes('fallback.productRanking || []'), "Ranking nao aplicado ao catalogo publico");
assert(app.includes('/rpc/get_storefront_product_ranking'), "RPC de ranking nao consumida pela loja");
assert(app.includes('registrarVisualizacaoProdutoLojaPublica(route)'), "Visualizacao da rota de produto nao registrada");
assert(migration.includes("security definer"), "RPC publica sem autoridade controlada");
assert(migration.includes("set search_path = public, pg_temp"), "RPC sem search_path seguro");
assert(migration.includes("e.created_at >= now() - interval '90 days'"), "Ranking sem janela temporal");
assert(migration.includes("s.active = true or s.owner_id = auth.uid()"), "RPC nao limita lojas publicas ou proprietario");
assert(!migration.includes("metadata_json"), "RPC nao deve expor metadados dos clientes");

console.log("Storefront smart ranking tests passed.");
