import { useMemo } from 'react';
import { getPlantStageFromHabit } from './plantGrowth';
import { HabitLog } from './streaks';
import { Habit } from './types';

const MIN_GRID_SIZE = 9;

export function useGardenPlots(habits: Habit[], logs: HabitLog[]) {
  return useMemo(() => {
    const occupied = habits.map((habit) => {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      return {
        habit,
        species: habit.plant_species || 'pink-flower',
        stage: getPlantStageFromHabit(habit, habitLogs),
      };
    });
    const totalNeeded = Math.max(MIN_GRID_SIZE, occupied.length);
    const emptyCount = Math.max(0, totalNeeded - occupied.length);
    const empty = Array.from({ length: emptyCount }, () => ({
      habit: null,
      species: null,
      stage: null,
    }));
    return [...occupied, ...empty];
  }, [habits, logs]);
}