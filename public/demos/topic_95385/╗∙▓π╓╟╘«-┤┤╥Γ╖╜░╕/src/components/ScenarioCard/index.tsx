import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import type { Scenario } from '@/types'

interface ScenarioCardProps {
  scenario: Scenario
}

export default function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <View className={styles.card}>
      <View className={styles.iconWrap} style={{ backgroundColor: `${scenario.color}20` }}>
        <Text className={styles.icon} style={{ color: scenario.color }}>{scenario.icon}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.title}>{scenario.title}</Text>
        <Text className={styles.desc}>{scenario.description}</Text>
        <Text className={styles.detail}>"{scenario.detail}"</Text>
      </View>
    </View>
  )
}