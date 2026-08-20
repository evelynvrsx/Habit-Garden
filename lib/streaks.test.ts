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

  it('does not count logs before the habit start_date even with no gap', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const habitStartedRecently: StreakHabit = {
      repeat_schedule: { type: 'daily' },
      start_date: '2026-08-17',
      end_date: null,
    };
    const logs = [
      log('2026-08-15'),
      log('2026-08-16'),
      log('2026-08-17'), // habit starts here
      log('2026-08-18'),
      log('2026-08-19'),
    ];
    expect(calculateStreak(habitStartedRecently, logs, referenceDate)).toBe(3); // 17, 18, 19 only
  });
});

// Weekly schedule streak test
describe('calculateStreak - weekly habits', () => {
  const weeklyHabit: StreakHabit = {
    repeat_schedule: { type: 'weekly', mode: 'specific_days', days: ['Mon', 'Wed', 'Fri'] },
    start_date: '2026-01-01',
    end_date: null,
  };

  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-19T12:00:00'); // a Wednesday
    expect(calculateStreak(weeklyHabit, [], referenceDate)).toBe(0);
  });

  it('skips non-due days without breaking the streak', () => {
    // Mon 08-17, Wed 08-19 are due; Tue/Thu/weekend are not
    const referenceDate = new Date('2026-08-19T12:00:00'); // Wed
    const logs = [log('2026-08-17'), log('2026-08-19')]; // Mon + Wed, both completed
    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(2);
  });

  it('breaks the streak if a due day was missed', () => {
    const referenceDate = new Date('2026-08-19T12:00:00'); // Wed
    const logs = [log('2026-08-14')]; // Fri before, but Mon 08-17 (due) was skipped
    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(0);
  });

  it('gives grace if today is due but not logged yet', () => {
    const referenceDate = new Date('2026-08-19T09:00:00'); // Wed, due, not yet logged
    const logs = [log('2026-08-17')]; // Mon completed
    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(1);
  });
});

// Monthly test
describe('calculateStreak - monthly habits', () => {
  const monthlyHabit: StreakHabit = {
    repeat_schedule: { type: 'monthly', mode: 'specific_dates', dates: [1, 15] },
    start_date: '2026-01-01',
    end_date: null,
  };

  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-15T12:00:00');
    expect(calculateStreak(monthlyHabit, [], referenceDate)).toBe(0);
  });

  it('skips non-due days and counts consecutive due days', () => {
    const referenceDate = new Date('2026-08-15T12:00:00');
    const logs = [log('2026-07-15'), log('2026-08-01'), log('2026-08-15')];
    expect(calculateStreak(monthlyHabit, logs, referenceDate)).toBe(3);
  });

  it('breaks the streak if a due date was missed', () => {
    const referenceDate = new Date('2026-08-15T12:00:00');
    // 2026-08-01 (due) was not logged
    const logs = [log('2026-07-15'), log('2026-08-15')];
    expect(calculateStreak(monthlyHabit, logs, referenceDate)).toBe(1);
  });

  it('gives grace if today is due but not logged yet', () => {
    const referenceDate = new Date('2026-08-15T09:00:00');
    const logs = [log('2026-08-01')];
    expect(calculateStreak(monthlyHabit, logs, referenceDate)).toBe(1);
  });

  it('caps a scheduled date-of-month to the last real day of shorter months', () => {
    // dates: [31] — April only has 30 days, so it should fall on April 30
    const shortMonthHabit: StreakHabit = {
      repeat_schedule: { type: 'monthly', mode: 'specific_dates', dates: [31] },
      start_date: '2026-01-01',
      end_date: null,
    };
    const referenceDate = new Date('2026-05-31T12:00:00');
    const logs = [log('2026-04-30'), log('2026-05-31')];
    expect(calculateStreak(shortMonthHabit, logs, referenceDate)).toBe(2);
  });
});

// Custom test
describe('calculateStreak - custom habits', () => {
  const customHabit: StreakHabit = {
    repeat_schedule: { type: 'custom', interval: 3, unit: 'days' },
    start_date: '2026-08-01', // due on Aug 1, 4, 7, 10, 13, 16, 19...
    end_date: null,
  };

  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    expect(calculateStreak(customHabit, [], referenceDate)).toBe(0);
  });

  it('skips non-due days and counts consecutive due days', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-13'), log('2026-08-16'), log('2026-08-19')];
    expect(calculateStreak(customHabit, logs, referenceDate)).toBe(3);
  });

  it('breaks the streak if a due day was missed', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    // 2026-08-16 (due) not logged
    const logs = [log('2026-08-13'), log('2026-08-19')];
    expect(calculateStreak(customHabit, logs, referenceDate)).toBe(1);
  });

  it('gives grace if today is due but not logged yet', () => {
    const referenceDate = new Date('2026-08-19T09:00:00');
    const logs = [log('2026-08-16')];
    expect(calculateStreak(customHabit, logs, referenceDate)).toBe(1);
  });

  it('handles weeks as the interval unit', () => {
    const biweeklyHabit: StreakHabit = {
      repeat_schedule: { type: 'custom', interval: 2, unit: 'weeks' },
      start_date: '2026-01-01', // due every 14 days: Jan1, Jan15, Jan29...
      end_date: null,
    };
    const referenceDate = new Date('2026-01-29T12:00:00');
    const logs = [log('2026-01-01'), log('2026-01-15'), log('2026-01-29')];
    expect(calculateStreak(biweeklyHabit, logs, referenceDate)).toBe(3);
  });
});