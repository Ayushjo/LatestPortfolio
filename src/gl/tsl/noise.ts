import { Fn, float, mx_noise_float, vec2, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';

type N = ReturnType<typeof vec3>;

/**
 * 2D curl of a 3D Perlin field sampled at (x, y, z). Divergence-free, so particles
 * swirl and stream without clumping.
 */
export const curl2 = Fn(([p]: [N]) => {
  const e = float(0.02);
  const dx = vec3(e, 0, 0);
  const dy = vec3(0, e, 0);
  const ny = mx_noise_float(p.add(dy)).sub(mx_noise_float(p.sub(dy)));
  const nx = mx_noise_float(p.add(dx)).sub(mx_noise_float(p.sub(dx)));
  return vec2(ny, nx.negate()).div(e.mul(2));
}) as unknown as (p: Node | N) => ReturnType<typeof vec2>;
