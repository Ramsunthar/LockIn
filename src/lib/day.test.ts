import { currentLocalDate, localDateFor, localDatesBetween, monthOf, monthRange, shiftLocalDate, shiftMonth, tomorrowLocalDate } from './day';

// Dates are built from local-time parts (not ISO strings) on purpose: the
// 04:00 rule is about the device's local clock, so the tests must be too.
// Month is 0-indexed, as in the Date constructor.
const at = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(y, m, d, h, min);

describe('localDateFor', () => {
  it('puts 04:00 on the current calendar day', () => {
    expect(localDateFor(at(2026, 4, 10, 4, 0))).toBe('2026-05-10');
  });

  it('puts 03:59 on the previous calendar day', () => {
    expect(localDateFor(at(2026, 4, 10, 3, 59))).toBe('2026-05-09');
  });

  it('treats midday and late evening as the same day', () => {
    expect(localDateFor(at(2026, 4, 10, 12, 0))).toBe('2026-05-10');
    expect(localDateFor(at(2026, 4, 10, 23, 59))).toBe('2026-05-10');
  });

  it('keeps the previous day across midnight until 04:00', () => {
    // 23:59 on the 10th and 00:00 on the 11th are the same "day".
    expect(localDateFor(at(2026, 4, 10, 23, 59))).toBe('2026-05-10');
    expect(localDateFor(at(2026, 4, 11, 0, 0))).toBe('2026-05-10');
    expect(localDateFor(at(2026, 4, 11, 3, 59))).toBe('2026-05-10');
    expect(localDateFor(at(2026, 4, 11, 4, 0))).toBe('2026-05-11');
  });

  it('rolls back across a month boundary', () => {
    expect(localDateFor(at(2026, 5, 1, 3, 59))).toBe('2026-05-31');
    expect(localDateFor(at(2026, 5, 1, 4, 0))).toBe('2026-06-01');
  });

  it('rolls back into February, including leap years', () => {
    expect(localDateFor(at(2027, 2, 1, 3, 59))).toBe('2027-02-28');
    expect(localDateFor(at(2028, 2, 1, 3, 59))).toBe('2028-02-29');
  });

  it('rolls back across a year boundary', () => {
    expect(localDateFor(at(2027, 0, 1, 3, 59))).toBe('2026-12-31');
    expect(localDateFor(at(2027, 0, 1, 4, 0))).toBe('2027-01-01');
  });

  it('returns a zero-padded YYYY-MM-DD string', () => {
    expect(localDateFor(at(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });
});

describe('currentLocalDate', () => {
  it('applies the same rule to the date it is given', () => {
    expect(currentLocalDate(at(2026, 4, 10, 3, 59))).toBe('2026-05-09');
    expect(currentLocalDate(at(2026, 4, 10, 4, 0))).toBe('2026-05-10');
  });

  it('defaults to now', () => {
    expect(currentLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('shiftLocalDate', () => {
  it('moves forward and back across month and year boundaries', () => {
    expect(shiftLocalDate('2026-05-31', 1)).toBe('2026-06-01');
    expect(shiftLocalDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftLocalDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftLocalDate('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('is unaffected by daylight saving changes', () => {
    expect(shiftLocalDate('2026-03-08', 1)).toBe('2026-03-09');
    expect(shiftLocalDate('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('shifts by zero and by many days', () => {
    expect(shiftLocalDate('2026-05-10', 0)).toBe('2026-05-10');
    expect(shiftLocalDate('2026-01-01', 365)).toBe('2027-01-01');
  });
});

describe('tomorrowLocalDate', () => {
  it('is the next calendar day during the day', () => {
    expect(tomorrowLocalDate(at(2026, 4, 10, 21, 30))).toBe('2026-05-11');
  });

  it('after midnight but before 04:00, tomorrow is still the new calendar day', () => {
    // 01:00 on the 11th is still LockIn day the 10th, so tomorrow is the 11th.
    expect(tomorrowLocalDate(at(2026, 4, 11, 1, 0))).toBe('2026-05-11');
  });
});

describe('localDatesBetween', () => {
  it('is inclusive at both ends', () => {
    expect(localDatesBetween('2026-05-30', '2026-06-02')).toEqual([
      '2026-05-30',
      '2026-05-31',
      '2026-06-01',
      '2026-06-02',
    ]);
  });
  it('returns one date when start equals end, none when start is later', () => {
    expect(localDatesBetween('2026-05-10', '2026-05-10')).toEqual(['2026-05-10']);
    expect(localDatesBetween('2026-05-11', '2026-05-10')).toEqual([]);
  });
});

describe('month helpers', () => {
  it('monthOf takes the YYYY-MM prefix', () => {
    expect(monthOf('2026-05-10')).toBe('2026-05');
  });
  it('shiftMonth crosses year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-05', 0)).toBe('2026-05');
  });
  it('monthRange handles 28, 29, 30 and 31 day months', () => {
    expect(monthRange('2027-02')).toEqual({ first: '2027-02-01', last: '2027-02-28' });
    expect(monthRange('2028-02')).toEqual({ first: '2028-02-01', last: '2028-02-29' });
    expect(monthRange('2026-04').last).toBe('2026-04-30');
    expect(monthRange('2026-05').last).toBe('2026-05-31');
  });
});
