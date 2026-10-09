import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { Fn, float, floor, hash, length, pass, screenCoordinate, screenUV, smoothstep, step, uniform, vec3, vec4 } from 'three/tsl';
import { RenderPipeline, Vector4, type Camera, type Scene, type WebGPURenderer } from 'three/webgpu';
import type { Quality } from '../quality';
import type { Uniforms } from '../particles/uniforms';
import { ditherMono } from './dither';

export function createPipeline(renderer: WebGPURenderer, scene: Scene, camera: Camera, q: Quality, time: Uniforms['time']) {
  const u = {
    bloomStrength: uniform(0.35),
    dither: uniform(q.dither),
    levels: uniform(7),
    ditherScale: uniform(Math.min(devicePixelRatio, q.dpr)),
    grain: uniform(q.grain),
    aberration: uniform(0.006),
    vignette: uniform(0.75),
    floor: uniform(0.012),
    /** Screen-UV rect (x0, y0, x1, y1) of a demo video shown in colour, and how much to clear effects there. */
    clearRect: uniform(new Vector4(0, 0, 0, 0)),
    clearAmt: uniform(0),
  };

  const scenePass = pass(scene, camera);
  const sceneTex = scenePass.getTextureNode('output');
  const glow = q.bloom ? bloom(sceneTex, u.bloomStrength, 0.45, 0.55) : null;

  const output = Fn(() => {
    const uv = screenUV;
    const c = uv.sub(0.5);
    const dist = length(c);
    const r = u.clearRect;
    const inside = step(r.x, uv.x).mul(step(uv.x, r.z)).mul(step(r.y, uv.y)).mul(step(uv.y, r.w));
    const keep = float(1).sub(inside.mul(u.clearAmt));

    // Chromatic aberration that only appears toward the edges.
    const off = c.mul(dist).mul(u.aberration.mul(4)).mul(keep);
    const col = vec3(
      sceneTex.sample(uv.add(off)).r,
      sceneTex.sample(uv).g,
      sceneTex.sample(uv.sub(off)).b,
    ).toVar();
    if (glow) col.addAssign(glow.rgb);

    col.mulAssign(float(1).sub(smoothstep(0.35, 0.95, dist).mul(u.vignette)));

    const pixel = screenCoordinate.xy.div(u.ditherScale);
    const dithered = ditherMono(col, pixel, u.levels, u.dither.mul(keep), vec3(0.92, 0.94, 1.0));

    const seed = floor(screenCoordinate.x).add(floor(screenCoordinate.y).mul(8192)).add(floor(time.mul(60)).mod(64).mul(7919));
    const grain = hash(seed).sub(0.5).mul(u.grain).mul(keep);
    return vec4(dithered.add(grain).add(u.floor), 1);
  })();

  const pipeline = new RenderPipeline(renderer);
  pipeline.outputNode = output;

  return { pipeline, uniforms: u };
}

export type Pipeline = ReturnType<typeof createPipeline>;
