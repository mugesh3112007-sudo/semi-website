import * as THREE from 'three';
import { chipVertexShader, chipFragmentShader } from './shader.js';
import { makeGlowMaterial, resizeRenderer } from './utils.js';

export function createChipScene(canvas, quality) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.25, 6.8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !quality.lowPower, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);

  const root = new THREE.Group();
  root.rotation.x = -0.26;
  scene.add(root);

  const substrateMaterial = new THREE.MeshStandardMaterial({ color: '#111a25', metalness: 0.78, roughness: 0.27 });
  const substrate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 2.35), substrateMaterial);
  root.add(substrate);

  const dieMaterial = new THREE.ShaderMaterial({
    vertexShader: chipVertexShader,
    fragmentShader: chipFragmentShader,
    uniforms: {
      time: { value: 0 },
      scrollEnergy: { value: 0 },
      pointer: { value: new THREE.Vector2() },
      resolution: { value: new THREE.Vector2(1, 1) },
      quality: { value: quality.lowPower ? 0 : 1 },
    },
  });
  const die = new THREE.Mesh(new THREE.PlaneGeometry(2.78, 1.92), dieMaterial);
  die.rotation.x = -Math.PI / 2;
  die.position.y = 0.15;
  root.add(die);

  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.24, 0.3, 2.39)), new THREE.LineBasicMaterial({ color: '#d4a843', transparent: true, opacity: 0.62 }));
  root.add(frame);

  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.05, 0.18), new THREE.MeshStandardMaterial({ color: '#b87333', metalness: 0.9, roughness: 0.22 }), 48);
  const pinMatrix = new THREE.Matrix4();
  let pinIndex = 0;
  for (let x = -1.3; x <= 1.3; x += 0.26) {
    for (const z of [-1.13, 1.13]) { pinMatrix.makeTranslation(x, -0.13, z); pins.setMatrixAt(pinIndex++, pinMatrix); }
  }
  for (let z = -0.87; z <= 0.87; z += 0.29) {
    for (const x of [-1.53, 1.53]) { pinMatrix.makeTranslation(x, -0.13, z); pins.setMatrixAt(pinIndex++, pinMatrix); }
  }
  root.add(pins);

  const wireMaterial = new THREE.MeshStandardMaterial({ color: '#d4a843', metalness: 0.88, roughness: 0.2, emissive: '#4a2d08', emissiveIntensity: 0.4 });
  for (let i = 0; i < 8; i += 1) {
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), wireMaterial);
    wire.position.set(-1.2 + i * 0.34, 0.25, -0.9);
    wire.rotation.x = Math.PI / 2;
    root.add(wire);
  }

  const cyanRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.012, 6, 64), makeGlowMaterial('#00e5ff', 0.46));
  cyanRing.rotation.x = Math.PI / 2;
  cyanRing.position.y = -0.25;
  root.add(cyanRing);

  scene.add(new THREE.HemisphereLight('#b9eaff', '#05070b', 1.7));
  const key = new THREE.PointLight('#d4a843', 16, 9, 1.8);
  key.position.set(2.6, 4.5, 2.5);
  scene.add(key);
  const rim = new THREE.PointLight('#00e5ff', 10, 8, 1.7);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(rim);

  const state = { rotationX: 0, rotationY: 0, targetX: 0, targetY: 0, autoRotate: !quality.lowPower };
  const ambient = new THREE.Vector3();

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    resizeRenderer(renderer, camera, Math.max(1, rect.width), Math.max(1, rect.height), quality.pixelRatio);
    dieMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  }

  function render(time, input) {
    state.targetY = input.dragRotation.y + input.pointer.x * 0.18;
    state.targetX = input.dragRotation.x + input.pointer.y * 0.12;
    state.rotationX += (state.targetX - state.rotationX) * 0.08;
    state.rotationY += (state.targetY - state.rotationY) * 0.08;
    root.rotation.x = -0.26 + state.rotationX;
    root.rotation.y = state.rotationY + (state.autoRotate ? Math.sin(time * 0.25) * 0.07 : 0);
    root.position.y = Math.sin(time * 0.8) * 0.045;
    dieMaterial.uniforms.time.value = time;
    dieMaterial.uniforms.scrollEnergy.value = input.scrollEnergy;
    dieMaterial.uniforms.pointer.value.lerp(input.pointer, 0.08);
    cyanRing.rotation.z = time * 0.09;
    renderer.render(scene, camera);
  }

  return {
    render,
    resize,
    reset() { state.targetX = 0; state.targetY = 0; state.rotationX = 0; state.rotationY = 0; },
    setQuality(name) { state.autoRotate = name !== 'low'; dieMaterial.uniforms.quality.value = name === 'low' ? 0 : 1; },
    dispose() { renderer.dispose(); dieMaterial.dispose(); substrateMaterial.dispose(); },
  };
}
