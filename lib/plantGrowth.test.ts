import { getPlantStage, getPlantStageFromHabit } from './plantGrowth';
import { StreakHabit, HabitLog } from './streaks';

const dailyHabit: StreakHabit = {
  repeat_schedule: { type: 'daily' },
  start_date: '2026-01-01',
  end_date: null,
};

function logsFor(pattern: Record<string, boolean>): HabitLog[] {
  return Object.entries(pattern).map(([date, completed]) => ({
    habit_id: 'habit-1',
    date,
    completed,
  }));
}

describe('getPlantStage — stage boundaries (completion-based)', () => {
  it('is seed from 0 up to (but not including) 3 completions', () => {
    expect(getPlantStage(0)).toBe('seed');
    expect(getPlantStage(1)).toBe('seed');
    expect(getPlantStage(2)).toBe('seed');
  });

  it('becomes sprout at 3 completions, holds through 9', () => {
    expect(getPlantStage(3)).toBe('sprout');
    expect(getPlantStage(9)).toBe('sprout');
  });

  it('becomes flower at 10 completions, holds through 24', () => {
    expect(getPlantStage(10)).toBe('flower');
    expect(getPlantStage(24)).toBe('flower');
  });

  it('becomes tree at 25 completions, holds through 49', () => {
    expect(getPlantStage(25)).toBe('tree');
    expect(getPlantStage(49)).toBe('tree');
  });

  it('becomes tree_fruiting at 50 completions', () => {
    expect(getPlantStage(50)).toBe('tree_fruiting');
  });

  it('caps at tree_fruiting well beyond 50 and never throws', () => {
    expect(getPlantStage(51)).toBe('tree_fruiting');
    expect(getPlantStage(10000)).toBe('tree_fruiting');
  });

  it('is one completion short of a boundary — stays at the previous stage', () => {
    expect(getPlantStage(2)).not.toBe('sprout');
    expect(getPlantStage(9)).not.toBe('flower');
    expect(getPlantStage(24)).not.toBe('tree');
    expect(getPlantStage(49)).not.toBe('tree_fruiting');
  });
});

describe('getPlantStageFromHabit — missed day pause behaviour', () => {
  it('a miss does not knock the plant back to seed once it has grown', () => {
    // 3 completed days -> exactly the sprout threshold
    const pattern: Record<string, boolean> = {};
    for (let i = 1; i <= 3; i++) {
      pattern[`2026-01-0${i}`] = true;
    }
    const grown = logsFor(pattern);
    const refAfterGrowth = new Date('2026-01-03T12:00:00');
    expect(getPlantStageFromHabit(dailyHabit, grown, refAfterGrowth)).toBe('sprout');

    // day 4 is a miss - stage must hold at sprout, not reset to seed
    const withMiss = [...grown, { habit_id: 'habit-1', date: '2026-01-04', completed: false }];
    const refAfterMiss = new Date('2026-01-04T12:00:00');
    expect(getPlantStageFromHabit(dailyHabit, withMiss, refAfterMiss)).toBe('sprout');
  });

  it('a brand new habit with no logs is a seed', () => {
    expect(getPlantStageFromHabit(dailyHabit, [], new Date('2026-01-01T12:00:00'))).toBe('seed');
  });

  it('growth resumes accumulating after the paused day, without double counting', () => {
    const logs = logsFor({
      '2026-01-01': true,
      '2026-01-02': true,
      '2026-01-03': false, // miss - pause
      '2026-01-04': true,
    });
    // 3 completed due-days total -> exactly the sprout threshold, even
    // though one of the four days in between was missed
    expect(getPlantStageFromHabit(dailyHabit, logs, new Date('2026-01-04T12:00:00'))).toBe(
      'sprout'
    );
  });

  it('a less-frequent habit grows more slowly in calendar time for the same effort', () => {
    // Weekly habit (Mondays only): 3 completed Mondays takes 3 weeks of
    // calendar time to reach the same 'sprout' stage a daily habit reaches
    const weeklyHabit: StreakHabit = {
      repeat_schedule: { type: 'weekly', days: ['Mon'] },
      start_date: '2026-01-01', // a Thursday
      end_date: null,
    };
    const logs = logsFor({
      '2026-01-05': true, // Mon
      '2026-01-12': true, // Mon
      '2026-01-19': true, // Mon
    });
    expect(getPlantStageFromHabit(weeklyHabit, logs, new Date('2026-01-19T12:00:00'))).toBe(
      'sprout'
    );
  });
});