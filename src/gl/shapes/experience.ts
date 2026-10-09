import { circle, fillRect, line, ring, type ShapeDef } from './draw';
import { PROJECT_SHAPES } from './projects';

/** Shapes for the experience timeline, keyed `exp:<id>`. */
export const EXPERIENCE_SHAPES: Record<string, ShapeDef> = {
  'exp:amrevx': PROJECT_SHAPES.tradelogs!,
  'exp:cineprism': PROJECT_SHAPES.thecineprism!,

  /** Google Classroom rosters syncing into VedaAI. */
  'exp:vedaai': {
    width: 1000,
    height: 620,
    draw(ctx) {
      for (const x0 of [40, 600]) {
        ctx.save();
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.roundRect(x0, 80, 360, 460, 24);
        ctx.stroke();
        ctx.restore();
        fillRect(ctx, { x: x0 + 30, y: 110, w: 300, h: 48 }, 0, '#fff');
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 4; c++) circle(ctx, x0 + 75 + c * 70, 220 + r * 66, 16);
        }
      }
      line(ctx, [[430, 250], [570, 250]], 12);
      line(ctx, [[540, 220], [575, 250], [540, 280]], 12);
      line(ctx, [[570, 370], [430, 370]], 12);
      line(ctx, [[460, 340], [425, 370], [460, 400]], 12);
    },
  },

  /** A CI/CD pipeline: every stage green, the last one deploying. Head of the DevOps Club. */
  'exp:iiitnr': {
    width: 1000,
    height: 420,
    draw(ctx) {
      line(ctx, [[80, 210], [920, 210]], 10);
      const xs = [80, 290, 500, 710, 920];
      xs.forEach((x, i) => {
        if (i === xs.length - 1) {
          ring(ctx, x, 210, 62, 14);
          ring(ctx, x, 210, 100, 5, [6, 12]);
          circle(ctx, x, 210, 22);
          return;
        }
        fillRect(ctx, { x: x - 62, y: 148, w: 124, h: 124 }, 0, '#fff');
        ctx.globalCompositeOperation = 'destination-out';
        line(ctx, [[x - 28, 212], [x - 6, 236], [x + 32, 188]], 16);
        ctx.globalCompositeOperation = 'source-over';
      });
    },
  },
};
