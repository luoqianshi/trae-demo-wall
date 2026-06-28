import { http } from '@/services/http';
import type { ApiResponse } from '@/types/api';
import type { PaginatedResult } from '@/types/common';
import type {
  CreateReportPayload,
  CreateTaskPayload,
  DashboardOverview,
  JobDetail,
  JobItem,
  JobQueryParams,
  PlatformStatus,
  ReportDetail,
  ReportItem,
  SystemStatusItem,
  TaskDetail,
  TaskItem,
  TaskQueryParams,
} from '@/types/domain';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function normalizeTaskItem(item: Partial<TaskItem> & Record<string, unknown>): TaskItem {
  return {
    id: String(item.id ?? ''),
    keyword: String(item.keyword ?? ''),
    platform: (item.platform ?? 'intern_monk') as TaskItem['platform'],
    status: (item.status ?? 'pending') as TaskItem['status'],
    maxPages: Number(item.maxPages ?? 1),
    city: item.city ? String(item.city) : undefined,
    resultCount: Number(item.resultCount ?? 0),
    errorMessage: item.errorMessage ? String(item.errorMessage) : null,
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    startedAt: item.startedAt ? String(item.startedAt) : null,
    finishedAt: item.finishedAt ? String(item.finishedAt) : null,
    progress: Number(item.progress ?? 0),
  };
}

function normalizeTaskDetail(item: Partial<TaskDetail> & Record<string, unknown>): TaskDetail {
  return {
    ...normalizeTaskItem(item),
    summary: String(item.summary ?? '任务已创建，等待执行。'),
    durationText: String(item.durationText ?? '--'),
    logs: Array.isArray(item.logs) ? item.logs.map((log) => String(log)) : [],
  };
}

function normalizeJobItem(item: Partial<JobItem> & Record<string, unknown>): JobItem {
  const salaryMin = item.salary_min ? String(item.salary_min) : '';
  const salaryMax = item.salary_max ? String(item.salary_max) : '';
  const salaryText = item.salaryText ? String(item.salaryText) : [salaryMin, salaryMax].filter(Boolean).join('-');

  return {
    id: String(item.id ?? ''),
    platform: (item.platform ?? 'intern_monk') as JobItem['platform'],
    title: String(item.title ?? ''),
    companyName: String(item.companyName ?? item.company_name ?? ''),
    city: String(item.city ?? ''),
    salaryText,
    degreeText: item.degreeText ? String(item.degreeText) : item.education ? String(item.education) : null,
    experienceText: item.experienceText ? String(item.experienceText) : item.experience ? String(item.experience) : null,
    updatedAt: String(item.updatedAt ?? item.updated_at ?? new Date().toISOString()),
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => (typeof tag === 'string' ? tag : String((tag as { tag_name?: string }).tag_name ?? ''))).filter(Boolean)
      : [],
  };
}

function normalizeJobDetail(item: Partial<JobDetail> & Record<string, unknown>): JobDetail {
  const normalized = normalizeJobItem(item);
  return {
    ...normalized,
    description: String(item.description ?? ''),
    requirements: item.requirements ? String(item.requirements) : null,
    address: item.address ? String(item.address) : null,
    sourceUrl: item.sourceUrl ? String(item.sourceUrl) : item.source_url ? String(item.source_url) : null,
    sourceRawId: item.sourceRawId ? String(item.sourceRawId) : item.source_job_id ? String(item.source_job_id) : null,
    companyInfo: String(item.companyInfo ?? ''),
    salaryRange: String(item.salaryRange ?? normalized.salaryText),
  };
}

function normalizeReportItem(item: Partial<ReportItem> & Record<string, unknown>): ReportItem {
  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? ''),
    platform: (item.platform ?? 'intern_monk') as ReportItem['platform'],
    model: (item.model ?? 'qwen') as ReportItem['model'],
    status: (item.status ?? 'pending') as ReportItem['status'],
    createdAt: String(item.createdAt ?? item.created_at ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? item.updated_at ?? new Date().toISOString()),
    sourceTaskId: item.sourceTaskId ? String(item.sourceTaskId) : undefined,
  };
}

export async function fetchTaskListFromApi(params: TaskQueryParams): Promise<PaginatedResult<TaskItem>> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getTaskList(params);
  }

  const response = await http.get<ApiResponse<TaskItem[]>>('/tasks', { params });
  const list = response.data.data.map((item) => normalizeTaskItem(asRecord(item)));
  return {
    list,
    total: response.data.pagination?.total ?? list.length,
    page: response.data.pagination?.page ?? params.page,
    pageSize: response.data.pagination?.page_size ?? params.pageSize,
  };
}

export async function fetchTaskDetailFromApi(taskId: string | number): Promise<TaskDetail> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getTaskDetail(Number(taskId));
  }

  const response = await http.get<ApiResponse<TaskDetail>>(`/tasks/${taskId}`);
  return normalizeTaskDetail(asRecord(response.data.data));
}

export async function createTaskFromApi(payload: CreateTaskPayload): Promise<TaskDetail> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.createTask(payload);
  }

  throw new Error('当前真实后端创建任务接口仍需平台 ID 映射，默认请继续使用模拟模式。');
}

export async function retryTaskFromApi(taskId: string | number): Promise<TaskDetail> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.retryTask(Number(taskId));
  }

  const response = await http.post<ApiResponse<TaskDetail>>(`/tasks/${taskId}/retry`);
  return normalizeTaskDetail(asRecord(response.data.data));
}

export async function fetchJobListFromApi(params: JobQueryParams): Promise<PaginatedResult<JobItem>> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getJobList(params);
  }

  const response = await http.get<ApiResponse<JobItem[]>>('/jobs', { params });
  const list = response.data.data.map((item) => normalizeJobItem(asRecord(item)));
  return {
    list,
    total: response.data.pagination?.total ?? list.length,
    page: response.data.pagination?.page ?? params.page,
    pageSize: response.data.pagination?.page_size ?? params.pageSize,
  };
}

export async function fetchJobDetailFromApi(jobId: string | number): Promise<JobDetail> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getJobDetail(Number(jobId));
  }

  const response = await http.get<ApiResponse<JobDetail>>(`/jobs/${jobId}`);
  return normalizeJobDetail(asRecord(response.data.data));
}

export async function fetchReportListFromApi(): Promise<ReportItem[]> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getReportList();
  }

  const response = await http.get<ApiResponse<ReportItem[]>>('/reports');
  return response.data.data.map((item) => normalizeReportItem(asRecord(item)));
}

export async function fetchReportDetailFromApi(reportId: string | number): Promise<ReportDetail> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getReportDetail(Number(reportId));
  }

  const response = await http.get<ApiResponse<ReportDetail>>(`/reports/${reportId}`);
  const item = asRecord(response.data.data);
  return {
    ...normalizeReportItem(item),
    markdown: String(item.markdown ?? item.report_markdown ?? ''),
    insight: {
      topSkills: [],
      experienceSlices: [],
      cityDistribution: [],
      summary: '当前真实后端仅返回基础骨架数据。',
      suggestions: [],
    },
  };
}

export async function createReportFromApi(payload: CreateReportPayload): Promise<ReportDetail> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.createReport(payload);
  }

  throw new Error('当前真实后端报告创建接口仍需任务关联参数，默认请继续使用模拟模式。');
}

export async function fetchDashboardOverviewFromApi(): Promise<DashboardOverview> {
  if (useMock) {
    const mod = await import('@/services/mock-service');
    return mod.getDashboardOverview();
  }

  const [healthResponse, platformsResponse] = await Promise.all([
    http.get<ApiResponse<{ database: string; redis: string; queue?: string; startup_error?: string | null }>>('/health'),
    http.get<ApiResponse<Array<{ id: string; code: string; name: string; is_enabled: boolean }>>>('/platforms'),
  ]);
  const health = healthResponse.data.data;
  const queueState = health.queue ?? (health.startup_error ? 'warning' : 'ready');

  const systems: SystemStatusItem[] = [
    {
      key: 'database',
      name: '数据库',
      status: health.database === 'connected' || health.database === 'ok' ? 'healthy' : 'offline',
      detail: `状态：${health.database}`,
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'redis',
      name: 'Redis',
      status: health.redis === 'connected' || health.redis === 'ok' ? 'healthy' : 'offline',
      detail: `状态：${health.redis}`,
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'queue',
      name: '任务队列',
      status: queueState === 'ready' ? 'healthy' : 'warning',
      detail: health.startup_error ? `状态：${queueState}；初始化异常：${health.startup_error}` : `状态：${queueState}`,
      updatedAt: new Date().toISOString(),
    },
  ];

  const platforms: PlatformStatus[] = platformsResponse.data.data.map((item) => ({
    code: item.code as PlatformStatus['code'],
    name: item.name,
    status: item.is_enabled ? 'healthy' : 'offline',
    lastCrawlAt: '未执行',
    message: item.is_enabled ? '平台可用，等待接入真实采集器' : '平台已禁用',
  }));

  return {
    metrics: {
      totalTasks: 0,
      successRate: 100,
      totalJobs: 0,
      totalReports: 0,
      analysisCompletionRate: 0,
      activePlatforms: platforms.filter((item) => item.status === 'healthy').length,
    },
    systems,
    platforms,
  };
}

export async function fetchPlatformStatusesFromApi(): Promise<PlatformStatus[]> {
  return (await fetchDashboardOverviewFromApi()).platforms;
}

