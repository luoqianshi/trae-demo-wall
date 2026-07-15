export interface User {
  id: string;
  email?: string;
  phone?: string;
  nickname?: string;
  examStage: number;
  createdAt: string;
}

export interface Article {
  id: string;
  articleId: string;
  title: string;
  summary: string;
  sourceName?: string;
  category?: string;
  difficultyLevel: number;
  difficultyName: string;
  wordCount: number;
  estimatedTime: string;
  createdAt: string;
}

export interface ArticleDetail {
  id: string;
  articleId: string;
  title: string;
  sourceName?: string;
  sourceUrl?: string;
  category?: string;
  difficultyLevel: number;
  difficultyName: string;
  wordCount: number;
  content: string;
  translatedContent: string;
  createdAt: string;
  hasQuiz: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionType?: string;
  order: number;
}

export interface QuizAnswerDetail {
  questionId: string;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  readingHistoryId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  answers: QuizAnswerDetail[];
  completedAt: string;
}

export interface UserVocabulary {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  example?: string;
  consecutiveKnown: number;
  lastReviewDate?: string;
  createdAt: string;
}

export interface ReadingHistory {
  id: string;
  articleVariant: {
    id: string;
    title: string;
    difficultyLevel: number;
    difficultyName: string;
    category?: string;
  };
  score?: number;
  completedAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Pagination<T> {
  articles: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export const EXAM_STAGE_NAMES: Record<number, string> = {
  1: '中考',
  2: '高考',
  3: '四级',
  4: '六级',
  5: '考研',
};

export const EXAM_STAGE_OPTIONS = [
  { value: 1, label: '中考', desc: '初中毕业考试水平' },
  { value: 2, label: '高考', desc: '高中毕业考试水平' },
  { value: 3, label: '四级', desc: '大学英语四级水平' },
  { value: 4, label: '六级', desc: '大学英语六级水平' },
  { value: 5, label: '考研', desc: '研究生入学考试水平' },
];
