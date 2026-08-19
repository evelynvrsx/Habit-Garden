import { calculateStreak, HabitLog, StreakHabit } from './streaks';

const dailyHabit: StreakHabit = {
  repeat_schedule: { type: 'daily' },
  start_date: '2026-01-01',
  end_date: null,
};

function log(date: string, completed = true): HabitLog {
  return { habit_id: 'habit-1', date, completed };
}

describe('calculateStreak - daily habits', () => {
  it('returns 0 when there is no history', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    expect(calculateStreak(dailyHabit, [], referenceDate)).toBe(0);
  });

  it('returns 1 for a single completed day (today)', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-19')];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(1);
  });

  it('counts a multi-day consecutive streak ending today', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [
      log('2026-08-15'),
      log('2026-08-16'),
      log('2026-08-17'),
      log('2026-08-18'),
      log('2026-08-19'),
    ];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(5);
  });

  it('does not break the streak just because today has not been logged yet', () => {
    // grace period: today isn't "missed" until the day is over
    const referenceDate = new Date('2026-08-19T09:00:00');
    const logs = [
      log('2026-08-17'),
      log('2026-08-18'),
      // 2026-08-19 (today) not logged yet
    ];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(2);
  });

  it('resets the streak when a day in the middle is missed', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [
      log('2026-08-10'),
      log('2026-08-11'),
      // gap: 2026-08-12 missing
      log('2026-08-18'),
      log('2026-08-19'),
    ];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(2);
  });

  it('returns 0 if yesterday and today are both missed', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-16'), log('2026-08-17')];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(0);
  });

  it('ignores logs marked completed: false', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-19', false)];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(0);
  });
});