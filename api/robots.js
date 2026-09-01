const { getOrigin } = require("./lib/storefront-public");

function handler(request, response) {
  const origin = getOrigin(request);
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=300");
  response.status(200).send(`User-agent: *\nAllow: /loja/\nDisallow: /api/\nDisallow: /store-admin/\nDisallow: /superadmin\nDisallow: /privacy\nDisallow: /privacidade\nDisallow: /terms\nDisallow: /termos\nSitemap: ${origin}/sitemap.xml\n`);
}

module.exports = handler;
