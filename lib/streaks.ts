import { RepeatSchedule } from '../components/HabitForm';
import { isHabitScheduledForDate } from './habitSchedule';

export type HabitLog = {
  habit_id: string;
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
};

export type StreakHabit = {
  repeat_schedule: RepeatSchedule;
  start_date: string;
  end_date: string | null;
};

function dateToLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Because places like NZ has daylight saving
function addDaysToISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + delta);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Calculate Generic Streak
function calculateGenericStreak(
  habit: StreakHabit,
  logs: HabitLog[],
  referenceDate: Date
): number {
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  function isDue(iso: string): boolean {
    return isHabitScheduledForDate(
      habit.repeat_schedule,
      new Date(iso),
      habit.start_date,
      habit.end_date
    );
  }

  let cursor = dateToLocalISO(referenceDate);

  // Grace period: only forgive an unlogged "today" if today was actually due.
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