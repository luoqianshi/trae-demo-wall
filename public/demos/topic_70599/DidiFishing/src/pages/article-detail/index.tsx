import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { getArticleDetail, toggleLikeArticle } from '../../services/api';
import { formatCount, formatRelativeTime, getLevelLabel } from '../../utils/format';
import type { Article } from '../../types/article';
import styles from './index.module.scss';

const CATEGORY_LABELS: Record<string, { label: string; cls: string }> = {
  tech: { label: '钓技', cls: styles.catPrimary },
  spot: { label: '钓点', cls: styles.catAccent },
  gear: { label: '装备', cls: styles.catSuccess },
  experience: { label: '故事', cls: styles.catWarning }
};

const ArticleDetailPage: React.FC = () => {
  const params = Taro.getCurrentInstance().router?.params;
  const articleId = params?.id || '';
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const res = await getArticleDetail(articleId);
      if (res.data.article) {
        setArticle(res.data.article);
        setLiked(res.data.article.liked);
        setLikes(res.data.article.likes);
      }
    } catch (err) {
      console.error('[ArticleDetail] fetch failed:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleLike = async () => {
    if (!article) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((n) => n + (newLiked ? 1 : -1));
    Taro.vibrateShort({ type: 'light' });
    try {
      await toggleLikeArticle(article.id);
    } catch (err) {
      console.error('[ArticleDetail] like failed:', err);
      // 回滚
      setLiked(!newLiked);
      setLikes((n) => n + (newLiked ? -1 : 1));
    }
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const handleComment = () => {
    Taro.showToast({ title: '评论功能开发中', icon: 'none' });
  };

  if (loading || !article) {
    return (
      <View className={styles.page}>
        <View className={styles.coverWrap}>
          <View className={styles.coverSkeleton} />
          <View className={styles.backBtn} onClick={handleBack}>
            <Text className={styles.backIcon}>‹</Text>
          </View>
        </View>
        <View style={{ padding: '200rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909c', fontSize: '28rpx' }}>
            {loading ? '加载中...' : '文章不存在'}
          </Text>
        </View>
      </View>
    );
  }

  const cat = CATEGORY_LABELS[article.category] || CATEGORY_LABELS.tech;

  return (
    <View className={styles.page}>
      <View className={styles.coverWrap}>
        <Image className={styles.cover} src={article.cover} mode="aspectFill" />
        <View className={styles.coverMask} />
        <View className={styles.backBtn} onClick={handleBack}>
          <Text className={styles.backIcon}>‹</Text>
        </View>
        <View className={styles.shareBtn} onClick={handleShare}>
          <Text className={styles.shareIcon}>↗</Text>
        </View>
        <View className={classnames(styles.catBadge, cat.cls)}>
          <Text className={styles.catBadgeText}>{cat.label}</Text>
        </View>
      </View>

      <View className={styles.contentWrap}>
        <View className={styles.articleHeader}>
          <Text className={styles.title}>{article.title}</Text>
          <Text className={styles.summary}>{article.summary}</Text>
        </View>

        <View className={styles.authorRow}>
          <Image className={styles.authorAvatar} src={article.authorAvatar} mode="aspectFill" />
          <View className={styles.authorInfo}>
            <View className={styles.authorNameRow}>
              <Text className={styles.authorName}>{article.authorName}</Text>
              <View className={styles.levelTag}>
                <Text className={styles.levelText}>Lv{article.authorLevel}</Text>
              </View>
            </View>
            <Text className={styles.authorMeta}>
              {getLevelLabel(article.authorLevel)} · 钓龄{article.authorYears}年 · 📍 {article.location} · {formatRelativeTime(article.createdAt)}
            </Text>
          </View>
          <View className={styles.followBtn}>
            <Text className={styles.followBtnText}>＋ 关注</Text>
          </View>
        </View>

        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCount(article.views)}</Text>
            <Text className={styles.statLabel}>阅读</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCount(article.comments)}</Text>
            <Text className={styles.statLabel}>评论</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCount(likes)}</Text>
            <Text className={styles.statLabel}>点赞</Text>
          </View>
        </View>

        <View className={styles.divider} />

        <View className={styles.body}>
          {article.content.split('\n').map((line, idx) => (
            <Text key={idx} className={styles.bodyText}>
              {line || ' '}
              {'\n'}
            </Text>
          ))}
        </View>

        <View className={styles.tagRow}>
          {article.tags.map((t) => (
            <View key={t} className={styles.tag}>
              <Text className={styles.tagText}>#{t}</Text>
            </View>
          ))}
        </View>

        <View className={styles.tipBox}>
          <Text className={styles.tipIcon}>💡</Text>
          <Text className={styles.tipText}>
            看完不过瘾？到「首页」看看这位钓友的带钓订单，一同出行吧～
          </Text>
        </View>

        <View className={styles.commentSection}>
          <View className={styles.commentHeader}>
            <Text className={styles.commentTitle}>精选评论</Text>
            <Text className={styles.commentCount}>{article.comments}</Text>
          </View>

          {[1, 2, 3].map((i) => (
            <View key={i} className={styles.commentItem}>
              <View
                className={styles.commentAvatar}
                style={{ backgroundColor: ['#e6f5f4', '#fff2e8', '#e8f8ec'][i - 1] }}
              >
                <Text className={styles.commentAvatarText}>{['钓', '渔', '鱼'][i - 1]}</Text>
              </View>
              <View className={styles.commentInfo}>
                <View className={styles.commentNameRow}>
                  <Text className={styles.commentName}>{['千岛湖阿飞', '野钓老张', '海钓小妹'][i - 1]}</Text>
                  <Text className={styles.commentTime}>{i}小时前</Text>
                </View>
                <Text className={styles.commentText}>
                  {[
                    '太详细了！收藏学习一波，正好下周要去千岛湖～',
                    '老哥文笔真不错，看完也想入坑路亚了',
                    '求私聊，想跟你学矶钓！'
                  ][i - 1]}
                </Text>
              </View>
            </View>
          ))}

          <View className={styles.moreComments}>
            <Text className={styles.moreCommentsText}>查看全部 {article.comments} 条评论 ›</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        <View className={styles.commentInput} onClick={handleComment}>
          <Text className={styles.commentInputText}>💬 写评论...</Text>
        </View>
        <View
          className={classnames(styles.likeBtn, liked && styles.likeBtnActive)}
          onClick={handleLike}
        >
          <Text className={classnames(styles.likeIcon, liked && styles.likeIconActive)}>
            {liked ? '♥' : '♡'}
          </Text>
          <Text className={classnames(styles.likeText, liked && styles.likeTextActive)}>
            {formatCount(likes)}
          </Text>
        </View>
        <View className={styles.shareBtnBar} onClick={handleShare}>
          <Text className={styles.shareBarIcon}>↗</Text>
        </View>
      </View>
    </View>
  );
};

export default ArticleDetailPage;
