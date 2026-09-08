import { RepeatSchedule } from '../components/HabitForm';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysInMonth(year: number, monthIndex0: number): number {
  // Day 0 of "next month" is the last day of this month
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/**
 * Spreads `count` occurrences roughly evenly across a month with `totalDays` days.
 * Mirrors the logic used for Weekly's Flexible Count suggestion, generalised to any month length.
 */
function spreadDatesAcrossMonth(count: number, totalDays: number): number[] {
  if (count <= 0) return [];
  if (count >= totalDays) return Array.from({ length: totalDays }, (_, i) => i + 1);

  const dates: number[] = [];
  for (let i = 0; i < count; i++) {
    const date = Math.round((i * totalDays) / count) + 1;
    dates.push(Math.min(date, totalDays));
  }
  return Array.from(new Set(dates)).sort((a, b) => a - b);
}

/**
 * Returns true if a habit with the given repeat_schedule (and start_date) is due on `date`.
 * `date` and `startDateISO` are compared at day precision (time-of-day is ignored).
 */
export function isHabitScheduledForDate(
  schedule: RepeatSchedule,
  date: Date,
  startDateISO: string,
  endDateISO?: string | null
): boolean {
  const target = startOfDay(date);
  const start = startOfDay(new Date(startDateISO));

  if (target < start) return false;
  if (endDateISO) {
    const end = startOfDay(new Date(endDateISO));
    if (target > end) return false;
  }

  switch (schedule.type) {
    case 'daily':
      return true;

    case 'weekly':
      return schedule.days.includes(dayLabel(target));

    case 'monthly': {
      const lastDay = daysInMonth(target.getFullYear(), target.getMonth());

      if (schedule.mode === 'specific_dates') {
        const effectiveDates = schedule.dates.map((d) => Math.min(d, lastDay));
        return effectiveDates.includes(target.getDate());
      }

      const spread = spreadDatesAcrossMonth(schedule.count, lastDay);
      return spread.includes(target.getDate());
    }

    case 'custom': {
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round((target.getTime() - start.getTime()) / msPerDay);
      const intervalDays = schedule.unit === 'weeks' ? schedule.interval * 7 : schedule.interval;
      return diffDays % intervalDays === 0;
    }

    default:
      return false;
  }
}