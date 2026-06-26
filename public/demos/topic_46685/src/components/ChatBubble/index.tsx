import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ChatMessage } from '@/types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  return (
    <View className={classnames(styles.bubbleContainer, {
      [styles.userContainer]: message.type === 'user',
      [styles.aiContainer]: message.type === 'ai'
    })}>
      <View className={classnames(styles.avatar, {
        [styles.userAvatar]: message.type === 'user',
        [styles.aiAvatar]: message.type === 'ai'
      })}>
        <Text className={styles.avatarText}>{message.type === 'user' ? '我' : '暖'}</Text>
      </View>
      <View className={classnames(styles.bubble, {
        [styles.userBubble]: message.type === 'user',
        [styles.aiBubble]: message.type === 'ai'
      })}>
        <Text className={styles.content}>{message.content}</Text>
        <Text className={styles.time}>{message.time}</Text>
      </View>
    </View>
  );
};

export default ChatBubble;
