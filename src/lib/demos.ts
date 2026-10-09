import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Project } from '../content/projects';

const DIR = join(process.cwd(), 'public', 'demos');

/**
 * A project's demo clip: an explicit `demo` in projects.ts wins, otherwise any
 * public/demos/<slug>.mp4 (+ optional .jpg poster) is picked up at build time.
 */
export function demoFor(p: Project): Project['demo'] {
  if (p.demo) return p.demo;
  if (!existsSync(join(DIR, `${p.slug}.mp4`))) return undefined;
  const poster = existsSync(join(DIR, `${p.slug}.jpg`)) ? `/demos/${p.slug}.jpg` : '';
  return { src: `/demos/${p.slug}.mp4`, poster };
}
