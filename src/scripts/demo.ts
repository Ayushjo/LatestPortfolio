import { gsap } from 'gsap';
import type { Experience } from '../gl/Experience';
import { progress, type Beat, type ShapeSide } from './scroll';

/** How long a chapter must be held before its demo starts on its own. */
const AUTO_AFTER = 1.5;

interface Caption {
  from: number;
  to: number;
  text: string;
}

const captionCache = new Map<string, Promise<Caption[]>>();
function loadCaptions(url: string | undefined): Promise<Caption[]> {
  if (!url) return Promise.resolve([]);
  let p = captionCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.json() : { captions: [] }))
      .then((j: { captions?: Caption[] }) => j.captions ?? [])
      .catch(() => []);
    captionCache.set(url, p);
  }
  return p;
}
const captionAt = (list: Caption[], t: number) => list.find((c) => t >= c.from && t < c.to)?.text ?? '';

/**
 * Demo videos. Wide screens: a held chapter's particles fly into a big 16:10 screen and play
 * the clip as moving dots, the crisp clip fades in over them, and the story panel compacts;
 * a progress line and synced captions sit under the clip. Tall screens: the clip plays
 * inline in the panel, with the same captions. ▶ / ◼ toggles either by hand.
 */
export function initDemos(getExp: () => Experience | null, beats: Beat[]): () => void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-demo]')];
  const hud = document.querySelector<HTMLElement>('[data-demo-hud]');
  if (!buttons.length) return () => {};

  const tall = () => innerWidth / innerHeight <= 1.15;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const beatOf = (btn: HTMLButtonElement) => beats.findIndex((b) => b.key === btn.dataset.demo);
  const chapterOf = (btn: HTMLButtonElement) => btn.closest<HTMLElement>('[data-beat]');
  const inlineOf = (btn: HTMLButtonElement) =>
    document.querySelector<HTMLVideoElement>(`[data-inline-demo="${btn.dataset.demo}"]`);
  const inlineCaptionOf = (btn: HTMLButtonElement) =>
    document.querySelector<HTMLElement>(`[data-inline-caption="${btn.dataset.demo}"]`);

  let playing: HTMLButtonElement | null = null;
  let mode: 'stage' | 'inline' | null = null;
  let captions: Caption[] = [];
  let dismissed: HTMLButtonElement | null = null;
  let held = 0;

  const start = (btn: HTMLButtonElement) => {
    if (playing && playing !== btn) stop(playing);
    playing = btn;
    btn.setAttribute('aria-pressed', 'true');
    captions = [];
    void loadCaptions(btn.dataset.captions).then((c) => playing === btn && (captions = c));
    const exp = getExp();
    if (tall() || !exp) {
      mode = 'inline';
      chapterOf(btn)?.classList.add('is-demo');
      exp?.quietShape(true);
      const video = inlineOf(btn);
      if (video) {
        // Posters are attached on first play: a hidden <video poster> still downloads it.
        if (video.dataset.poster && !video.poster) video.poster = video.dataset.poster;
        if (!video.getAttribute('src')) video.src = btn.dataset.src!;
        video.hidden = false;
        video.currentTime = 0;
        void video.play().catch(() => {});
      }
      return;
    }
    mode = 'stage';
    chapterOf(btn)?.classList.add('is-demo');
    exp.showDemo(btn.dataset.src!, btn.dataset.side as ShapeSide);
  };

  const stop = (btn: HTMLButtonElement) => {
    btn.setAttribute('aria-pressed', 'false');
    chapterOf(btn)?.classList.remove('is-demo');
    const video = inlineOf(btn);
    if (video && !video.hidden) {
      video.pause();
      video.hidden = true;
    }
    const cap = inlineCaptionOf(btn);
    if (cap) cap.textContent = '';
    if (mode === 'inline') getExp()?.quietShape(false);
    getExp()?.hideDemo();
    hud?.classList.remove('is-on');
    if (playing === btn) {
      playing = null;
      mode = null;
    }
  };

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      if (playing === btn) {
        stop(btn);
        dismissed = btn;
      } else start(btn);
    });
  }

  const hudFill = hud?.querySelector<HTMLElement>('.fill');
  const hudCaption = hud?.querySelector<HTMLElement>('.caption');

  const tick = (_t: number, deltaMs: number) => {
    const k = Math.floor(progress.beat);
    const local = progress.beat - k;
    const holding = progress.beatIn > 0.99 && local > 0.02 && local < 0.42;
    const here = holding ? (buttons.find((b) => beatOf(b) === k) ?? null) : null;

    if (playing && playing !== here) stop(playing);
    if (dismissed && dismissed !== here) dismissed = null;

    held = here && !playing ? held + deltaMs / 1000 : 0;
    if (here && !playing && here !== dismissed && held > AUTO_AFTER && !calm) start(here);

    if (!playing) return;
    if (mode === 'stage' && hud) {
      const exp = getExp();
      const r = exp?.demoScreenRect();
      const video = exp?.demoVideo;
      if (!r || !video) return;
      hud.style.left = `${r.left}px`;
      hud.style.top = `${r.bottom + 14}px`;
      hud.style.width = `${r.width}px`;
      hud.classList.add('is-on');
      if (hudFill) hudFill.style.transform = `scaleX(${video.duration ? video.currentTime / video.duration : 0})`;
      if (hudCaption) {
        const text = captionAt(captions, video.currentTime);
        if (hudCaption.textContent !== text) hudCaption.textContent = text;
      }
    } else if (mode === 'inline') {
      const video = inlineOf(playing);
      const cap = inlineCaptionOf(playing);
      if (video && cap) {
        const text = captionAt(captions, video.currentTime);
        if (cap.textContent !== text) cap.textContent = text;
      }
    }
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    if (playing) stop(playing);
  };
}
