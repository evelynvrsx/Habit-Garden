import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { deleteHabit } from '../../store/habits';
import { isHabitScheduledForDate } from '../../lib/habitSchedule';
import { RepeatSchedule } from '../../components/HabitForm';
import { calculateStreak, HabitLog, StreakHabit } from '../../lib/streaks';

type Habit = {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  target: number | null;
  target_unit: string | null;
  repeat_schedule: RepeatSchedule;
  reminder: boolean;
  start_date: string;
  end_date: string | null;
};

const TIME_TYPE_LABELS: Record<string, string> = {
  seconds: 'sec',
  minutes: 'min',
  hours: 'hr',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatHeaderDate(date: Date): string {
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${weekday}, ${day} ${month} ${date.getFullYear()}`;
}

function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatTarget(habit: Habit): string | null {
  if (!habit.target || !habit.target_unit) return null;
  const unit = TIME_TYPE_LABELS[habit.target_unit] ?? habit.target_unit;
  return `${habit.target} ${unit}`;
}

function HabitCard({
  habit,
  isCompleted,
  isPending,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  isCompleted: boolean;
  isPending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const target = formatTarget(habit);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
        activeOpacity={0.7}
        onPress={onToggle}
        disabled={isPending}
      >
        {isCompleted && <Text style={styles.checkboxTick}>✓</Text>}
      </TouchableOpacity>

      <Text style={styles.habitTitle} numberOfLines={1}>
        {habit.icon} {habit.title}
      </Text>

      {target && (
        <View style={styles.targetBadge}>
          <Text style={styles.targetText}>{target}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onEdit}>
        <Text style={styles.iconBtnText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onDelete}>
        <Text style={styles.iconBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}
export default function HomeScreen() {
  const { session } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toISODate(today), [today]);
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const fetchData = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const [habitsResult, logsResult, allLogsResult] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .lte('start_date', todayStr)
        .or(`end_date.is.null,end_date.gte.${todayStr}`)
        .order('start_date', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('date', todayStr)
        .eq('completed', true),
      supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .eq('completed', true)
        .order('date', { ascending: false }),
    ]);

    if (habitsResult.error) {
      console.log('Error loading habits:', habitsResult.error.message);
      Alert.alert('Could not load habits', 'Please check your connection and try again.');
    } else {
      const allHabits = habitsResult.data ?? [];
      const dueToday = allHabits.filter((h: Habit) =>
        isHabitScheduledForDate(h.repeat_schedule, today, h.start_date, h.end_date)
      );
      setHabits(dueToday);

      if (allLogsResult.data) {
        const logs = allLogsResult.data as HabitLog[];
        const streaks = allHabits.map(h => calculateStreak(h as StreakHabit, logs.filter(l => l.habit_id === h.id), today));
        setStreak(streaks.length > 0 ? Math.max(...streaks) : 0);
      }
    }

    if (logsResult.error) {
      console.log('Error loading today\'s logs:', logsResult.error.message);
    } else {
      setCompletedIds(new Set((logsResult.data ?? []).map((l) => l.habit_id)));
    }

    setLoading(false);
  }, [session?.user, todayStr, today]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  function handleDeletePress(habit: Habit) {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.title}"? This will also delete all its logged history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(habit.id),
        },
      ]
    );
  }

  async function confirmDelete(habitId: string) {
    try {
      await deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      // also clean up derived state so it doesn't linger in completed/pending sets
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    } catch (err) {
      console.log('Error deleting habit:', err);
      Alert.alert('Could not delete habit', 'Please check your connection and try again.');
    }
  }

  async function toggleComplete(habit: Habit) {
    const wasCompleted = completedIds.has(habit.id);

    // Optimistic update
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(habit.id);
      else next.add(habit.id);
      return next;
    });
    setPendingIds((prev) => new Set(prev).add(habit.id));

    const { error } = wasCompleted
      ? await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habit.id)
          .eq('date', todayStr)
      : await supabase
          .from('habit_logs')
          .upsert(
            { habit_id: habit.id, date: todayStr, completed: true },
            { onConflict: 'habit_id,date' }
          );

    if (error) {
      console.log('Error toggling habit completion:', error.message);
      // Revert on failure
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(habit.id);
        else next.delete(habit.id);
        return next;
      });
      Alert.alert('Could not update habit', 'Check your connection and try again.');
    } else {
      fetchData();
    }

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(habit.id);
      return next;
    });
  }

  const todoHabits = habits.filter((h) => !completedIds.has(h.id));
  const completedHabits = habits.filter((h) => completedIds.has(h.id));
  const totalCount = habits.length;
  const completedCount = completedHabits.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.dateText}>{formatHeaderDate(today)}</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
        </View>
      </View>

      {/* Week strip */}
      <View style={styles.weekCard}>
        {weekDates.map((d, i) => {
          const isToday = toISODate(d) === todayStr;
          return (
            <View key={i} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
              <View style={[styles.dayCircle, isToday && styles.dayCircleActive]}>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberActive]}>
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Progress summary */}
      <View style={styles.progressCard}>
        <View style={styles.progressLeft}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} / {totalCount} completed
          </Text>
        </View>
        <View style={styles.progressPlantBox} />
      </View>

      {/* Add habit */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.85}
        onPress={() => router.push('/newhabit')}
      >
        <Text style={styles.addButtonText}>+ Add Habit</Text>
      </TouchableOpacity>

      <Text style={styles.habitsHeading}>Habits</Text>

      {totalCount === 0 && !loading ? (
        <Text style={styles.emptyText}>No habits yet — create your first one!</Text>
      ) : (
        <FlatList
          data={[
            { type: 'header', label: 'To do' },
            ...todoHabits.map((h) => ({ type: 'habit' as const, habit: h })),
            ...(completedHabits.length > 0
              ? [{ type: 'header', label: 'Completed' }]
              : []),
            ...completedHabits.map((h) => ({ type: 'habit' as const, habit: h })),
          ]}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.label}` : item.habit.id
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Text style={styles.sectionLabel}>{item.label}</Text>
            ) : (
              <HabitCard
                habit={item.habit}
                isCompleted={completedIds.has(item.habit.id)}
                isPending={pendingIds.has(item.habit.id)}
                onToggle={() => toggleComplete(item.habit)}
                onEdit={() => router.push(`/edithabit/${item.habit.id}`)}
                onDelete={() => handleDeletePress(item.habit)}
              />
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const GREEN_DARK = '#2E7D32';
const GREEN_LIGHT = '#E8F5E9';
const GREEN_MID = '#A5D6A7';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBEF',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GREEN_MID,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  streakEmoji: {
    fontSize: 18,
    marginBottom: -2,
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF7043',
  },
  weekCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#888',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: GREEN_LIGHT,
    borderWidth: 2,
    borderColor: GREEN_DARK,
  },
  dayNumber: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  dayNumberActive: {
    color: GREEN_DARK,
    fontWeight: '700',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_LIGHT,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  progressLeft: {
    flex: 1,
    gap: 8,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GREEN_DARK,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  progressPlantBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: GREEN_MID,
  },
  addButton: {
    backgroundColor: GREEN_DARK,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  habitsHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#9E9E9E',
    fontSize: 15,
  },
  listContent: {
    gap: 10,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: GREEN_DARK,
    borderColor: GREEN_DARK,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  habitTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  targetBadge: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: GREEN_MID,
  },
  targetText: {
    fontSize: 13,
    color: GREEN_DARK,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 4,
  },
  iconBtnText: {
    fontSize: 16,
  },
});