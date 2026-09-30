export type ReinforcementTier = 'disciplined' | 'balanced' | 'encouraging';

export function getReinforcementTier(value: number): ReinforcementTier {
  if (value < 33) return 'disciplined';
  if (value > 66) return 'encouraging';
  return 'balanced';
}

export type ReinforcementMoment = 'missed_day' | 'habit_completed';

const REINFORCEMENT_COPY: Record<ReinforcementMoment, Record<ReinforcementTier, string>> = {
  missed_day: {
    disciplined: "You missed a day. Don't let your plants wither. Get back to it now.",
    balanced: "You missed a day. Remember your goals and try to catch up tomorrow!",
    encouraging: "It's totally fine to take a break! We're ready to pick back up whenever you are.",
  },
  habit_completed: {
    disciplined: "Habit done. Keep the momentum. No excuses.",
    balanced: "Keep it up.",
    encouraging: "Awesome work! You're making great progress. Keep it up!",
  },
};

export function getReinforcementCopy(moment: ReinforcementMoment, value: number): string {
  const tier = getReinforcementTier(value);
  return REINFORCEMENT_COPY[moment][tier];
}

/**
 * Picks which streak number to display, based on reinforcement mode.
 *
 * NOTE: calculateGrowthStreak (lib/streaks.ts) is a cumulative lifetime-
 * completions count, not a "streak that pauses on a miss" -- it never goes
 * down. So Encouraging mode shows a much larger, ever-growing number next
 * to the same fire icon that shows a small consecutive-day count in the
 * other two tiers.
 */
export function getEffectiveStreak(
  tier: ReinforcementTier,
  strictStreak: number,
  growthStreak: number,
  graceStreak?: number
): number {
  if (tier === 'encouraging') return growthStreak;
  if (tier === 'balanced') return graceStreak ?? strictStreak;
  return strictStreak;
}