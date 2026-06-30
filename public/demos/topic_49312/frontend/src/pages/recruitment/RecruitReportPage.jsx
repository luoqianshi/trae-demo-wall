import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Spin, message } from 'antd';
import {
  TeamOutlined, CheckCircleOutlined, RiseOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { get } from '@/utils/request';

const RecruitReportPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await get('/reports/recruitment');
      const data = res.data || res;
      setReportData(data);
    } catch (err) {
      console.error('获取招聘报表失败:', err);
      message.error('获取招聘报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // 从后端数据安全提取数值
  const totalResumes = reportData?.resumeConversionRate?.total ?? 0;
  const interviewPassRate = reportData?.interviewPassRate?.passRate ?? 0;
  const onboardRate = reportData?.hireRate ?? 0;
  const avgCycle = reportData?.avgRecruitmentCycle ?? 0;

  // 各岗位数据：jobApplications -> jobStats
  const jobStats = (reportData?.jobApplications || []).map((item) => ({
    key: item.jobId,
    jobId: item.jobId,
    jobTitle: item.jobName,
    applyCount: item.resumeCount || 0,
    // 以下数据需要额外接口或后端补充，暂时给默认值
    interviewCount: 0,
    offerCount: 0,
    onboardCount: 0,
  }));

  // 简历状态分布：resumeConversionRate -> statusDistribution
  const conversionRate = reportData?.resumeConversionRate || {};
  const statusDistribution = [
    { status: 'pending', name: '待沟通', count: conversionRate.pending?.count || 0, percent: conversionRate.pending?.rate || 0, color: '#1890ff' },
    { status: 'screening', name: '筛选中', count: conversionRate.screening?.count || 0, percent: conversionRate.screening?.rate || 0, color: '#13c2c2' },
    { status: 'interview', name: '面试中', count: conversionRate.interview?.count || 0, percent: conversionRate.interview?.rate || 0, color: '#722ed1' },
    { status: 'offer', name: '已发Offer', count: conversionRate.offer?.count || 0, percent: conversionRate.offer?.rate || 0, color: '#fa8c16' },
    { status: 'hired', name: '已入职', count: conversionRate.hired?.count || 0, percent: conversionRate.hired?.rate || 0, color: '#52c41a' },
    { status: 'rejected', name: '已淘汰', count: conversionRate.rejected?.count || 0, percent: conversionRate.rejected?.rate || 0, color: '#f5222d' },
  ].filter(item => item.count > 0);

  const jobColumns = [
    {
      title: '岗位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      ellipsis: true,
    },
    {
      title: '投递量',
      dataIndex: 'applyCount',
      key: 'applyCount',
      width: 90,
      sorter: (a, b) => a.applyCount - b.applyCount,
    },
    {
      title: '面试量',
      dataIndex: 'interviewCount',
      key: 'interviewCount',
      width: 90,
    },
    {
      title: 'Offer数',
      dataIndex: 'offerCount',
      key: 'offerCount',
      width: 90,
    },
    {
      title: '入职数',
      dataIndex: 'onboardCount',
      key: 'onboardCount',
      width: 90,
    },
    {
      title: '转化率',
      key: 'conversionRate',
      width: 100,
      render: (_, record) => {
        const rate = record.applyCount
          ? ((record.onboardCount / record.applyCount) * 100).toFixed(1)
          : 0;
        return <span>{rate}%</span>;
      },
    },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总简历数"
              value={totalResumes}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="面试通过率"
              value={interviewPassRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="入职率"
              value={onboardRate}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均招聘周期"
              value={avgCycle}
              suffix="天"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 各岗位投递量和转化数据 */}
      <Card title="各岗位投递数据" style={{ marginBottom: 24 }}>
        <Table
          columns={jobColumns}
          dataSource={jobStats}
          rowKey="jobId"
          pagination={false}
          size="middle"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      {/* 各状态占比 */}
      <Card title="简历状态分布">
        <Row gutter={[24, 24]}>
          {statusDistribution.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.status}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Number(item.percent) || 0}
                  size={100}
                  strokeColor={item.color}
                  format={(percent) => `${percent}%`}
                />
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500 }}>
                  {item.name}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  {item.count} 人
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default RecruitReportPage;
