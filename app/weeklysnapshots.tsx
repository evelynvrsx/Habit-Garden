import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { fetchSnapshots, GardenSnapshot, SnapshotPlot } from '../lib/gardenSnapshots';
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

  const renderSnapshotGrid = (plots: SnapshotPlot[]) => {
    const paddedPlots = [...plots];
    const totalNeeded = Math.max(9, paddedPlots.length);
    while (paddedPlots.length < totalNeeded) {
      paddedPlots.push({
        habit_id: `empty-${paddedPlots.length}`,
        title: '',
        species: 'pink-flower',
        stage: null as any,
      });
    }

    const rows: SnapshotPlot[][] = [];
    for (let i = 0; i < paddedPlots.length; i += 3) {
      rows.push(paddedPlots.slice(i, i + 3));
    }

    return (
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
                key={plot.habit_id}
                habit={plot.title ? { id: plot.habit_id, title: plot.title } : null}
                species={plot.stage ? plot.species || 'pink-flower' : null}
                stage={plot.stage}
                style={colIndex > 0 ? styles.overlappingTile : undefined}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

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
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No snapshots yet. Make a habit and check back after your first week!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.weekBlock}>
            <Text style={styles.weekLabel}>Week of {item.week_start}</Text>
            <ImageBackground
              source={require('../assets/images/background.png')}
              style={styles.gardenContainer}
              imageStyle={styles.gardenImage}
              resizeMode="cover"
            >
              <View style={styles.gridContent}>
                {renderSnapshotGrid(item.plots)}
              </View>
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
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  gardenBed: {
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyText: { textAlign: 'center', marginTop: 60, color: '#9E9E9E', fontSize: 15 },
});
