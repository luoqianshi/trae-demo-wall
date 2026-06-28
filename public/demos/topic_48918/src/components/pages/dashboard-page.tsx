'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Col, List, Row, Space, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getDashboardOverview } from '@/services/dashboard';
import { PLATFORM_LABELS } from '@/constants';
import type { DashboardOverview, PlatformStatus, SystemStatusItem } from '@/types/domain';
import { PageHero } from '@/components/shared/page-hero';
import { StatePanel } from '@/components/shared/state-panel';
import { StatusTag } from '@/components/shared/status-tag';

const systemColumns: ColumnsType<SystemStatusItem> = [
  { title: '系统', dataIndex: 'name', key: 'name' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (_, record) => <StatusTag type="task" value={record.status === 'healthy' ? 'success' : record.status === 'warning' ? 'running' : 'failed'} />,
  },
  { title: '说明', dataIndex: 'detail', key: 'detail' },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
];

const platformColumns: ColumnsType<PlatformStatus> = [
  { title: '平台', dataIndex: 'name', key: 'name' },
  { title: '平台编码', dataIndex: 'code', key: 'code', render: (value: PlatformStatus['code']) => PLATFORM_LABELS[value] },
  {
    title: '链路状态',
    dataIndex: 'status',
    key: 'status',
    render: (_, record) => <StatusTag type="task" value={record.status === 'healthy' ? 'success' : record.status === 'warning' ? 'running' : 'failed'} />,
  },
  { title: '最近抓取时间', dataIndex: 'lastCrawlAt', key: 'lastCrawlAt', width: 180 },
  { title: '说明', dataIndex: 'message', key: 'message' },
];

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const router = useRouter();

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardOverview();
      setOverview(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '首页总览加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const metricCards = useMemo(() => {
    if (!overview) return [];
    return [
      { title: '采集任务总数', value: overview.metrics.totalTasks, suffix: '个' },
      { title: '采集成功率', value: overview.metrics.successRate, suffix: '%' },
      { title: '岗位样本总量', value: overview.metrics.totalJobs, suffix: '条' },
      { title: '分析完成率', value: overview.metrics.analysisCompletionRate, suffix: '%' },
    ];
  }, [overview]);

  return (
    <div className="jobscope-page">
      <PageHero
        kicker="Overview"
        title="平台总览"
        description="首页主要用于介绍当前管理台的整体结构，帮助使用者先理解平台覆盖的业务范围、已接入的平台情况，以及采集、岗位浏览和报告分析三个核心模块的进入方式。"
        metrics={[
          { label: '任务总数', value: overview ? `${overview.metrics.totalTasks}` : '--', hint: '用于说明当前采集任务规模' },
          { label: '成功率', value: overview ? `${overview.metrics.successRate}%` : '--', hint: '用于了解采集执行整体表现' },
          { label: '岗位样本', value: overview ? `${overview.metrics.totalJobs}` : '--', hint: '用于说明当前岗位数据积累情况' },
          { label: '报告产出', value: overview ? `${overview.metrics.totalReports}` : '--', hint: '用于展示已形成的分析结果数量' },
        ]}
        highlights={['平台概览', '模块介绍', '状态说明', '功能入口']}
        references={[
          { label: '核心流程', value: '创建任务 → 浏览岗位 → 查看报告', detail: '用于介绍平台的主要使用顺序' },
          { label: '接入平台', value: '实习僧 / 应届生求职网', detail: '用于说明当前已完成接入的平台范围' },
          { label: '首页作用', value: '总览与引导', detail: '帮助用户先理解系统，再进入具体模块' },
        ]}
        sideStats={[
          { label: '活跃平台', value: overview ? `${overview.metrics.activePlatforms}` : '--', hint: '展示当前已启用的平台数量' },
          { label: '系统项', value: overview ? `${overview.systems.length}` : '--', hint: '展示需要关注的核心依赖项' },
          { label: '报告数', value: overview ? `${overview.metrics.totalReports}` : '--', hint: '展示当前可查看的分析产物规模' },
        ]}
        actions={
          <>
            <Button type="primary" onClick={() => router.push('/tasks')}>
              查看采集任务
            </Button>
            <Button onClick={() => router.push('/reports')}>查看分析报告</Button>
            <Button onClick={() => void loadOverview()}>更新首页信息</Button>
          </>
        }
      />

      <StatePanel loading={loading} error={error} empty={!overview} onRetry={loadOverview}>
        <Row gutter={[16, 16]}>
          {metricCards.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card className="jobscope-card" bordered={false}>
                <Statistic title={item.title} value={item.value} suffix={item.suffix} />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card className="jobscope-card" bordered={false} title="系统健康状态">
              <Table<SystemStatusItem> rowKey="key" columns={systemColumns} dataSource={overview?.systems ?? []} pagination={false} />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card className="jobscope-card" bordered={false} title="使用说明">
              <List
                dataSource={[
                  '先通过首页了解平台当前的运行情况与模块分工。',
                  '如需发起数据采集，可进入采集任务页填写关键词和平台条件。',
                  '如需阅读分析结果，可在报告页查看已有报告或创建新的分析任务。',
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
              <Alert showIcon type="info" message="首页以介绍和引导为主，用于帮助用户快速理解整个平台。" />
            </Card>
          </Col>
        </Row>

        <Card className="jobscope-card" bordered={false} title="平台状态">
          <Table<PlatformStatus> rowKey="code" columns={platformColumns} dataSource={overview?.platforms ?? []} pagination={false} />
        </Card>
      </StatePanel>
    </div>
  );
}
