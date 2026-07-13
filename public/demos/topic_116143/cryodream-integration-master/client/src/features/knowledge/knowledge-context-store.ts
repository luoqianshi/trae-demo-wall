import { create } from 'zustand'
import type { KnowledgeBase } from './api/knowledge-api'

interface KnowledgeContextState {
  knowledgeBases: KnowledgeBase[]
  currentKnowledgeBase: KnowledgeBase | null
  setKnowledgeBases: (knowledgeBases: KnowledgeBase[]) => void
  upsertKnowledgeBase: (knowledgeBase: KnowledgeBase) => void
  setCurrentKnowledgeBase: (knowledgeBase: KnowledgeBase | null) => void
}

export const useKnowledgeContextStore = create<KnowledgeContextState>((set) => ({
  knowledgeBases: [],
  currentKnowledgeBase: null,
  setKnowledgeBases: (knowledgeBases) => set({ knowledgeBases }),
  upsertKnowledgeBase: (knowledgeBase) => set((state) => ({
    knowledgeBases: state.knowledgeBases.some((item) => item.id === knowledgeBase.id)
      ? state.knowledgeBases.map((item) => (item.id === knowledgeBase.id ? knowledgeBase : item))
      : [knowledgeBase, ...state.knowledgeBases],
  })),
  setCurrentKnowledgeBase: (knowledgeBase) => set({ currentKnowledgeBase: knowledgeBase }),
}))
