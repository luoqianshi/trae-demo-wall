import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Avatar, Tag, List, Empty, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  FileTextOutlined, HeartOutlined, TrophyOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { authAPI } from '../services/api';
import { categoryLabels, categoryColors } from '../constants';

export default function Profile() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res: any = await authAPI.getStats();
      if (res.code === 0) setStats(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>个人中心</h1>
      </div>

      <Spin spinning={loading}>
        {/* 用户信息卡片 */}
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Avatar size={72} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{user?.realName || user?.username || '未登录'}</div>
              <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                {user?.role === 'student' ? '学生' : user?.role === 'teacher' ? '教师' : '管理员'}
                {user?.phone && ` · ${user.phone}`}
              </div>
            </div>
          </div>
        </Card>

        {/* 统计数据 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="已完成项目"
                value={stats?.completed || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="进行中"
                value={stats?.inProgress || 0}
                prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="提交作品"
                value={stats?.submissions || 0}
                prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
                suffix="次"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="收藏项目"
                value={stats?.favorites || 0}
                prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 最近完成的项目 */}
        <Card
          title={<span><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />最近完成的项目</span>}
          style={{ borderRadius: 12 }}
        >
          {stats?.recentCompleted?.length > 0 ? (
            <List
              dataSource={stats.recentCompleted}
              renderItem={(item: any) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '12px 0' }}
                  onClick={() => navigate(`/tasks/${item.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      item.cover_image
                        ? <img src={item.cover_image} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                        : <Avatar shape="square" size={48} icon={<TrophyOutlined />} style={{ backgroundColor: '#1677ff' }} />
                    }
                    title={item.title}
                    description={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Tag color={categoryColors[item.category]}>{categoryLabels[item.category] || item.category}</Tag>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="还没有完成任何项目，去项目广场开始学习吧">
              <Button type="primary" onClick={() => navigate('/')}>去项目广场</Button>
            </Empty>
          )}
        </Card>
      </Spin>
    </div>
  );
}