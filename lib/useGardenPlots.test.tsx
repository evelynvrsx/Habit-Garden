import React from 'react';
// @ts-ignore
import { create, act } from 'react-test-renderer';
import { useGardenPlots } from './useGardenPlots';
import { Habit } from './types';

function createDummyHabit(id: string): Habit {
  return {
    id,
    user_id: 'user1',
    title: `Habit ${id}`,
    icon: null,
    target: null,
    target_unit: null,
    repeat_schedule: { type: 'daily' },
    reminder: false,
    start_date: '2025-01-01',
    end_date: null,
    plant_species: 'pink-flower',
  };
}

function getPlotsFor(habits: Habit[]) {
  let result: ReturnType<typeof useGardenPlots> = [];
  function TestComponent() {
    result = useGardenPlots(habits, []);
    return null;
  }
  act(() => {
    create(<TestComponent />);
  });
  return result;
}

describe('useGardenPlots', () => {
  it('returns 0 plots when 0 habits are provided', () => {
    const plotsResult = getPlotsFor([]);
    expect(plotsResult.length).toBe(0);
  });

  it('returns 5 plots when 5 habits are provided', () => {
    const habits = Array.from({ length: 5 }, (_, i) => createDummyHabit(`${i + 1}`));
    const plotsResult = getPlotsFor(habits);
    expect(plotsResult.length).toBe(5);
    expect(plotsResult.filter((p) => p.habit !== null).length).toBe(5);
  });

  it('returns 9 plots when 9 habits are provided', () => {
    const habits = Array.from({ length: 9 }, (_, i) => createDummyHabit(`${i + 1}`));
    const plotsResult = getPlotsFor(habits);
    expect(plotsResult.length).toBe(9);
    expect(plotsResult.filter((p) => p.habit !== null).length).toBe(9);
  });

  it('returns 8 plots when habit is deleted (e.g. from 9 down to 8 habits)', () => {
    const habits = Array.from({ length: 8 }, (_, i) => createDummyHabit(`${i + 1}`));
    const plotsResult = getPlotsFor(habits);
    expect(plotsResult.length).toBe(8);
  });
});
