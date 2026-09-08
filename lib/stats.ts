import { Habit, HabitLog } from './types';
import { isHabitScheduledForDate } from './habitSchedule';
import { calculateStreak } from './streaks';

export type DayStatus = 'completed' | 'partial' | 'missed' | 'none';

export interface HabitSummary {
  id: string;
  title: string;
  icon?: string | null;
  currentStreak: number;
  completionRate: number;
}

// Matches Home screen's write convention
// convention; this keeps the calendar consistent with what's actually written to habit_logs today.
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function scheduledOn(habit: Habit, date: Date): boolean {
  return isHabitScheduledForDate(habit.repeat_schedule, date, habit.start_date, habit.end_date);
}

function isCompletedOn(completedSet: Set<string>, habitId: string, iso: string): boolean {
  return completedSet.has(`${habitId}_${iso}`);
}

function buildCompletedSet(logs: HabitLog[]): Set<string> {
  const set = new Set<string>();
  for (const l of logs) {
    if (l.completed) set.add(`${l.habit_id}_${l.date}`);
  }
  return set;
}

/**
 * % of this habit's scheduled days (from start_date through asOf, inclusive)
 * that were completed. Returns 0 if the habit has no scheduled days yet.
 */
export function calculateCompletionRate(
  habit: Habit,
  logs: HabitLog[],
  asOf: Date = new Date()
): number {
  const completedSet = buildCompletedSet(logs);
  let scheduled = 0;
  let completed = 0;

  const cursor = new Date(habit.start_date + 'T00:00:00');
  while (cursor <= asOf) {
    if (scheduledOn(habit, cursor)) {
      scheduled++;
      if (isCompletedOn(completedSet, habit.id, toDateOnly(cursor))) completed++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return scheduled === 0 ? 0 : (completed / scheduled) * 100;
}

/**
 * across ALL habits' scheduled instances — the headline "success rate" stat.
 */
export function calculateOverallCompletionRate(
  habits: Habit[],
  logs: HabitLog[],
  asOf: Date = new Date()
): number {
  if (habits.length === 0) return 0;
  const completedSet = buildCompletedSet(logs);
  let scheduled = 0;
  let completed = 0;

  for (const habit of habits) {
    const cursor = new Date(habit.start_date + 'T00:00:00');
    while (cursor <= asOf) {
      if (scheduledOn(habit, cursor)) {
        scheduled++;
        if (isCompletedOn(completedSet, habit.id, toDateOnly(cursor))) completed++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return scheduled === 0 ? 0 : (completed / scheduled) * 100;
}

/**
 * Headline "Current Streak" — same definition as the Home screen:
 * the best of each habit's own streak (via the real calculateStreak),
 * not "all habits done that day". Keeps Stats and Home from disagreeing.
 */
export function calculateHeadlineStreak(
  habits: Habit[],
  logs: HabitLog[],
  asOf: Date = new Date()
): number {
  if (habits.length === 0) return 0;
  const streaks = habits.map((h) =>
    calculateStreak(h, logs.filter((l) => l.habit_id === h.id), asOf)
  );
  return Math.max(...streaks);
}

/**
 * Per-habit rows for the "Summary" list — reuses the real calculateStreak
 * per habit (same one Home screen uses).
 */
export function getHabitSummaries(
  habits: Habit[],
  logs: HabitLog[],
  asOf: Date = new Date()
): HabitSummary[] {
  return habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    icon: habit.icon,
    currentStreak: calculateStreak(habit, logs.filter((l) => l.habit_id === habit.id), asOf),
    completionRate: calculateCompletionRate(habit, logs, asOf),
  }));
}

/**
 * Per-day status for the calendar grid, for a given month (0-indexed, JS Date convention).
 * Days after asOf are 'none'. Days with no habits scheduled are 'none'.
 */
export function getCalendarDayStatuses(
  habits: Habit[],
  logs: HabitLog[],
  year: number,
  month: number,
  asOf: Date = new Date()
): Record<string, DayStatus> {
  const completedSet = buildCompletedSet(logs);
  const result: Record<string, DayStatus> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = toDateOnly(date);

    if (date > asOf) {
      result[iso] = 'none';
      continue;
    }

    const scheduled = habits.filter((h) => scheduledOn(h, date));
    if (scheduled.length === 0) {
      result[iso] = 'none';
      continue;
    }

    const completedCount = scheduled.filter((h) =>
      isCompletedOn(completedSet, h.id, iso)
    ).length;

    if (completedCount === scheduled.length) result[iso] = 'completed';
    else if (completedCount > 0) result[iso] = 'partial';
    else result[iso] = 'missed';
  }

  return result;
}