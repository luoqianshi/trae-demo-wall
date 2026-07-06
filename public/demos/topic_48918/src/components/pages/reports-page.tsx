'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Col, Form, Radio, Row, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EChartsOption } from 'echarts';
import { ANALYSIS_MODEL_OPTIONS, PLATFORM_OPTIONS, TASK_STATUS_LABELS } from '@/constants';
import { createReport, getReportDetail, getReportList } from '@/services/reports';
import type { AnalysisModel, CrawlPlatform, ReportDetail, ReportItem, TaskStatus } from '@/types/domain';
import { ChartCard } from '@/components/shared/chart-card';
import { PageHero } from '@/components/shared/page-hero';
import { StatePanel } from '@/components/shared/state-panel';
import { StatusTag } from '@/components/shared/status-tag';

interface CreateReportFormValues {
  platform: CrawlPlatform;
  model: AnalysisModel;
}

export function ReportsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateReportFormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getReportList();
      setReports(response);
      const preferredId = selectedId ?? response[0]?.id ?? null;
      setSelectedId(preferredId);
      if (preferredId !== null && preferredId !== undefined) {
        setDetailLoading(true);
        const reportDetail = await getReportDetail(preferredId);
        setDetail(reportDetail);
      } else {
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '报告列表加载失败');
    } finally {
      setLoading(false);
      setDetailLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleSelectReport = useCallback(async (reportId: string | number) => {
    setSelectedId(reportId);
    setDetailLoading(true);
    try {
      const response = await getReportDetail(reportId);
      setDetail(response);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '报告详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const created = await createReport(values);
      message.success('报告已创建，请稍后刷新查看分析结果');
      await fetchReports();
      setSelectedId(created.id);
      setDetail(created);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [fetchReports, form, message]);

  const columns = useMemo<ColumnsType<ReportItem>>(
    () => [
      { title: '报告名称', dataIndex: 'title', key: 'title' },
      { title: '平台', dataIndex: 'platform', key: 'platform', width: 140, render: (value: CrawlPlatform) => <StatusTag type="platform" value={value} /> },
      { title: '模型', dataIndex: 'model', key: 'model', width: 160 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 120, render: (value: TaskStatus) => <StatusTag type="task" value={value} /> },
      { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
      { title: '操作', key: 'action', width: 120, render: (_, record) => <Button type="link" onClick={() => void handleSelectReport(record.id)}>查看</Button> },
    ],
    [handleSelectReport],
  );

  const topSkillsOption = useMemo<EChartsOption>(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: detail?.insight.topSkills.map((item) => item.name) ?? [], axisLabel: { color: '#9bb0d9' } },
    yAxis: { type: 'value', axisLabel: { color: '#9bb0d9' }, splitLine: { lineStyle: { color: 'rgba(147,197,253,0.1)' } } },
    series: [{ type: 'bar', data: detail?.insight.topSkills.map((item) => item.value) ?? [], itemStyle: { color: '#4fd1ff', borderRadius: [6, 6, 0, 0] } }],
  }), [detail]);

  const experienceOption = useMemo<EChartsOption>(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { textStyle: { color: '#9bb0d9' } },
    series: [{ type: 'pie', radius: ['48%', '72%'], data: detail?.insight.experienceSlices ?? [], label: { color: '#e7efff' } }],
  }), [detail]);

  const cityOption = useMemo<EChartsOption>(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { color: '#9bb0d9' }, splitLine: { lineStyle: { color: 'rgba(147,197,253,0.1)' } } },
    yAxis: { type: 'category', data: detail?.insight.cityDistribution.map((item) => item.name) ?? [], axisLabel: { color: '#9bb0d9' } },
    series: [{ type: 'bar', data: detail?.insight.cityDistribution.map((item) => item.value) ?? [], itemStyle: { color: '#8b7cff', borderRadius: 6 } }],
  }), [detail]);

  return (
    <div className="jobscope-page">
      <PageHero
        kicker="Reports"
        title="分析报告"
        description="分析报告页主要用于介绍岗位分析结果如何被组织和展示。用户可以选择平台与模型创建报告，并通过技能分布、经验切片、城市分布和总结文字来理解当前岗位市场特征。"
        metrics={[
          { label: '报告总数', value: `${reports.length}`, hint: '用于展示当前已生成的报告数量' },
          { label: '当前选中', value: selectedId ? `${selectedId}` : '--', hint: '用于说明右侧详情对应的报告对象' },
          { label: '图表组件', value: 'ECharts', hint: '用于展示技能、经验与城市分布信息' },
          { label: '状态提示', value: detail?.status ? TASK_STATUS_LABELS[detail.status] : '--', hint: '用于说明报告是否已完成生成' },
        ]}
        highlights={['报告创建说明', '列表切换查看', '图表结果展示', '文字结论解读']}
        sideStats={[
          { label: '详情状态', value: detailLoading ? '加载中' : '就绪', hint: '用于说明当前报告详情区的加载情况' },
          { label: '模型选项', value: `${ANALYSIS_MODEL_OPTIONS.length}`, hint: '用于介绍当前支持的分析模型范围' },
          { label: '平台选项', value: `${PLATFORM_OPTIONS.length}`, hint: '用于介绍报告可选的数据来源平台' },
        ]}
        actions={
          <>
            <Button type="primary" loading={submitting} onClick={() => void handleCreate()}>
              新建分析报告
            </Button>
            <Button onClick={() => void fetchReports()}>更新报告列表</Button>
          </>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card className="jobscope-card" bordered={false} title="创建报告">
            <Form<CreateReportFormValues> form={form} layout="vertical" initialValues={{ platform: 'intern_monk', model: 'qwen' }}>
              <Form.Item label="平台" name="platform" rules={[{ required: true, message: '请选择平台' }]}>
                <Select options={PLATFORM_OPTIONS} />
              </Form.Item>
              <Form.Item label="分析模型" name="model" rules={[{ required: true, message: '请选择模型' }]}>
                <Radio.Group optionType="button" buttonStyle="solid" options={ANALYSIS_MODEL_OPTIONS} />
              </Form.Item>
              <Typography.Paragraph type="secondary">如果当前还没有可用的岗位样本，建议先前往采集任务页完成数据采集，再返回此页创建和查看分析报告。</Typography.Paragraph>
            </Form>
          </Card>

          <StatePanel loading={loading} error={error} empty={!reports.length} emptyDescription="暂无分析报告，请先完成采集任务或稍后刷新" onRetry={fetchReports}>
            <Card className="jobscope-card" bordered={false} title="报告列表">
              <Table<ReportItem>
                rowKey="id"
                columns={columns}
                dataSource={reports}
                pagination={false}
                rowClassName={(record) => (record.id === selectedId ? 'jobscope-table-row-active' : '')}
              />
            </Card>
          </StatePanel>
        </Col>

        <Col xs={24} xl={16}>
          <StatePanel loading={detailLoading} empty={!detail} emptyDescription="请选择报告查看详情，或先创建新的分析报告">
            {detail ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card className="jobscope-card" bordered={false}>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Space wrap>
                      <StatusTag type="platform" value={detail.platform} />
                      <StatusTag type="task" value={detail.status} />
                      <Typography.Text type="secondary">模型：{detail.model}</Typography.Text>
                    </Space>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {detail.title}
                    </Typography.Title>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>{detail.insight.summary || '暂无分析摘要，请稍后刷新。'}</Typography.Paragraph>
                    {detail.status !== 'success' ? <Typography.Text type="warning">暂无分析报告，请先完成采集任务或稍后刷新</Typography.Text> : null}
                  </Space>
                </Card>

                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <ChartCard title="高频技能" description="观察岗位要求中出现频次最高的技能项" option={topSkillsOption} hasData={Boolean(detail.insight.topSkills.length)} />
                  </Col>
                  <Col xs={24} lg={12}>
                    <ChartCard title="经验要求切片" description="识别当前岗位对经验层级的偏好" option={experienceOption} hasData={Boolean(detail.insight.experienceSlices.length)} />
                  </Col>
                  <Col xs={24}>
                    <ChartCard title="城市分布" description="结合城市样本分布判断岗位投递优先级" option={cityOption} hasData={Boolean(detail.insight.cityDistribution.length)} height={280} />
                  </Col>
                </Row>

                <Card className="jobscope-card" bordered={false} title="学习建议与报告原文">
                  <Typography.Title level={5}>学习建议</Typography.Title>
                  <ul className="jobscope-suggestion-list">
                    {detail.insight.suggestions.length ? detail.insight.suggestions.map((item) => <li key={item}>{item}</li>) : <li>暂无学习建议，请稍后刷新。</li>}
                  </ul>
                  <Typography.Title level={5}>总结文字</Typography.Title>
                  <Typography.Paragraph>{detail.markdown || '暂无总结正文。'}</Typography.Paragraph>
                </Card>
              </Space>
            ) : null}
          </StatePanel>
        </Col>
      </Row>
    </div>
  );
}
