import { getReinforcementTier, getReinforcementCopy } from './reinforcement';

describe('reinforcement logic', () => {
  test('getReinforcementTier buckets values correctly', () => {
    expect(getReinforcementTier(0)).toBe('direct');
    expect(getReinforcementTier(32)).toBe('direct');
    expect(getReinforcementTier(33)).toBe('balanced');
    expect(getReinforcementTier(50)).toBe('balanced');
    expect(getReinforcementTier(66)).toBe('balanced');
    expect(getReinforcementTier(67)).toBe('encouraging');
    expect(getReinforcementTier(100)).toBe('encouraging');
  });

  test('getReinforcementCopy returns different tones', () => {
    const directCopy = getReinforcementCopy('missed_day', 10);
    const encouragingCopy = getReinforcementCopy('missed_day', 90);

    expect(directCopy).toContain('Don\'t let your plants wither');
    expect(encouragingCopy).toContain('It\'s okay to miss a day');
    expect(directCopy).not.toBe(encouragingCopy);
  });
});
