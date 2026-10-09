import { gsap } from 'gsap';
import type { Experience } from '../gl/Experience';
import { progress, type Beat, type ShapeSide } from './scroll';

/** How long a chapter must be held before its demo starts on its own (wide screens only). */
const AUTO_AFTER = 1.5;

/**
 * Demo videos inside the particles. On wide screens a held chapter morphs its shape into
 * a frame and plays the clip in it; the ▶ / ◼ button toggles it by hand. Tall screens
 * use a plain inline <video> in the panel instead.
 */
export function initDemos(getExp: () => Experience | null, beats: Beat[]): () => void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-demo]')];
  if (!buttons.length) return () => {};

  const tall = () => innerWidth / innerHeight <= 1.15;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const beatOf = (btn: HTMLButtonElement) => beats.findIndex((b) => b.key === btn.dataset.demo);
  const inlineOf = (btn: HTMLButtonElement) =>
    document.querySelector<HTMLVideoElement>(`[data-inline-demo="${btn.dataset.demo}"]`);

  let playing: HTMLButtonElement | null = null;
  let dismissed: HTMLButtonElement | null = null;
  let held = 0;

  const start = (btn: HTMLButtonElement) => {
    if (playing && playing !== btn) stop(playing);
    playing = btn;
    btn.setAttribute('aria-pressed', 'true');
    const src = btn.dataset.src!;
    const video = inlineOf(btn);
    if (tall() || !getExp()) {
      if (video) {
        if (!video.src) video.src = src;
        video.hidden = false;
        void video.play().catch(() => {});
      }
      return;
    }
    getExp()!.showDemo(src, btn.dataset.side as ShapeSide);
  };

  const stop = (btn: HTMLButtonElement) => {
    btn.setAttribute('aria-pressed', 'false');
    const video = inlineOf(btn);
    if (video && !video.hidden) {
      video.pause();
      video.hidden = true;
    }
    getExp()?.hideDemo();
    if (playing === btn) playing = null;
  };

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      if (playing === btn) {
        stop(btn);
        dismissed = btn;
      } else {
        start(btn);
      }
    });
  }

  const onMove = (e: PointerEvent) => {
    const exp = getExp();
    const r = exp?.demoScreenRect();
    exp?.setDemoColour(!!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const tick = (_t: number, deltaMs: number) => {
    const k = Math.floor(progress.beat);
    const local = progress.beat - k;
    const holding = progress.beatIn > 0.99 && local > 0.02 && local < 0.42;
    const here = holding ? buttons.find((b) => beatOf(b) === k) ?? null : null;

    if (playing && playing !== here) stop(playing);
    if (dismissed && dismissed !== here) dismissed = null;

    held = here && !playing ? held + deltaMs / 1000 : 0;
    if (here && !playing && here !== dismissed && held > AUTO_AFTER && !tall() && !calm && getExp()) start(here);
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    window.removeEventListener('pointermove', onMove);
    if (playing) stop(playing);
  };
}
