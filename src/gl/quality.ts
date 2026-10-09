import type { Mode } from '../scripts/mode';

export interface Quality {
  tier: 1 | 2 | 3;
  count: number;
  dpr: number;
  bloom: boolean;
  dither: number;
  grain: number;
  particlePx: number;
  forceWebGL: boolean;
}

const COUNTS = { 1: 32_768, 2: 131_072, 3: 262_144 } as const;
const CASUAL_MAX = 65_536;

/** GPU tier 0..3 from detect-gpu, falling back to a heuristic if the benchmark lookup is slow or fails. */
export async function detectTier(): Promise<0 | 1 | 2 | 3> {
  const isMobile = matchMedia('(pointer: coarse)').matches;
  const fallback: 0 | 1 | 2 | 3 = 'gpu' in navigator ? (isMobile ? 2 : 3) : isMobile ? 1 : 2;
  try {
    const { getGPUTier } = await import('detect-gpu');
    const result = await Promise.race([
      getGPUTier(),
      new Promise<null>((r) => setTimeout(() => r(null), 2500)),
    ]);
    if (!result || result.type === 'FALLBACK' || result.type === 'BLOCKLISTED') return fallback;
    return Math.max(0, Math.min(3, result.tier)) as 0 | 1 | 2 | 3;
  } catch {
    return fallback;
  }
}

export function qualityFor(mode: Mode, requested: 1 | 2 | 3): Quality {
  const isMobile = matchMedia('(pointer: coarse)').matches;
  // Phones throttle under sustained load; never start them on the top tier.
  const tier = (isMobile ? Math.min(requested, 2) : requested) as 1 | 2 | 3;
  const forceWebGL = new URLSearchParams(location.search).get('gl') === 'webgl';
  const casual = mode === 'casual';
  const count = casual ? Math.min(CASUAL_MAX, COUNTS[tier]) : COUNTS[tier];
  return {
    tier,
    count,
    dpr: isMobile ? 1.5 : 2,
    bloom: !casual && tier >= 2,
    dither: casual ? 0.35 : 0.85,
    grain: casual ? 0.025 : 0.045,
    particlePx: casual ? 2.6 : tier === 3 ? 1.9 : 2.3,
    forceWebGL,
  };
}

export function stepDown(q: Quality, mode: Mode): Quality | null {
  if (q.tier === 1) return null;
  return qualityFor(mode, (q.tier - 1) as 1 | 2);
}
