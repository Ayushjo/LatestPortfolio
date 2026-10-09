import { dot, mix, texture, uniform, uv, vec3 } from 'three/tsl';
import { Mesh, MeshBasicNodeMaterial, PlaneGeometry, SRGBColorSpace, Texture, VideoTexture, type Scene } from 'three/webgpu';

export interface WorldRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

const SILVER = vec3(0.93, 0.95, 1.0);

/**
 * A project demo playing inside the particle frame. Monochrome silver by default (the
 * post pipeline dithers it like everything else); hovering fades it to full colour.
 */
export class DemoPlane {
  readonly u = { opacity: uniform(0), colour: uniform(0), invert: uniform(0) };
  private target = { opacity: 0, colour: 0 };
  private video = document.createElement('video');
  private videoTexture: VideoTexture | null = null;
  private map = texture(new Texture());
  private mesh: Mesh;
  private delay = 0;
  rect: WorldRect | null = null;

  constructor(scene: Scene) {
    Object.assign(this.video, { muted: true, loop: true, playsInline: true, preload: 'auto' });
    this.video.setAttribute('aria-hidden', 'true');
    this.video.addEventListener('loadeddata', () => (this.u.invert.value = averageLuma(this.video) > 0.55 ? 1 : 0));

    const mat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    const rgb = this.map.sample(uv()).rgb;
    const lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    // Light-UI clips are shown inverted in silver so they sit in the dark page instead of glaring.
    const mono = mix(lum, lum.oneMinus(), this.u.invert).pow(1.15).mul(0.8);
    mat.colorNode = mix(SILVER.mul(mono), rgb, this.u.colour);
    mat.opacityNode = this.u.opacity;
    this.mesh = new Mesh(new PlaneGeometry(1, 1), mat);
    this.mesh.position.z = -1;
    this.mesh.renderOrder = -1;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  get active() {
    return this.target.opacity > 0;
  }

  /** Start a clip; it fades in once the particles have had time to form the frame. */
  show(src: string, rect: WorldRect, delay = 0.9) {
    this.rect = rect;
    this.mesh.position.set(rect.cx, rect.cy, -1);
    this.mesh.scale.set(rect.w, rect.h, 1);
    if (this.video.getAttribute('src') !== src) {
      this.video.src = src;
      this.videoTexture?.dispose();
      this.videoTexture = new VideoTexture(this.video);
      this.videoTexture.colorSpace = SRGBColorSpace;
      this.map.value = this.videoTexture;
    }
    void this.video.play().catch(() => {});
    this.mesh.visible = true;
    this.delay = delay;
    this.target.opacity = 1;
  }

  hide() {
    this.target.opacity = 0;
    this.target.colour = 0;
  }

  setColour(on: boolean) {
    this.target.colour = on && this.active ? 1 : 0;
  }

  update(dt: number) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    const k = 1 - Math.exp(-dt * 5);
    this.u.opacity.value += (this.target.opacity - this.u.opacity.value) * k;
    this.u.colour.value += (this.target.colour - this.u.colour.value) * k;
    if (this.target.opacity === 0 && this.u.opacity.value < 0.01 && this.mesh.visible) {
      this.u.opacity.value = 0;
      this.mesh.visible = false;
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
      this.videoTexture?.dispose();
      this.videoTexture = null;
      this.rect = null;
    }
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
