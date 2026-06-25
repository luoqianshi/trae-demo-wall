<script setup>
import { ref, computed } from 'vue'
import { getTransferRoutes, metroLines, CROWD_LEVELS } from '@/utils/mock'

const fromStation = ref('')
const toStation = ref('')
const routes = ref([])
const activeRoute = ref(0)
const loading = ref(false)
const searched = ref(false)

const lineColors = {
  '1': '#FF0000', '2': '#00AA00', '3': '#FFD700', '4': '#8A2BE2',
  '5': '#FF69B4', '6': '#FF8C00', '7': '#FF4500', '8': '#008080',
  '9': '#87CEEB', '10': '#C0C0C0', '11': '#800000', '12': '#006400',
}

const quickStations = ['人民广场', '徐家汇', '上海火车站', '漕河泾开发区', '静安寺', '陆家嘴']

function searchRoutes() {
  if (!fromStation.value || !toStation.value) return
  loading.value = true
  routes.value = []
  setTimeout(() => {
    routes.value = getTransferRoutes(fromStation.value, toStation.value)
    activeRoute.value = 0
    loading.value = false
    searched.value = true
  }, 500)
}

function selectQuick(station) {
  if (!fromStation.value) {
    fromStation.value = station
  } else if (!toStation.value) {
    toStation.value = station
    searchRoutes()
  }
}

function swapStations() {
  const tmp = fromStation.value
  fromStation.value = toStation.value
  toStation.value = tmp
  if (searched.value) searchRoutes()
}

const currentRoute = computed(() => routes.value[activeRoute.value] || null)

function getStepIcon(step) {
  if (step.type === 'walk') return '🚶'
  if (step.type === 'metro') return '🚇'
  if (step.type === 'transfer') return '🔄'
  return '📍'
}
</script>

<template>
  <view class="page-transfer">
    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-card">
        <view class="station-row">
          <view class="station-dot from" />
          <input
            v-model="fromStation"
            class="station-input"
            placeholder="出发站"
            placeholder-style="color: #7B8BA8"
          />
        </view>
        <view class="swap-btn" @click="swapStations">
          <text class="swap-icon">⇅</text>
        </view>
        <view class="station-row">
          <view class="station-dot to" />
          <input
            v-model="toStation"
            class="station-input"
            placeholder="到达站"
            placeholder-style="color: #7B8BA8"
          />
        </view>
        <view class="search-btn" @click="searchRoutes">
          <text>搜索路线</text>
        </view>
      </view>
    </view>

    <!-- 快捷站点 -->
    <view class="quick-section">
      <text class="quick-title">快捷选择</text>
      <view class="quick-grid">
        <text
          v-for="s in quickStations"
          :key="s"
          class="quick-chip"
          :class="{ selected: fromStation === s || toStation === s }"
          @click="selectQuick(s)"
        >{{ s }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">正在规划最优路线...</text>
    </view>

    <!-- 搜索结果 -->
    <view v-if="currentRoute && !loading" class="result-section">
      <!-- 方案切换 -->
      <view class="route-tabs">
        <view
          v-for="(route, idx) in routes"
          :key="route.id"
          class="route-tab"
          :class="{ active: activeRoute === idx }"
          @click="activeRoute = idx"
        >
          <text class="tab-name">{{ route.name }}</text>
          <view class="tab-meta">
            <text class="tab-duration">{{ route.duration }}分钟</text>
            <text class="tab-transfer">{{ route.transferCount }}次换乘</text>
          </view>
        </view>
      </view>

      <!-- 详细步骤 -->
      <view class="steps-section">
        <text class="steps-title">详细路线</text>
        <view class="timeline">
          <view
            v-for="(step, idx) in currentRoute.steps"
            :key="idx"
            class="step-item"
          >
            <view class="step-line">
              <view
                class="step-icon"
                :class="{ metro: step.type === 'metro', transfer: step.type === 'transfer' }"
              >
                <text>{{ getStepIcon(step) }}</text>
              </view>
              <view v-if="idx < currentRoute.steps.length - 1" class="step-connector" />
            </view>
            <view class="step-content">
              <view class="step-header">
                <text class="step-title">
                  {{ step.type === 'metro' ? step.lineName + ' · ' + step.from + ' → ' + step.to : step.desc }}
                </text>
                <text
                  v-if="step.duration"
                  class="step-duration"
                >{{ step.duration }}分钟</text>
              </view>
              <view
                v-if="step.type === 'metro'"
                class="step-tags"
              >
                <text
                  class="step-tag"
                  :style="{ background: (lineColors[step.line] || '#999') + '22', color: lineColors[step.line] || '#999' }"
                >{{ step.stations }}站</text>
                <text
                  v-if="step.crowdedness"
                  class="step-tag"
                  :style="{ background: (CROWD_LEVELS[step.crowdedness]?.color || '#999') + '22', color: CROWD_LEVELS[step.crowdedness]?.color || '#999' }"
                >{{ CROWD_LEVELS[step.crowdedness]?.label }}</text>
              </view>
              <text
                v-if="step.type === 'transfer' && step.guide"
                class="step-guide"
              >💡 {{ step.guide }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="searched && !currentRoute && !loading" class="empty-wrap">
      <text class="empty-icon">🚇</text>
      <text class="empty-text">未找到路线，请检查站点名称</text>
    </view>

    <view class="safe-bottom" style="height: 40rpx" />
  </view>
</template>

<style lang="scss" scoped>
.page-transfer {
  padding: 0 28rpx;
}

.search-section {
  margin-top: 20rpx;
}

.search-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 28rpx;
  border: 1px solid var(--rule);
  position: relative;
}

.station-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.station-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  flex-shrink: 0;

  &.from { background: var(--primary); }
  &.to { background: var(--secondary); }
}

.station-input {
  flex: 1;
  font-size: 30rpx;
  color: #fff;
  background: transparent;
  padding: 12rpx 0;
  border-bottom: 1px solid var(--rule);
}

.swap-btn {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.swap-icon {
  font-size: 28rpx;
  color: #fff;
  font-weight: 700;
}

.search-btn {
  margin-top: 16rpx;
  background: linear-gradient(135deg, #00D4AA, #00B894);
  text-align: center;
  padding: 20rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.quick-section {
  margin-top: 24rpx;
}

.quick-title {
  font-size: 26rpx;
  color: var(--muted);
  margin-bottom: 12rpx;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.quick-chip {
  font-size: 24rpx;
  color: var(--muted);
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  background: var(--bg-card);
  border: 1px solid var(--rule);

  &.selected {
    color: var(--primary);
    border-color: var(--primary);
    background: rgba(0, 212, 170, 0.08);
  }
}

.loading-wrap {
  padding: 80rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: var(--muted);
}

.result-section {
  margin-top: 24rpx;
}

.route-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.route-tab {
  flex: 1;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20rpx;
  text-align: center;
  border: 1px solid var(--rule);
  transition: all 0.3s;

  &.active {
    border-color: var(--primary);
    background: rgba(0, 212, 170, 0.06);
  }
}

.tab-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}

.tab-meta {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.tab-duration {
  font-size: 22rpx;
  color: var(--primary);
}

.tab-transfer {
  font-size: 22rpx;
  color: var(--muted);
}

.steps-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 20rpx;
}

.timeline {
  padding-left: 8rpx;
}

.step-item {
  display: flex;
  margin-bottom: 8rpx;
}

.step-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20rpx;
  width: 60rpx;
}

.step-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  flex-shrink: 0;

  &.metro {
    border-color: var(--primary);
    background: rgba(0, 212, 170, 0.08);
  }

  &.transfer {
    border-color: var(--secondary);
    background: rgba(255, 140, 66, 0.08);
  }
}

.step-connector {
  width: 2rpx;
  flex: 1;
  min-height: 40rpx;
  background: var(--rule);
  margin: 4rpx 0;
}

.step-content {
  flex: 1;
  padding-bottom: 20rpx;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.step-title {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
  flex: 1;
  margin-right: 16rpx;
}

.step-duration {
  font-size: 24rpx;
  color: var(--primary);
  font-weight: 700;
  white-space: nowrap;
}

.step-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
}

.step-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.step-guide {
  font-size: 22rpx;
  color: var(--muted);
  margin-top: 8rpx;
  display: block;
  background: rgba(255, 140, 66, 0.06);
  padding: 12rpx 16rpx;
  border-radius: var(--radius-sm);
  border-left: 3rpx solid var(--secondary);
}

.empty-wrap {
  padding: 80rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 72rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: var(--muted);
}
</style>