import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Input, Select, Tag, Spin, Empty, Pagination, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { taskAPI, progressAPI, favoriteAPI } from '../services/api';
import { categoryLabels, categoryColors, difficultyLabels, difficultyColors, categoryOptions, difficultyOptions, gradeLevelOptions, sortOptions } from '../constants';

export default function TaskList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [progressMap, setProgressMap] = useState<Record<number, any>>({});
  const [favMap, setFavMap] = useState<Record<number, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, [page, category, difficulty, gradeLevel, keyword, sortBy]);

  // 加载用户学习进度
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) loadProgress();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 12, sortBy };
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (gradeLevel) params.grade_level = gradeLevel;
      if (keyword.trim()) params.keyword = keyword.trim();
      const res: any = await taskAPI.list(params);
      if (res.code === 0) {
        setTasks(res.data.list);
        setTotal(res.data.total);
        loadFavStatus(res.data.list);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // 加载收藏状态
  const loadFavStatus = async (taskList: any[]) => {
    const token = localStorage.getItem('token');
    if (!token || taskList.length === 0) return;
    try {
      const ids = taskList.map((t: any) => t.id);
      const res: any = await favoriteAPI.check(ids);
      if (res.code === 0) setFavMap(prev => ({ ...prev, ...res.data }));
    } catch { /* ignore */ }
  };

  const toggleFavorite = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      if (favMap[taskId]) {
        await favoriteAPI.remove(taskId);
        setFavMap(prev => ({ ...prev, [taskId]: false }));
      } else {
        await favoriteAPI.add(taskId);
        setFavMap(prev => ({ ...prev, [taskId]: true }));
      }
    } catch { /* ignore */ }
  };

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeyword(value);
      setPage(1);
    }, 300);
  };

  // 加载用户进度
  const loadProgress = async () => {
    try {
      const res: any = await progressAPI.getMy();
      if (res.code === 0 && Array.isArray(res.data)) {
        const map: Record<number, any> = {};
        res.data.forEach((p: any) => { map[p.task_id] = p; });
        setProgressMap(map);
      }
    } catch { /* ignore */ }
  };

  // 关键词高亮
  const highlightKeyword = (text: string) => {
    if (!keyword.trim()) return text;
    const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.trim().toLowerCase()
        ? `<mark style="padding:0 2px;background:#ffd666;border-radius:2px">${part}</mark>`
        : part
    ).join('');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* 头部 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>项目广场</h1>
        <p style={{ color: '#8c8c8c', marginTop: 8 }}>选择你感兴趣的项目任务，动手实践，提交成果</p>
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="搜索项目..."
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 280 }}
          allowClear
        />
        <Select
          placeholder="分类"
          value={category || undefined}
          onChange={(v) => { setCategory(v || ''); setPage(1); }}
          allowClear
          style={{ width: 120 }}
          options={categoryOptions}
        />
        <Select
          placeholder="难度"
          value={difficulty || undefined}
          onChange={(v) => { setDifficulty(v || ''); setPage(1); }}
          allowClear
          style={{ width: 120 }}
          options={difficultyOptions}
        />
        <Select
          placeholder="适合年级"
          value={gradeLevel || undefined}
          onChange={(v) => { setGradeLevel(v || ''); setPage(1); }}
          allowClear
          style={{ width: 140 }}
          options={gradeLevelOptions}
        />
        <Select
          placeholder="排序"
          value={sortBy}
          onChange={(v) => { setSortBy(v); setPage(1); }}
          style={{ width: 130 }}
          options={sortOptions}
        />
      </div>

      {/* 列表 */}
      <Spin spinning={loading}>
        {tasks.length === 0 ? (
          <Empty description="暂无项目任务" style={{ marginTop: 60 }} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {tasks.map((task) => (
                <Col key={task.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    style={{ borderRadius: 8, height: '100%' }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    cover={
                      task.cover_image ? (
                        <div style={{ height: 140, overflow: 'hidden', background: '#f0f0f0', position: 'relative' }}>
                          <img src={task.cover_image} alt={task.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              el.style.display = 'none';
                              // 显示兜底占位
                              const fallback = el.parentElement?.querySelector('.fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="fallback" style={{
                            display: 'none', position: 'absolute', inset: 0,
                            alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff', fontSize: 36, fontWeight: 'bold', opacity: 0.3,
                          }}>
                            {task.title?.charAt(0) || 'P'}
                          </div>
                          {/* 序号徽标 */}
                          <div style={{
                            position: 'absolute', top: 8, left: 8,
                            background: 'rgba(22,119,255,0.9)',
                            color: '#fff', fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 4,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            lineHeight: '18px',
                          }}>
                            #{String(task.display_order || task.id).padStart(3, '0')}
                          </div>
                          <div
                            onClick={(e) => toggleFavorite(e, task.id)}
                            style={{
                              position: 'absolute', top: 8, right: 8,
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.9)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', zIndex: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            {favMap[task.id] ? (
                              <HeartFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
                            ) : (
                              <HeartOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff', fontSize: 36, fontWeight: 'bold', opacity: 0.3, position: 'relative',
                        }}>
                          {task.title?.charAt(0) || 'P'}
                          {/* 序号徽标 */}
                          <div style={{
                            position: 'absolute', top: 8, left: 8,
                            background: 'rgba(22,119,255,0.9)',
                            color: '#fff', fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 4,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            lineHeight: '18px',
                          }}>
                            #{String(task.display_order || task.id).padStart(3, '0')}
                          </div>
                          <div
                            onClick={(e) => toggleFavorite(e, task.id)}
                            style={{
                              position: 'absolute', top: 8, right: 8,
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.9)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', zIndex: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            {favMap[task.id] ? (
                              <HeartFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
                            ) : (
                              <HeartOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
                            )}
                          </div>
                        </div>
                      )
                    }
                  >
                    <Card.Meta
                      title={
                        <div
                          style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          dangerouslySetInnerHTML={{ __html: highlightKeyword(task.title) }}
                        />
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
                            <Tag color={categoryColors[task.category]}>{categoryLabels[task.category] || task.category}</Tag>
                            <Tag color={difficultyColors[task.difficulty]}>{difficultyLabels[task.difficulty] || task.difficulty}</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', gap: 12 }}>
                            <span><UserOutlined /> {task.submission_count || 0} 人已完成</span>
                            <span><HeartOutlined /> {task.favorite_count || 0}</span>
                            {task.estimated_time && <span><ClockCircleOutlined /> {task.estimated_time}</span>}
                          </div>
                          {/* 个人学习进度 */}
                          {progressMap[task.id] && (
                            <div style={{ marginTop: 6 }}>
                              <Progress
                                percent={progressMap[task.id].total_steps > 0
                                  ? Math.round((progressMap[task.id].current_step / progressMap[task.id].total_steps) * 100)
                                  : 0}
                                size="small"
                                status={progressMap[task.id].completed ? 'success' : 'active'}
                                format={() => progressMap[task.id].completed ? '已完成' : `${progressMap[task.id].current_step}/${progressMap[task.id].total_steps}`}
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            {total > 12 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination current={page} total={total} pageSize={12} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
}