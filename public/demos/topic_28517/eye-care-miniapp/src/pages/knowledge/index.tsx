import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import ArticleCard from '@/components/ArticleCard';
import { articlesData, Article } from '@/data/articles';
import styles from './index.module.scss';

const KnowledgePage: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [articles, setArticles] = useState<Article[]>(articlesData);

  const categories = ['全部', '护眼技巧', '眼保健操', '健康知识', '护眼产品', '儿童护眼', '办公护眼', '饮食健康', '生活习惯'];

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    if (value.trim()) {
      const filtered = articlesData.filter(article =>
        article.title.includes(value) || article.description.includes(value)
      );
      setArticles(filtered);
    } else {
      setArticles(articlesData);
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === '全部') {
      setArticles(articlesData);
    } else {
      const filtered = articlesData.filter(article => article.category === category);
      setArticles(filtered);
    }
  };

  const handleArticleClick = (articleId: string) => {
    const article = articlesData.find(a => a.id === articleId);
    if (article) {
      Taro.showModal({
        title: article.title,
        content: article.content,
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  };

  return (
    <View className={styles.knowledgePage}>
      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索护眼知识"
          value={searchKeyword}
          onInput={(e) => handleSearch(e.detail.value)}
        />
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>知识分类</Text>
        <View className={styles.categoryTabs}>
          {categories.map(category => (
            <View
              key={category}
              className={`${styles.categoryTab} ${activeCategory === category ? styles.active : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          {activeCategory === '全部' ? '全部文章' : activeCategory}
        </Text>
        <View className={styles.articlesList}>
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={handleArticleClick}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default KnowledgePage;