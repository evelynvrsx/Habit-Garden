import { useMemo } from 'react';
import { getPlantStageFromHabit } from './plantGrowth';
import { HabitLog } from './streaks';
import { Habit } from './types';

export function useGardenPlots(habits: Habit[], logs: HabitLog[]) {
  return useMemo(() => {
    return habits.map((habit) => {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      return {
        habit,
        species: habit.plant_species || 'pink-flower',
        stage: getPlantStageFromHabit(habit, habitLogs),
      };
    });
  }, [habits, logs]);
}