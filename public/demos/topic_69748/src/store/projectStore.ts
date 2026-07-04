/**
 * 项目 Store
 */
import { create } from 'zustand';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  add: (data: CreateProjectInput) => Promise<string | null>;
  update: (data: UpdateProjectInput) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  add: async (data) => {
    try {
      const id = await window.api.addProject(data);
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
      const result = await window.api.updateProject(data);
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
      const result = await window.api.deleteProject(id);
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
      const projects = await window.api.listProjects();
      set({ projects, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  }
}));
