<script setup>
import { computed } from 'vue'
import { LINE_COLORS } from '@/utils/mock'

const props = defineProps({
  lines: { type: Array, default: () => [] },
  activeLine: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const displayLines = computed(() =>
  props.lines.map((l) => ({
    ...l,
    color: LINE_COLORS[l.id] || '#999',
  }))
)
</script>

<template>
  <scroll-view scroll-x class="line-selector" :show-scrollbar="false">
    <view class="line-list">
      <view
        v-for="line in displayLines"
        :key="line.id"
        class="line-item"
        :class="{ active: activeLine === line.id, delay: line.status === 'delay' }"
        :style="activeLine === line.id ? { background: line.color, borderColor: line.color } : { borderColor: line.color + '44' }"
        @click="emit('select', line.id)"
      >
        <text class="line-name">{{ line.name }}</text>
        <view v-if="line.status === 'delay'" class="delay-dot" />
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.line-selector {
  width: 100%;
  white-space: nowrap;
  padding: 16rpx 0;
}

.line-list {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 28rpx;
}

.line-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 32rpx;
  border: 2px solid;
  background: transparent;
  position: relative;
  transition: all 0.3s;

  &.active {
    .line-name {
      color: #fff;
      font-weight: 700;
    }
  }

  &.delay {
    opacity: 0.7;
  }
}

.line-name {
  font-size: 26rpx;
  color: var(--ink);
  font-weight: 500;
}

.delay-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #FF4757;
  position: absolute;
  top: 6rpx;
  right: 10rpx;
}
</style>