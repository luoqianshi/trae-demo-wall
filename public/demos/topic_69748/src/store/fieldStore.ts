/**
 * 字段配置 Store
 */
import { create } from 'zustand';
import type { FieldConfig, CreateFieldInput, UpdateFieldInput } from '../types';

interface FieldState {
  fields: FieldConfig[];
  loading: boolean;
  error: string | null;
  setFields: (fields: FieldConfig[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  add: (data: CreateFieldInput) => Promise<boolean>;
  update: (data: UpdateFieldInput) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  loading: false,
  error: null,

  setFields: (fields) => set({ fields }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  add: async (data) => {
    try {
      const result = await window.api.addField(data);
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

  update: async (data) => {
    try {
      const result = await window.api.updateField(data);
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

  remove: async (key) => {
    try {
      const result = await window.api.deleteField(key);
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
      const fields = await window.api.listFieldConfig();
      set({ fields, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  }
}));
