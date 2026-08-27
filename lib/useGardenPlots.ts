import { useMemo } from 'react';
import { getPlantStageFromHabit } from './plantGrowth';
import { HabitLog } from './streaks';
import { PlantSpecies } from './plantSpecies';
import { RepeatSchedule } from '../components/HabitForm';

export type GardenHabit = {
  id: string;
  title: string;
  repeat_schedule: RepeatSchedule;
  start_date: string;
  end_date: string | null;
  plant_species: PlantSpecies;
};

const MIN_GRID_SIZE = 9;

export function useGardenPlots(habits: GardenHabit[], logs: HabitLog[]) {
  return useMemo(() => {
    const occupied = habits.map((habit) => {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      return {
        habit,
        species: habit.plant_species || 'pink-flower',
        stage: getPlantStageFromHabit(habit, habitLogs),
      };
    });
    const emptyCount = Math.max(0, MIN_GRID_SIZE - occupied.length);
    const empty = Array.from({ length: emptyCount }, () => ({
      habit: null,
      species: null,
      stage: null,
    }));
    return [...occupied, ...empty];
  }, [habits, logs]);
}