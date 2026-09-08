/**
 * Returns a YYYY-MM-DD string in the user's local timezone.
 * This is preferred for habit tracking so that "today"
 * transitions at midnight local time.
 */
export function toLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns a Date object for the start of the day in local time.
 */
export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
