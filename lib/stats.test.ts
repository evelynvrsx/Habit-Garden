import {
  calculateCompletionRate,
  calculateOverallCompletionRate,
  calculateHeadlineStreak,
  getHabitSummaries,
  getCalendarDayStatuses,
} from './stats';
import { Habit } from './types';
import { HabitLog } from './streaks';

// Fixed "today" so tests are deterministic: Wed 2022-01-05
const TODAY = new Date('2022-01-05T00:00:00');

const dailyHabit: Habit = {
  id: 'h1',
  user_id: 'u1',
  title: 'Drink water',
  icon: '💧',
  target: 1,
  target_unit: 'times',
  repeat_schedule: { type: 'daily' },
  reminder: false,
  start_date: '2022-01-01',
  end_date: null,
  plant_species: 'strawberry',
};

const weekdayHabit: Habit = {
  id: 'h2',
  user_id: 'u1',
  title: 'Gym',
  icon: '🏋️',
  target: 1,
  target_unit: 'times',
  repeat_schedule: { type: 'weekly', mode: 'specific_days', days: ['Mon', 'Wed', 'Fri'] },
  reminder: false,
  start_date: '2022-01-01',
  end_date: null,
  plant_species: 'pink_flower',
};

function log(habit_id: string, date: string, completed = true): HabitLog {
  return { habit_id, date, completed };
}

describe('calculateCompletionRate', () => {
  it('returns 0 when the habit has no scheduled days yet', () => {
    const futureHabit: Habit = { ...dailyHabit, start_date: '2022-06-01' };
    expect(calculateCompletionRate(futureHabit, [], TODAY)).toBe(0);
  });

  it('computes % of scheduled days completed for a daily habit', () => {
    const logs = [
      log('h1', '2022-01-01'),
      log('h1', '2022-01-02'),
      log('h1', '2022-01-03'),
      log('h1', '2022-01-04'),
    ];
    expect(calculateCompletionRate(dailyHabit, logs, TODAY)).toBe(80);
  });

  it('ignores logs for dates the habit was not scheduled on', () => {
    const logs = [log('h2', '2022-01-03'), log('h2', '2022-01-02', true)];
    expect(calculateCompletionRate(weekdayHabit, logs, TODAY)).toBe(50);
  });
});

describe('calculateOverallCompletionRate', () => {
  it('aggregates completion across all habits', () => {
    const logs = [
      log('h1', '2022-01-01'),
      log('h1', '2022-01-02'),
      log('h1', '2022-01-03'),
      log('h1', '2022-01-04'),
      log('h2', '2022-01-03'),
    ];
    expect(calculateOverallCompletionRate([dailyHabit, weekdayHabit], logs, TODAY)).toBeCloseTo(71.4, 1);
  });

  it('returns 0 for no habits', () => {
    expect(calculateOverallCompletionRate([], [], TODAY)).toBe(0);
  });
});

describe('calculateHeadlineStreak', () => {
  it('matches the best individual habit streak (same definition as Home)', () => {
    // h1: daily, completed 01-03..01-05 -> streak 3
    // h2: Mon/Wed/Fri, completed only 01-03 -> streak 1 (01-05 not logged, but today's grace period applies to h1 only via its own calc)
    const logs = [
      log('h1', '2022-01-03'),
      log('h1', '2022-01-04'),
      log('h1', '2022-01-05'),
      log('h2', '2022-01-03'),
    ];
    expect(calculateHeadlineStreak([dailyHabit, weekdayHabit], logs, TODAY)).toBe(3);
  });

  it('returns 0 for no habits', () => {
    expect(calculateHeadlineStreak([], [], TODAY)).toBe(0);
  });
});

describe('getHabitSummaries', () => {
  it('returns one summary per habit using the real calculateStreak', () => {
    const logs = [log('h1', '2022-01-04'), log('h1', '2022-01-05')];
    const summaries = getHabitSummaries([dailyHabit], logs, TODAY);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ id: 'h1', title: 'Drink water', currentStreak: 2 });
    expect(summaries[0].completionRate).toBeCloseTo(40, 0);
  });
});

describe('getCalendarDayStatuses', () => {
  it('marks each day completed / partial / missed / none', () => {
    const logs = [
      log('h1', '2022-01-01'),
      log('h1', '2022-01-03'),
      log('h1', '2022-01-04'),
    ];
    const statuses = getCalendarDayStatuses([dailyHabit, weekdayHabit], logs, 2022, 0, TODAY);

    expect(statuses['2022-01-01']).toBe('completed');
    expect(statuses['2022-01-02']).toBe('missed');
    expect(statuses['2022-01-03']).toBe('partial');
    expect(statuses['2022-01-06']).toBe('none');
  });
});