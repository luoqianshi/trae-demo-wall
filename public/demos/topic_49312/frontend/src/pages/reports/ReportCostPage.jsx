import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, DatePicker, Spin, Result, Empty } from 'antd';
import {
  DollarOutlined, TeamOutlined, RiseOutlined,
  FallOutlined, FundOutlined, LockOutlined
} from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const ReportCostPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState('');

  const user = getUser();
  const isEmployeeRole = user && hasRole('employee');

  // 普通员工无权限
  if (isEmployeeRole) {
    return (
      <Card>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限查看人力成本报表，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取人力成本报表数据 */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (month) params.month = month;
      if (user && hasRole('manager') && user.departmentId) {
        params.departmentId = user.departmentId;
      }
      const res = await get('/reports/cost', params);
      setData(res.data || res);
    } catch (err) {
      console.error('获取人力成本报表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  const monthlyCost = data?.monthlyCost || {};
  const avgCost = data?.averageCost || {};
  const deptDistribution = data?.departmentCostDistribution || [];
  const costTrend = data?.costTrend || [];

  const totalGross = monthlyCost.totalGross || 0;

  // 部门成本分布：计算占比
  const departmentList = deptDistribution.map(item => {
    const pct = totalGross > 0 ? Number(((item.totalGross / totalGross) * 100).toFixed(1)) : 0;
    return {
      key: item.departmentId,
      department: item.departmentName,
      headcount: item.employeeCount || 0,
      totalCost: item.totalGross || 0,
      avgCost: item.avgGross || 0,
      percentage: pct,
    };
  });

  /** 部门成本分布列 */
  const deptColumns = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '人数',
      dataIndex: 'headcount',
      key: 'headcount',
      width: 80,
      align: 'center',
    },
    {
      title: '薪资总成本(元)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 140,
      align: 'right',
      render: (val) => (val != null ? `¥${Number(val).toLocaleString()}` : '-'),
    },
    {
      title: '人均成本(元)',
      dataIndex: 'avgCost',
      key: 'avgCost',
      width: 130,
      align: 'right',
      render: (val) => (val != null ? `¥${Number(val).toLocaleString()}` : '-'),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 200,
      render: (val) => <Progress percent={Number(val) || 0} size="small" />,
    },
  ];

  /** 月度成本趋势列 */
  const trendColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
    },
    {
      title: '人数',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 80,
      align: 'center',
    },
    {
      title: '薪资总成本(元)',
      dataIndex: 'totalGross',
      key: 'totalGross',
      width: 150,
      align: 'right',
      render: (val) => (val != null ? `¥${Number(val).toLocaleString()}` : '-'),
    },
    {
      title: '人均成本(元)',
      dataIndex: 'avgCost',
      key: 'avgCost',
      width: 130,
      align: 'right',
      render: (val) => (val != null ? `¥${Number(val).toLocaleString()}` : '-'),
    },
  ];

  return (
    <Card
      title="人力成本看板"
      extra={
        <DatePicker
          picker="month"
          placeholder="选择月份"
          onChange={(date) => setMonth(date ? date.format('YYYY-MM') : '')}
          allowClear
          style={{ width: 160 }}
        />
      }
    >
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
                    title="月度薪资总成本"
                    value={totalGross}
                    prefix={<DollarOutlined />}
                    formatter={(val) => `¥${Number(val || 0).toLocaleString()}`}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="月度实发工资"
                    value={monthlyCost.totalNet || 0}
                    prefix={<DollarOutlined />}
                    formatter={(val) => `¥${Number(val || 0).toLocaleString()}`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="月度人均成本"
                    value={avgCost.avgGross || 0}
                    prefix={<TeamOutlined />}
                    formatter={(val) => `¥${Number(val || 0).toLocaleString()}`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="参保人数"
                    value={costTrend.length > 0 ? (costTrend[costTrend.length - 1]?.employeeCount || 0) : 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 成本构成 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title="薪资构成" size="small">
                  <Row gutter={16}>
                    <Col span={4}>
                      <Statistic title="基本工资" value={monthlyCost.totalBase || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title="岗位工资" value={monthlyCost.totalPosition || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title="绩效奖金" value={monthlyCost.totalBonus || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title="补贴" value={monthlyCost.totalAllowance || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title="社保" value={monthlyCost.totalInsurance || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title="公积金" value={monthlyCost.totalFund || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* 部门成本分布 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title="部门成本分布" size="small">
                  <Table
                    columns={deptColumns}
                    dataSource={departmentList}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 成本趋势 */}
            <Row gutter={16}>
              <Col span={24}>
                <Card title="成本趋势（最近6个月）" size="small">
                  <Table
                    columns={trendColumns}
                    dataSource={costTrend}
                    rowKey="month"
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

export default ReportCostPage;
