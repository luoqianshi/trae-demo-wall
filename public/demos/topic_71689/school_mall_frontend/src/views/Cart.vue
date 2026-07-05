<template>
  <div class="cart-page">
    <Header />
    <div class="container" v-loading="loading">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>购物车</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-if="cartItems.length > 0" class="cart-content">
        <!-- 购物车头部 -->
        <div class="cart-header">
          <div class="col-check">
            <el-checkbox v-model="isAllSelected" @change="handleSelectAll">全选</el-checkbox>
          </div>
          <div class="col-info">商品信息</div>
          <div class="col-price">单价</div>
          <div class="col-quantity">数量</div>
          <div class="col-total">小计</div>
          <div class="col-action">操作</div>
        </div>

        <!-- 商品列表 -->
        <div class="cart-list">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="col-check">
              <el-checkbox v-model="item.is_selected" :true-label="1" :false-label="0" @change="handleSelectItem(item)" />
            </div>
            <div class="col-info" @click="goToProduct(item.product_detail.id)">
              <el-image :src="item.product_detail.product_images[0]" fit="cover" class="product-img" />
              <div class="product-detail">
                <h3 class="product-name">{{ item.product_detail.product_name }}</h3>
                <p class="product-stock" :class="{ 'low-stock': item.product_detail.remaining_stock < 10 }">
                  库存: {{ item.product_detail.remaining_stock }}
                </p>
              </div>
            </div>
            <div class="col-price">¥{{ item.product_detail.price }}</div>
            <div class="col-quantity">
              <el-input-number 
                v-model="item.quantity" 
                :min="1" 
                :max="item.product_detail.remaining_stock"
                size="small"
                @change="(val) => handleQuantityChange(item, val)"
              />
            </div>
            <div class="col-total">¥{{ (item.product_detail.price * item.quantity).toFixed(2) }}</div>
            <div class="col-action">
              <el-button type="danger" link @click="handleDeleteItem(item.id)">删除</el-button>
            </div>
          </div>
        </div>

        <!-- 结算条 -->
        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox v-model="isAllSelected" @change="handleSelectAll">全选</el-checkbox>
            <el-button type="danger" link @click="handleDeleteSelected" :disabled="!selectedCount">删除选中商品</el-button>
            <el-button type="danger" link @click="handleClearCart">清空购物车</el-button>
          </div>
          <div class="footer-right">
            <div class="total-info">
              已选择 <span class="count">{{ selectedCount }}</span> 件商品
              <span class="price-label">总计：</span>
              <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button type="primary" size="large" class="checkout-btn" :disabled="!selectedCount" @click="handleCheckout">
              去结算
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空购物车状态 -->
      <div v-else class="empty-cart">
        <el-empty description="购物车空空如也">
          <el-button type="primary" @click="$router.push('/')">去逛逛</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import Header from '@/components/Header.vue'

const router = useRouter()
const loading = ref(false)
const cartItems = ref([])

// 计算选中的商品数量
const selectedCount = computed(() => {
  return cartItems.value.reduce((count, item) => {
    return item.is_selected === 1 ? count + 1 : count
  }, 0)
})

// 计算选中商品的总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((total, item) => {
    if (item.is_selected === 1) {
      return total + (item.product_detail.price * item.quantity)
    }
    return total
  }, 0)
})

// 全选状态
const isAllSelected = computed({
  get: () => {
    return cartItems.value.length > 0 && cartItems.value.every(item => item.is_selected === 1)
  },
  set: (val) => {
    // 这个 setter 会在全选 checkbox 变化时被调用，但我们通过 @change 处理逻辑
  }
})

// 获取购物车列表
const fetchCartItems = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const response = await axios.get('/api/order/cart/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      cartItems.value = response.data.data
    }
  } catch (error) {
    console.error('获取购物车失败:', error)
    ElMessage.error('获取购物车失败')
  } finally {
    loading.value = false
  }
}

// 修改商品数量
const handleQuantityChange = async (item, val) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`/api/order/cart/${item.id}/`, {
      quantity: val
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '更新失败')
      fetchCartItems() // 失败则回滚
    }
  } catch (error) {
    console.error('更新数量失败:', error)
    ElMessage.error('更新数量失败')
    fetchCartItems()
  }
}

// 选择/取消选择商品
const handleSelectItem = async (item) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/order/cart/${item.id}/`, {
      is_selected: item.is_selected
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error('更新选择状态失败:', error)
    ElMessage.error('操作失败')
    item.is_selected = item.is_selected === 1 ? 0 : 1 // 回滚
  }
}

// 全选/取消全选
const handleSelectAll = async (val) => {
  const isSelected = val ? 1 : 0
  const cartIds = cartItems.value.map(item => item.id)
  
  if (cartIds.length === 0) return

  try {
    const token = localStorage.getItem('token')
    const response = await axios.put('/api/order/cart/select/', {
      cart_ids: cartIds,
      is_selected: !!isSelected
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      cartItems.value.forEach(item => {
        item.is_selected = isSelected
      })
    }
  } catch (error) {
    console.error('全选操作失败:', error)
    ElMessage.error('全选操作失败')
    fetchCartItems()
  }
}

// 删除单个商品
const handleDeleteItem = (id) => {
  ElMessageBox.confirm('确定要从购物车中删除该商品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/order/cart/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        cartItems.value = cartItems.value.filter(item => item.id !== id)
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 删除选中的商品
const handleDeleteSelected = () => {
  const selectedIds = cartItems.value
    .filter(item => item.is_selected === 1)
    .map(item => item.id)
  
  if (selectedIds.length === 0) return

  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.length} 个商品吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      // 循环删除（或者后端可以支持批量删除接口，目前后端只有单个删除和清空）
      // 这里为了简单，我们先一个一个删，或者你可以稍后优化后端支持批量删除
      loading.value = true
      for (const id of selectedIds) {
        await axios.delete(`/api/order/cart/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      ElMessage.success('删除成功')
      fetchCartItems()
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('部分商品删除失败')
      fetchCartItems()
    } finally {
      loading.value = false
    }
  })
}

// 清空购物车
const handleClearCart = () => {
  ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete('/api/order/cart/clear/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success('购物车已清空')
        cartItems.value = []
      }
    } catch (error) {
      console.error('清空失败:', error)
      ElMessage.error('清空失败')
    }
  })
}

// 去结算
const handleCheckout = () => {
  router.push('/checkout')
}

const goToProduct = (id) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  fetchCartItems()
})
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #fff7ed;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 100px;
}

.el-breadcrumb {
  margin-bottom: 20px;
}

.cart-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  overflow: hidden;
}

.cart-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.cart-list {
  padding: 0 20px;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.cart-item:last-child {
  border-bottom: none;
}

/* 列宽定义 */
.col-check { width: 80px; }
.col-info { flex: 1; display: flex; align-items: center; cursor: pointer; }
.col-price { width: 120px; text-align: center; color: #666; }
.col-quantity { width: 150px; text-align: center; }
.col-total { width: 120px; text-align: center; color: #ea580c; font-weight: bold; }
.col-action { width: 100px; text-align: center; }

.product-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-right: 15px;
}

.product-detail {
  flex: 1;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-stock {
  font-size: 12px;
  color: #999;
}

.low-stock {
  color: #ff4d4f;
}

.cart-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.cart-footer .container {
  width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-right {
  display: flex;
  align-items: center;
}

.total-info {
  margin-right: 20px;
  color: #666;
  font-size: 14px;
}

.total-info .count {
  color: #ea580c;
  font-weight: bold;
  margin: 0 4px;
}

.price-label {
  margin-left: 15px;
}

.total-price {
  color: #ea580c;
  font-size: 24px;
  font-weight: bold;
}

.checkout-btn {
  width: 120px;
  height: 44px;
  font-size: 16px;
}

.empty-cart {
  padding: 80px 0;
  background: #fff;
  border-radius: 8px;
}

@media screen and (max-width: 768px) {
  .col-price, .col-total { display: none; }
  .cart-header { display: none; }
  .cart-item { position: relative; padding-bottom: 40px; }
  .col-quantity { position: absolute; bottom: 15px; left: 175px; }
  .col-action { position: absolute; bottom: 15px; right: 0; }
}
</style>
