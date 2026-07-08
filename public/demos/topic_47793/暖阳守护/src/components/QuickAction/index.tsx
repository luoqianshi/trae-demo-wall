import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface QuickActionProps {
  icon: string;
  name: string;
  path: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, name, path }) => {
  const handleClick = () => {
    Taro.navigateTo({ url: path });
  };

  return (
    <View className={styles.actionItem} onClick={handleClick}>
      <View className={styles.iconWrapper}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <Text className={styles.name}>{name}</Text>
    </View>
  );
};

export default QuickAction;