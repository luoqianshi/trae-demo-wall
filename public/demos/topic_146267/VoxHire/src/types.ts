export type AppMode = "demo" | "live";
export type View = "setup" | "interview" | "report";

export interface SetupData {
  role: string;
  experienceYears: number;
  skills: string;
  resumeText: string;
  jobDescription: string;
}

export interface LlmConnectionResult {
  ok: boolean;
  message: string;
  model: string;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

export interface DimensionScore {
  key: string;
  label: string;
  score: number;
  evidence: string;
  suggestion: string;
}

export interface InterviewReport {
  session_id: string;
  overall_score: number;
  recommendation: string;
  summary: string;
  dimensions: DimensionScore[];
}

export interface SessionCreated {
  session_id: string;
  gateway_instructions: string;
  questions: string[];
}
