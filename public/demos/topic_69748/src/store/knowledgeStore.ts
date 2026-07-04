/**
 * 知识库 Store
 */
import { create } from 'zustand';
import type { KnowledgeCategory, KnowledgeItem, CreateCategoryInput, UpdateCategoryInput, CreateKnowledgeInput, UpdateKnowledgeInput } from '../types';

interface KnowledgeState {
  categories: KnowledgeCategory[];
  items: KnowledgeItem[];
  loading: boolean;
  error: string | null;
  setCategories: (categories: KnowledgeCategory[]) => void;
  setItems: (items: KnowledgeItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 分类操作
  addCategory: (data: CreateCategoryInput) => Promise<string | null>;
  updateCategory: (data: UpdateCategoryInput) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // 知识条目操作
  addItem: (data: CreateKnowledgeInput) => Promise<string | null>;
  updateItem: (data: UpdateKnowledgeInput) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  searchItems: (keyword: string, tag: string) => Promise<void>;

  // 刷新
  refreshCategories: () => Promise<void>;
  refreshItems: (categoryId?: string | null) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  categories: [],
  items: [],
  loading: false,
  error: null,

  setCategories: (categories) => set({ categories }),
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // 分类操作
  addCategory: async (data) => {
    try {
      const id = await window.api.addCategory(data);
      if (id) {
        await get().refreshCategories();
        return id;
      }
      return null;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  updateCategory: async (data) => {
    try {
      const result = await window.api.updateCategory(data);
      if (result.ok) {
        await get().refreshCategories();
        return true;
      }
      return false;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  deleteCategory: async (id) => {
    try {
      const result = await window.api.deleteCategory(id);
      if (result.ok) {
        await get().refreshCategories();
        return true;
      }
      return false;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  // 知识条目操作
  addItem: async (data) => {
    try {
      const id = await window.api.addKnowledge(data);
      if (id) {
        await get().refreshItems();
        return id;
      }
      return null;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  updateItem: async (data) => {
    try {
      const result = await window.api.updateKnowledge(data);
      if (result.ok) {
        await get().refreshItems();
        return true;
      }
      return false;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  deleteItem: async (id) => {
    try {
      const result = await window.api.deleteKnowledge(id);
      if (result.ok) {
        await get().refreshItems();
        return true;
      }
      return false;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  searchItems: async (keyword, tag) => {
    set({ loading: true, error: null });
    try {
      const items = await window.api.searchKnowledge(keyword, tag);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  // 刷新
  refreshCategories: async () => {
    try {
      const categories = await window.api.listCategories();
      set({ categories });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  refreshItems: async (categoryId = null) => {
    set({ loading: true, error: null });
    try {
      const items = await window.api.listKnowledge(categoryId);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  }
}));
