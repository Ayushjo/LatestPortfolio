import github from '../../data/github.json';
import { circle, fillRect, line, ring, rng, tone, type Ctx, type ShapeDef } from './draw';

interface DirNode {
  path: string;
  own: number;
  total: number;
  children: DirNode[];
}

/** Rebuild the spotlight repo's directory tree from the per-directory file counts. */
function buildTree(dirs: [string, number][]): DirNode {
  const nodes = new Map<string, DirNode>();
  const get = (path: string): DirNode => {
    let n = nodes.get(path);
    if (!n) {
      n = { path, own: 0, total: 0, children: [] };
      nodes.set(path, n);
      if (path !== '.') {
        const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.';
        get(parent).children.push(n);
      }
    }
    return n;
  };
  for (const [path, count] of dirs) get(path).own += count;
  const sum = (n: DirNode): number => (n.total = n.own + n.children.reduce((s, c) => s + sum(c), 0));
  const root = get('.');
  sum(root);
  return root;
}

/**
 * FreeCAD as a galaxy: one dot per file, directories as angular sectors, depth as
 * radius, with a slight spiral twist. The files Ayush changed are ringed.
 */
function drawGalaxy(ctx: Ctx) {
  const dirs = github.spotlight.dirs as unknown as [string, number][];
  const { changed } = github.spotlight;
  const root = buildTree(dirs);
  const rand = rng(7);
  const C = 500;
  const radius = (depth: number) => 52 + depth * 54;
  const twist = 0.0024;
  const changedDirs = new Map(changed.map((p) => [p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.', p]));
  const marks: [number, number][] = [];

  const place = (n: DirNode, a0: number, a1: number, depth: number) => {
    const span = a1 - a0;
    const ownSpan = n.total ? (span * n.own) / n.total : 0;
    for (let i = 0; i < n.own; i++) {
      const r = radius(depth) + (rand() - 0.5) * 40;
      const a = a0 + ownSpan * ((i + rand()) / n.own) + r * twist;
      circle(ctx, C + Math.cos(a) * r, C + Math.sin(a) * r, 1.7);
    }
    if (changedDirs.has(n.path)) {
      const r = radius(depth);
      const a = a0 + ownSpan / 2 + r * twist;
      marks.push([C + Math.cos(a) * r, C + Math.sin(a) * r]);
    }
    let a = a0 + ownSpan;
    for (const c of [...n.children].sort((x, y) => x.path.localeCompare(y.path))) {
      const cs = (span * c.total) / n.total;
      place(c, a, a + cs, depth + 1);
      a += cs;
    }
  };
  place(root, -Math.PI / 2, Math.PI * 1.5, 0);
  circle(ctx, C, C, 22);
  for (const [x, y] of marks) {
    ring(ctx, x, y, 26, 7);
    circle(ctx, x, y, 10);
  }
}

/** Monospace-ish text drawn with the page's display font; faint parts use a sparse tone. */
function drawText(ctx: Ctx, parts: [string, boolean][], x: number, y: number, px: number) {
  ctx.font = `900 ${px}px "Inter Tight", system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const [text, bright] of parts) {
    ctx.fillStyle = bright ? '#fff' : tone(ctx, 0.25);
    ctx.fillText(text, cx, y);
    cx += ctx.measureText(text).width;
  }
  ctx.fillStyle = '#fff';
}

export const OSS_SHAPES: Record<string, ShapeDef> = {
  /** A sticky note that hides itself from screen shares: an eye, struck through. */
  'oss:note': {
    width: 800,
    height: 800,
    draw(ctx) {
      ctx.save();
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(120, 120);
      ctx.lineTo(680, 120);
      ctx.lineTo(680, 560);
      ctx.lineTo(560, 680);
      ctx.lineTo(120, 680);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      line(ctx, [[680, 560], [560, 560], [560, 680]], 10);
      ctx.save();
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(220, 380);
      ctx.quadraticCurveTo(400, 230, 580, 380);
      ctx.quadraticCurveTo(400, 530, 220, 380);
      ctx.stroke();
      ctx.restore();
      circle(ctx, 400, 380, 52);
      line(ctx, [[230, 540], [570, 220]], 16);
    },
  },

  'oss:galaxy': { width: 1000, height: 1000, draw: drawGalaxy },

  /** The NaviCube's view-menu button: a bar, a triangle, and the gap between them that swallowed clicks. */
  'oss:navicube': {
    width: 1000,
    height: 760,
    draw(ctx) {
      const cube: [number, number][][] = [
        [[260, 200], [430, 110], [600, 200], [430, 290]],
        [[260, 200], [430, 290], [430, 490], [260, 400]],
        [[430, 290], [600, 200], [600, 400], [430, 490]],
      ];
      cube.forEach((face, i) => {
        ctx.fillStyle = tone(ctx, i === 0 ? 1 : i === 1 ? 0.5 : 0.25);
        ctx.beginPath();
        face.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.stroke();
      });
      // The button: bar + triangle, with the once-dead gap now part of one hit area.
      fillRect(ctx, { x: 690, y: 520, w: 150, h: 34 }, 0, '#fff');
      ctx.beginPath();
      ctx.moveTo(705, 610);
      ctx.lineTo(825, 610);
      ctx.lineTo(765, 680);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 9]);
      ctx.strokeRect(670, 500, 190, 200);
      ctx.restore();
      fillRect(ctx, { x: 700, y: 566, w: 130, h: 30 }, 0, tone(ctx, 0.5));
      // Cursor clicking right into the gap.
      ctx.beginPath();
      ctx.moveTo(880, 590);
      ctx.lineTo(880, 690);
      ctx.lineTo(906, 664);
      ctx.lineTo(924, 704);
      ctx.lineTo(940, 696);
      ctx.lineTo(922, 657);
      ctx.lineTo(958, 655);
      ctx.closePath();
      ctx.fill();
    },
  },

  /** The Import Mesh filter, now offering 3MF. */
  'oss:3mf': {
    width: 1200,
    height: 520,
    draw(ctx) {
      drawText(ctx, [['*.stl  *.obj', false]], 40, 130, 150);
      drawText(ctx, [['+ ', true], ['*.3mf', true]], 40, 370, 210);
    },
  },

  /** About dialog: "Clipper2 ," becomes "Clipper2 2.0.1,". */
  'oss:clipper': {
    width: 1300,
    height: 520,
    draw(ctx) {
      drawText(ctx, [['Clipper2 ,', false]], 40, 120, 130);
      line(ctx, [[40, 124], [700, 124]], 10);
      drawText(ctx, [['Clipper2 ', false], ['2.0.1', true], [',', false]], 40, 360, 190);
    },
  },

  /** Four merged (checked) and the rest waiting for review (dashed). */
  'oss:coda': {
    width: 1000,
    height: 560,
    draw(ctx) {
      const merged = github.prs.merged.length;
      const open = github.prs.open.length;
      const all = merged + open;
      const cols = 6;
      for (let i = 0; i < all; i++) {
        const x = 110 + (i % cols) * 156;
        const y = 120 + Math.floor(i / cols) * 160;
        if (i < merged) {
          circle(ctx, x, y, 56);
          ctx.globalCompositeOperation = 'destination-out';
          line(ctx, [[x - 24, y + 2], [x - 6, y + 22], [x + 26, y - 18]], 13);
          ctx.globalCompositeOperation = 'source-over';
        } else {
          ring(ctx, x, y, 50, 7, [9, 11]);
          circle(ctx, x, y, 6);
        }
      }
    },
  },
};
