import dayjs from 'dayjs';
import { PLATFORM_LABELS, TASK_STATUS_LABELS } from '@/constants';
import { CrawlPlatform, TaskStatus } from '@/types/domain';

export function formatDateTime(value?: string | null) {
  if (!value) return '--';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function formatPlatform(platform: CrawlPlatform) {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function formatPlatformScope(platform: CrawlPlatform) {
  return formatPlatform(platform);
}

export function formatTaskStatus(status: TaskStatus) {
  return TASK_STATUS_LABELS[status] ?? status;
}

export function safePercent(value: number) {
  return `${Math.round(value * 100) / 100}%`;
}
