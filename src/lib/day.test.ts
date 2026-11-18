import { currentLocalDate, localDateFor } from './day';

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
