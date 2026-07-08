<template>
  <view class="page-container">
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">任务类型</text>
        <picker 
          :value="taskForm.typeIndex" 
          :range="taskTypeLabels" 
          @change="onTypeChange"
        >
          <view class="form-picker">
            <text>{{ taskTypes[taskForm.typeIndex].label }}</text>
            <text class="picker-arrow">▾</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">需求描述</text>
        <textarea 
          class="form-textarea" 
          v-model="taskForm.description"
          placeholder="请详细描述您的需求，例如：出差3天，需要邻居每日上门喂猫并清理猫砂..."
          :maxlength="500"
        />
        <text class="textarea-count">{{ taskForm.description.length }}/500</text>
      </view>

      <view class="form-item">
        <text class="form-label">期望时间</text>
        <input 
          class="form-input" 
          v-model="taskForm.expectTime"
          placeholder="请输入期望服务时间，例如：2026.07.02-07.05"
          type="text"
        />
      </view>

      <button class="btn-submit" :disabled="isSubmitting" @click="submitTask">
        <text v-if="isSubmitting">发布中...</text>
        <text v-else>发布任务，等待邻居接单</text>
      </button>
    </view>

    <view class="rules-section">
      <view class="rules-header">
        <text class="rules-icon">📋</text>
        <text class="rules-title">互助规则</text>
      </view>
      <view class="rules-list">
        <view class="rule-item">
          <text class="rule-dot">✓</text>
          <text class="rule-text">任务发布后将推送给同小区认证邻居</text>
        </view>
        <view class="rule-item">
          <text class="rule-dot">✓</text>
          <text class="rule-text">邻居接单后可在线沟通详情</text>
        </view>
        <view class="rule-item">
          <text class="rule-dot">✓</text>
          <text class="rule-text">完成互助后双方互评更新信用分</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { taskTypes, publishTask, mockUsers } from '@/mock/data'
import { showToast, navigateBack } from '@/utils/common'

const taskForm = ref({
  typeIndex: 0,
  description: '',
  expectTime: ''
})

const isSubmitting = ref(false)

const taskTypeLabels = computed(() => taskTypes.map(t => t.label))

function onTypeChange(e: { detail: { value: number } }) {
  taskForm.value.typeIndex = e.detail.value
}

async function submitTask() {
  if (!taskForm.value.description.trim()) {
    showToast('请填写需求描述', 'none')
    return
  }
  if (!taskForm.value.expectTime.trim()) {
    showToast('请填写期望时间', 'none')
    return
  }

  isSubmitting.value = true

  try {
    const task = {
      type: taskTypes[taskForm.value.typeIndex].value,
      title: taskTypes[taskForm.value.typeIndex].label,
      description: taskForm.value.description.trim(),
      expectTime: taskForm.value.expectTime.trim(),
      publisher: mockUsers[0]
    }

    await publishTask(task)

    showToast('任务发布成功！\n系统将推送给同小区认证邻居', 'success')
    
    setTimeout(() => {
      navigateBack()
    }, 1500)
  } catch (error) {
    showToast('发布失败，请重试', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $bg-color;
  padding: $spacing-md;
}

.form-section {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
}

.form-item {
  margin-bottom: $spacing-lg;
  
  .form-label {
    display: block;
    font-size: $font-size-base;
    font-weight: 500;
    color: $text-color;
    margin-bottom: $spacing-sm;
  }
}

.form-picker {
  width: 100%;
  height: 88rpx;
  padding: 0 $spacing-md;
  background: $bg-color;
  border-radius: $border-radius;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $font-size-base;
  color: $text-color;
  border: 1rpx solid $border-color;
  transition: border-color 0.2s;
  
  &:active {
    border-color: $primary-color;
  }
  
  .picker-arrow {
    color: $text-color-light;
    font-size: $font-size-sm;
  }
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: $spacing-md;
  background: $bg-color;
  border-radius: $border-radius;
  font-size: $font-size-base;
  color: $text-color;
  border: 1rpx solid $border-color;
  box-sizing: border-box;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: $primary-color;
  }
}

.textarea-count {
  display: block;
  text-align: right;
  font-size: $font-size-xs;
  color: $text-color-light;
  margin-top: $spacing-xs;
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 $spacing-md;
  background: $bg-color;
  border-radius: $border-radius;
  font-size: $font-size-base;
  color: $text-color;
  border: 1rpx solid $border-color;
  box-sizing: border-box;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: $primary-color;
  }
}

.btn-submit {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, $primary-color 0%, $primary-dark 100%);
  border: none;
  border-radius: $border-radius-xl;
  font-size: $font-size-lg;
  font-weight: bold;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: $spacing-md;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.3);
  transition: all 0.2s ease;
  
  &:active:not(:disabled) {
    transform: translateY(-2rpx);
    box-shadow: 0 12rpx 32rpx rgba(255, 107, 107, 0.4);
  }
  
  &:disabled {
    opacity: 0.7;
    pointer-events: none;
  }
}

.rules-section {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.rules-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  
  .rules-icon {
    font-size: $font-size-lg;
  }
  
  .rules-title {
    font-size: $font-size-base;
    font-weight: bold;
    color: $text-color;
  }
}

.rules-list {
  padding-left: $spacing-sm;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .rule-dot {
    color: $primary-color;
    font-size: $font-size-sm;
    flex-shrink: 0;
  }
  
  .rule-text {
    font-size: $font-size-sm;
    color: $text-color-light;
    line-height: 1.6;
  }
}
</style>
