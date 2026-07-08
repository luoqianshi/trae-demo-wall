import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow } from '@tarojs/taro';
import ArticleCard from '../../components/ArticleCard';
import CategoryTabs from '../../components/CategoryTabs';
import Empty from '../../components/Empty';
import { getArticles, toggleLikeArticle } from '../../services/api';
import { articleCategories } from '../../data/common';
import type { Article, ArticleCategory } from '../../types/article';
import styles from './index.module.scss';

const CommunityPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const tabs = useMemo(
    () => articleCategories.map((c) => ({ value: c.value, label: c.label, color: c.color || 'primary' })),
    []
  );

  useEffect(() => {
    fetchArticles();
  }, []);

  useDidShow(() => {
    fetchArticles();
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await getArticles();
      setArticles(res.data.list);
    } catch (err) {
      console.error('[Community] fetchArticles failed:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [articles, activeCategory]);

  const featured = articles[0];
  const restArticles = filteredArticles.filter((a) => a.id !== featured?.id);

  const handleArticleClick = (article: Article) => {
    Taro.navigateTo({ url: `/pages/article-detail/index?id=${article.id}` });
  };

  const handleLike = async (article: Article) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id ? { ...a, liked: !a.liked, likes: a.liked ? a.likes - 1 : a.likes + 1 } : a
      )
    );
    try {
      await toggleLikeArticle(article.id);
      Taro.vibrateShort({ type: 'light' });
    } catch (err) {
      console.error('[Community] like failed:', err);
    }
  };

  const handlePublish = () => {
    Taro.navigateTo({ url: '/pages/article-publish/index' });
  };

  const handleSearch = () => {
    Taro.showToast({ title: '搜索功能开发中', icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.title}>钓友社区</Text>
            <Text className={styles.subtitle}>钓技 · 钓点 · 装备 · 故事</Text>
          </View>
          <View className={styles.headerActions}>
            <View className={styles.headerBtn} onClick={handleSearch}>
              <Text className={styles.headerBtnIcon}>🔍</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <CategoryTabs tabs={tabs} value={activeCategory} onChange={setActiveCategory} />
      </View>

      {!loading && featured && activeCategory === 'all' && (
        <View className={styles.featured} onClick={() => handleArticleClick(featured)}>
          <Text className={styles.featuredLabel}>✨ 精选文章</Text>
          <Text className={styles.featuredTitle}>{featured.title}</Text>
          <Text className={styles.featuredDesc}>{featured.summary}</Text>
          <View className={styles.featuredMeta}>
            <View className={styles.featuredAuthor}>
              <Image className={styles.featuredAvatar} src={featured.authorAvatar} mode="aspectFill" />
              <Text className={styles.featuredAuthorName}>{featured.authorName}</Text>
            </View>
            <Text className={styles.featuredDot}>·</Text>
            <Text className={styles.featuredAuthorName}>{featured.location}</Text>
          </View>
        </View>
      )}

      <View className={styles.list}>
        {!loading && filteredArticles.length === 0 ? (
          <Empty
            icon="📝"
            title="暂无相关文章"
            desc="换个分类，或者分享你的第一篇文章吧～"
            actionText="发布文章"
            onAction={handlePublish}
          />
        ) : (
          restArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
              onLike={() => handleLike(article)}
            />
          ))
        )}
      </View>

      <View className={styles.publishBtn} onClick={handlePublish}>
        <Text className={styles.publishBtnIcon}>✏️</Text>
        <Text className={styles.publishBtnText}>发帖</Text>
      </View>
    </View>
  );
};

export default CommunityPage;
