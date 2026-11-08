export const chipVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const chipFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float time;
  uniform float scrollEnergy;
  uniform vec2 pointer;
  uniform vec2 resolution;
  uniform float quality;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float line(float value, float width) {
    return 1.0 - smoothstep(width, width + 0.012, abs(value));
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= resolution.x / max(resolution.y, 1.0);
    uv += pointer * 0.025;

    vec2 gridUv = uv * (quality < 0.5 ? 8.0 : 11.0);
    vec2 cell = fract(gridUv) - 0.5;
    vec2 id = floor(gridUv);
    float seed = hash21(id);

    float vertical = line(cell.x, 0.018);
    float horizontal = line(cell.y, 0.018);
    float traces = max(vertical, horizontal) * (0.24 + 0.36 * step(0.48, seed));

    float route = line(cell.x - 0.14 * sin(id.y + 2.0), 0.012) * step(0.52, hash21(id + 4.0));
    route += line(cell.y + 0.16 * cos(id.x), 0.012) * step(0.60, hash21(id + 8.0));

    float pad = smoothstep(0.11, 0.06, length(cell)) * step(0.72, seed);
    float pulsePosition = fract(time * (0.12 + scrollEnergy * 0.45));
    float pulse = exp(-abs(fract(id.x * 0.13 + id.y * 0.21 + time * 0.2) - pulsePosition) * 22.0);
    float active = pad * pulse;

    float scan = smoothstep(0.02, 0.0, abs(uv.y - sin(time * 0.28) * 0.22)) * 0.18;
    float vignette = 1.0 - smoothstep(0.25, 0.82, length(uv));
    vec3 substrate = mix(vec3(0.018, 0.035, 0.055), vec3(0.055, 0.09, 0.12), vignette);
    vec3 copper = vec3(0.55, 0.22, 0.07);
    vec3 cyan = vec3(0.0, 0.62, 0.72);
    vec3 green = vec3(0.15, 1.0, 0.48);
    vec3 color = substrate;
    color += copper * traces * 0.55;
    color += cyan * route * 0.85;
    color += vec3(0.82, 0.55, 0.18) * pad * 0.72;
    color += green * active * 1.8;
    color += cyan * scan;
    color *= 0.72 + vignette * 0.28;
    gl_FragColor = vec4(color, 1.0);
  }
`;
