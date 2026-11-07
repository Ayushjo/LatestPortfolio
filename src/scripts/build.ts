/**
 * "Pullwright builds the résumé": on a first visit, the agents from Pullwright (my
 * issue → pull-request project) write the visible part of the page. A planner drags out
 * selection boxes, executors type the text, a verifier ticks each box, and the bar at the
 * bottom narrates it from Issue #1 to a merged PR.
 *
 * The page is built as it's read: what's on screen first, then each block as it scrolls into
 * view, in its own short pass. Each pass is Web Animations scheduled up front, so finishing
 * early is just `finish()` on each one. The text is in the page from the first byte; blocks are
 * only clipped until their turn.
 */

const PULLWRIGHT = 'https://github.com/Ayushjo/MyOwnDevin';

/** What a page asks Pullwright to build. */
export interface BuildSpec {
  /** localStorage key that marks this page as already built once. */
  seenKey: string;
  /** The issue in the bar: "#n title". */
  issue: number;
  title: string;
  /** Blocks typed by an executor, small print that fades in, and boxes the planner draws. */
  typed: string;
  quiet: string;
  boxes: string;
}

export const RESUME_BUILD: BuildSpec = {
  seenKey: 'resume-built-v1',
  issue: 1,
  title: 'Render résumé for a recruiter',
  typed: [
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
  ].join(','),
  quiet: [
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
  ].join(','),
  boxes: '.head, .glance, .role-item, .project, .side .card',
};

/** A case study (src/pages/work/[slug].astro). */
export const WORK_BUILD = (seenKey: string, issue: number, title: string): BuildSpec => ({
  seenKey,
  issue,
  title,
  typed: ['h1', '.tagline', '.lede', '.stat-value', '.case h2', '.problem p', '.flow h3', '.decision h3', '.num-value'].join(','),
  quiet: ['.crumbs', '.idx', '.stat-label', '.actions', '.flow p', '.step', '.prose', '.decision p', '.num-label', '.num-note', '.chips'].join(','),
  boxes: '.hero, .shot, .flow li, .decision, .num',
});

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
export function shouldAutoBuild(spec: BuildSpec): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('print').matches) return false;
  if (nav.webdriver || /HeadlessChrome|Lighthouse|bot|crawl|spider/i.test(nav.userAgent)) return false;
  if (nav.connection?.saveData) return false;
  try {
    return !localStorage.getItem(spec.seenKey);
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
/** The page and spec the Rebuild button rebuilds. */
let target: { root: HTMLElement; spec: BuildSpec } | null = null;

/** The bottom bar: created once, reused across runs; idle it is just "↻ Rebuild". */
function ensureHud(root: HTMLElement, spec: BuildSpec): HTMLElement {
  target = { root, spec };
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
    if (!target) return;
    const { root: r, spec: s } = target;
    scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => buildPage(r, s));
  });
  return hud;
}

/** A box with everything typed or faded inside it, or one loose line: what scrolls in together. */
interface Unit {
  anchor: HTMLElement;
  boxes: HTMLElement[];
  typed: HTMLElement[];
  quiet: HTMLElement[];
  state: 'pending' | 'building' | 'done';
}

/**
 * Build the page as it's read: what's on screen is built at once, and every block below waits,
 * hidden, until it scrolls into view, then gets its own short pass (a "commit") from the agents.
 * Scrolling never skips; Esc or the Skip button reveals everything that's left.
 */
export function buildPage(root: HTMLElement, spec: BuildSpec): Build {
  current?.finish();
  const bar = ensureHud(root, spec);
  const msg = bar.querySelector<HTMLElement>('.msg')!;
  const fill = bar.querySelector<HTMLElement>('.bar i')!;
  try {
    localStorage.setItem(spec.seenKey, '1');
  } catch {
    /* fine */
  }

  // ---- 1. Group the page into units: each outermost box with its contents, plus loose lines. ----
  const shown = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const allBoxes = [...root.querySelectorAll<HTMLElement>(spec.boxes)].filter(shown);
  const typedAll = [...root.querySelectorAll<HTMLElement>(spec.typed)].filter(shown);
  const quietAll = [...root.querySelectorAll<HTMLElement>(spec.quiet)].filter(shown);
  const units: Unit[] = [];
  const unitOf = new Map<HTMLElement, Unit>();
  for (const b of allBoxes) {
    // Boxes come in document order, so an enclosing box is always seen first.
    const outer = allBoxes.find((o) => unitOf.has(o) && o.contains(b));
    if (outer) unitOf.get(outer)!.boxes.push(b);
    else {
      const u: Unit = { anchor: b, boxes: [b], typed: [], quiet: [], state: 'pending' };
      units.push(u);
      unitOf.set(b, u);
    }
  }
  const place = (el: HTMLElement, kind: 'typed' | 'quiet') => {
    const box = allBoxes.find((b) => unitOf.has(b) && b.contains(el));
    if (box) unitOf.get(box)![kind].push(el);
    else units.push({ anchor: el, boxes: [], typed: kind === 'typed' ? [el] : [], quiet: kind === 'quiet' ? [el] : [], state: 'pending' });
  };
  for (const el of typedAll) place(el, 'typed');
  for (const el of quietAll) place(el, 'quiet');
  units.sort((a, b) => (a.anchor.compareDocumentPosition(b.anchor) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  // ---- 2. Hide everything that will be built (visually only), and lay down the overlay. ----
  for (const el of typedAll) el.setAttribute('data-b', '');
  for (const el of quietAll) el.setAttribute('data-bq', '');
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

  const total = typedAll.length;
  const builtSet = new Set<HTMLElement>();
  let commits = 0;
  let ended = false;
  const running = new Set<() => void>();
  const progress = () => fill.style.setProperty('--p', String(builtSet.size / Math.max(1, total)));
  const waiting = () =>
    (msg.innerHTML = `<em>exec ·</em> ${builtSet.size} / ${total} blocks<span class="hint"> · scroll to keep building</span>`);

  let lastY = scrollY;
  let goingUp = false;
  const onScroll = () => {
    const y = scrollY;
    if (Math.abs(y - lastY) > 2) goingUp = y < lastY;
    lastY = y;
  };

  // ---- 3. One pass of the agents over a group of units. `speed` < 1 is quicker. ----
  const runBatch = (group: Unit[], speed: number) => {
    for (const u of group) u.state = 'building';
    commits += 1;
    ruler.classList.add('is-on');
    const boxes = group.flatMap((u) => u.boxes);
    const typed = group.flatMap((u) => u.typed);
    const quiet = group.flatMap((u) => u.quiet);
    const boxOf = (el: Element) => boxes.findIndex((b) => b.contains(el));
    const k = (ms: number) => ms * speed;

    const pane = document.createElement('div');
    pane.className = 'build-batch';
    layer.append(pane);
    const anims: Animation[] = [];
    let over = false;
    const play = (el: Element, keys: Keyframe[], delay: number, duration: number, easing = EASE) => {
      const a = el.animate(keys, { delay, duration, easing, fill: 'both' });
      anims.push(a);
      return a;
    };
    const at = (ms: number, fn: () => void) => {
      const marker = pane.animate([{ opacity: 1 }, { opacity: 1 }], { delay: ms, duration: 1 });
      anims.push(marker);
      marker.finished.then(() => !over && fn()).catch(() => {});
    };
    const agent = (name: string): Agent => {
      const el = document.createElement('div');
      el.className = 'build-cursor';
      el.innerHTML = `${CURSOR_SVG}<b>${name}</b>`;
      pane.append(el);
      return { el, path: [], free: 0 };
    };
    // Agents walk in from the edge the reader is scrolling towards.
    const enter = { x: innerWidth * 0.5, y: goingUp ? scrollY - 40 : scrollY + innerHeight + 40 };
    const planner = boxes.length ? agent('planner') : null;
    const executors = Array.from({ length: Math.min(4, Math.ceil(typed.length / 2)) }, (_, i) =>
      agent(`exec-${i + 1}`),
    );
    const verifier = boxes.length ? agent('verifier') : null;

    // Plan: the planner drags a box over each block.
    const PLAN_START = k(260);
    const boxAt: number[] = [];
    const boxEls: HTMLElement[] = [];
    planner?.path.push({ t: 0, ...enter });
    boxes.forEach((b, i) => {
      const r = docRect(b);
      const t = PLAN_START + i * k(150);
      boxAt.push(t);
      const box = document.createElement('div');
      box.className = 'build-box';
      box.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
      box.innerHTML = `<i></i><i></i><i></i><i></i><span class="build-size">${Math.round(r.w)} × ${Math.round(r.h)}</span>`;
      pane.append(box);
      boxEls.push(box);
      planner!.path.push({ t: t - k(90), x: r.x, y: r.y }, { t: t + k(130), x: r.x + r.w, y: r.y + r.h });
      play(box, [{ transform: 'scale(0.02, 0.02)', opacity: 0 }, { transform: 'scale(1, 1)', opacity: 1 }], t, k(220));
    });
    const planEnd = boxes.length ? boxAt.at(-1)! + k(260) : k(120);
    planner?.path.push({ t: planEnd + k(200), x: innerWidth + 40, y: scrollY + 60 });

    // Execute: executors type the blocks, each after its box exists.
    executors.forEach((e) => e.path.push({ t: 0, ...enter }));
    const boxLast = new Array<number>(boxes.length).fill(0);
    typed.forEach((el, i) => {
      const r = docRect(el);
      const bi = boxOf(el);
      const ready = (bi >= 0 ? boxAt[bi]! : PLAN_START) + k(160);
      const ex = executors[i % executors.length]!;
      const start = Math.max(ready, ex.free) + k(120);
      const chars = (el.textContent ?? '').trim().length;
      const dur = k(Math.min(360, Math.max(120, 60 + chars * 2.4)));
      const lineY = r.y + Math.min(r.h, 22) * 0.55;
      ex.path.push({ t: start - k(120), x: r.x - 2, y: lineY }, { t: start + dur, x: r.x + r.w, y: r.y + r.h - Math.min(r.h, 22) * 0.45 });
      ex.free = start + dur;

      const sel = document.createElement('div');
      sel.className = 'build-sel';
      sel.style.cssText = `left:${r.x - 3}px;top:${r.y - 1}px;width:${r.w + 6}px;height:${r.h + 2}px`;
      pane.append(sel);
      play(sel, [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.7 }, { transform: 'scaleX(1)', opacity: 0 }], start, dur + k(420), 'linear');
      play(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], start, dur, 'linear')
        .finished.then(() => {
          if (ended) return;
          builtSet.add(el);
          progress();
          msg.innerHTML = `<em>exec ·</em> ${builtSet.size} / ${total} blocks`;
        })
        .catch(() => {});
      // Numbers land with a small lift, so a skim catches them.
      if (el.matches('.glance .value, .stat-value, .num-value'))
        play(el, [{ transform: 'translateY(4px)' }, { transform: 'none' }], start, dur + k(200), EASE);
      if (bi >= 0) boxLast[bi] = Math.max(boxLast[bi]!, start + dur);
    });
    const execEnd = Math.max(planEnd, ...executors.map((e) => e.free));
    executors.forEach((e, i) => e.path.push({ t: e.free + k(260), x: i % 2 ? -40 : innerWidth + 40, y: e.path.at(-1)!.y + 30 }));

    // Small print fades in with its box; the box's stripes clear once its last line is written.
    quiet.forEach((el) => {
      const bi = boxOf(el);
      const when = bi >= 0 ? Math.max(boxAt[bi]! + k(260), (boxLast[bi] || boxAt[bi]!) - k(120)) : Math.max(planEnd, k(200));
      play(el, [{ opacity: 0 }, { opacity: 1 }], when, k(380));
    });
    boxEls.forEach((box, i) => at(Math.max(boxLast[i]!, boxAt[i]! + k(300)), () => box.style.setProperty('--hatch', '0')));

    // Verify: a tick on each box, then the pass fades.
    const VERIFY_START = execEnd + k(160);
    verifier?.path.push({ t: 0, ...enter }, { t: VERIFY_START - k(160), ...enter });
    boxes.forEach((b, i) => {
      const r = docRect(b);
      const t = VERIFY_START + i * k(110);
      const check = document.createElement('div');
      check.className = 'build-check';
      check.innerHTML = CHECK_SVG;
      check.style.cssText = `left:${r.x + r.w - 10}px;top:${r.y - 10}px`;
      pane.append(check);
      verifier!.path.push({ t: t - k(60), x: r.x + r.w - 2, y: r.y + 2 });
      play(check, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], t, k(260));
    });
    const verifyEnd = VERIFY_START + boxes.length * k(110) + k(200);
    verifier?.path.push({ t: verifyEnd + k(220), x: innerWidth + 40, y: scrollY + innerHeight * 0.4 });
    const END = verifyEnd + k(520);
    play(pane, [{ opacity: 1 }, { opacity: 0 }], verifyEnd + k(120), k(400));

    // Cursor flights: one keyframed animation per agent across the pass.
    for (const a of [planner, ...executors, verifier]) {
      if (!a) continue;
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

    // Narration.
    if (boxes.length) {
      msg.innerHTML = `<em>commit ${commits} ·</em> planning ${boxes.length} block${boxes.length > 1 ? 's' : ''}`;
      at(VERIFY_START, () => (msg.innerHTML = `<em>verifier ·</em> checking ${boxes.length} block${boxes.length > 1 ? 's' : ''}`));
    }

    const end = () => {
      if (over) return;
      over = true;
      for (const a of anims) a.cancel();
      for (const el of typed) {
        el.removeAttribute('data-b');
        builtSet.add(el);
      }
      for (const el of quiet) el.removeAttribute('data-bq');
      pane.remove();
      for (const u of group) u.state = 'done';
      running.delete(skipBatch);
      progress();
      if (running.size || ended) return;
      ruler.classList.remove('is-on');
      if (units.some((u) => u.state === 'pending')) waiting();
      else complete();
    };
    const skipBatch = () => {
      for (const a of anims) a.finish();
      end();
    };
    running.add(skipBatch);
    at(END, end);
  };

  // ---- 4. What's on screen now builds at once; the rest waits to scroll into view. ----
  const queue = new Set<Unit>();
  let flushTimer = 0;
  const flush = () => {
    flushTimer = 0;
    const group = units.filter((u) => queue.has(u) && u.state === 'pending');
    queue.clear();
    if (group.length && !ended) runBatch(group, 0.75);
  };
  const byAnchor = new Map(units.map((u) => [u.anchor as Element, u]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const u = byAnchor.get(e.target);
        if (!e.isIntersecting || u?.state !== 'pending') continue;
        queue.add(u);
        io.unobserve(e.target);
      }
      // Blocks that arrive together are built together.
      if (queue.size && !flushTimer) flushTimer = window.setTimeout(flush, 90);
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  const onScreen = units.filter((u) => {
    const r = u.anchor.getBoundingClientRect();
    return r.top < innerHeight * 1.05 && r.bottom > 0;
  });

  // ---- 5. Finishing, skipping and cleanup. ----
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  const complete = () => {
    if (ended) return;
    ended = true;
    io.disconnect();
    clearTimeout(flushTimer);
    for (const el of typedAll) el.removeAttribute('data-b');
    for (const el of quietAll) el.removeAttribute('data-bq');
    root.removeAttribute('data-building');
    layer.remove();
    ruler.remove();
    removeEventListener('keydown', onKey, true);
    removeEventListener('focusin', onFocus, true);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    bar.classList.add('is-done');
    fill.style.setProperty('--p', '1');
    msg.innerHTML = `<em>PR #${spec.issue} merged ·</em> +${total} −0 · ${commits} commit${commits === 1 ? '' : 's'} · <a href="${PULLWRIGHT}" target="_blank" rel="noopener">pullwright ↗</a>`;
    setTimeout(() => current === build && bar.classList.add('is-idle'), 2600);
    resolveDone();
  };
  const finishAll = () => {
    if (ended) return;
    for (const skip of [...running]) skip();
    complete();
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finishAll();
  // Tabbing into a block that isn't built yet reveals the page rather than focusing something invisible.
  const onFocus = (e: FocusEvent) => (e.target as Element).closest?.('[data-b], [data-bq]') && finishAll();
  // Phones resize as their address bar slides away; only a real width change moves the layout.
  const w0 = innerWidth;
  const onResize = () => Math.abs(innerWidth - w0) > 1 && finishAll();
  addEventListener('keydown', onKey, true);
  addEventListener('focusin', onFocus, true);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);

  const build: Build = { finish: finishAll, done };
  current = build;

  bar.classList.remove('is-idle', 'is-done');
  fill.style.setProperty('--p', '0');
  msg.innerHTML = `<em>issue #${spec.issue} ·</em> ${spec.title}`;
  for (const u of units) if (!onScreen.includes(u)) io.observe(u.anchor);
  if (onScreen.length) runBatch(onScreen, 1);
  else waiting();
  return build;
}

/** Keyboard: R rebuilds (outside text fields); Esc (in buildPage) reveals the rest. */
export function initBuildKeys(root: HTMLElement, spec: BuildSpec): void {
  addEventListener('keydown', (e) => {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest?.('input, textarea, [contenteditable]')) return;
    if (!root.offsetParent && getComputedStyle(root).display === 'none') return;
    scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => buildPage(root, spec));
  });
}

/** Offer the Rebuild pill without running (e.g. for reduced motion). */
export function showRebuild(root: HTMLElement, spec: BuildSpec): void {
  ensureHud(root, spec).classList.add('is-idle');
}

/**
 * Wire the build to a résumé on the page: run it on a first visit once fonts and layout have
 * settled, otherwise just offer the Rebuild pill.
 */
export async function startBuild(root: HTMLElement, spec: BuildSpec = RESUME_BUILD): Promise<void> {
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // Only build while the page is still held back; if the hold already lapsed, the résumé is on
  // screen and building it now would make it vanish and reappear.
  const held = 'prebuild' in document.documentElement.dataset;
  if (held && shouldAutoBuild(spec) && scrollY < innerHeight * 0.5) buildPage(root, spec);
  else {
    delete document.documentElement.dataset.prebuild;
    showRebuild(root, spec);
  }
}

/** Leaving the résumé (e.g. switching mode): end any run and take the bar away. */
export function stopBuild(): void {
  current?.finish();
  current = null;
  hud?.remove();
  hud = null;
}
