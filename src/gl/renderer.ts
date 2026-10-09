import { WebGPURenderer } from 'three/webgpu';
import type { Quality } from './quality';

export async function createRenderer(canvas: HTMLCanvasElement, q: Quality): Promise<WebGPURenderer> {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: false,
    alpha: false,
    forceWebGL: q.forceWebGL,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, q.dpr));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 1);
  await renderer.init();
  return renderer;
}

export function isWebGPU(renderer: WebGPURenderer): boolean {
  return (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
}
