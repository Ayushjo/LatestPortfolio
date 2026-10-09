import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollProgress {
  /** 0 → 1 across the hero. */
  hero: number;
  /** 0 → 1 as the first project chapter rises into view. */
  workIn: number;
  /** Fractional chapter index: 2.5 = halfway through the third chapter. */
  chapter: number;
}

export const progress: ScrollProgress = { hero: 0, workIn: 0, chapter: 0 };

let lenis: Lenis | null = null;
let triggers: ScrollTrigger[] = [];
const raf = (time: number) => lenis?.raf(time * 1000);

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

export function trackScroll(els: { hero: HTMLElement | null; chapters: HTMLElement | null }): void {
  untrackScroll();
  const { hero, chapters } = els;
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
  if (chapters) {
    const items = [...chapters.querySelectorAll<HTMLElement>('[data-chapter]')];
    triggers.push(
      ScrollTrigger.create({
        trigger: chapters,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (s) => (progress.workIn = s.progress),
      }),
      ScrollTrigger.create({
        trigger: chapters,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (s) => {
          const per = items[0]?.offsetHeight || innerHeight;
          progress.chapter = Math.min(items.length - 1e-3, (s.progress * (s.end - s.start)) / per);
        },
      }),
      ...items.map((item) =>
        ScrollTrigger.create({ trigger: item, start: 'top 55%', end: 'bottom 45%', toggleClass: 'is-active' }),
      ),
    );
  }
  ScrollTrigger.refresh();
}

export function untrackScroll(): void {
  triggers.forEach((t) => t.kill());
  triggers = [];
  progress.hero = 0;
  progress.workIn = 0;
  progress.chapter = 0;
}
