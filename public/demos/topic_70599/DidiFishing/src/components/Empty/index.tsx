import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyProps {
  icon?: string;
  title?: string;
  desc?: string;
  actionText?: string;
  onAction?: () => void;
}

const Empty: React.FC<EmptyProps> = ({ icon = '🪝', title = '暂无内容', desc = '', actionText, onAction }) => {
  return (
    <View className={styles.wrap}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.title}>{title}</Text>
      {desc && <Text className={styles.desc}>{desc}</Text>}
      {actionText && (
        <View className={styles.action} onClick={onAction}>
          <Text className={styles.actionText}>{actionText}</Text>
        </View>
      )}
    </View>
  );
};

export default Empty;
