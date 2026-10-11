export interface PointCloud {
  /** vec4 per particle: xyz target, w = x rank in 0..1 (left → right). */
  data: Float32Array;
  /** Area covered by ink, in world units². */
  inkArea: number;
}

/** Where a drawing lands in the world: fitted inside the box, aspect preserved. */
export interface Placement {
  centerX: number;
  centerY: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Scatters exactly `count` points over the opaque pixels of a canvas drawing and maps
 * them into the world. Points are sorted by x so particle i in one cloud pairs with
 * particle i in another spatially, which makes morphs read as a left-to-right wave.
 */
export function sampleInk(canvas: HTMLCanvasElement, count: number, place: Placement): PointCloud {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const { data: px, width: cw, height: ch } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Opaque pixels, stored column-major so they come out already sorted by x. This runs for every
  // shape at up to 262k points, so it stays allocation-light and linear: no per-pixel pushes,
  // no comparison sort (which cost ~0.4 s per hero word even on a fast laptop).
  const colStart = new Uint32Array(cw + 1);
  for (let y = 0; y < ch; y++) {
    const row = y * cw * 4 + 3;
    for (let x = 0; x < cw; x++) if (px[row + x * 4]! > 140) colStart[x + 1]!++;
  }
  for (let x = 0; x < cw; x++) colStart[x + 1]! += colStart[x]!;
  const nFilled = colStart[cw]!;
  const filledY = new Uint16Array(nFilled);
  const cursor = colStart.slice(0, cw);
  for (let y = 0; y < ch; y++) {
    const row = y * cw * 4 + 3;
    for (let x = 0; x < cw; x++) if (px[row + x * 4]! > 140) filledY[cursor[x]!++] = y;
  }
  // Which column each filled pixel belongs to, found by walking the column offsets.
  const filledX = new Uint16Array(nFilled);
  for (let x = 0; x < cw; x++) filledX.fill(x, colStart[x]!, colStart[x + 1]!);

  // Pick pixels uniformly, then order the picks by pixel index; since pixels are column-major,
  // that is an x order, built with a counting sort over the column offsets.
  const scale = Math.min(place.maxWidth / cw, place.maxHeight / ch);
  const picksPerPixel = new Uint32Array(nFilled + 1);
  const picks = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    const k = nFilled > 0 ? (Math.random() * nFilled) | 0 : 0;
    picks[i] = k;
    if (nFilled > 0) picksPerPixel[k + 1]!++;
  }
  const ordered = new Uint32Array(count);
  if (nFilled > 0) {
    for (let k = 0; k < nFilled; k++) picksPerPixel[k + 1]! += picksPerPixel[k]!;
    for (let i = 0; i < count; i++) ordered[picksPerPixel[picks[i]!]!++] = picks[i]!;
  }

  const data = new Float32Array(count * 4);
  const last = Math.max(1, count - 1);
  for (let r = 0; r < count; r++) {
    const k = ordered[r]!;
    const fx = (nFilled > 0 ? filledX[k]! : cw / 2) + Math.random();
    const fy = (nFilled > 0 ? filledY[k]! : ch / 2) + Math.random();
    data[r * 4] = (fx - cw / 2) * scale + place.centerX;
    data[r * 4 + 1] = (ch / 2 - fy) * scale + place.centerY;
    data[r * 4 + 2] = (Math.random() - 0.5) * 0.12;
    data[r * 4 + 3] = r / last;
  }

  return { data, inkArea: nFilled * scale * scale };
}

export function inkCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return { canvas, ctx };
}

/** World rectangle by centre and size. */
export interface Rect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/**
 * A jittered grid filling `rect`: the "screen" particles form before a demo plays in them.
 * Jitter breaks up moiré against the display's pixel grid.
 */
export function gridCloud(count: number, rect: Rect): PointCloud {
  const cols = Math.max(1, Math.round(Math.sqrt((count * rect.w) / rect.h)));
  const rows = Math.ceil(count / cols);
  const x0 = rect.cx - rect.w / 2;
  const y0 = rect.cy - rect.h / 2;
  // Walked column by column, so particles come out in x order without a sort.
  const data = new Float32Array(count * 4);
  for (let k = 0; k < count; k++) {
    const c = Math.floor(k / rows);
    const r = k % rows;
    data[k * 4] = x0 + ((c + 0.5 + (Math.random() - 0.5) * 0.7) / cols) * rect.w;
    data[k * 4 + 1] = y0 + ((r + 0.5 + (Math.random() - 0.5) * 0.7) / rows) * rect.h;
    data[k * 4 + 2] = (Math.random() - 0.5) * 0.04;
    data[k * 4 + 3] = k / (count - 1);
  }
  return { data, inkArea: rect.w * rect.h };
}
