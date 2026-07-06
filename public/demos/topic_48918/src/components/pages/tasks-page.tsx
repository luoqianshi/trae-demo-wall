'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Card, Col, Descriptions, Drawer, Form, Input, InputNumber, Row, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createTask, getTaskDetail, getTaskList, retryTask } from '@/services/tasks';
import { DEFAULT_PAGE_SIZE, PLATFORM_OPTIONS, TASK_STATUS_LABELS } from '@/constants';
import type { CrawlPlatform, TaskDetail, TaskItem, TaskQueryParams, TaskStatus } from '@/types/domain';
import { PageHero } from '@/components/shared/page-hero';
import { StatePanel } from '@/components/shared/state-panel';
import { StatusTag } from '@/components/shared/status-tag';
import { TaskProgress } from '@/components/shared/task-progress';

interface TaskFormValues {
  keyword: string;
  platform: CrawlPlatform;
  maxPages: number;
}

interface FilterValues {
  keyword?: string;
  platform?: CrawlPlatform;
  status?: TaskStatus;
}

export function TasksPage() {
  const { message } = App.useApp();
  const [createForm] = Form.useForm<TaskFormValues>();
  const [filterForm] = Form.useForm<FilterValues>();
  const [list, setList] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | number | null>(null);
  const requestIdRef = useRef(0);

  const fetchTasks = useCallback(
    async (targetPage = page, targetPageSize = pageSize) => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const values = filterForm.getFieldsValue();
        const response = await getTaskList({
          page: targetPage,
          pageSize: targetPageSize,
          keyword: values.keyword?.trim() || undefined,
          platform: values.platform,
          status: values.status,
        });
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        setList(response.list);
        setTotal(response.total);
        setPage(response.page);
        setPageSize(response.pageSize);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        setError(err instanceof Error ? err.message : '任务列表加载失败，请稍后重试');
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [filterForm, page, pageSize],
  );

  useEffect(() => {
    void fetchTasks(1, DEFAULT_PAGE_SIZE);
  }, [fetchTasks]);

  useEffect(() => {
    const hasRunning = list.some((item) => item.status === 'running' || item.status === 'pending');
    if (!hasRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchTasks(page, pageSize);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [fetchTasks, list, page, pageSize]);

  const handleCreateTask = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      const created = await createTask(values);
      message.success('任务已创建，可在下方列表查看状态');
      createForm.resetFields();
      await fetchTasks(1, pageSize);
      setDrawerOpen(true);
      setSelectedTask(created);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [createForm, fetchTasks, message, pageSize]);

  const openDetail = useCallback(async (taskId: string | number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getTaskDetail(taskId);
      setSelectedTask(detail);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '任务详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  const handleRetry = useCallback(async (taskId: string | number) => {
    setRetryingId(taskId);
    try {
      const detail = await retryTask(taskId);
      message.success('任务已重新投递');
      if (selectedTask?.id === taskId) {
        setSelectedTask(detail);
      }
      await fetchTasks(page, pageSize);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '任务重试失败');
    } finally {
      setRetryingId(null);
    }
  }, [fetchTasks, message, page, pageSize, selectedTask?.id]);

  const columns = useMemo<ColumnsType<TaskItem>>(
    () => [
      { title: '任务ID', dataIndex: 'id', key: 'id', width: 96 },
      { title: '关键词', dataIndex: 'keyword', key: 'keyword' },
      { title: '平台', dataIndex: 'platform', key: 'platform', render: (value: CrawlPlatform) => <StatusTag type="platform" value={value} /> },
      { title: '状态', dataIndex: 'status', key: 'status', render: (value: TaskStatus) => <StatusTag type="task" value={value} /> },
      { title: '进度', key: 'progress', width: 240, render: (_, record) => <TaskProgress progress={record.progress} status={record.status} resultCount={record.resultCount} /> },
      { title: '失败原因', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true, render: (value: string | null) => value ?? '--' },
      { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
      {
        title: '操作',
        key: 'action',
        width: 180,
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => void openDetail(record.id)}>
              查看详情
            </Button>
            <Button type="link" disabled={record.status !== 'failed'} loading={retryingId === record.id} onClick={() => void handleRetry(record.id)}>
              重试
            </Button>
          </Space>
        ),
      },
    ],
    [handleRetry, openDetail, retryingId],
  );

  return (
    <div className="jobscope-page">
      <PageHero
        kicker="Tasks"
        title="采集任务"
        description="采集任务页主要用于介绍任务模块的使用方式。用户可以在这里填写岗位关键词、选择采集平台、设置抓取页数，并在同一页面中查看任务执行进度、异常原因与重试情况。"
        metrics={[
          { label: '当前列表', value: `${total}`, hint: '用于展示当前筛选条件下的任务数量' },
          { label: '刷新策略', value: '12s', hint: '用于自动更新进行中的任务状态' },
          { label: '异常说明', value: '已支持', hint: '用于查看失败原因与后续处理入口' },
          { label: '详情查看', value: '可用', hint: '用于阅读执行摘要与任务日志' },
        ]}
        highlights={['任务创建说明', '执行状态展示', '异常处理入口', '详情信息查看']}
        sideStats={[
          { label: '分页状态', value: `${page}/${Math.max(1, Math.ceil(total / pageSize || 1))}`, hint: '方便说明当前列表浏览位置' },
          { label: '详情面板', value: drawerOpen ? '已打开' : '未打开', hint: '用于展示单个任务的详细信息' },
          { label: '任务状态', value: list.filter((item) => item.status === 'running').length ? '进行中' : '平稳', hint: '用于帮助判断是否存在活跃任务' },
        ]}
        actions={
          <>
            <Button type="primary" onClick={() => void handleCreateTask()} loading={submitting}>
              新建采集任务
            </Button>
            <Button onClick={() => void fetchTasks(1, pageSize)}>更新任务列表</Button>
          </>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card className="jobscope-card" bordered={false} title="创建采集任务">
            <Form<TaskFormValues> form={createForm} layout="vertical" initialValues={{ platform: 'intern_monk', maxPages: 5 }}>
              <Form.Item label="岗位关键词" name="keyword" rules={[{ required: true, message: '请输入岗位关键词' }]}>
                <Input placeholder="如：前端开发 / 数据分析" maxLength={40} />
              </Form.Item>
              <Form.Item label="采集平台" name="platform" rules={[{ required: true, message: '请选择采集平台' }]}>
                <Select options={PLATFORM_OPTIONS} />
              </Form.Item>
              <Form.Item label="抓取页数" name="maxPages" rules={[{ required: true, message: '请输入抓取页数' }]}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
              <Typography.Paragraph type="secondary">创建任务后，页面会返回任务列表，并可进一步查看该任务的执行摘要、处理进度和日志信息。</Typography.Paragraph>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card className="jobscope-card" bordered={false} title="任务筛选">
            <Form<FilterValues> form={filterForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="关键词" name="keyword">
                    <Input placeholder="筛选关键词" allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="平台" name="platform">
                    <Select allowClear options={PLATFORM_OPTIONS} placeholder="全部平台" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="状态" name="status">
                    <Select
                      allowClear
                      placeholder="全部状态"
                      options={Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button type="primary" onClick={() => void fetchTasks(1, pageSize)}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    filterForm.resetFields();
                    void fetchTasks(1, pageSize);
                  }}
                >
                  重置
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>

      <StatePanel loading={loading} error={error} empty={!list.length} emptyDescription="暂无采集任务，可先创建一个关键词任务" onRetry={() => void fetchTasks(page, pageSize)}>
        <Card className="jobscope-card" bordered={false} title="任务列表">
          <Table<TaskItem>
            rowKey="id"
            columns={columns}
            dataSource={list}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              onChange: (nextPage, nextPageSize) => {
                void fetchTasks(nextPage, nextPageSize);
              },
            }}
          />
        </Card>
      </StatePanel>

      <Drawer
        title="任务详情"
        width={520}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
        destroyOnHidden
      >
        <StatePanel loading={detailLoading} empty={!selectedTask} emptyDescription="请选择任务查看详情">
          {selectedTask ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="关键词">{selectedTask.keyword}</Descriptions.Item>
                <Descriptions.Item label="平台">
                  <StatusTag type="platform" value={selectedTask.platform} />
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <StatusTag type="task" value={selectedTask.status} />
                </Descriptions.Item>
                <Descriptions.Item label="执行摘要">{selectedTask.summary}</Descriptions.Item>
                <Descriptions.Item label="任务耗时">{selectedTask.durationText}</Descriptions.Item>
                <Descriptions.Item label="失败原因">{selectedTask.errorMessage ?? '--'}</Descriptions.Item>
              </Descriptions>
              <Card size="small" title="任务日志" className="jobscope-card">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {selectedTask.logs.map((log) => (
                    <Typography.Paragraph key={log} style={{ marginBottom: 0 }}>
                      {log}
                    </Typography.Paragraph>
                  ))}
                </Space>
              </Card>
            </Space>
          ) : null}
        </StatePanel>
      </Drawer>
    </div>
  );
}
