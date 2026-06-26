import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import HealthCard from '@/components/HealthCard';
import { healthArticles } from '@/data/health';
import { HealthArticle } from '@/types/health';

const HealthPage: React.FC = () => {
  const handleArticleClick = (article: HealthArticle) => {
    Taro.showToast({
      title: `正在查看: ${article.title}`,
      icon: 'none'
    });
  };

  const knowledgeList = healthArticles.filter(item => item.category === 'knowledge');
  const recipeList = healthArticles.filter(item => item.category === 'recipe');
  const exerciseList = healthArticles.filter(item => item.category === 'exercise');

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.banner}>
        <Text className={styles.bannerTitle}>健康养生</Text>
        <Text className={styles.bannerDesc}>科学养生，健康长寿</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>健康知识</Text>
        <View className={styles.articlesList}>
          {knowledgeList.map(article => (
            <HealthCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
            />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>养生食谱</Text>
        <View className={styles.articlesList}>
          {recipeList.map(article => (
            <HealthCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
            />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>运动指南</Text>
        <View className={styles.articlesList}>
          {exerciseList.map(article => (
            <HealthCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default HealthPage;
