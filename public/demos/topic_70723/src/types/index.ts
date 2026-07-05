// AI 智能作业整理助手 - 类型定义

export type Subject =
  | "chinese"
  | "math"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "politics";

export type QuestionType =
  | "single" // 单选
  | "multiple" // 多选
  | "fill" // 填空
  | "judge" // 判断
  | "short" // 简答
  | "essay" // 作文
  | "calc"; // 计算

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Role = "student" | "teacher";

export interface SubjectMeta {
  code: Subject;
  name: string;
  shortName: string;
  color: string; // 主色
  bg: string; // 浅背景
  text: string; // 文字色
}

export interface Question {
  id: string;
  subject: Subject;
  knowledgePoint: string;
  chapter: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  content: string;
  options?: string[];
  answer: string;
  analysis?: string;
  errorReason?: string;
  tags: string[];
  mastery: number; // 0-100
  imageUrl?: string;
  createdAt: string;
  lastReviewAt?: string;
  reviewCount: number;
  correctCount: number;
  source: "upload" | "manual" | "import";
}

export interface ReviewRecord {
  id: string;
  questionId: string;
  reviewedAt: string;
  correct: boolean;
  userAnswer?: string;
}

export interface QuestionTypeMeta {
  code: QuestionType;
  name: string;
  short: string;
}

export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  single: { code: "single", name: "单选题", short: "单选" },
  multiple: { code: "multiple", name: "多选题", short: "多选" },
  fill: { code: "fill", name: "填空题", short: "填空" },
  judge: { code: "judge", name: "判断题", short: "判断" },
  short: { code: "short", name: "简答题", short: "简答" },
  essay: { code: "essay", name: "作文题", short: "作文" },
  calc: { code: "calc", name: "计算题", short: "计算" },
};

export const DIFFICULTY_META: Record<Difficulty, { name: string; color: string }> = {
  1: { name: "简单", color: "text-mint-600 bg-mint-100" },
  2: { name: "较易", color: "text-mint-600 bg-mint-100" },
  3: { name: "中等", color: "text-amber-500 bg-amber-100" },
  4: { name: "较难", color: "text-brand-600 bg-brand-50" },
  5: { name: "困难", color: "text-rose-600 bg-rose-100" },
};
