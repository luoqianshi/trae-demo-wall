import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { heartRateTrend, bloodPressureTrend, sleepTrend } from '@/data/health';

const HealthPage: React.FC = () => {
  const renderChart = useCallback((data: { date: string; value: number }[], maxValue: number) => {
    return data.map((item) => {
      const heightPercent = (item.value / maxValue) * 100;
      return (
        <View key={item.date} className={styles.barWrapper}>
          <View className={styles.bar} style={{ height: `${heightPercent}%` }} />
          <Text className={styles.barLabel}>{item.date}</Text>
        </View>
      );
    });
  }, []);

  const handleRecord = useCallback(() => {
    Taro.showToast({ title: '正在测量...', icon: 'loading' });
    setTimeout(() => {
      Taro.showToast({ title: '测量完成', icon: 'success' });
    }, 2000);
  }, []);

  const renderedHeartRateChart = useMemo(() => renderChart(heartRateTrend, 80), [renderChart]);
  const renderedBloodPressureChart = useMemo(() => renderChart(bloodPressureTrend, 135), [renderChart]);
  const renderedSleepChart = useMemo(() => renderChart(sleepTrend, 8), [renderChart]);

  return (
    <ScrollView className={styles.page} scrollY>
      <Text className={styles.sectionTitle}>心率趋势</Text>
      <View className={styles.trendCard}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>心率监测</Text>
          <Text className={styles.trendIcon}>❤️</Text>
        </View>
        <View className={styles.chartContainer}>
          {renderedHeartRateChart}
        </View>
      </View>

      <Text className={styles.sectionTitle}>血压趋势</Text>
      <View className={styles.trendCard}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>血压监测</Text>
          <Text className={styles.trendIcon}>🩸</Text>
        </View>
        <View className={styles.chartContainer}>
          {renderedBloodPressureChart}
        </View>
      </View>

      <Text className={styles.sectionTitle}>睡眠趋势</Text>
      <View className={styles.trendCard}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>睡眠监测</Text>
          <Text className={styles.trendIcon}>😴</Text>
        </View>
        <View className={styles.chartContainer}>
          {renderedSleepChart}
        </View>
      </View>

      <View className={styles.recordBtn} onClick={handleRecord}>
        <Text className={styles.recordBtnText}>开始测量</Text>
      </View>
    </ScrollView>
  );
};

export default React.memo(HealthPage);