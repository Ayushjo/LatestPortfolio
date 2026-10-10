import { circle, fillRect, line, ring, type ShapeDef } from './draw';

/** Shapes for the experience timeline, keyed `exp:<id>`. */
export const EXPERIENCE_SHAPES: Record<string, ShapeDef> = {
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
