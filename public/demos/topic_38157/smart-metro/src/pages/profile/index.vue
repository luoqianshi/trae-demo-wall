<script setup>
import { ref } from 'vue'
import { userCommute } from '@/utils/mock'

const commute = ref({ ...userCommute })
const notificationEnabled = ref(true)
const vibrationEnabled = ref(true)
const acPreference = ref('强冷')
const fontSize = ref('normal')
const cacheSize = ref('12.8MB')

const menuItems = [
  { icon: '🏠', label: '通勤设置', desc: '设置家和公司地址', arrow: true },
  { icon: '⭐', label: '收藏站点', desc: '3个站点已收藏', arrow: true },
  { icon: '📋', label: '出行记录', desc: '最近7天出行历史', arrow: true },
  { icon: '🔔', label: '消息通知', desc: '查看系统消息', arrow: true },
  { icon: '📊', label: '出行统计', desc: '本月通勤数据报告', arrow: true },
]

const settingItems = [
  { icon: '🌡️', label: '车厢温度偏好', value: acPreference.value, action: 'toggle_ac' },
  { icon: '🔊', label: '到站提醒', value: '震动+铃声', action: 'toggle_remind' },
  { icon: '🔤', label: '字体大小', value: '标准', action: 'toggle_font' },
  { icon: '🗺️', label: '常用城市', value: '上海', action: 'toggle_city' },
  { icon: '🗑️', label: '清除缓存', value: cacheSize.value, action: 'clear_cache' },
  { icon: 'ℹ️', label: '关于智行通', value: 'v1.0.0', action: 'about' },
]

function toggleNotification() {
  notificationEnabled.value = !notificationEnabled.value
}

function toggleVibration() {
  vibrationEnabled.value = !vibrationEnabled.value
}

function toggleAcPreference() {
  acPreference.value = acPreference.value === '强冷' ? '弱冷' : '强冷'
}

function handleItemClick(action) {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}
</script>

<template>
  <view class="page-profile">
    <!-- 用户信息 -->
    <view class="profile-header">
      <view class="avatar-section">
        <view class="avatar">
          <text class="avatar-text">🚇</text>
        </view>
        <view class="user-info">
          <text class="user-name">通勤者</text>
          <text class="user-desc">让每一次出行都精准可控</text>
        </view>
      </view>
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">128</text>
          <text class="stat-label">本月出行</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">86h</text>
          <text class="stat-label">通勤时长</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">32kg</text>
          <text class="stat-label">碳减排</text>
        </view>
      </view>
    </view>

    <!-- 通勤信息 -->
    <view class="commute-card">
      <view class="commute-header">
        <text class="commute-title">我的通勤</text>
        <text class="commute-edit">编辑</text>
      </view>
      <view class="commute-route">
        <view class="commute-dot from" />
        <text class="commute-station">{{ commute.home }}</text>
        <view class="commute-line">
          <text class="line-tag" style="background: #FF0000">1号线</text>
        </view>
        <view class="commute-dot to" />
        <text class="commute-station">{{ commute.work }}</text>
      </view>
      <view class="commute-meta">
        <text class="meta-item">预计 35 分钟</text>
        <text class="meta-divider">|</text>
        <text class="meta-item">1 次换乘</text>
        <text class="meta-divider">|</text>
        <text class="meta-item">建议 08:15 出发</text>
      </view>
    </view>

    <!-- 快捷开关 -->
    <view class="switch-section">
      <view class="switch-card">
        <view class="switch-row">
          <view class="switch-left">
            <text class="switch-icon">🔔</text>
            <text class="switch-label">推送通知</text>
          </view>
          <switch :checked="notificationEnabled" color="#00D4AA" @change="toggleNotification" />
        </view>
        <view class="switch-row">
          <view class="switch-left">
            <text class="switch-icon">📳</text>
            <text class="switch-label">到站震动</text>
          </view>
          <switch :checked="vibrationEnabled" color="#00D4AA" @change="toggleVibration" />
        </view>
        <view class="switch-row">
          <view class="switch-left">
            <text class="switch-icon">🌡️</text>
            <text class="switch-label">车厢温度</text>
          </view>
          <view class="switch-value" @click="toggleAcPreference">
            <text>{{ acPreference }}</text>
            <text class="switch-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-card">
        <view
          v-for="item in menuItems"
          :key="item.label"
          class="menu-item"
          @click="handleItemClick(item.label)"
        >
          <view class="menu-left">
            <text class="menu-icon">{{ item.icon }}</text>
            <view class="menu-text">
              <text class="menu-label">{{ item.label }}</text>
              <text class="menu-desc">{{ item.desc }}</text>
            </view>
          </view>
          <text v-if="item.arrow" class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 设置 -->
    <view class="menu-section">
      <text class="section-label">设置</text>
      <view class="menu-card">
        <view
          v-for="item in settingItems"
          :key="item.label"
          class="menu-item"
          @click="handleItemClick(item.action)"
        >
          <view class="menu-left">
            <text class="menu-icon">{{ item.icon }}</text>
            <text class="menu-label">{{ item.label }}</text>
          </view>
          <view class="menu-right">
            <text class="menu-value">{{ item.value }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-bottom" style="height: 40rpx" />
  </view>
</template>

<style lang="scss" scoped>
.page-profile {
  padding: 0 28rpx;
}

.profile-header {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32rpx 28rpx;
  margin-top: 20rpx;
  border: 1px solid var(--rule);
}

.avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 28rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00D4AA, #00B894);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.avatar-text {
  font-size: 48rpx;
}

.user-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}

.user-desc {
  font-size: 24rpx;
  color: var(--muted);
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 20rpx;
  border-top: 1px solid var(--rule);
}

.stat-divider {
  width: 2rpx;
  height: 48rpx;
  background: var(--rule);
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--primary);
  display: block;
}

.stat-label {
  font-size: 20rpx;
  color: var(--muted);
}

.commute-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24rpx 28rpx;
  margin-top: 20rpx;
  border: 1px solid var(--rule);
}

.commute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.commute-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

.commute-edit {
  font-size: 24rpx;
  color: var(--primary);
}

.commute-route {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.commute-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  margin-right: 10rpx;

  &.from { background: #2ED573; }
  &.to { background: var(--secondary); }
}

.commute-station {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
  margin-right: 12rpx;
}

.line-tag {
  font-size: 20rpx;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.commute-line {
  flex: 1;
  height: 2rpx;
  background: var(--rule);
  margin: 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.commute-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.meta-item {
  font-size: 22rpx;
  color: var(--muted);
}

.meta-divider {
  color: var(--rule);
  font-size: 20rpx;
}

.switch-section {
  margin-top: 20rpx;
}

.switch-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--rule);
  overflow: hidden;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 28rpx;
  border-bottom: 1px solid var(--rule);

  &:last-child {
    border-bottom: none;
  }
}

.switch-left {
  display: flex;
  align-items: center;
}

.switch-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.switch-label {
  font-size: 28rpx;
  color: #fff;
}

.switch-value {
  font-size: 26rpx;
  color: var(--muted);
  display: flex;
  align-items: center;
}

.switch-arrow {
  font-size: 32rpx;
  margin-left: 8rpx;
  color: var(--muted);
}

.menu-section {
  margin-top: 20rpx;
}

.section-label {
  font-size: 26rpx;
  color: var(--muted);
  margin-bottom: 12rpx;
  padding-left: 8rpx;
}

.menu-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--rule);
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 28rpx;
  border-bottom: 1px solid var(--rule);

  &:last-child {
    border-bottom: none;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.menu-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.menu-text {
  display: flex;
  flex-direction: column;
}

.menu-label {
  font-size: 28rpx;
  color: #fff;
}

.menu-desc {
  font-size: 22rpx;
  color: var(--muted);
  margin-top: 4rpx;
}

.menu-arrow {
  font-size: 32rpx;
  color: var(--muted);
}

.menu-right {
  display: flex;
  align-items: center;
}

.menu-value {
  font-size: 26rpx;
  color: var(--muted);
  margin-right: 8rpx;
}
</style>