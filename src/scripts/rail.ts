import { gsap } from 'gsap';
import { progress, scrollToTarget, type Beat } from './scroll';

/** The right-edge dot rail: one dot per beat, grouped by section; click to jump. */
export function initRail(root: HTMLElement, beats: Beat[]): () => void {
  root.replaceChildren();
  const buttons: HTMLButtonElement[] = [];
  let group: HTMLElement | null = null;
  let groupName = '';

  beats.forEach((b) => {
    if (!group || b.group !== groupName) {
      groupName = b.group;
      group = document.createElement('div');
      group.className = 'rail-group';
      root.append(group);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span class="label"></span><span class="dot"></span>`;
    btn.querySelector('.label')!.textContent = b.label;
    btn.setAttribute('aria-label', `${b.group}: ${b.label}`);
    btn.addEventListener('click', () => scrollToTarget(b.el));
    group.append(btn);
    buttons.push(btn);
  });

  let current = -2;
  const tick = () => {
    const visible = progress.beatIn > 0.6;
    root.classList.toggle('is-visible', visible);
    const k = visible ? Math.round(progress.beat) : -1;
    if (k === current) return;
    current = k;
    buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === k)));
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
