import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import type { Policy } from '@/types'

interface PolicyCardProps {
  policy: Policy
  onClick?: () => void
}

export default function PolicyCard({ policy, onClick }: PolicyCardProps) {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.category}>{policy.category}</Text>
        <Text className={styles.time}>{policy.createTime}</Text>
      </View>
      <Text className={styles.title}>{policy.title}</Text>
      <Text className={styles.summary}>{policy.summary}</Text>
      <View className={styles.footer}>
        <View className={styles.tags}>
          {policy.tags.slice(0, 2).map((tag, idx) => (
            <Text key={idx} className={styles.tag}>{tag}</Text>
          ))}
        </View>
        <Text className={styles.views}>
          阅读 {policy.viewCount}
        </Text>
      </View>
    </View>
  )
}