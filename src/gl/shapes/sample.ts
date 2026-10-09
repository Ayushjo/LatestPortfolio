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

  const filled: number[] = [];
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (px[(y * cw + x) * 4 + 3]! > 140) filled.push(x, y);
    }
  }

  const scale = Math.min(place.maxWidth / cw, place.maxHeight / ch);
  const nFilled = filled.length / 2;
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = nFilled > 0 ? Math.floor(Math.random() * nFilled) : 0;
    const fx = (filled[k * 2] ?? cw / 2) + Math.random();
    const fy = (filled[k * 2 + 1] ?? ch / 2) + Math.random();
    pts[i * 3] = (fx - cw / 2) * scale + place.centerX;
    pts[i * 3 + 1] = (ch / 2 - fy) * scale + place.centerY;
    pts[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
  }

  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;
  order.sort((a, b) => pts[a * 3]! - pts[b * 3]!);

  const data = new Float32Array(count * 4);
  for (let r = 0; r < count; r++) {
    const i = order[r]!;
    data[r * 4] = pts[i * 3]!;
    data[r * 4 + 1] = pts[i * 3 + 1]!;
    data[r * 4 + 2] = pts[i * 3 + 2]!;
    data[r * 4 + 3] = r / (count - 1);
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
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    pts[i * 3] = x0 + ((c + 0.5 + (Math.random() - 0.5) * 0.7) / cols) * rect.w;
    pts[i * 3 + 1] = y0 + ((r + 0.5 + (Math.random() - 0.5) * 0.7) / rows) * rect.h;
    pts[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
  }
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;
  order.sort((a, b) => pts[a * 3]! - pts[b * 3]!);
  const data = new Float32Array(count * 4);
  for (let k = 0; k < count; k++) {
    const i = order[k]!;
    data[k * 4] = pts[i * 3]!;
    data[k * 4 + 1] = pts[i * 3 + 1]!;
    data[k * 4 + 2] = pts[i * 3 + 2]!;
    data[k * 4 + 3] = k / (count - 1);
  }
  return { data, inkArea: rect.w * rect.h };
}
