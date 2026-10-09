import { PI, cos, float, floor, hash, instanceIndex, log, sin, sqrt, step } from 'three/tsl';
import type { Node } from 'three/webgpu';
import type { Uniforms } from './uniforms';

/** Number of light "fibres" the stream is made of. */
export const LANES = 48;

type Index = typeof instanceIndex;

/**
 * Per-particle lane properties, derived from the particle index only so compute and
 * material agree without extra buffers.
 */
export function lane(i: Index, u: Uniforms) {
  const id = floor(hash(i.add(17)).mul(LANES));
  const h1 = hash(id.add(1)).max(1e-4);
  const h2 = hash(id.add(2));
  // Gaussian lane centre (Box–Muller): fibres crowd the middle of the river.
  const centre = sqrt(log(h1).mul(-2)).mul(cos(h2.mul(PI.mul(2)))).mul(u.halfH.mul(u.riverWidth));
  const phase = hash(id.add(3)).mul(PI.mul(2));
  const speed = hash(id.add(4)).mul(0.9).add(0.6);
  const glow = hash(id.add(5)).mul(0.75).add(0.25);
  const sway = hash(id.add(6)).mul(0.6).add(0.25);

  // 70% of particles hug their fibre; the rest drift wider as haze.
  const isHaze = step(0.7, hash(i.add(41)));
  const spread = float(0.035).add(isHaze.mul(0.32));
  const jitter = sqrt(log(hash(i.add(43)).max(1e-4)).mul(-2)).mul(cos(hash(i.add(47)).mul(PI.mul(2)))).mul(spread);

  return { id, centre, phase, speed, glow, sway, isHaze, jitter };
}

/** Centre line of a fibre at x: a slow travelling wave, different per lane. */
export function fibreY(x: Node<'float'>, l: ReturnType<typeof lane>, u: Uniforms) {
  const a = sin(x.mul(0.33).add(u.time.mul(0.35)).add(l.phase)).mul(l.sway);
  const b = sin(x.mul(0.12).sub(u.time.mul(0.18))).mul(0.45);
  return a.add(b).add(l.centre).add(l.jitter);
}
