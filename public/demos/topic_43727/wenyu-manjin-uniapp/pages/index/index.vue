<template>
  <view class="page-container">
    <!-- 顶部装饰元素 -->
    <view class="header-decoration">
      <view class="deco-line"></view>
      <view class="deco-dot"></view>
      <view class="deco-line"></view>
    </view>

    <!-- 标题区域 -->
    <view class="header">
      <view class="title-wrap">
        <text
          v-for="(char, idx) in titleChars"
          :key="idx"
          class="title-char"
          :style="{ animationDelay: (idx * 0.15 + 0.1) + 's' }"
        >{{ char }}</text>
      </view>
      <text class="subtitle">每日一张慢浸卡</text>
      <text class="slogan">在文物中慢下来，在瑜珈中浸进去</text>

      <!-- 用户标签 -->
      <view class="user-tags">
        <text
          v-for="(tag, idx) in userTags"
          :key="idx"
          class="user-tag"
        >{{ tag }}</text>
      </view>
    </view>

    <!-- 周历 -->
    <view class="calendar-section">
      <!-- 星期头部 -->
      <view class="calendar-header">
        <text
          v-for="(d, idx) in weekDayNames"
          :key="idx"
          class="calendar-header-text"
        >{{ d }}</text>
      </view>
      <!-- 7天日期 -->
      <view class="calendar-grid">
        <view
          v-for="(day, idx) in weekDays"
          :key="idx"
          class="day-cell"
          :class="{ 'day-today': day.isToday }"
          @tap="onDayTap(day)"
        >
          <text class="day-num">{{ day.dateNum }}</text>
          <text class="day-name">{{ weekDayNames[idx] }}</text>
          <text class="day-lunar">{{ day.lunarDisplay }}</text>
          <text v-if="day.solarTerm" class="day-term">{{ day.solarTerm }}</text>
          <text v-if="day.checkedIcon" class="day-icon">{{ day.checkedIcon }}</text>
        </view>
      </view>
    </view>

    <!-- 本周慢浸卡列表 -->
    <view class="week-cards">
      <text class="section-title">本周慢浸卡</text>
      <view
        v-for="(card, idx) in weekCards"
        :key="idx"
        class="card-preview"
        @tap="onCardTap(card)"
      >
        <image
          class="card-preview-img"
          :src="card.image"
          mode="aspectFill"
          @error="onImgError(idx, $event)"
        />
        <view
          v-if="card.imgError"
          class="card-preview-placeholder"
          :class="card.themeId"
        >
          <text class="placeholder-icon">{{ card.icon }}</text>
        </view>
        <view class="card-info">
          <text class="card-tag">{{ card.tagName }}</text>
          <text class="card-title">{{ card.title }}</text>
          <text class="card-desc">{{ card.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="btn-wrap">
      <view class="btn-primary" @tap="goSelect">
        <text class="btn-text">+ 生成今日慢浸卡</text>
      </view>
    </view>
  </view>
</template>

<script>
import { toLunar, getSolarTerm } from '../../utils/lunar.js'
import { themeList, themes as themeMap, generateCard } from '../../utils/cardData.js'

export default {
  data() {
    return {
      titleChars: ['文', '瑜', '慢', '浸'],
      userTags: ['慢生活', '职场减压', '文化爱好者', '瑜珈爱好者'],
      weekDayNames: ['日', '一', '二', '三', '四', '五', '六'],
      weekDays: [],
      weekCards: []
    }
  },
  onLoad() {
    this.initCalendar()
    this.initWeekCards()
  },
  onShow() {
    // 每次显示时刷新数据（从选择页返回时）
    this.initCalendar()
    this.initWeekCards()
  },
  methods: {
    initCalendar() {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - dayOfWeek)

      const savedCards = uni.getStorageSync('calmCards') || {}
      const days = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateStr = (date.getMonth() + 1) + '-' + date.getDate()
        const isToday = (i === dayOfWeek)

        // 获取农历
        const lunar = toLunar(date)
        const lunarDisplay = lunar.dayStr === '初一' ? lunar.monthStr : lunar.dayStr

        // 获取节气
        const solarTerm = getSolarTerm(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate()
        )

        // 检查是否已打卡
        const saved = savedCards[dateStr]
        let checkedIcon = ''
        if (saved) {
          const theme = themes.find(t => t.id === saved.theme)
          checkedIcon = theme ? theme.icon : '✨'
        }

        days.push({
          dateStr,
          dateNum: date.getDate(),
          isToday,
          lunarDisplay,
          solarTerm,
          checkedIcon,
          fullDate: date
        })
      }

      this.weekDays = days
    },

    initWeekCards() {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const savedCards = uni.getStorageSync('calmCards') || {}
      const cards = []

      for (let i = 0; i < 3; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - dayOfWeek + i)
        const dateStr = (date.getMonth() + 1) + '-' + date.getDate()
        const saved = savedCards[dateStr]

        if (saved) {
          const theme = themes.find(t => t.id === saved.theme)
          cards.push({
            dateStr,
            image: theme ? theme.image : '/static/assets/landscape.jpg',
            icon: theme ? theme.icon : '✨',
            tagName: theme ? theme.name : '文化主题',
            title: saved.title || '今日慢浸卡',
            desc: dayNames[i] + ' · ' + saved.duration + '分钟 · ' + saved.status,
            themeId: saved.theme,
            hasSaved: true,
            imgError: false
          })
        } else {
          // 展示示例卡片
          const demoThemes = [
            { name: '绘画', desc: '像山一样稳定，像水一样流动', image: '/static/assets/landscape.jpg', icon: '🏔️', id: 'landscape' },
            { name: '玉器', desc: '感受温润与宁静', image: '/static/assets/flower.jpg', icon: '🌸', id: 'flower' },
            { name: '陶瓷', desc: '在圆润中找到内心的平衡', image: '/static/assets/porcelain.jpg', icon: '🏺', id: 'porcelain' }
          ]
          const demo = demoThemes[i]
          cards.push({
            dateStr,
            image: demo.image,
            icon: demo.icon,
            tagName: demo.name,
            title: '今日慢浸卡',
            desc: dayNames[i] + ' · ' + demo.desc,
            themeId: demo.id,
            hasSaved: false,
            imgError: false
          })
        }
      }

      this.weekCards = cards
    },

    onImgError(idx, e) {
      // 图片加载失败时显示占位符
      this.$set(this.weekCards[idx], 'imgError', true)
    },

    onDayTap(day) {
      const savedCards = uni.getStorageSync('calmCards') || {}
      const saved = savedCards[day.dateStr]
      if (saved) {
        // 已有卡片，跳转到卡片详情页
        uni.setStorageSync('currentCard', saved)
        uni.navigateTo({ url: '/pages/card/card' })
      } else {
        // 无卡片，跳转到选择页
        uni.navigateTo({ url: '/pages/select/select' })
      }
    },

    onCardTap(card) {
      if (card.hasSaved) {
        const savedCards = uni.getStorageSync('calmCards') || {}
        const saved = savedCards[card.dateStr]
        if (saved) {
          uni.setStorageSync('currentCard', saved)
          uni.navigateTo({ url: '/pages/card/card' })
        }
      } else {
        uni.navigateTo({ url: '/pages/select/select' })
      }
    },

    goSelect() {
      uni.navigateTo({ url: '/pages/select/select' })
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

/* 顶部装饰 */
.header-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0 16rpx;
  opacity: 0;
  animation: fadeIn 0.8s ease 0.6s forwards;
}
.deco-line {
  width: 80rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #e4d8c7, transparent);
}
.deco-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #9b5f3c;
  opacity: 0.6;
  margin: 0 16rpx;
}

/* 标题区域 */
.header {
  text-align: center;
  padding: 10rpx 0 30rpx;
}
.title-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 10rpx;
}
.title-char {
  font-size: 64rpx;
  font-weight: 700;
  color: #9b5f3c;
  letter-spacing: 0.15em;
  opacity: 0;
  animation: charFadeIn 0.6s ease forwards;
}
@keyframes charFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.subtitle {
  display: block;
  font-size: 34rpx;
  color: #786c61;
  margin-bottom: 10rpx;
}
.slogan {
  display: block;
  font-size: 28rpx;
  color: #5f7d6a;
  font-style: italic;
}

/* 用户标签 */
.user-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24rpx;
  gap: 16rpx;
}
.user-tag {
  padding: 10rpx 28rpx;
  background-color: rgba(95, 125, 106, 0.1);
  color: #5f7d6a;
  border-radius: 999rpx;
  font-size: 26rpx;
}

/* 周历 */
.calendar-section {
  margin: 30rpx 0;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.calendar-header-text {
  width: 14.28%;
  text-align: center;
  font-size: 24rpx;
  color: #786c61;
}
.calendar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.day-cell {
  width: 14.28%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fffdf8;
  border-radius: 20rpx;
  padding: 14rpx 0;
  border: 4rpx solid transparent;
  position: relative;
}
.day-cell.day-today {
  border-color: #9b5f3c;
  background-color: rgba(155, 95, 60, 0.08);
}
.day-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #2a241f;
  line-height: 1.2;
}
.day-name {
  font-size: 20rpx;
  color: #786c61;
  margin-top: 4rpx;
}
.day-lunar {
  font-size: 18rpx;
  color: #9b5f3c;
  margin-top: 4rpx;
  font-weight: 500;
}
.day-term {
  font-size: 18rpx;
  color: #5f7d6a;
  margin-top: 2rpx;
  font-weight: 600;
}
.day-icon {
  font-size: 36rpx;
  margin-top: 4rpx;
}

/* 本周慢浸卡 */
.week-cards {
  margin-top: 40rpx;
}
.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #2a241f;
  margin-bottom: 24rpx;
}
.card-preview {
  background-color: #fffdf8;
  border-radius: 36rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  border: 2rpx solid #e4d8c7;
  position: relative;
}
.card-preview-img {
  width: 100%;
  height: 260rpx;
  display: block;
}
.card-preview-placeholder {
  width: 100%;
  height: 260rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-preview-placeholder.landscape {
  background: linear-gradient(135deg, #c8d8c0 0%, #8ba888 100%);
}
.card-preview-placeholder.flower {
  background: linear-gradient(135deg, #f0e0e8 0%, #d4a0b0 100%);
}
.card-preview-placeholder.porcelain {
  background: linear-gradient(135deg, #e8ddd0 0%, #b8a898 100%);
}
.card-preview-placeholder.bronze {
  background: linear-gradient(135deg, #d4c5a9 0%, #8b7355 100%);
}
.card-preview-placeholder.calligraphy {
  background: linear-gradient(135deg, #e8e0d0 0%, #a09080 100%);
}
.card-preview-placeholder.buddha {
  background: linear-gradient(135deg, #e0d8c8 0%, #b0a090 100%);
}
.card-preview-placeholder.textile {
  background: linear-gradient(135deg, #e8e0d8 0%, #c0a898 100%);
}
.card-preview-placeholder.furniture {
  background: linear-gradient(135deg, #d8c8a8 0%, #a08860 100%);
}
.placeholder-icon {
  font-size: 80rpx;
}
.card-info {
  padding: 24rpx 30rpx;
}
.card-tag {
  display: inline-block;
  background-color: rgba(95, 125, 106, 0.12);
  color: #5f7d6a;
  font-size: 24rpx;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.card-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #2a241f;
  margin-bottom: 8rpx;
}
.card-desc {
  display: block;
  font-size: 26rpx;
  color: #786c61;
}

/* 底部按钮 */
.btn-wrap {
  margin-top: 40rpx;
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
