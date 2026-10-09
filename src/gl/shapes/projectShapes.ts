import { inkCanvas } from './sample';

type Ctx = CanvasRenderingContext2D;
type Drawer = (ctx: Ctx, w: number, h: number) => void;

interface ShapeDef {
  width: number;
  height: number;
  draw: Drawer;
}

/** Deterministic RNG so shapes are identical on every load. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const circle = (ctx: Ctx, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

const ring = (ctx: Ctx, x: number, y: number, r: number, width: number, dash: number[] = []) => {
  ctx.save();
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const line = (ctx: Ctx, pts: [number, number][], width: number, dash: number[] = []) => {
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
function tone(ctx: Ctx, density: 1 | 0.5 | 0.25): string | CanvasPattern {
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

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap (Bruls, Huizing & van Wijk) — the layout DiskMap itself uses. */
function squarify(values: number[], box: Rect): Rect[] {
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

const fillRect = (ctx: Ctx, r: Rect, gap: number, style: string | CanvasPattern) => {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.roundRect(r.x + gap / 2, r.y + gap / 2, Math.max(0, r.w - gap), Math.max(0, r.h - gap), 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
};

export const SHAPES: Record<string, ShapeDef> = {
  /** Orchestrator at the centre, specialists in orbit, the agent factory hiring a new one. */
  sahaayak: {
    width: 1000,
    height: 1000,
    draw(ctx) {
      const c = 500;
      ring(ctx, c, c, 300, 6, [2, 22]);
      ring(ctx, c, c, 440, 4, [2, 34]);
      const specialists = [-90, 30, 150].map((d) => (d * Math.PI) / 180);
      for (const a of specialists) {
        const x = c + Math.cos(a) * 300;
        const y = c + Math.sin(a) * 300;
        line(ctx, [[c, c], [x, y]], 16);
        circle(ctx, x, y, 66);
      }
      // Nirmata, the factory, and the specialist it is spinning up (dashed: being hired).
      const fa = (-30 * Math.PI) / 180;
      const fx = c + Math.cos(fa) * 300;
      const fy = c + Math.sin(fa) * 300;
      line(ctx, [[c, c], [fx, fy]], 16);
      ctx.fillStyle = tone(ctx, 0.5);
      circle(ctx, fx, fy, 66);
      ctx.fillStyle = '#fff';
      ring(ctx, fx, fy, 66, 10);
      const na = (-55 * Math.PI) / 180;
      const nx = c + Math.cos(na) * 440;
      const ny = c + Math.sin(na) * 440;
      line(ctx, [[fx, fy], [nx, ny]], 8, [14, 14]);
      ring(ctx, nx, ny, 44, 9, [16, 12]);
      circle(ctx, c, c, 128);
      ctx.globalCompositeOperation = 'destination-out';
      circle(ctx, c, c, 70);
      ctx.globalCompositeOperation = 'source-over';
      circle(ctx, c, c, 34);
    },
  },

  /** main, a feature branch that opens from an issue, and the merge back as a PR. */
  pullwright: {
    width: 1000,
    height: 620,
    draw(ctx) {
      const y = 430;
      line(ctx, [[40, y], [960, y]], 18);
      ctx.save();
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(250, y);
      ctx.bezierCurveTo(330, y, 330, 170, 420, 170);
      ctx.lineTo(620, 170);
      ctx.bezierCurveTo(710, 170, 710, y, 790, y);
      ctx.stroke();
      ctx.restore();
      for (const x of [110, 250, 900]) circle(ctx, x, y, 30);
      for (const x of [440, 530, 620]) circle(ctx, x, 170, 30);
      ring(ctx, 790, y, 46, 14);
      circle(ctx, 790, y, 20);
      // The issue it started from.
      ring(ctx, 250, 140, 48, 12);
      circle(ctx, 250, 140, 12);
      line(ctx, [[250, 196], [250, 300]], 8, [10, 14]);
    },
  },

  /** A squarified treemap of a disk, with a nested level inside the biggest folders. */
  diskmap: {
    width: 1000,
    height: 700,
    draw(ctx) {
      const top = squarify([34, 21, 13, 9, 7, 5, 4, 3, 2, 1.5, 1], { x: 0, y: 0, w: 1000, h: 700 });
      const tones: (1 | 0.5 | 0.25)[] = [1, 0.5, 1, 0.25, 1, 0.5, 1, 0.25, 1, 0.5, 1];
      top.forEach((r, i) => {
        if (i < 3) {
          const inner = squarify([9, 6, 4, 3, 2, 1.5, 1, 1], { x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16 });
          inner.forEach((ir, j) => fillRect(ctx, ir, 8, tone(ctx, ([1, 0.5, 0.25, 1] as const)[j % 4]!)));
        } else {
          fillRect(ctx, r, 16, tone(ctx, tones[i]!));
        }
      });
    },
  },

  /** Clients → gateway → backends; the slow backend gets a hairline and a hollow box. */
  relay: {
    width: 1000,
    height: 620,
    draw(ctx) {
      const gx = 470;
      const gy = 310;
      const clients = [90, 160, 230, 310, 390, 460, 530];
      for (const cy of clients) {
        line(ctx, [[90, cy], [gx, gy]], 5);
        circle(ctx, 90, cy, 18);
      }
      const backends: [number, number][] = [
        [130, 16],
        [310, 16],
        [490, 3],
      ];
      for (const [by, w] of backends) line(ctx, [[gx, gy], [800, by]], w, w < 5 ? [10, 12] : []);
      ctx.beginPath();
      ctx.moveTo(gx, gy - 95);
      ctx.lineTo(gx + 95, gy);
      ctx.lineTo(gx, gy + 95);
      ctx.lineTo(gx - 95, gy);
      ctx.closePath();
      ctx.fill();
      fillRect(ctx, { x: 800, y: 80, w: 170, h: 100 }, 0, '#fff');
      fillRect(ctx, { x: 800, y: 260, w: 170, h: 100 }, 0, '#fff');
      ctx.save();
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(804, 444, 162, 92, 6);
      ctx.stroke();
      ctx.restore();
    },
  },

  /** Memtable on top, SSTable levels widening below: the shape of an LSM-tree. */
  strata: {
    width: 1000,
    height: 720,
    draw(ctx) {
      fillRect(ctx, { x: 400, y: 10, w: 200, h: 84 }, 0, '#fff');
      line(ctx, [[500, 110], [500, 170]], 8, [10, 10]);
      const levels = [2, 4, 7, 11];
      const blockW = 82;
      levels.forEach((n, li) => {
        const y = 190 + li * 132;
        const total = n * blockW + (n - 1) * 8;
        for (let b = 0; b < n; b++) {
          const x = 500 - total / 2 + b * (blockW + 8);
          fillRect(ctx, { x, y, w: blockW, h: 100 }, 0, tone(ctx, li % 2 === 0 ? 1 : 0.5));
        }
      });
    },
  },

  /** A prism splitting one beam into a fan of rays. */
  thecineprism: {
    width: 1000,
    height: 620,
    draw(ctx) {
      const cx = 470;
      const cy = 330;
      const s = 210;
      const p: [number, number][] = [
        [cx, cy - s],
        [cx + s * 0.9, cy + s * 0.55],
        [cx - s * 0.9, cy + s * 0.55],
      ];
      line(ctx, [[20, 450], [cx - s * 0.42, cy + 30]], 18);
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        line(ctx, [[cx + s * 0.4, cy + 10], [990, 110 + t * 420]], 16 - i * 1.4);
      }
      ctx.fillStyle = tone(ctx, 0.25);
      ctx.beginPath();
      ctx.moveTo(...p[0]!);
      ctx.lineTo(...p[1]!);
      ctx.lineTo(...p[2]!);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 16;
      ctx.stroke();
    },
  },

  /** Candles climbing, a tilt drawdown, and the recovery. */
  tradelogs: {
    width: 1000,
    height: 620,
    draw(ctx) {
      const r = rng(7);
      let price = 420;
      for (let i = 0; i < 16; i++) {
        const drift = i >= 7 && i <= 9 ? 55 : -24;
        const open = price;
        const close = price + drift + (r() - 0.5) * 50;
        const hi = Math.min(open, close) - 20 - r() * 40;
        const lo = Math.max(open, close) + 20 + r() * 40;
        const x = 50 + i * 60;
        line(ctx, [[x, hi], [x, lo]], 6);
        const top = Math.min(open, close);
        const h = Math.max(10, Math.abs(close - open));
        if (close < open) fillRect(ctx, { x: x - 18, y: top, w: 36, h }, 0, '#fff');
        else {
          ctx.save();
          ctx.lineWidth = 6;
          ctx.strokeRect(x - 16, top + 2, 32, h - 4);
          ctx.restore();
        }
        price = Math.max(110, Math.min(560, close));
      }
    },
  },

  /** A sensor trace with one anomaly flagged, over a grid of sensor points. */
  'ics-fault-detection': {
    width: 1000,
    height: 620,
    draw(ctx) {
      const pts: [number, number][] = [];
      for (let x = 20; x <= 980; x += 6) {
        let y = 250 + Math.sin(x * 0.025) * 60 + Math.sin(x * 0.071) * 18;
        if (x > 560 && x < 640) y -= Math.sin(((x - 560) / 80) * Math.PI) * 190;
        pts.push([x, y]);
      }
      line(ctx, pts, 12);
      ring(ctx, 600, 120, 70, 8, [12, 10]);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 17; col++) {
          const x = 60 + col * 55;
          const y = 470 + row * 50;
          if (x > 560 && x < 640 && row === 1) ring(ctx, x, y, 14, 5);
          else circle(ctx, x, y, row === 1 ? 10 : 7);
        }
      }
    },
  },

  /** A knowledge graph: concepts linked to their nearest prerequisites. */
  learngraph: {
    width: 1000,
    height: 760,
    draw(ctx) {
      const r = rng(42);
      const nodes = Array.from({ length: 30 }, () => ({ x: 60 + r() * 880, y: 60 + r() * 640, s: 10 + r() * 26 }));
      for (const a of nodes) {
        const near = nodes
          .filter((b) => b !== a)
          .sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))
          .slice(0, 2);
        for (const b of near) line(ctx, [[a.x, a.y], [b.x, b.y]], 5);
      }
      for (const n of nodes) circle(ctx, n.x, n.y, n.s);
    },
  },
};

export function drawShape(slug: string): HTMLCanvasElement {
  const def = SHAPES[slug] ?? SHAPES.strata!;
  const { canvas, ctx } = inkCanvas(def.width, def.height);
  def.draw(ctx, def.width, def.height);
  return canvas;
}
