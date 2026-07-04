/**
 * 统计图 Store
 */
import { create } from 'zustand';
import type { RegisteredStat, StatsDataResult } from '../types';

interface StatsEntry extends RegisteredStat {
  chartData?: Array<{ name?: string; value?: number; date?: string }>;
}

interface StatsState {
  stats: StatsEntry[];
  loading: boolean;
  error: string | null;
  setStats: (stats: StatsEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  add: (data: any) => Promise<string | null>;
  update: (data: any) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  fetchChartData: (id: string) => Promise<StatsDataResult>;
  refresh: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: [],
  loading: false,
  error: null,

  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  add: async (data) => {
    try {
      const id = await window.api.addStats(data);
      if (id) {
        await get().refresh();
        return id;
      }
      return null;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  update: async (data) => {
    try {
      const result = await window.api.updateStats(data);
      if (result.ok) {
        await get().refresh();
        return true;
      }
      return false;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  remove: async (id) => {
    try {
      const result = await window.api.deleteStats(id);
      if (result.ok) {
        await get().refresh();
        return true;
      }
      return false;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  fetchChartData: async (id) => {
    try {
      const result = await window.api.getStatsData(id);
      if (result.ok && result.data) {
        set((state) => ({
          stats: state.stats.map((s) =>
            s.id === id ? { ...s, chartData: result.data } : s
          )
        }));
      }
      return result;
    } catch (e: any) {
      set({ error: e.message });
      return { ok: false, error: e.message };
    }
  },

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await window.api.listStats();
      set({ stats, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  }
}));
