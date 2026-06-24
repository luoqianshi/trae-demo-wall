<script setup>
import { ref, onMounted } from 'vue'
import MetroLine from '@/components/MetroLine.vue'
import StationCard from '@/components/StationCard.vue'
import ArrivalCard from '@/components/ArrivalCard.vue'
import { metroLines, nearbyStations, getArrivalData } from '@/utils/mock'

const activeLine = ref('1')
const activeStation = ref(null)
const arrivalData = ref([])
const loading = ref(false)
const selectedStation = ref(nearbyStations[0])

function selectLine(lineId) {
  activeLine.value = lineId
  activeStation.value = null
  arrivalData.value = []
}

function selectStation(station) {
  selectedStation.value = station
  activeStation.value = station.id
  loadArrival(station.id)
}

function loadArrival(stationId) {
  loading.value = true
  setTimeout(() => {
    arrivalData.value = getArrivalData(stationId)
    loading.value = false
  }, 300)
}

onMounted(() => {
  selectStation(nearbyStations[0])
})

// 定时刷新倒计时
setInterval(() => {
  if (arrivalData.value.length) {
    arrivalData.value = arrivalData.value.map((dir) => ({
      ...dir,
      arrivals: dir.arrivals.map((a) => ({
        ...a,
        countdown: Math.max(0, a.countdown - 1),
      })),
    }))
  }
}, 1000)
</script>

<template>
  <view class="page-home">
    <!-- 顶部搜索栏 -->
    <view class="header-section">
      <view class="title-row">
        <text class="app-title">智行通</text>
        <view class="header-actions">
          <view class="icon-btn">
            <text class="icon">🔔</text>
          </view>
          <view class="icon-btn">
            <text class="icon">📌</text>
          </view>
        </view>
      </view>
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          placeholder="搜索线路 / 站点"
          placeholder-style="color: #7B8BA8"
        />
      </view>
    </view>

    <!-- 线路选择器 -->
    <MetroLine
      :lines="metroLines"
      :active-line="activeLine"
      @select="selectLine"
    />

    <!-- 附近站点 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">附近站点</text>
        <text class="section-more">更多 ›</text>
      </view>
      <StationCard
        v-for="station in nearbyStations"
        :key="station.id"
        :station="station"
        @click="selectStation"
      />
    </view>

    <!-- 实时到站信息 -->
    <view v-if="selectedStation" class="section">
      <view class="section-header">
        <text class="section-title">
          {{ selectedStation.name }} · 实时到站
        </text>
        <view class="refresh-badge pulse">
          <text class="refresh-dot" />
          <text>实时</text>
        </view>
      </view>

      <view v-if="loading" class="loading-wrap">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else>
        <view v-for="dir in arrivalData" :key="dir.direction">
          <text class="direction-label">{{ dir.direction }} · {{ dir.terminal }}</text>
          <ArrivalCard
            v-for="arrival in dir.arrivals"
            :key="arrival.id"
            :countdown="arrival.countdown"
            :crowdedness="arrival.crowdedness"
            :car-crowdedness="arrival.carCrowdedness"
            :terminal="dir.terminal"
            :has-ac="arrival.hasAC"
            @detail="() => {}"
          />
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-bottom" style="height: 40rpx" />
  </view>
</template>

<style lang="scss" scoped>
.page-home {
  padding: 0 28rpx;
}

.header-section {
  padding-top: 20rpx;
  margin-bottom: 8rpx;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.app-title {
  font-size: 44rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2rpx;
}

.header-actions {
  display: flex;
  gap: 16rpx;
}

.icon-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rule);
}

.icon {
  font-size: 32rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  border: 1px solid var(--rule);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #fff;
  background: transparent;
}

.section {
  margin-top: 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.section-more {
  font-size: 26rpx;
  color: var(--primary);
}

.refresh-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: var(--primary);
}

.refresh-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #2ED573;
}

.direction-label {
  font-size: 26rpx;
  color: var(--muted);
  display: block;
  margin-bottom: 16rpx;
  margin-top: 8rpx;
}

.loading-wrap {
  padding: 60rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: var(--muted);
}
</style>