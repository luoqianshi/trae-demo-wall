export type CrawlPlatform = 'intern_monk' | 'fresh_graduate';
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';
export type AnalysisModel = 'qwen' | 'deepseek';

export interface DashboardMetrics {
  totalTasks: number;
  successRate: number;
  totalJobs: number;
  totalReports: number;
  analysisCompletionRate: number;
  activePlatforms: number;
}

export interface SystemStatusItem {
  key: string;
  name: string;
  status: 'healthy' | 'warning' | 'offline';
  detail: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  keyword: string;
  platform: CrawlPlatform;
  maxPages: number;
}

export interface TaskItem {
  id: string | number;
  keyword: string;
  platform: CrawlPlatform;
  status: TaskStatus;
  maxPages: number;
  city?: string;
  resultCount: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  progress: number;
}

export interface TaskDetail extends TaskItem {
  summary: string;
  durationText: string;
  logs: string[];
}

export interface TaskQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  platform?: CrawlPlatform;
  status?: TaskStatus;
}

export interface JobItem {
  id: string | number;
  platform: CrawlPlatform;
  title: string;
  companyName: string;
  city: string;
  salaryText: string;
  degreeText: string | null;
  experienceText: string | null;
  updatedAt: string;
  tags: string[];
}

export interface JobDetail extends JobItem {
  description: string;
  requirements: string | null;
  address: string | null;
  sourceUrl: string | null;
  sourceRawId: string | null;
  companyInfo: string;
  salaryRange: string;
}

export interface JobQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  platform?: CrawlPlatform;
  city?: string;
  degree?: string;
  experience?: string;
  salaryKeyword?: string;
  updatedWithinDays?: number;
}

export interface ReportInsight {
  topSkills: Array<{ name: string; value: number }>;
  experienceSlices: Array<{ name: string; value: number }>;
  cityDistribution: Array<{ name: string; value: number }>;
  summary: string;
  suggestions: string[];
}

export interface ReportItem {
  id: string | number;
  title: string;
  platform: CrawlPlatform;
  model: AnalysisModel;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  sourceTaskId?: string | number;
}

export interface ReportDetail extends ReportItem {
  markdown: string;
  insight: ReportInsight;
}

export interface CreateReportPayload {
  platform: CrawlPlatform;
  model: AnalysisModel;
}

export interface PlatformStatus {
  code: CrawlPlatform;
  name: string;
  status: 'healthy' | 'warning' | 'offline';
  lastCrawlAt: string;
  message: string;
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  systems: SystemStatusItem[];
  platforms: PlatformStatus[];
}
