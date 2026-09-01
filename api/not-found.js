const { getOrigin, renderNotFound } = require("./lib/storefront-public");

function handler(request, response) {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("Cache-Control", "no-store");
  response.status(404).send(renderNotFound(getOrigin(request)));
}

module.exports = handler;
