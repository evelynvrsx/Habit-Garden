import { RepeatSchedule } from '../components/HabitForm';
import { PlantSpecies } from './plantSpecies';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  target: number | null;
  target_unit: string | null;
  repeat_schedule: RepeatSchedule;
  reminder: boolean;
  start_date: string;
  end_date: string | null;
  plant_species: PlantSpecies;
}

export type HabitLog = {
  habit_id: string;
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
};
