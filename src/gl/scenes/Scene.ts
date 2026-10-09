import type { Scene as ThreeScene } from 'three/webgpu';
import type { ScrollProgress } from '../../scripts/scroll';

export interface View {
  /** Half extents of the visible world rect (orthographic camera). */
  halfW: number;
  halfH: number;
  /** World units per CSS pixel. */
  unitsPerPx: number;
}

export interface Scene {
  readonly root: ThreeScene;
  init(view: View): Promise<void>;
  update(time: number, dt: number, progress: ScrollProgress): void;
  resize(view: View): void;
  dispose(): void;
}
