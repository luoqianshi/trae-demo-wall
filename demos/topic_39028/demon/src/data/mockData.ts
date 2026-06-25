import type { TravelDetail } from './types';
import { travels } from './travels';
import { baliDetail } from './bali';
import { tokyoDetail } from './tokyo';
import { shanghaiDetail } from './shanghai';

export const travelDetails: Record<string, TravelDetail> = {
  bali: baliDetail,
  tokyo: tokyoDetail,
  shanghai: shanghaiDetail,
};

export { travels };
export type { Travel, TravelDetail, Activity, TimelineItem, Hotel, Flight, Photo, Expense, MemoryCard, JournalEntry, TravelCompletion } from './types';
