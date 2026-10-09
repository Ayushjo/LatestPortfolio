/** Window-level pointer tracking in normalised device coords (-1..1, y up). */
export class Input {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  speed = 0;
  active = false;
  private lastX = 0;
  private lastY = 0;
  private lastT = performance.now();
  private clickHandlers = new Set<(x: number, y: number) => void>();

  constructor() {
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerdown', this.onDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);
  }

  onClick(fn: (x: number, y: number) => void): () => void {
    this.clickHandlers.add(fn);
    return () => this.clickHandlers.delete(fn);
  }

  /** Called once per frame: velocity decays when the pointer rests. */
  update(dt: number): void {
    const decay = Math.exp(-dt * 6);
    this.vx *= decay;
    this.vy *= decay;
    this.speed = Math.min(1, Math.hypot(this.vx, this.vy) * 0.25);
  }

  dispose(): void {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerdown', this.onDown);
    document.documentElement.removeEventListener('pointerleave', this.onLeave);
    this.clickHandlers.clear();
  }

  private toNdc(e: PointerEvent): [number, number] {
    return [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
  }

  private onMove = (e: PointerEvent) => {
    const [x, y] = this.toNdc(e);
    const now = performance.now();
    const dt = Math.max(1, now - this.lastT) / 1000;
    if (this.active) {
      this.vx = (x - this.lastX) / dt;
      this.vy = (y - this.lastY) / dt;
    }
    this.x = this.lastX = x;
    this.y = this.lastY = y;
    this.lastT = now;
    this.active = true;
  };

  private onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button, [role="radiogroup"]')) return;
    const [x, y] = this.toNdc(e);
    this.clickHandlers.forEach((fn) => fn(x, y));
  };

  private onLeave = () => {
    this.active = false;
  };
}
