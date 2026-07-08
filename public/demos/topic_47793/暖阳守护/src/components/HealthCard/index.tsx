import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';

interface HealthCardProps {
  icon: string;
  title: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  time: string;
}

const HealthCard: React.FC<HealthCardProps> = ({ icon, title, value, unit, status, time }) => {
  const statusColors = {
    normal: 'color-success',
    warning: 'color-warning',
    danger: 'color-error'
  };

  return (
    <View className={styles.card}>
      <View className={styles.iconWrapper}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.title}>{title}</Text>
        <View className={styles.valueRow}>
          <Text className={`${styles.value} ${styles[statusColors[status]]}`}>{value}</Text>
          <Text className={styles.unit}>{unit}</Text>
        </View>
        <Text className={styles.time}>{time}</Text>
      </View>
      <View className={`${styles.statusDot} ${styles[statusColors[status]]}`} />
    </View>
  );
};

export default HealthCard;