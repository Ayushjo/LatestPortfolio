import { MODES, getMode, onModeChange, setMode, type Mode } from './mode';

export function initSlider(root: HTMLElement): void {
  const stops = [...root.querySelectorAll<HTMLButtonElement>('[data-stop]')];
  const thumb = root.querySelector<HTMLElement>('.thumb');

  const sync = (mode: Mode) => {
    for (const s of stops) {
      const on = s.dataset.stop === mode;
      s.setAttribute('aria-checked', String(on));
      s.tabIndex = on ? 0 : -1;
    }
  };
  sync(getMode());
  onModeChange((m) => sync(m));

  root.addEventListener('keydown', (e) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = (MODES.indexOf(getMode()) + dir + MODES.length) % MODES.length;
    setMode(MODES[i]!);
    stops[i]?.focus();
  });

  // Pointer: a tap selects a stop; a drag starting on the active stop slides the thumb and snaps on release.
  let dragging = false;
  let moved = false;
  let startX = 0;

  const geometry = () => {
    const r = root.getBoundingClientRect();
    const inner = r.width - 8;
    return { r, w: inner / 3, inner };
  };
  const indexAt = (clientX: number) => {
    const { r } = geometry();
    return Math.max(0, Math.min(2, Math.floor(((clientX - r.left) / r.width) * 3)));
  };

  root.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-stop]');
    if (!target) return;
    startX = e.clientX;
    moved = false;
    dragging = target.getAttribute('aria-checked') === 'true';
    if (dragging) root.setPointerCapture(e.pointerId);
  });

  root.addEventListener('pointermove', (e) => {
    if (!dragging || !thumb) return;
    if (!moved && Math.abs(e.clientX - startX) < 4) return;
    moved = true;
    root.classList.add('is-dragging');
    const { r, w, inner } = geometry();
    const x = Math.max(0, Math.min(inner - w, e.clientX - r.left - 4 - w / 2));
    thumb.style.transform = `translateX(${x}px)`;
  });

  const end = (e: PointerEvent) => {
    const wasDrag = dragging && moved;
    dragging = false;
    root.classList.remove('is-dragging');
    if (thumb) thumb.style.transform = '';
    if (wasDrag) {
      setMode(MODES[indexAt(e.clientX)]!);
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-stop]');
    const hit = target ?? stops[indexAt(e.clientX)];
    if (hit) setMode(hit.dataset.stop as Mode);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', () => {
    dragging = false;
    root.classList.remove('is-dragging');
    if (thumb) thumb.style.transform = '';
  });

  // Keyboard/AT activation without a pointer.
  for (const s of stops) {
    s.addEventListener('click', (e) => {
      if ((e as PointerEvent).pointerType) return;
      setMode(s.dataset.stop as Mode);
    });
  }
}
