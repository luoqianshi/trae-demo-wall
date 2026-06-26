import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import AudioCard from '@/components/AudioCard';
import { audioCategories, audioList } from '@/data/audio';
import { AudioItem } from '@/types/audio';

// 这是一个空注释，用来强制 Webpack 重新构建该页面

const AudioPage: React.FC = () => {
  const handleCategoryClick = (category: string) => {
    Taro.showToast({
      title: `查看${category}内容`,
      icon: 'none'
    });
  };

  const handleAudioClick = (item: AudioItem) => {
    Taro.showToast({
      title: `正在播放: ${item.title}`,
      icon: 'none'
    });
  };

  const newsList = audioList.filter(item => item.category === 'news');
  const bookList = audioList.filter(item => item.category === 'book');
  const musicList = audioList.filter(item => item.category === 'music');

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.categories}>
        <Text className={styles.categoriesTitle}>内容分类</Text>
        <View className={styles.categoriesList}>
          {audioCategories.map(category => (
            <View
              key={category.id}
              className={styles.categoryItem}
              onClick={() => handleCategoryClick(category.name)}
            >
              <Text className={styles.categoryIcon}>{category.icon}</Text>
              <Text className={styles.categoryName}>{category.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>新闻资讯</Text>
        <View className={styles.audioList}>
          {newsList.map(item => (
            <AudioCard
              key={item.id}
              item={item}
              onClick={() => handleAudioClick(item)}
            />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>有声小说</Text>
        <View className={styles.audioList}>
          {bookList.map(item => (
            <AudioCard
              key={item.id}
              item={item}
              onClick={() => handleAudioClick(item)}
            />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>经典音乐</Text>
        <View className={styles.audioList}>
          {musicList.map(item => (
            <AudioCard
              key={item.id}
              item={item}
              onClick={() => handleAudioClick(item)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default AudioPage;
