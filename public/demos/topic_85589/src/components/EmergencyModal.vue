<template>
  <view v-if="visible" class="modal-mask" @click="handleMaskClick">
    <view class="modal-popup" @click.stop>
      <view class="popup-header">
        <text class="popup-icon">🚨</text>
        <text class="popup-title">紧急求助确认</text>
      </view>
      
      <view class="popup-desc">
        <text>将立即推送您的位置给周边 500 米内的认证邻居，请保持手机畅通</text>
      </view>
      
      <view class="popup-form">
        <textarea 
          class="popup-textarea" 
          v-model="description"
          placeholder="请简要描述您的情况..."
          :maxlength="200"
          auto-height
        />
        <text class="textarea-count">{{ description.length }}/200</text>
      </view>
      
      <view class="popup-actions">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" :disabled="isSending" @click="handleConfirm">
          <text v-if="isSending">发送中...</text>
          <text v-else>立即发送求助</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', desc: string): void
}>()

const description = ref('')
const isSending = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    description.value = ''
  }
})

function handleMaskClick() {
  emit('close')
}

function handleCancel() {
  emit('close')
}

function handleConfirm() {
  isSending.value = true
  setTimeout(() => {
    emit('confirm', description.value.trim())
    isSending.value = false
  }, 500)
}
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-popup {
  width: 90%;
  max-width: 640rpx;
  background: $bg-color-white;
  border-radius: $border-radius-xl;
  padding: $spacing-xl;
  animation: slideUp 0.3s ease;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  
  .popup-icon {
    font-size: 40rpx;
    animation: blink 1s infinite;
  }
  
  .popup-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $primary-dark;
  }
}

.popup-desc {
  text-align: center;
  font-size: $font-size-sm;
  color: $text-color-light;
  line-height: 1.6;
  margin-bottom: $spacing-lg;
}

.popup-form {
  margin-bottom: $spacing-lg;
  
  .popup-textarea {
    width: 100%;
    min-height: 160rpx;
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
}

.popup-actions {
  display: flex;
  gap: $spacing-md;
  
  .btn-cancel {
    flex: 1;
    height: 88rpx;
    background: $bg-color;
    border: none;
    border-radius: $border-radius-xl;
    font-size: $font-size-base;
    color: $text-color-secondary;
    transition: all 0.2s ease;
    
    &:active {
      background: $border-color;
    }
  }
  
  .btn-confirm {
    flex: 2;
    height: 88rpx;
    background: linear-gradient(135deg, $primary-dark 0%, $primary-color 100%);
    border: none;
    border-radius: $border-radius-xl;
    font-size: $font-size-base;
    font-weight: bold;
    color: #ffffff;
    box-shadow: 0 4rpx 16rpx rgba(255, 71, 87, 0.3);
    transition: all 0.2s ease;
    
    &:active:not(:disabled) {
      transform: translateY(-2rpx);
      box-shadow: 0 6rpx 20rpx rgba(255, 71, 87, 0.4);
    }
    
    &:disabled {
      opacity: 0.7;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
