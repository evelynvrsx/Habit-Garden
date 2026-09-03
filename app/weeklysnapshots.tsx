import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { fetchSnapshots, GardenSnapshot } from '../lib/gardenSnapshots';
import { PlotTile } from '../components/PlotTile';

export default function WeeklySnapshotsScreen() {
  const { session } = useAuth();
  const [snapshots, setSnapshots] = useState<GardenSnapshot[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        fetchSnapshots(session.user.id).then(setSnapshots);
      }
    }, [session?.user])
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Weekly Snapshots',
          headerShown: true,
          headerTitleAlign: 'center',
          headerTintColor: '#2E7D32',
        }}
      />
      <FlatList
        data={snapshots}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No snapshots yet. Make a habit and check back after your first week!</Text>}
        renderItem={({ item }) => (
          <View style={styles.weekBlock}>
            <Text style={styles.weekLabel}>Week of {item.week_start}</Text>
            <ImageBackground
              source={require('../assets/images/background.png')}
              style={styles.gardenContainer}
              imageStyle={styles.gardenImage}
              resizeMode="cover"
            >
              <FlatList
                data={item.plots}
                numColumns={3}
                scrollEnabled={false}
                keyExtractor={(p) => p.habit_id}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item: plot }) => (
                  <PlotTile
                    habit={{ id: plot.habit_id, title: plot.title }}
                    species={plot.species || 'pink-flower'}
                    stage={plot.stage}
                    // no onPress — read-only
                  />
                )}
              />
            </ImageBackground>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBEF' },
  listContent: { padding: 16, paddingTop: 20 },
  weekBlock: { marginBottom: 32 },
  weekLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#2E7D32', marginLeft: 4 },
  gardenContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#A5D6A7',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gardenImage: {
    opacity: 0.9,
  },
  gridContent: {
    padding: 8,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#9E9E9E', fontSize: 15 },
});
