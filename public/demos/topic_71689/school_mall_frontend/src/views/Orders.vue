<template>
  <div class="orders-page">
    <Header />
    <div class="container">
      <div class="orders-content">
        <div class="page-header">
          <h1>我的订单</h1>
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部订单" name="all"></el-tab-pane>
            <el-tab-pane label="待付款" name="pending"></el-tab-pane>
            <el-tab-pane label="支付成功" name="success"></el-tab-pane>
            <el-tab-pane label="已退款" name="refunded"></el-tab-pane>
          </el-tabs>
        </div>

        <div v-loading="loading" class="order-list">
          <el-empty v-if="filteredOrders.length === 0" description="暂无订单" />
          
          <div v-for="order in filteredOrders" :key="order.id" class="order-item">
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="header-left">
                <span class="create-time">{{ formatDate(order.create_time) }}</span>
                <span class="order-no">订单号: {{ order.order_no }}</span>
                <span class="shop-info">
                  <span class="shop-name">校园小卖铺</span>
                  <el-icon class="chat-icon"><ChatDotRound /></el-icon>
                </span>
              </div>
              <div class="header-right">
                <span :class="['status-text', getStatusClass(order.payment_status)]">
                  {{ getStatusLabel(order.payment_status) }}
                </span>
                <span v-if="order.payment_status !== 1" class="status-hint">(退款需先支付成功)</span>
                <el-tag v-if="order.refund_status === 0" type="warning" size="small" class="refund-status-tag">退款审核中</el-tag>
                <el-tag v-else-if="order.refund_status === 1" type="success" size="small" class="refund-status-tag">退款已通过</el-tag>
                <el-tag v-else-if="order.refund_status === 2" type="danger" size="small" class="refund-status-tag">退款已拒绝</el-tag>
                <el-divider direction="vertical" />
                <el-icon class="delete-icon" @click="handleDeleteOrder(order.id)"><Delete /></el-icon>
              </div>
            </div>

            <!-- 订单主体 -->
            <div class="order-body">
              <!-- 商品列表 -->
              <div class="product-list">
                <div v-for="(item, index) in order.product_info" :key="index" class="product-item">
                  <div class="product-info-box">
                    <el-image 
                      :src="item.product_image || 'https://via.placeholder.com/80'" 
                      class="product-img"
                      fit="cover"
                    >
                      <template #error>
                        <div class="image-slot">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="product-detail">
                      <h4 class="product-name" @click="goToProduct(item.product_id)">{{ item.product_name }}</h4>
                      <p class="product-desc">官方正品 | 校园直供</p>
                      <div class="product-tags">
                        <span class="tag">不支持7天无理由</span>
                      </div>
                      <div class="product-actions-inline">
                        <el-button link type="primary" size="small" @click="handleAddToCart(item)">加入购物车</el-button>
                        <el-button v-if="order.payment_status === 1" link type="warning" size="small" @click="openReviewDialog(item)">评价</el-button>
                        <el-button v-if="order.payment_status === 1" link type="danger" size="small" @click="handleRefund(order)">退款/退货</el-button>
                        <el-button v-if="order.payment_status >= 1" link type="info" size="small" @click="viewLogistics(order)">查看物流</el-button>
                      </div>
                    </div>
                  </div>
                  <div class="product-price-qty">
                    <div class="price">¥{{ parseFloat(item.price).toFixed(2) }}</div>
                    <div class="quantity">x{{ item.quantity }}</div>
                    <div v-if="order.payment_status === 2" class="refund-label">退款成功</div>
                  </div>
                </div>
              </div>

              <!-- 订单总价 -->
              <div class="order-total">
                <div class="actual-pay">
                  <span class="label">实付款</span>
                  <span class="price">¥{{ parseFloat(order.actual_price).toFixed(2) }}</span>
                </div>
                <!-- <div class="shipping">含运费: ¥0.00</div>
                <div class="mobile-tag">手机订单</div> -->
              </div>

              <!-- 订单操作 -->
              <div class="order-actions">
                <template v-if="order.payment_status === 0">
                  <el-button type="primary" class="btn-main" @click="handlePay(order)">立即付款</el-button>
                  <el-button link size="small" @click="handleCancelOrder(order.id)">取消订单</el-button>
                </template>
                <template v-else-if="order.payment_status === 1">
                  <el-button type="warning" class="btn-main" @click="handleBuyAgain(order)">再买一单</el-button>
                  <el-button link size="small" @click="handleAddToCartBatch(order)">全部加入购物车</el-button>
                </template>
                <template v-else>
                  <el-button type="info" class="btn-main" @click="handleBuyAgain(order)">重新购买</el-button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 评价弹窗 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="商品评价"
      width="500px"
      destroy-on-close
    >
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.rating" show-score />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input
            v-model="reviewForm.content"
            type="textarea"
            rows="4"
            placeholder="请输入您对商品的评价..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submittingReview" @click="submitReview">
            提交评价
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 退款申请弹窗 -->
    <el-dialog
      v-model="refundDialogVisible"
      title="申请退款"
      width="500px"
      destroy-on-close
    >
      <div class="refund-info">
        <p><strong>订单号:</strong> {{ currentRefundOrder?.order_no }}</p>
        <p><strong>退款金额:</strong> <span class="refund-amount">¥{{ parseFloat(currentRefundOrder?.actual_price || 0).toFixed(2) }}</span></p>
      </div>
      <el-form label-width="100px" class="mt-20">
        <el-form-item label="退款原因" required>
          <el-input
            v-model="refundReason"
            type="textarea"
            rows="4"
            placeholder="请输入退款原因..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="warning" :loading="submittingRefund" @click="submitRefund">
            提交申请
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看物流弹窗 -->
    <el-dialog
      v-model="logisticsDialogVisible"
      title="物流详情"
      width="600px"
      destroy-on-close
    >
      <div v-if="currentLogistics" class="logistics-detail">
        <div class="logistics-header">
          <p><strong>订单号：</strong>{{ currentLogistics.order_no }}</p>
          <p v-if="currentLogistics.logistics_no"><strong>物流单号：</strong>{{ currentLogistics.logistics_no }}</p>
        </div>
        <el-timeline v-if="currentLogistics.logistics_status && currentLogistics.logistics_status.length > 0">
          <el-timeline-item
            v-for="(item, index) in currentLogistics.logistics_status"
            :key="index"
            :type="index === 0 ? 'primary' : ''"
            :color="index === 0 ? '#0bbd87' : ''"
            :timestamp="item.time"
          >
            <div class="logistics-item">
              <p class="status">{{ item.status }}</p>
              <p v-if="item.location" class="location"><el-icon><Location /></el-icon> {{ item.location }}</p>
              <p v-if="item.remark" class="remark">备注：{{ item.remark }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无物流信息" />
      </div>
      <div v-else class="logistics-detail">
        <el-empty description="暂无物流信息" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Delete, Picture, Location } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'

const router = useRouter()
const loading = ref(false)
const orders = ref([])
const activeTab = ref('all')

// 评价相关
const reviewDialogVisible = ref(false)
const submittingReview = ref(false)
const currentReviewItem = ref(null)
const reviewForm = ref({
  rating: 5,
  content: ''
})

const openReviewDialog = (item) => {
  currentReviewItem.value = item
  reviewForm.value = {
    rating: 5,
    content: ''
  }
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (!reviewForm.value.content.trim()) {
    ElMessage.warning('请输入评价内容')
    return
  }
  
  submittingReview.value = true
  const token = localStorage.getItem('token')
  try {
    const res = await axios.post(`http://localhost:8000/api/product/${currentReviewItem.value.product_id}/review/`, {
      rating: reviewForm.value.rating,
      content: reviewForm.value.content
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.data.code === 201) {
      ElMessage.success('评价成功')
      reviewDialogVisible.value = false
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '评价失败')
  } finally {
    submittingReview.value = false
  }
}

const fetchOrders = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  try {
    const res = await axios.get('http://localhost:8000/api/order/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.code === 200) {
      orders.value = res.data.data
    }
  } catch (error) {
    console.error('获取订单失败:', error)
    ElMessage.error('获取订单失败')
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  const statusMap = {
    pending: 0,
    success: 1,
    refunded: 2
  }
  return orders.value.filter(order => order.payment_status === statusMap[activeTab.value])
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getStatusLabel = (status) => {
  const labels = {
    0: '等待付款',
    1: '交易成功',
    2: '交易关闭' // 退款后显示交易关闭
  }
  return labels[status] || '未知状态'
}

const getStatusClass = (status) => {
  const classes = {
    0: 'status-pending',
    1: 'status-success',
    2: 'status-closed'
  }
  return classes[status] || ''
}

const handleTabChange = () => {
  // 切换页签逻辑
}

const goToProduct = (id) => {
  router.push(`/product/${id}`)
}

const handleAddToCart = async (product) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    const res = await axios.post('http://localhost:8000/api/order/cart/', {
      product: product.product_id,
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.code === 201) {
      ElMessage.success('已加入购物车')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '加入购物车失败')
  }
}

const handleAddToCartBatch = async (order) => {
  try {
    for (const item of order.product_info) {
      await handleAddToCart(item)
    }
    ElMessage.success('全部商品已加入购物车')
  } catch (error) {
    console.error('批量加入购物车失败:', error)
  }
}

const handleBuyAgain = (order) => {
  if (order.product_info.length > 0) {
    goToProduct(order.product_info[0].product_id)
  }
}

const handlePay = (order) => {
  // 弹出支付方式选择
  ElMessageBox.confirm(`订单金额 ¥${order.actual_price}，请选择支付方式`, '选择支付方式', {
    confirmButtonText: '支付宝支付',
    cancelButtonText: '校园卡支付',
    distinguishCancelAndClose: true,
    type: 'info'
  }).then(() => {
    // 用户选择支付宝支付
    doPay(order, 1)
  }).catch((action) => {
    if (action === 'cancel') {
      // 用户选择校园卡支付
      doPay(order, 2)
    }
  })
}

const doPay = async (order, paymentMethod) => {
  const token = localStorage.getItem('token')
  
  if (paymentMethod === 1) {
    // 支付宝支付
    try {
      const res = await axios.post('http://localhost:8000/api/order/payment/', {
        order_id: order.id,
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data.code === 200) {
        const payUrl = res.data.data.pay_url
        
        if (payUrl) {
          window.open(payUrl, '_blank')
          startPaymentPolling(order.id)
        } else {
          ElMessage.error('获取支付链接失败')
        }
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '获取支付链接失败')
    }
  } else {
    // 校园卡支付
    ElMessageBox.confirm(`确认使用校园卡支付 ¥${order.actual_price} 吗？`, '确认支付', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'success'
    }).then(async () => {
      try {
        const res = await axios.post('http://localhost:8000/api/order/payment/', {
          order_id: order.id,
          payment_method: paymentMethod
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.code === 200) {
          ElMessage.success('支付成功')
          fetchOrders()
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '支付失败')
      }
    }).catch(() => {})
  }
}

// 支付状态轮询
let paymentPollingTimer = null

const startPaymentPolling = (orderId) => {
  // 清除之前的轮询
  if (paymentPollingTimer) {
    clearInterval(paymentPollingTimer)
  }
  
  ElMessage.info('正在等待支付结果，请稍候...')
  
  // 每3秒查询一次支付状态
  paymentPollingTimer = setInterval(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`http://localhost:8000/api/order/${orderId}/payment-status/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data.code === 200) {
        const paymentStatus = res.data.data.payment_status
        const alipayStatus = res.data.data.alipay_status
        
        // 如果后端显示已支付，停止轮询并刷新订单
        if (paymentStatus === 1) {
          clearInterval(paymentPollingTimer)
          paymentPollingTimer = null
          ElMessage.success('支付成功')
          fetchOrders()
          return
        }
        
        // 如果支付宝显示已关闭（超时），停止轮询
        if (alipayStatus === 'closed') {
          clearInterval(paymentPollingTimer)
          paymentPollingTimer = null
          ElMessage.warning('支付已超时，订单已关闭')
          fetchOrders()
          return
        }
      }
    } catch (error) {
      console.error('查询支付状态失败:', error)
    }
  }, 3000)
  
  // 最多轮询5分钟（100次），超时后停止
  setTimeout(() => {
    if (paymentPollingTimer) {
      clearInterval(paymentPollingTimer)
      paymentPollingTimer = null
      ElMessage.warning('支付轮询超时，请手动刷新订单查看')
    }
  }, 300000)
}

const refundReason = ref('')
const refundDialogVisible = ref(false)
const currentRefundOrder = ref(null)
const submittingRefund = ref(false)

// 物流相关
const logisticsDialogVisible = ref(false)
const currentLogistics = ref(null)

const handleRefund = async (order) => {
  console.log('点击退款按钮，订单信息:', order)
  if (!order || !order.id) {
    ElMessage.error('订单信息异常')
    return
  }
  
  // 先检查是否有待处理的退款申请
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get(`http://localhost:8000/api/order/${order.id}/refund-status/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.code === 200) {
      const apps = res.data.data.refund_applications
      const pendingApp = apps.find(app => app.status === 0)
      if (pendingApp) {
        ElMessage.warning(`该订单已有待审核的退款申请，请耐心等待商户审核`)
        return
      }
    }
  } catch (error) {
    console.error('检查退款状态失败:', error)
  }
  
  currentRefundOrder.value = order
  refundReason.value = ''
  refundDialogVisible.value = true
}

const submitRefund = async () => {
  if (!refundReason.value.trim()) {
    ElMessage.warning('请输入退款原因')
    return
  }

  submittingRefund.value = true
  const token = localStorage.getItem('token')
  try {
    const res = await axios.post(`http://localhost:8000/api/order/${currentRefundOrder.value.id}/refund/`, {
      reason: refundReason.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.code === 200) {
      ElMessage.success('退款申请已提交，等待商户审核')
      refundDialogVisible.value = false
      fetchOrders()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '退款申请失败')
  } finally {
    submittingRefund.value = false
  }
}

// 查看物流
const viewLogistics = async (order) => {
  currentLogistics.value = null
  logisticsDialogVisible.value = true
  const token = localStorage.getItem('token')

  try {
    const res = await axios.get(`http://localhost:8000/api/order/${order.id}/logistics/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.code === 200) {
      currentLogistics.value = res.data.data
    }
  } catch (error) {
    console.error('获取物流信息失败:', error)
    if (error.response?.status !== 404) {
      ElMessage.error(error.response?.data?.message || '获取物流信息失败')
    }
  }
}

const handleCancelOrder = (id) => {
  ElMessageBox.confirm('确定要取消该订单吗？取消后订单将被删除', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.delete(`/api/order/${id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      
      if (response.data.code === 200) {
        ElMessage.success('订单取消成功')
        // 刷新订单列表
        fetchOrders()
      } else {
        ElMessage.error(response.data.message || '取消失败')
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      ElMessage.error(error.response?.data?.message || '取消订单失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

const handleDeleteOrder = (orderId) => {
  ElMessageBox.confirm('确定要删除该订单记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.delete(`/api/order/${orderId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      
      if (response.data.code === 200) {
        ElMessage.success('订单删除成功')
        // 刷新订单列表
        fetchOrders()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除订单失败:', error)
      ElMessage.error(error.response?.data?.message || '删除订单失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchOrders()
})

onUnmounted(() => {
  // 组件卸载时清除轮询定时器
  if (paymentPollingTimer) {
    clearInterval(paymentPollingTimer)
    paymentPollingTimer = null
  }
})
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background-color: #fff7ed;
  padding-bottom: 50px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.orders-content {
  margin-top: 20px;
}

.page-header {
  background: #fff;
  padding: 20px 20px 0;
  border-radius: 8px 8px 0 0;
}

.page-header h1 {
  font-size: 18px;
  margin: 0 0 15px;
  color: #333;
}

.order-list {
  margin-top: 15px;
}

.order-item {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}

.order-header {
  background-color: #f5f5f5;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.create-time {
  font-weight: 500;
  color: #333;
}

.shop-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shop-name {
  color: #ea580c;
  font-weight: bold;
}

.chat-icon {
  color: #1890ff;
  cursor: pointer;
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.status-text {
  font-weight: bold;
}

.status-pending { color: #ea580c; }
.status-success { color: #67c23a; }
.status-closed { color: #999; }

.status-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  font-weight: normal;
}

.refund-status-tag {
  margin-left: 8px;
}

.delete-icon {
  cursor: pointer;
  font-size: 16px;
  color: #999;
}

.delete-icon:hover {
  color: #ea580c;
}

.order-body {
  display: flex;
  padding: 20px 0;
}

.product-list {
  flex: 3;
  border-right: 1px solid #f2f2f2;
}

.product-item {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 20px;
}

.product-item:last-child {
  margin-bottom: 0;
}

.product-info-box {
  display: flex;
  gap: 15px;
}

.product-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #eee;
  flex-shrink: 0;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.product-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-size: 13px;
  color: #333;
  margin: 0;
  line-height: 1.5;
  cursor: pointer;
  max-width: 300px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-name:hover {
  color: #ea580c;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.product-tags {
  display: flex;
  gap: 5px;
  margin-top: 2px;
}

.product-tags .tag {
  font-size: 11px;
  color: #999;
  border: 1px solid #eee;
  padding: 0 4px;
  border-radius: 2px;
}

.product-actions-inline {
  margin-top: 5px;
}

.product-price-qty {
  text-align: right;
  min-width: 100px;
}

.price {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.quantity {
  color: #999;
  font-size: 12px;
}

.refund-label {
  color: #ff5000;
  font-size: 12px;
  margin-top: 5px;
}

.order-total {
  flex: 1;
  border-right: 1px solid #f2f2f2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
}

.actual-pay {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.actual-pay .label {
  font-size: 12px;
  color: #333;
}

.actual-pay .price {
  font-size: 16px;
  font-weight: bold;
  margin-top: 4px;
}

.shipping {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.mobile-tag {
  margin-top: 10px;
  font-size: 11px;
  color: #666;
  border: 1px solid #ddd;
  padding: 1px 6px;
  border-radius: 3px;
}

.order-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 15px;
}

.btn-main {
  width: 90px;
  height: 32px;
  padding: 0;
  font-size: 13px;
}

.btn-main.el-button--primary {
  background-color: #ea580c;
  border-color: #ea580c;
  border-radius: 20px;
}

.btn-main.el-button--primary:hover {
  background-color: #c2410c;
  border-color: #c2410c;
}

.btn-main.el-button--warning {
  background-color: #ea580c;
  border-color: #ea580c;
  color: #fff;
  border-radius: 20px;
}

.btn-main.el-button--warning:hover {
  background-color: #c2410c;
  border-color: #c2410c;
}

.refund-info {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.refund-info p {
  margin: 10px 0;
  font-size: 14px;
}

.refund-amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.mt-20 {
  margin-top: 20px;
}

.logistics-detail {
  padding: 10px;
}

.logistics-header {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.logistics-header p {
  margin: 5px 0;
}

.logistics-item {
  padding: 5px 0;
}

.logistics-item .status {
  font-weight: bold;
  color: #303133;
  margin: 0 0 5px 0;
}

.logistics-item .location {
  color: #409eff;
  margin: 0 0 5px 0;
  font-size: 13px;
}

.logistics-item .remark {
  color: #909399;
  margin: 0;
  font-size: 12px;
}
</style>
