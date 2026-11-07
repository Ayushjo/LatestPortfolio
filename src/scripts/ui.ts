/** Small page behaviours shared by the home page and /resume. */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts: the textarea route still works there.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

/**
 * `[data-copy="text"]` buttons copy their text and wear `.is-copied` for a moment; screen
 * readers hear "Copied". If copying is impossible, an email address opens in the mail app.
 */
export function initCopyButtons(root: ParentNode = document): void {
  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
    if (btn.dataset.copyReady) continue;
    btn.dataset.copyReady = '1';
    const label = btn.getAttribute('aria-label');
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy!;
      if (!(await copyText(text))) {
        if (text.includes('@')) location.href = `mailto:${text}`;
        return;
      }
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', 'Copied');
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (label) btn.setAttribute('aria-label', label);
        else btn.removeAttribute('aria-label');
      }, 1800);
    });
  }
}

/** `[data-local-time]` elements show the time in Naya Raipur, kept current. */
export function initClocks(root: ParentNode = document): void {
  const clocks = [...root.querySelectorAll<HTMLElement>('[data-local-time]')];
  if (!clocks.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => {
    const now = fmt.format(new Date());
    for (const c of clocks) if (c.textContent !== now) c.textContent = now;
  };
  tick();
  setInterval(tick, 15_000);
}

/** "Show all N" on the résumé's open-source list. */
export function initMoreButtons(root: ParentNode = document): void {
  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-more-prs]')) {
    const list = document.getElementById(btn.getAttribute('aria-controls')!);
    if (!list || btn.dataset.ready) continue;
    btn.dataset.ready = '1';
    btn.addEventListener('click', () => {
      list.classList.add('is-all');
      btn.setAttribute('aria-expanded', 'true');
      btn.hidden = true;
      list.querySelector<HTMLElement>('li:nth-child(7) a')?.focus();
    });
  }
}

/**
 * The résumé's section nav: shown once the top card has scrolled away, with the section in
 * view marked as current.
 */
export function initToc(root: HTMLElement): void {
  const toc = root.querySelector<HTMLElement>('[data-toc]');
  const head = root.querySelector<HTMLElement>('.head');
  if (!toc || !head || toc.dataset.ready) return;
  toc.dataset.ready = '1';
  const links = [...toc.querySelectorAll<HTMLAnchorElement>('a')];
  const targets = links.map((a) => document.querySelector<HTMLElement>(a.hash)).filter(Boolean) as HTMLElement[];

  new IntersectionObserver(([entry]) => toc.classList.toggle('is-shown', !entry!.isIntersecting), {
    rootMargin: '-80px 0px 0px 0px',
  }).observe(head);

  const side = root.querySelector<HTMLElement>('.side');
  const mark = () => {
    // The last section whose top has passed the reading line wins. Beside a sticky sidebar its
    // cards are always "on screen", so only the main column (and the close) count there.
    const sticky = !!side && getComputedStyle(side).position === 'sticky';
    const line = innerHeight * 0.35;
    let current: HTMLElement | null = null;
    for (const t of targets) {
      if (sticky && side.contains(t)) continue;
      if (t.getBoundingClientRect().top <= line) current = t;
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) current = targets.at(-1) ?? current;
    for (const a of links) a.setAttribute('aria-current', String(a.hash === `#${current?.id}`));
    const active = links.find((a) => a.getAttribute('aria-current') === 'true');
    if (active && toc.scrollWidth > toc.clientWidth) {
      const r = active.offsetLeft - (toc.clientWidth - active.offsetWidth) / 2;
      toc.scrollTo({ left: r, behavior: 'smooth' });
    }
  };
  let queued = false;
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        mark();
      });
    },
    { passive: true },
  );
  mark();
}
