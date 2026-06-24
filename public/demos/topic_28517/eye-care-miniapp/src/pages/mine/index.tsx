import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { UserProfile, UserStatistics } from '@/types/user';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const [userProfile, setUserProfile] = React.useState<UserProfile>({
    id: '1',
    nickname: '护眼达人',
    avatar: '👤',
    level: 5,
    points: 1250,
    joinDate: '2024-01-01'
  });

  const [userStats, setUserStats] = React.useState<UserStatistics>({
    totalRestDays: 45,
    totalRestTime: 680,
    completedChallenges: 3,
    currentStreak: 7,
    bestStreak: 15
  });

  const menuItems = [
    { icon: '📊', text: '数据统计', action: () => handleMenuClick('数据统计') },
    { icon: '🏆', text: '我的成就', action: () => handleMenuClick('我的成就') },
    { icon: '⚙️', text: '设置', action: () => handleMenuClick('设置') },
    { icon: '❓', text: '帮助与反馈', action: () => handleMenuClick('帮助与反馈') },
    { icon: '📱', text: '关于我们', action: () => handleMenuClick('关于我们') }
  ];

  const handleMenuClick = (menuName: string) => {
    Taro.showToast({
      title: `${menuName}功能开发中`,
      icon: 'none'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <View className={styles.minePage}>
      <View className={styles.userInfo}>
        <View className={styles.avatar}>{userProfile.avatar}</View>
        <View className={styles.userDetails}>
          <Text className={styles.userName}>{userProfile.nickname}</Text>
          <Text className={styles.userLevel}>
            Lv.{userProfile.level} | {userProfile.points}积分
          </Text>
        </View>
      </View>

      <View className={styles.statsSection}>
        <Text className={styles.statsTitle}>我的数据</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.totalRestDays}</Text>
            <Text className={styles.statLabel}>休息天数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatTime(userStats.totalRestTime)}</Text>
            <Text className={styles.statLabel}>累计休息</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.completedChallenges}</Text>
            <Text className={styles.statLabel}>完成关卡</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.currentStreak}</Text>
            <Text className={styles.statLabel}>当前连续</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.bestStreak}</Text>
            <Text className={styles.statLabel}>最佳连续</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userProfile.points}</Text>
            <Text className={styles.statLabel}>总积分</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>功能菜单</Text>
        <View className={styles.menuList}>
          {menuItems.map((item, index) => (
            <View key={index} className={styles.menuItem} onClick={item.action}>
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>{item.icon}</Text>
                <Text className={styles.menuText}>{item.text}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default MinePage;