import { buildMonthCells, shadingLevel } from './grid';

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
