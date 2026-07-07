import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ErrorQuestion, FilterOptions } from "@/types/question";
import { INITIAL_QUESTIONS } from "@/data/mockData";

interface QuestionStore {
  questions: ErrorQuestion[];
  selectedIds: string[];
  addQuestion: (q: ErrorQuestion) => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<ErrorQuestion>) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  selectIds: (ids: string[]) => void;
  toggleSelectIds: (ids: string[], select: boolean) => void;
  clearSelect: () => void;
  filter: (options: FilterOptions) => ErrorQuestion[];
  allKnowledgePoints: () => string[];
}

export const useQuestionStore = create<QuestionStore>()(
  persist(
    (set, get) => ({
      questions: INITIAL_QUESTIONS,
      selectedIds: [],

      addQuestion: (q) => set((s) => ({ questions: [q, ...s.questions] })),

      removeQuestion: (id) =>
        set((s) => ({
          questions: s.questions.filter((q) => q.id !== id),
          selectedIds: s.selectedIds.filter((sid) => sid !== id),
        })),

      updateQuestion: (id, patch) =>
        set((s) => ({
          questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),

      toggleSelect: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((sid) => sid !== id)
            : [...s.selectedIds, id],
        })),

      selectAll: () => set({ selectedIds: get().questions.map((q) => q.id) }),
      selectIds: (ids) => set({ selectedIds: ids }),
      toggleSelectIds: (ids, select) =>
        set((s) => ({
          selectedIds: select
            ? [...new Set([...s.selectedIds, ...ids])]
            : s.selectedIds.filter((id) => !ids.includes(id)),
        })),
      clearSelect: () => set({ selectedIds: [] }),

      filter: (options) => {
        const { subject, knowledgePoint, difficulty, keyword } = options;
        return get().questions.filter((q) => {
          if (subject !== "全部" && q.subject !== subject) return false;
          if (knowledgePoint !== "全部" && !q.knowledgePoints.includes(knowledgePoint)) return false;
          if (difficulty !== "全部" && q.difficulty !== difficulty) return false;
          if (keyword.trim() && !q.questionText.includes(keyword.trim())) return false;
          return true;
        });
      },

      allKnowledgePoints: () => {
        const set = new Set<string>();
        get().questions.forEach((q) => q.knowledgePoints.forEach((kp) => set.add(kp)));
        return Array.from(set);
      },
    }),
    {
      name: "ai-error-question-store",
      partialize: (state) => ({ questions: state.questions }),
    }
  )
);
