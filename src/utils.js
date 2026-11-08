import * as THREE from 'three';

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getQuality() {
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 4;
  return {
    name: lowPower ? 'low' : 'standard',
    lowPower,
    pixelRatio: lowPower ? 1.1 : Math.min(window.devicePixelRatio || 1, 1.75),
    pulseCount: lowPower ? 2 : 4,
    gridDensity: lowPower ? 8 : 11,
  };
}

export function resizeRenderer(renderer, camera, width, height, pixelRatio) {
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

export function makeGlowMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
}
