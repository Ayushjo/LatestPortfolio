import { gsap } from 'gsap';
import { Scene as ThreeScene, type WebGPURenderer } from 'three/webgpu';
import type { ScrollProgress, ShapeSide } from '../../scripts/scroll';
import type { Input } from '../input';
import { ParticleSystem } from '../particles/ParticleSystem';
import { createUniforms } from '../particles/uniforms';
import type { Quality } from '../quality';
import { isStream, shapeCanvas } from '../shapes';
import { sampleInk, type Placement, type PointCloud } from '../shapes/sample';
import { sampleText } from '../text/sampleText';
import type { Scene, View } from './Scene';

export interface StreamHooks {
  onFormed?: () => void;
}

export interface BeatSpec {
  key: string;
  side: ShapeSide;
}

const INTRO_DELAY = 0.8;
const FORM_DURATION = 2.6;
const HOLD = 3.4;
const MORPH_DURATION = 2.8;
/** Point clouds are 16 bytes per particle (4 MB at 262k), so only keep a handful. */
const CACHE_LIMIT = 10;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * One particle field for the whole page.
 * Hero: stream → "AYUSH" → "SYSTEMS ENGINEER" → back, forever; scrolling dissolves the word
 * into an orbiting disc. Beats: the disc releases into one shape per beat (projects,
 * experience, …), morphing beat to beat as the page scrolls. `stream` beats let it flow free.
 */
export class StreamScene implements Scene {
  readonly root = new ThreeScene();
  readonly u = createUniforms();
  readonly particles: ParticleSystem;
  /** Hero choreography on one timeline so it can be paused and seeked. */
  readonly timeline = gsap.timeline({ paused: true });

  private view: View | null = null;
  private layoutToken = 0;
  private words: [PointCloud, PointCloud] | null = null;
  /** Insertion-ordered, so the first key is the least recently used. */
  private clouds = new Map<string, PointCloud | null>();
  private building = new Set<string>();
  private loaded = '';
  private mode: 'words' | 'beats' = 'words';
  private heroMorph = 0;
  private pairBrightness: [number, number] = [0.2, 0.2];
  private override: BeatSpec | null = null;
  private overrideMix = { value: 0, target: 0 };
  private idleHandle = 0;
  private offClick: () => void;

  constructor(
    private renderer: WebGPURenderer,
    private quality: Quality,
    private input: Input,
    private beats: BeatSpec[],
    private hooks: StreamHooks = {},
    private calm = false,
  ) {
    this.particles = new ParticleSystem(quality.count, this.u);
    this.root.add(this.particles.mesh);
    this.offClick = input.onClick((x, y) => this.shock(x, y));
    if (calm) {
      this.u.streamSpeed.value = 0.45;
      this.u.shockForce.value = 0;
      this.u.detour.value = 0.5;
    }
  }

  async init(view: View): Promise<void> {
    this.applyView(view);
    await this.layoutWords(view);
    await this.particles.init(this.renderer);
    this.play();
    this.prefetch([0, 1]);
  }

  update(time: number, dt: number, progress: ScrollProgress): void {
    const { u, input, view } = this;
    if (!view) return;
    u.time.value = time;
    u.dt.value = Math.min(dt, 1 / 30);
    u.scroll.value = progress.hero;
    u.pointer.value.set(input.x * view.halfW, input.y * view.halfH);
    u.pointerSpeed.value = this.calm ? 0 : input.speed;
    u.pointerActive.value = input.active ? 1 : 0;
    u.beatIn.value = progress.beatIn;
    this.stepOverride(u.dt.value);

    if (progress.beatIn > 0.001 && this.beats.length > 0) this.showBeat(progress);
    else this.showWords();

    const [ba, bb] = this.pairBrightness;
    u.brightness.value = ba + (bb - ba) * u.morph.value;
    this.particles.step(this.renderer);
  }

  /** Temporarily form a shape that isn't on the scroll path (hovered card, demo frame). */
  setOverride(spec: BeatSpec | null): void {
    if (spec) {
      this.override = spec;
      void this.ensure(spec);
    }
    this.overrideMix.target = spec ? 1 : 0;
  }

  /** Eased on the simulation clock (not a tween) so it stays in step with `advance()`. */
  private stepOverride(dt: number) {
    const o = this.overrideMix;
    o.value += (o.target - o.value) * (1 - Math.exp(-dt * 4.5));
    if (o.target === 0 && o.value < 0.002) {
      o.value = 0;
      this.override = null;
    }
  }

  resize(view: View): void {
    this.applyView(view);
    this.clouds.clear();
    this.loaded = '';
    void this.layoutWords(view);
  }

  dispose(): void {
    this.timeline.kill();
    this.offClick();
    cancelIdle(this.idleHandle);
    this.particles.dispose();
  }

  /** Dev: restart the simulation from scratch with the timeline paused at 0. */
  async reset(): Promise<void> {
    this.timeline.pause(0);
    this.u.time.value = 0;
    this.u.form.value = 0;
    this.u.morph.value = 0;
    await this.particles.init(this.renderer);
  }

  private showWords() {
    if (this.mode === 'beats') {
      this.mode = 'words';
      this.u.morph.value = this.heroMorph;
      this.u.workIn.value = 0;
      this.timeline.resume();
    }
    if (this.words) this.load('words', this.words[0], this.words[1]);
  }

  private showBeat(progress: ScrollProgress) {
    if (this.mode === 'words') {
      this.mode = 'beats';
      this.heroMorph = this.u.morph.value;
      this.timeline.pause();
    }
    const last = this.beats.length - 1;
    const k = Math.max(0, Math.min(last, Math.floor(progress.beat)));
    const next = Math.min(k + 1, last);
    const a = this.beats[k]!;
    let b = this.beats[next]!;
    // Hold each shape while its story is on screen; morph as the next beat scrolls in.
    let m = next === k ? 0 : smoothstep(0.45, 0.95, progress.beat - k);
    if (this.override) {
      b = this.override;
      m = this.overrideMix.value;
    }

    const ca = this.cloud(a);
    const cb = this.cloud(b);
    this.prefetch([k - 1, k, k + 1, k + 2]);
    if (ca === undefined || cb === undefined) return; // still building: keep the current targets

    const formA = isStream(a.key) ? 0 : 1;
    const formB = isStream(b.key) ? 0 : 1;
    // A stream beat has no targets of its own: borrow the neighbour's so only `form` changes.
    const A = ca ?? cb;
    const B = cb ?? ca;
    if (A && B) this.load(`${id(a)}→${id(b)}`, A, B);
    this.u.morph.value = m;
    this.u.workIn.value = progress.beatIn * (formA + (formB - formA) * m);
  }

  /** Swap the A/B target buffers. Only happens where morph is 0 or 1, so it is seamless. */
  private load(key: string, a: PointCloud, b: PointCloud) {
    if (key === this.loaded || !this.view) return;
    this.particles.setTargets('targetA', a.data);
    this.particles.setTargets('targetB', b.data);
    this.pairBrightness = [this.brightnessFor(a.inkArea, this.view), this.brightnessFor(b.inkArea, this.view)];
    this.loaded = key;
  }

  /** The beat's point cloud: `null` for stream, `undefined` while it is still being built. */
  private cloud(spec: BeatSpec): PointCloud | null | undefined {
    if (isStream(spec.key)) return null;
    const k = id(spec);
    const hit = this.clouds.get(k);
    if (hit !== undefined) {
      this.clouds.delete(k);
      this.clouds.set(k, hit);
      return hit;
    }
    void this.ensure(spec);
    return undefined;
  }

  private async ensure(spec: BeatSpec) {
    const k = id(spec);
    if (isStream(spec.key) || this.clouds.has(k) || this.building.has(k) || !this.view) return;
    this.building.add(k);
    const view = this.view;
    try {
      const canvas = await shapeCanvas(spec.key);
      if (view !== this.view) return;
      this.clouds.set(k, canvas ? sampleInk(canvas, this.quality.count, this.placement(spec.side, view)) : null);
      while (this.clouds.size > CACHE_LIMIT) this.clouds.delete(this.clouds.keys().next().value!);
    } finally {
      this.building.delete(k);
    }
  }

  /** Build neighbouring beats during idle time so scrolling never waits on them. */
  private prefetch(indices: number[]) {
    const todo = indices
      .filter((i) => i >= 0 && i < this.beats.length)
      .map((i) => this.beats[i]!)
      .filter((s) => !isStream(s.key) && !this.clouds.has(id(s)) && !this.building.has(id(s)));
    if (!todo.length || this.idleHandle) return;
    this.idleHandle = requestIdle(async () => {
      this.idleHandle = 0;
      await this.ensure(todo[0]!);
      if (todo.length > 1) this.prefetch(indices);
    });
  }

  /** Shapes sit opposite their story on wide screens, above it on tall ones. */
  private placement(side: ShapeSide, view: View): Placement {
    const wide = view.halfW / view.halfH > 1.15;
    if (!wide) return { centerX: 0, centerY: view.halfH * 0.42, maxWidth: view.halfW * 1.7, maxHeight: view.halfH * 0.72 };
    if (side === 'center')
      return { centerX: 0, centerY: view.halfH * 0.2, maxWidth: view.halfW * 1.5, maxHeight: view.halfH * 0.9 };
    const s = side === 'right' ? 1 : -1;
    return { centerX: s * view.halfW * 0.44, centerY: 0, maxWidth: view.halfW * 0.78, maxHeight: view.halfH * 1.3 };
  }

  private applyView(view: View) {
    this.view = view;
    this.u.halfW.value = view.halfW;
    this.u.halfH.value = view.halfH;
    this.u.size.value = this.quality.particlePx * view.unitsPerPx;
    this.u.cursorRadius.value = Math.max(0.55, Math.min(0.9, view.halfH * 0.15));
    this.u.vortex.value.set(0, view.halfH * 0.18);
  }

  private async layoutWords(view: View) {
    const token = ++this.layoutToken;
    const w = view.halfW * 2;
    const h = view.halfH * 2;
    const wide = view.halfW / view.halfH > 1.15;

    const [a, b] = await Promise.all([
      sampleText({ lines: ['Ayush'], worldWidth: Math.min(w * 0.7, h * 1.3), centerY: h * 0.02 }, this.quality.count),
      sampleText(
        wide
          ? { lines: ['Systems Engineer'], worldWidth: Math.min(w * 0.8, h * 2.4), centerY: h * 0.02 }
          : { lines: ['Systems', 'Engineer'], worldWidth: w * 0.84, centerY: h * 0.02 },
        this.quality.count,
      ),
    ]);
    if (token !== this.layoutToken) return;
    this.words = [a, b];
    this.loaded = '';
    if (this.mode === 'words') this.load('words', a, b);
  }

  /**
   * Additive particles stack up: scale brightness so a formed shape lands just under white
   * regardless of particle count, screen size or how much ink the shape has.
   */
  private brightnessFor(inkArea: number, view: View) {
    const inkPx = inkArea / (view.unitsPerPx * view.unitsPerPx);
    const px = this.quality.particlePx;
    const overlap = (this.quality.count * 0.785 * px * px) / Math.max(1, inkPx);
    return Math.min(1, Math.max(0.03, 0.95 / overlap));
  }

  private play() {
    const { u } = this;
    const loop = gsap
      .timeline({ repeat: -1 })
      .to(u.morph, { value: 1, duration: MORPH_DURATION, ease: 'power2.inOut' })
      .to({}, { duration: HOLD })
      .to(u.morph, { value: 0, duration: MORPH_DURATION, ease: 'power2.inOut' })
      .to({}, { duration: HOLD });
    this.timeline
      .to(u.form, { value: 1, duration: FORM_DURATION, ease: 'power2.inOut' }, INTRO_DELAY)
      .call(() => this.hooks.onFormed?.(), [], INTRO_DELAY + FORM_DURATION * 0.55)
      .add(loop, INTRO_DELAY + FORM_DURATION + HOLD)
      .play(0);
  }

  private shock(x: number, y: number) {
    if (!this.view || this.calm) return;
    this.u.shockPos.value.set(x * this.view.halfW, y * this.view.halfH);
    this.u.shockTime.value = this.u.time.value;
  }
}

const id = (s: BeatSpec) => `${s.key}@${s.side}`;

// Safari has no requestIdleCallback.
const hasIdle = typeof requestIdleCallback === 'function';
const requestIdle = (fn: () => void): number =>
  hasIdle ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 60);
const cancelIdle = (h: number) => (hasIdle ? cancelIdleCallback(h) : clearTimeout(h));
