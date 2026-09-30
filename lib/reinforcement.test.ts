import { getReinforcementTier, getReinforcementCopy, getEffectiveStreak } from './reinforcement';

describe('getReinforcementTier', () => {
  it('buckets low values as disciplined', () => {
    expect(getReinforcementTier(0)).toBe('disciplined');
    expect(getReinforcementTier(32)).toBe('disciplined');
  });

  it('buckets mid values as balanced', () => {
    expect(getReinforcementTier(33)).toBe('balanced');
    expect(getReinforcementTier(50)).toBe('balanced');
    expect(getReinforcementTier(66)).toBe('balanced');
  });

  it('buckets high values as encouraging', () => {
    expect(getReinforcementTier(67)).toBe('encouraging');
    expect(getReinforcementTier(100)).toBe('encouraging');
  });
});

describe('getReinforcementCopy', () => {
  it('returns distinct missed_day copy per tier', () => {
    const disciplined = getReinforcementCopy('missed_day', 0);
    const encouraging = getReinforcementCopy('missed_day', 100);
    expect(disciplined).not.toBe(encouraging);
  });

  it('returns distinct habit_completed copy per tier', () => {
    const disciplined = getReinforcementCopy('habit_completed', 0);
    const encouraging = getReinforcementCopy('habit_completed', 100);
    expect(disciplined).not.toBe(encouraging);
  });
});

describe('getEffectiveStreak', () => {
  it('shows the strict streak in disciplined mode', () => {
    expect(getEffectiveStreak('disciplined', 3, 47, 5)).toBe(3);
  });

  it('shows the grace streak in balanced mode', () => {
    expect(getEffectiveStreak('balanced', 3, 47, 5)).toBe(5);
  });

  it('falls back to strict streak in balanced mode if grace streak is omitted', () => {
    expect(getEffectiveStreak('balanced', 3, 47)).toBe(3);
  });

  it('shows the growth (cumulative) count in encouraging mode', () => {
    expect(getEffectiveStreak('encouraging', 3, 47, 5)).toBe(47);
  });

  it('falls back sensibly when both numbers happen to match', () => {
    expect(getEffectiveStreak('encouraging', 5, 5, 5)).toBe(5);
  });
});