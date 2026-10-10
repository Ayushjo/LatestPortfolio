import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollProgress {
  /** 0 → 1 across the hero. */
  hero: number;
  /** 0 → 1 as the first beat rises into view (the disc releases into shapes). */
  beatIn: number;
  /** Fractional beat index: 2.5 = halfway from beat 2's top to beat 3's top. */
  beat: number;
}

export type ShapeSide = 'left' | 'right' | 'center';

/** A scroll position the particle field forms a shape at. Declared in markup with data-beat. */
export interface Beat {
  key: string;
  side: ShapeSide;
  label: string;
  group: string;
  el: HTMLElement;
}

export const progress: ScrollProgress = { hero: 0, beatIn: 0, beat: 0 };

let lenis: Lenis | null = null;
let triggers: ScrollTrigger[] = [];
let beatTops: number[] = [];
const raf = (time: number) => lenis?.raf(time * 1000);

export function readBeats(root: ParentNode = document): Beat[] {
  return [...root.querySelectorAll<HTMLElement>('[data-beat]')].map((el) => ({
    key: el.dataset.beat!,
    side: (el.dataset.side as ShapeSide) || 'right',
    label: el.dataset.label || el.dataset.beat!,
    group: el.dataset.group || '',
    el,
  }));
}

/**
 * Where a beat's text begins when its section is pinned, as a fraction of viewport height.
 * Offsets are taken inside the nearest sticky container, so the answer doesn't depend on
 * where the page is scrolled.
 */
export function storyTop(beat: HTMLElement): number {
  let best = Infinity;
  for (const el of beat.querySelectorAll<HTMLElement>('h2, h3, p, li, a, button, code')) {
    if (el.closest('[hidden]') || !el.offsetParent || !el.getClientRects().length) continue;
    let frame: HTMLElement = beat;
    for (let p = el.parentElement; p && p !== beat; p = p.parentElement) {
      if (getComputedStyle(p).position === 'sticky') {
        frame = p;
        break;
      }
    }
    const offset = el.getBoundingClientRect().top - frame.getBoundingClientRect().top;
    if (offset >= 0) best = Math.min(best, offset);
  }
  return Number.isFinite(best) ? best / innerHeight : 1;
}

export function startSmoothScroll(): void {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

export function stopSmoothScroll(): void {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  lenis.destroy();
  lenis = null;
}

/** Smooth-scroll to a page offset or element, via Lenis when it is running. */
export function scrollToTarget(target: number | HTMLElement): void {
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

const absTop = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY;

function measureBeats(beats: Beat[]) {
  beatTops = beats.map((b) => absTop(b.el));
}

function updateBeat() {
  const n = beatTops.length;
  if (n === 0) return;
  const y = scrollY;
  progress.beatIn = Math.min(1, Math.max(0, (y - (beatTops[0]! - innerHeight)) / innerHeight));
  let i = 0;
  while (i < n - 1 && y >= beatTops[i + 1]!) i++;
  const span = i < n - 1 ? beatTops[i + 1]! - beatTops[i]! : innerHeight;
  progress.beat = i + Math.min(0.999, Math.max(0, (y - beatTops[i]!) / span));
}

export function trackScroll(hero: HTMLElement | null, beats: Beat[]): void {
  untrackScroll();
  if (hero) {
    triggers.push(
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (s) => (progress.hero = s.progress),
      }),
    );
  }
  if (beats.length) {
    triggers.push(
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: updateBeat,
        onRefresh: () => {
          measureBeats(beats);
          updateBeat();
        },
      }),
      ...beats.map((b) => ScrollTrigger.create({ trigger: b.el, start: 'top 55%', end: 'bottom 45%', toggleClass: 'is-active' })),
    );
  }
  ScrollTrigger.refresh();

  if (import.meta.env.DEV) {
    // Hidden preview panes throttle ScrollTrigger's ticker; tests call this after scrolling.
    Object.assign(window, {
      __syncScroll: () => {
        if (hero) progress.hero = Math.min(1, Math.max(0, (scrollY - absTop(hero)) / hero.offsetHeight));
        measureBeats(beats);
        updateBeat();
        return { ...progress };
      },
      __beats: beats,
    });
  }
}

export function untrackScroll(): void {
  triggers.forEach((t) => t.kill());
  triggers = [];
  beatTops = [];
  progress.hero = 0;
  progress.beatIn = 0;
  progress.beat = 0;
}
