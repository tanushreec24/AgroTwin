export type GrowthStage =
  | "Seedling"
  | "Vegetative"
  | "Budding"
  | "Flowering"
  | "Fruiting"
  | "Mature"
  | "Harvested";

export interface GridCell {
  id: string;
  cropType: string;
  cropCount: number;
  waterLevel: number;
  moistureLevel: number;
  growthStage: GrowthStage;
  x: number;
  y: number;
}
