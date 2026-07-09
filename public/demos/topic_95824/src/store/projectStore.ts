import { create } from 'zustand';
import { Project, AnalysisResult, Prototype, ChatMessage } from '../types';
import { mockProjects } from '../utils/mockData';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  selectedComponentId: string | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setRequirement: (projectId: string, requirement: string) => void;
  setAnalysis: (projectId: string, analysis: AnalysisResult) => void;
  setPrototype: (projectId: string, prototype: Prototype) => void;
  setChatMessages: (projectId: string, messages: ChatMessage[]) => void;
  setSelectedComponentId: (id: string | null) => void;
  loadProjects: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  selectedComponentId: null,

  loadProjects: () => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      try {
        set({ projects: JSON.parse(saved) });
      } catch {
        set({ projects: mockProjects });
      }
    } else {
      set({ projects: mockProjects });
      localStorage.setItem('projects', JSON.stringify(mockProjects));
    }
  },

  setProjects: (projects) => {
    set({ projects });
    localStorage.setItem('projects', JSON.stringify(projects));
  },

  addProject: (project) => {
    const projects = [...get().projects, project];
    set({ projects });
    localStorage.setItem('projects', JSON.stringify(projects));
  },

  updateProject: (id, updates) => {
    const projects = get().projects.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    set({ projects });
    if (get().currentProject?.id === id) {
      set({ currentProject: projects.find(p => p.id === id) || null });
    }
    localStorage.setItem('projects', JSON.stringify(projects));
  },

  deleteProject: (id) => {
    const projects = get().projects.filter(p => p.id !== id);
    set({ projects });
    if (get().currentProject?.id === id) {
      set({ currentProject: null });
    }
    localStorage.setItem('projects', JSON.stringify(projects));
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  setRequirement: (projectId, requirement) => {
    get().updateProject(projectId, { requirement });
  },

  setAnalysis: (projectId, analysis) => {
    get().updateProject(projectId, { analysis });
  },

  setPrototype: (projectId, prototype) => {
    get().updateProject(projectId, { prototype });
  },

  setChatMessages: (projectId, messages) => {
    get().updateProject(projectId, { chatMessages: messages });
  },

  setSelectedComponentId: (id) => {
    set({ selectedComponentId: id });
  },
}));
