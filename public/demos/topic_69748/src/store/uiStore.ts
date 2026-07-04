/**
 * UI 设置 Store
 */
import { create } from 'zustand';
import type { UiSettings, SaveUiSettingsInput } from '../types';

interface UiState {
  settings: UiSettings | null;
  loading: boolean;
  error: string | null;
  setSettings: (settings: UiSettings | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  save: (data: SaveUiSettingsInput) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useUiStore = create<UiState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  save: async (data) => {
    try {
      const result = await window.api.saveUiSettings(data);
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

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await window.api.getUiSettings();
      set({ settings, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  }
}));
