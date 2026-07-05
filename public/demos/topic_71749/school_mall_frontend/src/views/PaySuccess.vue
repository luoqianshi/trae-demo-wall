<template>
  <div class="pay-success-page">
    <div class="header-container">
      <Header />
    </div>
    
    <div class="success-container">
      <div class="success-card">
        <div class="success-icon">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <h1 class="success-title">支付成功</h1>
        <p class="success-desc">您的订单已支付成功，我们将尽快为您发货</p>
        
        <div class="order-info" v-if="orderInfo">
          <div class="info-item">
            <span class="label">订单编号：</span>
            <span class="value">{{ orderInfo.out_trade_no }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付金额：</span>
            <span class="value price">¥{{ orderInfo.total_amount }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付时间：</span>
            <span class="value">{{ orderInfo.timestamp }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="goToHome">
            返回首页
          </el-button>
          <el-button size="large" @click="goToOrders">
            查看订单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import Header from '../components/Header.vue'

const route = useRoute()
const router = useRouter()

const orderInfo = ref({
  out_trade_no: '',
  total_amount: '',
  timestamp: ''
})

onMounted(() => {
  // 解析URL参数
  const { out_trade_no, total_amount, timestamp, trade_no } = route.query
  
  orderInfo.value = {
    out_trade_no: out_trade_no || '',
    total_amount: total_amount || '',
    timestamp: timestamp ? decodeURIComponent(timestamp) : '',
    trade_no: trade_no || ''
  }
})

const goToHome = () => {
  router.push('/')
}

const goToOrders = () => {
  router.push('/orders')
}
</script>

<style scoped>
.pay-success-page {
  min-height: 100vh;
  background-color: #fff7ed;
}

.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.success-card {
  background: #fff;
  border-radius: 8px;
  padding: 60px 80px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.success-icon {
  font-size: 80px;
  color: #67c23a;
  margin-bottom: 20px;
}

.success-icon :deep(.el-icon) {
  font-size: 80px;
}

.success-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.success-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.order-info {
  background: #f8f8f8;
  border-radius: 6px;
  padding: 20px 30px;
  margin-bottom: 30px;
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.info-item .price {
  color: #ea580c;
  font-size: 16px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.action-buttons .el-button {
  min-width: 120px;
}

@media (max-width: 768px) {
  .success-card {
    padding: 40px 30px;
  }
  
  .success-icon :deep(.el-icon) {
    font-size: 60px;
  }
  
  .success-title {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
