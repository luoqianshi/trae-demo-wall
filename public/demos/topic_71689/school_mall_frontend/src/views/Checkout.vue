<template>
  <div class="checkout-page" v-loading="loading">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/cart' }">购物车</el-breadcrumb-item>
        <el-breadcrumb-item>确认订单</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="checkout-content">
        <!-- 收货地址 -->
        <div class="section address-section">
          <h3 class="section-title">收货地址</h3>
          <div v-if="addresses.length > 0" class="address-list">
            <div 
              v-for="addr in addresses" 
              :key="addr.id" 
              class="address-item" 
              :class="{ active: selectedAddressId === addr.id }"
              @click="selectedAddressId = addr.id"
            >
              <div class="addr-header">
                <span class="name">{{ addr.receiver }}</span>
                <span class="phone">{{ addr.phone }}</span>
                <el-tag v-if="addr.is_default" size="small" type="danger">默认</el-tag>
              </div>
              <div class="addr-detail">
                {{ addr.address }}
              </div>
            </div>
          </div>
          <div v-else class="no-address">
            <el-button type="primary" link @click="$router.push('/profile')">去添加收货地址</el-button>
          </div>
        </div>

        <!-- 商品清单 -->
        <div class="section product-section">
          <h3 class="section-title">商品清单</h3>
          <div class="product-list">
            <div v-for="item in selectedItems" :key="item.id" class="product-item">
              <el-image :src="item.product_detail.product_images[0]" class="product-img" fit="cover" />
              <div class="product-info">
                <h4 class="name">{{ item.product_detail.product_name }}</h4>
                <div class="price-qty">
                  <span class="price">¥{{ item.product_detail.price }}</span>
                  <span class="qty">x {{ item.quantity }}</span>
                </div>
              </div>
              <div class="item-total">
                ¥{{ (item.product_detail.price * item.quantity).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="section payment-section">
          <h3 class="section-title">支付方式</h3>
          <el-radio-group v-model="paymentMethod" class="payment-group">
            <el-radio :label="2" border class="payment-radio">
              <img src="../assets/电子校园卡.png" class="pay-icon" />
              校园卡支付
              <span class="balance-tag">余额: ¥{{ userBalance.toFixed(2) }}</span>
            </el-radio>
            <el-radio :label="3" border class="payment-radio">
              <img src="../assets/支付宝支付.png" class="pay-icon" />
              支付宝
            </el-radio>
          </el-radio-group>
          <div v-if="paymentMethod === 2 && userBalance < finalPrice" class="balance-warning">
            <el-alert type="warning" :closable="false" show-icon>
              <template #title>
                余额不足，当前余额 ¥{{ userBalance.toFixed(2) }}，还需 ¥{{ (finalPrice - userBalance).toFixed(2) }}
              </template>
            </el-alert>
          </div>
        </div>

        <!-- 优惠券选择 -->
        <div class="section coupon-section">
          <h3 class="section-title">使用优惠券</h3>
          <div v-if="filteredCoupons.length > 0" class="coupon-selector">
            <el-select v-model="selectedCouponId" placeholder="选择优惠券" clearable class="coupon-select">
              <el-option
                v-for="item in filteredCoupons"
                :key="item.id"
                :label="getCouponLabel(item)"
                :value="item.id"
                :disabled="totalPrice < parseFloat(item.coupon_condition)"
              />
            </el-select>
            <span v-if="selectedCoupon" class="coupon-tip">
              已优惠 ¥{{ couponDiscount.toFixed(2) }}
            </span>
          </div>
          <div v-else class="no-coupon">
            <span class="tip">暂无可用优惠券</span>
          </div>
        </div>

        <!-- 订单备注 -->
        <div class="section remark-section">
          <h3 class="section-title">订单备注</h3>
          <el-input
            v-model="remark"
            type="textarea"
            placeholder="有什么想对商家说的..."
            :rows="2"
          />
        </div>

        <!-- 结算汇总 -->
        <div class="summary-section">
          <div class="summary-item">
            <span>商品总额：</span>
            <span class="val">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>运费：</span>
            <span class="val">¥0.00</span>
          </div>
          <div v-if="couponDiscount > 0" class="summary-item">
            <span>优惠金额：</span>
            <span class="val">-¥{{ couponDiscount.toFixed(2) }}</span>
          </div>
          <div class="total-price">
            <span>应付总额：</span>
            <span class="val">¥{{ finalPrice.toFixed(2) }}</span>
          </div>
          <div class="actions">
            <el-button size="large" @click="$router.back()">返回购物车</el-button>
            <el-button type="primary" size="large" class="pay-btn" @click="handleConfirmPay" :loading="paying">
              确认支付
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付成功弹窗 -->
    <el-dialog
      v-model="successVisible"
      title="支付成功"
      width="400px"
      center
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="pay-success-content">
        <el-icon color="#67C23A" size="64px"><CircleCheckFilled /></el-icon>
        <p class="msg">订单支付成功！</p>
        <p class="sub-msg">我们将尽快为您发货</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="goToOrders">查看订单</el-button>
        <el-button @click="$router.push('/')">回到首页</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const paying = ref(false)
const successVisible = ref(false)

const addresses = ref([])
const selectedAddressId = ref(null)
const selectedItems = ref([])
const paymentMethod = ref(2)  // 默认校园卡支付
const remark = ref('')
const userBalance = ref(0)  // 用户余额

const availableCoupons = ref([])
const selectedCouponId = ref(null)

const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + (item.product_detail.price * item.quantity)
  }, 0)
})

const filteredCoupons = computed(() => {
  return availableCoupons.value.filter(item => {
    const now = new Date()
    const endTime = new Date(item.coupon_end_time) // 使用序列化后的字段名
    return endTime > now
  })
})

const selectedCoupon = computed(() => {
  return availableCoupons.value.find(item => item.id === selectedCouponId.value)
})

const couponDiscount = computed(() => {
  if (!selectedCoupon.value) return 0
  const type = selectedCoupon.value.coupon_type
  const value = selectedCoupon.value.coupon_value
  if (type === 1 || type === 3) { // 满减或无门槛
    return parseFloat(value)
  } else if (type === 2) { // 折扣
    return totalPrice.value * (1 - parseFloat(value) / 10)
  }
  return 0
})

const finalPrice = computed(() => {
  const price = totalPrice.value - couponDiscount.value
  return price > 0 ? price : 0
})

const getCouponLabel = (item) => {
  const condition = parseFloat(item.coupon_condition) > 0 ? `满${parseFloat(item.coupon_condition)}` : '无门槛'
  const valueStr = item.coupon_type === 2 ? `${parseFloat(item.coupon_value)}折` : `¥${parseFloat(item.coupon_value)}`
  return `${item.coupon_name} (${condition}${valueStr})`
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    // 1. 获取地址列表
    const addrRes = await axios.get('/api/student/address/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (addrRes.data.code === 200) {
      addresses.value = addrRes.data.data
      const defaultAddr = addresses.value.find(a => a.is_default)
      if (defaultAddr) {
        selectedAddressId.value = defaultAddr.id
      } else if (addresses.value.length > 0) {
        selectedAddressId.value = addresses.value[0].id
      }
    }

    // 2. 获取购物车中选中的商品
    const cartRes = await axios.get('/api/order/cart/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (cartRes.data.code === 200) {
      selectedItems.value = cartRes.data.data.filter(item => item.is_selected === 1)
      if (selectedItems.value.length === 0) {
        ElMessage.warning('没有选中的商品，请先去购物车选择')
        router.push('/cart')
      }
    }

    // 3. 获取可用优惠券
    const couponRes = await axios.get('/api/coupon/user/list/', {
      params: { status: 1 },
      headers: { Authorization: `Bearer ${token}` }
    })
    if (couponRes.data.code === 200) {
      availableCoupons.value = couponRes.data.data
    }

    // 4. 获取用户余额
    const balanceRes = await axios.get('/api/user/balance/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (balanceRes.data.code === 200) {
      userBalance.value = balanceRes.data.data.balance
    }
  } catch (error) {
    console.error('获取结算数据失败:', error)
    ElMessage.error('获取结算数据失败')
  } finally {
    loading.value = false
  }
}

// 确认支付
const handleConfirmPay = async () => {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  // 校园卡支付余额检查
  if (paymentMethod.value === 2 && userBalance.value < finalPrice.value) {
    ElMessage.warning(`余额不足，当前余额: ¥${userBalance.value.toFixed(2)}`)
    return
  }

  paying.value = true
  const token = localStorage.getItem('token')

  try {
    // 1. 创建订单
    const product_info = selectedItems.value.map(item => ({
      product_id: item.product_detail.id,
      product_name: item.product_detail.product_name,
      product_image: item.product_detail.product_images?.[0] || '',
      price: item.product_detail.price,
      quantity: item.quantity
    }))

    const orderRes = await axios.post('/api/order/', {
      product_info,
      payment_method: paymentMethod.value,
      address_id: selectedAddressId.value,
      remark: remark.value,
      user_coupon_id: selectedCouponId.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (orderRes.data.code === 201) {
      const orderId = orderRes.data.data.order_id

      // 2. 根据支付方式处理
      if (paymentMethod.value === 3) {
        // 支付宝支付
        await handleAlipay(orderId)
      } else {
        // 微信支付/校园卡支付 - 模拟支付
        const payRes = await axios.post('/api/order/payment/', {
          order_id: orderId,
          payment_method: paymentMethod.value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (payRes.data.code === 200) {
          // 更新余额（如果是校园卡支付）
          if (paymentMethod.value === 2 && payRes.data.data.balance !== undefined) {
            userBalance.value = payRes.data.data.balance
          }
          successVisible.value = true
        } else {
          ElMessage.error(payRes.data.message || '支付处理失败')
        }
      }
    } else {
      ElMessage.error(orderRes.data.message || '订单创建失败')
    }
  } catch (error) {
    console.error('结算流程异常:', error)
    ElMessage.error(error.response?.data?.message || '结算失败，请稍后再试')
  } finally {
    paying.value = false
  }
}

// 支付宝支付处理
const handleAlipay = async (orderId) => {
  const token = localStorage.getItem('token')

  try {
    // 调用支付宝支付接口
    const res = await axios.post('/api/order/alipay/pay/', {
      order_id: orderId,
      payment_type: 'pc'  // pc: 电脑网站支付, wap: 手机网站支付
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.data.code === 200) {
      // 获取支付URL并跳转
      const payUrl = res.data.data.pay_url

      // 在新窗口打开支付宝支付页面
      window.open(payUrl, '_blank')

      // 显示支付确认弹窗
      ElMessageBox.confirm(
        '是否已完成支付？',
        '支付宝支付',
        {
          confirmButtonText: '已完成支付',
          cancelButtonText: '支付遇到问题',
          type: 'info',
          closeOnClickModal: false,
          closeOnPressEscape: false,
        }
      ).then(() => {
        // 用户点击已完成支付，查询支付状态
        checkAlipayStatus(orderId)
      }).catch(() => {
        // 用户点击支付遇到问题
        ElMessage.info('如已支付成功，请稍后查看订单状态')
        router.push('/orders')
      })
    } else {
      ElMessage.error(res.data.message || '创建支付订单失败')
    }
  } catch (error) {
    console.error('支付宝支付异常:', error)
    ElMessage.error('支付宝支付初始化失败')
  }
}

// 查询支付宝支付状态
const checkAlipayStatus = async (orderId) => {
  const token = localStorage.getItem('token')

  try {
    const res = await axios.get('/api/order/alipay/query/', {
      params: { order_id: orderId },
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.data.code === 200) {
      if (res.data.data.payment_status === 1) {
        // 支付成功
        successVisible.value = true
      } else {
        // 未支付成功
        ElMessage.warning('订单尚未支付成功，请稍后查看')
        router.push('/orders')
      }
    } else {
      ElMessage.error('查询支付状态失败')
      router.push('/orders')
    }
  } catch (error) {
    console.error('查询支付状态异常:', error)
    ElMessage.error('查询支付状态失败')
    router.push('/orders')
  }
}

const goToOrders = () => {
  router.push('/orders')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background-color: #fff7ed;
  padding: 20px 0 50px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.checkout-content {
  margin-top: 20px;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 20px;
  color: #333;
  border-left: 4px solid #ea580c;
  padding-left: 10px;
}

/* 地址样式 */
.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.address-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.address-item:hover {
  border-color: #ea580c;
}

.address-item.active {
  border-color: #ea580c;
  background-color: #fff7ed;
  position: relative;
}

.address-item.active::after {
  content: '✓';
  position: absolute;
  right: 0;
  bottom: 0;
  background: #ea580c;
  color: #fff;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  border-radius: 6px 0 0 0;
}

.addr-header {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.addr-header .name {
  font-weight: bold;
  font-size: 15px;
}

.addr-header .phone {
  color: #666;
}

.addr-detail {
  font-size: 13px;
  color: #888;
  line-height: 1.4;
}

/* 商品清单样式 */
.product-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.product-item:last-child {
  border-bottom: none;
}

.product-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  margin-right: 15px;
}

.product-info {
  flex: 1;
}

.product-info .name {
  font-size: 14px;
  margin: 0 0 5px;
  color: #333;
}

.price-qty {
  font-size: 13px;
  color: #999;
}

.price-qty .price {
  margin-right: 15px;
}

.item-total {
  font-weight: bold;
  color: #333;
}

/* 支付方式 */
.payment-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.payment-radio {
  height: auto !important;
  padding: 10px 20px !important;
}

.pay-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 8px;
}

.balance-tag {
  margin-left: 8px;
  font-size: 12px;
  color: #67c23a;
  background: #f0f9eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.balance-warning {
  margin-top: 15px;
}

/* 汇总样式 */
.summary-section {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  text-align: right;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.summary-item {
  margin-bottom: 10px;
  color: #666;
}

.summary-item .val {
  display: inline-block;
  width: 120px;
}

.total-price {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  font-size: 18px;
  font-weight: bold;
}

.total-price .val {
  color: #ea580c;
  font-size: 28px;
  display: inline-block;
  width: 150px;
}

.actions {
  margin-top: 30px;
}

.pay-btn {
  width: 180px;
  margin-left: 20px;
}

.pay-success-content {
  text-align: center;
  padding: 20px 0;
}

.pay-success-content .msg {
  font-size: 20px;
  font-weight: bold;
  margin: 15px 0 5px;
}

.pay-success-content .sub-msg {
  color: #999;
}
</style>
