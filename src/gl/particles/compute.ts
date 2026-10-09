import {
  Fn,
  PI,
  clamp,
  dot,
  exp,
  floor,
  float,
  hash,
  instanceIndex,
  length,
  mix,
  select,
  sin,
  smoothstep,
  sqrt,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { curl2 } from '../tsl/noise';
import { fibreY, lane } from './lanes';
import type { Buffers } from './ParticleSystem';
import type { Uniforms } from './uniforms';

const MARGIN = 0.6;
const DISC_SQUASH = 0.3;

export function createInit(b: Buffers, u: Uniforms, count: number) {
  return Fn(() => {
    const i = instanceIndex;
    // Must not reuse hash(i): that seeds the lane speed, and correlating start x with speed makes fronts.
    const x = hash(i.add(7919)).mul(2).sub(1).mul(u.halfW.add(MARGIN));
    const l = lane(i, u);
    const y = fibreY(x, l, u);
    b.pos.element(i).assign(vec4(x, y, 0, 1));
    b.vel.element(i).assign(vec4(u.streamSpeed.mul(l.speed), 0, 0, 0));
  })().compute(count);
}

/**
 * One simulation step per particle:
 * stream (curl flow) → spring to the word (with a curl detour while morphing)
 * → cursor eddies → click shockwave → scroll vortex → integrate + wrap.
 */
export function createUpdate(b: Buffers, u: Uniforms, count: number) {
  return Fn(() => {
    const i = instanceIndex;
    const P = b.pos.element(i);
    const V = b.vel.element(i);
    const A = b.targetA.element(i);
    const B = b.targetB.element(i);
    const seed = hash(i);
    const seed2 = hash(i.add(9973));
    const dt = u.dt;

    const p = P.xyz.toVar();
    const v = V.xyz.toVar();

    // Staggered per-particle amounts so nothing moves in lockstep.
    const formIn = smoothstep(seed.mul(0.5), seed.mul(0.5).add(0.5), u.form);
    const dissolve = smoothstep(seed.mul(0.3).add(0.02), seed.mul(0.3).add(0.4), u.scroll);
    // Leaving the disc for the project shapes reuses the same spring, staggered per particle.
    const workF = smoothstep(seed.mul(0.4), seed.mul(0.4).add(0.6), u.workIn);
    const f = formIn.mul(dissolve.oneMinus()).max(workF).toVar();
    const vortexIn = smoothstep(seed.mul(0.25).add(0.35), seed.mul(0.25).add(0.75), u.scroll)
      .mul(workF.oneMinus())
      .mul(u.beatIn.oneMinus());

    // Left-to-right wave between the two words (targets are sorted by x; w = rank).
    const mk = A.w.mul(0.55).add(seed2.mul(0.1));
    const m = smoothstep(mk, mk.add(0.35), u.morph);

    // Stream: strands of light. Each particle rides its fibre (a swaying centre line) at the
    // fibre's speed; haze particles are held more loosely and feel more of the curl noise.
    const n = curl2(vec3(p.xy.mul(u.flowFreq), u.time.mul(0.07)));
    const l = lane(i, u);
    const hold = fibreY(p.x, l, u).sub(p.y).mul(mix(float(4), float(1.4), l.isHaze));
    const noiseAmp = u.flowAmp.mul(mix(float(0.35), float(1.4), l.isHaze));
    const speed = u.streamSpeed.mul(l.speed).mul(seed.mul(0.2).add(0.9));
    const flow = vec3(speed.add(n.x.mul(noiseAmp)), n.y.mul(noiseAmp).add(hold), 0);
    v.assign(mix(v, flow, f.oneMinus().mul(vortexIn.oneMinus()).mul(clamp(dt.mul(2), 0, 1))));

    // Spring toward the word; the detour makes particles swirl between words instead of sliding.
    const detour = curl2(vec3(A.xy.mul(0.4), seed.mul(7).add(u.time.mul(0.03))))
      .mul(sin(m.mul(PI)))
      .mul(u.detour);
    const breathe = n.mul(0.012);
    const target = mix(A.xyz, B.xyz, m).add(vec3(detour.add(breathe), 0));
    v.addAssign(target.sub(p).mul(u.spring).mul(f).mul(dt));
    v.mulAssign(float(1).sub(f.mul(clamp(dt.mul(u.damping), 0, 0.9))));

    // Cursor: repel + swirl, stronger when the pointer moves fast.
    const d = p.xy.sub(u.pointer);
    const r2 = dot(d, d);
    const fall = exp(r2.div(u.cursorRadius.mul(u.cursorRadius)).negate()).mul(u.pointerActive);
    const dir = d.div(sqrt(r2).add(1e-4));
    const swirl = vec2(dir.y.negate(), dir.x);
    const push = dir.add(swirl.mul(0.6)).mul(fall).mul(u.cursorForce).mul(u.pointerSpeed.add(0.25));
    v.addAssign(vec3(push.mul(dt), 0));

    // Click shockwave: an expanding ring that kicks particles outward.
    const age = u.time.sub(u.shockTime);
    const ds = p.xy.sub(u.shockPos);
    const rs = length(ds);
    const gap = rs.sub(age.mul(6));
    const band = exp(gap.mul(gap).div(0.08).negate()).mul(exp(age.mul(-2.2)));
    v.addAssign(vec3(ds.div(rs.add(1e-4)).mul(band).mul(u.shockForce).mul(dt), 0));

    // Scroll: everything funnels into a tilted orbiting disc (the hand-off to the next scene).
    const q = p.xy.sub(u.vortex).mul(vec2(1, 1 / DISC_SQUASH));
    const rq = length(q).add(1e-3);
    const qd = q.div(rq);
    const tang = vec2(qd.y.negate(), qd.x);
    const ringR = seed.mul(seed).mul(3.4).add(0.45);
    const orbit = tang.mul(float(1.6).div(sqrt(rq.add(0.15)))).add(qd.mul(ringR.sub(rq).mul(1.8)));
    const orbit3 = vec3(orbit.mul(vec2(1, DISC_SQUASH)), p.z.mul(-1.5));
    v.assign(mix(v, orbit3, vortexIn.mul(clamp(dt.mul(3), 0, 1))));

    p.addAssign(v.mul(dt));

    // Wrap around the screen edges while streaming so the flow never runs dry.
    const wx = u.halfW.add(MARGIN);
    const wy = u.halfH.add(MARGIN);
    const wrapX = p.x.sub(wx.mul(2).mul(floor(p.x.add(wx).div(wx.mul(2)))));
    const wrapY = p.y.sub(wy.mul(2).mul(floor(p.y.add(wy).div(wy.mul(2)))));
    const doWrap = select(f.lessThan(0.5).and(vortexIn.lessThan(0.5)), float(1), float(0));
    p.assign(vec3(mix(p.x, wrapX, doWrap), mix(p.y, wrapY, doWrap), p.z));

    P.assign(vec4(p, 1));
    V.assign(vec4(v, f));
  })().compute(count);
}
