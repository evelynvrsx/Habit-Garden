import React, { useCallback, useState, useMemo } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Habit, HabitLog } from '../../lib/types';
import { calculateOverallCompletionRate, calculateHeadlineStreak, getHabitSummaries, getCalendarDayStatuses, DayStatus } from '../../lib/stats';
import { toLocalISOString } from '../../lib/dateUtils';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SORT_OPTIONS = [
  { label: 'Highest %', value: 'highest' },
  { label: 'Lowest %', value: 'lowest' },
  { label: 'Alphabetical', value: 'alpha' },
  { label: 'Start Date', value: 'date' },
];

export default function StatsScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('highest');
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

  const today = useMemo(() => new Date(), []);
  const successRate = Math.round(calculateOverallCompletionRate(habits, logs, today));
  const currentStreak = calculateHeadlineStreak(habits, logs, today);

  const summaries = useMemo(() => {
    const raw = getHabitSummaries(habits, logs, today);
    return [...raw].sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return b.completionRate - a.completionRate;
        case 'lowest':
          return a.completionRate - b.completionRate;
        case 'alpha':
          return a.title.localeCompare(b.title);
        case 'date': {
          const habitA = habits.find((h) => h.id === a.id);
          const habitB = habits.find((h) => h.id === b.id);
          return (habitA?.start_date || '').localeCompare(habitB?.start_date || '');
        }
        default:
          return 0;
      }
    });
  }, [habits, logs, sortBy, today]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2D4A34" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeading}>Overall Summary</Text>
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

        <CalendarLegend />

        <CalendarGrid
          year={visibleMonth.year}
          month={visibleMonth.month}
          dayStatuses={dayStatuses}
          today={today}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Habit completion rates</Text>
        <Dropdown
          style={styles.sortDropdown}
          placeholderStyle={styles.sortDropdownPlaceholder}
          selectedTextStyle={styles.sortDropdownText}
          data={SORT_OPTIONS}
          labelField="label"
          valueField="value"
          value={sortBy}
          onChange={(item) => setSortBy(item.value)}
        />
      </View>
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
    </ScrollView>
  );
}

function CalendarLegend() {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, styles.dayCompleted]} />
        <Text style={styles.legendText}>Done</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, styles.dayPartial]} />
        <Text style={styles.legendText}>Partial</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, styles.dayMissed]} />
        <Text style={styles.legendText}>Missed</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, styles.dayToday]} />
        <Text style={styles.legendText}>Today</Text>
      </View>
    </View>
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
    const iso = toLocalISOString(new Date(year, month, d));
    cells.push({ label: d, iso, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ label: cells.length - leadingBlanks - daysInMonth + 1, inMonth: false });
  }

  const todayIso = toLocalISOString(today);

  return (
    <View style={styles.grid}>
      {cells.map((cell, idx) => {
        const status = cell.iso ? dayStatuses[cell.iso] : 'none';
        const isToday = cell.iso === todayIso;
        // Unique key based on ISO or position for blanks
        const key = cell.iso ? `day-${cell.iso}` : `blank-${idx}`;

        return (
          <View key={key} style={styles.dayCellWrapper}>
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

const GREEN_BG = '#F4FBEF';
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

  sectionHeaderRow: {
    marginBottom: 16,
  },
  sortDropdown: {
    width: 130,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: GREEN_MID,
    marginTop: 4,
  },
  sortDropdownPlaceholder: { fontSize: 12, color: GREEN_MID },
  sortDropdownText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },

  calendarCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 24 },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: { fontSize: 16, fontWeight: '700', color: GREEN_DARK },
  calendarNav: { fontSize: 22, color: GREEN_MID, paddingHorizontal: 8 },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: GREEN_MID, fontWeight: '500' },

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
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  dayText: { fontSize: 13, color: '#1F2A24' },
  dayTextMuted: { color: '#C3CDC0' },
  dayTextOnDark: { color: '#fff', fontWeight: '700' },
  dayCompleted: { backgroundColor: GREEN_DARK, borderRadius: 15 },
  dayPartial: { borderWidth: 1.5, borderColor: GREEN_MID, borderRadius: 15 },
  dayMissed: { borderWidth: 1, borderColor: '#E3B8B8', borderRadius: 15 },
  dayToday: { borderWidth: 2, borderColor: GREEN_DARK, borderRadius: 15 },
});