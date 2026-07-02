import { create } from 'zustand';
import { Opportunity, Trend, IdeaValidation, TabType } from '../types';
import { mockOpportunities, mockTrends, mockValidationResult } from '../data/mockData';
import { calculateSourceDistribution } from '../data/mockData';

interface AppState {
  activeTab: TabType;
  opportunities: Opportunity[];
  trends: Trend[];
  validationResult: IdeaValidation | null;
  favorites: string[];
  searchQuery: string;
  selectedCategory: string;
  isRecommendedOnly: boolean;
  
  setActiveTab: (tab: TabType) => void;
  fetchOpportunities: () => void;
  fetchTrends: () => void;
  validateIdea: (idea: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setRecommendedOnly: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'opportunities',
  opportunities: [],
  trends: [],
  validationResult: null,
  favorites: [],
  searchQuery: '',
  selectedCategory: '',
  isRecommendedOnly: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  
  fetchOpportunities: () => {
    setTimeout(() => {
      const opportunitiesWithDistribution = mockOpportunities.map(opp => ({
        ...opp,
        sourceDistribution: calculateSourceDistribution(opp.dataSources)
      }));
      set({ opportunities: opportunitiesWithDistribution });
    }, 500);
  },
  
  fetchTrends: () => {
    setTimeout(() => {
      set({ trends: mockTrends });
    }, 500);
  },
  
  validateIdea: async (idea: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    set({ validationResult: { ...mockValidationResult, idea } });
  },
  
  toggleFavorite: (id) => set((state) => ({
    favorites: state.favorites.includes(id)
      ? state.favorites.filter(fid => fid !== id)
      : [...state.favorites, id]
  })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setRecommendedOnly: (value) => set({ isRecommendedOnly: value }),
}));
