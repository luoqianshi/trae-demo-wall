'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Card, Col, Descriptions, Drawer, Form, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getJobDetail, getJobList } from '@/services/jobs';
import { DEFAULT_PAGE_SIZE, PLATFORM_OPTIONS } from '@/constants';
import type { CrawlPlatform, JobDetail, JobItem, JobQueryParams } from '@/types/domain';
import { PageHero } from '@/components/shared/page-hero';
import { StatePanel } from '@/components/shared/state-panel';
import { StatusTag } from '@/components/shared/status-tag';

interface JobFilterValues extends Omit<JobQueryParams, 'page' | 'pageSize'> {}

const degreeOptions = ['不限', '大专', '本科', '硕士'];
const experienceOptions = ['不限', '应届', '1年内', '1-3年', '3-5年'];
const updateOptions = [1, 3, 7, 14].map((day) => ({ label: `近 ${day} 天`, value: day }));

export function JobsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<JobFilterValues>();
  const [list, setList] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const requestIdRef = useRef(0);

  const fetchJobs = useCallback(
    async (targetPage = page, targetPageSize = pageSize) => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const values = form.getFieldsValue();
        const response = await getJobList({
          page: targetPage,
          pageSize: targetPageSize,
          keyword: values.keyword?.trim() || undefined,
          platform: values.platform,
          city: values.city?.trim() || undefined,
          degree: values.degree,
          experience: values.experience,
          salaryKeyword: values.salaryKeyword?.trim() || undefined,
          updatedWithinDays: values.updatedWithinDays,
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
        setError(err instanceof Error ? err.message : '岗位列表加载失败');
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [form, page, pageSize],
  );

  useEffect(() => {
    void fetchJobs(1, DEFAULT_PAGE_SIZE);
  }, [fetchJobs]);

  const openDetail = useCallback(async (jobId: string | number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await getJobDetail(jobId);
      setDetail(response);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '岗位详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  const columns = useMemo<ColumnsType<JobItem>>(
    () => [
      { title: '岗位名称', dataIndex: 'title', key: 'title', width: 220, ellipsis: true },
      { title: '公司', dataIndex: 'companyName', key: 'companyName', width: 180 },
      { title: '平台', dataIndex: 'platform', key: 'platform', width: 120, render: (value: CrawlPlatform) => <StatusTag type="platform" value={value} /> },
      { title: '城市', dataIndex: 'city', key: 'city', width: 100 },
      { title: '薪资', dataIndex: 'salaryText', key: 'salaryText', width: 120 },
      { title: '学历', dataIndex: 'degreeText', key: 'degreeText', width: 100, render: (value: string | null) => value ?? '--' },
      { title: '经验', dataIndex: 'experienceText', key: 'experienceText', width: 100, render: (value: string | null) => value ?? '--' },
      {
        title: '技能标签',
        dataIndex: 'tags',
        key: 'tags',
        render: (tags: string[]) => (
          <Space wrap>
            {tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ),
      },
      { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
      { title: '操作', key: 'action', width: 120, render: (_, record) => <Button type="link" onClick={() => void openDetail(record.id)}>查看详情</Button> },
    ],
    [openDetail],
  );

  return (
    <div className="jobscope-page">
      <PageHero
        kicker="Jobs"
        title="岗位数据"
        description="岗位数据页主要用于介绍采集结果如何被浏览和筛选。用户可以按照关键词、平台、地区、学历、经验、薪资和更新时间等条件缩小结果范围，并在详情面板中查看标准化字段与来源信息。"
        metrics={[
          { label: '结果总数', value: `${total}`, hint: '用于展示当前筛选后的岗位数量' },
          { label: '分页尺寸', value: `${pageSize}`, hint: '用于说明列表每页展示规模' },
          { label: '详情模式', value: 'Drawer', hint: '用于展示标准化字段与来源信息' },
          { label: '数据接入', value: 'Service Adapter', hint: '用于保持页面与接口之间的边界清晰' },
        ]}
        highlights={['筛选条件说明', '结果列表浏览', '详情结构展示', '来源信息保留']}
        sideStats={[
          { label: '当前页', value: `${page}`, hint: '用于说明当前浏览到的分页位置' },
          { label: '详情状态', value: detailOpen ? '已打开' : '未打开', hint: '用于判断是否正在查看单条岗位信息' },
          { label: '数据状态', value: loading ? '加载中' : '可浏览', hint: '用于反馈当前结果区的加载情况' },
        ]}
        actions={
          <>
            <Button type="primary" onClick={() => void fetchJobs(1, pageSize)}>
              查看岗位结果
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                void fetchJobs(1, pageSize);
              }}
            >
              清空筛选条件
            </Button>
          </>
        }
      />

      <Card className="jobscope-card" bordered={false} title="岗位筛选">
        <Form<JobFilterValues> form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="关键词" name="keyword">
                <Input placeholder="岗位名/公司名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="平台" name="platform">
                <Select allowClear options={PLATFORM_OPTIONS} placeholder="全部平台" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="地区" name="city">
                <Input placeholder="如：上海 / 北京" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="学历" name="degree">
                <Select allowClear options={degreeOptions.map((value) => ({ label: value, value }))} placeholder="全部学历" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="经验" name="experience">
                <Select allowClear options={experienceOptions.map((value) => ({ label: value, value }))} placeholder="全部经验" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="薪资关键词" name="salaryKeyword">
                <Input placeholder="如：20k / 200/天" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} xl={6}>
              <Form.Item label="更新时间" name="updatedWithinDays">
                <Select allowClear options={updateOptions} placeholder="全部时间" />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" onClick={() => void fetchJobs(1, pageSize)}>
              查询
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                void fetchJobs(1, pageSize);
              }}
            >
              重置
            </Button>
          </Space>
        </Form>
      </Card>

      <StatePanel loading={loading} error={error} empty={!list.length} emptyDescription="暂无岗位数据，请先完成采集任务或调整筛选条件" onRetry={() => void fetchJobs(page, pageSize)}>
        <Card className="jobscope-card" bordered={false} title="岗位结果">
          <Table<JobItem>
            rowKey="id"
            columns={columns}
            dataSource={list}
            scroll={{ x: 1280 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              onChange: (nextPage, nextPageSize) => {
                void fetchJobs(nextPage, nextPageSize);
              },
            }}
          />
        </Card>
      </StatePanel>

      <Drawer
        title="岗位详情"
        width={640}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        destroyOnHidden
      >
        <StatePanel loading={detailLoading} empty={!detail} emptyDescription="请选择岗位查看详情">
          {detail ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="岗位名称">{detail.title}</Descriptions.Item>
                <Descriptions.Item label="公司">{detail.companyName}</Descriptions.Item>
                <Descriptions.Item label="平台">
                  <StatusTag type="platform" value={detail.platform} />
                </Descriptions.Item>
                <Descriptions.Item label="薪资范围">{detail.salaryRange}</Descriptions.Item>
                <Descriptions.Item label="公司信息">{detail.companyInfo}</Descriptions.Item>
                <Descriptions.Item label="地址">{detail.address ?? '--'}</Descriptions.Item>
                <Descriptions.Item label="来源链接">{detail.sourceUrl ?? '--'}</Descriptions.Item>
                <Descriptions.Item label="原始来源ID">{detail.sourceRawId ?? '--'}</Descriptions.Item>
              </Descriptions>
              <Card size="small" title="技能标签" className="jobscope-card">
                <Space wrap>
                  {detail.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Card>
              <Card size="small" title="职位描述" className="jobscope-card">
                <Typography.Paragraph>{detail.description}</Typography.Paragraph>
              </Card>
              <Card size="small" title="岗位要求" className="jobscope-card">
                <Typography.Paragraph>{detail.requirements ?? '暂无结构化岗位要求'}</Typography.Paragraph>
              </Card>
            </Space>
          ) : null}
        </StatePanel>
      </Drawer>
    </div>
  );
}
