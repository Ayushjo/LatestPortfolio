import type { Mode } from '../content/profile';

export type { Mode };
export const MODES: readonly Mode[] = ['immersive', 'casual', 'recruiter'];
const KEY = 'mode';

type Listener = (mode: Mode, prev: Mode) => void;
const listeners = new Set<Listener>();

export function isMode(v: unknown): v is Mode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v);
}

export function getMode(): Mode {
  const m = document.documentElement.dataset.mode;
  return isMode(m) ? m : 'immersive';
}

export function hasStoredMode(): boolean {
  try {
    return isMode(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function setMode(mode: Mode, { persist = true } = {}): void {
  const prev = getMode();
  if (prev === mode) return;
  document.documentElement.dataset.mode = mode;
  if (persist) {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* storage unavailable: mode still applies for this visit */
    }
  }
  listeners.forEach((fn) => fn(mode, prev));
}

export function onModeChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
