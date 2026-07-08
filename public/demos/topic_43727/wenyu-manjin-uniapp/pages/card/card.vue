<template>
  <view class="card-page">
    <!-- 顶部大图 -->
    <view class="hero-image-wrap" :class="{ 'hero-loaded': imageLoaded }">
      <image
        class="hero-image"
        :src="card.image"
        mode="aspectFill"
        @load="onImageLoad"
      />
      <view class="hero-gradient"></view>
      <view class="hero-overlay-info">
        <text class="hero-date">{{ card.date }}</text>
        <text class="hero-duration">{{ card.duration }}</text>
      </view>
    </view>

    <!-- 卡片头部信息 -->
    <view class="card-header section-animate" :style="{ animationDelay: '0.1s' }">
      <view class="theme-tag" :style="{ backgroundColor: card.tagColor + '18', borderColor: card.tagColor + '40' }">
        <text class="theme-tag-icon">{{ card.themeIcon }}</text>
        <text class="theme-tag-text" :style="{ color: card.tagColor }">{{ card.themeName }}</text>
      </view>
      <text class="card-title">{{ card.themeName }}慢浸之旅</text>
      <view class="body-state">
        <text class="body-state-label">身体状态</text>
        <text class="body-state-value">{{ card.bodyState }}</text>
      </view>
    </view>

    <!-- 文物故事区域 -->
    <view class="section section-animate" :style="{ animationDelay: '0.2s' }">
      <view class="section-title-bar">
        <text class="section-icon">📖</text>
        <text class="section-title">{{ card.story.title }}</text>
      </view>
      <view class="section-body">
        <text class="section-text">{{ card.story.content }}</text>
      </view>
    </view>

    <!-- 静心引导区域 -->
    <view class="section section-animate" :style="{ animationDelay: '0.3s' }">
      <view class="section-title-bar">
        <text class="section-icon">🧘</text>
        <text class="section-title">{{ card.meditation.title }}</text>
      </view>
      <view class="section-body meditation-body">
        <text class="section-text">{{ card.meditation.content }}</text>
      </view>
    </view>

    <!-- 艾杨格瑜珈体式区域（重点） -->
    <view class="section yoga-section section-animate" :style="{ animationDelay: '0.4s' }">
      <view class="section-title-bar">
        <text class="section-icon">🤸</text>
        <text class="section-title">艾杨格瑜珈体式</text>
      </view>
      <view class="yoga-subtitle">
        <text class="yoga-subtitle-text">配合辅具的温和练习，让每个体式都安全可达</text>
      </view>

      <!-- 体式卡片列表 -->
      <view class="yoga-list">
        <view
          v-for="(pose, index) in card.yoga"
          :key="pose.id"
          class="yoga-card yoga-card-animate"
          :style="{ animationDelay: (0.5 + index * 0.15) + 's' }"
          @tap="togglePose(pose.id)"
        >
          <!-- 体式卡片头部 -->
          <view class="yoga-card-header">
            <view class="yoga-icon-wrap breathing-animation" :style="{ animationDelay: (index * 0.75) + 's' }">
              <text class="yoga-icon">{{ pose.icon }}</text>
            </view>
            <view class="yoga-card-info">
              <text class="yoga-name-zh">{{ pose.nameZh }}</text>
              <text class="yoga-name-en">{{ pose.nameEn }}</text>
            </view>
            <view class="yoga-meta">
              <text class="yoga-duration">{{ pose.duration }}</text>
              <text class="yoga-props">{{ pose.props }}</text>
            </view>
            <view class="yoga-expand-arrow" :class="{ expanded: expandedPoses[pose.id] }">
              <text class="arrow-text">▼</text>
            </view>
          </view>

          <!-- 展开的详细描述 -->
          <view class="yoga-detail" :class="{ 'yoga-detail-expanded': expandedPoses[pose.id] }">
            <view class="yoga-detail-inner">
              <view class="yoga-props-badge">
                <text class="props-badge-text">辅具：{{ pose.props }}</text>
              </view>
              <text class="yoga-description">{{ pose.description }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 安全提醒区域 -->
    <view class="section section-animate" :style="{ animationDelay: '1.1s' }">
      <view class="section-title-bar">
        <text class="section-icon">⚠️</text>
        <text class="section-title">安全提醒</text>
      </view>
      <view class="safety-list">
        <view class="safety-item" v-for="(item, index) in card.safety" :key="index">
          <view class="safety-dot"></view>
          <text class="safety-text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 今日感受区域 -->
    <view class="section section-animate" :style="{ animationDelay: '1.2s' }">
      <view class="section-title-bar">
        <text class="section-icon">💭</text>
        <text class="section-title">今日感受</text>
      </view>
      <view class="feeling-area">
        <textarea
          class="feeling-input"
          v-model="card.feeling"
          placeholder="记录你今天的练习感受..."
          placeholder-class="feeling-placeholder"
          :maxlength="500"
          auto-height
        />
        <text class="feeling-count">{{ card.feeling.length }}/500</text>
      </view>
    </view>

    <!-- AI声明 -->
    <view class="ai-disclaimer section-animate" :style="{ animationDelay: '1.3s' }">
      <text class="ai-disclaimer-text">本内容由AI辅助生成，仅供参考。请在专业指导下进行瑜珈练习。</text>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-actions section-animate" :style="{ animationDelay: '1.4s' }">
      <view class="btn btn-regenerate" @tap="regenerateCard">
        <text class="btn-icon">🔄</text>
        <text class="btn-text">重新生成</text>
      </view>
      <view class="btn btn-save" @tap="saveToCalendar">
        <text class="btn-icon">📅</text>
        <text class="btn-text">保存到日历</text>
      </view>
    </view>

    <!-- 底部安全间距 -->
    <view class="bottom-spacer"></view>
  </view>
</template>

<script>
import { themes } from '../../utils/cardData.js'

export default {
  data() {
    return {
      card: {
        id: '',
        date: '',
        theme: 'bronze',
        themeName: '青铜器',
        themeIcon: '🏺',
        image: '/static/assets/bronze.jpg',
        tagColor: '#8B6914',
        duration: '20分钟',
        bodyState: '日常放松',
        story: { title: '文物故事', content: '' },
        meditation: { title: '静心引导', content: '' },
        yoga: [],
        safety: [],
        feeling: ''
      },
      expandedPoses: {},
      imageLoaded: false
    }
  },
  onLoad() {
    this.loadCard()
  },
  onShow() {
    this.loadCard()
  },
  methods: {
    loadCard() {
      try {
        const savedCard = uni.getStorageSync('currentCard')
        if (savedCard) {
          this.card = { ...this.card, ...savedCard }
        } else {
          // 如果没有保存的卡片，使用默认的青铜器主题
          const defaultTheme = themes.bronze
          const today = new Date()
          const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
          this.card = {
            id: `card_${Date.now()}`,
            date: dateStr,
            theme: 'bronze',
            themeName: defaultTheme.name,
            themeIcon: defaultTheme.icon,
            image: defaultTheme.image,
            tagColor: defaultTheme.tagColor,
            duration: '20分钟',
            bodyState: '日常放松',
            story: defaultTheme.story,
            meditation: defaultTheme.meditation,
            yoga: defaultTheme.yoga,
            safety: defaultTheme.safety,
            feeling: ''
          }
        }
      } catch (e) {
        console.error('读取卡片数据失败:', e)
      }
    },

    onImageLoad() {
      this.imageLoaded = true
    },

    togglePose(poseId) {
      const key = `expanded_${poseId}`
      this.$set(this.expandedPoses, poseId, !this.expandedPoses[poseId])
    },

    regenerateCard() {
      uni.showModal({
        title: '重新生成',
        content: '确定要重新生成今日慢浸卡吗？当前内容将被替换。',
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 保存当前感受
            if (this.card.feeling) {
              this.saveFeeling()
            }
            uni.navigateTo({
              url: '/pages/select/select'
            })
          }
        }
      })
    },

    saveToCalendar() {
      try {
        // 保存感受
        if (this.card.feeling) {
          this.saveFeeling()
        }

        // 保存到已保存卡片列表
        let savedCards = uni.getStorageSync('savedCards') || {}
        savedCards[this.card.id] = {
          ...this.card,
          savedAt: new Date().toISOString()
        }
        uni.setStorageSync('savedCards', savedCards)

        uni.showToast({
          title: '已保存到日历',
          icon: 'success',
          duration: 2000
        })
      } catch (e) {
        console.error('保存失败:', e)
        uni.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 2000
        })
      }
    },

    saveFeeling() {
      try {
        // 保存日记到感受记录
        let feelings = uni.getStorageSync('feelings') || []
        feelings.push({
          cardId: this.card.id,
          theme: this.card.theme,
          themeName: this.card.themeName,
          date: this.card.date,
          feeling: this.card.feeling,
          createdAt: new Date().toISOString()
        })
        uni.setStorageSync('feelings', feelings)
      } catch (e) {
        console.error('保存感受失败:', e)
      }
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
page {
  --bg: #fbf7ef;
  --bg2: #fffdf8;
  --ink: #2a241f;
  --muted: #786c61;
  --rule: #e4d8c7;
  --accent: #9b5f3c;
  --accent2: #5f7d6a;
}

.card-page {
  min-height: 100vh;
  background-color: var(--bg);
  padding-bottom: 0;
}

/* ========== 顶部大图 ========== */
.hero-image-wrap {
  position: relative;
  width: 100%;
  height: 420rpx;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.hero-image-wrap.hero-loaded {
  opacity: 1;
}

.hero-image {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 1s ease;
}

.hero-image-wrap.hero-loaded .hero-image {
  opacity: 1;
}

.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(
    to bottom,
    rgba(251, 247, 239, 0) 0%,
    rgba(251, 247, 239, 0.3) 30%,
    rgba(251, 247, 239, 0.7) 60%,
    rgba(251, 247, 239, 1) 100%
  );
  pointer-events: none;
}

.hero-overlay-info {
  position: absolute;
  bottom: 30rpx;
  left: 32rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.hero-date {
  font-size: 26rpx;
  color: var(--muted);
  letter-spacing: 1rpx;
}

.hero-duration {
  font-size: 24rpx;
  color: var(--accent);
  background-color: rgba(155, 95, 60, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

/* ========== 区域入场动画 ========== */
.section-animate {
  opacity: 0;
  transform: translateY(40rpx);
  animation: slideUpFadeIn 0.7s ease forwards;
}

@keyframes slideUpFadeIn {
  0% {
    opacity: 0;
    transform: translateY(40rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 卡片头部信息 ========== */
.card-header {
  padding: 20rpx 32rpx 10rpx;
}

.theme-tag {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  border-width: 1rpx;
  border-style: solid;
  margin-bottom: 16rpx;
}

.theme-tag-icon {
  font-size: 28rpx;
}

.theme-tag-text {
  font-size: 24rpx;
  font-weight: 500;
}

.card-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
  margin-bottom: 12rpx;
  letter-spacing: 2rpx;
}

.body-state {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}

.body-state-label {
  font-size: 24rpx;
  color: var(--muted);
}

.body-state-value {
  font-size: 24rpx;
  color: var(--accent2);
  background-color: rgba(95, 125, 106, 0.12);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

/* ========== 通用区域样式 ========== */
.section {
  margin: 20rpx 24rpx;
  padding: 28rpx;
  background-color: var(--bg2);
  border-radius: 20rpx;
  border: 1rpx solid var(--rule);
}

.section-title-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.section-icon {
  font-size: 36rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: 1rpx;
}

.section-body {
  padding: 0 4rpx;
}

.section-text {
  font-size: 28rpx;
  color: var(--muted);
  line-height: 2;
  text-align: justify;
}

/* ========== 静心引导特殊样式 ========== */
.meditation-body {
  background: linear-gradient(135deg, rgba(95, 125, 106, 0.05) 0%, rgba(155, 95, 60, 0.05) 100%);
  padding: 24rpx;
  border-radius: 16rpx;
  border-left: 4rpx solid var(--accent2);
}

/* ========== 瑜珈体式区域（重点） ========== */
.yoga-section {
  border: 1rpx solid var(--rule);
}

.yoga-subtitle {
  margin-bottom: 24rpx;
  padding: 0 4rpx;
}

.yoga-subtitle-text {
  font-size: 24rpx;
  color: var(--muted);
  font-style: italic;
}

.yoga-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* 体式卡片入场动画 */
.yoga-card-animate {
  opacity: 0;
  transform: translateY(30rpx);
  animation: yogaCardSlideIn 0.6s ease forwards;
}

@keyframes yogaCardSlideIn {
  0% {
    opacity: 0;
    transform: translateY(30rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 呼吸动画 - 模拟呼吸节奏的缩放脉动 */
@keyframes breathingPulse {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.08);
  }
  65% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

.breathing-animation {
  animation: breathingPulse 3s ease-in-out infinite;
}

.yoga-card {
  background-color: var(--bg);
  border-radius: 16rpx;
  border: 1rpx solid var(--rule);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.yoga-card:active {
  box-shadow: 0 4rpx 16rpx rgba(155, 95, 60, 0.15);
}

.yoga-card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 24rpx;
  gap: 16rpx;
}

.yoga-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(155, 95, 60, 0.08) 0%, rgba(95, 125, 106, 0.08) 100%);
  border-radius: 20rpx;
  flex-shrink: 0;
}

.yoga-icon {
  font-size: 40rpx;
}

.yoga-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.yoga-name-zh {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--ink);
}

.yoga-name-en {
  font-size: 22rpx;
  color: var(--muted);
  font-style: italic;
  letter-spacing: 0.5rpx;
}

.yoga-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  flex-shrink: 0;
}

.yoga-duration {
  font-size: 22rpx;
  color: var(--accent);
  font-weight: 500;
}

.yoga-props {
  font-size: 20rpx;
  color: var(--accent2);
  background-color: rgba(95, 125, 106, 0.1);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
}

.yoga-expand-arrow {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.35s ease;
}

.yoga-expand-arrow.expanded {
  transform: rotate(180deg);
}

.arrow-text {
  font-size: 20rpx;
  color: var(--muted);
}

/* 展开收起动画 - 使用 max-height 过渡 */
.yoga-detail {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.yoga-detail-expanded {
  max-height: 600rpx;
}

.yoga-detail-inner {
  padding: 0 24rpx 24rpx;
  border-top: 1rpx dashed var(--rule);
  padding-top: 20rpx;
}

.yoga-props-badge {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  background-color: rgba(95, 125, 106, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.props-badge-text {
  font-size: 22rpx;
  color: var(--accent2);
  font-weight: 500;
}

.yoga-description {
  font-size: 26rpx;
  color: var(--muted);
  line-height: 2;
  text-align: justify;
}

/* ========== 安全提醒区域 ========== */
.safety-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.safety-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12rpx;
}

.safety-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: var(--accent);
  margin-top: 14rpx;
  flex-shrink: 0;
}

.safety-text {
  font-size: 26rpx;
  color: var(--muted);
  line-height: 1.8;
}

/* ========== 今日感受区域 ========== */
.feeling-area {
  position: relative;
}

.feeling-input {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  background-color: var(--bg);
  border: 1rpx solid var(--rule);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--ink);
  line-height: 1.8;
  box-sizing: border-box;
}

.feeling-placeholder {
  color: var(--muted);
  font-size: 26rpx;
}

.feeling-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: var(--muted);
  margin-top: 8rpx;
  opacity: 0.7;
}

/* ========== AI声明 ========== */
.ai-disclaimer {
  margin: 20rpx 24rpx;
  padding: 16rpx 24rpx;
  text-align: center;
}

.ai-disclaimer-text {
  font-size: 22rpx;
  color: var(--muted);
  opacity: 0.7;
  line-height: 1.6;
}

/* ========== 底部按钮 ========== */
.bottom-actions {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
  margin: 20rpx 24rpx;
  padding: 0;
  background: none;
  border: none;
}

.btn {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 24rpx 0;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.btn:active {
  transform: scale(0.97);
}

.btn-regenerate {
  background-color: var(--bg2);
  border: 1rpx solid var(--rule);
}

.btn-save {
  background-color: var(--accent);
  border: 1rpx solid var(--accent);
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 500;
}

.btn-regenerate .btn-text {
  color: var(--ink);
}

.btn-save .btn-text {
  color: #ffffff;
}

/* ========== 底部安全间距 ========== */
.bottom-spacer {
  height: 60rpx;
}
</style>
