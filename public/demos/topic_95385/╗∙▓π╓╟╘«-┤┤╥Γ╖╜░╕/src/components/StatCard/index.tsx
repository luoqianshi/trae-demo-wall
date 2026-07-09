import React, { useState, useEffect, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import type { Stat } from '@/types'

interface StatCardProps {
  stat: Stat
}

export default function StatCard({ stat }: StatCardProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(true)
            }
          })
        },
        { threshold: 0.3 }
      )
      
      const el = document.querySelector(`[data-stat-id="${stat.id}"]`)
      if (el) {
        observer.observe(el)
      }
      
      return () => observer.disconnect()
    } else {
      setTimeout(() => {
        setIsVisible(true)
      }, 500)
    }
  }, [stat.id])
  
  useEffect(() => {
    if (!isVisible) return
    
    const duration = 2000
    const steps = 60
    const increment = stat.value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= stat.value) {
        setCount(stat.value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [isVisible, stat.value])
  
  return (
    <View className={styles.card} data-stat-id={stat.id}>
      <View className={styles.icon} style={{ color: stat.color }}>
        <Text>{stat.icon}</Text>
      </View>
      <Text className={styles.number} style={{ color: stat.color }}>
        {stat.value >= 10000 ? (count / 10000).toFixed(1) + '万' : count}
        {stat.value >= 100 && stat.value < 10000 && stat.label.includes('%') ? '%' : ''}
      </Text>
      <Text className={styles.label}>{stat.label}</Text>
      <Text className={styles.desc}>{stat.description}</Text>
    </View>
  )
}