import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import PolicyCard from '@/components/PolicyCard'
import { callFunction } from '@/services/cloud'
import { categories } from '@/data/policies'

export default function PolicyPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  useEffect(() => {
    loadPolicies()
  }, [selectedCategory, keyword])
  
  const loadPolicies = async () => {
    setLoading(true)
    try {
      const result = await callFunction('getPolicies', {
        category: selectedCategory || undefined,
        keyword: keyword || undefined,
        page: 1,
        pageSize: 20
      })
      setPolicies(result.policies || [])
    } catch (err) {
      console.error('[PolicyPage] loadPolicies error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePolicyClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/policy-detail/index?id=${id}` })
  }
  
  const handleSearch = (e: any) => {
    setKeyword(e.detail.value)
  }
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId)
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <Text className={styles.navTitle}>政策库</Text>
      </View>
      
      <View className={styles.searchBar}>
        <View className={styles.searchInput}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input 
            className={styles.input} 
            placeholder="搜索政策、办事指南..." 
            placeholderStyle="color: #999999"
            value={keyword}
            onChange={handleSearch}
          />
        </View>
      </View>
      
      <View className={styles.categories}>
        <ScrollView className={styles.categoriesScroll} scrollX>
          <View 
            className={`${styles.categoryItem} ${!selectedCategory ? styles.active : ''}`} 
            onClick={() => handleCategoryClick('')}
          >
            全部
          </View>
          {categories.map(cat => (
            <View 
              key={cat.id} 
              className={`${styles.categoryItem} ${selectedCategory === cat.id ? styles.active : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name} ({cat.count})
            </View>
          ))}
        </ScrollView>
      </View>
      
      <View className={styles.content}>
        {loading ? (
          <View className={styles.loading}>加载中...</View>
        ) : policies.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无相关政策</Text>
          </View>
        ) : (
          <View className={styles.policyList}>
            {policies.map(policy => (
              <PolicyCard key={policy.id} policy={policy} onClick={() => handlePolicyClick(policy.id)} />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}