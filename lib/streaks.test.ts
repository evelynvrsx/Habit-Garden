import { calculateStreak, calculateGrowthStreak, HabitLog, StreakHabit } from './streaks';

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
    const referenceDate = new Date('2026-08-19T09:00:00');
    const logs = [log('2026-08-17'), log('2026-08-18')];
    expect(calculateStreak(dailyHabit, logs, referenceDate)).toBe(2);
  });

  it('resets the streak when a day in the middle is missed', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [
      log('2026-08-10'),
      log('2026-08-11'),
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
      log('2026-08-17'),
      log('2026-08-18'),
      log('2026-08-19'),
    ];
    expect(calculateStreak(habitStartedRecently, logs, referenceDate)).toBe(3);
  });
});

describe('calculateStreak - weekly habits', () => {
  const weeklyHabit: StreakHabit = {
    repeat_schedule: { type: 'weekly', mode: 'specific_days', days: ['Mon', 'Wed', 'Fri'] },
    start_date: '2026-01-01',
    end_date: null,
  };

  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    expect(calculateStreak(weeklyHabit, [], referenceDate)).toBe(0);
  });

  it('skips non-due days without breaking the streak', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-17'), log('2026-08-19')];
    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(2);
  });

  it('breaks the streak if a due day was missed', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-14')];
    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(0);
  });

  it('gives grace if today is due but not logged yet', () => {
    const referenceDate = new Date('2026-08-19T09:00:00');
    const logs = [log('2026-08-17')];
    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(1);
  });
});

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
    const logs = [log('2026-07-15'), log('2026-08-15')];
    expect(calculateStreak(monthlyHabit, logs, referenceDate)).toBe(1);
  });

  it('gives grace if today is due but not logged yet', () => {
    const referenceDate = new Date('2026-08-15T09:00:00');
    const logs = [log('2026-08-01')];
    expect(calculateStreak(monthlyHabit, logs, referenceDate)).toBe(1);
  });

  it('caps a scheduled date-of-month to the last real day of shorter months', () => {
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

describe('calculateStreak - custom habits', () => {
  const customHabit: StreakHabit = {
    repeat_schedule: { type: 'custom', interval: 3, unit: 'days' },
    start_date: '2026-08-01',
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
      start_date: '2026-01-01',
      end_date: null,
    };
    const referenceDate = new Date('2026-01-29T12:00:00');
    const logs = [log('2026-01-01'), log('2026-01-15'), log('2026-01-29')];
    expect(calculateStreak(biweeklyHabit, logs, referenceDate)).toBe(3);
  });
});

// --- New for Issue 8: growth streak pauses instead of resetting on a miss ---

describe('calculateGrowthStreak - daily habits, pause vs reset', () => {
  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    expect(calculateGrowthStreak(dailyHabit, [], referenceDate)).toBe(0);
  });

  it('matches calculateStreak when there are no misses at all', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [
      log('2026-08-15'),
      log('2026-08-16'),
      log('2026-08-17'),
      log('2026-08-18'),
      log('2026-08-19'),
    ];
    expect(calculateGrowthStreak(dailyHabit, logs, referenceDate)).toBe(5);
    expect(calculateGrowthStreak(dailyHabit, logs, referenceDate)).toBe(
      calculateStreak(dailyHabit, logs, referenceDate)
    );
  });

  it('holds instead of resetting when a day in the middle is missed', () => {
    // Same fixture as the calculateStreak "resets the streak" test above,
    // where calculateStreak drops to 2 because of the gap on 2026-08-12.
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [
      log('2026-08-10'),
      log('2026-08-11'),
      // gap: 2026-08-12 missing (a real miss, not just unlogged-today)
      log('2026-08-18'),
      log('2026-08-19'),
    ];

    const resettingStreak = calculateStreak(dailyHabit, logs, referenceDate);
    const growthStreak = calculateGrowthStreak(dailyHabit, logs, referenceDate);

    expect(resettingStreak).toBe(2); // confirms the fixture still behaves as before
    expect(growthStreak).toBe(4); // 4 completed due-days total; the gap paused, didn't reset
    expect(growthStreak).toBeGreaterThan(resettingStreak);
  });

  it('resumes accumulating on top of the held total after the paused day', () => {
    const referenceDate = new Date('2026-08-21T12:00:00');
    const logs = [
      log('2026-08-10'),
      log('2026-08-11'),
      // gap: 2026-08-12
      log('2026-08-18'),
      log('2026-08-19'),
      log('2026-08-20'),
      log('2026-08-21'),
    ];
    // 6 completed due-days total; the single gap neither resets nor double-counts
    expect(calculateGrowthStreak(dailyHabit, logs, referenceDate)).toBe(6);
  });

  it('does not count an unlogged today as a miss (mirrors calculateStreak grace)', () => {
    const referenceDate = new Date('2026-08-19T09:00:00');
    const logs = [log('2026-08-17'), log('2026-08-18')];
    // today not logged yet — growth just doesn't increment for today,
    // it doesn't need to "pause" since nothing was missed yet
    expect(calculateGrowthStreak(dailyHabit, logs, referenceDate)).toBe(2);
  });

  it('ignores logs marked completed: false', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-19', false)];
    expect(calculateGrowthStreak(dailyHabit, logs, referenceDate)).toBe(0);
  });

  it('does not count logs before the habit start_date', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const habitStartedRecently: StreakHabit = {
      repeat_schedule: { type: 'daily' },
      start_date: '2026-08-17',
      end_date: null,
    };
    const logs = [
      log('2026-08-15'),
      log('2026-08-16'),
      log('2026-08-17'),
      log('2026-08-18'),
      log('2026-08-19'),
    ];
    expect(calculateGrowthStreak(habitStartedRecently, logs, referenceDate)).toBe(3);
  });
});

describe('calculateGrowthStreak - weekly habits respect the schedule', () => {
  const weeklyHabit: StreakHabit = {
    repeat_schedule: { type: 'weekly', mode: 'specific_days', days: ['Mon', 'Wed', 'Fri'] },
    start_date: '2026-01-01',
    end_date: null,
  };

  it('does not treat non-due days as misses', () => {
    // Mon 08-17 and Wed 08-19 are due and completed; Tue/Thu/weekend
    // in between are not due, so they must not pause or reset growth.
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-17'), log('2026-08-19')];
    expect(calculateGrowthStreak(weeklyHabit, logs, referenceDate)).toBe(2);
  });

  it('pauses (does not reset) when a due day is missed, unlike calculateStreak', () => {
    // Fri 08-14 completed, Mon 08-17 (due) missed, Wed 08-19 completed.
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-14'), log('2026-08-19')];

    expect(calculateStreak(weeklyHabit, logs, referenceDate)).toBe(1); // resets past the miss
    expect(calculateGrowthStreak(weeklyHabit, logs, referenceDate)).toBe(2); // holds, then adds Wed
  });
});

describe('calculateGrowthStreak - monthly habits respect the schedule', () => {
  const monthlyHabit: StreakHabit = {
    repeat_schedule: { type: 'monthly', mode: 'specific_dates', dates: [1, 15] },
    start_date: '2026-01-01',
    end_date: null,
  };

  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-15T12:00:00');
    expect(calculateGrowthStreak(monthlyHabit, [], referenceDate)).toBe(0);
  });

  it('matches calculateStreak when there are no misses at all', () => {
    const referenceDate = new Date('2026-08-15T12:00:00');
    const logs = [log('2026-07-15'), log('2026-08-01'), log('2026-08-15')];
    expect(calculateGrowthStreak(monthlyHabit, logs, referenceDate)).toBe(3);
    expect(calculateGrowthStreak(monthlyHabit, logs, referenceDate)).toBe(
      calculateStreak(monthlyHabit, logs, referenceDate)
    );
  });

  it('pauses (does not reset) when a due date is missed, unlike calculateStreak', () => {
    // Same fixture as the calculateStreak "breaks the streak" test above:
    // 2026-08-01 (due) was not logged.
    const referenceDate = new Date('2026-08-15T12:00:00');
    const logs = [log('2026-07-15'), log('2026-08-15')];

    expect(calculateStreak(monthlyHabit, logs, referenceDate)).toBe(1); // resets past the miss
    expect(calculateGrowthStreak(monthlyHabit, logs, referenceDate)).toBe(2); // holds both completions
  });

  it('respects the last-real-day-of-month cap like calculateStreak', () => {
    const shortMonthHabit: StreakHabit = {
      repeat_schedule: { type: 'monthly', mode: 'specific_dates', dates: [31] },
      start_date: '2026-01-01',
      end_date: null,
    };
    const referenceDate = new Date('2026-05-31T12:00:00');
    const logs = [log('2026-04-30'), log('2026-05-31')];
    expect(calculateGrowthStreak(shortMonthHabit, logs, referenceDate)).toBe(2);
  });
});

describe('calculateGrowthStreak - custom habits respect the schedule', () => {
  const customHabit: StreakHabit = {
    repeat_schedule: { type: 'custom', interval: 3, unit: 'days' },
    start_date: '2026-08-01',
    end_date: null,
  };

  it('returns 0 with no history', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    expect(calculateGrowthStreak(customHabit, [], referenceDate)).toBe(0);
  });

  it('matches calculateStreak when there are no misses at all', () => {
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-13'), log('2026-08-16'), log('2026-08-19')];
    expect(calculateGrowthStreak(customHabit, logs, referenceDate)).toBe(3);
    expect(calculateGrowthStreak(customHabit, logs, referenceDate)).toBe(
      calculateStreak(customHabit, logs, referenceDate)
    );
  });

  it('pauses (does not reset) when a due day is missed, unlike calculateStreak', () => {
    // Same fixture as the calculateStreak "breaks the streak" test above:
    // 2026-08-16 (due) not logged.
    const referenceDate = new Date('2026-08-19T12:00:00');
    const logs = [log('2026-08-13'), log('2026-08-19')];

    expect(calculateStreak(customHabit, logs, referenceDate)).toBe(1); // resets past the miss
    expect(calculateGrowthStreak(customHabit, logs, referenceDate)).toBe(2); // holds both completions
  });

  it('handles weeks as the interval unit', () => {
    const biweeklyHabit: StreakHabit = {
      repeat_schedule: { type: 'custom', interval: 2, unit: 'weeks' },
      start_date: '2026-01-01',
      end_date: null,
    };
    const referenceDate = new Date('2026-01-29T12:00:00');
    const logs = [log('2026-01-01'), log('2026-01-15'), log('2026-01-29')];
    expect(calculateGrowthStreak(biweeklyHabit, logs, referenceDate)).toBe(3);
  });
});