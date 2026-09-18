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
