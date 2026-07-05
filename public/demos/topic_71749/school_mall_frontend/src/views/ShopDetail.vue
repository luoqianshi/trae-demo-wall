<template>
  <div class="shop-detail">
    <Header />
    <!-- 店铺头部 -->
    <div class="shop-header" v-if="merchant.id">
      <div class="container">
        <div class="shop-info-wrapper">
          <div class="shop-main">
            <img :src="merchant.merchant_logo || defaultLogo" class="shop-logo" />
            <div class="shop-text">
              <h1 class="shop-name">{{ merchant.merchant_name }}</h1>
            </div>
          </div>
          <div class="shop-scores">
            <div class="score-item">
              <span class="label">描述</span>
              <span class="value high">4.9 ↑</span>
            </div>
            <div class="score-item">
              <span class="label">服务</span>
              <span class="value high">4.8 ↑</span>
            </div>
            <div class="score-item">
              <span class="label">物流</span>
              <span class="value">4.7 -</span>
            </div>
          </div>
          <div class="shop-actions">
                    <el-button icon="ChatDotRound" @click="contactMerchant">联系客服</el-button>
                  </div>
        </div>
      </div>
    </div>

    <!-- 店铺导航栏 -->
    <div class="shop-nav">
      <div class="container">
        <div class="nav-list">
          <div 
            class="nav-item" 
            :class="{ active: activeCategory === 'all' }"
            @click="handleCategoryChange('all')"
          >
            首页
          </div>
          <div 
            v-for="cat in merchantCategories" 
            :key="cat.id" 
            class="nav-item"
            :class="{ active: activeCategory === cat.id }"
            @click="handleCategoryChange(cat.id)"
          >
            {{ cat.category_name }}
          </div>
          <div class="nav-item">全部宝贝</div>
        </div>
        <div class="nav-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜本店"
            size="small"
            @keyup.enter="fetchProducts"
          >
            <template #append>
              <el-button icon="Search" @click="fetchProducts" />
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 店铺招牌/海报 -->
    <div class="shop-banner">
      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop" class="banner-img" />
    </div>

    <!-- 商品列表区 -->
    <div class="container shop-content">
      <div class="content-layout">
        <!-- 左侧侧边栏 -->
        <div class="sidebar">
          <div class="sidebar-card">
            <div class="card-header">宝贝分类</div>
            <div class="card-content category-tree">
              <div 
                class="cat-link" 
                :class="{ active: activeCategory === 'all' }"
                @click="handleCategoryChange('all')"
              >
                查看全部宝贝
              </div>
              <div 
                v-for="cat in merchantCategories" 
                :key="cat.id"
                class="cat-link"
                :class="{ active: activeCategory === cat.id }"
                @click="handleCategoryChange(cat.id)"
              >
                {{ cat.category_name }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧商品列表 -->
        <div class="main-list">
          <div class="filter-bar">
            <div class="sort-options">
              <span 
                :class="{ active: sortBy === 'id' }" 
                @click="handleSortChange('id')"
              >综合</span>
              <span 
                :class="{ active: sortBy === 'sales' }" 
                @click="handleSortChange('sales')"
              >销量</span>
              <span 
                :class="{ active: sortBy === 'price_asc' || sortBy === 'price_desc' }" 
                @click="handlePriceSort"
              >
                价格
                <el-icon v-if="sortBy === 'price_asc'"><CaretTop /></el-icon>
                <el-icon v-else-if="sortBy === 'price_desc'"><CaretBottom /></el-icon>
                <el-icon v-else><DCaret /></el-icon>
              </span>
              <span 
                :class="{ active: sortBy === 'create' }" 
                @click="handleSortChange('create')"
              >新品</span>
            </div>
          </div>

          <div v-loading="loading" class="product-grid">
            <el-empty v-if="products.length === 0" description="暂无商品" />
            <div 
              v-for="product in products" 
              :key="product.id" 
              class="product-card"
              @click="goToDetail(product.id)"
            >
              <div class="product-img-box">
                <img :src="product.image" class="product-img" />
              </div>
              <div class="product-info">
                <div class="product-price">
                  <span class="currency">￥</span>
                  <span class="amount">{{ product.price }}</span>
                </div>
                <div class="product-name">{{ product.name }}</div>
                <div class="product-footer">
                  <span class="sales">月销 {{ product.sales_count || 0 }}</span>
                  <span class="location">广东广州</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { CaretTop, CaretBottom, DCaret, Star, ChatDotRound, Search } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'

const route = useRoute()
const router = useRouter()
const merchantId = route.params.id

const merchant = ref({})
const merchantCategories = ref([])
const products = ref([])
const loading = ref(false)
const activeCategory = ref('all')
const sortBy = ref('id')
const searchKeyword = ref('')
const defaultLogo = 'https://images.unsplash.com/photo-1594179047519-f347310d3322?w=100&h=100&fit=crop'

// 获取商户基本信息
const fetchMerchantInfo = async () => {
  try {
    const res = await axios.get(`/api/merchant/public/${merchantId}/`)
    if (res.data.code === 200) {
      merchant.value = res.data.data
    }
  } catch (error) {
    console.error('获取商户信息失败:', error)
    ElMessage.error('获取商户信息失败')
  }
}

// 获取商户分类
const fetchMerchantCategories = async () => {
  try {
    const res = await axios.get(`/api/product/category/merchant/${merchantId}/`)
    if (res.data.code === 200) {
      merchantCategories.value = res.data.data
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    const params = {
      merchant_id: merchantId,
      sort: sortBy.value,
      keyword: searchKeyword.value
    }
    if (activeCategory.value !== 'all') {
      params.category_id = activeCategory.value
    }
    
    const res = await axios.get('/api/product/list/', { params })
    if (res.data.code === 200) {
      products.value = res.data.data
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = (catId) => {
  activeCategory.value = catId
  fetchProducts()
}

const handleSortChange = (sort) => {
  sortBy.value = sort
  fetchProducts()
}

const handlePriceSort = () => {
  if (sortBy.value === 'price_asc') {
    sortBy.value = 'price_desc'
  } else {
    sortBy.value = 'price_asc'
  }
  fetchProducts()
}

const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

const contactMerchant = () => {
  router.push({
    path: '/chat',
    query: { merchant_id: merchantId }
  })
}

onMounted(() => {
  fetchMerchantInfo()
  fetchMerchantCategories()
  fetchProducts()
})
</script>

<style scoped>
.shop-detail {
  background-color: #fff7ed;
  min-height: 100vh;
}

.container {
  width: 1200px;
  margin: 0 auto;
}

/* 店铺头部 */
.shop-header {
  background-color: #fff;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.shop-info-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shop-main {
  display: flex;
  align-items: center;
}

.shop-logo {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #eee;
}

.shop-text {
  margin-left: 15px;
}

.shop-name {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.shop-scores {
  display: flex;
  gap: 30px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-item .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.score-item .value {
  font-size: 14px;
  color: #666;
}

.score-item .value.high {
  color: #ea580c;
}

/* 店铺导航 */
.shop-nav {
  background-color: #ea580c;
  color: #fff;
}

.shop-nav .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
}

.nav-list {
  display: flex;
  height: 100%;
}

.nav-item {
  padding: 0 20px;
  line-height: 40px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.nav-item:hover, .nav-item.active {
  background-color: #c2410c;
}

.nav-search {
  width: 200px;
}

/* 招牌海报 */
.shop-banner {
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 内容区域 */
.shop-content {
  margin-top: 20px;
  padding-bottom: 40px;
}

.content-layout {
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 200px;
}

.main-list {
  flex: 1;
}

.sidebar-card {
  background-color: #fff;
  border: 1px solid #eee;
  margin-bottom: 20px;
}

.card-header {
  background-color: #f8f8f8;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}

.card-content {
  padding: 10px;
}

.cat-link {
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
}

.cat-link:hover, .cat-link.active {
  color: #ea580c;
  background-color: #fff7ed;
}

/* 筛选工具栏 */
.filter-bar {
  background-color: #fff;
  padding: 10px 15px;
  border: 1px solid #eee;
  margin-bottom: 15px;
}

.sort-options {
  display: flex;
  gap: 25px;
  font-size: 14px;
  color: #666;
}

.sort-options span {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-options span:hover, .sort-options span.active {
  color: #ea580c;
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.product-card {
  background-color: #fff;
  border: 1px solid #eee;
  transition: all 0.3s;
  cursor: pointer;
}

.product-card:hover {
  border-color: #ea580c;
  box-shadow: 0 2px 12px rgba(234, 88, 12, 0.1);
}

.product-img-box {
  width: 100%;
  padding-top: 100%;
  position: relative;
}

.product-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 12px;
}

.product-price {
  color: #ea580c;
  margin-bottom: 8px;
}

.product-price .currency {
  font-size: 14px;
}

.product-price .amount {
  font-size: 20px;
  font-weight: bold;
}

.product-name {
  font-size: 13px;
  color: #333;
  height: 36px;
  line-height: 18px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 10px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}
</style>
