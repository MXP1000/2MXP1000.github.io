import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as sfx from "../audio/sfx";

type RGB = [number, number, number];
type Pal = [number, number];
type Shape = "sphere" | "ring" | "heart" | "peony" | "willow";

export interface SceneCallbacks {
  onBoom?: (power: number) => void;
}

interface Rocket {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  pal: Pal;
  shape: Shape;
}

interface Effect {
  t: number;
  dur: number;
  step: (p: number) => void;
  end: () => void;
}

interface Timer {
  t: number;
  fn: () => void;
}

interface Diya {
  group: THREE.Group;
  oil: THREE.MeshStandardMaterial;
  flame: THREE.Sprite;
  flameMat: THREE.SpriteMaterial;
  coreMat: THREE.SpriteMaterial;
  glow: THREE.Sprite;
  glowMat: THREE.SpriteMaterial;
  lit: number;
  target: number;
  pending: boolean;
  delay: number;
  phase: number;
}

interface Lantern {
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  speed: number;
  sway: number;
  phase: number;
}

const PALETTES: Pal[] = [
  [0xff3b3b, 0xffc83b],
  [0x3bd1ff, 0xb35bff],
  [0xffd23b, 0xffffff],
  [0xff5ca8, 0xff9e3b],
  [0x5bff9e, 0x3bb4ff],
  [0xff8a1f, 0xfff1a8],
  [0xc084fc, 0xf0abfc],
  [0x7dd3fc, 0xffffff],
];
const SHAPES: Shape[] = ["sphere", "sphere", "ring", "peony", "heart", "willow"];
const GOLD: Pal = [0xffc46b, 0xfff0b8];
const PINK: Pal = [0xff2d6f, 0xff9ec0];
const BOMB_PAL: Pal = [0xffa23b, 0xffe39a];
const WHITE_PAL: Pal = [0xffffff, 0xffe0a0];
const SKY_Z = -4;
const INTENSITY = 1.7; // >1 so bloom makes particles glow
const WHITE = new THREE.Color(1, 1, 1);

const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function randomUnit(): THREE.Vector3 {
  const u = rand(-1, 1);
  const t = rand(0, Math.PI * 2);
  const s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(t), u, s * Math.sin(t));
}

function palColor(pal: Pal, whiteMix = 0.12): RGB {
  const c = new THREE.Color(pal[0]).lerp(new THREE.Color(pal[1]), Math.random());
  if (Math.random() < whiteMix) c.lerp(WHITE, 0.6);
  return [c.r * INTENSITY, c.g * INTENSITY, c.b * INTENSITY];
}

function makeRadialTexture(stops: [number, string][]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Procedural rangoli for the courtyard floor. */
function rangoliTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.translate(S / 2, S / 2);
  const cols = ["#ff3b5c", "#ffb22e", "#ffe066", "#3ddc97", "#38bdf8", "#a855f7", "#fb7185", "#f97316"];

  const petals = (count: number, rOff: number, rx: number, ry: number, offset: number, shift: number) => {
    for (let i = 0; i < count; i++) {
      g.save();
      g.rotate((i / count) * Math.PI * 2 + offset);
      g.fillStyle = cols[(i + shift) % cols.length];
      g.beginPath();
      g.ellipse(0, -rOff, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  };

  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    g.fillStyle = i % 2 ? "#fff3b0" : "#ff7aa2";
    g.beginPath();
    g.arc(Math.cos(a) * 470, Math.sin(a) * 470, 9, 0, Math.PI * 2);
    g.fill();
  }
  petals(16, 360, 58, 120, 0, 0);
  petals(24, 230, 30, 75, 0.13, 3);
  petals(8, 110, 28, 55, 0, 1);

  g.strokeStyle = "#ffb22e";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(0, 0, 470, 0, Math.PI * 2);
  g.stroke();

  g.fillStyle = "#fff7d6";
  g.beginPath();
  g.arc(0, 0, 44, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Night skyline silhouette with lit windows and temple domes. */
function skylineTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  let x = 0;
  while (x < W) {
    const w = rand(50, 130);
    const h = rand(140, 420);
    g.fillStyle = "#07040f";
    g.fillRect(x, H - h, w, h);
    for (let wy = H - h + 14; wy < H - 14; wy += 18) {
      for (let wx = x + 9; wx < x + w - 12; wx += 14) {
        if (Math.random() < 0.13) {
          g.fillStyle = Math.random() < 0.5 ? "#ffd27a" : "#ff9a3c";
          g.fillRect(wx, wy, 5, 8);
        }
      }
    }
    x += w - rand(0, 12);
  }

  for (const fx of [0.2, 0.52, 0.8]) {
    const cx = fx * W;
    g.fillStyle = "#07040f";
    g.fillRect(cx - 90, H - 200, 180, 200);
    g.beginPath();
    g.arc(cx, H - 200, 70, Math.PI, 0);
    g.fill();
    g.fillRect(cx - 6, H - 340, 12, 80);
    for (let k = -3; k <= 3; k++) {
      g.fillStyle = "#ffb347";
      g.beginPath();
      g.arc(cx + k * 26, H - 150, 4, 0, Math.PI * 2);
      g.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- GPU particle pool (additive glowing points) ---------- */

const PARTICLE_VERT = `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`;

const PARTICLE_FRAG = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = clamp(1.0 - d, 0.0, 1.0);
  a = a * a * (3.0 - 2.0 * a) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}`;

class ParticlePool {
  readonly points: THREE.Points;
  readonly uniforms = { uScale: { value: 800 } };
  private readonly n: number;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly size: Float32Array;
  private readonly alpha: Float32Array;
  private readonly vel: Float32Array;
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly base: Float32Array;
  private readonly grav: Float32Array;
  private readonly drag: Float32Array;
  private readonly flick: Float32Array;
  private readonly seed: Float32Array;
  private readonly geo: THREE.BufferGeometry;
  private readonly mat: THREE.ShaderMaterial;
  private next = 0;
  private hi = 0;
  private time = 0;

  constructor(n: number) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n);
    this.base = new Float32Array(n);
    this.grav = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.flick = new Float32Array(n);
    this.seed = new Float32Array(n);

    this.geo = new THREE.BufferGeometry();
    const attr = (arr: Float32Array, itemSize: number) => {
      const a = new THREE.BufferAttribute(arr, itemSize);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    this.geo.setAttribute("position", attr(this.pos, 3));
    this.geo.setAttribute("aColor", attr(this.col, 3));
    this.geo.setAttribute("aSize", attr(this.size, 1));
    this.geo.setAttribute("aAlpha", attr(this.alpha, 1));

    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
  }

  spawn(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    life: number, c: RGB, size: number,
    grav = 0, drag = 0, flick = 0
  ) {
    let idx = this.next;
    for (let j = 0; j < this.n; j++) {
      const k = (this.next + j) % this.n;
      if (this.life[k] <= 0) {
        idx = k;
        break;
      }
    }
    this.next = (idx + 1) % this.n;
    const i3 = idx * 3;
    this.pos[i3] = x;
    this.pos[i3 + 1] = y;
    this.pos[i3 + 2] = z;
    this.vel[i3] = vx;
    this.vel[i3 + 1] = vy;
    this.vel[i3 + 2] = vz;
    this.col[i3] = c[0];
    this.col[i3 + 1] = c[1];
    this.col[i3 + 2] = c[2];
    this.life[idx] = life;
    this.maxLife[idx] = life;
    this.base[idx] = size;
    this.size[idx] = size;
    this.alpha[idx] = 1;
    this.grav[idx] = grav;
    this.drag[idx] = drag;
    this.flick[idx] = flick;
    this.seed[idx] = Math.random() * 6.28;
    if (idx + 1 > this.hi) this.hi = idx + 1;
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    for (let k = 0; k < this.hi; k++) {
      if (this.life[k] <= 0) continue;
      const life = this.life[k] - dt;
      this.life[k] = life;
      if (life <= 0) {
        this.alpha[k] = 0;
        this.size[k] = 0;
        continue;
      }
      const i3 = k * 3;
      this.vel[i3 + 1] -= this.grav[k] * dt;
      const damp = Math.exp(-this.drag[k] * dt);
      this.vel[i3] *= damp;
      this.vel[i3 + 1] *= damp;
      this.vel[i3 + 2] *= damp;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;

      const lf = life / this.maxLife[k];
      let a = Math.min(1, lf * 1.6);
      if (this.flick[k] > 0) a *= 0.35 + 0.65 * Math.max(0, Math.sin(t * 38 + this.seed[k]));
      this.alpha[k] = a;
      this.size[k] = this.base[k] * (0.35 + 0.65 * lf);
    }
    for (const name of ["position", "aColor", "aSize", "aAlpha"]) {
      (this.geo.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

/* ---------- The scene ---------- */

export class DiwaliScene {
  private readonly host: HTMLElement;
  private readonly cb: SceneCallbacks;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly composer: EffectComposer;
  private readonly particles: ParticlePool;
  private readonly glowTex: THREE.CanvasTexture;
  private readonly flameTex: THREE.CanvasTexture;
  private readonly coreTex: THREE.CanvasTexture;
  private warm!: THREE.PointLight;
  private stars!: THREE.Points;
  private readonly diyas: Diya[] = [];
  private readonly lanterns: Lantern[] = [];
  private rockets: Rocket[] = [];
  private effects: Effect[] = [];
  private timers: Timer[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly skyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -SKY_Z);
  private readonly hitPoint = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();
  private elapsed = 0;
  private last = performance.now();
  private rafId = 0;
  private shake = 0;
  private mx = 0;
  private my = 0;
  private px = 0;
  private py = 0;
  private showLeft = 0;
  private showNext = 0;
  private showBomb = 4;
  private autoT = 1.2;
  private dragging = false;
  private moved = 0;
  private lastX = 0;
  private lastY = 0;
  private lastSpark = 0;
  private pending: { x: number; y: number; id: number } | null = null;
  private disposed = false;

  constructor(host: HTMLElement, cb: SceneCallbacks = {}) {
    this.host = host;
    this.cb = cb;
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    this.camera.position.set(0, 5, 30);
    this.camera.lookAt(0, 12, -6);

    this.glowTex = makeRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.22, "rgba(255,226,170,0.9)"],
      [0.55, "rgba(255,140,50,0.25)"],
      [1, "rgba(255,110,30,0)"],
    ]);
    this.flameTex = makeRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.35, "rgba(255,220,120,0.95)"],
      [0.7, "rgba(255,120,30,0.35)"],
      [1, "rgba(255,80,20,0)"],
    ]);
    this.coreTex = makeRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.5, "rgba(255,255,255,0.7)"],
      [1, "rgba(255,255,255,0)"],
    ]);

    this.buildEnvironment();
    this.buildDiyas();
    this.buildLanterns();

    this.particles = new ParticlePool(9000);
    this.scene.add(this.particles.points);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.75, 0.5, 0.25));
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    this.rafId = requestAnimationFrame(this.frame);
  }

  /* ----- Environment ----- */

  private buildEnvironment() {
    const s = this.scene;
    s.fog = new THREE.FogExp2(0x1b0a26, 0.006);

    // Gradient sky dome
    s.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(300, 32, 16),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          vertexShader: `varying vec3 vDir;
            void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `varying vec3 vDir;
            void main(){
              float h = vDir.y;
              vec3 horizon = vec3(0.26, 0.07, 0.05);
              vec3 mid = vec3(0.045, 0.014, 0.1);
              vec3 top = vec3(0.006, 0.004, 0.022);
              vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.25, h));
              col = mix(col, top, smoothstep(0.2, 0.75, h));
              gl_FragColor = vec4(col, 1.0);
            }`,
        })
      )
    );

    // Stars
    const starCount = 1800;
    const sp = new Float32Array(starCount * 3);
    const sc = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const v = randomUnit();
      v.y = Math.abs(v.y) * 0.9 + 0.02;
      v.normalize().multiplyScalar(180);
      sp.set([v.x, v.y, v.z], i * 3);
      const b = rand(0.35, 1);
      const warm = Math.random() < 0.2;
      sc.set(warm ? [b, b * 0.85, b * 0.6] : [b * 0.8, b * 0.9, b], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
    this.stars = new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        size: 1.6,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        fog: false,
      })
    );
    s.add(this.stars);

    // Moon
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(6, 36, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.42, 1.2), fog: false })
    );
    moon.position.set(-42, 44, -130);
    s.add(moon);
    const moonGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTex,
        color: new THREE.Color(0.7, 0.62, 0.45),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        fog: false,
      })
    );
    moonGlow.scale.setScalar(70);
    moonGlow.position.copy(moon.position);
    s.add(moonGlow);

    // Skyline silhouette
    const skyline = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 56),
      new THREE.MeshBasicMaterial({ map: skylineTexture(), transparent: true, depthWrite: false, fog: false })
    );
    skyline.position.set(0, 24, -70);
    s.add(skyline);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      new THREE.MeshStandardMaterial({ color: 0x140a1c, roughness: 0.92, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    s.add(ground);

    // Rangoli on the courtyard floor
    const rangoli = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({ map: rangoliTexture(), transparent: true, depthWrite: false, opacity: 0.95 })
    );
    rangoli.rotation.x = -Math.PI / 2;
    rangoli.position.set(0, 0.03, 4);
    s.add(rangoli);

    // Lights
    s.add(new THREE.AmbientLight(0x6b5a9a, 0.5));
    s.add(new THREE.HemisphereLight(0x8a7ad8, 0x2a0d12, 0.6));
    const moonLight = new THREE.DirectionalLight(0xaec2ff, 0.8);
    moonLight.position.set(-40, 60, 30);
    s.add(moonLight);
    this.warm = new THREE.PointLight(0xffa24a, 0, 90, 1.4);
    this.warm.position.set(0, 3, -6);
    s.add(this.warm);
  }

  private buildDiyas() {
    const profile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.26, 0.02),
      new THREE.Vector2(0.44, 0.16),
      new THREE.Vector2(0.52, 0.3),
      new THREE.Vector2(0.46, 0.37),
      new THREE.Vector2(0.22, 0.3),
      new THREE.Vector2(0.0, 0.26),
    ];
    const bodyGeo = new THREE.LatheGeometry(profile, 28);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb85a22, roughness: 0.4, metalness: 0.15 });
    const oilGeo = new THREE.CircleGeometry(0.4, 24);
    const wickGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

    const rows: [number, number, number, number][] = [
      [-7, 13, 15, 1.0],
      [-15, 11, 12, 0.9],
    ];
    for (const [z, count, span, scale] of rows) {
      for (let i = 0; i < count; i++) {
        const x = -span + (2 * span * i) / (count - 1);
        const group = new THREE.Group();
        group.position.set(x, 0, z + 0.02 * x * x);
        group.scale.setScalar(scale);

        const oil = new THREE.MeshStandardMaterial({
          color: 0x5a2a0c,
          emissive: 0xff8a1f,
          emissiveIntensity: 0,
          roughness: 0.3,
        });
        const oilMesh = new THREE.Mesh(oilGeo, oil);
        oilMesh.rotation.x = -Math.PI / 2;
        oilMesh.position.y = 0.27;

        const wick = new THREE.Mesh(wickGeo, wickMat);
        wick.position.y = 0.34;

        const flameMat = new THREE.SpriteMaterial({
          map: this.flameTex,
          color: new THREE.Color(2.4, 1.5, 0.55),
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        });
        const flame = new THREE.Sprite(flameMat);
        flame.scale.set(0.42, 0.75, 1);
        flame.position.y = 0.62;

        const coreMat = new THREE.SpriteMaterial({
          map: this.coreTex,
          color: new THREE.Color(3, 2.8, 2.2),
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        });
        const core = new THREE.Sprite(coreMat);
        core.scale.set(0.18, 0.32, 1);
      
