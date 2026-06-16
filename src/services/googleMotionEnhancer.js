(function initGoogleExpressiveMotion(global) {
  const doc = global.document;
  if (!doc || doc.documentElement?.dataset?.gxmMotion === "ready") return;

  const motionQuery = "(prefers-reduced-motion: reduce)";
  const prefersReducedMotion = () => {
    if (doc.documentElement?.dataset?.gxmForceMotion === "on") return false;
    try {
      return !!global.matchMedia?.(motionQuery)?.matches;
    } catch (_) {
      return false;
    }
  };

  const interactiveSelector = [
    ".btn",
    ".icon-button",
    ".header-menu-button",
    ".side-nav-button",
    ".mobile-bottom-nav-button",
    ".menu-button",
    ".ui-tab",
    ".store-ui-button",
    ".store-ui-icon-button",
    ".sfv3-bottom-nav a",
    ".sfv3-bottom-nav button",
    "button",
  ].join(",");

  const screenSelector = [
    "#app-content",
    ".app-content-shell",
    ".app-page",
    ".s3d-page",
    ".desktop-main",
    ".desktop-focus",
    ".mobile-home",
    ".mobile-panel-content",
    ".storefront-editor",
  ].join(",");

  function markReady() {
    doc.documentElement.dataset.gxmMotion = "ready";
    doc.documentElement.dataset.gxmForceMotion = "on";
    doc.body?.classList?.add("gxm-motion-ready");
    doc.body?.classList?.add("gxm-force-motion");
  }

  function addRipple(target, event) {
    if (prefersReducedMotion() || !target || target.disabled) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ripple = doc.createElement("span");
    ripple.className = "gxm-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  function markScreen(node, options = {}) {
    if (!node || (!options.force && node.dataset.gxmSeen === "true")) return;
    node.dataset.gxmSeen = "true";
    node.classList.remove("gxm-enter");
    void node.offsetWidth;
    node.classList.add("gxm-enter");
    global.setTimeout(() => node.classList.remove("gxm-enter"), 700);
  }

  function markCurrentScreens(root = doc) {
    root.querySelectorAll?.(screenSelector)?.forEach(markScreen);
  }

  function observeScreens() {
    const target = doc.getElementById("app") || doc.body;
    if (!target || !global.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.(screenSelector)) markScreen(node);
          markCurrentScreens(node);
        });
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function getCurrentScreenNode() {
    const candidates = Array.from(doc.querySelectorAll(screenSelector));
    return candidates.find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) || doc.getElementById("app");
  }

  function triggerScreenSwap() {
    if (prefersReducedMotion()) return;
    const node = getCurrentScreenNode();
    if (!node) return;
    node.classList.remove("gxm-screen-swap");
    void node.offsetWidth;
    node.classList.add("gxm-screen-swap");
    global.setTimeout(() => node.classList.remove("gxm-screen-swap"), 780);
  }

  let carouselDrag = null;

  function getDraggableCarousel(target) {
    const carousel = target?.closest?.(".sfv3-category-grid");
    if (!carousel || carousel.scrollWidth <= carousel.clientWidth) return null;
    return carousel;
  }

  doc.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const carousel = getDraggableCarousel(event.target);
    if (!carousel) return;
    carouselDrag = {
      node: carousel,
      pointerId: event.pointerId,
      startX: event.clientX,
      startLeft: carousel.scrollLeft,
      moved: false
    };
    carousel.classList.add("is-dragging");
    try {
      carousel.setPointerCapture?.(event.pointerId);
    } catch (_) {}
  }, { passive: true });

  doc.addEventListener("pointermove", (event) => {
    if (!carouselDrag || carouselDrag.pointerId !== event.pointerId) return;
    const delta = event.clientX - carouselDrag.startX;
    if (Math.abs(delta) > 4) carouselDrag.moved = true;
    carouselDrag.node.scrollLeft = carouselDrag.startLeft - delta;
    if (carouselDrag.moved) event.preventDefault();
  }, { passive: false });

  function finishCarouselDrag(event) {
    if (!carouselDrag || carouselDrag.pointerId !== event.pointerId) return;
    const { node, moved } = carouselDrag;
    node.classList.remove("is-dragging");
    if (moved) {
      node.dataset.dragged = "true";
      global.setTimeout(() => {
        if (node.dataset.dragged === "true") delete node.dataset.dragged;
      }, 120);
    }
    try {
      node.releasePointerCapture?.(event.pointerId);
    } catch (_) {}
    carouselDrag = null;
  }

  doc.addEventListener("pointerup", finishCarouselDrag, { passive: true });
  doc.addEventListener("pointercancel", finishCarouselDrag, { passive: true });

  doc.addEventListener("click", (event) => {
    const carousel = event.target?.closest?.(".sfv3-category-grid");
    if (!carousel || carousel.dataset.dragged !== "true") return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  doc.addEventListener("pointerdown", (event) => {
    const target = event.target?.closest?.(interactiveSelector);
    if (!target || !doc.body?.contains(target)) return;
    addRipple(target, event);
  }, { passive: true });

  doc.addEventListener("click", (event) => {
    const navTarget = event.target?.closest?.([
      ".side-nav-button",
      ".mobile-bottom-nav-button",
      ".ui-tab",
      ".sfe-tabs button",
      ".sfv3-bottom-nav a",
      ".sfv3-bottom-nav button",
      "[data-tela]",
      "[data-screen]",
      "[onclick*='trocarTela']",
      "[onclick*=\"trocarTela\"]"
    ].join(","));
    if (!navTarget) return;
    triggerScreenSwap();
  }, { passive: true });

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", () => {
      markReady();
      markCurrentScreens();
      observeScreens();
    }, { once: true });
  } else {
    markReady();
    markCurrentScreens();
    observeScreens();
  }
})(window);
