import { onCleanup, onMount, createEffect } from "solid-js";
import "solid-styled";
import { css } from "solid-styled";
import { fxEventSig } from "../utils/fxBus";

export function BackgroundWebGL() {
  // eslint-disable-next-line no-unused-expressions
  css`
    .bgfx-canvas {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: var(--z-index-base);
    }
  `;

  let canvasRef: HTMLCanvasElement | null = null;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let rafId = 0;

  let uResolution: WebGLUniformLocation | null = null;
  let uTime: WebGLUniformLocation | null = null;
  let uStartTime: WebGLUniformLocation | null = null;
  let uActive: WebGLUniformLocation | null = null;
  let uRect: WebGLUniformLocation | null = null;
  let uColor: WebGLUniformLocation | null = null;
  let uBase: WebGLUniformLocation | null = null;

  type Vec3 = [number, number, number];
  type Vec4 = [number, number, number, number];
  const vec3 = (a: number, b: number, c: number): Vec3 => [a, b, c];
  const vec4 = (a: number, b: number, c: number, d: number): Vec4 => [a, b, c, d];

  const state = {
    startTime: -1,
    active: 0,
    color: vec3(0.2, 0.9, 0.4), // greenish
    rect: vec4(0, 0, 0, 0), // x,y,w,h in 0..1 uv space with origin bottom-left
  };

  const vertSrc = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`.trim();

  const fragSrc = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uStartTime;
uniform float uActive;
uniform vec4 uRect; // x,y,w,h (uv space, origin bottom-left)
uniform vec3 uColor;
uniform vec3 uBase;

// Static orb grid parameters (organized, fixed positions)
const int NX = 80;
const int NY = 40;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 fragPx = gl_FragCoord.xy;
  vec2 uv = fragPx / uResolution;
  float time = uTime;

  // Continuous orb field (organized grid, static positions, O(1) per-fragment)
  float margin = 0.0;
  vec2 area = vec2(1.0 - 2.0 * margin);
  vec2 grid = vec2(float(NX), float(NY));
  vec2 uvA = (uv - vec2(margin)) / area; // normalized to active area

  vec3 base = uBase;
  vec3 col = base;

  if (uvA.x >= 0.0 && uvA.x < 1.0 && uvA.y >= 0.0 && uvA.y < 1.0) {
    vec2 cell = floor(uvA * grid) + 0.5;
    vec2 center = vec2(margin) + (cell / grid) * area;
    float phase = cell.x * 0.37 + cell.y * 0.23;
    float px = 1.0; // 1 pixel smoothing
    float rPx = 2.0; // static radius in pixels (tighter grid dots)

    // Click-triggered wave: compute intensity at orb center and derive displacement
    float t = time - uStartTime;
    float burst = 0.0;
    vec2 centerDisp = center;
    if (uActive > 0.5 && t >= 0.0) {
      float duration = 1.0;
      float k = clamp(1.0 - t / duration, 0.0, 1.0);
      if (k > 0.0) {
        // Card-shaped wave using rectangle SDF expanding outward from edges
        vec2 rectCenter = vec2(uRect.x + uRect.z * 0.5, uRect.y + uRect.w * 0.5);
        vec2 rectHalf = vec2(uRect.z, uRect.w) * 0.5;
        float dBox = sdBox(center - rectCenter, rectHalf);
        // Strong ease-out expansion (starts fast, then slows quickly)
        float progress = clamp(t / duration, 0.0, 1.0);
        float ease = 1.0 - pow(1.0 - progress, 5.0); // easeOutQuint
        float wave = 0.6 * ease;
        // Thickness grows with ease
        float width = mix(0.02, 0.05, ease);
        float edge = smoothstep(width, 0.0, abs(dBox - wave));
        burst = edge * pow(k, 0.6);

        // Displace outward along the rectangle's outward normal
        float e = 0.001;
        float sdfX1 = sdBox(center + vec2(e, 0.0) - rectCenter, rectHalf);
        float sdfX2 = sdBox(center - vec2(e, 0.0) - rectCenter, rectHalf);
        float sdfY1 = sdBox(center + vec2(0.0, e) - rectCenter, rectHalf);
        float sdfY2 = sdBox(center - vec2(0.0, e) - rectCenter, rectHalf);
        vec2 nBox = normalize(vec2(sdfX1 - sdfX2, sdfY1 - sdfY2) + 1e-6);
        float dpPx = 10.0 * edge * k; // displacement magnitude in pixels (slightly stronger)
        vec2 dispUv = (dpPx * nBox) / uResolution; // convert pixels to UV
        centerDisp = center + dispUv;
      }
    }

    // Recompute distance using displaced center
    vec2 centerPx = centerDisp * uResolution;
    float dPx = distance(fragPx, centerPx);
    float orb = 1.0 - smoothstep(rPx, rPx + 2.0 * px, dPx);

    // Orb color (muted grey-blue) with brightness boost on burst
    float s = 0.20 + 0.40 * (0.5 + 0.5 * sin(time * 0.9 + phase)); // animate color strength only (muted)
    vec3 deepBlue = vec3(0.08, 0.11, 0.14);   // grey-blue
    vec3 lightBlue = vec3(0.20, 0.26, 0.33);  // lighter grey-blue
    vec3 orbCol = mix(deepBlue, lightBlue, s);
    vec3 finalOrb = orbCol * (1.0 + burst * 1.0);
    col += finalOrb * orb * 0.9;
  }

  gl_FragColor = vec4(col, 1.0);
}
`.trim();

  const createShader = (type: number, source: string) => {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      const info = gl!.getShaderInfoLog(shader);
      gl!.deleteShader(shader);
      throw new Error(`Shader compile failed: ${info ?? ""}`);
    }
    return shader;
  };

  const setup = () => {
    if (!canvasRef) return;
    gl = canvasRef.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vs = createShader(gl.VERTEX_SHADER, vertSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
    program = gl.createProgram()!;
    gl.attachShader(program!, vs);
    gl.attachShader(program!, fs);
    gl.linkProgram(program!);
    if (!gl.getProgramParameter(program!, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program!);
      gl.deleteProgram(program!);
      throw new Error(`Program link failed: ${info ?? ""}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program!);

    // Fullscreen triangle
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1,
        -1, //
        3,
        -1, //
        -1,
        3, //
      ]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program!, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    uResolution = gl.getUniformLocation(program!, "uResolution");
    uTime = gl.getUniformLocation(program!, "uTime");
    uStartTime = gl.getUniformLocation(program!, "uStartTime");
    uActive = gl.getUniformLocation(program!, "uActive");
    uRect = gl.getUniformLocation(program!, "uRect");
    uColor = gl.getUniformLocation(program!, "uColor");
    uBase = gl.getUniformLocation(program!, "uBase");
  };

  const resize = () => {
    if (!gl || !canvasRef) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // balanced crispness/perf
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvasRef.width !== w || canvasRef.height !== h) {
      canvasRef.width = w;
      canvasRef.height = h;
    }
    gl.viewport(0, 0, canvasRef.width, canvasRef.height);
    if (uResolution) {
      gl.uniform2f(uResolution, canvasRef.width, canvasRef.height);
    }
  };

  const toUvRect = (rect: { x: number; y: number; width: number; height: number } | null) => {
    if (rect === null) return [0, 0, 0, 0] as [number, number, number, number];
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Convert DOM top-left origin rect to UV with origin bottom-left
    const x = rect.x / w;
    const y = (h - (rect.y + rect.height)) / h;
    const rw = rect.width / w;
    const rh = rect.height / h;
    return [x, y, rw, rh] as [number, number, number, number];
  };

  const loop = (tMs: number) => {
    if (!gl || !program) return;
    const time = tMs / 1000;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (uBase) {
      const docStyle = getComputedStyle(document.documentElement);
      const cssVar = docStyle.getPropertyValue("--color-background").trim();
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const [br, bg, bb] = parseCssColor(cssVar || bodyBg);
      gl.uniform3f(uBase, br, bg, bb);
    }
    if (uTime) gl.uniform1f(uTime, time);
    if (uStartTime) gl.uniform1f(uStartTime, state.startTime);
    if (uActive) gl.uniform1f(uActive, state.active);
    if (uRect) gl.uniform4f(uRect, state.rect[0], state.rect[1], state.rect[2], state.rect[3]);
    if (uColor) gl.uniform3f(uColor, state.color[0], state.color[1], state.color[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    rafId = requestAnimationFrame(loop);
  };

  createEffect(() => {
    const evt = fxEventSig();
    if (!evt || evt.type !== "positive-burst") return;
    const color: Vec3 = evt.answer === "good" ? vec3(0.2, 0.85, 1.0) : vec3(0.2, 0.9, 0.4); // Good: cyan; Easy: green
    const rectUv: Vec4 = toUvRect(evt.rect) as Vec4;
    const x = rectUv[0],
      y = rectUv[1],
      rw = rectUv[2],
      rh = rectUv[3];
    state.startTime = evt.at;
    state.active = 1;
    state.color = color;
    state.rect = vec4(x, y, rw, rh);
  });

  onMount(() => {
    setup();
    resize();
    window.addEventListener("resize", resize, { passive: true });
    rafId = requestAnimationFrame(loop);
    if (import.meta.env.DEV) {
      const now = performance.now() / 1000;
      state.startTime = now;
      state.active = 1;
      state.color = vec3(0.2, 0.85, 1.0);
      state.rect = vec4(0.4, 0.4, 0.2, 0.2);
      setTimeout(() => {
        state.active = 0;
      }, 1400);
    }
  });

  onCleanup(() => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(rafId);
    if (gl && program) {
      gl.deleteProgram(program);
    }
    gl = null;
    program = null;
  });

  const parseCssColor = (value: string): [number, number, number] => {
    const v = value.trim();
    if (v.startsWith("#")) {
      const hex = v.slice(1);
      const n = parseInt(
        hex.length === 3
          ? hex
              .split("")
              .map((c) => c + c)
              .join("")
          : hex,
        16,
      );
      const r = ((n >> 16) & 255) / 255;
      const g = ((n >> 8) & 255) / 255;
      const b = (n & 255) / 255;
      return [r, g, b];
    }
    const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m && m[1] && m[2] && m[3]) {
      const r = parseInt(m[1], 10) / 255;
      const g = parseInt(m[2], 10) / 255;
      const b = parseInt(m[3], 10) / 255;
      return [r, g, b];
    }
    return [0.018, 0.022, 0.028];
  };

  return <canvas class="bgfx-canvas" ref={(el) => (canvasRef = el)} />;
}
