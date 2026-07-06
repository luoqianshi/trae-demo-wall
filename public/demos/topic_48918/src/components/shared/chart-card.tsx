'use client';

import dynamic from 'next/dynamic';
import { Card, Empty, Typography } from 'antd';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ChartCardProps {
  title: string;
  description?: string;
  option: EChartsOption;
  height?: number;
  hasData: boolean;
}

export function ChartCard({ title, description, option, height = 320, hasData }: ChartCardProps) {
  return (
    <Card className="jobscope-card" bordered={false}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      {description ? <Typography.Paragraph type="secondary">{description}</Typography.Paragraph> : null}
      {hasData ? <ReactECharts option={option} style={{ height }} notMerge lazyUpdate /> : <Empty description="暂无图表数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
    </Card>
  );
}
