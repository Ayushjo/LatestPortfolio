import { inkCanvas, sampleInk, type PointCloud } from '../shapes/sample';

export interface TextStyle {
  family: string;
  weight: number;
  italic: boolean;
  uppercase: boolean;
  letterSpacingEm: number;
  lineHeightEm: number;
}

export const DISPLAY: TextStyle = {
  family: 'Inter Tight',
  weight: 900,
  italic: false,
  uppercase: true,
  letterSpacingEm: -0.04,
  lineHeightEm: 0.92,
};

export const SERIF: TextStyle = {
  family: 'Instrument Serif',
  weight: 400,
  italic: true,
  uppercase: false,
  letterSpacingEm: -0.01,
  lineHeightEm: 1.05,
};

const CANVAS_W = 1600;
const PAD = 24;

/** Text drawn with the page's real font, filling the canvas width; ready for `sampleInk`. */
export async function textCanvas(rawLines: string[], style: TextStyle = DISPLAY): Promise<HTMLCanvasElement> {
  const { family, weight, italic, uppercase, letterSpacingEm, lineHeightEm } = style;
  const lines = uppercase ? rawLines.map((l) => l.toUpperCase()) : rawLines;
  const fontAt = (px: number) => `${italic ? 'italic ' : ''}${weight} ${px}px "${family}", system-ui, sans-serif`;

  try {
    await document.fonts.load(fontAt(100));
  } catch {
    /* fall back to whatever font is available */
  }

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
  return canvas;
}

export interface TextLayout {
  lines: string[];
  /** Width of the widest line in world units. */
  worldWidth: number;
  centerY: number;
  style?: TextStyle;
}

/** Hero words: text centred horizontally at a given width. */
export async function sampleText(layout: TextLayout, count: number): Promise<PointCloud> {
  const canvas = await textCanvas(layout.lines, layout.style);
  const fullWidth = layout.worldWidth * (CANVAS_W / (CANVAS_W - PAD * 2));
  return sampleInk(canvas, count, { centerX: 0, centerY: layout.centerY, maxWidth: fullWidth, maxHeight: Infinity });
}
