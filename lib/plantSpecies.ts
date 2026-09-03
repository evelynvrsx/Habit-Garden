export const PLANT_SPECIES = ['pink-flower', 'strawberry-tree', 'purple-flower'] as const;
export type PlantSpecies = typeof PLANT_SPECIES[number];

export function assignRandomSpecies(): PlantSpecies {
  return PLANT_SPECIES[Math.floor(Math.random() * PLANT_SPECIES.length)];
}