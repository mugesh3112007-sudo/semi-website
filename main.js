import Lenis from 'lenis';
import { gsap } from 'gsap';
import { createChipScene } from './src/scene.js';
import { createInteractionState, bindInteraction } from './src/interaction.js';
import { getQuality, prefersReducedMotion } from './src/utils.js';

const canvas = document.querySelector('#chip-canvas');
const fallback = document.querySelector('.chip-fallback');
const interactionTarget = document.querySelector('.hero-stage');
const bootScreen = document.querySelector('#boot-screen');
const reducedMotion = prefersReducedMotion();
const quality = getQuality();
const state = createInteractionState({ reducedMotion, quality });
let chipScene = null;
let rafId = 0;
let lastTime = 0;
let visible = true;

const lenis = reducedMotion ? null : new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, lerp: 0.09 });

if (lenis) {
  const scrollRaf = (time) => { lenis.raf(time); requestAnimationFrame(scrollRaf); };
  requestAnimationFrame(scrollRaf);
}

document.documentElement.dataset.quality = quality.name;
if (quality.lowPower) document.documentElement.dataset.lowPower = 'true';
if (reducedMotion) document.documentElement.dataset.reducedMotion = 'true';

function showFallback() {
  fallback?.classList.add('is-visible');
  canvas?.setAttribute('aria-hidden', 'true');
}

function hideBoot() {
  window.setTimeout(() => bootScreen?.classList.add('is-hidden'), 500);
}

try {
  if (!reducedMotion && canvas) {
    chipScene = createChipScene(canvas, quality);
    fallback?.classList.remove('is-visible');
    chipScene.resize();
  } else {
    showFallback();
  }
} catch (error) {
  console.warn('[chips-3d] WebGL unavailable; using CSS fallback.', error);
  showFallback();
}

const interaction = bindInteraction({
  canvas,
  target: interactionTarget,
  state,
  scene: chipScene,
  onReset: () => chipScene?.reset(),
  onQualityChange: (lowPower) => {
    state.forceLowPower = lowPower;
    document.documentElement.dataset.lowPower = String(lowPower);
    if (lowPower) {
      chipScene?.setQuality('low');
      showFallback();
    } else {
      fallback?.classList.remove('is-visible');
      chipScene?.setQuality(quality.name);
    }
  },
});

const visibilityObserver = canvas ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 }) : null;
if (canvas) visibilityObserver?.observe(canvas);

document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

function animate(time) {
  rafId = requestAnimationFrame(animate);
  if (!chipScene || !visible || document.hidden || state.reducedMotion) return;
  const delta = Math.min((time - lastTime) / 1000 || 0.016, 0.05);
  lastTime = time;
  state.scrollEnergy *= 0.92;
  state.pointer.lerp(state.targetPointer, Math.min(1, delta * 8));
  chipScene.render(time / 1000, state);
}

if (chipScene) rafId = requestAnimationFrame(animate);

window.addEventListener('resize', () => chipScene?.resize(), { passive: true });
window.addEventListener('load', () => {
  hideBoot();
  gsap.fromTo('.hero-copy > *', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power2.out' });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.16 });
document.querySelectorAll('.section-head, .module-card, .signal-panel, .uplink-content').forEach((element) => {
  element.classList.add('reveal-target');
  revealObserver.observe(element);
});

window.addEventListener('scroll', () => {
  state.scrollEnergy = Math.min(1, state.scrollEnergy + Math.abs(window.scrollY - state.lastScrollY) * 0.02);
  state.lastScrollY = window.scrollY;
}, { passive: true });

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(rafId);
  interaction.destroy();
  chipScene?.dispose();
});
