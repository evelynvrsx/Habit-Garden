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
  it('is seed at 0 completions', () => {
    expect(getPlantStage(0)).toBe('seed');
  });

  it('becomes sprout at 1 completion, holds through 4', () => {
    expect(getPlantStage(1)).toBe('sprout');
    expect(getPlantStage(4)).toBe('sprout');
  });

  it('becomes flower at 5 completions, holds through 14', () => {
    expect(getPlantStage(5)).toBe('flower');
    expect(getPlantStage(14)).toBe('flower');
  });

  it('becomes tree at 15 completions, holds through 34', () => {
    expect(getPlantStage(15)).toBe('tree');
    expect(getPlantStage(34)).toBe('tree');
  });

  it('becomes bonus at 30 completions, holds through 49', () => {
    expect(getPlantStage(30)).toBe('bonus');
    expect(getPlantStage(49)).toBe('bonus');
  });

  it('becomes final at 50 completions', () => {
    expect(getPlantStage(50)).toBe('final');
  });

  it('caps at final well beyond 50 and never throws', () => {
    expect(getPlantStage(51)).toBe('final');
    expect(getPlantStage(10000)).toBe('final');
  });

  it('is one completion short of a boundary — stays at the previous stage', () => {
    expect(getPlantStage(0)).toBe('seed');
    expect(getPlantStage(4)).not.toBe('flower');
    expect(getPlantStage(14)).not.toBe('tree');
    expect(getPlantStage(29)).not.toBe('bonus');
    expect(getPlantStage(49)).not.toBe('final');
  });
});

describe('getPlantStageFromHabit — missed day pause behaviour', () => {
  it('a miss does not knock the plant back to seed once it has grown', () => {
    // 1 completed day -> exactly the sprout threshold
    const pattern: Record<string, boolean> = {
      '2026-01-01': true,
    };
    const grown = logsFor(pattern);
    const refAfterGrowth = new Date('2026-01-01T12:00:00');
    expect(getPlantStageFromHabit(dailyHabit, grown, refAfterGrowth)).toBe('sprout');

    // day 2 is a miss - stage must hold at sprout, not reset to seed
    const withMiss = [...grown, { habit_id: 'habit-1', date: '2026-01-02', completed: false }];
    const refAfterMiss = new Date('2026-01-02T12:00:00');
    expect(getPlantStageFromHabit(dailyHabit, withMiss, refAfterMiss)).toBe('sprout');
  });

  it('a brand new habit with no logs is a seed', () => {
    expect(getPlantStageFromHabit(dailyHabit, [], new Date('2026-01-01T12:00:00'))).toBe('seed');
  });

  it('growth resumes accumulating after the paused day, without double counting', () => {
    const logs = logsFor({
      '2026-01-01': true,
      '2026-01-02': false, // miss - pause
      '2026-01-03': true,
    });
    // 2 completed due-days total -> sprout stage (threshold 1), but not flower (threshold 5)
    expect(getPlantStageFromHabit(dailyHabit, logs, new Date('2026-01-03T12:00:00'))).toBe(
      'sprout'
    );
  });

  it('a less-frequent habit grows more slowly in calendar time for the same effort', () => {
    // Weekly habit (Mondays only): 1 completed Monday takes 1 week of
    // calendar time to reach the same 'sprout' stage a daily habit reaches
    const weeklyHabit: StreakHabit = {
      repeat_schedule: { type: 'weekly', mode: 'specific_days', days: ['Mon'] },
      start_date: '2026-01-01', // a Thursday
      end_date: null,
    };
    const logs = logsFor({
      '2026-01-05': true, // Mon
    });
    expect(getPlantStageFromHabit(weeklyHabit, logs, new Date('2026-01-05T12:00:00'))).toBe(
      'sprout'
    );
  });
});