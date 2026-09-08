import { RepeatSchedule } from '../components/HabitForm';
import { isHabitScheduledForDate } from './habitSchedule';
import { HabitLog } from './types';
import { toLocalISOString } from './dateUtils';

export type { HabitLog };

export type StreakHabit = {
  repeat_schedule: RepeatSchedule;
  start_date: string;
  end_date: string | null;
};

// ... remove the local function and use toLocalISOString instead ...


function addDaysToISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + delta);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function calculateGenericStreak(
  habit: StreakHabit,
  logs: HabitLog[],
  referenceDate: Date
): number {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  function isDue(iso: string): boolean {
    return isHabitScheduledForDate(habit.repeat_schedule, new Date(iso + 'T00:00:00'), habit.start_date, habit.end_date);
  }

  let cursor = toLocalISOString(referenceDate);

  if (isDue(cursor) && !completedDates.has(cursor)) {
    cursor = addDaysToISO(cursor, -1);
  }

  let streak = 0;
  while (cursor >= habit.start_date) {
    if (!isDue(cursor)) {
      cursor = addDaysToISO(cursor, -1);
      continue;
    }
    if (!completedDates.has(cursor)) break;
    streak += 1;
    cursor = addDaysToISO(cursor, -1);
  }

  return streak;
}

export function calculateStreak(
  habit: StreakHabit,
  logs: HabitLog[],
  referenceDate: Date = new Date()
): number {
  return calculateGenericStreak(habit, logs, referenceDate);
}

export function calculateGrowthStreak(
  habit: StreakHabit,
  logs: HabitLog[],
  referenceDate: Date = new Date()
): number {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  function isDue(iso: string): boolean {
    return isHabitScheduledForDate(habit.repeat_schedule, new Date(iso + 'T00:00:00'), habit.start_date, habit.end_date);
  }

  const endISO = toLocalISOString(referenceDate);
  let cursor = habit.start_date;
  let growth = 0;

  while (cursor <= endISO) {
    if (isDue(cursor) && completedDates.has(cursor)) {
      growth += 1;
    }
    cursor = addDaysToISO(cursor, 1);
  }

  return growth;
}