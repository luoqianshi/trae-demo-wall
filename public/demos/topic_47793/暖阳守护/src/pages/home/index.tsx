import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import WeatherCard from '@/components/WeatherCard';
import HealthCard from '@/components/HealthCard';
import QuickAction from '@/components/QuickAction';
import { weatherInfo, quickActions } from '@/data/weather';
import { healthDataList } from '@/data/health';

const HomePage: React.FC = () => {
  const getHealthIcon = useCallback((type: string) => {
    switch (type) {
      case 'heartRate':
        return '❤️';
      case 'bloodPressure':
        return '🩸';
      case 'sleep':
        return '😴';
      default:
        return '⚕️';
    }
  }, []);

  const getHealthTitle = useCallback((type: string) => {
    switch (type) {
      case 'heartRate':
        return '心率';
      case 'bloodPressure':
        return '血压';
      case 'sleep':
        return '睡眠';
      default:
        return '健康';
    }
  }, []);

  const handleSOS = useCallback(() => {
    Taro.navigateTo({ url: '/pages/sos/index' });
  }, []);

  const handleVideoCall = useCallback(() => {
    Taro.navigateTo({ url: '/pages/family/index' });
  }, []);

  const handleBinding = useCallback(() => {
    Taro.navigateTo({ url: '/pages/binding/index' });
  }, []);

  const renderedHealthCards = useMemo(() => healthDataList.map((item) => (
    <HealthCard
      key={item.id}
      icon={getHealthIcon(item.type)}
      title={getHealthTitle(item.type)}
      value={item.value}
      unit={item.unit}
      status={item.status}
      time={item.time}
    />
  )), [healthDataList, getHealthIcon, getHealthTitle]);

  const renderedQuickActions = useMemo(() => quickActions.map((action) => (
    <QuickAction
      key={action.id}
      icon={action.icon}
      name={action.name}
      path={action.path}
    />
  )), [quickActions]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.greeting}>
        <Text className={styles.greetingText}>
          早上好，<Text className={styles.name}>王奶奶</Text>
        </Text>
      </View>

      <View className={styles.bigActions}>
        <View className={`${styles.bigActionBtn} ${styles.sosBtn}`} onClick={handleSOS}>
          <Text className={styles.bigIcon}>🚨</Text>
          <Text className={styles.bigName}>紧急求救</Text>
          <Text className={styles.bigTip}>一键求助</Text>
        </View>
        <View className={`${styles.bigActionBtn} ${styles.videoBtn}`} onClick={handleVideoCall}>
          <Text className={styles.bigIcon}>📹</Text>
          <Text className={styles.bigName}>视频通话</Text>
          <Text className={styles.bigTip}>联系家人</Text>
        </View>
      </View>

      <WeatherCard weather={weatherInfo} />

      <View className={styles.bindingCard} onClick={handleBinding}>
        <View className={styles.bindingIcon}>📱</View>
        <View className={styles.bindingInfo}>
          <Text className={styles.bindingTitle}>家庭绑定</Text>
          <Text className={styles.bindingDesc}>让子女实时守护您的安全</Text>
        </View>
        <Text className={styles.bindingArrow}>›</Text>
      </View>

      <View className={styles.healthSection}>
        <Text className={styles.sectionTitle}>今日健康</Text>
        {renderedHealthCards}
      </View>

      <View>
        <Text className={styles.sectionTitle}>快捷功能</Text>
        <View className={styles.actionsGrid}>
          {renderedQuickActions}
        </View>
      </View>
    </ScrollView>
  );
};

export default React.memo(HomePage);