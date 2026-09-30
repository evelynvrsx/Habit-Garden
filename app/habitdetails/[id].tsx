import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { RepeatSchedule } from '../../components/HabitForm';
import { HabitLog } from '../../lib/streaks';

type HabitDetails = {
  id: string;
  title: string;
  icon: string;
  repeat_schedule: RepeatSchedule;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habit, setHabit] = useState<HabitDetails | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [habitResult, logsResult] = await Promise.all([
      supabase.from('habits').select('*').eq('id', id).single(),
      supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .eq('habit_id', id)
        .eq('completed', true),
    ]);

    if (habitResult.error || !habitResult.data) {
      console.error('Error loading habit:', habitResult.error?.message);
      Alert.alert('Could not load habit', 'Please try again.');
      router.back();
      return;
    }

    setHabit(habitResult.data);
    setLogs((logsResult.data as HabitLog[]) ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading || !habit) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Habit Details', headerShown: true, headerTitleAlign: 'center' }} />
        <ActivityIndicator color="#4CAF50" />
      </View>
    );
  }

  const totalCompletions = logs.length;

  const formatSchedule = (schedule: RepeatSchedule): string => {
    switch (schedule.type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        if (schedule.mode === 'specific_days') {
          return `Weekly (${schedule.days.join(', ')})`;
        }
        return `Weekly (${schedule.count} times a week)`;
      case 'monthly':
        if (schedule.mode === 'specific_dates') {
          return `Monthly (on the ${schedule.dates.join(', ')})`;
        }
        return `Monthly (${schedule.count} times a month)`;
      case 'custom':
        return `Every ${schedule.interval} ${schedule.unit}`;
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: 'Habit Details',
          headerShown: true,
          headerTitleAlign: 'center',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/edithabit/${habit.id}`)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Text style={styles.iconEmoji}>{habit.icon}</Text>
        </View>
        <Text style={styles.title}>{habit.title}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCompletions}</Text>
          <Text style={styles.statLabel}>Total Done</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Frequency</Text>
          <Text style={styles.infoValue}>{formatSchedule(habit.repeat_schedule)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Started on</Text>
          <Text style={styles.infoValue}>{formatDate(habit.start_date)}</Text>
        </View>
        {habit.end_date && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ends on</Text>
            <Text style={styles.infoValue}>{formatDate(habit.end_date)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF7043',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconEmoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: '#F4FAF4',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#2E7D32', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#4A7A4A', fontWeight: '600', textTransform: 'uppercase' },
  infoSection: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 20, gap: 20 },
  infoRow: { gap: 4 },
  infoLabel: { fontSize: 13, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, color: '#1A1A1A', fontWeight: '500' },
  editButton: { color: '#4CAF50', fontWeight: '600', fontSize: 16, marginRight: 8 },
});
