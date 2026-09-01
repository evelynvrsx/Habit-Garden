import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, ImageBackground } from 'react-native';
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
      <View style={styles.loadingContainer}>
        <Text>Loading garden...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/background5.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
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
    paddingTop: 60,
    alignItems: 'center',
  },
});
