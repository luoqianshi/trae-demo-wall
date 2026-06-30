import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Spin, Result, Empty } from 'antd';
import {
  LogoutOutlined, SwapOutlined, RiseOutlined,
  FallOutlined, WarningOutlined, LockOutlined
} from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const ReportTurnoverPage = () => {
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
          subTitle="您没有权限查看异动流失报表，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取异动流失报表数据 */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user && hasRole('manager') && user.departmentId) {
        params.departmentId = user.departmentId;
      }
      const res = await get('/reports/turnover', params);
      setData(res.data || res);
    } catch (err) {
      console.error('获取异动流失报表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const monthlyRate = data?.monthlyTurnoverRate || {};
  const classification = data?.turnoverClassification || {};
  const changeTrend = data?.changeTrend || [];
  const turnoverTrend = data?.turnoverTrend || [];

  // 离职类型列表
  const resignTypeList = [
    { type: 'voluntary', count: classification.voluntary?.count || 0, percentage: classification.voluntary?.rate || 0 },
    { type: 'involuntary', count: classification.involuntary?.count || 0, percentage: classification.involuntary?.rate || 0 },
    { type: 'other', count: classification.other?.count || 0, percentage: classification.other?.rate || 0 },
  ].filter(item => item.count > 0);

  // 异动趋势数据（transferCount, promotionCount, demotionCount）
  const changeTrendData = changeTrend.map(item => ({
    key: item.month,
    month: item.month,
    promotion: item.promotionCount || 0,
    transfer: item.transferCount || 0,
    salaryChange: item.demotionCount || 0,
    other: 0,
  }));

  /** 主动/被动离职分类列 */
  const resignTypeColumns = [
    {
      title: '离职类型',
      dataIndex: 'type',
      key: 'type',
      render: (val) => {
        const map = {
          voluntary: { text: '主动离职', color: 'orange' },
          involuntary: { text: '被动离职', color: 'red' },
          other: { text: '其他', color: 'default' },
        };
        const item = map[val] || { text: val, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
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

  /** 异动趋势列 */
  const changeColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
    },
    {
      title: '晋升',
      dataIndex: 'promotion',
      key: 'promotion',
      width: 80,
      align: 'center',
      render: (val) => <Tag color="green">{val || 0}</Tag>,
    },
    {
      title: '调岗',
      dataIndex: 'transfer',
      key: 'transfer',
      width: 80,
      align: 'center',
      render: (val) => <Tag color="blue">{val || 0}</Tag>,
    },
    {
      title: '降级/降薪',
      dataIndex: 'salaryChange',
      key: 'salaryChange',
      width: 100,
      align: 'center',
      render: (val) => <Tag color="purple">{val || 0}</Tag>,
    },
  ];

  /** 离职趋势列 */
  const trendColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
    },
    {
      title: '离职人数',
      dataIndex: 'resignedCount',
      key: 'resignedCount',
      width: 100,
      align: 'center',
      render: (val) => <span style={{ color: '#f5222d' }}>{val || 0}</span>,
    },
  ];

  return (
    <Card title="异动流失看板">
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
                    title="当月离职率"
                    value={monthlyRate.rate || 0}
                    suffix="%"
                    prefix={<LogoutOutlined />}
                    precision={1}
                    valueStyle={{
                      color: (monthlyRate.rate || 0) > 5 ? '#f5222d' : '#52c41a',
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="当月离职人数"
                    value={monthlyRate.resignedCount || 0}
                    prefix={<FallOutlined />}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="当月员工总数"
                    value={monthlyRate.totalEmployees || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="离职总人数"
                    value={classification.total || 0}
                    prefix={<SwapOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 异动趋势 + 离职分类 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={16}>
                <Card title="异动趋势（最近12个月）" size="small">
                  <Table
                    columns={changeColumns}
                    dataSource={changeTrendData}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="离职类型分类" size="small">
                  <Table
                    columns={resignTypeColumns}
                    dataSource={resignTypeList}
                    rowKey="type"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            {/* 离职趋势 */}
            <Row gutter={16}>
              <Col span={24}>
                <Card title="离职趋势（最近12个月）" size="small">
                  <Table
                    columns={trendColumns}
                    dataSource={turnoverTrend}
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

export default ReportTurnoverPage;
