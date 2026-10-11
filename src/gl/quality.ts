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

const TIER_KEY = 'gpu-tier';

/**
 * Most a device can take, from what it reports about itself: low memory, few cores or a
 * data-saver connection cap the particle count before anything is drawn, instead of booting
 * the top tier and stepping down once frames start dropping.
 */
function deviceCeiling(): 1 | 2 | 3 {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const conn = nav.connection;
  if (conn?.saveData || /2g/.test(conn?.effectiveType ?? '') || memory <= 2 || cores <= 2) return 1;
  if (memory <= 4 || cores <= 4) return 2;
  return 3;
}

/**
 * GPU tier 0..3 from detect-gpu (a benchmark lookup over the network), capped by what the
 * device reports. Remembered for the session, so only the first page view pays for the lookup.
 */
export async function detectTier(): Promise<0 | 1 | 2 | 3> {
  try {
    const saved = Number(sessionStorage.getItem(TIER_KEY));
    if (saved >= 0 && saved <= 3 && sessionStorage.getItem(TIER_KEY) !== null) return saved as 0 | 1 | 2 | 3;
  } catch {
    /* storage blocked: detect every time */
  }
  const isMobile = matchMedia('(pointer: coarse)').matches;
  const fallback: 0 | 1 | 2 | 3 = 'gpu' in navigator ? (isMobile ? 2 : 3) : isMobile ? 1 : 2;
  let tier: 0 | 1 | 2 | 3 = fallback;
  try {
    const { getGPUTier } = await import('detect-gpu');
    const result = await Promise.race([getGPUTier(), new Promise<null>((r) => setTimeout(() => r(null), 1200))]);
    if (result && result.type !== 'FALLBACK' && result.type !== 'BLOCKLISTED')
      tier = Math.max(0, Math.min(3, result.tier)) as 0 | 1 | 2 | 3;
  } catch {
    /* keep the fallback */
  }
  tier = Math.min(tier, deviceCeiling()) as 0 | 1 | 2 | 3;
  try {
    sessionStorage.setItem(TIER_KEY, String(tier));
  } catch {
    /* fine */
  }
  return tier;
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
