import { circle, fillRect, line, ring, rng, squarify, tone, type ShapeDef } from './draw';


/** One signature shape per project, keyed by project slug. */
export const PROJECT_SHAPES: Record<string, ShapeDef> = {
  /**
   * The shop owner talks (speech bubble rising from his shopfront) → the orchestrator →
   * specialists: ₹ payments, the ledger, sourcing, and the agent factory hiring (dashed gear).
   */
  sahaayak: {
    width: 1000,
    height: 900,
    draw(ctx) {
      const hub = { x: 500, y: 330 };
      const agents: [number, number][] = [
        [140, 170],
        [380, 105],
        [620, 105],
        [860, 170],
      ];
      for (const [x, y] of agents) line(ctx, [[hub.x, hub.y], [x, y]], 8);
      line(ctx, [[hub.x, hub.y + 40], [hub.x, 440]], 8);
      ring(ctx, hub.x, hub.y, 64, 6);
      circle(ctx, hub.x, hub.y, 40);

      // Agents, each with its job as a glyph.
      for (const [i, [x, y]] of agents.entries()) {
        ctx.globalCompositeOperation = 'destination-out';
        circle(ctx, x, y, 62);
        ctx.globalCompositeOperation = 'source-over';
        ring(ctx, x, y, 62, 10, i === 3 ? [16, 12] : []);
      }
      ctx.globalCompositeOperation = 'destination-out';
      for (const [x, y] of agents) circle(ctx, x, y, 56);
      ctx.globalCompositeOperation = 'source-over';
      // ₹ — payments (Vasool)
      ctx.font = '900 78px "Inter Tight", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹', agents[0]![0], agents[0]![1] + 4);
      // Ledger — cash flow (Khata)
      {
        const [x, y] = agents[1]!;
        ctx.save();
        ctx.lineWidth = 7;
        ctx.strokeRect(x - 26, y - 32, 52, 64);
        ctx.restore();
        for (const dy of [-14, 0, 14]) line(ctx, [[x - 14, y + dy], [x + 14, y + dy]], 5);
      }
      // Box — sourcing (Sourcer)
      {
        const [x, y] = agents[2]!;
        ctx.save();
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x + 30, y - 14);
        ctx.lineTo(x + 30, y + 20);
        ctx.lineTo(x, y + 36);
        ctx.lineTo(x - 30, y + 20);
        ctx.lineTo(x - 30, y - 14);
        ctx.closePath();
        ctx.moveTo(x - 30, y - 14);
        ctx.lineTo(x, y + 2);
        ctx.lineTo(x + 30, y - 14);
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x, y + 36);
        ctx.stroke();
        ctx.restore();
      }
      // Gear — the agent factory (Nirmata)
      {
        const [x, y] = agents[3]!;
        for (let t = 0; t < 8; t++) {
          const a = (t / 8) * Math.PI * 2;
          line(ctx, [[x + Math.cos(a) * 20, y + Math.sin(a) * 20], [x + Math.cos(a) * 36, y + Math.sin(a) * 36]], 11);
        }
        ring(ctx, x, y, 22, 9);
      }

      // The owner's message.
      ctx.save();
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(380, 440, 240, 92, 26);
      ctx.moveTo(452, 532);
      ctx.lineTo(438, 578);
      ctx.lineTo(492, 532);
      ctx.stroke();
      ctx.restore();
      for (const dx of [-44, 0, 44]) circle(ctx, 500 + dx, 486, 11);

      // His shop: striped, scalloped awning over a counter and a door.
      const ax = 300;
      const aw = 400;
      const stripes = 8;
      for (let s = 0; s < stripes; s++) {
        const x = ax + (s * aw) / stripes;
        ctx.fillStyle = tone(ctx, s % 2 ? 0.5 : 1);
        ctx.fillRect(x, 600, aw / stripes, 70);
        ctx.beginPath();
        ctx.arc(x + aw / stripes / 2, 670, aw / stripes / 2, 0, Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.save();
      ctx.lineWidth = 10;
      ctx.strokeRect(325, 700, 350, 170);
      ctx.lineWidth = 8;
      ctx.strokeRect(355, 735, 130, 80);
      ctx.strokeRect(545, 735, 100, 135);
      ctx.restore();
    },
  },

  /** Issue in → plan, code, test → pull request out, with its diff. */
  pullwright: {
    width: 1100,
    height: 620,
    draw(ctx) {
      const card = (x: number, y: number, w: number, h: number) => {
        ctx.save();
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 24);
        ctx.stroke();
        ctx.restore();
      };
      // The issue.
      card(30, 150, 300, 320);
      ring(ctx, 92, 215, 26, 8);
      circle(ctx, 92, 215, 8);
      fillRect(ctx, { x: 136, y: 202, w: 166, h: 28 }, 0, '#fff');
      [240, 200, 160].forEach((w, i) => fillRect(ctx, { x: 62, y: 285 + i * 44, w, h: 16 }, 0, tone(ctx, 0.5)));

      // The agent's pipeline: plan → code → test.
      line(ctx, [[330, 310], [770, 310]], 8);
      line(ctx, [[742, 290], [770, 310], [742, 330]], 8);
      const steps = [440, 550, 660];
      for (const x of steps) {
        ctx.globalCompositeOperation = 'destination-out';
        circle(ctx, x, 310, 42);
        ctx.globalCompositeOperation = 'source-over';
        ring(ctx, x, 310, 42, 8);
      }
      ctx.globalCompositeOperation = 'destination-out';
      for (const x of steps) circle(ctx, x, 310, 37);
      ctx.globalCompositeOperation = 'source-over';
      for (const dy of [-12, 0, 12]) line(ctx, [[422, 310 + dy], [458, 310 + dy]], 5);
      line(ctx, [[540, 296], [528, 310], [540, 324]], 6);
      line(ctx, [[560, 296], [572, 310], [560, 324]], 6);
      line(ctx, [[644, 312], [656, 324], [678, 298]], 7);

      // The pull request, with its diff.
      card(770, 110, 300, 400);
      ring(ctx, 826, 160, 13, 6);
      ring(ctx, 826, 222, 13, 6);
      line(ctx, [[826, 173], [826, 209]], 6);
      ring(ctx, 878, 222, 13, 6);
      line(ctx, [[878, 209], [878, 172], [862, 160], [850, 160]], 6);
      fillRect(ctx, { x: 910, y: 176, w: 130, h: 26 }, 0, '#fff');
      const rows: [boolean, number][] = [
        [true, 200],
        [true, 160],
        [false, 130],
        [true, 190],
        [true, 110],
        [false, 150],
        [true, 90],
      ];
      rows.forEach(([add, w], i) => {
        const y = 268 + i * 32;
        const mark = 806;
        line(ctx, [[mark - 9, y], [mark + 9, y]], 5);
        if (add) line(ctx, [[mark, y - 9], [mark, y + 9]], 5);
        fillRect(ctx, { x: 830, y: y - 8, w, h: 16 }, 0, tone(ctx, add ? 1 : 0.25));
      });
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

  /**
   * One leader's price line with its BUY, echoed by followers' lines below — the same path at
   * their own size — and a dashed drop through every copy: filled in the same instant.
   */
  believemeguys: {
    width: 1000,
    height: 760,
    draw(ctx) {
      const path = (x: number) =>
        Math.sin(x * 0.012) * 34 + Math.sin(x * 0.031 + 1.3) * 14 - (x - 120) * 0.11 + (x > 430 ? -(x - 430) * 0.12 : 0);
      const buyX = 430;
      const traces = [
        { y: 190, scale: 1, width: 13, density: 1 as const },
        { y: 360, scale: 0.75, width: 9, density: 1 as const },
        { y: 500, scale: 0.55, width: 9, density: 0.5 as const },
        { y: 620, scale: 0.4, width: 8, density: 0.5 as const },
      ];
      line(ctx, [[buyX, traces[0]!.y + path(buyX)], [buyX, 700]], 4, [10, 12]);
      traces.forEach((t, i) => {
        const pts: [number, number][] = [];
        for (let x = 120; x <= 950; x += 8) pts.push([x, t.y + path(x) * t.scale]);
        ctx.save();
        ctx.strokeStyle = tone(ctx, t.density);
        line(ctx, pts, t.width);
        ctx.restore();
        const by = t.y + path(buyX) * t.scale;
        ctx.globalCompositeOperation = 'destination-out';
        circle(ctx, buyX, by, i === 0 ? 30 : 20);
        ctx.globalCompositeOperation = 'source-over';
        ring(ctx, buyX, by, i === 0 ? 30 : 20, i === 0 ? 8 : 6);
        circle(ctx, buyX, by, i === 0 ? 11 : 7);
      });
      // The verified leader's badge.
      const ly = traces[0]!.y + path(120);
      circle(ctx, 70, ly, 36);
      ctx.globalCompositeOperation = 'destination-out';
      line(ctx, [[54, ly + 2], [66, ly + 14], [88, ly - 10]], 9);
      ctx.globalCompositeOperation = 'source-over';
      // Followers' avatars.
      traces.slice(1).forEach((t) => ring(ctx, 70, t.y + path(120) * t.scale, 22, 7));
    },
  },

  /** The stream splits: keep going, or skip ahead. */
  fork: {
    width: 1000,
    height: 700,
    draw(ctx) {
      ctx.save();
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(500, 690);
      ctx.lineTo(500, 400);
      ctx.bezierCurveTo(500, 260, 240, 260, 230, 80);
      ctx.moveTo(500, 400);
      ctx.bezierCurveTo(500, 260, 760, 260, 770, 80);
      ctx.stroke();
      ctx.restore();
      ring(ctx, 230, 60, 40, 14);
      ring(ctx, 770, 60, 40, 14);
      circle(ctx, 230, 60, 14);
      circle(ctx, 770, 60, 14);
      for (let y = 470; y < 680; y += 46) circle(ctx, 500, y, 9);
    },
  },
};
