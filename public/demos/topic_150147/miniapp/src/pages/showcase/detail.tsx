import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Textarea } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

export default function ShowcaseDetail() {
  const [showcase, setShowcase] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const id = params?.id ? Number(params.id) : null;
    if (id) loadDetail(id);
  }, []);

  const loadDetail = async (id: number) => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getShowcaseDetail(id);
      if (res.code === 0) {
        setShowcase(res.data);
        setFeedbacks(res.data.feedbacks || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleLike = async () => {
    if (liked || !showcase) return;
    try {
      await pblAPI.likeShowcase(showcase.id);
      setShowcase({ ...showcase, likes_count: (showcase.likes_count || 0) + 1 });
      setLiked(true);
    } catch { /* ignore */ }
  };

  const handleComment = async () => {
    if (!showcase || !commentText.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    try {
      await pblAPI.addShowcaseFeedback(showcase.id, { content: commentText });
      Taro.showToast({ title: '评论已提交', icon: 'success' });
      setCommentText('');
      loadDetail(showcase.id);
    } catch { Taro.showToast({ title: '评论失败', icon: 'none' }); }
  };

  if (loading) {
    return <View className="container"><View className="loading">加载中...</View></View>;
  }

  if (!showcase) {
    return <View className="container"><View className="empty-state"><Text className="empty-text">展示不存在</Text></View></View>;
  }

  return (
    <View className="container">
      {/* 头部 */}
      <View className="detail-header">
        <Text className="detail-title">{showcase.title}</Text>
        <View className="detail-meta">
          <Text className="detail-author">{showcase.real_name}</Text>
          <Text className="detail-camp">{showcase.camp_name}</Text>
        </View>
        {showcase.template_name && (
          <View className="detail-template">
            <Text>模板：{showcase.template_name}</Text>
          </View>
        )}
      </View>

      {/* 驱动性问题 */}
      {showcase.driving_question && (
        <View className="info-card">
          <Text className="info-label">驱动性问题</Text>
          <Text className="info-text">{showcase.driving_question}</Text>
        </View>
      )}

      {/* 描述 */}
      {showcase.description && (
        <View className="info-card">
          <Text className="info-label">项目描述</Text>
          <Text className="info-text">{showcase.description}</Text>
        </View>
      )}

      {/* 反思总结 */}
      {showcase.reflection_summary && (
        <View className="info-card highlight">
          <Text className="info-label">反思总结</Text>
          <Text className="info-text">{showcase.reflection_summary}</Text>
        </View>
      )}

      {/* 作品链接 */}
      {showcase.product_urls && showcase.product_urls.length > 0 && (
        <View className="info-card">
          <Text className="info-label">项目成果</Text>
          {showcase.product_urls.map((url: string, i: number) => (
            <Text key={i} className="product-link">{url}</Text>
          ))}
        </View>
      )}

      {/* 互动区 */}
      <View className="action-bar">
        <View className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <Text>{liked ? 'Liked' : 'Like'} ({showcase.likes_count || 0})</Text>
        </View>
        <Text className="action-stat">浏览 {showcase.views_count || 0}</Text>
      </View>

      {/* 评论 */}
      <View className="comment-section">
        <Text className="section-title">评论 ({feedbacks.length})</Text>

        {feedbacks.map((fb: any) => (
          <View key={fb.id} className="comment-item">
            <Text className="comment-author">{fb.real_name}</Text>
            <Text className="comment-content">{fb.content}</Text>
            <Text className="comment-time">{fb.created_at}</Text>
          </View>
        ))}

        <View className="comment-input-area">
          <Textarea className="comment-input" value={commentText}
            onInput={(e) => setCommentText((e as any).detail.value)}
            placeholder="写下你的评论..." />
          <View className="comment-btn" onClick={handleComment}>
            <Text className="comment-btn-text">发送</Text>
          </View>
        </View>
      </View>
    </View>
  );
}