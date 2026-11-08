import * as THREE from 'three';

export function createInteractionState({ reducedMotion, quality }) {
  return {
    reducedMotion,
    quality,
    forceLowPower: false,
    pointer: new THREE.Vector2(),
    targetPointer: new THREE.Vector2(),
    dragRotation: new THREE.Vector2(),
    scrollEnergy: 0,
    lastScrollY: window.scrollY,
  };
}

export function bindInteraction({ canvas, target = canvas, state, onReset, onQualityChange }) {
  const resetButton = document.querySelector('#reset-view');
  const qualityButton = document.querySelector('#quality-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-navigation');
  let dragging = false;
  let dragged = false;
  let lastX = 0;
  let lastY = 0;
  let suppressClickUntil = 0;

  const updatePointer = (event) => {
    const rect = target?.getBoundingClientRect();
    if (!rect) return;
    state.targetPointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
    document.querySelector('#pointer-readout')?.replaceChildren(`${Math.round((state.targetPointer.x + 1) * 50)} / ${Math.round((state.targetPointer.y + 1) * 50)}`);
  };

  const pointerDown = (event) => {
    if (event.button !== 0) return;
    dragging = true; dragged = false; lastX = event.clientX; lastY = event.clientY;
    target?.setPointerCapture?.(event.pointerId); target?.classList.add('is-dragging');
  };
  const pointerMove = (event) => {
    updatePointer(event);
    if (!dragging) return;
    const dx = event.clientX - lastX; const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true;
    state.dragRotation.y += dx * 0.012; state.dragRotation.x += dy * 0.009;
    state.dragRotation.x = THREE.MathUtils.clamp(state.dragRotation.x, -0.7, 0.7);
    lastX = event.clientX; lastY = event.clientY;
  };
  const pointerUp = (event) => {
    if (!dragging) return;
    dragging = false; if (dragged) suppressClickUntil = performance.now() + 300;
    target?.releasePointerCapture?.(event.pointerId); target?.classList.remove('is-dragging');
  };

  target?.addEventListener('pointerdown', pointerDown);
  target?.addEventListener('pointermove', pointerMove, { passive: true });
  target?.addEventListener('pointerup', pointerUp);
  target?.addEventListener('pointercancel', pointerUp);
  target?.addEventListener('pointerleave', () => { if (!dragging) state.targetPointer.set(0, 0); });
  resetButton?.addEventListener('click', onReset);
  qualityButton?.addEventListener('click', () => {
    const active = qualityButton.getAttribute('aria-pressed') === 'true';
    qualityButton.setAttribute('aria-pressed', String(!active));
    qualityButton.innerHTML = active ? 'Force low-power mode <span>↗</span>' : 'Low-power mode active <span>↗</span>';
    onQualityChange(!active);
  });
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open)); nav?.classList.toggle('is-open', !open);
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { menuButton?.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }));

  return {
    destroy() {
      target?.removeEventListener('pointerdown', pointerDown);
      target?.removeEventListener('pointermove', pointerMove);
      target?.removeEventListener('pointerup', pointerUp);
      target?.removeEventListener('pointercancel', pointerUp);
    },
  };
}
