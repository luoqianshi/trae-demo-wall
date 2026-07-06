'use client';

import { Tag } from 'antd';
import { PLATFORM_LABELS, TASK_STATUS_LABELS } from '@/constants';
import type { CrawlPlatform, TaskStatus } from '@/types/domain';

const statusColorMap: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
};

const platformColorMap: Record<CrawlPlatform, string> = {
  intern_monk: 'cyan',
  fresh_graduate: 'purple',
};

export function StatusTag({ type, value }: { type: 'task' | 'platform'; value: TaskStatus | CrawlPlatform }) {
  if (type === 'task') {
    const taskValue = value as TaskStatus;
    return <Tag color={statusColorMap[taskValue]}>{TASK_STATUS_LABELS[taskValue]}</Tag>;
  }

  const platformValue = value as CrawlPlatform;
  return <Tag color={platformColorMap[platformValue]}>{PLATFORM_LABELS[platformValue]}</Tag>;
}
