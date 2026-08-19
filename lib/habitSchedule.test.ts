import { isHabitScheduledForDate } from './habitSchedule';

const d = (iso: string) => new Date(`${iso}T00:00:00`);

describe('isHabitScheduledForDate', () => {
  describe('daily', () => {
    it('is due every day on or after the start date', () => {
      const schedule = { type: 'daily' as const };
      expect(isHabitScheduledForDate(schedule, d('2026-08-18'), '2026-08-01')).toBe(true);
    });

    it('is not due before the start date', () => {
      const schedule = { type: 'daily' as const };
      expect(isHabitScheduledForDate(schedule, d('2026-07-31'), '2026-08-01')).toBe(false);
    });
  });

  describe('weekly - specific_days', () => {
    const schedule = { type: 'weekly' as const, mode: 'specific_days' as const, days: ['Mon', 'Wed'] };

    it('is due on a selected day (Monday)', () => {
      // 2026-08-17 is a Monday
      expect(isHabitScheduledForDate(schedule, d('2026-08-17'), '2026-08-01')).toBe(true);
    });

    it('is NOT due on a non-selected day (Tuesday) — this is the bug this test guards against', () => {
      // 2026-08-18 is a Tuesday
      expect(isHabitScheduledForDate(schedule, d('2026-08-18'), '2026-08-01')).toBe(false);
    });

    it('is due on the other selected day (Wednesday)', () => {
      expect(isHabitScheduledForDate(schedule, d('2026-08-19'), '2026-08-01')).toBe(true);
    });
  });

  describe('weekly - flexible_count', () => {
    it('is due only on the resolved days', () => {
      const schedule = {
        type: 'weekly' as const,
        mode: 'flexible_count' as const,
        count: 3,
        days: ['Mon', 'Wed', 'Fri'],
      };
      expect(isHabitScheduledForDate(schedule, d('2026-08-17'), '2026-08-01')).toBe(true); // Mon
      expect(isHabitScheduledForDate(schedule, d('2026-08-18'), '2026-08-01')).toBe(false); // Tue
    });
  });

  describe('monthly - specific_dates', () => {
    const schedule = { type: 'monthly' as const, mode: 'specific_dates' as const, dates: [1, 15] };

    it('is due on a selected date', () => {
      expect(isHabitScheduledForDate(schedule, d('2026-08-15'), '2026-01-01')).toBe(true);
    });

    it('is not due on a non-selected date', () => {
      expect(isHabitScheduledForDate(schedule, d('2026-08-16'), '2026-01-01')).toBe(false);
    });

    it('clamps a date beyond the month length to the last day (31st in a 30-day month)', () => {
      const s = { type: 'monthly' as const, mode: 'specific_dates' as const, dates: [31] };
      // April has 30 days
      expect(isHabitScheduledForDate(s, d('2026-04-30'), '2026-01-01')).toBe(true);
      expect(isHabitScheduledForDate(s, d('2026-04-29'), '2026-01-01')).toBe(false);
    });

    it('clamps the 31st correctly in February (28 days in 2026)', () => {
      const s = { type: 'monthly' as const, mode: 'specific_dates' as const, dates: [31] };
      expect(isHabitScheduledForDate(s, d('2026-02-28'), '2026-01-01')).toBe(true);
    });
  });

  describe('monthly - flexible_count', () => {
    it('spreads occurrences across a 30-day month', () => {
      const schedule = { type: 'monthly' as const, mode: 'flexible_count' as const, count: 3 };
      // Expect roughly evenly spread dates within April (30 days)
      const dueDates = Array.from({ length: 30 }, (_, i) => i + 1).filter((day) =>
        isHabitScheduledForDate(schedule, d(`2026-04-${String(day).padStart(2, '0')}`), '2026-01-01')
      );
      expect(dueDates.length).toBe(3);
    });
  });

  describe('custom', () => {
    it('is due every N days starting from the start date', () => {
      const schedule = { type: 'custom' as const, interval: 3, unit: 'days' as const };
      expect(isHabitScheduledForDate(schedule, d('2026-08-01'), '2026-08-01')).toBe(true); // day 0
      expect(isHabitScheduledForDate(schedule, d('2026-08-02'), '2026-08-01')).toBe(false); // day 1
      expect(isHabitScheduledForDate(schedule, d('2026-08-04'), '2026-08-01')).toBe(true); // day 3
    });

    it('is due every N weeks starting from the start date', () => {
      const schedule = { type: 'custom' as const, interval: 2, unit: 'weeks' as const };
      expect(isHabitScheduledForDate(schedule, d('2026-08-15'), '2026-08-01')).toBe(true); // 14 days later
      expect(isHabitScheduledForDate(schedule, d('2026-08-08'), '2026-08-01')).toBe(false); // 7 days later
    });
  });

  describe('end_date', () => {
    it('is not due after the end date', () => {
      const schedule = { type: 'daily' as const };
      expect(isHabitScheduledForDate(schedule, d('2026-09-01'), '2026-08-01', '2026-08-20')).toBe(false);
    });
  });
});