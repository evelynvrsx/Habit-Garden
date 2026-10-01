import { supabase } from './supabase';
import { Habit } from './types';
import { getPlantStageFromHabit } from './plantGrowth';
import { HabitLog } from './streaks';
import { PlantSpecies } from './plantSpecies';
import { PlantStage } from './plantGrowth';
import { mostRecentMonday } from './dateUtils';

export type SnapshotPlot = {
  habit_id: string;
  title: string;
  species: PlantSpecies;
  stage: PlantStage;
};

export type GardenSnapshot = {
  id: string;
  week_start: string;
  plots: SnapshotPlot[];
};

export { mostRecentMonday };

// The Monday exactly 7 days before a given Monday — i.e. the previous,
// now-fully-completed week.
export function previousMonday(mondayISO: string): string {
  const [y, m, d] = mondayISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 7);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Captures a snapshot of the most recently COMPLETED week (not the
 * current, still-in-progress one). Safe to call on every app open —
 * it's a no-op unless a full week has passed since the last capture
 * for that week.
 */
export async function captureSnapshotIfNeeded(
  userId: string,
  habits: Habit[],
  logs: HabitLog[]
): Promise<void> {
  if (habits.length === 0) return;

  const currentWeekMonday = mostRecentMonday(new Date());
  const targetWeek = previousMonday(currentWeekMonday); // last full week

  const { data: existing } = await supabase
    .from('garden_snapshots')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start', targetWeek)
    .maybeSingle();

  if (existing) return;

  const [y, m, d] = targetWeek.split('-').map(Number);
  const sundayDate = new Date(Date.UTC(y, m - 1, d + 6, 23, 59, 59));
  const sundayISO = sundayDate.toISOString().split('T')[0];

  const plots: SnapshotPlot[] = habits
    .filter((h) => h.start_date <= sundayISO && (!h.end_date || h.end_date >= targetWeek))
    .map((habit) => {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      return {
        habit_id: habit.id,
        title: habit.title,
        species: habit.plant_species || 'pink-flower',
        stage: getPlantStageFromHabit(habit, habitLogs, sundayDate),
      };
    });

  if (plots.length === 0) return;

  await supabase.from('garden_snapshots').insert({
    user_id: userId,
    week_start: targetWeek,
    plots,
  });
}

export async function fetchSnapshots(userId: string): Promise<GardenSnapshot[]> {
  const { data, error } = await supabase
    .from('garden_snapshots')
    .select('id, week_start, plots')
    .eq('user_id', userId)
    .order('week_start', { ascending: false });

  if (error) {
    console.log('Error fetching snapshots:', error.message);
    return [];
  }
  return data ?? [];
}