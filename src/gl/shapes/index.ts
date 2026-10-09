import { DISPLAY, SERIF, textCanvas } from '../text/sampleText';
import { inkCanvas } from './sample';
import { EXPERIENCE_SHAPES } from './experience';
import { GITHUB_SHAPES } from './github';
import { OSS_SHAPES } from './oss';
import { PROJECT_SHAPES } from './projects';
import type { ShapeDef } from './draw';

const DRAWN: Record<string, ShapeDef> = { ...PROJECT_SHAPES, ...EXPERIENCE_SHAPES, ...OSS_SHAPES, ...GITHUB_SHAPES };

/**
 * Beat keys:
 *   <slug> | exp:<id> | fork …   a drawn shape
 *   text:<line|line>              heavy display text
 *   serif:<line|line>             Instrument Serif italic text
 *   image:<url>[|<tall url>]      a greyscale image; brighter pixels pull in more particles.
 *                                 The optional second image is used when the layout stacks (tall screens).
 *   stream                        no shape: particles flow free
 */
export const isStream = (key: string) => key === 'stream';

export async function shapeCanvas(key: string, wide = true): Promise<HTMLCanvasElement | null> {
  if (isStream(key)) return null;
  if (key.startsWith('text:')) return textCanvas(key.slice(5).split('|'), DISPLAY);
  if (key.startsWith('serif:')) return textCanvas(key.slice(6).split('|'), SERIF);
  if (key.startsWith('image:')) {
    const [wideUrl, tallUrl] = key.slice(6).split('|');
    return imageCanvas(!wide && tallUrl ? tallUrl : wideUrl!);
  }
  const def = DRAWN[key];
  if (!def) return null;
  const { canvas, ctx } = inkCanvas(def.width, def.height);
  def.draw(ctx, def.width, def.height);
  return canvas;
}

/**
 * Converts luminance into ink density: each pixel is kept with probability rising with its
 * brightness, so the uniform ink sampler ends up placing particles like a photograph.
 */
async function imageCanvas(url: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const src = inkCanvas(w, h);
  src.ctx.drawImage(img, 0, 0);
  const pixels = src.ctx.getImageData(0, 0, w, h);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!) / 255;
    const density = Math.pow(Math.min(1, Math.max(0, (lum - 0.05) / 0.9)), 1.25);
    d[i] = d[i + 1] = d[i + 2] = 255;
    d[i + 3] = Math.random() < density ? 255 : 0;
  }
  src.ctx.putImageData(pixels, 0, 0);
  return src.canvas;
}
