import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, DatePicker, Spin, Result, Empty } from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined,
  WarningOutlined, RiseOutlined, LockOutlined
} from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const ReportAttendancePage = () => {
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
          subTitle="您没有权限查看考勤人效报表，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取考勤人效报表数据 */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (month) params.month = month;
      if (user && hasRole('manager') && user.departmentId) {
        params.departmentId = user.departmentId;
      }
      const res = await get('/reports/attendance', params);
      setData(res.data || res);
    } catch (err) {
      console.error('获取考勤人效报表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  const deptComparison = data?.departmentComparison || [];
  const monthlyTrend = data?.monthlyTrend || [];

  /** 部门考勤对比列 */
  const deptColumns = [
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: '考勤记录数',
      dataIndex: 'totalRecords',
      key: 'totalRecords',
      width: 100,
      align: 'center',
    },
    {
      title: '正常',
      dataIndex: 'normalCount',
      key: 'normalCount',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: '#52c41a' }}>{val || 0}</span>,
    },
    {
      title: '迟到',
      dataIndex: 'lateCount',
      key: 'lateCount',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: val > 0 ? '#f5222d' : '#52c41a' }}>{val || 0}</span>,
    },
    {
      title: '早退',
      dataIndex: 'earlyCount',
      key: 'earlyCount',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: val > 0 ? '#fa8c16' : '#52c41a' }}>{val || 0}</span>,
    },
    {
      title: '缺勤',
      dataIndex: 'absentCount',
      key: 'absentCount',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: val > 0 ? '#f5222d' : '#52c41a' }}>{val || 0}</span>,
    },
    {
      title: '请假',
      dataIndex: 'leaveCount',
      key: 'leaveCount',
      width: 80,
      align: 'center',
    },
    {
      title: '出勤率',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 150,
      render: (val) => {
        const percent = Number(val) || 0;
        const color = percent < 95 ? '#f5222d' : percent < 98 ? '#fa8c16' : '#52c41a';
        return <Progress percent={percent} size="small" strokeColor={color} />;
      },
    },
    {
      title: '迟到率',
      dataIndex: 'lateRate',
      key: 'lateRate',
      width: 120,
      render: (val) => <Progress percent={Number(val) || 0} size="small" strokeColor="#fa8c16" />,
    },
    {
      title: '加班率',
      dataIndex: 'overtimeRate',
      key: 'overtimeRate',
      width: 120,
      render: (val) => <Progress percent={Number(val) || 0} size="small" strokeColor="#1890ff" />,
    },
  ];

  /** 月度趋势列 */
  const trendColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
    },
    {
      title: '记录数',
      dataIndex: 'totalRecords',
      key: 'totalRecords',
      width: 80,
      align: 'center',
    },
    {
      title: '出勤率',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 150,
      render: (val) => <Progress percent={Number(val) || 0} size="small" strokeColor="#52c41a" />,
    },
    {
      title: '迟到率',
      dataIndex: 'lateRate',
      key: 'lateRate',
      width: 150,
      render: (val) => <Progress percent={Number(val) || 0} size="small" strokeColor="#fa8c16" />,
    },
    {
      title: '缺勤率',
      dataIndex: 'absentRate',
      key: 'absentRate',
      width: 150,
      render: (val) => <Progress percent={Number(val) || 0} size="small" strokeColor="#f5222d" />,
    },
    {
      title: '加班率',
      dataIndex: 'overtimeRate',
      key: 'overtimeRate',
      width: 150,
      render: (val) => <Progress percent={Number(val) || 0} size="small" strokeColor="#1890ff" />,
    },
  ];

  return (
    <Card
      title="考勤人效看板"
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
                    title="平均出勤率"
                    value={data.attendanceRate || 0}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    precision={1}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均迟到率"
                    value={data.lateRate || 0}
                    suffix="%"
                    prefix={<WarningOutlined />}
                    precision={1}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均加班率"
                    value={data.overtimeRate || 0}
                    suffix="%"
                    prefix={<RiseOutlined />}
                    precision={1}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="部门数量"
                    value={deptComparison.length}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 部门考勤对比 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title="部门考勤对比" size="small">
                  <Table
                    columns={deptColumns}
                    dataSource={deptComparison}
                    rowKey="departmentId"
                    pagination={false}
                    size="small"
                    scroll={{ x: 1000 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 月度趋势 */}
            <Row gutter={16}>
              <Col span={24}>
                <Card title="月度趋势（最近6个月）" size="small">
                  <Table
                    columns={trendColumns}
                    dataSource={monthlyTrend}
                    rowKey="month"
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
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

export default ReportAttendancePage;
