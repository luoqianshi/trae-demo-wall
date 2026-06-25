import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { Article } from '../../data/articles';
import styles from './index.module.scss';

interface ArticleCardProps {
  article: Article;
  onClick: (articleId: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  return (
    <View
      className={styles.articleCard}
      onClick={() => onClick(article.id)}
    >
      <Image
        className={styles.articleCover}
        src={article.cover}
        mode="aspectFill"
      />
      <View className={styles.articleContent}>
        <View className={styles.articleHeader}>
          <Text className={styles.articleCategory}>{article.category}</Text>
          <Text className={styles.articleReadTime}>{article.readTime}分钟阅读</Text>
        </View>
        <Text className={styles.articleTitle}>{article.title}</Text>
        <Text className={styles.articleDesc}>{article.description}</Text>
        <View className={styles.articleFooter}>
          <Text className={styles.articleViews}>{article.views} 阅读</Text>
        </View>
      </View>
    </View>
  );
};

export default ArticleCard;