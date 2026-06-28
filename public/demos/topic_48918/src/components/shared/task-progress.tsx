'use client';

import { Progress, Space, Typography } from 'antd';
import type { TaskStatus } from '@/types/domain';

function getProgressStatus(status: TaskStatus): 'success' | 'exception' | 'active' | 'normal' {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'exception';
  if (status === 'running') return 'active';
  return 'normal';
}

export function TaskProgress({ progress, status, resultCount }: { progress: number; status: TaskStatus; resultCount: number }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Progress percent={progress} size="small" status={getProgressStatus(status)} />
      <Typography.Text type="secondary">当前已入库 {resultCount} 条岗位记录</Typography.Text>
    </Space>
  );
}
