import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import type { Feature } from '@/types'

interface FeatureCardProps {
  feature: Feature
  onClick?: () => void
}

export default function FeatureCard({ feature, onClick }: FeatureCardProps) {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.icon} style={{ color: feature.color, backgroundColor: `${feature.color}20` }}>
        <Text>{feature.icon}</Text>
      </View>
      <Text className={styles.title}>{feature.title}</Text>
      <Text className={styles.desc}>{feature.description}</Text>
    </View>
  )
}