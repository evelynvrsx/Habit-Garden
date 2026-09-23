import { Habit, HabitLog } from './types';
import { isHabitScheduledForDate } from './habitSchedule';
import { calculateStreak, calculateGrowthStreak } from './streaks';
import { getReinforcementTier, getEffectiveStreak } from './reinforcement';
import { toLocalISOString } from './dateUtils';

export type DayStatus = 'completed' | 'partial' | 'missed' | 'none';

export interface HabitSummary {
  id: string;
  title: string;
  icon?: string | null;
  currentStreak: number;
  completionRate: number;
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

/** Per-habit streak, routed through reinforcement mode when provided.
 *  With no reinforcementMode passed, behaves exactly like the old
 *  calculateStreak-only version (backward compatible). */
function effectiveHabitStreak(
  habit: Habit,
  habitLogs: HabitLog[],
  asOf: Date,
  reinforcementMode?: number
): number {
  const strict = calculateStreak(habit, habitLogs, asOf);
  if (reinforcementMode === undefined) return strict;
  const tier = getReinforcementTier(reinforcementMode);
  const growth = calculateGrowthStreak(habit, habitLogs, asOf);
  return getEffectiveStreak(tier, strict, growth);
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
      if (isCompletedOn(completedSet, habit.id, toLocalISOString(cursor))) completed++;
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
        if (isCompletedOn(completedSet, habit.id, toLocalISOString(cursor))) completed++;
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
 *
 * Pass reinforcementMode to route each habit's streak through
 * getEffectiveStreak (Encouraging mode shows the cumulative growth count
 * instead of the strict consecutive-day count). Omit it to keep the old,
 * strict-only behavior.
 */
export function calculateHeadlineStreak(
  habits: Habit[],
  logs: HabitLog[],
  asOf: Date = new Date(),
  reinforcementMode?: number
): number {
  if (habits.length === 0) return 0;
  const streaks = habits.map((h) =>
    effectiveHabitStreak(h, logs.filter((l) => l.habit_id === h.id), asOf, reinforcementMode)
  );
  return Math.max(...streaks);
}

/**
 * Per-habit rows for the "Summary" list — reuses the real calculateStreak
 * per habit (same one Home screen uses). Same reinforcementMode behavior
 * as calculateHeadlineStreak above.
 */
export function getHabitSummaries(
  habits: Habit[],
  logs: HabitLog[],
  asOf: Date = new Date(),
  reinforcementMode?: number
): HabitSummary[] {
  return habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    icon: habit.icon,
    currentStreak: effectiveHabitStreak(
      habit,
      logs.filter((l) => l.habit_id === habit.id),
      asOf,
      reinforcementMode
    ),
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
    const iso = toLocalISOString(date);

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

/**
 * Longest streak this habit has EVER had, not just the current run.
 * Walks forward from start_date, resetting only on missed scheduled days.
 * Unlike current streak, this never goes down — pure positive-only stat.
 */
export function calculateBestStreakForHabit(
  habit: Habit,
  logs: HabitLog[],
  asOf: Date = new Date()
): number {
  const completedSet = buildCompletedSet(logs);
  let best = 0;
  let current = 0;

  const cursor = new Date(habit.start_date + 'T00:00:00');
  while (cursor <= asOf) {
    if (scheduledOn(habit, cursor)) {
      if (isCompletedOn(completedSet, habit.id, toLocalISOString(cursor))) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return best;
}

/**
 * Change in overall completion rate vs. 7 days ago.
 * Positive = improving, negative = declining. Rounded to whole %.
 */
export function calculateCompletionRateDelta(
  habits: Habit[],
  logs: HabitLog[],
  today: Date = new Date()
): number {
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const currentRate = calculateOverallCompletionRate(habits, logs, today);
  const priorRate = calculateOverallCompletionRate(habits, logs, weekAgo);

  return Math.round(currentRate - priorRate);
}