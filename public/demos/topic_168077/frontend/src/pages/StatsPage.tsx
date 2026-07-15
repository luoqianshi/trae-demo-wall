import React, { useState, useEffect, useMemo } from 'react';
import { Card, Select, Statistic, Row, Col, Table, Tag, message, Spin, Tabs, Space } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined, FireOutlined } from '@ant-design/icons';
import { statsAPI, deviceLogAPI, childAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatsChart from '../components/StatsChart';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

export default function StatsPage() {
  const { role, childId: authChildId } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    childAPI.list().then(res => {
      setChildren(res.data);
      if (role === 'child' && authChildId) {
        setSelectedChild(authChildId);
      }
    });
  }, [role, authChildId]);

  useEffect(() => {
    if (selectedChild) fetchData(selectedChild);
  }, [selectedChild]);

  const fetchData = async (childId: string) => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        statsAPI.get(childId),
        deviceLogAPI.list({ child_id: childId }),
      ]);
      setStats(statsRes.data);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 按周/月汇总数据（前端模拟计算）
  const weeklyData = useMemo(() => {
    const map: Record<string, { total: number; confirmed: number }> = {};
    logs.forEach((log: any) => {
      if (!log.created_at) return;
      const d = dayjs(log.created_at);
      const weekKey = d.format('YYYY-第W周');
      if (!map[weekKey]) map[weekKey] = { total: 0, confirmed: 0 };
      map[weekKey].total++;
      if (log.status === 'confirmed' || log.math_correct) map[weekKey].confirmed++;
    });
    return Object.entries(map).slice(0, 10).map(([week, v]) => ({ week, ...v }));
  }, [logs]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { total: number; confirmed: number }> = {};
    logs.forEach((log: any) => {
      if (!log.created_at) return;
      const d = dayjs(log.created_at);
      const monthKey = d.format('YYYY-MM');
      if (!map[monthKey]) map[monthKey] = { total: 0, confirmed: 0 };
      map[monthKey].total++;
      if (log.status === 'confirmed' || log.math_correct) map[monthKey].confirmed++;
    });
    return Object.entries(map).slice(0, 12).map(([month, v]) => ({ month, ...v }));
  }, [logs]);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择孩子"
          style={{ width: 200 }}
          value={selectedChild}
          onChange={setSelectedChild}
          options={children.map((c: any) => ({ value: c.id, label: c.name }))}
          disabled={role === 'child'}
        />
        <Tabs activeKey={viewMode} onChange={(k) => setViewMode(k as any)} items={[
          { key: 'week', label: '周统计' },
          { key: 'month', label: '月统计' },
        ]} />
      </Space>

      {loading ? <Spin style={{ display: 'block', margin: '100px auto' }} /> : selectedChild ? (
        <div>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card><Statistic title="总打卡" value={stats?.total || 0} prefix={<TrophyOutlined />} /></Card></Col>
            <Col span={6}><Card><Statistic title="已完成" value={stats?.confirmed || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} /></Card></Col>
            <Col span={6}><Card><Statistic title="未完成" value={stats?.rejected || 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
            <Col span={6}><Card><Statistic title="连续天数" value={stats?.streak_days || 0} prefix={<FireOutlined />} valueStyle={{ color: '#D97706' }} /></Card></Col>
          </Row>

          {/* 图表 */}
          <StatsChart weeklyData={weeklyData} monthlyData={monthlyData} viewMode={viewMode} />

          {/* 流水明细 */}
          <Card title="流水明细" style={{ marginTop: 16 }}>
            <Table
              dataSource={logs}
              rowKey="id"
              size="small"
              columns={[
                { title: '时间', dataIndex: 'created_at', key: 'created_at', sorter: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
                { title: '事件类型', dataIndex: 'event_type', key: 'event_type' },
                { title: '数学题', dataIndex: 'math_problem', key: 'math_problem', render: (v: string) => v || '-' },
                { title: '答题结果', dataIndex: 'math_correct', key: 'math_correct', render: (v: boolean | null) => v === null ? '-' : v ? <Tag color="green">正确</Tag> : <Tag color="red">错误</Tag> },
                { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => ({ pending: <Tag>待确认</Tag>, confirmed: <Tag color="green">已确认</Tag>, rejected: <Tag color="red">已拒绝</Tag> }[v] || <Tag>{v}</Tag>) },
              ]}
            />
          </Card>
        </div>
      ) : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>请选择要查看的孩子</div>}
    </div>
  );
}