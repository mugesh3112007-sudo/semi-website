# Silicon / 001 — Die Scan

A lightweight procedural semiconductor chip showcase built with Vite, Three.js, GSAP, and Lenis.

## Run locally

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173>.

## Production build

```bash
npm run build
npm run preview
```

The project is static and compatible with GitHub Pages, Vercel, and Netlify.

## Performance behavior

- One WebGL canvas and one render loop.
- Procedural geometry only; no external 3D assets or large textures.
- Low-power devices use a reduced pixel ratio, simpler shader path, and no automatic rotation.
- The renderer pauses when the canvas is offscreen or the tab is hidden.
- `prefers-reduced-motion` keeps a static CSS chip illustration and disables continuous motion.
- If WebGL initialization fails, the CSS fallback remains visible.

The intended baseline is a low-end AMD A4 laptop. Profile the production build at 1366×768 and aim for a sustained 30 FPS minimum.
