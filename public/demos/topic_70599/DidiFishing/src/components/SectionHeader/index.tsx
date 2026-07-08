import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  extra?: string;
  onExtraClick?: () => void;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, extra, onExtraClick, className }) => {
  return (
    <View className={classnames(styles.wrap, className)}>
      <View className={styles.titleArea}>
        <View className={styles.bar} />
        <Text className={styles.title}>{title}</Text>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
      </View>
      {extra && (
        <View className={styles.extra} onClick={onExtraClick}>
          <Text className={styles.extraText}>{extra}</Text>
          <Text className={styles.extraIcon}>›</Text>
        </View>
      )}
    </View>
  );
};

export default SectionHeader;
