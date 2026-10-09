import { atan, clamp, float, hash, instanceIndex, length, min, mix, shapeCircle, sin, smoothstep, sqrt, step, vec2, vec3 } from 'three/tsl';
import { AdditiveBlending, SpriteNodeMaterial } from 'three/webgpu';
import { lane } from './lanes';
import type { Buffers } from './ParticleSystem';
import type { Uniforms } from './uniforms';

const SILVER = vec3(0.93, 0.95, 1.0);

/**
 * Monochrome silver: streaming particles go graphite → white with speed and stretch into
 * streaks along their velocity; formed letters are round dots with a slow diagonal sheen.
 * During a demo, particles inside the video rectangle take the clip's colours.
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
  // Demo: inside the video rectangle each particle becomes a pixel of the playing clip.
  const r = u.videoRect;
  const vuv = P.xy.sub(r.xy).div(r.zw);
  const inside = step(0, vuv.x).mul(step(vuv.x, 1)).mul(step(0, vuv.y)).mul(step(vuv.y, 1));
  const clip = u.videoMap.sample(clamp(vuv, 0, 1)).rgb.mul(u.brightness).mul(u.videoGain);
  const silver = SILVER.mul(lum);
  const shown = mix(silver, clip, u.videoMix.mul(inside));

  mat.colorNode = shown.mul(mix(float(1), u.particleDim, inside));
  mat.opacityNode = shapeCircle();
  return mat;
}
