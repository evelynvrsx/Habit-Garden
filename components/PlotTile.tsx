import { Pressable, Image, Text, StyleSheet } from 'react-native';
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
};

export function PlotTile<T extends DisplayHabit>({ habit, species, stage, onPress }: PlotTileProps<T>) {
  const sprite = getPlantSprite(species, stage);
  const interactive = !!habit && !!onPress;

  return (
    <Pressable
      onPress={interactive ? () => onPress!(habit!) : undefined}
      style={styles.plot}
      disabled={!interactive}
    >
      <Image source={sprite} style={styles.sprite} resizeMode="contain" />
      {habit && (
        <Text style={styles.label} numberOfLines={1}>
          {habit.title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plot: { width: 115, height: 115, alignItems: 'center', justifyContent: 'center', margin: 2 },
  sprite: { width: 100, height: 100 },
  label: { fontSize: 11, marginTop: 2, textAlign: 'center' },
});