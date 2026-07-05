import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Question, ReviewRecord, Difficulty } from "@/types";
import { MOCK_QUESTIONS, ERROR_REASONS } from "@/data/mockQuestions";

interface QuestionStore {
  questions: Question[];
  reviewRecords: ReviewRecord[];
  initialized: boolean;

  addQuestions: (qs: Question[]) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  removeMany: (ids: string[]) => void;
  reviewQuestion: (id: string, correct: boolean, userAnswer?: string) => void;
  clearAll: () => void;
  ensureSeeded: () => void;
}

function genId(prefix = "q"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function randomMastery(): number {
  // 初始掌握度 20-65 之间，留有提升空间
  return Math.floor(20 + Math.random() * 45);
}

function seedQuestions(): Question[] {
  const now = Date.now();
  // 生成 14 条种子错题，分布在最近 30 天
  return MOCK_QUESTIONS.slice(0, 14).map((q, idx) => {
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const createdAt = new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();
    const reviewCount = Math.floor(Math.random() * 3);
    const correctCount = Math.floor(Math.random() * (reviewCount + 1));
    const lastReviewAt =
      reviewCount > 0
        ? new Date(now - Math.floor(Math.random() * 7) * 24 * 3600 * 1000).toISOString()
        : undefined;
    return {
      ...q,
      id: genId(),
      mastery: randomMastery(),
      createdAt,
      lastReviewAt,
      reviewCount,
      correctCount,
      source: "import",
      tags: q.tags ?? [],
    };
  });
}

export const useQuestionStore = create<QuestionStore>()(
  persist(
    (set, get) => ({
      questions: [],
      reviewRecords: [],
      initialized: false,

      addQuestions: (qs) =>
        set((s) => ({ questions: [...qs, ...s.questions] })),

      updateQuestion: (id, patch) =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === id ? { ...q, ...patch } : q,
          ),
        })),

      removeQuestion: (id) =>
        set((s) => ({
          questions: s.questions.filter((q) => q.id !== id),
        })),

      removeMany: (ids) =>
        set((s) => ({
          questions: s.questions.filter((q) => !ids.includes(q.id)),
        })),

      reviewQuestion: (id, correct, userAnswer) => {
        const q = get().questions.find((x) => x.id === id);
        if (!q) return;
        const reviewCount = q.reviewCount + 1;
        const correctCount = q.correctCount + (correct ? 1 : 0);
        // 掌握度：答对+15，答错-10，范围 [0, 100]
        let mastery = q.mastery + (correct ? 15 : -10);
        mastery = Math.max(0, Math.min(100, mastery));
        const record: ReviewRecord = {
          id: genId("r"),
          questionId: id,
          reviewedAt: new Date().toISOString(),
          correct,
          userAnswer,
        };
        set((s) => ({
          questions: s.questions.map((x) =>
            x.id === id
              ? {
                  ...x,
                  reviewCount,
                  correctCount,
                  mastery,
                  lastReviewAt: record.reviewedAt,
                }
              : x,
          ),
          reviewRecords: [record, ...s.reviewRecords],
        }));
      },

      clearAll: () => set({ questions: [], reviewRecords: [] }),

      ensureSeeded: () => {
        if (!get().initialized) {
          set({ questions: seedQuestions(), initialized: true });
        }
      },
    }),
    {
      name: "ai-homework:store",
      version: 1,
    },
  ),
);

// 工具函数：创建新题目
export function createQuestion(
  data: Omit<Question, "id" | "createdAt" | "reviewCount" | "correctCount" | "mastery" | "source">,
): Question {
  return {
    ...data,
    id: genId(),
    mastery: 20,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    correctCount: 0,
    source: "upload",
    tags: data.tags ?? [],
  };
}

export function randomErrorReason(): string {
  return ERROR_REASONS[Math.floor(Math.random() * ERROR_REASONS.length)];
}

export function randomDifficulty(): Difficulty {
  return (Math.floor(Math.random() * 5) + 1) as Difficulty;
}
