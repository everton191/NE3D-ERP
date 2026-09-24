"use strict";

(function attachHomeCarouselCss3dRenderer(global) {
  function createRenderer(host, engine, cards) {
    let disposed = false;
    let settleTimer = 0;
    let cameraY = 2.2;
    host.replaceChildren();
    host.classList.add("home-carousel-css3d-viewport", "dashboard-action-carousel");

    const stage = global.document.createElement("div");
    stage.className = "dashboard-carousel-stage";
    stage.style.setProperty("--carousel-camera-origin-y", "48%");
    host.appendChild(stage);

    const faces = cards().map((card) => {
      const presentation = card.presentation || {};
      const face = global.document.createElement("button");
      const icon = global.document.createElement("span");
      const content = global.document.createElement("span");
      const title = global.document.createElement("strong");
      const detail = global.document.createElement("small");
      const values = global.document.createElement("span");

      face.type = "button";
      face.className = "dashboard-carousel-card card";
      face.dataset.cardId = card.id;
      face.setAttribute("aria-label", `${card.title}. ${presentation.detail || "Abrir recurso"}`);

      icon.className = "home-carousel-spb-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = presentation.icon || card.title.slice(0, 1);
      content.className = "dashboard-mobile-advanced-copy";
      title.textContent = card.title;
      detail.textContent = presentation.detail || "Abrir recurso";
      values.className = "dashboard-carousel-values home-carousel-css3d-values";
      (Array.isArray(presentation.live) ? presentation.live : []).forEach((value) => {
        const line = global.document.createElement("em");
        line.textContent = value;
        values.appendChild(line);
      });
      content.append(title, detail, values);
      face.append(icon, content);
      stage.appendChild(face);
      return face;
    });

    function render() {
      if (disposed) return;
      const count = faces.length;
      const radius = count >= 3 ? (178 / (2 * Math.tan(Math.PI / count))).toFixed(2) : 0;
      stage.style.setProperty("--carousel-radius", `${radius}px`);
      faces.forEach((face, index) => {
        const t = engine.transform(index);
        const selected = index === engine.selectedIndex;
        face.style.setProperty("--angle", `${index * 360 / count + engine.rotation}deg`);
        face.style.setProperty("--card-scale", selected ? "1.04" : "1");
        face.style.opacity = String(selected ? 1 : Math.min(.82, t.alpha));
        face.style.setProperty("--carousel-face-light", String(Math.max(.06, Math.min(.26, .16 + .08 * t.depth - .07 * t.x))));
        face.style.zIndex = String(Math.round((t.depth + 1) * 100));
        face.classList.toggle("is-selected", selected);
      });
    }

    function settle() {
      stage.classList.add("is-settling");
      // Commit the starting transform with transitions enabled before the
      // mount advances the angle in this frame.
      if (faces.length) global.getComputedStyle?.(faces[0]).transform;
      global.clearTimeout(settleTimer);
      settleTimer = global.setTimeout(() => stage.classList.remove("is-settling"), 980);
    }

    function beginDrag() {
      global.clearTimeout(settleTimer);
      stage.classList.remove("is-settling");
    }

    function moveCamera(deltaY) {
      cameraY = Math.max(.6, Math.min(4.2, cameraY + deltaY * .008));
      stage.style.setProperty("--carousel-camera-origin-y", `${48 - (cameraY - 2.2) * 5}%`);
    }

    function preview(index) {
      faces.forEach((face, faceIndex) => face.classList.toggle("is-previewing", faceIndex === index));
    }

    return Object.freeze({
      render,
      dispose() {
        disposed = true;
        global.clearTimeout(settleTimer);
        host.replaceChildren();
        host.classList.remove("dashboard-action-carousel");
      },
      settle,
      beginDrag,
      moveCamera,
      preview,
      faceAt(target) {
        return faces.findIndex((face) => face === target || face.contains(target));
      }
    });
  }

  global.SimplificaHomeCarouselCss3dRenderer = Object.freeze({ createRenderer });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselCss3dRenderer;
})(typeof window !== "undefined" ? window : globalThis);
