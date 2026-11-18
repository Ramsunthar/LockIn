import { buildMonthCells, buildWeekStrip, shadingLevel, stripStart } from './grid';

describe('shadingLevel', () => {
  it('buckets counts into 0 / 1 / 2-3 / 4+', () => {
    expect([0, 1, 2, 3, 4, 9].map(shadingLevel)).toEqual([0, 1, 2, 2, 3, 3]);
  });
});

describe('buildMonthCells', () => {
  const none = new Set<string>();

  it('pads with blanks so the 1st lands on the right weekday (Monday first)', () => {
    // 1 May 2026 is a Friday: four blanks (Mon-Thu).
    const cells = buildMonthCells('2026-05', {}, none, '2026-05-10');
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells[4]?.date).toBe('2026-05-01');
    expect(cells).toHaveLength(4 + 31);
  });

  it('has no blanks when the month starts on a Monday', () => {
    // 1 June 2026 is a Monday.
    const cells = buildMonthCells('2026-06', {}, none, '2026-06-15');
    expect(cells[0]?.date).toBe('2026-06-01');
    expect(cells).toHaveLength(30);
  });

  it('puts a Sunday-start month at six blanks', () => {
    // 1 Feb 2026 is a Sunday.
    expect(buildMonthCells('2026-02', {}, none, '2026-02-10').filter((c) => c === null)).toHaveLength(6);
  });

  it('applies shading, grace, today and future flags', () => {
    const cells = buildMonthCells(
      '2026-05',
      { '2026-05-01': 1, '2026-05-02': 3, '2026-05-03': 5 },
      new Set(['2026-05-04']),
      '2026-05-10'
    );
    const byDate = Object.fromEntries(cells.filter(Boolean).map((c) => [c!.date, c!]));
    expect(byDate['2026-05-01'].level).toBe(1);
    expect(byDate['2026-05-02'].level).toBe(2);
    expect(byDate['2026-05-03'].level).toBe(3);
    expect(byDate['2026-05-04']).toMatchObject({ grace: true, level: 0 });
    expect(byDate['2026-05-10'].isToday).toBe(true);
    expect(byDate['2026-05-09'].isFuture).toBe(false);
    expect(byDate['2026-05-11'].isFuture).toBe(true);
  });

  it('copes with a month that has no data at all', () => {
    const cells = buildMonthCells('2026-05', {}, none, '2026-05-10');
    expect(cells.filter(Boolean).every((c) => c!.level === 0 && !c!.grace)).toBe(true);
  });
});

describe('buildWeekStrip', () => {
  const none = new Set<string>();

  it('has 12 weeks of 7 days, oldest first, ending in the current week', () => {
    // Sunday 10 May 2026: its week starts Monday 4 May.
    const strip = buildWeekStrip('2026-05-10', {}, none);
    expect(strip).toHaveLength(12);
    expect(strip.every((week) => week.length === 7)).toBe(true);
    expect(strip[11][0]?.date).toBe('2026-05-04');
    expect(strip[11][6]?.date).toBe('2026-05-10');
    expect(strip[0][0]?.date).toBe('2026-02-16');
  });

  it('blanks the days after today in the current week', () => {
    // Wednesday 6 May 2026.
    const last = buildWeekStrip('2026-05-06', {}, none)[11];
    expect(last.map((c) => c?.date ?? null)).toEqual([
      '2026-05-04', '2026-05-05', '2026-05-06', null, null, null, null,
    ]);
  });

  it('carries shading, grace and today through', () => {
    const strip = buildWeekStrip('2026-05-06', { '2026-05-05': 4 }, new Set(['2026-05-04']));
    const week = strip[11];
    expect(week[0]).toMatchObject({ grace: true });
    expect(week[1]).toMatchObject({ level: 3 });
    expect(week[2]).toMatchObject({ isToday: true });
  });

  it('stripStart is always a Monday and spans a year boundary correctly', () => {
    expect(stripStart('2026-01-05')).toBe('2025-10-20'); // Monday 5 Jan, 11 weeks back
  });
});
