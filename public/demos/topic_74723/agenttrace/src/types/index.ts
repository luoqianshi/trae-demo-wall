export type ToolName =
  | "TRAE"
  | "Codex"
  | "Claude Code"
  | "Cursor"
  | "Qoder"
  | "Other";

export type TaskStatus = "success" | "partial" | "failed" | "blocked";

export type Severity = "low" | "medium" | "high";

export type Currency = "USD" | "CNY";

export interface ProjectMeta {
  projectName: string;
  taskGoal: string;
  tool: ToolName;
  modelName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: TaskStatus;
}

export interface CostMeta {
  inputTokens: number;
  outputTokens: number;
  cacheHitTokens: number;
  totalCost: number;
  currency: Currency;
  retries: number;
  interruptions: number;
}

export interface ParsedIssue {
  title: string;
  severity: Severity;
  evidence: string;
  possibleCause: string;
  solution: string;
  prevention: string;
}

export interface ParsedResult {
  errors: { line: string; keyword: string }[];
  actions: string[];
  files: string[];
  commands: string[];
  completedItems: string[];
}

export interface ReviewReport {
  summary: string;
  completedItems: string[];
  keyActions: string[];
  modifiedFiles: string[];
  issues: ParsedIssue[];
  costAnalysis: string;
  modelEvaluation: string;
  modelScore: number;
  nextPromptSuggestions: string[];
  costMetrics: {
    totalTokens: number;
    outputRatio: number;
    cacheRatio: number;
    costPerMinute: number;
  };
}

export interface SessionData {
  projectMeta: ProjectMeta;
  costMeta: CostMeta;
  transcript: string;
  report: ReviewReport | null;
  updatedAt: string;
}
