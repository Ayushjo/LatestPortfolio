import github from '../../data/github.json';
import { CALENDAR, calendarSize } from './calendarGeometry';
import { circle, fillRect, tone, type ShapeDef } from './draw';

export const GITHUB_SHAPES: Record<string, ShapeDef> = {
  /**
   * The real contribution calendar. Busier days get bigger, denser cells, so they
   * pull in more particles and glow brighter.
   */
  calendar: (() => {
    const { weeks } = github.calendar;
    const { width, height } = calendarSize(weeks.length);
    return {
      width,
      height,
      draw(ctx) {
        const step = CALENDAR.cell + CALENDAR.gap;
        weeks.forEach((week, w) => {
          week.forEach((count, d) => {
            const cx = CALENDAR.pad + w * step + CALENDAR.cell / 2;
            const cy = CALENDAR.pad + d * step + CALENDAR.cell / 2;
            if (count === 0) {
              circle(ctx, cx, cy, 1.6);
              return;
            }
            const s = count < 4 ? 9 : count < 10 ? 13 : count < 25 ? 17 : 20;
            const style = count < 4 ? tone(ctx, 0.5) : '#fff';
            fillRect(ctx, { x: cx - s / 2, y: cy - s / 2, w: s, h: s }, 0, style);
          });
        });
      },
    } satisfies ShapeDef;
  })(),
};
