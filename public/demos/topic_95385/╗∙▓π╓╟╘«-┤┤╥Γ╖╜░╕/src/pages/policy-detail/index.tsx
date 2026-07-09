import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { callFunction } from '@/services/cloud'

export default function PolicyDetailPage() {
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    const id = options.id || '1'
    
    loadPolicy(id)
  }, [])
  
  const loadPolicy = async (id: string) => {
    setLoading(true)
    try {
      const result = await callFunction('getPolicyDetail', { id })
      setPolicy(result.policy)
    } catch (err) {
      console.error('[PolicyDetailPage] loadPolicy error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleBack = () => {
    Taro.navigateBack()
  }
  
  if (loading) {
    return (
      <View className={styles.container}>
        <View className={styles.navBar}>
          <Text className={styles.navTitle}>政策详情</Text>
        </View>
        <View className={styles.loading}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    )
  }
  
  if (!policy) {
    return (
      <View className={styles.container}>
        <View className={styles.navBar}>
          <Text className={styles.navTitle}>政策详情</Text>
        </View>
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>暂无政策内容</Text>
        </View>
      </View>
    )
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <View className={styles.navBack} onClick={handleBack}>
          <Text className={styles.navBackText}>‹</Text>
        </View>
        <Text className={styles.navTitle}>政策详情</Text>
        <View className={styles.navPlaceholder}></View>
      </View>
      
      <ScrollView scrollY style={{ height: 'calc(100vh - 88rpx)', marginTop: '88rpx' }}>
        <View className={styles.header}>
          <Text className={styles.category}>{policy.category}</Text>
          <Text className={styles.title}>{policy.title}</Text>
          <Text className={styles.meta}>发布时间：{policy.createTime} · 浏览次数：{policy.views}</Text>
        </View>
        
        <View className={styles.tags}>
          {policy.tags?.map((tag: string, idx: number) => (
            <Text key={idx} className={styles.tag}>{tag}</Text>
          ))}
        </View>
        
        <View className={styles.content}>
          <Text className={styles.contentText}>{policy.content}</Text>
        </View>
        
        <View className={styles.footer}>
          <View className={styles.actionBtn} onClick={() => Taro.showToast({ title: '已收藏', icon: 'success' })}>
            <Text className={styles.actionBtnText}>⭐ 收藏</Text>
          </View>
          <View className={styles.actionBtn} onClick={() => Taro.showToast({ title: '已分享', icon: 'success' })}>
            <Text className={styles.actionBtnText}>📤 分享</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}