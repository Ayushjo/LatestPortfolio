/** Contribution-calendar geometry, shared by the particle shape and the hover readout so cells line up. */
export const CALENDAR = { cell: 20, gap: 4, pad: 12 } as const;

export function calendarSize(weeks: number) {
  const step = CALENDAR.cell + CALENDAR.gap;
  return { width: CALENDAR.pad * 2 + weeks * step, height: CALENDAR.pad * 2 + 7 * step };
}
