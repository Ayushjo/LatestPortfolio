import { uniform } from 'three/tsl';
import { Vector2 } from 'three/webgpu';

/** Every knob the simulation and material read. GSAP and the debug panel tween `.value` directly. */
export function createUniforms() {
  return {
    time: uniform(0),
    dt: uniform(1 / 60),
    halfW: uniform(8),
    halfH: uniform(5),

    // choreography
    form: uniform(0), // 0 stream → 1 word
    morph: uniform(0), // 0 AYUSH → 1 SYSTEMS ENGINEER
    scroll: uniform(0), // hero scroll progress
    workIn: uniform(0), // 0 disc → 1 project shapes
    vortex: uniform(new Vector2(0, 0.9)),

    // stream
    streamSpeed: uniform(1.5),
    flowAmp: uniform(0.22),
    riverWidth: uniform(0.36),
    streamGlow: uniform(0.45),
    flowFreq: uniform(0.32),

    // forming
    spring: uniform(26),
    damping: uniform(7.5),
    detour: uniform(1.1),

    // interaction
    pointer: uniform(new Vector2(99, 99)),
    pointerSpeed: uniform(0),
    pointerActive: uniform(0),
    cursorRadius: uniform(0.75),
    cursorForce: uniform(38),
    shockPos: uniform(new Vector2(0, 0)),
    shockTime: uniform(-100),
    shockForce: uniform(70),

    // look
    size: uniform(0.02),
    brightness: uniform(1),
    sheen: uniform(0.55),
  };
}

export type Uniforms = ReturnType<typeof createUniforms>;
