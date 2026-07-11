import AsyncStorage from '@react-native-async-storage/async-storage';

export type Habit = {
  id: string;
  title: string;
  icon: string;
  targetEnabled: boolean;
  targetNumber: string | null;
  targetType: string | null;
  repeat: string;
};

const KEY = 'habit_garden_habits';

export async function loadHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHabit(habit: Habit): Promise<void> {
  const existing = await loadHabits();
  const updated = [...existing, habit];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}