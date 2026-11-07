import { gsap } from 'gsap';
import type { Experience } from '../gl/Experience';
import { progress, type Beat, type ShapeSide } from './scroll';

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
 * inline in the panel, with the same captions. Nothing plays by itself: ▶ Demo, or a click on
 * the chapter's particle shape (which glows and shows "▶ Watch" under the pointer), starts it.
 */
export function initDemos(getExp: () => Experience | null, beats: Beat[]): () => void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-demo]')];
  const hud = document.querySelector<HTMLElement>('[data-demo-hud]');
  if (!buttons.length) return () => {};

  const tall = () => innerWidth / innerHeight <= 1.15;
  const beatOf = (btn: HTMLButtonElement) => beats.findIndex((b) => b.key === btn.dataset.demo);
  const chapterOf = (btn: HTMLButtonElement) => btn.closest<HTMLElement>('[data-beat]');
  const inlineOf = (btn: HTMLButtonElement) =>
    document.querySelector<HTMLVideoElement>(`[data-inline-demo="${btn.dataset.demo}"]`);
  const inlineCaptionOf = (btn: HTMLButtonElement) =>
    document.querySelector<HTMLElement>(`[data-inline-caption="${btn.dataset.demo}"]`);

  let playing: HTMLButtonElement | null = null;
  let mode: 'stage' | 'inline' | null = null;
  let captions: Caption[] = [];

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
      if (playing === btn) stop(btn);
      else start(btn);
    });
  }

  const hudFill = hud?.querySelector<HTMLElement>('.fill');
  const hudCaption = hud?.querySelector<HTMLElement>('.caption');

  // ---- Click the shape to play. ----
  const label = document.createElement('div');
  label.className = 'watch-cursor';
  label.setAttribute('aria-hidden', 'true');
  label.innerHTML = '<span>▶</span> Watch';
  document.body.append(label);
  const PAD = 18;
  /** The demo button whose chapter shape is under (x, y), if any. */
  const demoAt = (x: number, y: number, target: EventTarget | null): HTMLButtonElement | null => {
    if (playing || tall()) return null;
    if (target instanceof Element && target.closest('a, button, input, textarea, select, .panel, .site-header, .rail')) return null;
    const hit = getExp()?.heldShapeRect();
    if (!hit) return null;
    const { rect: r, key } = hit;
    if (x < r.left - PAD || x > r.right + PAD || y < r.top - PAD || y > r.bottom + PAD) return null;
    return buttons.find((b) => b.dataset.demo === key) ?? null;
  };
  let hovering: HTMLButtonElement | null = null;
  const setHover = (btn: HTMLButtonElement | null) => {
    if (btn === hovering) return;
    hovering = btn;
    document.documentElement.classList.toggle('is-over-demo', !!btn);
    getExp()?.setShapeGlow(!!btn);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    setHover(demoAt(e.clientX, e.clientY, e.target));
    if (hovering) label.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
  };
  const onClick = (e: MouseEvent) => {
    const btn = demoAt(e.clientX, e.clientY, e.target);
    if (!btn) return;
    setHover(null);
    start(btn);
  };
  // Leaving the window straight from the shape sends no further moves.
  const onOut = (e: PointerEvent) => !e.relatedTarget && setHover(null);
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerout', onOut);
  addEventListener('click', onClick);
  addEventListener('scroll', () => hovering && setHover(null), { passive: true });

  const tick = () => {
    const k = Math.floor(progress.beat);
    const local = progress.beat - k;
    const holding = progress.beatIn > 0.99 && local > 0.02 && local < 0.42;
    const here = holding ? (buttons.find((b) => beatOf(b) === k) ?? null) : null;

    if (playing && playing !== here) stop(playing);

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
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerout', onOut);
    removeEventListener('click', onClick);
    setHover(null);
    label.remove();
    gsap.ticker.remove(tick);
    if (playing) stop(playing);
  };
}
