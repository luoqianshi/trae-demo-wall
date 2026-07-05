<template>
  <div class="product-detail-page" v-loading="loading">
    <Header />
    
    <div class="container" v-if="product">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ product.category }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ product.product_name }}</el-breadcrumb-item>
          </el-breadcrumb>
      </div>

      <div class="product-main">
        <!-- 左侧：图片展示 -->
        <div class="product-gallery">
          <div class="main-image">
            <el-image 
              :src="currentMainImage" 
              fit="cover" 
              :preview-src-list="product.product_images"
            />
          </div>
          <div class="thumb-list">
            <div 
              v-for="(img, index) in product.product_images" 
              :key="index"
              class="thumb-item"
              :class="{ active: currentImageIndex === index }"
              @mouseover="currentImageIndex = index"
            >
              <img :src="img" alt="缩略图" />
            </div>
          </div>
        </div>

        <!-- 右侧：商品信息 -->
        <div class="product-info">
          <h1 class="title">{{ product.product_name }}</h1>
          <p class="subtitle">{{ (product.product_desc || '').slice(0, 100) }}{{ (product.product_desc || '').length > 100 ? '...' : '' }}</p>

          <div class="price-panel">
            <div class="price-row">
              <span class="label">价格</span>
              <span class="currency">¥</span>
              <span class="price">{{ product.price }}</span>
              <span class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
            </div>
            <div class="promo-row">
              <span class="label">优惠</span>
              <el-tag size="small" type="danger" effect="plain">满减</el-tag>
              <span class="promo-text">满99减10元</span>
            </div>
          </div>

          <div class="meta-panel">
            <div class="meta-item">
              <span class="label">销量</span>
              <span class="value">{{ product.sales_count }}</span>
            </div>
            <div class="meta-item border">
              <span class="label">累计评价</span>
              <span class="value">128</span>
            </div>
            <div class="meta-item">
              <span class="label">收藏人气</span>
              <span class="value">{{ product.collect_count }}</span>
            </div>
          </div>

          <div class="sku-panel">
            <div class="sku-row">
              <span class="label">服务</span>
              <span class="service-list">
                <span class="service-item"><el-icon><CircleCheckFilled /></el-icon> 校园配送</span>
                <span class="service-item"><el-icon><CircleCheckFilled /></el-icon> 正品保证</span>
                <span class="service-item"><el-icon><CircleCheckFilled /></el-icon> 七天无理由</span>
              </span>
            </div>
            
            <div class="sku-row">
              <span class="label">数量</span>
              <el-input-number v-model="quantity" :min="1" :max="product.remaining_stock" size="small" />
              <span class="stock-tip">库存 {{ product.remaining_stock }} 件</span>
            </div>
          </div>

          <div class="action-buttons">
            <el-button type="warning" size="large" class="buy-now" @click="handleBuy">立即购买</el-button>
            <el-button type="danger" size="large" class="add-cart" @click="handleAddToCart">
              <el-icon><ShoppingCart /></el-icon> 加入购物车
            </el-button>
            <el-button 
              :type="isCollected ? 'warning' : 'default'" 
              circle 
              @click="toggleCollection"
            >
              <el-icon><Star v-if="!isCollected" /><StarFilled v-else /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 下方详情区 -->
      <div class="product-bottom">
        <div class="side-bar">
          <div class="shop-card">
            <div class="shop-header" @click="goToShop" style="cursor: pointer;">
              <img :src="(typeof product.merchant === 'object' ? product.merchant.merchant_logo : '') || 'https://images.unsplash.com/photo-1594179047519-f347310d3322?w=100&h=100&fit=crop'" class="shop-logo" />
              <div class="shop-name">{{ typeof product.merchant === 'object' ? product.merchant.merchant_name : product.merchant }}</div>
            </div>
            <div class="shop-stats">
              <div class="stat-item">
                <div class="stat-label">描述</div>
                <div class="stat-value high">4.9 ↑</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">服务</div>
                <div class="stat-value high">4.8 ↑</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">物流</div>
                <div class="stat-value">4.7 -</div>
              </div>
            </div>
            <div class="shop-actions">
              <el-button size="small" @click="goToShop">进店逛逛</el-button>
            </div>
          </div>
        </div>

        <div class="main-content">
          <el-tabs v-model="activeTab" class="product-tabs">
            <el-tab-pane label="宝贝详情" name="detail">
              <div class="detail-content">
                <div class="specs-list">
                  <div class="spec-item">品牌: 校园精选</div>
                  <div class="spec-item">产地: 中国</div>
                  <div class="spec-item">适用人群: 学生</div>
                  <div class="spec-item">上架时间: {{ formatDate(product.create_time) }}</div>
                </div>
                <div class="rich-text">
                  <p>{{ product.product_desc }}</p>
                  <img v-for="(img, index) in product.product_images" :key="index" :src="img" class="detail-img" />
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`累计评价 (${reviews.length})`" name="reviews">
              <div class="reviews-list" v-if="reviews.length > 0">
                <div v-for="review in reviews" :key="review.id" class="review-item">
                  <div class="user-info">
                    <el-avatar :size="32" :src="review.user_avatar || defaultAvatar" />
                    <span class="username">{{ review.user_name }}</span>
                  </div>
                  <div class="review-body">
                    <div class="rate">
                      <el-rate v-model="review.rating" disabled />
                    </div>
                    <p class="content">{{ review.content }}</p>
                    <div class="review-images" v-if="review.images && review.images.length">
                      <el-image 
                        v-for="(img, index) in review.images" 
                        :key="index" 
                        :src="img" 
                        :preview-src-list="review.images"
                        class="review-img"
                        style="width: 80px; height: 80px; margin-right: 10px; border-radius: 4px;"
                      />
                    </div>
                    <div class="time">{{ formatDate(review.create_time) }}</div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无评价" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <el-empty description="商品不存在或已下架" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Star, StarFilled, CircleCheckFilled } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const productId = route.params.id

const loading = ref(true)
const product = ref(null)
const currentImageIndex = ref(0)
const quantity = ref(1)
const activeTab = ref('detail')
const isCollected = ref(false)
const reviews = ref([])
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const currentMainImage = computed(() => {
  if (product.value && product.value.product_images && product.value.product_images.length > 0) {
    return product.value.product_images[currentImageIndex.value]
  }
  return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'
})

const goToShop = () => {
  if (product.value && product.value.merchant) {
    const merchantId = typeof product.value.merchant === 'object' ? product.value.merchant.id : product.value.merchant_id
    if (merchantId) {
      router.push(`/shop/${merchantId}`)
    } else {
      ElMessage.warning('暂无商户信息')
    }
  }
}

const contactMerchant = () => {
  if (product.value && product.value.merchant) {
    const merchantId = typeof product.value.merchant === 'object' ? product.value.merchant.id : product.value.merchant_id
    if (merchantId) {
      router.push({
        path: '/chat',
        query: { merchant_id: merchantId }
      })
    } else {
      ElMessage.warning('暂无商户信息')
    }
  }
}

const fetchProductDetail = async () => {
  try {
    const token = localStorage.getItem('token')
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await axios.get(`/api/product/detail/${productId}/`, config)
    if (response.data.code === 200) {
      product.value = response.data.data
      isCollected.value = product.value.is_collected
      fetchReviews()
    } else {
      ElMessage.error(response.data.message || '获取商品详情失败')
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    ElMessage.error('网络错误，请稍后再试')
  } finally {
    loading.value = false
  }
}

const fetchReviews = async () => {
   try {
     const response = await axios.get(`/api/product/${productId}/review/`)
     if (response.data.code === 200) {
      reviews.value = response.data.data
    }
  } catch (error) {
    console.error('获取评价失败:', error)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

const handleBuy = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录再进行购买')
    router.push('/login')
    return
  }
  
  try {
    const response = await axios.post('/api/order/cart/', {
      product: productId,
      quantity: quantity.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.code === 201) {
      router.push('/cart')
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    console.error('购买失败:', error)
    ElMessage.error(error.response?.data?.message || '购买失败，请稍后再试')
  }
}

const handleAddToCart = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录再加入购物车')
    router.push('/login')
    return
  }
  
  try {
    const response = await axios.post('/api/order/cart/', {
      product: productId,
      quantity: quantity.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.code === 201) {
      ElMessage.success('成功加入购物车')
    } else {
      ElMessage.error(response.data.message || '加入失败')
    }
  } catch (error) {
    console.error('加入购物车失败:', error)
    ElMessage.error(error.response?.data?.message || '加入购物车失败')
  }
}

const toggleCollection = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录再进行收藏')
    router.push('/login')
    return
  }

  try {
    if (isCollected.value) {
      // 取消收藏
      const response = await axios.delete(`/api/product/collection/`, {
        params: { product_id: productId },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        isCollected.value = false
        product.value.collect_count--
        ElMessage.success('已取消收藏')
      }
    } else {
      // 添加收藏
      const response = await axios.post(`/api/product/collection/`, 
        { product: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.code === 201) {
        isCollected.value = true
        product.value.collect_count++
        ElMessage.success('收藏成功')
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败，请稍后再试')
  }
}

onMounted(() => {
  fetchProductDetail()
})
</script>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: #fff7ed;
  padding-bottom: 50px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.breadcrumb-container {
  padding: 20px 0;
}

/* 主展示区 */
.product-main {
  background: #fff;
  display: flex;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

/* 左侧图片 */
.product-gallery {
  width: 400px;
  margin-right: 40px;
}

.main-image {
  width: 400px;
  height: 400px;
  border: 1px solid #f0f0f0;
  margin-bottom: 10px;
  cursor: crosshair;
}

.main-image .el-image {
  width: 100%;
  height: 100%;
}

.thumb-list {
  display: flex;
  gap: 10px;
}

.thumb-item {
  width: 60px;
  height: 60px;
  border: 2px solid transparent;
  cursor: pointer;
}

.thumb-item.active {
  border-color: #ea580c;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 右侧信息 */
.product-info {
  flex: 1;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.price-panel {
  background-color: #fff7ed;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 12px;
}

.price-row {
  margin-bottom: 10px;
}

.price-panel .label {
  color: #666;
  width: 60px;
  display: inline-block;
}

.currency {
  color: #ea580c;
  font-size: 18px;
}

.price {
  color: #ea580c;
  font-size: 32px;
  font-weight: bold;
}

.original-price {
  color: #999;
  text-decoration: line-through;
  margin-left: 10px;
}

.promo-row .promo-text {
  margin-left: 10px;
  color: #ff4400;
}

.meta-panel {
  display: flex;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
  margin-bottom: 20px;
}

.meta-item {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.meta-item.border {
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
}

.meta-item .value {
  color: #ea580c;
  font-weight: bold;
  margin-left: 5px;
}

.sku-panel {
  margin-bottom: 30px;
}

.sku-row {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.sku-row .label {
  width: 60px;
  color: #666;
}

.service-item {
  margin-right: 15px;
  font-size: 12px;
  color: #666;
}

.service-item .el-icon {
  color: #ea580c;
  vertical-align: middle;
}

.stock-tip {
  margin-left: 15px;
  color: #999;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.buy-now {
  width: 150px;
  background-color: #fff7ed !important;
  border-color: #ea580c !important;
  color: #ea580c !important;
  border-radius: 20px !important;
}

.add-cart {
  width: 180px;
  background-color: #ea580c !important;
  border-color: #ea580c !important;
  border-radius: 20px !important;
}

/* 底部区域 */
.product-bottom {
  display: flex;
  gap: 20px;
}

.side-bar {
  width: 200px;
}

.shop-card {
  background: #fff;
  padding: 15px;
  border: 1px solid #eee;
}

.shop-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.shop-logo {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 10px;
}

.shop-name {
  font-weight: bold;
  font-size: 14px;
}

.shop-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px 0;
  border-top: 1px dashed #eee;
  border-bottom: 1px dashed #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 12px;
  color: #ff4400;
}

.stat-value.high {
  color: #ff4400;
}

.shop-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-content {
  flex: 1;
  background: #fff;
  padding: 20px;
  min-height: 500px;
}

.product-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  height: 50px;
  line-height: 50px;
}

.product-tabs :deep(.el-tabs__item.is-active) {
  color: #ea580c;
}

.product-tabs :deep(.el-tabs__active-bar) {
  background-color: #ea580c;
}

.detail-content .specs-list {
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  background: #fafafa;
  margin-bottom: 30px;
}

.spec-item {
  width: 33.33%;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.detail-img {
  width: 100%;
  display: block;
  margin-bottom: 10px;
}

.review-item {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.user-info .username {
  margin-left: 10px;
  font-size: 12px;
  color: #666;
}

.review-body {
  padding-left: 42px;
}

.review-body .content {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
}

.review-body .time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  padding: 100px 0;
}
</style>
