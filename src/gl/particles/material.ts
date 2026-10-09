import { atan, float, hash, instanceIndex, length, min, mix, shapeCircle, sin, smoothstep, sqrt, vec2, vec3 } from 'three/tsl';
import { AdditiveBlending, SpriteNodeMaterial } from 'three/webgpu';
import { lane } from './lanes';
import type { Buffers } from './ParticleSystem';
import type { Uniforms } from './uniforms';

const SILVER = vec3(0.93, 0.95, 1.0);

/**
 * Monochrome silver: streaming particles go graphite → white with speed and stretch into
 * streaks along their velocity; formed letters are round dots with a slow diagonal sheen.
 */
export function createMaterial(b: Buffers, u: Uniforms): SpriteNodeMaterial {
  const mat = new SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });

  const P = b.pos.element(instanceIndex);
  const V = b.vel.element(instanceIndex);
  const seed = hash(instanceIndex.add(31));

  const speed = length(V.xy);
  const stretch = min(speed.mul(2.2), 7).add(1);

  // Fibres carry travelling pulses of light ("packets"); haze stays faint.
  const l = lane(instanceIndex, u);
  const pulse = smoothstep(0.7, 1, sin(P.x.mul(0.9).sub(u.time.mul(l.speed).mul(3.2)).add(l.phase.mul(3))));
  const streamLum = l.glow
    .mul(pulse.mul(1.6).add(0.22))
    .mul(mix(float(1), float(0.3), l.isHaze))
    .mul(u.streamGlow);
  const sheen = smoothstep(0.86, 1, sin(P.x.mul(0.8).add(P.y.mul(0.45)).sub(u.time.mul(1.1))));
  const formedLum = seed.mul(0.35).add(0.42).add(sheen.mul(u.sheen));
  // Streaks cover more pixels, so dim them to keep the total energy similar.
  const lum = mix(streamLum, formedLum, V.w).mul(u.brightness).div(sqrt(stretch));

  const size = u.size.mul(seed.mul(0.9).add(0.55));

  mat.positionNode = b.pos.toAttribute().xyz;
  mat.rotationNode = atan(V.y, V.x);
  mat.scaleNode = vec2(size.mul(stretch), size);
  mat.colorNode = SILVER.mul(lum);
  mat.opacityNode = shapeCircle();
  return mat;
}
