import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface BigButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const BigButton: React.FC<BigButtonProps> = ({
  text,
  onClick,
  type = 'primary',
  disabled = false
}) => {
  return (
    <View className={styles.buttonWrapper}>
      <Button
        className={classnames(styles.bigButton, {
          [styles.primary]: type === 'primary',
          [styles.secondary]: type === 'secondary',
          [styles.danger]: type === 'danger',
          [styles.disabled]: disabled
        })}
        onClick={onClick}
        disabled={disabled}
      >
        <Text className={styles.buttonText}>{text}</Text>
      </Button>
    </View>
  );
};

export default BigButton;
