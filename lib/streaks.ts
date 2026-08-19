import { RepeatSchedule } from '../components/HabitForm';

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

// Calculate daily streak
function calculateDailyStreak(habit: StreakHabit, logs: HabitLog[], referenceDate: Date): number {
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  let cursor = dateToLocalISO(referenceDate);

  if (!completedDates.has(cursor)) {
    cursor = addDaysToISO(cursor, -1);
  }

  let streak = 0;
  while (cursor >= habit.start_date && completedDates.has(cursor)) {
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
  switch (habit.repeat_schedule.type) {
    case 'daily':
      return calculateDailyStreak(habit, logs, referenceDate);
    case 'weekly':
    case 'monthly':
    case 'custom':
      throw new Error(
        `calculateStreak: '${habit.repeat_schedule.type}' habits are not implemented yet`
      );
  }
}