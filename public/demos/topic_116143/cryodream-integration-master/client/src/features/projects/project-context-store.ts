import { create } from 'zustand'
import type { FlowProject } from './project-api'

interface ProjectContextState {
  projects: FlowProject[]
  currentProject: FlowProject | null
  setProjects: (projects: FlowProject[]) => void
  upsertProject: (project: FlowProject) => void
  setCurrentProject: (project: FlowProject | null) => void
}

export const useProjectContextStore = create<ProjectContextState>((set) => ({
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  upsertProject: (project) => set((state) => ({
    projects: state.projects.some((item) => item.id === project.id)
      ? state.projects.map((item) => (item.id === project.id ? project : item))
      : [project, ...state.projects],
  })),
  setCurrentProject: (project) => set({ currentProject: project }),
}))
