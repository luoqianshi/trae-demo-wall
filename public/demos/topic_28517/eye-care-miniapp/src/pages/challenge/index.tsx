import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import LevelCard from '@/components/LevelCard';
import { challengesData } from '@/data/challenges';
import { achievementsData } from '@/data/achievements';
import styles from './index.module.scss';

const ChallengePage: React.FC = () => {
  const [userPoints, setUserPoints] = React.useState(150);
  const [currentLevel, setCurrentLevel] = React.useState(1);
  const [challenges, setChallenges] = React.useState(challengesData);
  const [achievements, setAchievements] = React.useState(achievementsData);

  const handleChallengeClick = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge?.status === 'locked') {
      Taro.showToast({
        title: '请先完成当前关卡',
        icon: 'none'
      });
      return;
    }

    if (challenge?.status === 'completed') {
      Taro.showToast({
        title: '该关卡已完成',
        icon: 'none'
      });
      return;
    }

    // 模拟进入关卡详情
    Taro.showModal({
      title: challenge.title,
      content: `任务目标：\n${challenge.tasks.map(task => `• ${task.title} (${task.current}/${task.target}${task.unit})`).join('\n')}`,
      showCancel: false,
      confirmText: '开始挑战'
    });
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <View className={styles.challengePage}>
      <View className={styles.header}>
        <Text className={styles.userLevel}>当前等级: Lv.{currentLevel}</Text>
        <Text className={styles.userPoints}>积分: {userPoints}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>关卡挑战</Text>
        <View className={styles.challengesList}>
          {challenges.map(challenge => (
            <LevelCard
              key={challenge.id}
              challenge={challenge}
              onClick={handleChallengeClick}
            />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.achievementsSection}>
          <View className={styles.achievementsHeader}>
            <Text className={styles.achievementsTitle}>我的成就</Text>
            <Text className={styles.achievementsCount}>
              {unlockedAchievements}/{achievements.length}
            </Text>
          </View>
          <View className={styles.achievementsGrid}>
            {achievements.map(achievement => (
              <View key={achievement.id} className={styles.achievementItem}>
                <Text
                  className={`${styles.achievementIcon} ${achievement.unlocked ? styles.unlocked : ''}`}
                >
                  {achievement.icon}
                </Text>
                <Text className={styles.achievementName}>{achievement.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChallengePage;