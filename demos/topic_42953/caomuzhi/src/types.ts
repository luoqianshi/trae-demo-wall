export interface HistoryItem {
  id: string;
  plantId: number;
  name: string;
  image: string;
  confidence: number;
  identifiedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  nickname?: string;
  avatar?: string;
  password: string;
  bio: string;
  location: string;
  createdAt: string;
}

export interface AncientData {
  benCaoGangMu?: {
    original: string;
    translation: string;
    usage: string;
    volume: string;
  };
  shenNongBenCao?: {
    original: string;
    grade: string;
    property: string;
    efficacy: string;
  };
  zhiWuMingShi?: {
    original: string;
    description: string;
  };
  source?: string;
  description?: string;
  properties?: string[];
  effects?: string;
  usage?: string;
  notes?: string;
}

export interface PlantOverview {
  description: string;
  habitat: string;
  distribution: string;
  features: string;
  floweringPeriod: string;
  fruitingPeriod?: string;
  morphology?: string;
  growthEnvironment?: string;
}

export interface PlantValue {
  medicinal: string;
  edible: string;
  ecological: string;
  ornamental: string;
}

export interface PlantCulture {
  meaning: string;
  poem: string;
  story: string;
}

export interface PlantCultivation {
  lightRequirement: string;
  watering: string;
  soilRequirement: string;
  fertilization: string;
  propagation: string;
  pestControl: string;
}

export interface PlantUses {
  medicinal?: string;
  edible?: string;
  ornamental?: string;
  other?: string;
}

export interface Plant {
  id: number;
  name: string;
  latinName: string;
  aliases: string[];
  family: string;
  genus: string;
  category: string;
  tags: string[];
  image: string;
  images: string[];
  gallery?: string[];
  overview: PlantOverview;
  value: PlantValue;
  culture: PlantCulture;
  cultivation?: PlantCultivation;
  uses?: PlantUses;
  ancient?: AncientData;
}

export interface RecognitionResult {
  plantId: number;
  name: string;
  latinName: string;
  confidence: number;
  image: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  minPlants: number;
  maxPlants: number;
  color: string;
  description: string;
}

export interface CollectionItem {
  plantId: number;
  name: string;
  image: string;
  category: string;
  collectedAt: string;
}

export type ViewMode = 'grid' | 'list' | 'timeline';

export type SortOption = 'recent' | 'oldest' | 'name' | 'family';

export type TabType = 'overview' | 'value' | 'culture' | 'ancient';
