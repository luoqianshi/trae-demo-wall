import { create } from 'zustand'
import type { Card, DrawingCard } from '@/../shared/types'

interface TarotState {
  selectedSpread: string | null;
  drawnCards: DrawingCard[];
  isDrawing: boolean;
  isShuffling: boolean;
  showCardDetail: Card | null;
  phase: 'select' | 'shuffle' | 'result';
  setSelectedSpread: (spread: string | null) => void;
  setDrawnCards: (cards: DrawingCard[]) => void;
  setIsDrawing: (v: boolean) => void;
  setIsShuffling: (v: boolean) => void;
  setShowCardDetail: (card: Card | null) => void;
  setPhase: (phase: 'select' | 'shuffle' | 'result') => void;
  reset: () => void;
}

const initialState = {
  selectedSpread: null,
  drawnCards: [],
  isDrawing: false,
  isShuffling: false,
  showCardDetail: null,
  phase: 'select' as const,
};

export const useTarotStore = create<TarotState>((set) => ({
  ...initialState,
  setSelectedSpread: (spread) => set({ selectedSpread: spread }),
  setDrawnCards: (cards) => set({ drawnCards: cards }),
  setIsDrawing: (v) => set({ isDrawing: v }),
  setIsShuffling: (v) => set({ isShuffling: v }),
  setShowCardDetail: (card) => set({ showCardDetail: card }),
  setPhase: (phase) => set({ phase }),
  reset: () => set(initialState),
}));