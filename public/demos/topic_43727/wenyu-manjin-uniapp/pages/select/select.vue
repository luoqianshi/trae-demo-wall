<template>
  <view class="page-container">
    <!-- 主题选择 -->
    <text class="section-title">选择今日主题</text>
    <view class="option-grid">
      <view
        v-for="(theme, idx) in themeList"
        :key="idx"
        class="option-btn"
        :class="{ 'option-selected': selectedTheme === theme.id }"
        @tap="selectTheme(theme.id)"
      >
        <image
          class="option-img"
          :src="theme.image"
          mode="aspectFill"
          @error="onThemeImgError(idx, $event)"
        />
        <view
          v-if="themeImgErrors[idx]"
          class="option-img-placeholder"
        >
          <text class="placeholder-icon">{{ theme.icon }}</text>
        </view>
        <text class="option-name">{{ theme.name }}</text>
      </view>
    </view>

    <!-- 身体状态 -->
    <text class="section-title">身体状态</text>
    <scroll-view class="status-scroll" scroll-x>
      <view class="status-options">
        <view
          v-for="(status, idx) in statuses"
          :key="idx"
          class="status-chip"
          :class="{ 'chip-selected': selectedStatus === status }"
          @tap="selectStatus(status)"
        >
          <text class="chip-text">{{ status }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 练习时长 -->
    <text class="section-title">练习时长</text>
    <view class="option-grid option-grid-duration">
      <view
        v-for="(dur, idx) in durations"
        :key="idx"
        class="option-btn option-btn-duration"
        :class="{ 'option-selected': selectedDuration === dur.id }"
        @tap="selectDuration(dur.id)"
      >
        <text class="duration-icon">{{ dur.icon }}</text>
        <text class="option-name">{{ dur.name }}</text>
      </view>
    </view>

    <!-- 生成按钮 -->
    <view class="btn-wrap">
      <view class="btn-primary" @tap="generateCard">
        <text class="btn-text">生成慢浸卡</text>
      </view>
    </view>
  </view>
</template>

<script>
import { themeList, statuses, durations, generateCard } from '../../utils/cardData.js'

export default {
  data() {
    return {
      themes: themes,
      statuses: statuses,
      durations: durations,
      selectedTheme: '',
      selectedStatus: '',
      selectedDuration: '',
      themeImgErrors: {}
    }
  },
  methods: {
    selectTheme(id) {
      this.selectedTheme = id
    },

    selectStatus(status) {
      this.selectedStatus = status
    },

    selectDuration(id) {
      this.selectedDuration = id
    },

    onThemeImgError(idx, e) {
      this.$set(this.themeImgErrors, idx, true)
    },

    generateCard() {
      if (!this.selectedTheme) {
        uni.showToast({ title: '请选择主题', icon: 'none' })
        return
      }
      if (!this.selectedStatus) {
        uni.showToast({ title: '请选择身体状态', icon: 'none' })
        return
      }
      if (!this.selectedDuration) {
        uni.showToast({ title: '请选择练习时长', icon: 'none' })
        return
      }

      const theme = this.themeList.find(t => t.key === this.selectedTheme)
      const cardData = generateCard(this.selectedTheme, {
        duration: this.selectedDuration,
        bodyState: this.selectedStatus
      })

      // 存入 storage
      uni.setStorageSync('currentCard', cardData)

      // 跳转到卡片详情页
      uni.navigateTo({ url: '/pages/card/card' })
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #fbf7ef;
  padding: 30rpx 30rpx 60rpx;
}

/* 区域标题 */
.section-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #2a241f;
  margin: 40rpx 0 24rpx;
}

/* 主题网格 */
.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.option-grid-duration {
  justify-content: flex-start;
}
.option-btn {
  width: calc(50% - 10rpx);
  background-color: #fffdf8;
  border: 4rpx solid #e4d8c7;
  border-radius: 36rpx;
  overflow: hidden;
  padding-bottom: 20rpx;
  position: relative;
}
.option-btn-duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30rpx 0;
}
.option-selected {
  border-color: #9b5f3c;
  background-color: rgba(155, 95, 60, 0.08);
}
.option-img {
  width: 100%;
  height: 180rpx;
  display: block;
}
.option-img-placeholder {
  width: 100%;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fbf7ef 0%, rgba(155, 95, 60, 0.12) 100%);
}
.placeholder-icon {
  font-size: 60rpx;
}
.option-name {
  display: block;
  text-align: center;
  font-size: 30rpx;
  color: #2a241f;
  margin-top: 12rpx;
  padding: 0 10rpx;
}
.duration-icon {
  font-size: 60rpx;
  display: block;
  margin-bottom: 12rpx;
}

/* 身体状态横向滚动 */
.status-scroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 20rpx;
}
.status-options {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 16rpx;
  padding: 8rpx 0;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 18rpx 36rpx;
  background-color: #fffdf8;
  border: 4rpx solid #e4d8c7;
  border-radius: 999rpx;
  flex-shrink: 0;
}
.chip-selected {
  border-color: #5f7d6a;
  background-color: rgba(95, 125, 106, 0.1);
}
.chip-text {
  font-size: 28rpx;
  color: #2a241f;
  white-space: nowrap;
}
.chip-selected .chip-text {
  color: #5f7d6a;
}

/* 底部按钮 */
.btn-wrap {
  margin-top: 50rpx;
  padding-bottom: 20rpx;
}
.btn-primary {
  width: 100%;
  padding: 28rpx 0;
  background-color: #9b5f3c;
  border-radius: 36rpx;
  text-align: center;
}
.btn-text {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 600;
}
</style>
