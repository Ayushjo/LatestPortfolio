import { Fn, dot, floor, fract, mix, smoothstep, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';

type V2 = Node<'vec2'>;

const bayer2 = (a: V2) => {
  const f = floor(a);
  return fract(f.x.div(2).add(f.y.mul(f.y).mul(0.75)));
};
const bayer4 = (a: V2) => bayer2(a.mul(0.5)).mul(0.25).add(bayer2(a));
/** 8×8 ordered-dither threshold in [0, 1). */
export const bayer8 = (a: V2) => bayer4(a.mul(0.5)).mul(0.25).add(bayer2(a));

/**
 * Quantises luminance to `levels` steps with an ordered Bayer pattern, then blends with
 * the original by `amount`. Gradients (bloom halos, vignette) turn into a halftone texture.
 */
export const ditherMono = Fn(
  ([color, pixel, levels, amount, tint]: [Node<'vec3'>, V2, Node<'float'>, Node<'float'>, Node<'vec3'>]) => {
    const lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    const q = floor(lum.mul(levels).add(bayer8(pixel))).div(levels);
    // Leave near-black alone so the background stays clean instead of showing a screen-door grid.
    return mix(color, tint.mul(q), amount.mul(smoothstep(0.035, 0.18, lum)));
  },
) as unknown as (color: Node, pixel: Node, levels: Node, amount: Node, tint: Node) => Node<'vec3'>;
