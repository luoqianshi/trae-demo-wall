import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Spin, Result, Empty } from 'antd';
import {
  TeamOutlined, PieChartOutlined, CalendarOutlined,
  ClockCircleOutlined, HomeOutlined, LockOutlined
} from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const ReportStaffingPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = getUser();
  const isEmployeeRole = user && hasRole('employee');

  // 普通员工无权限
  if (isEmployeeRole) {
    return (
      <Card>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限查看人员结构报表，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取人员结构报表数据 */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user && hasRole('manager') && user.departmentId) {
        params.departmentId = user.departmentId;
      }
      const res = await get('/reports/staffing', params);
      setData(res.data || res);
    } catch (err) {
      console.error('获取人员结构报表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // 计算总人数和占比辅助函数
  const calcTotal = (arr) => (arr || []).reduce((sum, item) => sum + (item.count || 0), 0);
  const addPercentage = (arr, total) => (arr || []).map(item => ({
    ...item,
    percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
  }));

  const deptDistribution = data?.departmentDistribution || [];
  const eduDistribution = data?.educationDistribution || [];
  const ageDistribution = data?.ageDistribution || [];
  const tenureDistribution = data?.tenureDistribution || [];
  const staffingRate = data?.staffingRate || {};

  const totalEmployees = staffingRate.activeEmployees || calcTotal(deptDistribution);
  const totalBudget = staffingRate.totalHeadcount || 0;
  const eduTotal = calcTotal(eduDistribution);
  const ageTotal = calcTotal(ageDistribution);
  const tenureTotal = calcTotal(tenureDistribution);

  const eduList = addPercentage(eduDistribution, eduTotal);
  const ageList = addPercentage(ageDistribution, ageTotal);
  const tenureList = addPercentage(tenureDistribution, tenureTotal);

  // 部门列表：计算每个部门的编制使用率
  const departmentList = deptDistribution.map(item => ({
    key: item.departmentId,
    department: item.departmentName,
    currentCount: item.employeeCount || 0,
    budgetCount: 0,
    usageRate: 0,
  }));

  /** 部门人数分布列 */
  const deptColumns = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '现有人数',
      dataIndex: 'currentCount',
      key: 'currentCount',
      width: 100,
      align: 'center',
    },
    {
      title: '编制人数',
      dataIndex: 'budgetCount',
      key: 'budgetCount',
      width: 100,
      align: 'center',
    },
    {
      title: '编制使用率',
      dataIndex: 'usageRate',
      key: 'usageRate',
      width: 200,
      render: (val) => {
        const percent = val || 0;
        const color = percent >= 100 ? '#f5222d' : percent >= 90 ? '#fa8c16' : '#52c41a';
        return <Progress percent={percent} size="small" strokeColor={color} />;
      },
    },
  ];

  /** 学历分布列 */
  const eduColumns = [
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
    },
    {
      title: '人数',
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

  /** 年龄段分布列 */
  const ageColumns = [
    {
      title: '年龄段',
      dataIndex: 'ageRange',
      key: 'ageRange',
    },
    {
      title: '人数',
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

  /** 司龄分布列 */
  const tenureColumns = [
    {
      title: '司龄',
      dataIndex: 'tenureRange',
      key: 'tenureRange',
    },
    {
      title: '人数',
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

  return (
    <Card title="人员结构看板">
      <Spin spinning={loading}>
        {!data ? (
          <Empty description="暂无数据" />
        ) : (
          <>
            {/* 汇总统计 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总人数"
                    value={totalEmployees}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总编制"
                    value={totalBudget}
                    prefix={<HomeOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="编制使用率"
                    value={staffingRate.rate || 0}
                    suffix="%"
                    prefix={<PieChartOutlined />}
                    precision={1}
                    valueStyle={{ color: (staffingRate.rate || 0) >= 100 ? '#f5222d' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="部门数量"
                    value={deptDistribution.length}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 部门人数分布 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title="部门人数分布" size="small">
                  <Table
                    columns={deptColumns}
                    dataSource={departmentList}
                    rowKey="key"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            {/* 学历分布 + 年龄段分布 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="学历分布" size="small">
                  <Table
                    columns={eduColumns}
                    dataSource={eduList}
                    rowKey="education"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="年龄段分布" size="small">
                  <Table
                    columns={ageColumns}
                    dataSource={ageList}
                    rowKey="ageRange"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            {/* 司龄分布 */}
            <Row gutter={16}>
              <Col span={12}>
                <Card title="司龄分布" size="small">
                  <Table
                    columns={tenureColumns}
                    dataSource={tenureList}
                    rowKey="tenureRange"
                    pagination={false}
                    size="small"
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

export default ReportStaffingPage;
