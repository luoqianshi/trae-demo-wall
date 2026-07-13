<script setup lang="ts">
import { ref } from 'vue'
import { useBrandStore } from '@/stores/brand'

const store = useBrandStore()
const categories = store.getCategories()
const alerts = store.getAlerts()
const features = store.getFeatures()

const searchValue = ref('')

const onCategoryTap = (categoryId: string) => {
  uni.switchTab({ url: '/pages/ranking/index' })
}

const onAlertTap = (alertId: string) => {
  uni.navigateTo({ url: `/pages/scan/index?brandId=${alertId}` })
}

const onScanTap = () => {
  uni.navigateTo({ url: '/pages/scan/index' })
}

const onSearchTap = () => {
  uni.navigateTo({ url: '/pages/search/index' })
}

const onViewAllAlerts = () => {
  uni.navigateTo({ url: '/pages/search/index' })
}
</script>

<template>
  <view class="home-page">
    <!-- Status Bar -->
    <view class="status-bar">
      <text class="status-time">9:41</text>
      <view class="status-icons">
        <view class="signal-icon">
          <view class="signal-bar" style="height: 6px;"></view>
          <view class="signal-bar" style="height: 8px;"></view>
          <view class="signal-bar" style="height: 10px;"></view>
          <view class="signal-bar" style="height: 12px;"></view>
        </view>
        <view class="wifi-icon">
          <view class="wifi-arc"></view>
          <view class="wifi-arc2"></view>
          <view class="wifi-dot"></view>
        </view>
        <view class="battery-icon">
          <view class="battery-body">
            <view class="battery-fill"></view>
          </view>
          <view class="battery-cap"></view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="main-content" :show-scrollbar="false">
      <!-- Hero Section -->
      <view class="hero-section">
        <view class="hero-bg"></view>
        <view class="hero-content">
          <view class="hero-logo">
            <view class="hero-logo-icon">
              <view class="shield-icon"></view>
            </view>
            <text class="hero-app-name">品牌红黑榜</text>
          </view>
          <text class="hero-tagline">AI守护每一次消费决策</text>
          <view class="hero-search" @tap="onSearchTap">
            <view class="search-icon"></view>
            <input type="text" placeholder="输入品牌名称或扫描条码" v-model="searchValue" disabled />
          </view>
          <button class="cta-scan-btn" @tap="onScanTap">
            <view class="qr-icon"></view>
            <text>扫码查询</text>
          </button>
        </view>
      </view>

      <!-- Category Grid Section -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">分类监控</text>
          <view class="section-more" @tap="onCategoryTap('all')">
            <text>全部分类</text>
            <view class="arrow-icon"></view>
          </view>
        </view>
        <view class="category-grid">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="category-card"
            :class="`color-${cat.color}`"
            @tap="onCategoryTap(cat.id)"
          >
            <text class="category-badge">{{ cat.count.toLocaleString() }}</text>
            <view class="category-icon">
              <view :class="`icon-${cat.icon}`"></view>
            </view>
            <text class="category-name">{{ cat.name }}</text>
            <text class="category-count">已监控 {{ cat.count.toLocaleString() }} 个品牌</text>
          </view>
        </view>
      </view>

      <!-- Recent Alerts Section -->
      <view class="section section-no-top">
        <view class="section-header">
          <text class="section-title">近期预警</text>
          <view class="section-more" @tap="onViewAllAlerts">
            <text>查看全部</text>
            <view class="arrow-icon"></view>
          </view>
        </view>
        <view class="alert-list">
          <view
            v-for="alert in alerts"
            :key="alert.id"
            class="alert-card"
            @tap="onAlertTap(alert.id)"
          >
            <view class="alert-indicator" :class="alert.type"></view>
            <view class="alert-body">
              <view class="alert-top">
                <text class="alert-brand">{{ alert.brandName }}</text>
                <view class="alert-badge" :class="alert.type">
                  <text>{{ alert.type === 'red-list' ? '红榜' : alert.type === 'black-list' ? '黑榜' : '预警' }}</text>
                </view>
              </view>
              <text class="alert-reason">{{ alert.reason }}</text>
              <text class="alert-time">{{ alert.time }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Feature Highlights Section -->
      <view class="section section-no-top">
        <view class="section-header">
          <text class="section-title">核心功能</text>
        </view>
        <scroll-view scroll-x class="feature-scroll" :show-scrollbar="false">
          <view
            v-for="feature in features"
            :key="feature.id"
            class="feature-card"
          >
            <image
              v-if="feature.image"
              class="feature-card-image"
              :src="feature.image"
              mode="aspectFill"
            />
            <view v-else class="feature-card-placeholder" :class="`bg-${feature.bgColor}`">
              <view v-if="feature.id === '2'" class="icon-ai"></view>
              <view v-else class="icon-sync"></view>
            </view>
            <view class="feature-card-body">
              <text class="feature-card-title">{{ feature.title }}</text>
              <text class="feature-card-desc">{{ feature.description }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Bottom Spacer -->
      <view style="height: 24px;"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
  min-height: 100vh;
  background: $color-surface;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Status Bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px 8px 24px;
  background: transparent;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  height: 44px;
}
.status-time {
  font-size: $text-sm;
  font-weight: $font-semibold;
  letter-spacing: 0.02em;
  color: $color-text-primary;
}
.status-icons {
  display: flex;
  align-items: center;
  gap: 6px;
}
.signal-icon {
  display: flex;
  align-items: flex-end;
  gap: 3px;
}
.signal-bar {
  width: 3px;
  border-radius: 1px;
  background: $color-text-primary;
}
.wifi-icon {
  position: relative;
  width: 15px;
  height: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.wifi-arc {
  width: 15px;
  height: 7.5px;
  border-top: 2px solid $color-text-primary;
  border-left: 2px solid $color-text-primary;
  border-right: 2px solid $color-text-primary;
  border-radius: 15px 15px 0 0;
  position: absolute;
  bottom: 0;
}
.wifi-arc2 {
  width: 9px;
  height: 4.5px;
  border-top: 2px solid $color-text-primary;
  border-left: 2px solid $color-text-primary;
  border-right: 2px solid $color-text-primary;
  border-radius: 9px 9px 0 0;
  position: absolute;
  bottom: 0;
}
.wifi-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: $color-text-primary;
  position: absolute;
  bottom: 0;
}
.battery-icon {
  display: flex;
  align-items: center;
}
.battery-body {
  width: 22px;
  height: 10px;
  border: 1px solid $color-text-primary;
  border-radius: 2px;
  padding: 1px;
  display: flex;
  align-items: center;
}
.battery-fill {
  width: 16px;
  height: 6px;
  background: $color-text-primary;
  border-radius: 1px;
}
.battery-cap {
  width: 2px;
  height: 4px;
  background: $color-text-primary;
  border-radius: 0 1px 1px 0;
  margin-left: 1px;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 24px 20px 32px;
  background: linear-gradient(165deg, #0F4A2E 0%, #1A7A4C 50%, #16A34A 100%);
  color: $color-text-inverse;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: url('/static/images/image_1.jpg') center/cover no-repeat;
  opacity: 0.15;
  pointer-events: none;
}
.hero-section::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: -20px;
  right: -20px;
  height: 40px;
  background: $color-surface;
  border-radius: 50% 50% 0 0;
}
.hero-content {
  position: relative;
  z-index: 1;
}
.hero-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.hero-logo-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
.shield-icon {
  width: 24px;
  height: 24px;
  border: 2px solid #fff;
  border-radius: 0 50% 50% 50%;
  transform: rotate(-45deg);
  position: relative;
}
.shield-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.hero-app-name {
  font-size: $text-xl;
  font-weight: $font-bold;
  letter-spacing: 0.02em;
  color: #fff;
}
.hero-tagline {
  font-size: $text-sm;
  opacity: 0.85;
  margin-bottom: 20px;
  font-weight: $font-normal;
  color: #fff;
  display: block;
}
.hero-search {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: $radius-full;
  padding: 8px 16px;
  margin-bottom: 12px;
  transition: background 0.2s;
}
.search-icon {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  margin-right: 8px;
}
.search-icon::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
  transform: rotate(45deg);
  right: -4px;
  bottom: 0;
}
.hero-search input {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: $text-sm;
  outline: none;
  height: 20px;
}
.hero-search input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
.cta-scan-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #FFFFFF;
  color: $color-primary;
  border: none;
  border-radius: $radius-full;
  padding: 12px 24px;
  font-size: $text-base;
  font-weight: $font-semibold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
  height: auto;
  line-height: 1.5;
}
.cta-scan-btn:active {
  background: #F0FAF5;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.qr-icon {
  width: 18px;
  height: 18px;
  border: 1.5px solid $color-primary;
  border-radius: 2px;
  position: relative;
  flex-shrink: 0;
}
.qr-icon::before {
  content: '';
  position: absolute;
  width: 1.5px;
  height: 6px;
  background: $color-primary;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
}
.qr-icon::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 1.5px;
  background: $color-primary;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
}

/* Section Shared */
.section {
  padding: 20px;
}
.section-no-top {
  padding-top: 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: $text-lg;
  font-weight: $font-bold;
  color: $color-text-primary;
}
.section-more {
  font-size: $text-sm;
  color: $color-text-tertiary;
  display: flex;
  align-items: center;
  gap: 2px;
}
.arrow-icon {
  width: 14px;
  height: 14px;
  border-top: 2px solid $color-text-tertiary;
  border-right: 2px solid $color-text-tertiary;
  transform: rotate(45deg);
}

/* Category Grid */
.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.category-card {
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: $shadow-sm;
  position: relative;
  overflow: hidden;
}
.category-card:active {
  border-color: $color-primary-200;
  box-shadow: $shadow-md;
}
.category-icon {
  width: 36px;
  height: 36px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.color-green .category-icon {
  background: $state-success-light;
  color: $state-success;
}
.color-blue .category-icon {
  background: $state-info-light;
  color: $state-info;
}
.color-purple .category-icon {
  background: #F3E8FF;
  color: #7C3AED;
}
.color-amber .category-icon {
  background: $state-warning-light;
  color: $state-warning;
}
.icon-utensils {
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-radius: 50%;
  position: relative;
}
.icon-utensils::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 10px;
  background: currentColor;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%);
}
.icon-pill {
  width: 20px;
  height: 10px;
  border: 2px solid currentColor;
  border-radius: 10px;
  position: relative;
}
.icon-sparkles {
  width: 20px;
  height: 20px;
  position: relative;
}
.icon-sparkles::before {
  content: '+';
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  color: currentColor;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}
.icon-baby {
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-radius: 50%;
  position: relative;
}
.category-name {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $color-text-primary;
}
.category-count {
  font-size: $text-xs;
  color: $color-text-tertiary;
}
.category-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: $color-primary-light;
  color: $color-primary;
  font-size: 11px;
  font-weight: $font-semibold;
  padding: 2px 8px;
  border-radius: $radius-full;
}

/* Alert Cards */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.alert-card {
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  box-shadow: $shadow-sm;
  transition: all 0.2s;
}
.alert-card:active {
  box-shadow: $shadow-md;
  transform: scale(0.985);
}
.alert-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 2px;
}
.alert-indicator.red-list {
  background: $state-success;
}
.alert-indicator.black-list {
  background: $state-error;
}
.alert-indicator.warning {
  background: $state-warning;
}
.alert-body {
  flex: 1;
  min-width: 0;
}
.alert-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.alert-brand {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $color-text-primary;
}
.alert-badge {
  font-size: 11px;
  font-weight: $font-semibold;
  padding: 2px 8px;
  border-radius: $radius-full;
  flex-shrink: 0;
}
.alert-badge.red-list {
  background: $state-success-light;
  color: $state-success;
}
.alert-badge.black-list {
  background: $state-error-light;
  color: $state-error;
}
.alert-badge.warning {
  background: $state-warning-light;
  color: $state-warning;
}
.alert-reason {
  font-size: $text-xs;
  color: $color-text-secondary;
  line-height: $leading-normal;
  display: block;
}
.alert-time {
  font-size: 11px;
  color: $color-text-tertiary;
  margin-top: 4px;
  display: block;
}

/* Feature Scroll */
.feature-scroll {
  display: flex;
  gap: 12px;
  white-space: nowrap;
}
.feature-card {
  min-width: 200px;
  max-width: 200px;
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
  flex-shrink: 0;
  display: inline-block;
}
.feature-card-image {
  width: 200px;
  height: 100px;
  object-fit: cover;
  display: block;
}
.feature-card-placeholder {
  width: 200px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-purple {
  background: linear-gradient(135deg, #F3E8FF, #EDE9FE);
}
.bg-amber {
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
}
.icon-ai {
  width: 40px;
  height: 40px;
  border: 2px solid #7C3AED;
  border-radius: 50%;
  position: relative;
}
.icon-ai::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 2px;
  background: #7C3AED;
  border-radius: 50%;
  top: 6px;
  right: 2px;
}
.icon-sync {
  width: 36px;
  height: 36px;
  border: 2px solid #D97706;
  border-radius: 50%;
  position: relative;
}
.icon-sync::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-top: 2px solid #D97706;
  border-right: 2px solid #D97706;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
}
.feature-card-body {
  padding: 12px;
  white-space: normal;
}
.feature-card-title {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $color-text-primary;
  margin-bottom: 4px;
  display: block;
}
.feature-card-desc {
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: $leading-normal;
  display: block;
}
</style>
