import { calculateGrowthStreak, StreakHabit, HabitLog } from './streaks';

export type PlantStage = 'seed' | 'sprout' | 'flower' | 'tree' | 'bonus';

// Thresholds are in completions, not time.
// Each plant stage growth depends on how many times user has completed the habit on
// its own scheduled days. so a daily habit's plant grows faster in real time
const STAGE_THRESHOLDS: ReadonlyArray<{ minCompletions: number; stage: PlantStage }> = [
  { minCompletions: 0, stage: 'seed' },
  { minCompletions: 3, stage: 'sprout' },
  { minCompletions: 10, stage: 'flower' },
  { minCompletions: 25, stage: 'tree' },
  { minCompletions: 50, stage: 'bonus' },
];

/**
 * Pure lookup: completion count -> plant stage.
 * Caps at 'bonus' for anything beyond 50 — never throws, never
 * goes past the last stage.
 */
export function getPlantStage(completionCount: number): PlantStage {
  let currentStage: PlantStage = 'seed';
  for (const threshold of STAGE_THRESHOLDS) {
    if (completionCount >= threshold.minCompletions) {
      currentStage = threshold.stage;
    } else {
      break;
    }
  }
  return currentStage;
}

// Returns plant stage based on the growth of the habit
export function getPlantStageFromHabit(
  habit: StreakHabit,
  logs: HabitLog[],
  referenceDate: Date = new Date()
): PlantStage {
  return getPlantStage(calculateGrowthStreak(habit, logs, referenceDate));
}