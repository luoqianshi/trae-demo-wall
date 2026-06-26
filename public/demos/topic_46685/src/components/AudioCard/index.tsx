import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import styles from './index.module.scss';
import { AudioItem } from '@/types/audio';

interface AudioCardProps {
  item: AudioItem;
  onClick?: () => void;
}

const AudioCard: React.FC<AudioCardProps> = ({ item, onClick }) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.coverWrapper}>
        <Image
          src={item.coverUrl}
          mode="aspectFill"
          className={styles.cover}
        />
        <View className={styles.duration}>
          <Text className={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      <View className={styles.info}>
        <Text className={styles.title}>{item.title}</Text>
        <Text className={styles.description}>{item.description}</Text>
      </View>
      <Button className={styles.playBtn}>播放</Button>
    </View>
  );
};

export default AudioCard;
