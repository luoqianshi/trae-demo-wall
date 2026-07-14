import { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Empty, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HeartFilled, UserOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { favoriteAPI } from '../services/api';
import { categoryLabels, categoryColors, difficultyLabels, difficultyColors } from '../constants';

export default function MyFavorites() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res: any = await favoriteAPI.list();
      if (res.code === 0) setTasks(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleRemove = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    try {
      await favoriteAPI.remove(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch { /* ignore */ }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回</Button>
        <HeartFilled style={{ color: '#ff4d4f', fontSize: 22 }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>我的收藏</h1>
        <span style={{ color: '#8c8c8c' }}>共 {tasks.length} 个项目</span>
      </div>

      <Spin spinning={loading}>
        {tasks.length === 0 ? (
          <Empty description="还没有收藏任何项目，去项目广场逛逛吧" style={{ marginTop: 60 }}>
            <Button type="primary" onClick={() => navigate('/')}>去项目广场</Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {tasks.map((task) => (
              <Col key={task.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  style={{ borderRadius: 8, height: '100%' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  cover={
                    task.cover_image ? (
                      <div style={{ height: 140, overflow: 'hidden', background: '#f0f0f0' }}>
                        <img src={task.cover_image} alt={task.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff', fontSize: 36, fontWeight: 'bold', opacity: 0.3,
                      }}>{task.title?.charAt(0) || 'P'}</div>
                    )
                  }
                  actions={[
                    <HeartFilled key="fav" style={{ color: '#ff4d4f' }}
                      onClick={(e) => handleRemove(e, task.id)} />,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
                          <Tag color={categoryColors[task.category]}>{categoryLabels[task.category] || task.category}</Tag>
                          <Tag color={difficultyColors[task.difficulty]}>{difficultyLabels[task.difficulty] || task.difficulty}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', gap: 12 }}>
                          <span><UserOutlined /> {task.submission_count || 0} 人参与</span>
                          {task.estimated_time && <span><ClockCircleOutlined /> {task.estimated_time}</span>}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}