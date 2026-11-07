// Prints the built /resume page to public/ayush-singh-resume.pdf with headless Chrome, using the
// page's own print stylesheet, so the PDF is always the same résumé the site shows.
//
// Run: pnpm resume:pdf   (builds first)
// Chrome: CHROME_PATH, else the usual macOS / Linux install locations.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, statSync, copyFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const OUT = join(process.cwd(), 'public', 'ayush-singh-resume.pdf');

const CHROMES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = CHROMES.find((p) => existsSync(p));
if (!chrome) throw new Error('Chrome not found: set CHROME_PATH');
if (!existsSync(join(DIST, 'resume', 'index.html'))) throw new Error('dist/resume is missing: run the build first');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

// A tiny static server for dist/, so the page loads its fonts and styles exactly as deployed.
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
try {
  // Async on purpose: a blocking call would freeze this process's server while Chrome waits on it.
  await promisify(execFile)(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-pdf-header-footer',
      '--virtual-time-budget=8000',
      `--print-to-pdf=${OUT}`,
      `http://127.0.0.1:${port}/resume/`,
    ],
    { timeout: 60_000 },
  );
} finally {
  server.close();
}

const pages = (readFileSync(OUT).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
copyFileSync(OUT, join(DIST, 'ayush-singh-resume.pdf'));
console.log(`wrote public/ayush-singh-resume.pdf (${pages} page${pages === 1 ? '' : 's'}, ${Math.round(statSync(OUT).size / 1024)} KB)`);
if (pages > 2) console.warn('warning: the résumé no longer fits on two pages');
