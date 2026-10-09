import { CALENDAR, calendarSize } from '../gl/shapes/calendarGeometry';

/**
 * Hover readout for the particle contribution calendar. Reproduces the "center" shape
 * placement from StreamScene so pointer positions map onto the same day cells.
 */
export function initCalendarReadout(section: HTMLElement): void {
  const readout = section.querySelector<HTMLElement>('[data-calendar-readout]');
  const raw = section.querySelector<HTMLScriptElement>('[data-calendar-data]')?.textContent;
  if (!readout || !raw) return;
  const { weeks, start } = JSON.parse(raw) as { weeks: number[][]; start: string };
  const { width: cw, height: ch } = calendarSize(weeks.length);
  const startDate = new Date(`${start}T00:00:00Z`);
  const step = CALENDAR.cell + CALENDAR.gap;

  const rect = () => {
    const W = innerWidth;
    const H = innerHeight;
    const wide = W / H > 1.15;
    const maxW = wide ? 0.75 * W : 0.85 * W;
    const maxH = wide ? 0.45 * H : 0.36 * H;
    const s = Math.min(maxW / cw, maxH / ch);
    const cy = H / 2 - (wide ? 0.2 : 0.42) * (H / 2);
    return { x: W / 2 - (cw * s) / 2, y: cy - (ch * s) / 2, s };
  };

  section.addEventListener('pointermove', (e) => {
    if (!section.classList.contains('is-active')) return;
    const r = rect();
    const lx = (e.clientX - r.x) / r.s - CALENDAR.pad;
    const ly = (e.clientY - r.y) / r.s - CALENDAR.pad;
    const w = Math.floor(lx / step);
    const d = Math.floor(ly / step);
    const count = weeks[w]?.[d];
    if (count === undefined || lx < 0 || ly < 0) {
      readout.classList.remove('is-on');
      return;
    }
    const day = new Date(startDate.getTime() + (w * 7 + d) * 86_400_000);
    const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    readout.textContent = `${label} · ${count} contribution${count === 1 ? '' : 's'}`;
    const host = section.querySelector<HTMLElement>('.act-sticky')!.getBoundingClientRect();
    readout.style.left = `${r.x + (CALENDAR.pad + w * step + CALENDAR.cell / 2) * r.s - host.left}px`;
    readout.style.top = `${r.y + (CALENDAR.pad + d * step) * r.s - host.top}px`;
    readout.classList.add('is-on');
  });
  section.addEventListener('pointerleave', () => readout.classList.remove('is-on'));
}
