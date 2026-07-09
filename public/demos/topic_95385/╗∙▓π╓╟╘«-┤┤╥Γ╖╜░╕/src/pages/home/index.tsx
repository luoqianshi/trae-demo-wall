import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import FeatureCard from '@/components/FeatureCard'
import PolicyCard from '@/components/PolicyCard'
import StatCard from '@/components/StatCard'
import ScenarioCard from '@/components/ScenarioCard'
import { getHotPolicies } from '@/data/policies'
import type { Feature, Stat, Scenario } from '@/types'

const features: Feature[] = [
  { id: '1', title: '政策信息库', description: '分类整理政策文件、办事指南，支持关键词搜索与热点推荐', color: '#87CEEB', icon: '📋' },
  { id: '2', title: '智能问答助手', description: 'AI驱动的智能问答引擎，7x24小时自动解答群众常见咨询', color: '#87CEEB', icon: '🤖' },
  { id: '3', title: '信息推送工具', description: '快速生成通知公告，一键推送到微信群、朋友圈', color: '#87CEEB', icon: '📢' },
  { id: '4', title: '办事流程指引', description: '图文并茂展示办事步骤、所需材料、办理地点', color: '#87CEEB', icon: '📍' },
  { id: '5', title: '学习培训', description: '政策解读视频、业务技能课程、在线考试测评', color: '#87CEEB', icon: '📚' }
]

const stats: Stat[] = [
  { id: '1', value: 80, label: '效率提升', description: '一站式平台整合分散信息', color: '#5CACEE', icon: '⚡' },
  { id: '2', value: 60, label: '时间节省', description: '智能问答自动解答常见问题', color: '#5CACEE', icon: '⏱️' },
  { id: '3', value: 500000, label: '潜在受益', description: '覆盖全国基层工作者服务群体', color: '#5CACEE', icon: '👥' }
]

const scenarios: Scenario[] = [
  { id: '1', title: '政策咨询场景', description: '群众来访咨询政策时，快速搜索相关政策文件，一键生成解读内容', detail: '社区工作人员小李正在帮助居民了解最新的社保政策', color: '#87CEEB', icon: '💬' },
  { id: '2', title: '信息推送场景', description: '上级政策通知下达时，快速生成通俗易懂的通知公告', detail: '村干部老王收到上级的防汛通知，5分钟内生成通知', color: '#87CEEB', icon: '📤' },
  { id: '3', title: '办事指引场景', description: '群众需要办理证照或申请补贴时，提供标准化的流程指引', detail: '志愿者小张帮助老人办理医保手续', color: '#87CEEB', icon: '📋' },
  { id: '4', title: '自我学习场景', description: '新政策出台时，第一时间获取解读培训', detail: '街道办工作人员利用碎片时间学习惠民政策', color: '#87CEEB', icon: '📖' }
]

export default function HomePage() {
  const [hotPolicies, setHotPolicies] = useState<any[]>([])
  
  useEffect(() => {
    setHotPolicies(getHotPolicies())
  }, [])
  
  const handlePolicyClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/policy-detail/index?id=${id}` })
  }
  
  const handleFeatureClick = (id: string) => {
    if (id === '1') {
      Taro.switchTab({ url: '/pages/policy/index' })
    } else if (id === '2') {
      Taro.switchTab({ url: '/pages/qa/index' })
    } else if (id === '3') {
      Taro.navigateTo({ url: '/pages/push/index' })
    } else if (id === '4') {
      Taro.navigateTo({ url: '/pages/guide/index' })
    } else if (id === '5') {
      Taro.switchTab({ url: '/pages/mine/index' })
    }
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <Text className={styles.navTitle}>基层智援</Text>
      </View>
      
      <ScrollView scrollY style={{ height: 'calc(100vh - 88rpx)' }}>
        <View className={styles.hero}>
          <Text className={styles.heroTitle}>基层智援</Text>
          <Text className={styles.heroSubtitle}>为基层工作者打造的智能服务平台</Text>
          <Text className={styles.heroDesc}>一站式整合政策信息、智能问答、办事指引，让基层服务更高效、更专业、更有温度</Text>
          <View className={styles.tags}>
            <Text className={styles.tag}>社区工作人员</Text>
            <Text className={styles.tag}>村干部</Text>
            <Text className={styles.tag}>基层志愿者</Text>
          </View>
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>五大核心功能</Text>
          <Text className={styles.sectionDesc}>专为基层工作场景设计，一站式解决信息获取、政策传达、群众咨询等核心痛点</Text>
          <View className={styles.featuresGrid}>
            {features.map(feature => (
              <View key={feature.id} className={styles.featureCard} onClick={() => handleFeatureClick(feature.id)}>
                <View className={styles.featureIcon} style={{ backgroundColor: `${feature.color}20` }}>
                  <Text>{feature.icon}</Text>
                </View>
                <Text className={styles.featureTitle}>{feature.title}</Text>
                <Text className={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.divider}>
          <View className={styles.dividerLine}></View>
          <Text className={styles.dividerTitle}>真实的价值与意义</Text>
          <Text className={styles.dividerDesc}>数字见证成效，让基层工作更高效、更专业、更有温度</Text>
        </View>
        
        <View className={styles.section}>
          <View className={styles.statsGrid}>
            {stats.map(stat => (
              <View key={stat.id} className={styles.statCard}>
                <View className={styles.statIcon}>
                  <Text>{stat.icon}</Text>
                </View>
                <Text className={styles.statNumber}>{stat.value}%</Text>
                <Text className={styles.statLabel}>{stat.label}</Text>
                <Text className={styles.statDesc}>{stat.description}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>实际使用场景</Text>
          <Text className={styles.sectionDesc}>从日常咨询到政策传达，基层智援在每个场景都能提供高效支持</Text>
          <View className={styles.scenariosList}>
            {scenarios.map(scenario => (
              <View key={scenario.id} className={styles.scenarioCard}>
                <View className={styles.scenarioIcon} style={{ backgroundColor: `${scenario.color}20` }}>
                  <Text>{scenario.icon}</Text>
                </View>
                <View className={styles.scenarioContent}>
                  <Text className={styles.scenarioTitle}>{scenario.title}</Text>
                  <Text className={styles.scenarioDesc}>{scenario.description}</Text>
                  <Text className={styles.scenarioQuote}>"{scenario.detail}"</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>热门政策</Text>
          <Text className={styles.sectionDesc}>最新最热门的政策信息，第一时间掌握</Text>
          <View className={styles.hotPolicies}>
            {hotPolicies.map(policy => (
              <PolicyCard key={policy.id} policy={policy} onClick={() => handlePolicyClick(policy.id)} />
            ))}
          </View>
        </View>
        
        <View className={styles.section}>
          <View className={styles.quickEntry}>
            <View className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/policy/index' })}>
              <View className={styles.entryIcon}>📋</View>
              <Text className={styles.entryText}>政策库</Text>
            </View>
            <View className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/qa/index' })}>
              <View className={styles.entryIcon}>🤖</View>
              <Text className={styles.entryText}>智能问答</Text>
            </View>
            <View className={styles.entryItem}>
              <View className={styles.entryIcon}>📢</View>
              <Text className={styles.entryText}>信息推送</Text>
            </View>
            <View className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/mine/index' })}>
              <View className={styles.entryIcon}>👤</View>
              <Text className={styles.entryText}>我的</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}