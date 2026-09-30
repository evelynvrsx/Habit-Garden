import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PlotTile } from '../../components/PlotTile';
import { useGardenPlots } from '../../lib/useGardenPlots';
import { Habit } from '../../lib/types';
import { HabitLog } from '../../lib/streaks';
import { captureSnapshotIfNeeded } from '../../lib/gardenSnapshots';

export default function GardenScreen() {
  const { session } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
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

  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < plots.length; i += 3) {
      result.push(plots.slice(i, i + 3));
    }
    return result;
  }, [plots]);

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gardenBed}>
          {rows.map((rowPlots, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              style={[
                styles.gridRow,
                rowIndex > 0 && styles.overlappingRow,
                { zIndex: rowIndex + 1 },
              ]}
            >
              {rowPlots.map((plot, colIndex) => (
                <PlotTile
                  key={plot.habit?.id ?? `empty-${rowIndex}-${colIndex}`}
                  habit={plot.habit}
                  species={plot.species}
                  stage={plot.stage}
                  style={colIndex > 0 ? styles.overlappingTile : undefined}
                  onPress={plot.habit ? (habit) => router.push(`/habitdetails/${habit.id}`) : undefined}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 50,
    alignItems: 'center',
  },
  gardenBed: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlappingRow: {
    marginTop: -16,
  },
  overlappingTile: {
    marginLeft: -16,
  },
  snapshotButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 40,
    marginTop: 60,
    marginBottom: 10,
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
    fontWeight: '700',
  },
});
