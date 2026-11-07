/**
 * "Pullwright builds the résumé": on a first visit, the agents from Pullwright (my
 * issue → pull-request project) write the visible part of the page. A planner drags out
 * selection boxes, executors type the text, a verifier ticks each box, and the bar at the
 * bottom narrates it from Issue #1 to a merged PR.
 *
 * Everything is a Web Animation scheduled up front, so finishing early is just
 * `finish()` on each one. The résumé's text is in the page from the first byte; blocks are
 * only clipped until their turn, and anything below the fold is never touched.
 */

const SEEN_KEY = 'resume-built-v1';
const PULLWRIGHT = 'https://github.com/Ayushjo/MyOwnDevin';

/** Blocks that get typed by an executor, in reading order. */
const TYPED = [
  'h1',
  '.role',
  '.summary',
  '.facts dd',
  '.glance .value',
  '.role-head h3',
  '.impact',
  '.points li',
  '.project h3',
  '.tagline',
  '.side h2',
  '.pr-title',
  '.edu h3',
].join(',');
/** Small print that simply fades in when its box is built. */
const QUIET = [
  '.avatar',
  '.status',
  '.where',
  '.cta',
  '.facts dt',
  '.glance .label',
  '.main h2',
  '.when',
  '.product',
  '.role-stack',
  '.badge',
  '.stats',
  '.tags',
  '.links',
  '.skill-group',
  '.trace-hint',
  '.repo',
  '.diff',
  '.note',
  '.oss-sum',
  '.edu p',
].join(',');
const BOXES = '.head, .glance, .role-item, .project, .side .card';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CURSOR_SVG =
  '<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M1.5 1.2v15.2l4.1-3.9 2.7 6 2.6-1.1-2.6-5.9h5.6z"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 6.4l2.4 2.4 4.8-5.2"/></svg>';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Waypoint {
  t: number;
  x: number;
  y: number;
}
interface Agent {
  el: HTMLElement;
  path: Waypoint[];
  free: number;
}

const docRect = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
};

/** Whether the build should start by itself on this visit (Base.astro's head script mirrors this). */
export function shouldAutoBuild(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('print').matches) return false;
  if (nav.webdriver || /HeadlessChrome|Lighthouse|bot|crawl|spider/i.test(nav.userAgent)) return false;
  if (nav.connection?.saveData) return false;
  try {
    return !localStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

export interface Build {
  /** Jump to the end (any input does this too). */
  finish(): void;
  done: Promise<void>;
}

let current: Build | null = null;
let hud: HTMLElement | null = null;

/** The bottom bar: created once, reused across runs; idle it is just "↻ Rebuild". */
function ensureHud(root: HTMLElement): HTMLElement {
  if (hud && document.body.contains(hud)) return hud;
  hud = document.createElement('div');
  hud.className = 'build-hud is-idle';
  hud.setAttribute('role', 'status');
  hud.innerHTML = `
    <span class="agents" aria-hidden="true"><span></span><span></span><span></span></span>
    <span class="msg"></span>
    <span class="bar" aria-hidden="true"><i></i></span>
    <button type="button" class="skip">Skip</button>
    <button type="button" class="rebuild" aria-label="Rebuild this page with Pullwright's agents (R)">
      <span class="chip" aria-hidden="true">${CURSOR_SVG}</span>
      <span class="label">Rebuild<span class="with">&nbsp;with Pullwright</span></span>
      <kbd aria-hidden="true">R</kbd>
    </button>`;
  document.body.append(hud);
  hud.querySelector('.skip')!.addEventListener('click', () => current?.finish());
  hud.querySelector('.rebuild')!.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => buildResume(root));
  });
  return hud;
}

export function buildResume(root: HTMLElement): Build {
  current?.finish();
  const bar = ensureHud(root);
  const msg = bar.querySelector<HTMLElement>('.msg')!;
  const fill = bar.querySelector<HTMLElement>('.bar i')!;
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* fine */
  }

  // ---- 1. Measure what's on screen (plus a little below the fold). ----
  const top = scrollY;
  const limit = scrollY + innerHeight * 1.1;
  const inView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top + scrollY < limit && r.bottom + scrollY > top;
  };
  const boxes = [...root.querySelectorAll<HTMLElement>(BOXES)].filter(inView);
  const typed = [...root.querySelectorAll<HTMLElement>(TYPED)].filter(inView);
  const quiet = [...root.querySelectorAll<HTMLElement>(QUIET)].filter(inView);
  const boxOf = (el: Element) => boxes.findIndex((b) => b.contains(el));

  // ---- 2. Hide what will be built (visually only), and lay down the overlay. ----
  for (const el of typed) el.setAttribute('data-b', '');
  for (const el of quiet) el.setAttribute('data-bq', '');
  root.setAttribute('data-building', '');
  delete document.documentElement.dataset.prebuild;

  const layer = document.createElement('div');
  layer.className = 'build-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.height = `${document.documentElement.scrollHeight}px`;
  document.body.append(layer);

  const ruler = document.createElement('div');
  ruler.className = 'build-ruler';
  ruler.setAttribute('aria-hidden', 'true');
  for (let x = 0; x < innerWidth; x += 100) ruler.insertAdjacentHTML('beforeend', `<span style="left:${x}px">${x}</span>`);
  document.body.append(ruler);

  const agent = (name: string): Agent => {
    const el = document.createElement('div');
    el.className = 'build-cursor';
    el.innerHTML = `${CURSOR_SVG}<b>${name}</b>`;
    layer.append(el);
    return { el, path: [], free: 0 };
  };
  const enter = { x: innerWidth * 0.5, y: scrollY + innerHeight + 40 };
  const planner = agent('planner');
  const executors = [agent('exec-1'), agent('exec-2'), agent('exec-3'), agent('exec-4')];
  const verifier = agent('verifier');

  const anims: Animation[] = [];
  let ended = false;
  const play = (el: Element, keys: Keyframe[], delay: number, duration: number, easing = EASE) => {
    const a = el.animate(keys, { delay, duration, easing, fill: 'both' });
    anims.push(a);
    return a;
  };
  /** Run `fn` at `ms` into the build (or at once if it's finished early), unless it already ended. */
  const at = (ms: number, fn: () => void) => {
    const marker = layer.animate([{ opacity: 1 }, { opacity: 1 }], { delay: ms, duration: 1 });
    anims.push(marker);
    marker.finished.then(() => !ended && fn()).catch(() => {});
  };

  // ---- 3. Plan: the planner drags a box over each block. ----
  const PLAN_START = 260;
  const boxAt: number[] = [];
  const boxEls: HTMLElement[] = [];
  planner.path.push({ t: 0, ...enter });
  boxes.forEach((b, i) => {
    const r = docRect(b);
    const t = PLAN_START + i * 150;
    boxAt.push(t);
    const box = document.createElement('div');
    box.className = 'build-box';
    box.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
    box.innerHTML = `<i></i><i></i><i></i><i></i><span class="build-size">${Math.round(r.w)} × ${Math.round(r.h)}</span>`;
    layer.append(box);
    boxEls.push(box);
    planner.path.push({ t: t - 90, x: r.x, y: r.y }, { t: t + 130, x: r.x + r.w, y: r.y + r.h });
    play(box, [{ transform: 'scale(0.02, 0.02)', opacity: 0 }, { transform: 'scale(1, 1)', opacity: 1 }], t, 220);
  });
  const planEnd = (boxAt.at(-1) ?? PLAN_START) + 260;
  planner.path.push({ t: planEnd + 200, x: innerWidth + 40, y: scrollY + 60 });

  // ---- 4. Execute: four executors type the blocks, each after its box exists. ----
  executors.forEach((e) => e.path.push({ t: 0, ...enter }));
  let built = 0;
  const total = typed.length;
  const boxLast = new Array<number>(boxes.length).fill(0);
  typed.forEach((el, i) => {
    const r = docRect(el);
    const bi = boxOf(el);
    const ready = (bi >= 0 ? boxAt[bi]! : PLAN_START) + 160;
    const ex = executors[i % executors.length]!;
    const start = Math.max(ready, ex.free) + 120;
    const chars = (el.textContent ?? '').trim().length;
    const dur = Math.min(360, Math.max(120, 60 + chars * 2.4));
    const lineY = r.y + Math.min(r.h, 22) * 0.55;
    ex.path.push({ t: start - 120, x: r.x - 2, y: lineY }, { t: start + dur, x: r.x + r.w, y: r.y + r.h - Math.min(r.h, 22) * 0.45 });
    ex.free = start + dur;

    const sel = document.createElement('div');
    sel.className = 'build-sel';
    sel.style.cssText = `left:${r.x - 3}px;top:${r.y - 1}px;width:${r.w + 6}px;height:${r.h + 2}px`;
    layer.append(sel);
    play(sel, [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.7 }, { transform: 'scaleX(1)', opacity: 0 }], start, dur + 420, 'linear');
    const reveal = play(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], start, dur, 'linear');
    reveal.finished
      .then(() => {
        built += 1;
        fill.style.setProperty('--p', String(built / Math.max(1, total)));
        if (phase === 'executing') msg.innerHTML = `<em>exec ·</em> ${built} / ${total} blocks`;
      })
      .catch(() => {});
    // Numbers land with a small lift, so a skim catches them.
    if (el.matches('.glance .value'))
      play(el, [{ transform: 'translateY(4px)' }, { transform: 'none' }], start, dur + 200, EASE);
    if (bi >= 0) boxLast[bi] = Math.max(boxLast[bi]!, start + dur);
  });
  const execEnd = Math.max(planEnd, ...executors.map((e) => e.free));
  executors.forEach((e, i) => e.path.push({ t: e.free + 260, x: i % 2 ? -40 : innerWidth + 40, y: e.path.at(-1)!.y + 30 }));

  // Small print fades in with its box; the box's stripes clear once its last line is written.
  quiet.forEach((el) => {
    const bi = boxOf(el);
    const when = bi >= 0 ? Math.max(boxAt[bi]! + 260, (boxLast[bi] || boxAt[bi]!) - 120) : planEnd;
    play(el, [{ opacity: 0 }, { opacity: 1 }], when, 380);
  });
  boxEls.forEach((box, i) => at(Math.max(boxLast[i]!, boxAt[i]! + 300), () => box.style.setProperty('--hatch', '0')));

  // ---- 5. Verify: a tick on each box, then the boxes and ruler fade. ----
  const VERIFY_START = execEnd + 160;
  verifier.path.push({ t: 0, ...enter }, { t: VERIFY_START - 160, ...enter });
  boxes.forEach((b, i) => {
    const r = docRect(b);
    const t = VERIFY_START + i * 110;
    const check = document.createElement('div');
    check.className = 'build-check';
    check.innerHTML = CHECK_SVG;
    check.style.cssText = `left:${r.x + r.w - 10}px;top:${r.y - 10}px`;
    layer.append(check);
    verifier.path.push({ t: t - 60, x: r.x + r.w - 2, y: r.y + 2 });
    play(check, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], t, 260);
  });
  const verifyEnd = VERIFY_START + boxes.length * 110 + 200;
  verifier.path.push({ t: verifyEnd + 220, x: innerWidth + 40, y: scrollY + innerHeight * 0.4 });
  const END = verifyEnd + 520;
  play(layer, [{ opacity: 1 }, { opacity: 0 }], verifyEnd + 120, 400);
  play(ruler, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 0, END);

  // ---- 6. Cursor flights: one keyframed animation per agent across the whole run. ----
  for (const a of [planner, ...executors, verifier]) {
    const path = a.path.sort((p, q) => p.t - q.t);
    const keys = path.map((p) => ({
      offset: Math.min(1, Math.max(0, p.t / END)),
      transform: `translate(${p.x}px, ${p.y}px)`,
      easing: EASE,
    }));
    if (keys[0]!.offset > 0) keys.unshift({ ...keys[0]!, offset: 0 });
    if (keys.at(-1)!.offset < 1) keys.push({ ...keys.at(-1)!, offset: 1 });
    play(a.el, keys, 0, END, 'linear');
    const first = path[1]?.t ?? 0;
    play(a.el, [{ opacity: 0 }, { opacity: 1, offset: Math.min(0.99, (first + 1) / END) }, { opacity: 1 }], 0, END, 'linear');
  }

  // ---- 7. Narration. ----
  let phase: 'issue' | 'planning' | 'executing' | 'verifying' | 'merged' = 'issue';
  const t0 = performance.now();
  bar.classList.remove('is-idle', 'is-done');
  fill.style.setProperty('--p', '0');
  msg.innerHTML = `<em>issue #1 ·</em> Render résumé for a recruiter`;
  at(PLAN_START - 60, () => {
    phase = 'planning';
    msg.innerHTML = `<em>planner ·</em> laying out ${boxes.length} blocks`;
  });
  at(planEnd, () => {
    phase = 'executing';
    msg.innerHTML = `<em>exec ·</em> ${built} / ${total} blocks`;
  });
  at(VERIFY_START, () => {
    phase = 'verifying';
    msg.innerHTML = `<em>verifier ·</em> checking ${boxes.length} blocks`;
  });

  // ---- 8. Skipping and cleanup. ----
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  const cleanup = () => {
    if (ended) return;
    ended = true;
    for (const a of anims) a.cancel();
    for (const el of typed) el.removeAttribute('data-b');
    for (const el of quiet) el.removeAttribute('data-bq');
    root.removeAttribute('data-building');
    layer.remove();
    ruler.remove();
    removeEventListener('keydown', onKey, true);
    removeEventListener('wheel', skip, true);
    removeEventListener('touchstart', skip, true);
    removeEventListener('pointerdown', onPointer, true);
    removeEventListener('resize', skip);
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    phase = 'merged';
    bar.classList.add('is-done');
    fill.style.setProperty('--p', '1');
    msg.innerHTML = `<em>PR #1 merged ·</em> +${total} −0 · ${secs} s · <a href="${PULLWRIGHT}" target="_blank" rel="noopener">pullwright ↗</a>`;
    setTimeout(() => current === build && bar.classList.add('is-idle'), 2600);
    resolveDone();
  };
  const skip = () => build.finish();
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') return;
    skip();
  };
  const onPointer = (e: PointerEvent) => {
    if (!(e.target instanceof Node && bar.contains(e.target))) skip();
  };
  addEventListener('keydown', onKey, true);
  addEventListener('wheel', skip, { capture: true, passive: true });
  addEventListener('touchstart', skip, { capture: true, passive: true });
  addEventListener('pointerdown', onPointer, true);
  addEventListener('resize', skip);

  const build: Build = {
    finish() {
      if (ended) return;
      for (const a of anims) a.finish();
      cleanup();
    },
    done,
  };
  at(END, () => cleanup());
  current = build;
  return build;
}

/** Keyboard: R rebuilds (outside text fields); Esc is handled by the skip listener. */
export function initBuildKeys(root: HTMLElement): void {
  addEventListener('keydown', (e) => {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest?.('input, textarea, [contenteditable]')) return;
    if (!root.offsetParent && getComputedStyle(root).display === 'none') return;
    scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => buildResume(root));
  });
}

/** Offer the Rebuild pill without running (e.g. for reduced motion). */
export function showRebuild(root: HTMLElement): void {
  ensureHud(root).classList.add('is-idle');
}

/**
 * Wire the build to a résumé on the page: run it on a first visit once fonts and layout have
 * settled, otherwise just offer the Rebuild pill.
 */
export async function startBuild(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // Only build while the page is still held back; if the hold already lapsed, the résumé is on
  // screen and building it now would make it vanish and reappear.
  const held = 'prebuild' in document.documentElement.dataset;
  if (held && shouldAutoBuild() && scrollY < innerHeight * 0.5) buildResume(root);
  else {
    delete document.documentElement.dataset.prebuild;
    showRebuild(root);
  }
}

/** Leaving the résumé (e.g. switching mode): end any run and take the bar away. */
export function stopBuild(): void {
  current?.finish();
  current = null;
  hud?.remove();
  hud = null;
}
