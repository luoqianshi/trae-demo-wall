import React from 'react';
import { View, Text, Progress } from '@tarojs/components';
import { Challenge } from '../../types/challenge';
import styles from './index.module.scss';

interface LevelCardProps {
  challenge: Challenge;
  onClick: (challengeId: string) => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ challenge, onClick }) => {
  const getStatusColor = (status: string) => {
    const colorMap = {
      locked: '#C9CDD4',
      current: '#1890FF',
      completed: '#52C41A'
    };
    return colorMap[status] || '#C9CDD4';
  };

  const getStatusText = (status: string) => {
    const textMap = {
      locked: '未解锁',
      current: '进行中',
      completed: '已完成'
    };
    return textMap[status] || '未解锁';
  };

  const statusColor = getStatusColor(challenge.status);

  return (
    <View
      className={styles.levelCard}
      onClick={() => onClick(challenge.id)}
    >
      <View className={styles.levelHeader}>
        <View className={styles.levelBadge} style={{ backgroundColor: statusColor }}>
          <Text className={styles.levelNumber}>{challenge.level}</Text>
        </View>
        <View className={styles.levelInfo}>
          <Text className={styles.levelTitle}>{challenge.title}</Text>
          <Text className={styles.levelDesc}>{challenge.description}</Text>
        </View>
        <Text className={styles.levelStatus} style={{ color: statusColor }}>
          {getStatusText(challenge.status)}
        </Text>
      </View>

      <View className={styles.levelProgress}>
        <View className={styles.progressInfo}>
          <Text className={styles.progressLabel}>完成进度</Text>
          <Text className={styles.progressText}>{challenge.progress}%</Text>
        </View>
        <Progress
          percent={challenge.progress}
          strokeWidth={8}
          activeColor={statusColor}
          backgroundColor="#F2F3F5"
          borderRadius={4}
        />
      </View>

      <View className={styles.levelReward}>
        <Text className={styles.rewardLabel}>奖励</Text>
        <Text className={styles.rewardPoints}>+{challenge.reward.points} 积分</Text>
        {challenge.reward.badge && (
          <Text className={styles.rewardBadge}>{challenge.reward.badge}</Text>
        )}
      </View>
    </View>
  );
};

export default LevelCard;