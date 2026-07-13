import type { WardrobeItemAttributes } from "@/types/wardrobe";

export type RecognitionInput = {
  imagePath: string;
  originalFilename?: string;
};

export type RecognitionResult = {
  provider: string;
  model: string;
  attributes: WardrobeItemAttributes;
  rawResult: Record<string, unknown>;
};

export type RecognitionProvider = {
  recognize(input: RecognitionInput): Promise<RecognitionResult>;
};
