import { create } from 'zustand';
import type { Route, SortType } from '@shared/types';
import { mockRoutes } from '../data/mockData';
import { generateRoutes } from '../data/routeGenerator';
import { cityDatabase } from '../data/cityDatabase';
import { apiService } from '../services/apiService';

interface SearchState {
  from: string;
  to: string;
  date: string;
  results: Route[];
  sortBy: SortType;
  isLoading: boolean;
  loadingStage: string;
  isLiveResult: boolean;
  isRealAPI: boolean;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  setDate: (date: string) => void;
  setSortBy: (sort: SortType) => void;
  search: () => void;
  swapFromTo: () => void;
}

function sortRoutes(routes: Route[], sortBy: SortType): Route[] {
  const sorted = [...routes];
  if (sortBy === 'price') {
    sorted.sort((a, b) => a.totalPrice - b.totalPrice);
  } else if (sortBy === 'duration') {
    sorted.sort((a, b) => a.totalDuration - b.totalDuration);
  } else if (sortBy === 'layover') {
    sorted.sort((a, b) => {
      const layoverA = a.layovers.reduce((sum, l) => sum + l.duration, 0);
      const layoverB = b.layovers.reduce((sum, l) => sum + l.duration, 0);
      return layoverA - layoverB;
    });
  }
  return sorted;
}

const loadingStages = [
  '正在连接查询引擎...',
  '搜索航班数据...',
  '计算中转方案...',
  '生成推荐路线...',
];

export const useSearchStore = create<SearchState>((set, get) => ({
  from: '北京',
  to: '上海',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  results: mockRoutes,
  sortBy: 'price',
  isLoading: false,
  loadingStage: '',
  isLiveResult: false,
  isRealAPI: false,

  setFrom: (from) => set({ from }),
  setTo: (to) => set({ to }),
  setDate: (date) => set({ date }),
  setSortBy: (sort) => {
    set({ sortBy: sort });
    const results = sortRoutes(get().results, sort);
    set({ results });
  },

  search: async () => {
    set({ isLoading: true, loadingStage: loadingStages[0] });

    const { from, to, date, sortBy } = get();

    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      stageIndex++;
      if (stageIndex < loadingStages.length) {
        set({ loadingStage: loadingStages[stageIndex] });
      }
    }, 300);

    try {
      // 第一步：尝试调用真实API
      set({ loadingStage: '正在查询真实航班数据...' });
      const apiResult = await apiService.searchFlights(from, to, date);

      if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
        clearInterval(stageInterval);
        const routes = convertApiDataToRoutes(apiResult.data, from, to, date);
        const sortedResults = sortRoutes(routes, sortBy);
        set({
          results: sortedResults,
          isLoading: false,
          loadingStage: '',
          isLiveResult: true,
          isRealAPI: true,
        });
        return;
      }

      // 第二步：检查预设Mock数据
      const mockMatched = mockRoutes.filter(
        (r) => r.from === from && r.to === to
      );

      if (mockMatched.length > 0) {
        clearInterval(stageInterval);
        const sortedResults = sortRoutes(mockMatched, sortBy);
        set({
          results: sortedResults,
          isLoading: false,
          loadingStage: '',
          isLiveResult: false,
          isRealAPI: false,
        });
        return;
      }

      // 第三步：智能路线生成引擎
      if (cityDatabase[from] && cityDatabase[to]) {
        clearInterval(stageInterval);
        set({ loadingStage: '智能生成中转方案...' });
        const generated = generateRoutes(from, to, date);
        const sortedResults = sortRoutes(generated, sortBy);
        set({
          results: sortedResults,
          isLoading: false,
          loadingStage: '',
          isLiveResult: true,
          isRealAPI: false,
        });
        return;
      }

      // 无数据
      clearInterval(stageInterval);
      set({
        results: [],
        isLoading: false,
        loadingStage: '',
        isLiveResult: false,
        isRealAPI: false,
      });
    } catch (error) {
      clearInterval(stageInterval);
      console.error('Search error:', error);
      // 出错时回退到智能生成
      if (cityDatabase[from] && cityDatabase[to]) {
        const generated = generateRoutes(from, to, date);
        const sortedResults = sortRoutes(generated, sortBy);
        set({
          results: sortedResults,
          isLoading: false,
          loadingStage: '',
          isLiveResult: true,
          isRealAPI: false,
        });
      } else {
        set({
          results: [],
          isLoading: false,
          loadingStage: '',
        });
      }
    }
  },

  swapFromTo: () => {
    const { from, to } = get();
    set({ from: to, to: from });
  },
}));

function convertApiDataToRoutes(
  apiData: {
    flightNo: string;
    airline: string;
    departureAirport: string;
    arrivalAirport: string;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    duration: number;
  }[],
  from: string,
  to: string,
  date: string
): Route[] {
  return apiData.map((flight, index) => ({
    id: `api-route-${from}-${to}-${date}-${index}`,
    type: 'normal',
    typeLabel: '真实航班',
    from,
    to,
    date,
    totalPrice: flight.price,
    totalDuration: flight.duration,
    segments: [
      {
        id: `seg-${index}`,
        type: 'flight',
        from: flight.departureAirport,
        to: flight.arrivalAirport,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        price: flight.price,
        carrier: flight.airline,
        flightNo: flight.flightNo,
      },
    ],
    layovers: [],
    savings: Math.round(flight.price * 0.2),
    extraTime: 0,
    highlights: [`直达航班 ${flight.flightNo}`, `${flight.airline}`],
    rating: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
    reviewCount: Math.floor(Math.random() * 200) + 50,
    directPrice: Math.round(flight.price * 1.2),
    directDuration: flight.duration,
  }));
}