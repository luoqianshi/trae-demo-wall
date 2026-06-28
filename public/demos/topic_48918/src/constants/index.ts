import { AnalysisModel, CrawlPlatform, TaskStatus } from '@/types/domain';
import { OptionItem } from '@/types/common';

export const PLATFORM_OPTIONS: OptionItem[] = [
  { label: '实习僧', value: 'intern_monk' },
  { label: '应届生求职网', value: 'fresh_graduate' },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待执行',
  running: '执行中',
  success: '已完成',
  failed: '失败',
};

export const PLATFORM_LABELS: Record<CrawlPlatform, string> = {
  intern_monk: '实习僧',
  fresh_graduate: '应届生求职网',
};

export const ANALYSIS_MODEL_OPTIONS: Array<{ label: string; value: AnalysisModel }> = [
  { label: 'qwen3.6-plus', value: 'qwen' },
  { label: 'deepseek-v4-pro', value: 'deepseek' },
];

export const DEFAULT_PAGE_SIZE = 10;

export const APP_NAME = 'JobScope 招聘数据采集分析平台';
