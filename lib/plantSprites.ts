import { PlantSpecies } from './plantSpecies';
import { PlantStage } from './plantGrowth';

const SPRITES: Record<PlantSpecies, Record<PlantStage, any>> = {
  'pink-flower': {
    seed: require('../assets/images/plants/pink-flower/seed.png'),
    sprout: require('../assets/images/plants/pink-flower/sprout.png'),
    flower: require('../assets/images/plants/pink-flower/budding.png'),
    tree: require('../assets/images/plants/pink-flower/bloom.png'),
    bonus: require('../assets/images/plants/pink-flower/bonus.png'),
  },
  'strawberry-tree': {
    seed: require('../assets/images/plants/strawberry-tree/seed.png'),
    sprout: require('../assets/images/plants/strawberry-tree/sprout.png'),
    flower: require('../assets/images/plants/strawberry-tree/budding.png'),
    tree: require('../assets/images/plants/strawberry-tree/bloom.png'),
    bonus: require('../assets/images/plants/strawberry-tree/bonus.png'),
  },
  'purple-flower': {
    seed: require('../assets/images/plants/purple-flower/seed.png'),
    sprout: require('../assets/images/plants/purple-flower/sprout.png'),
    flower: require('../assets/images/plants/purple-flower/budding.png'),
    tree: require('../assets/images/plants/purple-flower/bloom.png'),
    bonus: require('../assets/images/plants/purple-flower/bonus.png'),
  },
};

const EMPTY_SOIL = require('../assets/images/plants/empty_soil.png');

export function getPlantSprite(species: PlantSpecies | null, stage: PlantStage | null) {
  if (!species || !stage) return EMPTY_SOIL;
  return SPRITES[species][stage];
}