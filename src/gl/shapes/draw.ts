import { inkCanvas } from './sample';

export type Ctx = CanvasRenderingContext2D;
export type Drawer = (ctx: Ctx, w: number, h: number) => void;

export interface ShapeDef {
  width: number;
  height: number;
  draw: Drawer;
}

/** Deterministic RNG so shapes are identical on every load. */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const circle = (ctx: Ctx, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

export const ring = (ctx: Ctx, x: number, y: number, r: number, width: number, dash: number[] = []) => {
  ctx.save();
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const line = (ctx: Ctx, pts: [number, number][], width: number, dash: number[] = []) => {
  ctx.save();
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
};

/**
 * Fill patterns of decreasing density. The sampler scatters particles uniformly over ink,
 * so a sparser pattern reads as a dimmer silver: tone without colour.
 */
export function tone(ctx: Ctx, density: 1 | 0.5 | 0.25): string | CanvasPattern {
  if (density === 1) return '#fff';
  const { canvas, ctx: p } = inkCanvas(4, 4);
  if (density === 0.5) {
    p.fillRect(0, 0, 2, 2);
    p.fillRect(2, 2, 2, 2);
  } else {
    p.fillRect(0, 0, 2, 2);
  }
  return ctx.createPattern(canvas, 'repeat')!;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap (Bruls, Huizing & van Wijk) — the layout DiskMap itself uses. */
export function squarify(values: number[], box: Rect): Rect[] {
  const total = values.reduce((a, b) => a + b, 0);
  const areas = [...values].sort((a, b) => b - a).map((v) => (v / total) * box.w * box.h);
  const out: Rect[] = [];
  let { x, y, w, h } = box;
  let row: number[] = [];

  const worst = (r: number[], side: number) => {
    const s = r.reduce((a, b) => a + b, 0);
    return Math.max(...r.map((a) => Math.max((side * side * a) / (s * s), (s * s) / (side * side * a))));
  };
  const flush = () => {
    const s = row.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const cw = s / h;
      let cy = y;
      for (const a of row) {
        out.push({ x, y: cy, w: cw, h: a / cw });
        cy += a / cw;
      }
      x += cw;
      w -= cw;
    } else {
      const rh = s / w;
      let cx = x;
      for (const a of row) {
        out.push({ x: cx, y, w: a / rh, h: rh });
        cx += a / rh;
      }
      y += rh;
      h -= rh;
    }
    row = [];
  };

  for (let i = 0; i < areas.length; ) {
    const side = Math.min(w, h);
    const a = areas[i]!;
    if (row.length === 0 || worst([...row, a], side) <= worst(row, side)) {
      row.push(a);
      i++;
    } else flush();
  }
  if (row.length) flush();
  return out;
}

export const fillRect = (ctx: Ctx, r: Rect, gap: number, style: string | CanvasPattern) => {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.roundRect(r.x + gap / 2, r.y + gap / 2, Math.max(0, r.w - gap), Math.max(0, r.h - gap), 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
};
