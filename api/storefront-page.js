const { getOrigin, loadPublicPage, parseStorefrontPath, renderNotFound, renderPublicPage, validSlug } = require("./lib/storefront-public");

async function handler(request, response) {
  const origin = getOrigin(request);
  const path = String(request.query?.path || "");
  const legacy = String(request.query?.legacy || "");
  if (legacy) {
    if (!validSlug(legacy)) {
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
      response.status(404).send(renderNotFound(origin));
      return;
    }
    try {
      const page = await loadPublicPage({ slug: legacy, view: "home" });
      if (!page) {
        response.setHeader("X-Robots-Tag", "noindex, nofollow");
        response.status(404).send(renderNotFound(origin));
        return;
      }
      response.setHeader("Cache-Control", "private, no-store");
      response.redirect(308, `/loja/${encodeURIComponent(legacy)}`);
      return;
    } catch (_) {
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
      response.status(503).send(renderNotFound(origin, "Loja indisponível"));
      return;
    }
  }
  const route = parseStorefrontPath(path);
  if (!route) {
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
    response.status(404).send(renderNotFound(origin));
    return;
  }
  try {
    const page = await loadPublicPage(route);
    if (!page) {
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
      response.status(404).send(renderNotFound(origin));
      return;
    }
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.status(200).send(renderPublicPage(page, origin, `/loja/${path.split("/").map(encodeURIComponent).join("/")}`));
  } catch (_) {
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
    response.status(503).send(renderNotFound(origin, "Loja indisponível"));
  }
}

module.exports = handler;
