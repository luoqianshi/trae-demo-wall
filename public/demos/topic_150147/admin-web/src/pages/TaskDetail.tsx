import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Tag, Button, Card, message, Tabs, Typography, Rate, Input, List, Avatar, Popconfirm, Space, Tooltip } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, UploadOutlined, HeartOutlined, HeartFilled, ShareAltOutlined, StarOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { taskAPI, progressAPI, favoriteAPI, ratingAPI, commentAPI } from '../services/api';
import { categoryLabels, categoryColors, difficultyLabels, difficultyColors } from '../constants';
import type { Task } from '../types';
import TaskVideo from './components/TaskVideo';
import TaskPrinciple from './components/TaskPrinciple';
import TaskSteps from './components/TaskSteps';
import TaskSubmit from './components/TaskSubmit';
import TaskInteractivePlayground from './components/TaskInteractivePlayground';

const { Paragraph } = Typography;

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('tutorial');
  const [progress, setProgress] = useState<any>(null);
  const [favorited, setFavorited] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    loadTask();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      loadProgress();
      loadMyRating();
    }
  }, [user, id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const res: any = await taskAPI.detail(Number(id));
      if (res.code === 0) setTask(res.data);
    } catch { message.error('加载失败'); }
    setLoading(false);
  };

  const loadProgress = async () => {
    try {
      const res: any = await progressAPI.getByTask(Number(id));
      if (res.code === 0 && res.data) setProgress(res.data);
    } catch { /* 静默 */ }
  };

  const loadMyRating = async () => {
    try {
      const res: any = await ratingAPI.getMy(Number(id));
      if (res.code === 0 && res.data) setMyRating(res.data.score);
    } catch { /* 静默 */ }
  };

  const loadRating = async () => {
    try {
      const res: any = await ratingAPI.getByTask(Number(id));
      if (res.code === 0) {
        setAvgRating(res.data.avg);
        setRatingCount(res.data.count);
      }
    } catch { /* 静默 */ }
  };

  const loadComments = async () => {
    setCommentLoading(true);
    try {
      const res: any = await commentAPI.getByTask(Number(id));
      if (res.code === 0) {
        setComments(res.data.list);
        setCommentTotal(res.data.total);
      }
    } catch { /* 静默 */ }
    setCommentLoading(false);
  };

  // 初始化时加载评分和评论
  useEffect(() => { loadRating(); loadComments(); }, [id]);

  const handleStepClick = async (stepNum: number) => {
    if (!user || !task) return;
    try {
      const steps = task.steps || [];
      if (!progress) await progressAPI.start(Number(id), steps.length);
      await progressAPI.update(Number(id), stepNum);
      setProgress((prev: any) => ({
        ...(prev || { total_steps: steps.length }),
        current_step: stepNum,
        completed: 0,
      }));
    } catch { /* 静默 */ }
  };

  const toggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (favorited) {
        await favoriteAPI.remove(Number(id));
        setFavorited(false);
      } else {
        await favoriteAPI.add(Number(id));
        setFavorited(true);
      }
    } catch { /* 静默 */ }
  };

  const handleRate = async (value: number) => {
    if (!user) { navigate('/login'); return; }
    try {
      await ratingAPI.rate(Number(id), value);
      setMyRating(value);
      loadRating();
      message.success('评分成功');
    } catch { message.error('评分失败'); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      message.success('链接已复制，分享给朋友吧');
    } catch {
      // 降级方案
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      message.success('链接已复制');
    }
  };

  const handleAddComment = async () => {
    if (!user) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    try {
      const res: any = await commentAPI.add(Number(id), commentText.trim());
      if (res.code === 0) {
        setComments(prev => [res.data, ...prev]);
        setCommentTotal(prev => prev + 1);
        setCommentText('');
        message.success('评论成功');
      }
    } catch { message.error('评论失败'); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentAPI.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentTotal(prev => prev - 1);
    } catch { /* 静默 */ }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!task) return <div style={{ textAlign: 'center', padding: 80 }}>任务不存在</div>;

  const steps: any[] = task.steps || [];

  const getPrinciple = () => {
    const refs = task.reference_materials || '';
    if (!refs) return { summary: '', detail: '' };

    // 提取科学原理摘要
	    const summaryMatch = refs.match(/(?:科学原理|原理说明)[：:]\s*([^\n]+)/);
	    const summary = summaryMatch ? summaryMatch[1].trim() : '';

	    // 提取【详细讲解】部分 — 从标记开始一直取到字符串末尾
		    const detailMatch = refs.match(/【详细讲解】\s*\n([\s\S]*)$/);
		    const detail = detailMatch ? detailMatch[1].trim() : '';

    if (detail) {
      return { summary, detail };
    }
    if (summary.length > 60) {
      return { summary: summary.substring(0, 60) + '...', detail: summary };
    }
    return { summary, detail: '' };
  };
  const principle = getPrinciple();

  const tutorialContent = (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <TaskVideo aiVideo={task.ai_video || ''} externalVideo={task.external_video || ''} coverImage={task.cover_image} />
        {task.demo_html && <TaskInteractivePlayground demoHtml={task.demo_html} title={task.title} />}
        <Card title={<span style={{ fontSize: 16, fontWeight: 600 }}>项目简介</span>} style={{ marginBottom: 16, borderRadius: 12 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 15, lineHeight: 1.9 }}>
            {task.description || '暂无描述'}
          </Paragraph>
        </Card>
        <TaskPrinciple summary={principle.summary} detail={principle.detail} />
      </div>
      <div style={{ width: 320, flexShrink: 0, minWidth: 280 }}>
        <TaskSteps steps={steps} progress={progress} user={user} onStepClick={handleStepClick} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 16px' }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        返回项目广场
      </Button>

      {task.cover_image && (
        <div style={{ height: 240, borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <img src={task.cover_image} alt={task.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a', flex: 1 }}>{task.title}</h1>
          <Space>
            <Tooltip title="分享"><Button icon={<ShareAltOutlined />} onClick={handleShare} /></Tooltip>
            <Button
              icon={favorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              onClick={toggleFavorite}
            >
              {favorited ? '已收藏' : '收藏'}
            </Button>
          </Space>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Tag color={categoryColors[task.category]}>{categoryLabels[task.category] || task.category}</Tag>
          <Tag color={difficultyColors[task.difficulty]}>{difficultyLabels[task.difficulty] || task.difficulty}</Tag>
          {task.grade_level && <Tag color="green">适合 {task.grade_level} 年级</Tag>}
          {task.estimated_time && <Tag color="cyan">预计 {task.estimated_time}</Tag>}
          <span style={{ color: '#8c8c8c', fontSize: 13, marginLeft: 8 }}>
            发布者: {task.creator_name || '系统'} | {task.submission_count || 0} 人已提交
          </span>
          {/* 评分 */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <Rate disabled value={avgRating} allowHalf style={{ fontSize: 16 }} />
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>{avgRating > 0 ? `${avgRating}分` : '暂无评分'}{ratingCount > 0 && ` (${ratingCount}人)`}</span>
          </span>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large"
        items={[
          { key: 'tutorial', label: <span style={{ fontSize: 16 }}><PlayCircleOutlined /> 学习教程</span>, children: tutorialContent },
          { key: 'submit', label: <span style={{ fontSize: 16 }}><UploadOutlined /> 提交作品</span>,
            children: <TaskSubmit taskId={Number(id)} requirements={task.requirements || ''} user={user} onSubmitted={loadTask} /> },
          { key: 'discuss', label: <span style={{ fontSize: 16 }}><MessageOutlined /> 讨论区 ({commentTotal})</span>,
            children: (
              <div style={{ maxWidth: 700 }}>
                {/* 评分区 */}
                <Card style={{ marginBottom: 16, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StarOutlined style={{ fontSize: 20, color: '#faad14' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>为这个项目评分</span>
                    <Rate value={myRating} onChange={handleRate} style={{ fontSize: 24 }} />
                    {myRating > 0 && <span style={{ color: '#8c8c8c' }}>我的评分: {myRating}分</span>}
                  </div>
                </Card>

                {/* 评论区 */}
                <Card title={<span><MessageOutlined /> 讨论 ({commentTotal})</span>} style={{ borderRadius: 12 }}>
                  {user ? (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      <Avatar icon={<span>{user.realName?.[0] || user.username?.[0] || 'U'}</span>} style={{ backgroundColor: '#1677ff' }} />
                      <div style={{ flex: 1 }}>
                        <Input.TextArea
                          rows={3}
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="写下你的想法或问题..."
                          maxLength={500}
                        />
                        <Button type="primary" onClick={handleAddComment} style={{ marginTop: 8 }} disabled={!commentText.trim()}>
                          发表评论
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 16, marginBottom: 20, background: '#fafafa', borderRadius: 8 }}>
                      登录后参与讨论 <Button type="link" onClick={() => navigate('/login')}>去登录</Button>
                    </div>
                  )}

                  <Spin spinning={commentLoading}>
                    {comments.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 24 }}>暂无评论，来发表第一条吧</div>
                    ) : (
                      <List
                        dataSource={comments}
                        renderItem={(item: any) => (
                          <List.Item
                            actions={[
                              (user && (user.id === item.user_id || user.role === 'platform_admin')) && (
                                <Popconfirm title="确定删除这条评论？" onConfirm={() => handleDeleteComment(item.id)}>
                                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                </Popconfirm>
                              ),
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar style={{ backgroundColor: '#1677ff' }}>{item.real_name?.[0] || item.username?.[0] || 'U'}</Avatar>}
                              title={<span>{item.real_name || item.username} <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 'normal' }}>{new Date(item.created_at).toLocaleString()}</span></span>}
                              description={item.content}
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Spin>
                </Card>
              </div>
            ),
          },
        ]}
        style={{ marginTop: -8 }}
      />
    </div>
  );
}