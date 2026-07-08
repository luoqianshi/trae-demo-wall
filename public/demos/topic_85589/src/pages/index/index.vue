<template>
  <view class="page-container">
    <view class="header-section">
      <view class="welcome-text">
        <text class="welcome-title">欢迎回家</text>
        <text class="welcome-desc">同小区认证邻里互助平台</text>
      </view>
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">{{ neighborData.totalUsers }}</text>
          <text class="stat-label">认证住户</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ neighborData.monthlyHelpCount }}</text>
          <text class="stat-label">本月互助</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ neighborData.activeUsers }}</text>
          <text class="stat-label">活跃邻居</text>
        </view>
      </view>
    </view>

    <view class="emergency-section">
      <button class="emergency-btn" @click="showEmergencyModal">
        <text class="emerg-icon">🚨</text>
        <text class="emerg-text">一键紧急求助</text>
      </button>
      <text class="emerg-desc">点击按钮，系统将立即推送您的位置给周边500米内认证邻居</text>
    </view>

    <view class="cards-section">
      <view class="card-item" v-for="(item, index) in helpCategories" :key="index" @click="handleCardClick(index)">
        <text class="card-icon">{{ item.icon }}</text>
        <text class="card-title">{{ item.title }}</text>
        <text class="card-desc">{{ item.desc }}</text>
      </view>
    </view>

    <view class="bottom-section">
      <button class="btn-publish" @click="goToPublish">发布互助任务</button>
    </view>

    <EmergencyModal 
      :visible="showEmergModal" 
      @close="showEmergModal = false" 
      @confirm="handleEmergencyConfirm"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EmergencyModal from '@/components/EmergencyModal.vue'
import { helpCategories, neighborData as initialNeighborData, getNeighborData, sendEmergencyHelp } from '@/mock/data'
import { showToast, navigateTo } from '@/utils/common'

const neighborData = ref(initialNeighborData)
const showEmergModal = ref(false)

onMounted(() => {
  loadNeighborData()
})

async function loadNeighborData() {
  try {
    const data = await getNeighborData()
    neighborData.value = data
  } catch (error) {
    console.error('加载邻里数据失败:', error)
  }
}

function showEmergencyModal() {
  showEmergModal.value = true
}

async function handleEmergencyConfirm(desc: string) {
  try {
    const result = await sendEmergencyHelp(desc)
    showToast(`求助已发送！\n已通知${result.notifiedCount}位邻居`, 'success')
    showEmergModal.value = false
  } catch (error) {
    showToast('发送求助失败，请重试', 'error')
  }
}

function handleCardClick(index: number) {
  const titles = ['日常互助', '邻里结伴', '我的邻居']
  showToast(`即将进入${titles[index]}页面`, 'none')
}

function goToPublish() {
  navigateTo('/pages/publish/publish')
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $bg-color;
  padding: $spacing-md;
  padding-bottom: $spacing-xl;
}

.header-section {
  padding: $spacing-lg 0;
}

.welcome-text {
  margin-bottom: $spacing-lg;
  
  .welcome-title {
    display: block;
    font-size: $font-size-xxl;
    font-weight: bold;
    color: $text-color;
    margin-bottom: $spacing-xs;
  }
  
  .welcome-desc {
    font-size: $font-size-sm;
    color: $text-color-light;
  }
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .stat-value {
    font-size: $font-size-xl;
    font-weight: bold;
    color: $primary-color;
    margin-bottom: $spacing-xs;
  }
  
  .stat-label {
    font-size: $font-size-xs;
    color: $text-color-light;
  }
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: $border-color;
}

.emergency-section {
  margin: $spacing-lg 0;
  
  .emergency-btn {
    width: 100%;
    height: 144rpx;
    background: linear-gradient(135deg, $primary-dark 0%, $primary-color 100%);
    border: none;
    border-radius: $border-radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
    box-shadow: $shadow-lg;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      animation: pulse 2s infinite;
    }
    
    &:active {
      transform: translateY(-4rpx);
      box-shadow: 0 16rpx 40rpx rgba(255, 71, 87, 0.5);
    }
  }
  
  .emerg-icon {
    font-size: 48rpx;
    animation: blink 1s infinite;
  }
  
  .emerg-text {
    font-size: $font-size-xl;
    font-weight: bold;
    color: #ffffff;
  }
  
  .emerg-desc {
    display: block;
    text-align: center;
    font-size: $font-size-xs;
    color: $text-color-light;
    margin-top: $spacing-sm;
    line-height: 1.5;
  }
}

.cards-section {
  margin: $spacing-lg 0;
}

.card-item {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
  transition: all 0.2s ease;
  
  &:active {
    transform: translateY(-4rpx);
    box-shadow: $shadow-md;
  }
  
  .card-icon {
    font-size: 64rpx;
    margin-bottom: $spacing-sm;
    display: block;
  }
  
  .card-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $text-color;
    margin-bottom: $spacing-xs;
    display: block;
  }
  
  .card-desc {
    font-size: $font-size-sm;
    color: $text-color-light;
    line-height: 1.5;
    display: block;
  }
}

.bottom-section {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $spacing-md;
  background: linear-gradient(to top, rgba(245, 247, 250, 0.95), transparent);
  
  .btn-publish {
    width: 100%;
    height: 96rpx;
    background: $bg-color-white;
    border: 2rpx solid $primary-color;
    border-radius: $border-radius-xl;
    font-size: $font-size-lg;
    color: $primary-color;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:active {
      background: $primary-light;
      transform: translateY(-2rpx);
    }
  }
}

@keyframes pulse {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
