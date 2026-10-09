import { instancedArray } from 'three/tsl';
import { Sprite, type ComputeNode, type WebGPURenderer } from 'three/webgpu';
import { createInit, createUpdate } from './compute';
import { createMaterial } from './material';
import type { Uniforms } from './uniforms';

function vec4Buffer(count: number) {
  return instancedArray(count, 'vec4');
}

export type Buffers = {
  pos: ReturnType<typeof vec4Buffer>;
  vel: ReturnType<typeof vec4Buffer>;
  targetA: ReturnType<typeof vec4Buffer>;
  targetB: ReturnType<typeof vec4Buffer>;
};

/** GPU particle buffers + compute passes + the instanced sprite that draws them. */
export class ParticleSystem {
  readonly mesh: Sprite;
  readonly buffers: Buffers;
  private initPass: ComputeNode;
  private updatePass: ComputeNode;

  constructor(
    readonly count: number,
    u: Uniforms,
  ) {
    this.buffers = {
      pos: vec4Buffer(count),
      vel: vec4Buffer(count),
      targetA: vec4Buffer(count),
      targetB: vec4Buffer(count),
    };
    this.initPass = createInit(this.buffers, u, count);
    this.updatePass = createUpdate(this.buffers, u, count);

    const material = createMaterial(this.buffers, u);
    this.mesh = new Sprite(material);
    (this.mesh as Sprite & { count: number }).count = count;
    this.mesh.frustumCulled = false;
  }

  /** Upload word targets (vec4 per particle) from the CPU. */
  setTargets(which: 'targetA' | 'targetB', data: Float32Array): void {
    const attr = this.buffers[which].value;
    (attr.array as Float32Array).set(data);
    attr.needsUpdate = true;
  }

  async init(renderer: WebGPURenderer): Promise<void> {
    await renderer.computeAsync(this.initPass);
  }

  step(renderer: WebGPURenderer): void {
    renderer.compute(this.updatePass);
  }

  dispose(): void {
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
  }
}
