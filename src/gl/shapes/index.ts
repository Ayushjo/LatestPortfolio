import { DISPLAY, SERIF, textCanvas } from '../text/sampleText';
import { inkCanvas } from './sample';
import { EXPERIENCE_SHAPES } from './experience';
import { PROJECT_SHAPES } from './projects';
import type { ShapeDef } from './draw';

const DRAWN: Record<string, ShapeDef> = { ...PROJECT_SHAPES, ...EXPERIENCE_SHAPES };

/**
 * Beat keys:
 *   <slug> | exp:<id> | fork …   a drawn shape
 *   text:<line|line>              heavy display text
 *   serif:<line|line>             Instrument Serif italic text
 *   stream                        no shape: particles flow free
 */
export const isStream = (key: string) => key === 'stream';

export async function shapeCanvas(key: string): Promise<HTMLCanvasElement | null> {
  if (isStream(key)) return null;
  if (key.startsWith('text:')) return textCanvas(key.slice(5).split('|'), DISPLAY);
  if (key.startsWith('serif:')) return textCanvas(key.slice(6).split('|'), SERIF);
  const def = DRAWN[key];
  if (!def) return null;
  const { canvas, ctx } = inkCanvas(def.width, def.height);
  def.draw(ctx, def.width, def.height);
  return canvas;
}
