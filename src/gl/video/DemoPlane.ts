import { uniform, uv } from 'three/tsl';
import { DataTexture, Mesh, MeshBasicNodeMaterial, PlaneGeometry, SRGBColorSpace, VideoTexture, type Scene } from 'three/webgpu';
import type { Uniforms } from '../particles/uniforms';

export interface WorldRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/**
 * A project demo. The clip first plays *through the particles* (they sample the same
 * texture), then this crisp, true-colour plane fades in over them.
 */
export class DemoPlane {
  readonly u = { opacity: uniform(0), gain: uniform(1) };
  readonly video = document.createElement('video');
  private target = 0;
  private videoTexture: VideoTexture | null = null;
  /** Black, so particles never flash white while a clip has no frame yet. */
  private placeholder = blackTexture();
  private mesh: Mesh;
  private delay = 0;
  rect: WorldRect | null = null;

  constructor(
    scene: Scene,
    private shared: Uniforms,
  ) {
    Object.assign(this.video, { muted: true, loop: true, playsInline: true, preload: 'auto' });
    this.video.setAttribute('aria-hidden', 'true');
    // Light-UI clips are dimmed a touch so they don't glare out of the dark page.
    this.video.addEventListener('loadeddata', () => (this.u.gain.value = averageLuma(this.video) > 0.55 ? 0.6 : 1));

    const mat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    mat.colorNode = shared.videoMap.sample(uv()).rgb.mul(this.u.gain);
    mat.opacityNode = this.u.opacity;
    this.mesh = new Mesh(new PlaneGeometry(1, 1), mat);
    this.mesh.position.z = 1;
    this.mesh.renderOrder = 10;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  get active() {
    return this.target > 0;
  }

  /** Start a clip now (the particles show it); the crisp plane fades in after `delay` seconds. */
  show(src: string, rect: WorldRect, delay: number) {
    this.rect = rect;
    this.mesh.position.set(rect.cx, rect.cy, 1);
    this.mesh.scale.set(rect.w, rect.h, 1);
    if (this.video.getAttribute('src') !== src) {
      this.video.src = src;
      this.videoTexture?.dispose();
      this.videoTexture = new VideoTexture(this.video);
      this.videoTexture.colorSpace = SRGBColorSpace;
    }
    this.shared.videoMap.value = this.videoTexture!;
    this.video.currentTime = 0;
    void this.video.play().catch(() => {});
    this.mesh.visible = true;
    this.delay = delay;
    this.target = 1;
  }

  hide() {
    this.target = 0;
    this.delay = 0;
  }

  /** 0 → 1 as the crisp plane fades in. */
  get crisp() {
    return this.u.opacity.value;
  }

  /** True once the clip has a decoded frame the particles can sample. */
  get ready() {
    return this.video.readyState >= 2;
  }

  get progress() {
    const d = this.video.duration;
    return d > 0 ? this.video.currentTime / d : 0;
  }

  update(dt: number) {
    if (this.delay > 0) {
      // The countdown only runs once there is a frame to show.
      if (this.ready) this.delay -= dt;
      return;
    }
    const rate = this.target ? 2.2 : 6;
    this.u.opacity.value += (this.target - this.u.opacity.value) * (1 - Math.exp(-dt * rate));
    if (this.target === 0 && this.u.opacity.value < 0.01 && this.mesh.visible) {
      this.u.opacity.value = 0;
      this.mesh.visible = false;
    }
  }

  /** Free the clip once the particles no longer need it either. */
  release() {
    if (this.active || !this.videoTexture) return;
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
    this.shared.videoMap.value = this.placeholder;
    this.videoTexture.dispose();
    this.videoTexture = null;
    this.rect = null;
  }

  dispose() {
    this.video.pause();
    this.videoTexture?.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshBasicNodeMaterial).dispose();
  }
}

/** Mean luminance of the current frame, from a tiny downscaled copy. */
function averageLuma(video: HTMLVideoElement): number {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 20;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;
  return sum / (d.length / 4) / 255;
}

function blackTexture() {
  const t = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}
