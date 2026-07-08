import type { FC } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const SettingsPage: FC = () => {
  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
          <Text className={styles.backIcon}>‹</Text>
          <Text className={styles.backText}>返回</Text>
        </View>
      </View>
      <Text className={styles.icon}>⚙️</Text>
      <Text className={styles.title}>设置功能</Text>
      <Text className={styles.desc}>功能正在开发中...</Text>
    </View>
  );
};

export default SettingsPage;