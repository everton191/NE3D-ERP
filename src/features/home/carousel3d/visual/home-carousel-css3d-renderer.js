"use strict";
(function attachHomeCarouselCss3dRenderer(global) {
  function createRenderer(host, engine, cards) {
    let disposed = false; host.replaceChildren(); host.classList.add("home-carousel-css3d-viewport");
    const stage = global.document.createElement("div"); stage.className = "home-carousel-css3d-stage"; host.appendChild(stage);
    const faces = cards().map((card) => { const face = global.document.createElement("button"); face.type = "button"; face.className = "home-carousel-css3d-face"; face.dataset.cardId = card.id; face.innerHTML = `<span class="home-carousel-css3d-icon" aria-hidden="true">${card.title.slice(0, 1)}</span><strong>${card.title}</strong>`; stage.appendChild(face); return face; });
    function render() { if (disposed) return; const count = cards().length, width = host.clientWidth || 1, radius = (width * .52) / (2 * Math.tan(Math.PI / count)); faces.forEach((face, index) => { const t = engine.transform(index), selected = index === engine.selectedIndex; face.style.transform = `translateX(-50%) translateY(-50%) rotateY(${t.rotationY}deg) translateZ(${radius}px) scale(${t.scale})`; face.style.opacity = String(t.alpha); face.style.zIndex = String(Math.round((t.depth + 1) * 100)); face.classList.toggle("is-selected", selected); }); }
    return Object.freeze({ render, dispose() { disposed = true; host.replaceChildren(); }, faceAt(target) { return faces.findIndex((face) => face === target || face.contains(target)); } });
  }
  global.SimplificaHomeCarouselCss3dRenderer = Object.freeze({ createRenderer });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselCss3dRenderer;
})(typeof window !== "undefined" ? window : globalThis);
