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
