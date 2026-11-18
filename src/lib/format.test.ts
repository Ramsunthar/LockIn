import { formatClock, formatMonth } from './format';

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(305)).toBe('05:05');
  });
  it('lets minutes run past 59', () => {
    expect(formatClock(3725)).toBe('62:05');
  });
  it('clamps negatives and drops fractions', () => {
    expect(formatClock(-4)).toBe('00:00');
    expect(formatClock(59.9)).toBe('00:59');
  });
});

describe('formatMonth', () => {
  it('spells out the month and year', () => {
    expect(formatMonth('2026-05')).toBe('May 2026');
    expect(formatMonth('2027-01')).toBe('January 2027');
  });
});
