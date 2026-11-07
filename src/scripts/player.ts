/**
 * The résumé's demo player: `[data-demo-open]` links (real links to the .mp4, so they work
 * without JavaScript) open the clip in a dialog with its synced captions and a progress line.
 */

interface Caption {
  from: number;
  to: number;
  text: string;
}

const captionCache = new Map<string, Promise<Caption[]>>();
function captionsFor(url?: string): Promise<Caption[]> {
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

export function initPlayer(root: ParentNode = document): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-player]');
  if (!dialog || dialog.dataset.ready) return;
  dialog.dataset.ready = '1';
  const video = dialog.querySelector('video')!;
  const title = dialog.querySelector<HTMLElement>('[data-player-title]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-player-caption]')!;
  const fill = dialog.querySelector<HTMLElement>('[data-player-fill]')!;
  let captions: Caption[] = [];
  let opener: HTMLElement | null = null;

  const open = async (link: HTMLAnchorElement) => {
    opener = link;
    title.textContent = link.dataset.title ?? '';
    caption.textContent = '';
    fill.style.transform = 'scaleX(0)';
    video.poster = link.dataset.poster ?? '';
    video.src = link.href;
    dialog.showModal();
    void video.play().catch(() => {});
    captions = [];
    captions = await captionsFor(link.dataset.captions);
  };
  const close = () => dialog.open && dialog.close();

  root.addEventListener('click', (event) => {
    const e = event as MouseEvent;
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-demo-open]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    void open(link);
  });
  dialog.querySelector('[data-player-close]')!.addEventListener('click', close);
  // A click on the backdrop (the dialog element itself, outside the frame) closes it.
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    opener?.focus({ preventScroll: true });
  });
  // Space toggles playback while the dialog is open.
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    if (video.paused) void video.play();
    else video.pause();
  });
  video.addEventListener('click', () => (video.paused ? void video.play() : video.pause()));
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    fill.style.transform = `scaleX(${video.duration ? t / video.duration : 0})`;
    const text = captions.find((c) => t >= c.from && t < c.to)?.text ?? '';
    if (caption.textContent !== text) caption.textContent = text;
  });
}
