import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PlotTile } from '../../components/PlotTile';
import { useGardenPlots, GardenHabit } from '../../lib/useGardenPlots';
import { HabitLog } from '../../lib/streaks';
import { captureSnapshotIfNeeded } from '../../lib/gardenSnapshots';

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
    if (session.user && !habitsResult.error && !logsResult.error) {
      captureSnapshotIfNeeded(session.user.id, habitsResult.data ?? [], (logsResult.data as HabitLog[]) ?? []);
    }

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
      <View style={styles.loadingContainer}>
        <Text>Loading garden...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
    <TouchableOpacity style={styles.snapshotButton} onPress={() => router.push('../weeklysnapshots')}>
      <Text style={styles.snapshotButtonText}>Weekly Snapshots</Text>
    </TouchableOpacity>
      <FlatList
        data={plots}
        numColumns={3}
        keyExtractor={(item, index) => item.habit?.id ?? `empty-${index}`}
        renderItem={({ item }) => (
          <PlotTile
            habit={item.habit}
            species={item.species}
            stage={item.stage}
            onPress={(habit) => router.push(`/habitdetails/${habit.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FBEF',
  },
  listContent: {
    padding: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  snapshotButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 40,
    marginTop: 60,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  snapshotButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700'
  },
});
