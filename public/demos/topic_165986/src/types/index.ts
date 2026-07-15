export type EntryKind = "free" | "mood" | "question" | "study" | "letter";

export type MoodKey = "低落" | "紧绷" | "明亮" | "柔软" | "平静" | "好奇";
export type MoodTone = "low" | "tense" | "bright" | "soft" | "calm";

export interface Mood {
  key: MoodKey;
  tone: MoodTone;
}

export interface Entry {
  id: string;
  mode: "write" | "chat";
  kind: EntryKind;
  title: string;
  content: string;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
  mood: Mood;
  topics: string[];
  summary: string;
  keySentence: string;
  reply: string;
  nextPrompt: string;
  wordCount: number;
}

export interface TopicSummary {
  name: string;
  count: number;
  words: number;
  latestAt: string;
  latestTitle: string;
  summary: string;
  mainMood: string;
}

export interface MonthlyDay {
  id: string;
  title: string;
  mood: Mood;
  topic: string;
  createdAt: string;
}

export interface MonthlySummary {
  count: number;
  mainMood: string;
  topTopics: { name: string; count: number }[];
  days: MonthlyDay[];
  note: string;
}

export interface Distribution {
  label: string;
  count: number;
  words: number;
}

export interface ReviewOverview {
  totalEntries: number;
  totalWords: number;
  activeDays: number;
  averageWords: number;
  longest: null | {
    title: string;
    words: number;
    createdAt: string;
  };
  note: string;
}

export interface ReviewTime {
  weekdays: { label: string; count: number; words: number }[];
  recentDays: { label: string; count: number; words: number }[];
  bestDay: { label: string; count: number; words: number } | null;
}

export interface ReviewSummary {
  overview: ReviewOverview;
  moods: Distribution[];
  topics: {
    label: string;
    count: number;
    words: number;
    mood: string;
  }[];
  kinds: Distribution[];
  time: ReviewTime;
  keywords: { label: string; count: number }[];
}

export interface State {
  entries: Entry[];
  topics: TopicSummary[];
  monthly: MonthlySummary;
  review: ReviewSummary;
  stats: {
    entries: number;
    topics: number;
    words: number;
  };
}

export type PaperType = "white" | "soft" | "grid" | "dark";
export type FontType = "system" | "serif" | "mono";
export type AudioType = "off" | "tap" | "paper" | "mechanical";
export type BackgroundMusic = "none" | "rain" | "low";
