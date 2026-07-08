import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import { getLevelLabel } from '../../utils/format';
import styles from './index.module.scss';

interface AvatarProps {
  src: string;
  name: string;
  level?: number;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, level, size = 'md', showLevel = true, onClick }) => {
  const sizeMap = {
    sm: 56,
    md: 80,
    lg: 120
  };
  const px = sizeMap[size];

  return (
    <View className={styles.wrap} onClick={onClick}>
      <Image
        className={styles.avatar}
        src={src}
        style={{ width: `${px}rpx`, height: `${px}rpx` }}
        mode="aspectFill"
      />
      {showLevel && level !== undefined && (
        <View className={classnames(styles.levelBadge, styles[`level${level}`])}>
          <Text className={styles.levelText}>Lv{level}</Text>
        </View>
      )}
      {size === 'lg' && (
        <View className={styles.nameRow}>
          <Text className={styles.name}>{name}</Text>
          {level !== undefined && <Text className={styles.levelLabel}>{getLevelLabel(level)}</Text>}
        </View>
      )}
    </View>
  );
};

export default Avatar;
