<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import { categoryLabels } from '@/data/mockData'

const store = useBrandStore()
const activeCategory = ref('全部')
const listType = ref<'red' | 'black'>('red')

const brands = computed(() => {
  let list = listType.value === 'red' ? store.redBrands : store.blackBrands
  if (activeCategory.value !== '全部') {
    list = list.filter(b => b.category === activeCategory.value)
  }
  return list
})

const onCategoryTap = (cat: string) => {
  activeCategory.value = cat
}

const onToggleTap = (type: 'red' | 'black') => {
  listType.value = type
}

const onBrandTap = (brandId: string) => {
  uni.navigateTo({ url: `/pages/scan/index?brandId=${brandId}` })
}
</script>

<template>
  <view class="ranking-page">
    <!-- Page Header -->
    <view class="page-header">
      <text class="page-title">品牌榜单</text>
      <view class="header-filter-btn">
        <view class="filter-icon"></view>
      </view>
      <scroll-view scroll-x class="category-tabs" :show-scrollbar="false">
        <view
          v-for="cat in categoryLabels"
          :key="cat"
          class="cat-tab"
          :class="{ active: activeCategory === cat }"
          @tap="onCategoryTap(cat)"
        >
          <text>{{ cat }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- Red/Green Toggle -->
    <view class="list-toggle">
      <view
        class="toggle-btn"
        :class="listType === 'red' ? 'red-active' : 'inactive'"
        @tap="onToggleTap('red')"
      >
        <text>红榜</text>
      </view>
      <view
        class="toggle-btn"
        :class="listType === 'black' ? 'black-active' : 'inactive'"
        @tap="onToggleTap('black')"
      >
        <text>黑榜</text>
      </view>
    </view>

    <!-- Brand List -->
    <scroll-view scroll-y class="brand-list" :show-scrollbar="false">
      <view
        v-for="brand in brands"
        :key="brand.id"
        class="brand-card"
        @tap="onBrandTap(brand.id)"
      >
        <view class="brand-card-content">
          <view class="brand-card-top">
            <text class="brand-name">{{ brand.name }}</text>
            <view class="brand-category-tag">
              <text>{{ brand.subCategory || brand.category }}</text>
            </view>
          </view>
          <view class="brand-card-middle">
            <text class="trust-score-label">信任分</text>
            <text class="trust-score" :class="brand.status === 'red' ? 'high' : 'low'">{{ brand.trustScore }}</text>
            <view class="score-bar">
              <view
                class="score-bar-fill"
                :class="brand.status === 'red' ? 'high' : 'low'"
                :style="{ width: brand.trustScore + '%' }"
              ></view>
            </view>
          </view>
          <view class="brand-card-bottom">
            <view class="status-badge" :class="brand.status === 'red' ? 'success' : 'error'">
              <text>{{ brand.status === 'red' ? '红榜推荐' : '黑榜警告' }}</text>
            </view>
            <text class="brand-reason">{{ brand.reason }}</text>
          </view>
        </view>
        <view class="brand-card-arrow">
          <view class="arrow-right"></view>
        </view>
      </view>

      <!-- Empty State -->
      <view v-if="brands.length === 0" class="empty-state">
        <text>暂无数据</text>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ranking-page {
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
  min-height: 100vh;
  background: $color-surface;
  display: flex;
  flex-direction: column;
}

/* Page Header */
.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: $color-surface-raised;
  border-bottom: 1px solid $color-border;
  padding: 14px 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.page-title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $color-text-primary;
  line-height: $leading-tight;
}
.header-filter-btn {
  position: absolute;
  right: 16px;
  top: 14px;
  width: 36px;
  height: 36px;
  border-radius: $radius-full;
  background: $color-surface;
  display: flex;
  align-items: center;
  justify-content: center;
}
.filter-icon {
  width: 16px;
  height: 16px;
  border-top: 2px solid $color-text-secondary;
  position: relative;
}
.filter-icon::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 2px;
  width: 10px;
  height: 2px;
  background: $color-text-secondary;
}
.filter-icon::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 4px;
  width: 6px;
  height: 2px;
  background: $color-text-secondary;
}

/* Category Tabs */
.category-tabs {
  width: 100%;
  padding: 12px 0 0;
  display: flex;
  gap: 4px;
  white-space: nowrap;
}
.cat-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $color-text-secondary;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  line-height: $leading-tight;
}
.cat-tab.active {
  color: $color-primary;
  border-bottom-color: $color-primary;
}

/* Red/Green Toggle */
.list-toggle {
  display: flex;
  gap: 0;
  margin: 12px 16px 0;
  background: $color-border-subtle;
  border-radius: $radius-full;
  padding: 3px;
}
.toggle-btn {
  flex: 1;
  padding: 8px 0;
  font-size: $text-sm;
  font-weight: $font-semibold;
  border: none;
  border-radius: $radius-full;
  text-align: center;
  line-height: $leading-tight;
  transition: all 0.2s ease;
}
.toggle-btn.red-active {
  background: $state-success;
  color: $color-text-inverse;
}
.toggle-btn.black-active {
  background: $state-error;
  color: $color-text-inverse;
}
.toggle-btn.inactive {
  background: transparent;
  color: $color-text-secondary;
}

/* Brand List */
.brand-list {
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
  padding-bottom: 80px;
}
.brand-card {
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-card:active {
  transform: scale(0.985);
  box-shadow: none;
}
.brand-card-content {
  flex: 1;
  min-width: 0;
}
.brand-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.brand-name {
  font-size: $text-base;
  font-weight: $font-bold;
  color: $color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-category-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: $font-medium;
  padding: 1px 8px;
  border-radius: $radius-full;
  background: $color-primary-light;
  color: $color-primary;
  white-space: nowrap;
}
.brand-card-middle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.trust-score {
  font-size: $text-lg;
  font-weight: $font-bold;
  line-height: 1;
}
.trust-score-label {
  font-size: $text-xs;
  font-weight: $font-normal;
  color: $color-text-tertiary;
  margin-right: 2px;
}
.trust-score.high { color: $state-success; }
.trust-score.low { color: $state-error; }
.score-bar {
  flex: 1;
  height: 4px;
  background: $color-border-subtle;
  border-radius: $radius-full;
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.4s ease;
}
.score-bar-fill.high { background: $state-success; }
.score-bar-fill.low { background: $state-error; }
.brand-card-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: $font-semibold;
  padding: 2px 8px;
  border-radius: $radius-sm;
  white-space: nowrap;
}
.status-badge.success {
  background: $state-success-light;
  color: $state-success;
}
.status-badge.error {
  background: $state-error-light;
  color: $state-error;
}
.brand-reason {
  font-size: $text-xs;
  color: $color-text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-card-arrow {
  flex-shrink: 0;
  color: $color-text-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-right {
  width: 10px;
  height: 10px;
  border-top: 2px solid $color-text-tertiary;
  border-right: 2px solid $color-text-tertiary;
  transform: rotate(45deg);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: $color-text-tertiary;
  font-size: $text-sm;
}
</style>
