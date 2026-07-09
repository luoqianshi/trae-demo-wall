import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { callFunction } from '@/services/cloud'

const menuItems = [
  { id: 'history', icon: '📖', text: '浏览历史' },
  { id: 'collections', icon: '⭐', text: '我的收藏' },
  { id: 'learning', icon: '🎓', text: '学习进度' },
  { id: 'settings', icon: '⚙️', text: '设置' },
  { id: 'feedback', icon: '💬', text: '意见反馈' },
  { id: 'about', icon: 'ℹ️', text: '关于我们' }
]

export default function MinePage() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [userInfo, setUserInfo] = useState({ nickname: '基层工作者', role: '社区工作人员' })
  
  useEffect(() => {
    loadFavorites()
    loadUserInfo()
  }, [])
  
  const loadFavorites = async () => {
    try {
      const result = await callFunction('getFavorites')
      setFavorites(result.favorites || [])
    } catch (err) {
      console.error('[MinePage] loadFavorites error:', err)
    }
  }
  
  const loadUserInfo = async () => {
    try {
      const result = await callFunction('login')
      if (result.userInfo) {
        setUserInfo({
          nickname: result.userInfo.nickname,
          role: result.userInfo.role === 'community' ? '社区工作人员' : 
                result.userInfo.role === 'village' ? '村干部' : 
                result.userInfo.role === 'volunteer' ? '基层志愿者' : '乡镇工作人员'
        })
      }
    } catch (err) {
      console.error('[MinePage] loadUserInfo error:', err)
    }
  }
  
  const handleMenuItemClick = (id: string) => {
    if (id === 'collections') {
      Taro.showToast({ title: '我的收藏', icon: 'none' })
    } else if (id === 'learning') {
      Taro.showToast({ title: '学习进度', icon: 'none' })
    } else if (id === 'settings') {
      Taro.showToast({ title: '设置', icon: 'none' })
    } else if (id === 'feedback') {
      Taro.showToast({ title: '意见反馈', icon: 'none' })
    } else if (id === 'about') {
      Taro.showToast({ title: '关于我们', icon: 'none' })
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }
  
  const handleFavoriteClick = (policyId: string) => {
    Taro.navigateTo({ url: `/pages/policy-detail/index?id=${policyId}` })
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <Text className={styles.navTitle}>我的</Text>
      </View>
      
      <ScrollView scrollY style={{ height: 'calc(100vh - 88rpx)' }}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{userInfo.nickname}</Text>
            <Text className={styles.userRole}>{userInfo.role}</Text>
          </View>
        </View>
        
        <View className={styles.section}>
          <View className={styles.menuCard}>
            {menuItems.map(item => (
              <View key={item.id} className={styles.menuItem} onClick={() => handleMenuItemClick(item.id)}>
                <Text className={styles.menuIcon}>{item.icon}</Text>
                <Text className={styles.menuText}>{item.text}</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>学习进度</Text>
          <View className={styles.learningProgress}>
            <View className={styles.progressHeader}>
              <Text className={styles.progressTitle}>政策学习</Text>
              <Text className={styles.progressPercent}>45%</Text>
            </View>
            <View className={styles.progressBar}>
              <View className={styles.progressFill}></View>
            </View>
            <View className={styles.progressCourses}>
              <View className={styles.progressCourse}>
                <Text className={styles.progressCourseNum}>8</Text>
                <Text className={styles.progressCourseLabel}>已学课程</Text>
              </View>
              <View className={styles.progressCourse}>
                <Text className={styles.progressCourseNum}>12</Text>
                <Text className={styles.progressCourseLabel}>待学课程</Text>
              </View>
              <View className={styles.progressCourse}>
                <Text className={styles.progressCourseNum}>3</Text>
                <Text className={styles.progressCourseLabel}>已通过考试</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>我的收藏</Text>
          <View className={styles.favoritesSection}>
            {favorites.length === 0 ? (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>📭</Text>
                <Text className={styles.emptyText}>暂无收藏</Text>
              </View>
            ) : (
              favorites.slice(0, 3).map(fav => (
                <View key={fav.id} className={styles.favoriteItem} onClick={() => handleFavoriteClick(fav.policyId)}>
                  <Text className={styles.favoriteIcon}>⭐</Text>
                  <View className={styles.favoriteContent}>
                    <Text className={styles.favoriteTitle}>{fav.policy?.title}</Text>
                    <Text className={styles.favoriteTime}>{fav.policy?.createTime}</Text>
                  </View>
                  <Text className={styles.menuArrow}>›</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}