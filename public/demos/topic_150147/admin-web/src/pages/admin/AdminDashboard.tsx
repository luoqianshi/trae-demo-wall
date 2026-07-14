import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { UserOutlined, FileTextOutlined, CheckSquareOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.dashboard();
      if (res.code === 0) setStats(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const cards = [
    { title: '用户总数', value: stats?.userCount ?? 0, icon: <UserOutlined />, color: '#1677ff' },
    { title: '活跃用户', value: stats?.activeUserCount ?? 0, icon: <UserOutlined />, color: '#52c41a' },
    { title: '任务总数', value: stats?.taskCount ?? 0, icon: <FileTextOutlined />, color: '#722ed1' },
    { title: '提交总数', value: stats?.submissionCount ?? 0, icon: <CheckSquareOutlined />, color: '#fa8c16' },
    { title: '待评分', value: stats?.pendingCount ?? 0, icon: <ClockCircleOutlined />, color: '#ff4d4f' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {cards.map((c, i) => (
            <Col key={i} xs={24} sm={12} lg={8} xl={Math.floor(24 / cards.length)}>
              <Card hoverable>
                <Statistic
                  title={c.title}
                  value={c.value}
                  prefix={<span style={{ color: c.color }}>{c.icon}</span>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  );
}