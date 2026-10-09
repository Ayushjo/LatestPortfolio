import GUI from 'lil-gui';

type UniformLike = { value: unknown };

/** Live-tweak every numeric uniform. Only loaded with ?debug in the URL. */
export function mountDebug(...groups: Record<string, UniformLike>[]): GUI {
  const gui = new GUI({ title: 'stream' });
  const names = ['particles', 'post'];
  groups.forEach((group, gi) => {
    const folder = gui.addFolder(names[gi] ?? `group ${gi}`);
    for (const [key, u] of Object.entries(group)) {
      if (typeof u.value !== 'number' || key === 'time' || key === 'dt') continue;
      const v = u.value;
      const max = v === 0 ? 1 : Math.abs(v) * 4;
      folder.add(u, 'value', v < 0 ? -max : 0, max).name(key).listen();
    }
  });
  return gui;
}
