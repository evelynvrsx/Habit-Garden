import { Pressable, Image, Text, StyleSheet } from 'react-native';
import { getPlantSprite } from '../lib/plantSprites';
import { PlantSpecies } from '../lib/plantSpecies';
import { PlantStage } from '../lib/plantGrowth';
import { GardenHabit } from '../lib/useGardenPlots';

type PlotTileProps = {
  habit: GardenHabit | null;
  species: PlantSpecies | null;
  stage: PlantStage | null;
  onPress: (habit: GardenHabit) => void;
};

export function PlotTile({ habit, species, stage, onPress }: PlotTileProps) {
  const sprite = getPlantSprite(species, stage);

  return (
    <Pressable
      onPress={habit ? () => onPress(habit) : undefined}
      style={styles.plot}
      disabled={!habit}
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
  plot: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', margin: 4 },
  sprite: { width: 64, height: 64 },
  label: { fontSize: 11, marginTop: 2, textAlign: 'center' },
});