/**
 * Skill tracing on the résumé: pointing at (or focusing) a skill highlights the roles and
 * projects that used it and lets the rest step back. On touch screens a tap pins it; a second
 * tap, Esc or a tap elsewhere lets go.
 */
export function initSkillTrace(root: HTMLElement): void {
  const chips = [...root.querySelectorAll<HTMLButtonElement>('.chip-trace')];
  if (!chips.length || root.dataset.traceReady) return;
  root.dataset.traceReady = '1';
  const items = [...root.querySelectorAll<HTMLElement>('[data-trace]')];
  let pinned: HTMLButtonElement | null = null;

  const show = (chip: HTMLButtonElement | null) => {
    const hits = new Set(chip?.dataset.hits?.split(' ') ?? []);
    root.classList.toggle('is-tracing', !!chip);
    for (const el of items) el.classList.toggle('is-hit', hits.has(el.dataset.trace!));
  };
  const pin = (chip: HTMLButtonElement | null) => {
    pinned?.setAttribute('aria-pressed', 'false');
    pinned = chip;
    chip?.setAttribute('aria-pressed', 'true');
    show(chip);
  };

  const hover = matchMedia('(hover: hover)');
  for (const chip of chips) {
    chip.addEventListener('pointerenter', () => hover.matches && !pinned && show(chip));
    chip.addEventListener('pointerleave', () => hover.matches && !pinned && show(null));
    chip.addEventListener('focus', () => !pinned && show(chip));
    chip.addEventListener('blur', () => !pinned && show(null));
    chip.addEventListener('click', () => pin(pinned === chip ? null : chip));
  }
  document.addEventListener('keydown', (e) => e.key === 'Escape' && pinned && pin(null));
  document.addEventListener('pointerdown', (e) => {
    if (pinned && !(e.target as HTMLElement).closest('.chip-trace')) pin(null);
  });
}
