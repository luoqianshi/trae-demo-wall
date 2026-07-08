import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import styles from './index.module.scss';
import { DateResult } from '@/types';

interface ResultCardProps {
  result: DateResult;
  onSpeak: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onSpeak }) => {
  const getStatusText = () => {
    switch (result.status) {
      case 'normal':
        return '保质期充足';
      case 'warning':
        return '即将过期';
      case 'expired':
        return '已过期';
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'normal':
        return styles.statusNormal;
      case 'warning':
        return styles.statusWarning;
      case 'expired':
        return styles.statusExpired;
    }
  };

  const getStatusBgColor = () => {
    switch (result.status) {
      case 'normal':
        return styles.statusBgNormal;
      case 'warning':
        return styles.statusBgWarning;
      case 'expired':
        return styles.statusBgExpired;
    }
  };

  return (
    <View className={styles.card}>
      <View className={styles.imageContainer}>
        <Image src={result.imageUrl} className={styles.image} mode="aspectFill" />
      </View>

      <View className={styles.infoSection}>
        <View className={`${styles.statusBadge} ${getStatusBgColor()} ${getStatusColor()}`}>
          <Text className={styles.statusText}>{getStatusText()}</Text>
        </View>

        <Text className={styles.productName}>{result.productName}</Text>

        <View className={styles.dateRow}>
          <Text className={styles.dateLabel}>生产日期：</Text>
          <Text className={styles.dateValue}>{result.productionDate}</Text>
        </View>

        <View className={styles.dateRow}>
          <Text className={styles.dateLabel}>保质期：</Text>
          <Text className={styles.dateValue}>{result.shelfLife}</Text>
        </View>

        <View className={styles.dateRow}>
          <Text className={styles.dateLabel}>到期日期：</Text>
          <Text className={styles.dateValue}>{result.expiryDate}</Text>
        </View>

        <View className={styles.remainingSection}>
          <Text className={styles.remainingLabel}>距离过期还有</Text>
          <Text className={`${styles.remainingDays} ${getStatusColor()}`}>
            {result.remainingDays >= 0 ? `${result.remainingDays}` : `${Math.abs(result.remainingDays)}`}
          </Text>
          <Text className={styles.remainingUnit}>天</Text>
        </View>

        <Button className={styles.speakButton} onClick={onSpeak}>
          <Text className={styles.speakButtonText}>🔊 语音播报</Text>
        </Button>
      </View>
    </View>
  );
};

export default ResultCard;
