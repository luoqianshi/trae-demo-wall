<template>
  <view class="demo-container">
    <view class="demo-header">
      <text class="demo-title">暖邻 WarmNeighbor</text>
      <text class="demo-subtitle">独居青年邻里互助应急小程序 · TRAE 赛事演示</text>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="title-text">一、核心页面原型展示</text>
      </view>
      <view class="phone-row">
        <view class="phone-mock">
          <view class="phone-notch"></view>
          <view class="phone-status-bar">
            <text>9:41</text>
            <text>📶 🔋</text>
          </view>
          <view class="phone-nav-bar">暖邻</view>
          <view class="phone-content">
            <view class="mock-welcome">
              <text class="mock-welcome-title">欢迎回家</text>
              <text class="mock-welcome-desc">同小区认证邻里互助平台</text>
            </view>
            <view class="mock-emergency-btn">
              <text class="mock-emerg-icon">🚨</text>
              <text>一键紧急求助</text>
            </view>
            <view class="mock-card">
              <text class="mock-card-icon">🛒</text>
              <text class="mock-card-title">日常互助</text>
              <text class="mock-card-desc">代取快递 · 宠物照看 · 物资代买</text>
            </view>
            <view class="mock-card">
              <text class="mock-card-icon">👫</text>
              <text class="mock-card-title">邻里结伴</text>
              <text class="mock-card-desc">生鲜拼单 · 运动组队 · 闲置互换</text>
            </view>
            <view class="mock-card">
              <text class="mock-card-icon">🏠</text>
              <text class="mock-card-title">我的邻居</text>
              <text class="mock-card-desc">已认证同楼栋住户 126 人</text>
            </view>
            <view class="mock-publish-btn">发布互助任务</view>
          </view>
        </view>

        <view class="phone-mock">
          <view class="phone-notch"></view>
          <view class="phone-status-bar">
            <text>9:43</text>
            <text>📶 🔋</text>
          </view>
          <view class="phone-nav-bar">
            <text class="mock-back-btn">←</text>
            <text>发布互助任务</text>
          </view>
          <view class="phone-content">
            <view class="mock-form-item">
              <text class="mock-form-label">任务类型</text>
              <view class="mock-form-select">🐱 宠物照看</view>
            </view>
            <view class="mock-form-item">
              <text class="mock-form-label">需求描述</text>
              <view class="mock-form-textarea"></view>
            </view>
            <view class="mock-form-item">
              <text class="mock-form-label">期望时间</text>
              <view class="mock-form-input"></view>
            </view>
            <view class="mock-submit-btn">发布任务，等待邻居接单</view>
            <view class="mock-rules">
              <text class="mock-rules-title">互助规则</text>
              <text class="mock-rules-text">• 任务发布后将推送给同小区认证邻居</text>
              <text class="mock-rules-text">• 邻居接单后可在线沟通详情</text>
              <text class="mock-rules-text">• 完成互助后双方互评更新信用分</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="title-text">二、应急求助业务流程图</text>
      </view>
      <view class="flow-container">
        <view class="flow-row">
          <view class="flow-node">触发求助</view>
          <text class="flow-arrow">→</text>
          <view class="flow-node">获取 LBS 定位</view>
          <text class="flow-arrow">→</text>
          <view class="flow-node">推送邻居</view>
        </view>
        <view class="flow-row">
          <view class="flow-vertical-arrow">↓</view>
          <view class="flow-vertical-arrow">↓</view>
          <view class="flow-vertical-arrow">↓</view>
        </view>
        <view class="flow-row">
          <view class="flow-node">邻居查看接单</view>
          <text class="flow-arrow">→</text>
          <view class="flow-node">线下帮扶</view>
          <text class="flow-arrow">→</text>
          <view class="flow-node">互评更新信用分</view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="title-text">三、产品定位</text>
      </view>
      <view class="product-card">
        <text class="product-icon">🎯</text>
        <view class="product-content">
          <text class="product-title">产品定位</text>
          <text class="product-text">暖邻 WarmNeighbor 是一款面向城市独居青年的同小区认证邻里互助平台，致力于构建安全、可靠、温暖的社区互助网络。通过实名认证、小区门禁验证等多重机制，确保邻里关系的真实性和安全性。</text>
          <text class="product-text"><strong>两大核心业务：</strong></text>
          <text class="product-text">① <strong>日常便民互助</strong>：涵盖宠物照看、代取快递、物资代买、家政帮忙、生鲜拼单、运动组队等日常生活需求，让独居青年不再孤单。</text>
          <text class="product-text">② <strong>一键紧急应急求助</strong>：当用户遇到突发状况时，只需点击一键求助按钮，系统立即获取 LBS 定位并推送给周边 500 米内的认证邻居，形成快速响应的应急救援网络。</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="title-text">四、核心亮点</text>
      </view>
      <view class="features-grid">
        <view class="feature-card">
          <text class="feature-icon">📍</text>
          <text class="feature-title">精准定位推送</text>
          <text class="feature-desc">基于 LBS 定位技术，紧急求助信息精准推送给周边 500 米内的认证邻居，实现快速响应</text>
        </view>
        <view class="feature-card">
          <text class="feature-icon">✅</text>
          <text class="feature-title">实名认证机制</text>
          <text class="feature-desc">通过小区门禁验证、身份认证等多重手段，确保邻里关系真实可靠</text>
        </view>
        <view class="feature-card">
          <text class="feature-icon">🏆</text>
          <text class="feature-title">信用评分体系</text>
          <text class="feature-desc">互助完成后双方互评，积累信用积分，构建社区信任生态</text>
        </view>
        <view class="feature-card">
          <text class="feature-icon">❤️</text>
          <text class="feature-title">温暖设计语言</text>
          <text class="feature-desc">暖红色主色调传递温暖与安全，紧急按钮醒目易触达，交互简洁直观</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="title-text">五、赛事赛道说明</text>
      </view>
      <view class="race-card">
        <text class="race-icon">🏃</text>
        <view class="race-content">
          <text class="race-title">参赛赛道：生活服务 + 社会公益</text>
          <text class="race-text"><strong>生活服务属性：</strong>提供日常互助、邻里结伴等生活服务功能，解决独居青年的实际生活需求。</text>
          <text class="race-text"><strong>社会公益属性：</strong>构建社区互助网络，促进邻里关系和谐，传递温暖与关爱，尤其关注独居青年的安全问题。</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="title-text">六、演示备注说明</text>
      </view>
      <view class="note-card">
        <text class="note-icon">⚠️</text>
        <view class="note-content">
          <text class="note-title">演示说明</text>
          <text class="note-text">• 本项目为 TRAE 赛事作品演示 Demo，基于 uni-app Vue3 + TypeScript 开发</text>
          <text class="note-text">• 所有交互均为前端模拟，无需对接真实后端接口，数据为示例数据</text>
          <text class="note-text">• 页面采用模拟手机竖屏容器（375×812），还原微信小程序视觉尺寸</text>
          <text class="note-text">• 主色调暖红色 #ff6b6b，区分紧急红色警示按钮与普通灰色功能按钮</text>
          <text class="note-text">• 支持 H5 预览和微信小程序编译运行</text>
        </view>
      </view>
    </view>

    <view class="demo-footer">
      <text>暖邻 WarmNeighbor · 独居青年邻里互助应急小程序 · TRAE 赛事演示 Demo</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Demo page loaded')
})
</script>

<style lang="scss" scoped>
.demo-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 40rpx;
  box-sizing: border-box;
}

.demo-header {
  text-align: center;
  padding: 40rpx 0;
  
  .demo-title {
    display: block;
    font-size: 56rpx;
    font-weight: bold;
    color: $primary-color;
    margin-bottom: 16rpx;
    letter-spacing: 4rpx;
  }
  
  .demo-subtitle {
    font-size: 28rpx;
    color: $text-color-light;
  }
}

.section {
  margin-bottom: 60rpx;
}

.section-title {
  padding-left: 24rpx;
  margin-bottom: 32rpx;
  position: relative;
  
  .title-text {
    font-size: 36rpx;
    font-weight: bold;
    color: $text-color;
  }
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8rpx;
    height: 8rpx;
    background: $primary-color;
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    left: 16rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 4rpx;
    height: 40rpx;
    background: $primary-color;
    border-radius: 2rpx;
  }
}

.phone-row {
  display: flex;
  justify-content: center;
  gap: 48rpx;
  flex-wrap: wrap;
}

.phone-mock {
  width: 375rpx;
  height: 812rpx;
  border: 24rpx solid #1a1a1a;
  border-radius: 88rpx;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;
  box-shadow: 0 24rpx 96rpx rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  
  .phone-notch {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 320rpx;
    height: 56rpx;
    background: #1a1a1a;
    border-radius: 0 0 40rpx 40rpx;
    z-index: 100;
  }
  
  .phone-status-bar {
    height: 88rpx;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48rpx;
    font-size: 28rpx;
    font-weight: 500;
    color: #000;
    position: relative;
    z-index: 10;
  }
  
  .phone-nav-bar {
    height: 88rpx;
    background: $primary-color;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34rpx;
    font-weight: bold;
    position: relative;
    
    .mock-back-btn {
      position: absolute;
      left: 32rpx;
      font-size: 48rpx;
    }
  }
  
  .phone-content {
    height: calc(100% - 176rpx);
    overflow-y: auto;
    background: #f5f7fa;
    padding: 32rpx;
  }
}

.mock-welcome {
  padding: 32rpx 0;
  
  .mock-welcome-title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: $text-color;
    margin-bottom: 8rpx;
  }
  
  .mock-welcome-desc {
    font-size: 26rpx;
    color: $text-color-light;
  }
}

.mock-emergency-btn {
  width: 100%;
  height: 144rpx;
  background: linear-gradient(135deg, $primary-dark 0%, $primary-color 100%);
  color: #ffffff;
  border-radius: 72rpx;
  font-size: 36rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin: 40rpx 0;
  box-shadow: 0 16rpx 48rpx rgba(255, 71, 87, 0.4);
  
  .mock-emerg-icon {
    font-size: 48rpx;
    animation: blink 1s infinite;
  }
}

.mock-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
  
  .mock-card-icon {
    font-size: 64rpx;
    margin-bottom: 24rpx;
    display: block;
  }
  
  .mock-card-title {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-color;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .mock-card-desc {
    font-size: 26rpx;
    color: $text-color-light;
    line-height: 1.5;
    display: block;
  }
}

.mock-publish-btn {
  width: 100%;
  height: 96rpx;
  background: #ffffff;
  border: 2rpx solid $border-color;
  border-radius: 48rpx;
  font-size: 30rpx;
  color: $text-color-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
}

.mock-form-item {
  margin-bottom: 40rpx;
  
  .mock-form-label {
    font-size: 30rpx;
    font-weight: 500;
    color: $text-color;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .mock-form-select,
  .mock-form-input {
    width: 100%;
    height: 88rpx;
    padding: 0 24rpx;
    background: #ffffff;
    border: 2rpx solid $border-color;
    border-radius: 24rpx;
    font-size: 28rpx;
    color: $text-color;
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }
  
  .mock-form-textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 24rpx;
    background: #ffffff;
    border: 2rpx solid $border-color;
    border-radius: 24rpx;
    box-sizing: border-box;
  }
}

.mock-submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, $primary-color 0%, $primary-dark 100%);
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 107, 107, 0.3);
}

.mock-rules {
  margin-top: 48rpx;
  padding: 32rpx;
  background: #f8fafc;
  border-radius: 24rpx;
  
  .mock-rules-title {
    font-size: 28rpx;
    font-weight: bold;
    color: $text-color-secondary;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .mock-rules-text {
    font-size: 24rpx;
    color: $text-color-light;
    line-height: 2;
    display: block;
  }
}

.flow-container {
  background: #fafbfc;
  border-radius: 32rpx;
  padding: 64rpx;
  border: 2rpx solid #f0f0f0;
}

.flow-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  margin-bottom: 48rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.flow-node {
  padding: 32rpx 48rpx;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%);
  border: 4rpx solid $primary-color;
  border-radius: 24rpx;
  min-width: 280rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 500;
  color: $primary-dark;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(1.05);
    box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.2);
  }
}

.flow-arrow {
  font-size: 40rpx;
  color: $primary-color;
  font-weight: bold;
}

.flow-vertical-arrow {
  font-size: 40rpx;
  color: $primary-color;
  margin: 0 140rpx;
}

.product-card,
.race-card {
  background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
  border-radius: 32rpx;
  padding: 48rpx;
  border-left: 8rpx solid $primary-color;
  display: flex;
  gap: 32rpx;
  
  .product-icon,
  .race-icon {
    font-size: 64rpx;
    flex-shrink: 0;
  }
  
  .product-title,
  .race-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: $primary-dark;
    margin-bottom: 24rpx;
  }
  
  .product-text,
  .race-text {
    font-size: 28rpx;
    color: $text-color-secondary;
    line-height: 1.8;
    display: block;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32rpx;
}

.feature-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  
  &:active {
    transform: translateY(-8rpx);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  }
  
  .feature-icon {
    font-size: 64rpx;
    margin-bottom: 24rpx;
    display: block;
  }
  
  .feature-title {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-color;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .feature-desc {
    font-size: 26rpx;
    color: $text-color-light;
    line-height: 1.6;
    display: block;
  }
}

.note-card {
  background: #f8fafc;
  border-radius: 24rpx;
  padding: 40rpx;
  border: 2rpx dashed #cbd5e1;
  display: flex;
  gap: 24rpx;
  
  .note-icon {
    font-size: 48rpx;
    flex-shrink: 0;
  }
  
  .note-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: $text-color-secondary;
    margin-bottom: 20rpx;
  }
  
  .note-text {
    font-size: 26rpx;
    color: #94a3b8;
    line-height: 1.8;
    display: block;
    margin-bottom: 12rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.demo-footer {
  text-align: center;
  margin-top: 80rpx;
  padding-top: 40rpx;
  border-top: 2rpx solid #f0f0f0;
  color: $text-color-light;
  font-size: 24rpx;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
