import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import { HealthArticle } from '@/types/health';

interface HealthCardProps {
  article: HealthArticle;
  onClick?: () => void;
}

const HealthCard: React.FC<HealthCardProps> = ({ article, onClick }) => {
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      knowledge: '健康知识',
      recipe: '养生食谱',
      exercise: '运动指南'
    };
    return labels[category] || category;
  };

  return (
    <View className={styles.card} onClick={onClick}>
      <Image
        src={article.coverUrl}
        mode="aspectFill"
        className={styles.cover}
      />
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.category}>
            <Text className={styles.categoryText}>{getCategoryLabel(article.category)}</Text>
          </View>
          <Text className={styles.readTime}>{article.readTime}</Text>
        </View>
        <Text className={styles.title}>{article.title}</Text>
        <Text className={styles.summary}>{article.summary}</Text>
      </View>
    </View>
  );
};

export default HealthCard;
