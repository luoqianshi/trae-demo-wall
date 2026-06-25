<script setup>
import { ref, computed, onMounted } from 'vue'
import { metroLines, getCrowdednessData, CROWD_LEVELS } from '@/utils/mock'

const activeLine = ref('1')
const crowdedData = ref([])
const viewMode = ref('list') // 'list' | 'chart'

const lineColors = {
  '1': '#FF0000', '2': '#00AA00', '3': '#FFD700', '4': '#8A2BE2',
  '5': '#FF69B4', '6': '#FF8C00', '7': '#FF4500', '8': '#008080',
  '9': '#87CEEB', '10': '#C0C0C0',
}

function selectLine(id) {
  activeLine.value = id
  simulateLoad()
}

function simulateLoad() {
  crowdedData.value = []
  setTimeout(() => {
    crowdedData.value = getCrowdednessData()
  }, 200)
}

const maxCrowded = computed(() => Math.max(...crowdedData.value.map((s) => s.crowdedness), 1))

const stats = computed(() => {
  const total = crowdedData.value.length
  const high = crowdedData.value.filter((s) => s.crowdedness >= 4).length
  const avg = total ? (crowdedData.value.reduce((a, b) => a + b.crowdedness, 0) / total).toFixed(1) : 0
  return { total, high, avg }
})

function toggleMode() {
  viewMode.value = viewMode.value === 'list' ? 'chart' : 'list'
}

onMounted(() => {
  simulateLoad()
})
</script>

<template>
  <view class="page-crowdedness">
    <!-- 顶部概览 -->
    <view class="overview-section">
      <view class="overview-card">
        <view class="overview-row">
          <view class="overview-item">
            <text class="ov-num">{{ stats.total }}</text>
            <text class="ov-label">站点总数</text>
          </view>
          <view class="overview-divider" />
          <view class="overview-item">
            <text class="ov-num warn">{{ stats.high }}</text>
            <text class="ov-label">拥挤站点</text>
          </view>
          <view class="overview-divider" />
          <view class="overview-item">
            <text class="ov-num">{{ stats.avg }}</text>
            <text class="ov-label">平均拥挤度</text>
          </view>
        </view>
        <view class="overview-bar">
          <view
            v-for="level in 5"
            :key="level"
            class="bar-segment"
            :style="{
              flex: crowdedData.filter(s => s.crowdedness === level).length || 0.1,
              background: CROWD_LEVELS[level].color,
            }"
          />
        </view>
        <view class="bar-labels">
          <text v-for="level in 5" :key="level" class="bar-label">{{ CROWD_LEVELS[level].label }}</text>
        </view>
      </view>
    </view>

    <!-- 线路选择 -->
    <scroll-view scroll-x class="line-select" :show-scrollbar="false">
      <view class="line-list">
        <view
          v-for="line in metroLines"
          :key="line.id"
          class="line-chip"
          :class="{ active: activeLine === line.id }"
          :style="activeLine === line.id ? { background: lineColors[line.id] || '#999' } : {}"
          @click="selectLine(line.id)"
        >
          <text>{{ line.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 模式切换 -->
    <view class="mode-bar">
      <text class="mode-title">{{ activeLine }}号线 · 拥挤度分布</text>
      <view class="mode-toggle" @click="toggleMode">
        <text>{{ viewMode === 'list' ? '📊 图表' : '📋 列表' }}</text>
      </view>
    </view>

    <!-- 列表视图 -->
    <view v-if="viewMode === 'list'" class="station-list">
      <view
        v-for="station in crowdedData"
        :key="station.name"
        class="station-row"
      >
        <view class="station-info">
          <text class="s-name">{{ station.name }}</text>
          <view class="s-bar-wrap">
            <view
              class="s-bar"
              :style="{
                width: (station.crowdedness / maxCrowded) * 100 + '%',
                background: CROWD_LEVELS[station.crowdedness].color,
              }"
            />
          </view>
        </view>
        <view
          class="s-badge"
          :style="{
            background: CROWD_LEVELS[station.crowdedness].color + '22',
            color: CROWD_LEVELS[station.crowdedness].color,
          }"
        >
          {{ CROWD_LEVELS[station.crowdedness].icon }} {{ CROWD_LEVELS[station.crowdedness].label }}
        </view>
      </view>
    </view>

    <!-- 图表视图 -->
    <view v-else class="chart-view">
      <view class="chart-container">
        <view
          v-for="station in crowdedData"
          :key="station.name"
          class="chart-bar-group"
        >
          <view
            class="chart-bar"
            :style="{
              height: (station.crowdedness / 5) * 360 + 'rpx',
              background: CROWD_LEVELS[station.crowdedness].color,
            }"
          />
          <text class="chart-label">{{ station.name }}</text>
        </view>
      </view>
    </view>

    <view class="safe-bottom" style="height: 40rpx" />
  </view>
</template>

<style lang="scss" scoped>
.page-crowdedness {
  padding: 0 28rpx;
}

.overview-section {
  margin-top: 20rpx;
}

.overview-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 28rpx;
  border: 1px solid var(--rule);
}

.overview-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 24rpx;
}

.overview-item {
  text-align: center;
}

.ov-num {
  font-size: 44rpx;
  font-weight: 800;
  color: var(--primary);
  display: block;

  &.warn {
    color: #FF8C42;
  }
}

.ov-label {
  font-size: 22rpx;
  color: var(--muted);
}

.overview-divider {
  width: 2rpx;
  height: 60rpx;
  background: var(--rule);
}

.overview-bar {
  display: flex;
  height: 12rpx;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.bar-segment {
  min-width: 4rpx;
}

.bar-labels {
  display: flex;
  justify-content: space-between;
}

.bar-label {
  font-size: 20rpx;
  color: var(--muted);
}

.line-select {
  margin-top: 24rpx;
  white-space: nowrap;
}

.line-list {
  display: inline-flex;
  gap: 16rpx;
  padding: 8rpx 0;
}

.line-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100rpx;
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 28rpx;
  background: var(--bg-card);
  border: 1px solid var(--rule);
  font-size: 24rpx;
  color: var(--ink);
  transition: all 0.3s;

  &.active {
    color: #fff;
    font-weight: 700;
    border-color: transparent;
  }
}

.mode-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24rpx;
  margin-bottom: 16rpx;
}

.mode-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

.mode-toggle {
  font-size: 24rpx;
  color: var(--primary);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 170, 0.1);
}

.station-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
  border: 1px solid var(--rule);
}

.station-info {
  flex: 1;
  margin-right: 16rpx;
}

.s-name {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}

.s-bar-wrap {
  height: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4rpx;
  overflow: hidden;
}

.s-bar {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.5s;
}

.s-badge {
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 600;
  white-space: nowrap;
}

.chart-view {
  overflow-x: auto;
  padding-bottom: 20rpx;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  min-height: 420rpx;
  padding: 20rpx 0;
  min-width: 2000rpx;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 60rpx;
}

.chart-bar {
  width: 36rpx;
  border-radius: 6rpx 6rpx 0 0;
  transition: height 0.5s;
  min-height: 8rpx;
}

.chart-label {
  font-size: 18rpx;
  color: var(--muted);
  margin-top: 8rpx;
  writing-mode: vertical-lr;
  max-height: 100rpx;
}
</style>