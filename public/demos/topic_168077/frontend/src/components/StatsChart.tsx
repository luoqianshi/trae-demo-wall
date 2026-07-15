import React from 'react';
import { Card } from 'antd';
import ReactECharts from 'echarts-for-react';

interface Props {
  weeklyData?: { week: string; total: number; confirmed: number }[];
  monthlyData?: { month: string; total: number; confirmed: number }[];
  viewMode: 'week' | 'month';
}

export default function StatsChart({ weeklyData = [], monthlyData = [], viewMode }: Props) {
  const data = viewMode === 'week' ? weeklyData : monthlyData;
  const nameKey = viewMode === 'week' ? 'week' : 'month';

  const barOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总次数', '完成次数'] },
    xAxis: { type: 'category', data: data.map(d => (d as any)[nameKey]) },
    yAxis: { type: 'value' },
    series: [
      { name: '总次数', type: 'bar', data: data.map(d => d.total), itemStyle: { color: '#D97706' } },
      { name: '完成次数', type: 'bar', data: data.map(d => d.confirmed), itemStyle: { color: '#059669' } },
    ],
  };

  const totalConfirmed = data.reduce((s, d) => s + d.confirmed, 0);
  const totalAll = data.reduce((s, d) => s + d.total, 0);
  const pieData = [
    { name: '已完成', value: totalConfirmed },
    { name: '未完成', value: Math.max(0, totalAll - totalConfirmed) },
  ];

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: pieData,
      label: { show: true, formatter: '{b}\n{d}%' },
      color: ['#059669', '#D97706'],
    }],
  };

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <Card title={`${viewMode === 'week' ? '周' : '月'}度打卡统计`} style={{ flex: 1, minWidth: 300 }}>
        <ReactECharts option={barOption} style={{ height: 300 }} />
      </Card>
      <Card title="完成比例" style={{ flex: 1, minWidth: 300 }}>
        <ReactECharts option={pieOption} style={{ height: 300 }} />
      </Card>
    </div>
  );
}