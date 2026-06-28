'use client';

import { Button, Empty, Result, Skeleton, Space } from 'antd';

interface StatePanelProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyDescription?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function StatePanel({ loading, error, empty, emptyDescription, onRetry, children }: StatePanelProps) {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} className="jobscope-card jobscope-state-block" />;
  }

  if (error) {
    return (
      <Result
        status="error"
        title="数据加载失败"
        subTitle={error}
        extra={onRetry ? <Button onClick={onRetry}>重试</Button> : null}
        className="jobscope-card jobscope-state-block"
      />
    );
  }

  if (empty) {
    return (
      <Space className="jobscope-card jobscope-state-block" direction="vertical" size={12} align="center">
        <Empty description={emptyDescription ?? '暂无数据'} />
      </Space>
    );
  }

  return <>{children}</>;
}
