import { create } from 'zustand';
import { HistoricalEvent, EraConfig } from '@/data/historicalEvents';
import { events, eras } from '@/data/historicalEvents';

interface TimelineStore {
  events: HistoricalEvent[];
  eras: EraConfig[];
  selectedEra: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  selectedEvent: HistoricalEvent | null;
  filteredEvents: HistoricalEvent[];
  searchYear: number | null;
  
  setSelectedEra: (eraId: string | null) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchYear: (year: number | null) => void;
  setSelectedEvent: (event: HistoricalEvent | null) => void;
  clearFilters: () => void;
  updateFilteredEvents: () => void;
}

const useTimelineStore = create<TimelineStore>((set, get) => {
  const initialState = {
    events,
    eras,
    selectedEra: null,
    selectedCategory: null,
    searchQuery: '',
    selectedEvent: null,
    searchYear: null,
    filteredEvents: events,
  };
  
  return {
    ...initialState,
  
  setSelectedEra: (eraId) => {
    set({ selectedEra: eraId });
    get().updateFilteredEvents();
  },
  
  setSelectedCategory: (categoryId) => {
    set({ selectedCategory: categoryId });
    get().updateFilteredEvents();
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().updateFilteredEvents();
  },
  
  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },
  
  setSearchYear: (year) => {
    set({ searchYear: year });
    get().updateFilteredEvents();
  },
  
  clearFilters: () => {
    set({ 
      selectedEra: null, 
      selectedCategory: null, 
      searchQuery: '',
      searchYear: null,
      filteredEvents: events 
    });
  },
  
  updateFilteredEvents: () => {
    const { events, selectedEra, selectedCategory, searchQuery, searchYear, eras } = get();
    
    let filtered = [...events];
    
    if (selectedEra) {
        const era = eras.find(e => e.id === selectedEra);
        if (era) {
          filtered = filtered.filter(e => e.startYear <= era.endYear && (e.endYear === '至今' || e.endYear >= era.startYear));
        }
      }
      
      if (selectedCategory) {
        filtered = filtered.filter(e => e.category === selectedCategory);
      }
      
      if (searchYear !== null) {
        filtered = filtered.filter(e => e.startYear <= searchYear && (e.endYear === '至今' || e.endYear >= searchYear));
      }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.region.toLowerCase().includes(query) ||
        e.keyFigures.some(kf => kf.toLowerCase().includes(query)) ||
        e.impact.toLowerCase().includes(query) ||
        e.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        e.background.toLowerCase().includes(query) ||
        e.cause.toLowerCase().includes(query) ||
        e.significance.toLowerCase().includes(query)
      );
    }
    
    set({ filteredEvents: filtered });
  },
}));

export default useTimelineStore;