import type { Experience } from '../gl/Experience';
import type { Quality } from '../gl/quality';
import { getMode, hasStoredMode, onModeChange, prefersReducedMotion, setMode, type Mode } from './mode';
import { startSmoothScroll, stopSmoothScroll, trackScroll, untrackScroll } from './scroll';
import { initSlider } from './slider';

const slider = document.querySelector<HTMLElement>('[data-mode-slider]');
const heroTitle = document.querySelector<HTMLElement>('[data-hero-title]');
const heroSection = document.querySelector<HTMLElement>('#hero');
const chaptersEl = document.querySelector<HTMLElement>('[data-chapters]');
const chapterSlugs = [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((el) => el.dataset.chapter!);
if (slider) initSlider(slider);

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
    return;
  }

  const calm = prefersReducedMotion();
  if (!calm) startSmoothScroll();
  trackScroll({ hero: heroSection, chapters: chaptersEl });

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
      chapters: chapterSlugs,
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
