<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import type { Brand } from '@/data/mockData'

const store = useBrandStore()
const keyword = ref('')

const allBrands = computed<Brand[]>(() => {
  return [...store.redBrands, ...store.blackBrands]
})

const searchResults = computed<Brand[]>(() => {
  if (!keyword.value.trim()) return []
  const kw = keyword.value.trim().toLowerCase()
  return allBrands.value.filter(
    b => b.name.toLowerCase().includes(kw) || b.category.toLowerCase().includes(kw)
  )
})

const hotKeywords = ['蒙牛', '云南白药', '欧莱雅', '食品', '药品']

const onHotKeywordTap = (kw: string) => {
  keyword.value = kw
}

const onBrandTap = (brandId: string) => {
  uni.navigateTo({ url: `/pages/scan/index?brandId=${brandId}` })
}

const onBackTap = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

const onClearTap = () => {
  keyword.value = ''
}
</script>

<template>
  <view class="search-page">
    <!-- Search Bar -->
    <view class="search-header">
      <view class="back-btn" @tap="onBackTap">
        <view class="arrow-left"></view>
      </view>
      <view class="search-input-wrap">
        <view class="search-icon"></view>
        <input
          type="text"
          placeholder="输入品牌名称或类别"
          v-model="keyword"
          :focus="true"
          confirm-type="search"
        />
        <view v-if="keyword" class="clear-btn" @tap="onClearTap">
          <view class="clear-icon"></view>
        </view>
      </view>
    </view>

    <!-- Content -->
    <scroll-view scroll-y class="search-content" :show-scrollbar="false">
      <!-- Hot Keywords (when no search) -->
      <view v-if="!keyword.trim()" class="hot-section">
        <text class="section-label">热门搜索</text>
        <view class="hot-keywords">
          <view
            v-for="kw in hotKeywords"
            :key="kw"
            class="hot-keyword"
            @tap="onHotKeywordTap(kw)"
          >
            <text>{{ kw }}</text>
          </view>
        </view>
      </view>

      <!-- Search Results -->
      <view v-else class="result-section">
        <text class="result-count" v-if="searchResults.length > 0">
          找到 {{ searchResults.length }} 个相关品牌
        </text>
        <view
          v-for="brand in searchResults"
          :key="brand.id"
          class="brand-item"
          @tap="onBrandTap(brand.id)"
        >
          <view class="brand-info">
            <text class="brand-name">{{ brand.name }}</text>
            <view class="brand-tags">
              <view class="tag" :class="brand.status === 'red' ? 'tag-red' : 'tag-black'">
                <text>{{ brand.status === 'red' ? '红榜' : '黑榜' }}</text>
              </view>
              <text class="brand-category">{{ brand.category }}</text>
            </view>
          </view>
          <view class="brand-score-wrap">
            <text class="brand-score" :class="brand.status === 'red' ? 'score-high' : 'score-low'">{{ brand.trustScore }}</text>
            <view class="arrow-right"></view>
          </view>
        </view>

        <!-- Empty State -->
        <view v-if="searchResults.length === 0" class="empty-state">
          <view class="empty-icon"></view>
          <text class="empty-text">未找到相关品牌</text>
          <text class="empty-hint">试试其他关键词</text>
        </view>
      </view>

      <view style="height: 24px;"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.search-page {
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
  min-height: 100vh;
  background: $color-surface;
  display: flex;
  flex-direction: column;
}

/* Search Header */
.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: $color-surface-raised;
  border-bottom: 1px solid $color-border;
  position: sticky;
  top: 0;
  z-index: 20;
}
.back-btn {
  width: 32px;
  height: 32px;
  border-radius: $radius-full;
  background: $color-surface;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.arrow-left {
  width: 10px;
  height: 10px;
  border-top: 2px solid $color-text-primary;
  border-left: 2px solid $color-text-primary;
  transform: rotate(-45deg);
}
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: $color-surface;
  border-radius: $radius-full;
  padding: 8px 12px;
  border: 1px solid $color-border;
}
.search-icon {
  width: 16px;
  height: 16px;
  border: 2px solid $color-text-tertiary;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  margin-right: 8px;
}
.search-icon::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 2px;
  background: $color-text-tertiary;
  transform: rotate(45deg);
  right: -4px;
  bottom: 0;
}
.search-input-wrap input {
  flex: 1;
  font-size: $text-sm;
  color: $color-text-primary;
  border: none;
  background: transparent;
  outline: none;
}
.clear-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.clear-icon {
  width: 14px;
  height: 14px;
  position: relative;
}
.clear-icon::before,
.clear-icon::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 2px;
  background: $color-text-tertiary;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}
.clear-icon::before {
  transform: translateY(-50%) rotate(45deg);
}
.clear-icon::after {
  transform: translateY(-50%) rotate(-45deg);
}

/* Search Content */
.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Hot Keywords */
.hot-section {
  margin-top: 8px;
}
.section-label {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $color-text-secondary;
  margin-bottom: 12px;
  display: block;
}
.hot-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hot-keyword {
  padding: 6px 16px;
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-full;
  font-size: $text-sm;
  color: $color-text-primary;
}
.hot-keyword:active {
  background: $color-primary-light;
  border-color: $color-primary-200;
}

/* Search Results */
.result-section {
  display: flex;
  flex-direction: column;
}
.result-count {
  font-size: $text-xs;
  color: $color-text-tertiary;
  margin-bottom: 12px;
  display: block;
}
.brand-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: $shadow-sm;
}
.brand-item:active {
  transform: scale(0.985);
  box-shadow: none;
}
.brand-info {
  flex: 1;
  min-width: 0;
}
.brand-name {
  font-size: $text-base;
  font-weight: $font-bold;
  color: $color-text-primary;
  margin-bottom: 6px;
  display: block;
}
.brand-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tag {
  font-size: 11px;
  font-weight: $font-semibold;
  padding: 2px 8px;
  border-radius: $radius-sm;
}
.tag-red {
  background: $state-success-light;
  color: $state-success;
}
.tag-black {
  background: $state-error-light;
  color: $state-error;
}
.brand-category {
  font-size: 11px;
  color: $color-text-tertiary;
}
.brand-score-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.brand-score {
  font-size: $text-lg;
  font-weight: $font-bold;
}
.score-high {
  color: $state-success;
}
.score-low {
  color: $state-error;
}
.arrow-right {
  width: 8px;
  height: 8px;
  border-top: 2px solid $color-text-tertiary;
  border-right: 2px solid $color-text-tertiary;
  transform: rotate(45deg);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}
.empty-icon {
  width: 60px;
  height: 60px;
  border: 2px solid $color-border;
  border-radius: 50%;
  margin-bottom: 16px;
  position: relative;
}
.empty-icon::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 2px;
  background: $color-border;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
}
.empty-text {
  font-size: $text-base;
  color: $color-text-secondary;
  margin-bottom: 4px;
}
.empty-hint {
  font-size: $text-sm;
  color: $color-text-tertiary;
}
</style>
