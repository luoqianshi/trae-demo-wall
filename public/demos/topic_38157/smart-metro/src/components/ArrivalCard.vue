<script setup>
import { computed } from 'vue'
import { CROWD_LEVELS } from '@/utils/mock'

const props = defineProps({
  countdown: { type: Number, required: true },
  crowdedness: { type: Number, default: 1 },
  carCrowdedness: { type: Array, default: () => [] },
  terminal: { type: String, default: '' },
  hasAC: { type: String, default: '' },
})

const emit = defineEmits(['detail'])

const minutes = computed(() => Math.floor(props.countdown / 60))
const seconds = computed(() => props.countdown % 60)
const crowdInfo = computed(() => CROWD_LEVELS[props.crowdedness] || CROWD_LEVELS[1])
const isUrgent = computed(() => props.countdown <= 120)

const carLabels = computed(() => {
  if (!props.carCrowdedness.length) return []
  return props.carCrowdedness.map((c, i) => ({
    index: i + 1,
    level: c,
    info: CROWD_LEVELS[c] || CROWD_LEVELS[1],
  }))
})

function formatTime(t) {
  return String(t).padStart(2, '0')
}
</script>

<template>
  <view class="arrival-card fade-in-up" :class="{ urgent: isUrgent }">
    <view class="card-header">
      <view class="terminal-info">
        <text class="terminal-label">{{ terminal }}</text>
        <text v-if="hasAC" class="ac-tag">{{ hasAC }}</text>
      </view>
      <view class="crowd-badge" :style="{ background: crowdInfo.color + '22', color: crowdInfo.color }">
        {{ crowdInfo.icon }} {{ crowdInfo.label }}
      </view>
    </view>

    <view class="countdown-section">
      <view class="countdown-display">
        <text class="countdown-num" :class="{ 'text-danger': isUrgent }">
          {{ formatTime(minutes) }}
        </text>
        <text class="countdown-unit">分</text>
        <text class="countdown-num" :class="{ 'text-danger': isUrgent }">
          {{ formatTime(seconds) }}
        </text>
        <text class="countdown-unit">秒</text>
      </view>
      <text class="countdown-label">下一班到站</text>
    </view>

    <view class="car-section">
      <text class="section-label">车厢拥挤度</text>
      <view class="car-grid">
        <view
          v-for="car in carLabels"
          :key="car.index"
          class="car-item"
          :style="{ background: car.info.color + '22', borderColor: car.info.color + '44' }"
        >
          <text class="car-index">{{ car.index }}号</text>
          <view class="car-bar-wrap">
            <view
              class="car-bar"
              :style="{ width: (car.level / 5) * 100 + '%', background: car.info.color }"
            />
          </view>
          <text class="car-label" :style="{ color: car.info.color }">{{ car.info.label }}</text>
        </view>
      </view>
    </view>

    <view class="card-footer">
      <text class="tip-text">建议前往 3-6 号车厢（较为空闲）</text>
      <view class="detail-btn" @click="emit('detail')">
        <text>详情</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.arrival-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 1px solid var(--rule);
  transition: border-color 0.3s;

  &.urgent {
    border-color: rgba(255, 71, 87, 0.3);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.terminal-label {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.ac-tag {
  margin-left: 12rpx;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 170, 0.15);
  color: var(--primary);
}

.crowd-badge {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 600;
}

.countdown-section {
  text-align: center;
  padding: 20rpx 0;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 20rpx;
}

.countdown-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.countdown-num {
  font-size: 72rpx;
  font-weight: 800;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 2rpx;

  &.text-danger {
    color: #FF4757;
  }
}

.countdown-unit {
  font-size: 32rpx;
  color: var(--muted);
  margin: 0 8rpx;
}

.countdown-label {
  font-size: 24rpx;
  color: var(--muted);
  margin-top: 8rpx;
}

.section-label {
  font-size: 24rpx;
  color: var(--muted);
  margin-bottom: 16rpx;
}

.car-grid {
  display: flex;
  justify-content: space-between;
  gap: 8rpx;
}

.car-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 8rpx;
  border-radius: var(--radius-sm);
  border: 1px solid;
}

.car-index {
  font-size: 20rpx;
  color: var(--muted);
  display: block;
}

.car-bar-wrap {
  height: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4rpx;
  margin: 8rpx auto;
  width: 80%;
  overflow: hidden;
}

.car-bar {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.5s;
}

.car-label {
  font-size: 18rpx;
  display: block;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1px solid var(--rule);
}

.tip-text {
  font-size: 24rpx;
  color: var(--primary);
}

.detail-btn {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: var(--muted);
}

.arrow {
  font-size: 32rpx;
  margin-left: 4rpx;
}
</style>