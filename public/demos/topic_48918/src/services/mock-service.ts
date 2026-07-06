import { DEFAULT_PAGE_SIZE } from '@/constants';
import { dashboardMetrics, jobs, platformStatuses, reports, systemStatuses, taskDetails } from '@/mocks/data';
import { PaginatedResult } from '@/types/common';
import {
  CreateReportPayload,
  CreateTaskPayload,
  JobDetail,
  JobQueryParams,
  PlatformStatus,
  ReportDetail,
  ReportItem,
  SystemStatusItem,
  TaskDetail,
  TaskItem,
  TaskQueryParams,
} from '@/types/domain';

const sleep = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

function paginate<T>(list: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): PaginatedResult<T> {
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

export async function getDashboardOverview() {
  await sleep();
  return { metrics: dashboardMetrics, systems: systemStatuses, platforms: platformStatuses };
}

export async function getTaskList(params: TaskQueryParams): Promise<PaginatedResult<TaskItem>> {
  await sleep();
  const filtered = taskDetails.filter((item) => {
    const byKeyword = params.keyword ? item.keyword.includes(params.keyword) : true;
    const byPlatform = params.platform ? item.platform === params.platform : true;
    const byStatus = params.status ? item.status === params.status : true;
    return byKeyword && byPlatform && byStatus;
  });
  return paginate(filtered, params.page, params.pageSize);
}

export async function createTask(payload: CreateTaskPayload): Promise<TaskDetail> {
  await sleep(420);
  return {
    id: Date.now(),
    keyword: payload.keyword,
    platform: payload.platform,
    status: 'pending',
    maxPages: payload.maxPages,
    resultCount: 0,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    progress: 0,
    summary: '任务已创建，等待调度执行。',
    durationText: '--',
    logs: ['任务已进入等待队列'],
  };
}

export async function getTaskDetail(taskId: number): Promise<TaskDetail> {
  await sleep();
  const target = taskDetails.find((item) => item.id === taskId);
  if (!target) {
    throw new Error('未找到对应任务，请刷新后重试');
  }
  return target;
}

export async function retryTask(taskId: number): Promise<TaskDetail> {
  await sleep(320);
  const target = taskDetails.find((item) => item.id === taskId);
  if (!target) {
    throw new Error('任务不存在，无法重试');
  }
  return { ...target, status: 'pending', progress: 0, errorMessage: null, summary: '已重新投递到任务队列。' };
}

export async function getJobList(params: JobQueryParams): Promise<PaginatedResult<JobDetail>> {
  await sleep();
  const filtered = jobs.filter((item) => {
    return (
      (!params.keyword || item.title.includes(params.keyword) || item.companyName.includes(params.keyword)) &&
      (!params.platform || item.platform === params.platform)
    );
  });
  return paginate(filtered, params.page, params.pageSize);
}

export async function getJobDetail(jobId: number): Promise<JobDetail> {
  await sleep();
  const target = jobs.find((item) => item.id === jobId);
  if (!target) {
    throw new Error('岗位详情不存在，请返回列表后重试');
  }
  return target;
}

export async function getReportList(): Promise<ReportItem[]> {
  await sleep();
  return reports;
}

export async function getReportDetail(reportId: number): Promise<ReportDetail> {
  await sleep();
  const target = reports.find((item) => item.id === reportId);
  if (!target) {
    throw new Error('暂无分析报告，请先完成采集任务或稍后刷新');
  }
  return target;
}

export async function createReport(payload: CreateReportPayload): Promise<ReportDetail> {
  await sleep(420);
  return {
    id: Date.now(),
    title: `${payload.platform === 'intern_monk' ? '实习僧' : '应届生求职网'}分析报告`,
    platform: payload.platform,
    model: payload.model,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    markdown: '',
    insight: {
      topSkills: [],
      experienceSlices: [],
      cityDistribution: [],
      summary: '报告已创建，等待分析引擎执行。',
      suggestions: [],
    },
  };
}

export async function getPlatformStatuses(): Promise<PlatformStatus[]> {
  await sleep();
  return platformStatuses;
}

export async function getSystemStatuses(): Promise<SystemStatusItem[]> {
  await sleep();
  return systemStatuses;
}
