import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type Habit = {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  target: number | null;
  target_unit: string | null;
  repeat_schedule: { type: string; [key: string]: unknown };
  reminder: boolean;
  start_date: string;
  end_date: string | null;
};

const TIME_TYPE_LABELS: Record<string, string> = {
  seconds: 'sec',
  minutes: 'min',
  hours: 'hr',
};

function formatTarget(habit: Habit): string | null {
  if (!habit.target || !habit.target_unit) return null;
  const type = TIME_TYPE_LABELS[habit.target_unit] ?? habit.target_unit;
  return `${habit.target} ${type}`;
}

function HabitCard({ habit }: { habit: Habit }) {
  const target = formatTarget(habit);

  return (
    <View style={styles.card}>
      {/* Checkbox */}
      <TouchableOpacity style={styles.checkbox} activeOpacity={0.7} />

      {/* Title */}
      <Text style={styles.habitTitle} numberOfLines={1}>
        {habit.icon} {habit.title}
      </Text>

      {/* Target badge */}
      {target && (
        <View style={styles.targetBadge}>
          <Text style={styles.targetText}>{target}</Text>
        </View>
      )}

      {/* Edit / Delete */}
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
        <Text style={styles.iconBtnText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
        <Text style={styles.iconBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload habits every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function fetchHabits() {
        if (!session?.user) return;

        setLoading(true);
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .order('start_date', { ascending: true });

        if (!isActive) return;

        if (error) {
          console.log('Error loading habits:', error.message);
          Alert.alert('Could not load habits', 'Please check your connection and try again.');
        } else {
          setHabits(data ?? []);
        }
        setLoading(false);
      }

      fetchHabits();
      return () => { isActive = false; };
    }, [session?.user])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Garden</Text>
      <Text>Todo</Text>

      {habits.length === 0 ? (
        <Text style={styles.emptyText}>No habits yet — create your first one!</Text>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HabitCard habit={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.createButton}
        activeOpacity={0.85}
        onPress={() => router.push('/newhabit')}
      >
        <Text style={styles.createButtonText}>+ New Habit</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 80,
    color: '#9E9E9E',
    fontSize: 15,
  },
  listContent: {
    gap: 10,
    paddingBottom: 100,
  },

  // Habit card — matches the screenshot style
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

  // FAB-style create button
  createButton: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: GREEN_DARK,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});