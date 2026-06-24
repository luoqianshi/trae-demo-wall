<script setup>
import { computed } from 'vue'
import { LINE_COLORS, CROWD_LEVELS } from '@/utils/mock'

const props = defineProps({
  station: { type: Object, required: true },
})

const emit = defineEmits(['click'])

const lineColors = computed(() =>
  props.station.lines.map((id) => LINE_COLORS[id] || '#999')
)
const crowdInfo = computed(() => CROWD_LEVELS[props.station.crowdedness] || CROWD_LEVELS[1])
</script>

<template>
  <view class="station-card" @click="emit('click', station)">
    <view class="card-left">
      <view class="distance-badge">
        <text class="distance-num">{{ station.distance }}</text>
        <text class="distance-unit">m</text>
      </view>
    </view>

    <view class="card-center">
      <text class="station-name">{{ station.name }}</text>
      <view class="line-tags">
        <text
          v-for="(color, idx) in lineColors"
          :key="station.lines[idx]"
          class="line-tag"
          :style="{ background: color }"
        >
          {{ station.lines[idx] }}号线
        </text>
      </view>
      <text class="entrance-text">{{ station.entrances.join(' / ') }}</text>
    </view>

    <view class="card-right">
      <view class="crowd-indicator" :style="{ background: crowdInfo.color + '22' }">
        <text class="crowd-icon">{{ crowdInfo.icon }}</text>
        <text class="crowd-label" :style="{ color: crowdInfo.color }">{{ crowdInfo.label }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.station-card {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 1px solid var(--rule);
  transition: border-color 0.3s;

  &:active {
    border-color: var(--primary);
  }
}

.card-left {
  margin-right: 20rpx;
}

.distance-badge {
  width: 100rpx;
  height: 100rpx;
  border-radius: var(--radius-md);
  background: rgba(0, 212, 170, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.distance-num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--primary);
}

.distance-unit {
  font-size: 20rpx;
  color: var(--muted);
}

.card-center {
  flex: 1;
}

.station-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.line-tags {
  display: flex;
  gap: 8rpx;
  margin-bottom: 6rpx;
}

.line-tag {
  font-size: 20rpx;
  color: #fff;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}

.entrance-text {
  font-size: 22rpx;
  color: var(--muted);
}

.card-right {
  margin-left: 16rpx;
}

.crowd-indicator {
  padding: 12rpx 16rpx;
  border-radius: var(--radius-sm);
  text-align: center;
}

.crowd-icon {
  font-size: 32rpx;
  display: block;
}

.crowd-label {
  font-size: 20rpx;
  font-weight: 600;
}
</style>