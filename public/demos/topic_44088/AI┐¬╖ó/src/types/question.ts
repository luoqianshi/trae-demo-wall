// 错题相关类型定义

export type Subject = "数学" | "语文" | "英语" | "物理" | "化学" | "生物" | "历史" | "地理";

export interface ErrorQuestion {
  id: string;
  subject: Subject;
  questionText: string;
  /** 学生作答或简要错因 */
  note?: string;
  knowledgePoints: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  imageUrl: string;
  createdAt: string;
  source?: string;
  /** AI 识别置信度 0-1 */
  confidence?: number;
}

export interface FilterOptions {
  subject: Subject | "全部";
  knowledgePoint: string;
  difficulty: number | "全部";
  keyword: string;
}

// 学科配色映射
export const SUBJECT_COLORS: Record<Subject, { bg: string; text: string; dot: string; soft: string }> = {
  数学: { bg: "bg-ink-700", text: "text-paper-100", dot: "bg-ink-700", soft: "bg-ink-100 text-ink-700" },
  语文: { bg: "bg-coral-deep", text: "text-paper-100", dot: "bg-coral-deep", soft: "bg-coral-soft/40 text-coral-deep" },
  英语: { bg: "bg-mint-deep", text: "text-paper-100", dot: "bg-mint-deep", soft: "bg-mint-soft/40 text-mint-deep" },
  物理: { bg: "bg-highlight-deep", text: "text-ink-800", dot: "bg-highlight-deep", soft: "bg-highlight-soft/50 text-ink-700" },
  化学: { bg: "bg-purple-600", text: "text-paper-100", dot: "bg-purple-600", soft: "bg-purple-100 text-purple-700" },
  生物: { bg: "bg-emerald-600", text: "text-paper-100", dot: "bg-emerald-600", soft: "bg-emerald-100 text-emerald-700" },
  历史: { bg: "bg-amber-700", text: "text-paper-100", dot: "bg-amber-700", soft: "bg-amber-100 text-amber-700" },
  地理: { bg: "bg-sky-700", text: "text-paper-100", dot: "bg-sky-700", soft: "bg-sky-100 text-sky-700" },
};

export const SUBJECTS: Subject[] = ["数学", "语文", "英语", "物理", "化学", "生物", "历史", "地理"];

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "简单",
  2: "较易",
  3: "中等",
  4: "较难",
  5: "困难",
};
