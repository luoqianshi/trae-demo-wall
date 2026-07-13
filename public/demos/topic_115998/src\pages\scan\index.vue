<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBrandStore } from '@/stores/brand'

const store = useBrandStore()
const scanResult = ref(store.getScanResult())
const animatedScore = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onLoad((options) => {
  if (options && options.brandId) {
    const detail = store.getBrandDetail(options.brandId)
    if (detail) {
      scanResult.value = detail
    }
  }
})

onMounted(() => {
  const target = scanResult.value.trustScore
  let current = 0
  const step = target / 30
  timer = setInterval(() => {
    current += step
    if (current >= target) {
      current = target
      if (timer) clearInterval(timer)
    }
    animatedScore.value = Math.floor(current)
  }, 30)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const onBackTap = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

const onShareTap = () => {
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
}

const onViewRanking = () => {
  uni.switchTab({ url: '/pages/ranking/index' })
}

const onScanAgain = () => {
  uni.navigateBack()
}

const circumference = 2 * Math.PI * 50
const strokeOffset = computed(() => {
  const percentage = animatedScore.value / 100
  return circumference * (1 - percentage)
})

const scoreColor = computed(() => {
  const score = scanResult.value.trustScore
  if (score >= 80) return '#1A7A4C'
  if (score >= 60) return '#F59E0B'
  return '#DC2626'
})
</script>

<template>
  <view class="scan-page">
    <!-- Top Bar -->
    <view class="top-bar">
      <view class="back-btn" @tap="onBackTap">
        <view class="arrow-left"></view>
      </view>
      <text class="top-bar-title">扫码结果</text>
      <view class="share-btn" @tap="onShareTap">
        <view class="share-icon"></view>
      </view>
    </view>

    <!-- Main Content -->
    <scroll-view scroll-y class="page-content" :show-scrollbar="false">
      <!-- Product Info Card -->
      <view class="card product-card">
        <text class="barcode">{{ scanResult.barcode }}</text>
        <text class="brand-name">{{ scanResult.brandName }}</text>
        <text class="product-name">{{ scanResult.productName }}</text>
        <view class="category-badge-tag">
          <text>{{ scanResult.category }}</text>
        </view>
      </view>

      <!-- Trust Score Display -->
      <view class="score-section">
        <view class="score-ring-container">
          <svg class="score-svg" viewBox="0 0 120 120">
            <circle class="score-svg-bg" cx="60" cy="60" r="50"/>
            <circle
              class="score-svg-fg"
              cx="60"
              cy="60"
              r="50"
              :stroke="scoreColor"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeOffset"
            />
          </svg>
          <view class="score-number">
            <text class="score-value">{{ animatedScore }}</text>
            <text class="score-label">/ 100</text>
          </view>
        </view>
        <view class="trust-status-badge" :style="{ background: scoreColor }">
          <text>{{ scanResult.status }}</text>
        </view>
        <text class="trust-comment">{{ scanResult.comment }}</text>
      </view>

      <!-- Rating Breakdown -->
      <view class="card rating-card">
        <text class="card-title">评分详情</text>
        <view
          v-for="(item, index) in scanResult.ratingDetails"
          :key="index"
          class="rating-item"
        >
          <text class="rating-label">{{ item.label }}</text>
          <view class="rating-bar-track">
            <view
              class="rating-bar-fill"
              :style="{ width: item.value + '%' }"
            ></view>
          </view>
          <text class="rating-value">{{ item.value }}</text>
        </view>
      </view>

      <!-- Purchase Recommendation -->
      <view class="card recommend-card">
        <view class="recommend-icon">
          <view class="shield-check"></view>
        </view>
        <view class="recommend-body">
          <text class="recommend-title">建议购买</text>
          <text class="recommend-text">该品牌信誉良好，连续5年无质量通报，产品质量稳定可靠。</text>
        </view>
        <view class="recommend-visual">
          <image src="/static/images/image_2.jpg" mode="aspectFill" />
        </view>
      </view>

      <!-- News Evidence Timeline -->
      <view class="card timeline-card">
        <text class="card-title">相关报道</text>
        <view class="timeline">
          <view
            v-for="(item, index) in scanResult.timeline"
            :key="index"
            class="timeline-item"
          >
            <view class="timeline-dot" :class="item.type"></view>
            <view class="timeline-content">
              <text class="timeline-text">{{ item.text }}</text>
              <text class="timeline-date">{{ item.date }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Action Buttons -->
      <view class="action-buttons">
        <view class="btn btn-outline" @tap="onViewRanking">
          <text>查看完整榜单</text>
        </view>
        <view class="btn btn-filled" @tap="onScanAgain">
          <text>再次扫码</text>
        </view>
      </view>

      <view style="height: 24px;"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.scan-page {
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
  min-height: 100vh;
  background: $color-surface;
  display: flex;
  flex-direction: column;
}

/* Top Bar */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: $color-surface-raised;
  border-bottom: 1px solid $color-border;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-btn {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: $radius-full;
  background: $color-surface;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-left {
  width: 10px;
  height: 10px;
  border-top: 2px solid $color-text-primary;
  border-left: 2px solid $color-text-primary;
  transform: rotate(-45deg);
}
.top-bar-title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $color-text-primary;
  line-height: $leading-tight;
}
.share-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: $radius-full;
  background: $color-surface;
  display: flex;
  align-items: center;
  justify-content: center;
}
.share-icon {
  width: 14px;
  height: 14px;
  border: 2px solid $color-text-secondary;
  border-radius: 2px;
  position: relative;
}
.share-icon::before {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border-top: 2px solid $color-text-secondary;
  border-right: 2px solid $color-text-secondary;
  top: -5px;
  left: 2px;
  transform: rotate(-45deg);
}

/* Main Content */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}

/* Card Base */
.card {
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: 16px;
  margin-bottom: 12px;
}

/* Product Info Card */
.product-card {
  text-align: center;
}
.barcode {
  font-family: $font-family-mono;
  font-size: $text-sm;
  color: $color-text-tertiary;
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: block;
}
.brand-name {
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: $color-text-primary;
  line-height: $leading-tight;
  margin-bottom: 4px;
  display: block;
}
.product-name {
  font-size: $text-sm;
  color: $color-text-secondary;
  line-height: $leading-relaxed;
  margin-bottom: 12px;
  display: block;
}
.category-badge-tag {
  display: inline-block;
  padding: 4px 12px;
  background: $color-primary-light;
  color: $color-primary;
  font-size: $text-xs;
  font-weight: $font-medium;
  border-radius: $radius-full;
}

/* Trust Score Display */
.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  margin-bottom: 12px;
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}
.score-ring-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 12px;
}
.score-svg {
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
}
.score-svg-bg {
  fill: none;
  stroke: $color-primary-light;
  stroke-width: 8;
}
.score-svg-fg {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}
.score-number {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-value {
  font-size: 42px;
  font-weight: $font-bold;
  color: $color-primary;
  line-height: 1;
  letter-spacing: -1px;
}
.score-label {
  font-size: $text-xs;
  color: $color-text-tertiary;
  margin-top: 2px;
}
.trust-status-badge {
  display: inline-block;
  padding: 6px 16px;
  color: $color-text-inverse;
  font-size: $text-sm;
  font-weight: $font-semibold;
  border-radius: $radius-full;
  margin-bottom: 8px;
}
.trust-comment {
  font-size: $text-sm;
  color: $color-text-secondary;
  text-align: center;
}

/* Rating Breakdown */
.rating-card {
  padding: 16px;
}
.rating-card .card-title {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $color-text-primary;
  margin-bottom: 14px;
  display: block;
}
.rating-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.rating-item:last-child {
  margin-bottom: 0;
}
.rating-label {
  width: 68px;
  font-size: $text-xs;
  color: $color-text-secondary;
  flex-shrink: 0;
}
.rating-bar-track {
  flex: 1;
  height: 6px;
  background: $color-surface;
  border-radius: 3px;
  margin: 0 10px;
  overflow: hidden;
}
.rating-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: $color-primary;
  transition: width 0.6s ease;
}
.rating-value {
  width: 24px;
  text-align: right;
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: $color-text-primary;
  flex-shrink: 0;
}

/* Purchase Recommendation */
.recommend-card {
  background: linear-gradient(135deg, #1A7A4C 0%, #22A05E 100%);
  border: none;
  color: $color-text-inverse;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}
.recommend-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.shield-check {
  width: 22px;
  height: 22px;
  border: 2px solid #fff;
  border-radius: 0 50% 50% 50%;
  transform: rotate(-45deg);
  position: relative;
}
.shield-check::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 4px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  top: 4px;
  left: 4px;
  transform: rotate(0deg);
}
.recommend-body {
  flex: 1;
}
.recommend-title {
  font-size: $text-base;
  font-weight: $font-bold;
  margin-bottom: 4px;
  display: block;
}
.recommend-text {
  font-size: $text-xs;
  line-height: $leading-relaxed;
  opacity: 0.9;
  display: block;
}
.recommend-visual {
  margin-top: 12px;
  border-radius: $radius-md;
  overflow: hidden;
  max-height: 80px;
  width: 100%;
}
.recommend-visual image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  display: block;
  border-radius: $radius-md;
  opacity: 0.7;
}

/* News Evidence Timeline */
.timeline-card {
  padding: 16px;
}
.timeline-card .card-title {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $color-text-primary;
  margin-bottom: 16px;
  display: block;
}
.timeline {
  position: relative;
  padding-left: 20px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: $color-border;
}
.timeline-item {
  position: relative;
  padding-bottom: 16px;
}
.timeline-item:last-child {
  padding-bottom: 0;
}
.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid $color-primary;
  background: $color-primary-light;
}
.timeline-dot.gray {
  border-color: $color-text-tertiary;
  background: $color-border-subtle;
}
.timeline-content {
  display: flex;
  flex-direction: column;
}
.timeline-text {
  font-size: $text-sm;
  color: $color-text-primary;
  line-height: $leading-relaxed;
}
.timeline-date {
  font-size: $text-xs;
  color: $color-text-tertiary;
  margin-top: 2px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.btn {
  flex: 1;
  height: 44px;
  border-radius: $radius-md;
  font-size: $text-sm;
  font-weight: $font-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
}
.btn-outline {
  background: transparent;
  border: 1.5px solid $color-primary;
  color: $color-primary;
}
.btn-outline:active {
  background: $color-primary-light;
}
.btn-filled {
  background: $color-primary;
  color: $color-text-inverse;
}
.btn-filled:active {
  background: $color-primary-hover;
}
</style>
