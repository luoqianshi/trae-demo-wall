import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import { DateResult } from '@/types';

interface HistoryItemProps {
  item: DateResult;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const getStatusColor = () => {
    switch (item.status) {
      case 'normal':
        return styles.statusNormal;
      case 'warning':
        return styles.statusWarning;
      case 'expired':
        return styles.statusExpired;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case 'normal':
        return '充足';
      case 'warning':
        return '临期';
      case 'expired':
        return '过期';
    }
  };

  return (
    <View className={styles.item}>
      <View className={styles.imageContainer}>
        <Image src={item.imageUrl} className={styles.image} mode="aspectFill" />
      </View>

      <View className={styles.info}>
        <View className={styles.header}>
          <Text className={styles.productName}>{item.productName}</Text>
          <Text className={`${styles.statusTag} ${getStatusColor()}`}>{getStatusText()}</Text>
        </View>

        <View className={styles.dateInfo}>
          <Text className={styles.dateText}>生产日期：{item.productionDate}</Text>
        </View>

        <View className={styles.dateInfo}>
          <Text className={styles.dateText}>到期日期：{item.expiryDate}</Text>
        </View>

        <View className={styles.bottom}>
          <Text className={styles.timeText}>{item.createTime}</Text>
          <Text className={`${styles.remainingText} ${getStatusColor()}`}>
            {item.remainingDays >= 0 ? `剩${item.remainingDays}天` : `已过期${Math.abs(item.remainingDays)}天`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default HistoryItem;
