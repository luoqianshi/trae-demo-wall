import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import Tag from '../Tag';
import { formatCount, formatRelativeTime, getLevelLabel } from '../../utils/format';
import type { Article } from '../../types/article';
import styles from './index.module.scss';

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
  onLike?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, onLike }) => {
  const categoryMap: Record<string, { label: string; color: any }> = {
    tech: { label: '钓技', color: 'primary' },
    spot: { label: '钓点', color: 'accent' },
    gear: { label: '装备', color: 'success' },
    experience: { label: '故事', color: 'warning' }
  };
  const cat = categoryMap[article.category];

  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.authorRow}>
        <Image className={styles.avatar} src={article.authorAvatar} mode="aspectFill" />
        <View className={styles.authorInfo}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{article.authorName}</Text>
            <View className={styles.levelTag}>
              <Text className={styles.levelText}>Lv{article.authorLevel}</Text>
            </View>
          </View>
          <Text className={styles.meta}>
            {getLevelLabel(article.authorLevel)} · 钓龄{article.authorYears}年 · {formatRelativeTime(article.createdAt)}
          </Text>
        </View>
        <Tag text={cat.label} color={cat.color} size="sm" />
      </View>

      <View className={styles.content}>
        <Text className={styles.title}>{article.title}</Text>
        <Text className={styles.summary}>{article.summary}</Text>
      </View>

      <View className={styles.coverWrap}>
        <Image className={styles.cover} src={article.cover} mode="aspectFill" />
      </View>

      <View className={styles.tagRow}>
        {article.tags.slice(0, 3).map((tag) => (
          <Tag key={tag} text={`#${tag}`} color="grey" size="sm" />
        ))}
        <View className={styles.locationTag}>
          <Text className={styles.locationText}>📍 {article.location}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <View
          className={classnames(styles.actionItem, article.liked && styles.actionItemActive)}
          onClick={(e) => {
            e.stopPropagation();
            onLike?.();
          }}
        >
          <Text className={styles.actionIcon}>{article.liked ? '♥' : '♡'}</Text>
          <Text className={styles.actionText}>{formatCount(article.likes)}</Text>
        </View>
        <View className={styles.actionItem}>
          <Text className={styles.actionIcon}>💬</Text>
          <Text className={styles.actionText}>{formatCount(article.comments)}</Text>
        </View>
        <View className={styles.actionItem}>
          <Text className={styles.actionIcon}>👁</Text>
          <Text className={styles.actionText}>{formatCount(article.views)}</Text>
        </View>
      </View>
    </View>
  );
};

export default ArticleCard;
