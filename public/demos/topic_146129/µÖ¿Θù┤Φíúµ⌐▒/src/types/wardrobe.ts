export const wardrobeCategories = [
  "top",
  "pants",
  "shoes",
  "outerwear",
  "bag",
  "hat",
  "scarf",
  "belt"
] as const;

export const seasons = ["spring", "summer", "autumn", "winter", "multi"] as const;
export const scenarios = ["commute", "casual", "date", "formal", "sport", "outdoor"] as const;
export const formalities = ["casual", "semi_formal", "formal"] as const;
export const styles = ["minimal", "business", "street", "outdoor", "retro", "sport"] as const;
export const warmthLevels = ["light", "medium", "heavy"] as const;
export const wardrobeSourceTypes = ["photo", "product_detail_text", "product_url"] as const;

export type WardrobeCategory = (typeof wardrobeCategories)[number];
export type Season = (typeof seasons)[number];
export type Scenario = (typeof scenarios)[number];
export type Formality = (typeof formalities)[number];
export type Style = (typeof styles)[number];
export type WarmthLevel = (typeof warmthLevels)[number];
export type WardrobeSourceType = (typeof wardrobeSourceTypes)[number];
export type FieldConfidenceLevel = "high" | "medium" | "low";
export type WardrobeFieldConfidence = Partial<Record<keyof WardrobeItemAttributes | "productDetailText" | "productUrl", FieldConfidenceLevel>>;

export type WardrobeItemStatus = "draft" | "confirmed";
export type RecognitionStatus = "pending" | "success" | "failed";
export type BehaviorEventType = "like" | "wear_today" | "change_outfit" | "auto_replace_item" | "manual_replace_item";

export type WardrobeItemAttributes = {
  category: WardrobeCategory;
  primaryColor: string;
  secondaryColor?: string;
  material: string;
  seasons: Season[];
  scenarios: Scenario[];
  formality: Formality;
  styles: Style[];
  warmth: WarmthLevel;
};

export type WardrobeItem = Partial<WardrobeItemAttributes> & {
  id: string;
  imagePath: string;
  originalFilename?: string;
  sourceType?: WardrobeSourceType;
  productUrl?: string;
  productDetailText?: string;
  recognitionSource?: string;
  fieldConfidence?: WardrobeFieldConfidence;
  status: WardrobeItemStatus;
  recognitionStatus: RecognitionStatus;
  createdAt: string;
  updatedAt: string;
};

export type OutfitRecommendation = {
  id: string;
  title: string;
  scenario?: Scenario;
  reason: string;
  weatherSnapshot?: Record<string, unknown>;
  inputSnapshot?: Record<string, unknown>;
  dailyRecommendationId?: string;
  isLiked: boolean;
  itemIds: string[];
  createdAt: string;
};

export type DailyRecommendation = {
  id: string;
  recommendationDate: string;
  recommendationId?: string;
  createdAt: string;
};

export type BehaviorEvent = {
  id: string;
  eventType: BehaviorEventType;
  recommendationId: string;
  itemIds: string[];
  weatherSnapshot?: Record<string, unknown>;
  inputSnapshot?: Record<string, unknown>;
  aiReason?: string;
  isLiked: boolean;
  isWorn: boolean;
  isSkipped: boolean;
  eventDate: string;
  createdAt: string;
};

export type WardrobeItemUsageStat = {
  itemId: string;
  referencedOutfitCount: number;
  likedOutfitCount: number;
  wornCount: number;
  lastReferencedAt?: string;
};

export type RecognitionRun = {
  id: string;
  itemId: string;
  provider: string;
  model?: string;
  rawResult?: Record<string, unknown>;
  confirmedFields?: WardrobeItemAttributes;
  recognitionStatus: RecognitionStatus;
  errorMessage?: string;
  createdAt: string;
};
