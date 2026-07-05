<template>
  <div class="recharge-page">
    <Header />
    <div class="recharge-container">
      <div class="recharge-card">
        <h2 class="title">校园卡充值</h2>
        
        <!-- 当前余额 -->
        <div class="balance-section">
          <span class="label">当前余额</span>
          <span class="balance">¥{{ currentBalance.toFixed(2) }}</span>
        </div>

        <!-- 充值金额选择 -->
        <div class="amount-section">
          <span class="label">选择充值金额</span>
          <div class="amount-options">
            <div 
              v-for="amount in presetAmounts" 
              :key="amount"
              :class="['amount-item', { active: selectedAmount === amount }]"
              @click="selectedAmount = amount; customAmount = ''"
            >
              ¥{{ amount }}
            </div>
            <div :class="['amount-item', 'custom', { active: isCustom }]">
              <el-input 
                v-model="customAmount" 
                placeholder="自定义"
                @focus="isCustom = true; selectedAmount = 0"
                @input="handleCustomInput"
              />
            </div>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="payment-section">
          <span class="label">选择支付方式</span>
          <div class="payment-options">
            <div 
              :class="['payment-item', { active: paymentMethod === 'alipay' }]"
              @click="paymentMethod = 'alipay'"
            >
              <img src="../assets/支付宝支付.png" alt="支付宝" class="pay-icon" />
              <span>支付宝</span>
            </div>
          </div>
        </div>

        <!-- 充值按钮 -->
        <el-button 
          type="primary" 
          size="large" 
          class="recharge-btn"
          :loading="loading"
          :disabled="!canRecharge"
          @click="handleRecharge"
        >
          立即充值 ¥{{ rechargeAmount }}
        </el-button>

        <!-- 充值说明 -->
        <div class="tips">
          <p>充值说明：</p>
          <ul>
            <li>充值金额将实时到账</li>
            <li>充值后可在校园商城消费</li>
            <li>支持支付宝支付</li>
            <li>如有问题请联系客服</li>
          </ul>
        </div>
      </div>

      <!-- 充值记录 -->
      <div class="record-card" v-if="rechargeRecords.length > 0">
        <h3>充值记录</h3>
        <el-table :data="rechargeRecords" stripe>
          <el-table-column prop="create_time" label="时间" width="180" />
          <el-table-column prop="amount" label="充值金额" width="120">
            <template #default="scope">
              <span class="recharge-amount">+¥{{ scope.row.amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payment_method" label="支付方式" width="120">
            <template #default="scope">
              支付宝
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'success' ? 'success' : 'warning'">
                {{ scope.row.status === 'success' ? '成功' : '处理中' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import Header from '@/components/Header.vue'

const router = useRouter()
const currentBalance = ref(0)
const selectedAmount = ref(50)
const customAmount = ref('')
const isCustom = ref(false)
const paymentMethod = ref('alipay')
const loading = ref(false)
const paying = ref(false)
const rechargeRecords = ref([])
const currentRecordId = ref(null)

const presetAmounts = [10, 20, 50, 100, 200, 500]

const rechargeAmount = computed(() => {
  if (isCustom.value && customAmount.value) {
    return parseFloat(customAmount.value) || 0
  }
  return selectedAmount.value
})

const canRecharge = computed(() => {
  return rechargeAmount.value > 0 && rechargeAmount.value <= 10000
})

const handleCustomInput = (value) => {
  // 只允许输入数字和小数点
  const num = value.replace(/[^\d.]/g, '')
  customAmount.value = num
}

const fetchBalance = async () => {
  try {
    const response = await axios.get('/api/user/balance/')
    if (response.data.code === 200) {
      currentBalance.value = response.data.data.balance
    }
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}

const fetchRechargeRecords = async () => {
  try {
    const response = await axios.get('/api/user/recharge/records/')
    if (response.data.code === 200) {
      rechargeRecords.value = response.data.data
    }
  } catch (error) {
    console.error('获取充值记录失败:', error)
  }
}

const handleRecharge = async () => {
  if (!canRecharge.value) {
    ElMessage.warning('请输入有效的充值金额')
    return
  }

  loading.value = true
  try {
    const response = await axios.post('/api/user/recharge/', {
      amount: rechargeAmount.value,
      payment_method: paymentMethod.value,
      payment_type: 'pc'  // 电脑网站支付
    })

    if (response.data.code === 200) {
      // 保存充值记录ID
      currentRecordId.value = response.data.data.record_id
      
      // 获取支付宝支付URL
      const payUrl = response.data.data.pay_url
      
      if (payUrl) {
        // 在新窗口打开支付宝支付页面
        window.open(payUrl, '_blank')
        
        // 开始轮询充值状态
        startRechargePolling(currentRecordId.value)
      } else {
        ElMessage.error('获取支付链接失败')
      }
    } else {
      ElMessage.error(response.data.message || '充值失败')
    }
  } catch (error) {
    console.error('充值失败:', error)
    ElMessage.error(error.response?.data?.message || '充值失败，请重试')
  } finally {
    loading.value = false
  }
}

// 充值状态轮询
let rechargePollingTimer = null

const startRechargePolling = (recordId) => {
  // 清除之前的轮询
  if (rechargePollingTimer) {
    clearInterval(rechargePollingTimer)
  }
  
  ElMessage.info('正在等待支付结果，请稍候...')
  
  // 每3秒查询一次充值状态
  rechargePollingTimer = setInterval(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/user/recharge/${recordId}/payment-status/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.data.code === 200) {
        const status = response.data.data.status
        const alipayStatus = response.data.data.alipay_status
        
        // 如果后端显示充值成功，停止轮询并刷新页面
        if (status === 'success') {
          clearInterval(rechargePollingTimer)
          rechargePollingTimer = null
          ElMessage.success('充值成功')
          await fetchBalance()
          await fetchRechargeRecords()
          
          // 重置表单
          selectedAmount.value = 50
          customAmount.value = ''
          isCustom.value = false
          currentRecordId.value = null
          return
        }
        
        // 如果支付宝显示已关闭（超时），停止轮询
        if (alipayStatus === 'closed') {
          clearInterval(rechargePollingTimer)
          rechargePollingTimer = null
          ElMessage.warning('支付已超时，订单已关闭')
          currentRecordId.value = null
          return
        }
      }
    } catch (error) {
      console.error('查询充值状态失败:', error)
    }
  }, 3000)
  
  // 最多轮询5分钟，超时后停止
  setTimeout(() => {
    if (rechargePollingTimer) {
      clearInterval(rechargePollingTimer)
      rechargePollingTimer = null
      ElMessage.warning('支付轮询超时，请手动刷新页面查看')
    }
  }, 300000)
}



onMounted(() => {
  fetchBalance()
  fetchRechargeRecords()
})

onUnmounted(() => {
  // 组件卸载时清除轮询定时器
  if (rechargePollingTimer) {
    clearInterval(rechargePollingTimer)
    rechargePollingTimer = null
  }
})
</script>

<style scoped>
.recharge-page {
  min-height: 100vh;
  background-color: #fff7ed;
  padding-bottom: 40px;
}

.recharge-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.recharge-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.balance-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  border-radius: 12px;
  margin-bottom: 30px;
  color: #fff;
}

.balance-section .label {
  font-size: 16px;
  opacity: 0.9;
}

.balance-section .balance {
  font-size: 32px;
  font-weight: bold;
}

.label {
  display: block;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.amount-section {
  margin-bottom: 30px;
}

.amount-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.amount-item {
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 18px;
  font-weight: 500;
}

.amount-item:hover {
  border-color: #ea580c;
}

.amount-item.active {
  border-color: #ea580c;
  background: #fff7ed;
  color: #ea580c;
}

.amount-item.custom {
  padding: 8px;
}

.amount-item.custom :deep(.el-input__inner) {
  text-align: center;
  font-size: 16px;
}

.payment-section {
  margin-bottom: 30px;
}

.payment-options {
  display: flex;
  gap: 20px;
}

.payment-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.payment-item:hover {
  border-color: #ea580c;
}

.payment-item.active {
  border-color: #ea580c;
  background: #fff7ed;
}

.pay-icon {
  width: 30px;
  height: 30px;
}

.recharge-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  margin-bottom: 30px;
  background-color: #ea580c !important;
  border-color: #ea580c !important;
  border-radius: 20px !important;
}

.tips {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.tips p {
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.tips li {
  margin-bottom: 5px;
}

.record-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.record-card h3 {
  margin-bottom: 20px;
  color: #333;
}

.recharge-amount {
  color: #67c23a;
  font-weight: bold;
}

@media (max-width: 768px) {
  .amount-options {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .payment-options {
    flex-direction: column;
  }
}
</style>
