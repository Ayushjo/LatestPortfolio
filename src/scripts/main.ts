import type { Experience } from '../gl/Experience';
import type { Quality } from '../gl/quality';
import { getMode, hasStoredMode, onModeChange, prefersReducedMotion, setMode, type Mode } from './mode';
import { initRail } from './rail';
import { readBeats, scrollToTarget, startSmoothScroll, stopSmoothScroll, trackScroll, untrackScroll, type ShapeSide } from './scroll';
import { initSlider } from './slider';

const slider = document.querySelector<HTMLElement>('[data-mode-slider]');
const heroTitle = document.querySelector<HTMLElement>('[data-hero-title]');
const heroSection = document.querySelector<HTMLElement>('#hero');
const beats = readBeats();
const railEl = document.querySelector<HTMLElement>('[data-rail]');
if (slider) initSlider(slider);
let stopRail: (() => void) | null = null;

// In-page jumps (fork choices) go through Lenis so they glide instead of teleporting.
document.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-scroll-to]');
  const target = link && document.querySelector<HTMLElement>(link.dataset.scrollTo!);
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
});

/** "More work" cards: hovering (or, on touch, scrolling one to the middle) draws its shape. */
function setOverride(key: string | null) {
  experience?.stream.setOverride(key ? { key, side: 'right' as ShapeSide } : null);
}
const cards = [...document.querySelectorAll<HTMLElement>('[data-override]')];
for (const card of cards) {
  card.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && setOverride(card.dataset.override!));
  card.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && setOverride(null));
  card.addEventListener('focusin', () => setOverride(card.dataset.override!));
  card.addEventListener('focusout', () => setOverride(null));
}
if (matchMedia('(pointer: coarse)').matches && cards.length) {
  const io = new IntersectionObserver(
    (entries) => {
      const hit = entries.find((en) => en.isIntersecting);
      if (hit) setOverride((hit.target as HTMLElement).dataset.override!);
      else if (!cards.some((c) => c.matches(':hover'))) setOverride(null);
    },
    { rootMargin: '-40% 0px -40% 0px' },
  );
  cards.forEach((c) => io.observe(c));
}

let experience: Experience | null = null;
let generation = 0;
let tier: 0 | 1 | 2 | 3 | null = null;
let ceiling: 1 | 2 | 3 = 3;

/** A WebGPU/WebGL context can't be re-acquired as a different type, so each boot gets a fresh canvas. */
function freshCanvas(): HTMLCanvasElement | null {
  const old = document.querySelector<HTMLCanvasElement>('[data-gl]');
  if (!old) return null;
  const next = old.cloneNode(false) as HTMLCanvasElement;
  next.classList.remove('is-ready');
  old.replaceWith(next);
  return next;
}

function teardown() {
  experience?.dispose();
  experience = null;
  heroTitle?.classList.remove('is-handed-off');
  document.querySelector('[data-gl]')?.classList.remove('is-ready');
}

async function apply(mode: Mode) {
  const gen = ++generation;

  if (mode === 'recruiter') {
    teardown();
    stopSmoothScroll();
    untrackScroll();
    stopRail?.();
    stopRail = null;
    return;
  }

  const calm = prefersReducedMotion();
  if (!calm) startSmoothScroll();
  trackScroll(heroSection, beats);
  if (railEl && !stopRail) stopRail = initRail(railEl, beats);

  const { detectTier, qualityFor } = await import('../gl/quality');
  tier ??= await detectTier();
  if (gen !== generation) return;

  if (tier === 0 && !hasStoredMode()) {
    setMode('recruiter', { persist: false });
    return;
  }

  const q: Quality = qualityFor(mode, Math.min(ceiling, Math.max(1, tier)) as 1 | 2 | 3);
  teardown();
  const canvas = freshCanvas();
  if (!canvas) return;

  try {
    const { Experience } = await import('../gl/Experience');
    if (gen !== generation) return;
    const exp = await Experience.boot(canvas, q, {
      calm,
      beats: beats.map(({ key, side }) => ({ key, side })),
      hooks: {
        onFormed: () => heroTitle?.classList.add('is-handed-off'),
        onSlow: () => {
          if (q.tier === 1) return;
          ceiling = (q.tier - 1) as 1 | 2;
          void apply(getMode());
        },
      },
    });
    if (gen !== generation) {
      exp.dispose();
      return;
    }
    experience = exp;
    if (import.meta.env.DEV) Object.assign(window, { __exp: exp, __progress: (await import('./scroll')).progress });
    requestAnimationFrame(() => canvas.classList.add('is-ready'));
  } catch (err) {
    // No WebGPU and no WebGL2: the HTML hero stays as is.
    console.warn('[stream] graphics unavailable, staying in HTML mode', err);
  }
}

onModeChange((mode, prev) => {
  if (mode === 'recruiter' || prev === 'recruiter') window.scrollTo({ top: 0 });
  void apply(mode);
});
void apply(getMode());
