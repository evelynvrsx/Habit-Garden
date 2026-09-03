import { mostRecentMonday, previousMonday } from './gardenSnapshots';

describe('mostRecentMonday', () => {
  it('returns the same date when given a Monday', () => {
    expect(mostRecentMonday(new Date('2026-09-07'))).toBe('2026-09-07'); // a Monday
  });

  it('returns last Monday when given a Wednesday', () => {
    expect(mostRecentMonday(new Date('2026-09-09'))).toBe('2026-09-07');
  });

  it('returns last Monday when given a Sunday (wraps back 6 days)', () => {
    expect(mostRecentMonday(new Date('2026-09-13'))).toBe('2026-09-07');
  });
});

describe('previousMonday', () => {
  it('returns exactly 7 days before the given Monday', () => {
    expect(previousMonday('2026-09-07')).toBe('2026-08-31');
  });

  it('handles crossing a month boundary', () => {
    expect(previousMonday('2026-09-07')).toBe('2026-08-31');
    expect(previousMonday('2026-03-02')).toBe('2026-02-23');
  });

  it('handles crossing a year boundary', () => {
    expect(previousMonday('2027-01-04')).toBe('2026-12-28');
  });

  it('composes correctly with mostRecentMonday to target the last fully-completed week', () => {
    // If today is Wednesday 2026-09-09, the current (in-progress) week
    // started 2026-09-07 — so the last COMPLETED week should be 2026-08-31.
    const currentWeekMonday = mostRecentMonday(new Date('2026-09-09'));
    expect(previousMonday(currentWeekMonday)).toBe('2026-08-31');
  });
});