import React from 'react';
import { View, Text, Progress } from '@tarojs/components';
import { EyeStatus } from '../../types/eye';
import styles from './index.module.scss';

interface EyeStatusCardProps {
  status: EyeStatus;
}

const EyeStatusCard: React.FC<EyeStatusCardProps> = ({ status }) => {
  const getStatusText = (level: string) => {
    const statusMap = {
      excellent: '优秀',
      good: '良好',
      normal: '一般',
      warning: '注意',
      danger: '危险'
    };
    return statusMap[level] || '一般';
  };

  const getStatusColor = (level: string) => {
    const colorMap = {
      excellent: '#52C41A',
      good: '#73D13D',
      normal: '#FAAD14',
      warning: '#FF7D00',
      danger: '#FF4D4F'
    };
    return colorMap[level] || '#FAAD14';
  };

  const statusColor = getStatusColor(status.level);

  return (
    <View className={styles.statusCard}>
      <View className={styles.statusHeader}>
        <Text className={styles.statusTitle}>当前用眼状态</Text>
        <Text className={styles.statusText} style={{ color: statusColor }}>
          {getStatusText(status.level)}
        </Text>
      </View>

      <View className={styles.statusContent}>
        <View className={styles.statusItem}>
          <Text className={styles.statusLabel}>健康评分</Text>
          <Text className={styles.statusValue} style={{ color: statusColor }}>
            {status.score}
          </Text>
        </View>

        <View className={styles.statusItem}>
          <Text className={styles.statusLabel}>连续使用</Text>
          <Text className={styles.statusValue}>
            {status.continuousTime}分钟
          </Text>
        </View>

        <View className={styles.statusItem}>
          <Text className={styles.statusLabel}>今日休息</Text>
          <Text className={styles.statusValue}>
            {status.todayRestCount}次
          </Text>
        </View>
      </View>

      <View className={styles.progressSection}>
        <Text className={styles.progressLabel}>今日休息进度</Text>
        <Progress
          percent={Math.min((status.todayRestTime / 30) * 100, 100)}
          strokeWidth={8}
          activeColor={statusColor}
          backgroundColor="#F2F3F5"
          borderRadius={4}
        />
        <Text className={styles.progressText}>
          已休息 {status.todayRestTime} 分钟 / 目标 30 分钟
        </Text>
      </View>
    </View>
  );
};

export default EyeStatusCard;