import React, { useCallback, useState } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Habit, HabitLog } from '../../lib/types';
import { calculateOverallCompletionRate, calculateHeadlineStreak, getHabitSummaries, getCalendarDayStatuses, DayStatus } from '../../lib/stats';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StatsScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Mirrors app/(tabs)/index.tsx: habit_logs has no user_id column,
      // RLS scopes rows to the signed-in user. We need full log history here
      // (not just today's) for completion rate / streaks / the calendar.
      const [{ data: habitsData, error: habitsError }, { data: logsData, error: logsError }] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('habit_id, date, completed').eq('completed', true),
      ]);

      if (habitsError) throw habitsError;
      if (logsError) throw logsError;

      setHabits(habitsData ?? []);
      setLogs((logsData as HabitLog[]) ?? []);
    } catch (err) {
      console.error('Error fetching stats data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2D4A34" size="large" />
      </View>
    );
  }

  const today = new Date();
  const successRate = Math.round(calculateOverallCompletionRate(habits, logs, today));
  const currentStreak = calculateHeadlineStreak(habits, logs, today);
  const summaries = getHabitSummaries(habits, logs, today);
  const dayStatuses = getCalendarDayStatuses(
    habits,
    logs,
    visibleMonth.year,
    visibleMonth.month,
    today
  );

  const monthLabel = new Date(visibleMonth.year, visibleMonth.month).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' }
  );

  const goToMonth = (delta: number) => {
    setVisibleMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tabRow}>
        <View style={styles.tabInactive}>
          <Text style={styles.tabInactiveText}>Today</Text>
        </View>
        <View style={styles.tabInactive}>
          <Text style={styles.tabInactiveText}>Weekly</Text>
        </View>
        <View style={styles.tabActive}>
          <Text style={styles.tabActiveText}>Overall</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Summary</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>🔥 Current Streak</Text>
          <Text style={styles.statValue}>{currentStreak} days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Success rate</Text>
          <Text style={styles.statValue}>{successRate}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total habits</Text>
          <Text style={styles.statValue}>{habits.length}</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Habits</Text>
      <View style={styles.habitList}>
        {summaries.length === 0 && (
          <Text style={styles.emptyText}>No habits yet — add one to start tracking.</Text>
        )}
        {summaries.map((s) => (
          <View key={s.id} style={styles.habitRow}>
            <Text style={styles.habitTitle}>{s.title}</Text>
            <Text style={styles.habitMeta}>
              🔥 {s.currentStreak}d · {Math.round(s.completionRate)}%
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => goToMonth(-1)} hitSlop={10}>
            <Text style={styles.calendarNav}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => goToMonth(1)} hitSlop={10}>
            <Text style={styles.calendarNav}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((w) => (
            <Text key={w} style={styles.weekdayLabel}>
              {w}
            </Text>
          ))}
        </View>

        <CalendarGrid
          year={visibleMonth.year}
          month={visibleMonth.month}
          dayStatuses={dayStatuses}
          today={today}
        />
      </View>
    </ScrollView>
  );
}

function CalendarGrid({
  year,
  month,
  dayStatuses,
  today,
}: {
  year: number;
  month: number;
  dayStatuses: Record<string, DayStatus>;
  today: Date;
}) {
  const firstOfMonth = new Date(year, month, 1);
  // Monday-first grid: JS getDay() is 0=Sun..6=Sat, shift so Mon=0..Sun=6
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { label: number; iso?: string; inMonth: boolean }[] = [];

  for (let i = leadingBlanks; i > 0; i--) {
    cells.push({ label: prevMonthDays - i + 1, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, month, d).toISOString().slice(0, 10);
    cells.push({ label: d, iso, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ label: cells.length - leadingBlanks - daysInMonth + 1, inMonth: false });
  }

  const todayIso = today.toISOString().slice(0, 10);

  return (
    <View style={styles.grid}>
      {cells.map((cell, idx) => {
        const status = cell.iso ? dayStatuses[cell.iso] : 'none';
        const isToday = cell.iso === todayIso;
        return (
          <View key={idx} style={styles.dayCellWrapper}>
            <View
              style={[
                styles.dayCircle,
                status === 'completed' && styles.dayCompleted,
                status === 'partial' && styles.dayPartial,
                status === 'missed' && styles.dayMissed,
                isToday && styles.dayToday,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  !cell.inMonth && styles.dayTextMuted,
                  status === 'completed' && styles.dayTextOnDark,
                ]}
              >
                {cell.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const GREEN_BG = '#E9F1E0';
const GREEN_CARD = '#DCEACF';
const GREEN_DARK = '#2D4A34';
const GREEN_MID = '#6B8F5F';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GREEN_BG },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN_BG },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: GREEN_CARD,
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  tabInactive: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabInactiveText: { color: GREEN_MID, fontWeight: '500' },
  tabActive: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: GREEN_DARK,
    borderRadius: 16,
  },
  tabActiveText: { color: '#fff', fontWeight: '600' },

  sectionHeading: { fontSize: 20, fontWeight: '700', color: GREEN_DARK, marginBottom: 10 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: GREEN_CARD, borderRadius: 14, padding: 12 },
  statLabel: { fontSize: 12, color: GREEN_MID, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '700', color: GREEN_DARK },

  habitList: { marginBottom: 24 },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  habitTitle: { fontSize: 14, fontWeight: '600', color: GREEN_DARK },
  habitMeta: { fontSize: 13, color: GREEN_MID },
  emptyText: { color: GREEN_MID, fontStyle: 'italic' },

  calendarCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16 },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: { fontSize: 16, fontWeight: '700', color: GREEN_DARK },
  calendarNav: { fontSize: 22, color: GREEN_MID, paddingHorizontal: 8 },

  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: GREEN_MID },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellWrapper: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 13, color: '#1F2A24' },
  dayTextMuted: { color: '#C3CDC0' },
  dayTextOnDark: { color: '#fff', fontWeight: '700' },
  dayCompleted: { backgroundColor: GREEN_DARK },
  dayPartial: { borderWidth: 1.5, borderColor: GREEN_MID },
  dayMissed: { borderWidth: 1, borderColor: '#E3B8B8' },
  dayToday: { borderWidth: 2, borderColor: GREEN_DARK },
});