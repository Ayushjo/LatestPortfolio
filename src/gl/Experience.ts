import { gsap } from 'gsap';
import { OrthographicCamera, type WebGPURenderer } from 'three/webgpu';
import { progress } from '../scripts/scroll';
import { Input } from './input';
import { createPipeline, type Pipeline } from './post/pipeline';
import type { Quality } from './quality';
import { createRenderer } from './renderer';
import { StreamScene, type BeatSpec, type StreamHooks } from './scenes/StreamScene';
import { DemoPlane } from './video/DemoPlane';
import type { ShapeSide } from '../scripts/scroll';
import type { View } from './scenes/Scene';

export interface ExperienceHooks extends StreamHooks {
  /** Sustained low frame rate: the caller should reboot one tier lower. */
  onSlow?: () => void;
}

const WORLD_HEIGHT = 10;

function currentView(): View {
  const halfH = WORLD_HEIGHT / 2;
  return { halfH, halfW: halfH * (innerWidth / innerHeight), unitsPerPx: WORLD_HEIGHT / innerHeight };
}

/** Owns the renderer, camera, post chain and active scene; driven by the GSAP ticker. */
export class Experience {
  private camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private input = new Input();
  readonly stream: StreamScene;
  private post: Pipeline;
  private demo: DemoPlane;
  private disposed = false;
  private frameTimes: number[] = [];
  private bootTime = performance.now();
  private slowReported = false;

  private constructor(
    readonly renderer: WebGPURenderer,
    readonly quality: Quality,
    private hooks: ExperienceHooks,
    calm: boolean,
    beats: BeatSpec[],
  ) {
    this.stream = new StreamScene(renderer, quality, this.input, beats, hooks, calm);
    this.post = createPipeline(renderer, this.stream.root, this.camera, quality, this.stream.u.time);
    this.demo = new DemoPlane(this.stream.root, this.stream.u);
  }

  static async boot(
    canvas: HTMLCanvasElement,
    q: Quality,
    opts: { hooks?: ExperienceHooks; calm?: boolean; beats?: BeatSpec[] } = {},
  ): Promise<Experience> {
    const renderer = await createRenderer(canvas, q);
    const exp = new Experience(renderer, q, opts.hooks ?? {}, opts.calm ?? false, opts.beats ?? []);
    const view = currentView();
    exp.applyCamera(view);
    await exp.stream.init(view);
    gsap.ticker.add(exp.tick);
    window.addEventListener('resize', exp.onResize);
    if (new URLSearchParams(location.search).has('debug')) {
      const { mountDebug } = await import('./debug');
      exp.gui = mountDebug(exp.stream.u, exp.post.uniforms);
    }
    return exp;
  }

  /**
   * Play a project demo on `side`: the particles fly into a 16:10 screen and show the clip
   * as moving dots, then the crisp clip fades in over them.
   */
  showDemo(src: string, side: ShapeSide): void {
    const r = this.stream.stage(side, currentView());
    this.stream.u.videoRect.value.set(r.cx - r.w / 2, r.cy - r.h / 2, r.w, r.h);
    this.stream.setOverride({ key: 'screen', side });
    this.demo.show(src, r, 2.4);
  }

  hideDemo(): void {
    if (!this.demo.active) return;
    this.demo.hide();
    this.stream.setOverride(null);
  }

  /** Tall screens play demos inline in the panel: release the shape so it doesn't sit behind the clip. */
  quietShape(on: boolean): void {
    if (this.demo.active) return;
    this.quiet.target = on ? 1 : 0;
    this.stream.setOverride(on ? { key: 'stream', side: 'center' } : null);
  }
  private quiet = { value: 0, target: 0 };
  private waiting = { value: 0 };

  /** The playing clip, for the page's progress line and captions. */
  get demoVideo(): HTMLVideoElement | null {
    return this.demo.active ? this.demo.video : null;
  }

  /** The playing clip's rectangle in CSS pixels, for the progress line and captions. */
  demoScreenRect(): DOMRect | null {
    const r = this.demo.rect;
    if (!r || !this.demo.active) return null;
    const view = currentView();
    const toX = (x: number) => (x / view.halfW + 1) * 0.5 * innerWidth;
    const toY = (y: number) => (1 - (y / view.halfH + 1) * 0.5) * innerHeight;
    return new DOMRect(toX(r.cx - r.w / 2), toY(r.cy + r.h / 2), (r.w / (2 * view.halfW)) * innerWidth, (r.h / (2 * view.halfH)) * innerHeight);
  }

  /**
   * Dev only: fast-forward the timelines and simulation at a fixed step, then draw once.
   * Lets headless/hidden previews (where requestAnimationFrame is paused) be inspected.
   */
  advance(seconds: number, fps = 60): void {
    if (!this.frozen) {
      this.frozen = true;
      gsap.ticker.remove(this.tick);
      this.simTime = this.stream.timeline.time();
      this.stream.timeline.pause();
    }
    const dt = 1 / fps;
    for (let k = 0; k < Math.round(seconds * fps); k++) {
      this.simTime += dt;
      this.stream.timeline.time(this.simTime);
      this.input.update(dt);
      this.stream.update(this.simTime, dt, progress);
      this.stepDemo(dt);
    }
    this.post.pipeline.render();
  }

  /** Dev: freeze real-time playback and restart the hero from t = 0. */
  async restart(): Promise<void> {
    this.frozen = true;
    gsap.ticker.remove(this.tick);
    this.simTime = 0;
    await this.stream.reset();
  }

  private gui: { destroy(): void } | null = null;
  private frozen = false;
  private simTime = 0;

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    window.removeEventListener('resize', this.onResize);
    this.gui?.destroy();
    this.demo.dispose();
    this.stream.dispose();
    this.input.dispose();
    this.post.pipeline.dispose();
    this.renderer.dispose();
  }

  private tick = (time: number, deltaMs: number) => {
    if (this.disposed) return;
    const dt = deltaMs / 1000;
    this.input.update(dt);
    this.stream.update(time, dt, progress);
    this.stepDemo(dt);
    this.post.pipeline.render();
    this.watchFrameRate(deltaMs);
  };

  private stepDemo(dt: number) {
    const { demo, stream } = this;
    demo.update(dt);
    const u = stream.u;
    const want = demo.active && demo.ready ? 1 : 0;
    // Particles carry the clip while they fly in; they let go of it gently on the way out.
    u.videoMix.value += (want - u.videoMix.value) * (1 - Math.exp(-dt * (want ? 2.5 : 1.2)));
    const q = this.quiet;
    q.value += (q.target - q.value) * (1 - Math.exp(-dt * 3));
    // A screen still waiting for its first frame glows softly rather than as a white slab.
    const w = this.waiting;
    w.value += ((demo.active && !demo.ready ? 1 : 0) - w.value) * (1 - Math.exp(-dt * 4));
    u.particleDim.value = (1 - 0.88 * demo.crisp) * (1 - 0.7 * w.value);
    u.fieldDim.value = 1 - 0.65 * q.value;
    if (!demo.active && u.videoMix.value < 0.01) demo.release();

    const pu = this.post.uniforms;
    pu.clearAmt.value = demo.crisp;
    const r = this.demoScreenRect();
    if (r) pu.clearRect.value.set(r.left / innerWidth, r.top / innerHeight, r.right / innerWidth, r.bottom / innerHeight);
  }

  private watchFrameRate(deltaMs: number) {
    if (this.slowReported || performance.now() - this.bootTime < 4000) return;
    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length < 120) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1000 / 40) {
      this.slowReported = true;
      this.hooks.onSlow?.();
    }
  }

  private applyCamera(view: View) {
    const c = this.camera;
    c.left = -view.halfW;
    c.right = view.halfW;
    c.top = view.halfH;
    c.bottom = -view.halfH;
    c.updateProjectionMatrix();
  }

  private onResize = () => {
    this.hideDemo();
    const view = currentView();
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.applyCamera(view);
    this.stream.resize(view);
  };
}
