import { inkCanvas, sampleInk, type PointCloud } from '../shapes/sample';

export interface TextLayout {
  lines: string[];
  /** Width of the widest line in world units. */
  worldWidth: number;
  centerY: number;
  font?: string;
  weight?: number;
  letterSpacingEm?: number;
  lineHeightEm?: number;
}

const CANVAS_W = 1600;
const PAD = 24;

/** Rasterises text with the page's real font and scatters `count` particle targets over it. */
export async function sampleText(layout: TextLayout, count: number): Promise<PointCloud> {
  const { worldWidth, centerY, font = 'Inter Tight', weight = 900, letterSpacingEm = -0.04, lineHeightEm = 0.92 } = layout;
  const lines = layout.lines.map((l) => l.toUpperCase());

  try {
    await document.fonts.load(`${weight} 100px "${font}"`);
  } catch {
    /* fall back to whatever font is available */
  }

  const fontAt = (px: number) => `${weight} ${px}px "${font}", system-ui, sans-serif`;
  const measure = inkCanvas(1, 1).ctx;
  measure.font = fontAt(100);
  measure.letterSpacing = `${letterSpacingEm * 100}px`;
  const widest = Math.max(...lines.map((l) => measure.measureText(l).width));
  // 3% headroom: glyph ink can overhang the advance width measureText reports.
  const fontPx = Math.floor(((CANVAS_W - PAD * 2) / widest) * 100 * 0.97);
  const lineH = fontPx * lineHeightEm;

  const { canvas, ctx } = inkCanvas(CANVAS_W, Math.ceil(lineH * lines.length + PAD * 2));
  ctx.font = fontAt(fontPx);
  ctx.letterSpacing = `${letterSpacingEm * fontPx}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, PAD + lineH * (i + 0.5) + fontPx * 0.04));

  const fullWidth = worldWidth * (CANVAS_W / (CANVAS_W - PAD * 2));
  return sampleInk(canvas, count, { centerX: 0, centerY, maxWidth: fullWidth, maxHeight: Infinity });
}
