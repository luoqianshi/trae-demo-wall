import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

type TagColor = 'primary' | 'accent' | 'success' | 'warning' | 'grey' | 'danger';

interface TagProps {
  text: string;
  color?: TagColor;
  size?: 'sm' | 'md';
  icon?: string;
  onClick?: () => void;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ text, color = 'primary', size = 'sm', icon, onClick, className }) => {
  return (
    <View
      className={classnames(styles.tag, styles[color], styles[`size${size}`], className)}
      onClick={onClick}
    >
      {icon && <Text className={styles.icon}>{icon}</Text>}
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default Tag;
