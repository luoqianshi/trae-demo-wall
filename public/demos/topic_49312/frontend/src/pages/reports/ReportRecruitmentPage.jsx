import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, DatePicker, Spin, Result, Empty } from 'antd';
import {
  TeamOutlined, FileTextOutlined, CheckCircleOutlined,
  UserAddOutlined, ClockCircleOutlined, LockOutlined
} from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const ReportRecruitmentPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = getUser();
  const canView = user && hasRole('admin', 'hr', 'manager');
  const isEmployeeRole = user && hasRole('employee');

  // 普通员工无权限
  if (isEmployeeRole) {
    return (
      <Card>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限查看招聘报表，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取招聘报表数据 */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user && hasRole('manager') && user.departmentId) {
        params.departmentId = user.departmentId;
      }
      const res = await get('/reports/recruitment', params);
      setData(res.data || res);
    } catch (err) {
      console.error('获取招聘报表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // 从后端数据构建简历状态列表
  const conversionRate = data?.resumeConversionRate || {};
  const resumeStatusList = [
    { status: 'pending', count: conversionRate.pending?.count || 0, percentage: conversionRate.pending?.rate || 0 },
    { status: 'screening', count: conversionRate.screening?.count || 0, percentage: conversionRate.screening?.rate || 0 },
    { status: 'interview', count: conversionRate.interview?.count || 0, percentage: conversionRate.interview?.rate || 0 },
    { status: 'offer', count: conversionRate.offer?.count || 0, percentage: conversionRate.offer?.rate || 0 },
    { status: 'hired', count: conversionRate.hired?.count || 0, percentage: conversionRate.hired?.rate || 0 },
    { status: 'rejected', count: conversionRate.rejected?.count || 0, percentage: conversionRate.rejected?.rate || 0 },
  ].filter(item => item.count > 0);

  // 岗位统计数据
  const jobStatistics = (data?.jobApplications || []).map(item => ({
    key: item.jobId,
    jobTitle: item.jobName,
    department: item.departmentName || '-',
    applyCount: item.resumeCount || 0,
    interviewCount: 0,
    hireCount: 0,
  }));

  /** 简历状态分布列 */
  const resumeColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const colorMap = {
          pending: 'blue',
          screening: 'cyan',
          interview: 'orange',
          offer: 'green',
          rejected: 'red',
          hired: 'purple',
        };
        const nameMap = {
          pending: '待沟通',
          screening: '初筛中',
          interview: '面试中',
          offer: '已发Offer',
          rejected: '已淘汰',
          hired: '已入职',
        };
        return <Tag color={colorMap[val] || 'default'}>{nameMap[val] || val}</Tag>;
      },
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      align: 'center',
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 200,
      render: (val) => <Progress percent={Number(val) || 0} size="small" />,
    },
  ];

  /** 岗位投递统计列 */
  const jobColumns = [
    {
      title: '岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '投递量',
      dataIndex: 'applyCount',
      key: 'applyCount',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.applyCount - b.applyCount,
    },
    {
      title: '面试人数',
      dataIndex: 'interviewCount',
      key: 'interviewCount',
      width: 100,
      align: 'center',
    },
    {
      title: '入职人数',
      dataIndex: 'hireCount',
      key: 'hireCount',
      width: 100,
      align: 'center',
    },
  ];

  return (
    <Card title="招聘看板">
      <Spin spinning={loading}>
        {!data ? (
          <Empty description="暂无数据" />
        ) : (
          <>
            {/* 汇总统计 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={5}>
                <Card>
                  <Statistic
                    title="简历总量"
                    value={conversionRate.total || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card>
                  <Statistic
                    title="面试通过率"
                    value={data?.interviewPassRate?.passRate || 0}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    precision={1}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card>
                  <Statistic
                    title="入职率"
                    value={data?.hireRate || 0}
                    suffix="%"
                    prefix={<UserAddOutlined />}
                    precision={1}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card>
                  <Statistic
                    title="平均招聘周期"
                    value={data?.avgRecruitmentCycle || 0}
                    suffix="天"
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="入职人数"
                    value={conversionRate.hired?.count || 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 简历各状态占比 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="简历状态分布" size="small">
                  <Table
                    columns={resumeColumns}
                    dataSource={resumeStatusList}
                    rowKey="status"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="岗位投递统计" size="small">
                  <Table
                    columns={jobColumns}
                    dataSource={jobStatistics}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </Card>
  );
};

export default ReportRecruitmentPage;
