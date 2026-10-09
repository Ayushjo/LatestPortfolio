import { gsap } from 'gsap';
import { OrthographicCamera, type WebGPURenderer } from 'three/webgpu';
import { progress } from '../scripts/scroll';
import { Input } from './input';
import { createPipeline, type Pipeline } from './post/pipeline';
import type { Quality } from './quality';
import { createRenderer } from './renderer';
import { StreamScene, type BeatSpec, type StreamHooks } from './scenes/StreamScene';
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
    this.post.pipeline.render();
    this.watchFrameRate(deltaMs);
  };

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
    const view = currentView();
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.applyCamera(view);
    this.stream.resize(view);
  };
}
