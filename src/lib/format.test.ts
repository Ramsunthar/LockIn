import { formatClock } from './format';

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
