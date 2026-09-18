export type ReinforcementTier = 'direct' | 'balanced' | 'encouraging';

export function getReinforcementTier(value: number): ReinforcementTier {
  if (value < 33) return 'direct';
  if (value > 66) return 'encouraging';
  return 'balanced';
}

export type ReinforcementMoment = 'missed_day' | 'habit_completed';

const REINFORCEMENT_COPY: Record<ReinforcementMoment, Record<ReinforcementTier, string>> = {
  missed_day: {
    direct: "You missed a day. Don't let your plants wither. Get back to it now.",
    balanced: "You missed a day. Remember your goals and try to catch up tomorrow!",
    encouraging: "It's okay to miss a day! Your plants are waiting for you whenever you're ready to grow again.",
  },
  habit_completed: {
    direct: "Habit done. Keep the momentum. No excuses.",
    balanced: "Great job completing your habit! Keep it up.",
    encouraging: "Amazing work today! You and your garden are blooming beautifully! 🌸",
  },
};

export function getReinforcementCopy(moment: ReinforcementMoment, value: number): string {
  const tier = getReinforcementTier(value);
  return REINFORCEMENT_COPY[moment][tier];
}
