/**
 * 模板 Store
 */
import { create } from 'zustand';
import type { ProgressTemplate, CreateTemplateInput, UpdateTemplateInput } from '../types';

interface TemplateState {
  templates: ProgressTemplate[];
  loading: boolean;
  error: string | null;
  setTemplates: (templates: ProgressTemplate[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  add: (data: CreateTemplateInput) => Promise<string | null>;
  update: (data: UpdateTemplateInput) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  setTemplates: (templates) => set({ templates }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  add: async (data) => {
    try {
      const id = await window.api.addTemplate(data);
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
      const result = await window.api.updateTemplate(data);
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
      const result = await window.api.deleteTemplate(id);
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
      const templates = await window.api.listTemplates();
      set({ templates, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  }
}));
