// Isolate calculateHeadlineStreak's branching logic by mocking the two
// modules it depends on, rather than needing real habitSchedule/dateUtils
// implementations for a test that doesn't exercise them.
jest.mock('./streaks', () => ({
  calculateStreak: jest.fn(() => 3),
  calculateGrowthStreak: jest.fn(() => 47),
  calculateGraceStreak: jest.fn(() => 5),
}));
jest.mock('./reinforcement', () => ({
  getReinforcementTier: jest.requireActual('./reinforcement').getReinforcementTier,
  getEffectiveStreak: jest.requireActual('./reinforcement').getEffectiveStreak,
}));

import { calculateHeadlineStreak } from './stats';
import { Habit, HabitLog } from './types';

const habit = { id: 'h1', start_date: '2026-01-01', end_date: null } as unknown as Habit;
const logs: HabitLog[] = [];

describe('calculateHeadlineStreak', () => {
  it('is backward compatible: no reinforcementMode means strict streak only', () => {
    expect(calculateHeadlineStreak([habit], logs, new Date('2026-02-01'))).toBe(3);
  });

  it('uses the strict streak in disciplined mode (low value)', () => {
    expect(calculateHeadlineStreak([habit], logs, new Date('2026-02-01'), 0)).toBe(3);
  });

  it('uses the grace streak in balanced mode', () => {
    expect(calculateHeadlineStreak([habit], logs, new Date('2026-02-01'), 50)).toBe(5);
  });

  it('uses the growth (cumulative) count in encouraging mode', () => {
    expect(calculateHeadlineStreak([habit], logs, new Date('2026-02-01'), 100)).toBe(47);
  });

  it('returns 0 for no habits regardless of mode', () => {
    expect(calculateHeadlineStreak([], logs, new Date('2026-02-01'), 100)).toBe(0);
  });
});