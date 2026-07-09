import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import type { QARecord } from '@/types'

interface QAChatProps {
  records: QARecord[]
}

export default function QAChat({ records }: QAChatProps) {
  return (
    <View className={styles.container}>
      {records.map(record => (
        <View key={record.id} className={styles.chatItem}>
          <View className={styles.userMsg}>
            <Text className={styles.msgText}>{record.question}</Text>
          </View>
          <View className={styles.botMsg}>
            <Text className={styles.msgText}>{record.answer}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}