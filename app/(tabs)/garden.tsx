import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PlotTile } from '../../components/PlotTile';
import { useGardenPlots, GardenHabit } from '../../lib/useGardenPlots';
import { HabitLog } from '../../lib/streaks';

export default function GardenScreen() {
  const { session } = useAuth();
  const [habits, setHabits] = useState<GardenHabit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const [habitsResult, logsResult] = await Promise.all([
      supabase.from('habits').select('*'),
      supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .eq('completed', true),
    ]);

    if (!habitsResult.error) setHabits(habitsResult.data ?? []);
    if (!logsResult.error) setLogs((logsResult.data as HabitLog[]) ?? []);
    setLoading(false);
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const plots = useGardenPlots(habits, logs);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading garden...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={plots}
      numColumns={3}
      keyExtractor={(item, index) => item.habit?.id ?? `empty-${index}`}
      renderItem={({ item }) => (
        <PlotTile
          habit={item.habit}
          species={item.species}
          stage={item.stage}
          onPress={(habit) => router.push(`/edithabit/${habit.id}`)}
        />
      )}
      contentContainerStyle={{ padding: 12, alignItems: 'center' }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});