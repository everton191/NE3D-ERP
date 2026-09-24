(function attachHomeCarouselEngine(global) {
  "use strict";
  // Port faithful to launcher-3d's engine/CarouselPhysics.kt and Carousel3D.kt.
  const config = { dragSensitivity: .22, maxAngularVelocity: 1440, friction: 1.2, snapStiffness: 350, snapThreshold: 18, settleThreshold: .05, wheelScale: .52, sideAlphaBase: .42, sideAlphaDepth: .52 };
  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;
  const stepAngle = (count) => count ? 360 / count : 0;
  const targetRotationForPanel = (index, count) => -index * stepAngle(count);
  const nearestPanel = (rotation, count) => count ? ((Math.round(-normalizeAngle(rotation) / stepAngle(count)) % count) + count) % count : 0;
  const nearestEquivalentTarget = (index, count, rotation) => rotation + (((targetRotationForPanel(index, count) - rotation + 540) % 360) - 180);
  function createEngine(cards, options = {}) {
    let rotation = 0, velocity = 0, dragging = false, dirty = true, autoplayAt = 0;
    const autoplayIntervalMs = Number(options.autoplayIntervalMs) || 15000;
    const count = () => cards().length;
    const selected = () => nearestPanel(rotation, count());
    const api = { get selectedIndex() { return selected(); }, get selectedCard() { return cards()[selected()] || null; }, get rotation() { return rotation; }, get dragging() { return dragging; }, get needsRender() { return dirty; }, consumeRender() { dirty = false; }, dragStart() { dragging = true; velocity = 0; dirty = true; }, dragBy(pixels) { if (dragging) { rotation += pixels * config.dragSensitivity; dirty = true; } }, dragEnd(pixelsPerSecond) { dragging = false; velocity = Math.max(-config.maxAngularVelocity, Math.min(config.maxAngularVelocity, (pixelsPerSecond || 0) * config.dragSensitivity)); dirty = true; }, snap() { velocity = 0; rotation = nearestEquivalentTarget(selected(), count(), rotation); dirty = true; }, hide(id, state) { state.hide(id); rotation = targetRotationForPanel(selected(), count()); dirty = true; }, tick(now, dt) { if (!count() || dragging) return dirty; if (autoplayAt && now >= autoplayAt) { rotation = nearestEquivalentTarget((selected() + 1) % count(), count(), rotation); autoplayAt = now + autoplayIntervalMs; } if (Math.abs(velocity) > config.snapThreshold) { rotation += velocity * dt; velocity *= Math.exp(-config.friction * dt); dirty = true; return true; } const target = nearestEquivalentTarget(selected(), count(), rotation); const displacement = target - rotation; const damping = 2 * Math.sqrt(config.snapStiffness); const acceleration = config.snapStiffness * displacement - damping * velocity; velocity += acceleration * dt; rotation += velocity * dt; if (Math.abs(displacement) < config.settleThreshold && Math.abs(velocity) < config.settleThreshold) { rotation = target; velocity = 0; } dirty = true; return true; }, startAutoplay(now) { autoplayAt = now + autoplayIntervalMs; }, stopAutoplay() { autoplayAt = 0; }, transform(index) { const n = count(), angle = normalizeAngle(index * stepAngle(n) + rotation), radians = angle * Math.PI / 180, depth = Math.cos(radians), x = Math.sin(radians); return Object.freeze({ index, angle, x, depth, scale: config.wheelScale, alpha: index === selected() ? 1 : config.sideAlphaBase + ((depth + 1) * .5) * config.sideAlphaDepth, rotationY: -angle }); } };
    return Object.freeze(api);
  }
  global.SimplificaHomeCarouselEngine = Object.freeze({ createEngine, normalizeAngle, stepAngle, targetRotationForPanel, nearestPanel, nearestEquivalentTarget, config });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselEngine;
})(typeof window !== "undefined" ? window : globalThis);
