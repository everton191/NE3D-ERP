"use strict";

(function attachHomeCarouselCss3dRenderer(global) {
  const TILE_KIT_IDS = ["production"];
  const TILE_KIT = new Set(TILE_KIT_IDS);
  const MODULE_ICON_PATHS = {
    production: [
      "M12 3.4 20.6 8.3 12 13.2 3.4 8.3z",
      "M3.4 8.3v7.4L12 20.6l8.6-4.9V8.3",
      "M12 13.2v7.4"
    ]
  };

  function createModuleIcon(cardId) {
    const paths = MODULE_ICON_PATHS[cardId];
    if (!paths || typeof global.document?.createElementNS !== "function") return null;
    const ns = "http://www.w3.org/2000/svg";
    const svg = global.document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    paths.forEach((d) => {
      const path = global.document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  function createRenderer(host, engine, cards) {
    let disposed = false;
    let settleTimer = 0;
    let cameraY = 2.2;
    let pressedFace = null;
    let pressOrigin = null;
    let poppedIndex = -1;
    let previousRotation = null;
    let restSince = 0;
    const tileState = [];
    const focusHoldMs = 880;
    const tileSignals = new AbortController();
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
      const moduleIcon = TILE_KIT.has(card.id) ? createModuleIcon(card.id) : null;
      if (moduleIcon) icon.appendChild(moduleIcon);
      else icon.textContent = presentation.icon || card.title.slice(0, 1);
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

    function faceIndexOf(target) {
      return faces.findIndex((face) => face === target || face.contains(target));
    }

    function writeTile(face, index, focus, signed) {
      const state = tileState[index] || (tileState[index] = {});
      const focusValue = focus.toFixed(3);
      const parallaxValue = `${(signed * 0.05).toFixed(2)}px`;
      const lightXValue = `${(50 + signed * 0.4).toFixed(1)}%`;
      if (state.focus !== focusValue) { state.focus = focusValue; face.style.setProperty("--tile-focus", focusValue); }
      if (state.parallax !== parallaxValue) { state.parallax = parallaxValue; face.style.setProperty("--tile-px", parallaxValue); }
      if (state.lightX !== lightXValue) { state.lightX = lightXValue; face.style.setProperty("--tile-light-x", lightXValue); }
    }

    function press() {
      const face = faces[engine.selectedIndex];
      if (!face || disposed || !TILE_KIT.has(face.dataset.cardId)) return;
      if (pressedFace && pressedFace !== face) pressedFace.classList.remove("is-pressing");
      pressedFace = face;
      face.classList.add("is-pressing");
    }

    function releasePress() {
      pressOrigin = null;
      if (!pressedFace) return;
      pressedFace.classList.remove("is-pressing");
      pressedFace = null;
    }

    function popFace(index) {
      const face = faces[index];
      if (!face || index !== engine.selectedIndex || !TILE_KIT.has(face.dataset.cardId)) return;
      poppedIndex = index;
      face.classList.remove("is-focus-pop");
      void face.offsetWidth;
      face.classList.add("is-focus-pop");
    }

    host.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) return;
      const index = faceIndexOf(event.target);
      if (index !== engine.selectedIndex) return;
      pressOrigin = { x: event.clientX, y: event.clientY };
      press();
    }, { signal: tileSignals.signal });
    host.addEventListener("pointermove", (event) => {
      if (!pressOrigin) return;
      if (Math.abs(event.clientX - pressOrigin.x) > 8 || Math.abs(event.clientY - pressOrigin.y) > 8) releasePress();
    }, { signal: tileSignals.signal });
    host.addEventListener("pointerup", releasePress, { signal: tileSignals.signal });
    host.addEventListener("pointercancel", releasePress, { signal: tileSignals.signal });

    faces.forEach((face) => {
      face.addEventListener("animationend", (event) => {
        if (event.target === face && event.animationName === "homeTileCardPop") face.classList.remove("is-focus-pop");
      }, { signal: tileSignals.signal });
    });

    function render() {
      if (disposed) return;
      const count = faces.length;
      const step = count ? 360 / count : 360;
      const radius = count >= 3 ? (178 / (2 * Math.tan(Math.PI / count))).toFixed(2) : 0;
      stage.style.setProperty("--carousel-radius", `${radius}px`);
      const rotation = engine.rotation;
      const moving = engine.dragging || rotation !== previousRotation;
      previousRotation = rotation;
      const now = global.performance.now();
      if (engine.dragging || moving) { restSince = now; poppedIndex = -1; }
      else if (!restSince) restSince = now;
      faces.forEach((face, index) => {
        const t = engine.transform(index);
        const selected = index === engine.selectedIndex;
        const signed = t.angle > 180 ? t.angle - 360 : t.angle;
        const near = Math.abs(signed) <= step * 1.5;
        const focus = near ? Math.max(0, 1 - Math.min(1, Math.abs(signed) / step)) : 0;
        face.style.setProperty("--angle", `${index * 360 / count + rotation}deg`);
        face.style.setProperty("--card-scale", selected ? "1.04" : "1");
        face.style.opacity = String(selected ? 1 : Math.min(.82, t.alpha));
        face.style.setProperty("--carousel-face-light", String(Math.max(.06, Math.min(.26, .16 + .08 * t.depth - .07 * t.x))));
        face.style.zIndex = String(Math.round((t.depth + 1) * 100));
        face.classList.toggle("is-selected", selected);
        writeTile(face, index, focus, near ? signed : 0);
      });
      if (!engine.dragging && !moving && restSince && now - restSince >= focusHoldMs && engine.selectedIndex !== poppedIndex) {
        popFace(engine.selectedIndex);
      }
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
      poppedIndex = -1;
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
        releasePress();
        tileSignals.abort();
        host.replaceChildren();
        host.classList.remove("dashboard-action-carousel");
      },
      settle,
      beginDrag,
      press,
      releasePress,
      moveCamera,
      preview,
      faceAt: faceIndexOf
    });
  }

  global.SimplificaHomeCarouselCss3dRenderer = Object.freeze({ createRenderer });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselCss3dRenderer;
})(typeof window !== "undefined" ? window : globalThis);
