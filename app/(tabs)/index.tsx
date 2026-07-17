import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { loadHabits, Habit } from '../../store/habits';

// Maps the stored value keys back to human-readable labels
const TIME_NUMBER_LABELS: Record<string, string> = {
  '1': '1',
  '2': '15',
  '3': '30',
  '4': '45',
  '5': '60',
};

const TIME_TYPE_LABELS: Record<string, string> = {
  '1': 'sec',
  '2': 'min',
  '3': 'hr',
};

function formatTarget(habit: Habit): string | null {
  if (!habit.targetEnabled || !habit.targetNumber || !habit.targetType) return null;
  const num = TIME_NUMBER_LABELS[habit.targetNumber] ?? habit.targetNumber;
  const type = TIME_TYPE_LABELS[habit.targetType] ?? '';
  return `${num} ${type}`;
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
  const [habits, setHabits] = useState<Habit[]>([]);

  // Reload habits every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHabits().then(setHabits);
    }, [])
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