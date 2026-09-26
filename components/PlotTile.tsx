import React from 'react';
import { Pressable, Image, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { getPlantSprite } from '../lib/plantSprites';
import { PlantSpecies } from '../lib/plantSpecies';
import { PlantStage } from '../lib/plantGrowth';

// Minimal shape PlotTile actually needs to render
// and stored snapshot plots satisfy this.
export type DisplayHabit = {
  id: string;
  title: string;
};

type PlotTileProps<T extends DisplayHabit> = {
  habit: T | null;
  species: PlantSpecies | null;
  stage: PlantStage | null;
  onPress?: (habit: T) => void; // snapshots of tiles
  style?: ViewStyle;
};

export function PlotTile<T extends DisplayHabit>({
  habit,
  species,
  stage,
  onPress,
  style,
}: PlotTileProps<T>) {
  const sprite = getPlantSprite(species, stage);
  const interactive = !!habit && !!onPress;

  return (
    <Pressable
      onPress={interactive ? () => onPress!(habit!) : undefined}
      style={[styles.plot, style]}
      disabled={!interactive}
    >
      <Image source={sprite} style={styles.sprite} resizeMode="contain" />
      {habit && habit.title ? (
        <View style={styles.labelBadge}>
          <Text style={styles.label} numberOfLines={1}>
            {habit.title}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plot: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 110,
    height: 110,
  },
  labelBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    maxWidth: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D4A34',
    textAlign: 'center',
  },
});
