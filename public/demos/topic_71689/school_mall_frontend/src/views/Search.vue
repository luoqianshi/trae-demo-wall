<template>
  <div class="search-page">
    <Header />
    <div class="container" v-loading="loading">
      <div class="search-header">
        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索商品、商家、分类..."
            class="search-input"
            @keyup.enter="handleSearch"
            clearable
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">
                <el-icon><SearchIcon /></el-icon> 搜索
              </el-button>
            </template>
          </el-input>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="search-tabs">
        <el-tab-pane label="全部" name="all">
          <div class="result-list" v-if="results.all.length > 0">
            <div v-for="(item, index) in results.all" :key="index" class="result-item">
              <!-- 商品卡片 -->
              <div v-if="item.search_type === 'product'" class="card product-card-search" @click="goToProduct(item.id)">
                <el-image :src="item.image" class="card-img" fit="cover">
                  <template #error><div class="image-slot"><el-icon><Picture /></el-icon></div></template>
                </el-image>
                <div class="card-info">
                  <div class="type-tag product">商品</div>
                  <h4 class="name">{{ item.name }}</h4>
                  <div class="price">¥{{ item.price }}</div>
                  <div class="meta">销量 {{ item.sales_count }}</div>
                </div>
              </div>

              <!-- 商家卡片 -->
              <div v-else-if="item.search_type === 'merchant'" class="card merchant-card-search" @click="goToMerchant(item.id)">
                <el-image :src="item.merchant_logo || 'https://via.placeholder.com/60'" class="card-img-small" fit="cover">
                  <template #error><div class="image-slot"><el-icon><Shop /></el-icon></div></template>
                </el-image>
                <div class="card-info">
                  <div class="type-tag merchant">商家</div>
                  <h4 class="name">{{ item.merchant_name }}</h4>
                  <div class="meta">{{ item.merchant_address }}</div>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="未找到相关结果" />
        </el-tab-pane>

        <el-tab-pane label="商品" name="products">
          <div class="product-grid" v-if="results.products.length > 0">
            <div v-for="item in results.products" :key="item.id" class="card product-card-search" @click="goToProduct(item.id)">
              <el-image :src="item.image" class="card-img" fit="cover">
                <template #error><div class="image-slot"><el-icon><Picture /></el-icon></div></template>
              </el-image>
              <div class="card-info">
                <div class="type-tag product">商品</div>
                <h4 class="name">{{ item.name }}</h4>
                <div class="price">¥{{ item.price }}</div>
                <div class="meta">销量 {{ item.sales_count }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="未找到相关商品" />
        </el-tab-pane>

        <el-tab-pane label="商家" name="merchants">
          <div class="merchant-list" v-if="results.merchants.length > 0">
            <div v-for="item in results.merchants" :key="item.id" class="card merchant-card-search" @click="goToMerchant(item.id)">
              <el-image :src="item.merchant_logo || 'https://via.placeholder.com/60'" class="card-img-small" fit="cover">
                <template #error><div class="image-slot"><el-icon><Shop /></el-icon></div></template>
              </el-image>
              <div class="card-info">
                <div class="type-tag merchant">商家</div>
                <h4 class="name">{{ item.merchant_name }}</h4>
                <div class="meta">{{ item.merchant_address }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="未找到相关商家" />
        </el-tab-pane>

        <el-tab-pane label="分类商品" name="categories">
          <div class="product-grid" v-if="results.categories.length > 0">
            <div v-for="item in results.categories" :key="item.id" class="card product-card-search" @click="goToProduct(item.id)">
              <el-image :src="item.image" class="card-img" fit="cover">
                <template #error><div class="image-slot"><el-icon><Picture /></el-icon></div></template>
              </el-image>
              <div class="card-info">
                <div class="type-tag category">分类匹配</div>
                <h4 class="name">{{ item.name }}</h4>
                <div class="price">¥{{ item.price }}</div>
                <div class="meta">销量 {{ item.sales_count }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="未找到该分类下的商品" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search as SearchIcon, Shop, PriceTag, Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import Header from '@/components/Header.vue'

const route = useRoute()
const router = useRouter()
const keyword = ref(route.query.keyword || '')
const activeTab = ref('all')
const loading = ref(false)

const results = ref({
  all: [],
  products: [],
  merchants: [],
  categories: []
})

const fetchResults = async () => {
  const categoryId = route.query.category_id
  if (!keyword.value.trim() && !categoryId) return
  
  loading.value = true
  try {
    const params = { keyword: keyword.value }
    if (categoryId) {
      params.category_id = categoryId
    }
    const response = await axios.get('/api/product/global-search/', { params })
    if (response.data.code === 200) {
      results.value = response.data.data
      // 如果是通过分类进来的，且没有关键词，默认切换到商品标签
      if (categoryId && !keyword.value) {
        activeTab.value = 'products'
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (keyword.value.trim()) {
    router.push({
      path: '/search',
      query: { keyword: keyword.value.trim() }
    })
  }
}

// 监听路由参数变化，重新搜索
watch(() => [route.query.keyword, route.query.category_id], ([newKeyword, newCategoryId]) => {
  keyword.value = newKeyword || ''
  fetchResults()
})

onMounted(() => {
  fetchResults()
})

const goToProduct = (id) => {
  router.push(`/product/${id}`)
}

const goToMerchant = (id) => {
  router.push(`/shop/${id}`)
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: #fff7ed;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
}

.search-box {
  width: 100%;
  max-width: 700px;
}

.search-input :deep(.el-input-group__append) {
  background-color: #ea580c;
  color: white;
  border-color: #ea580c;
}

.search-tabs {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-height: 500px;
}

/* 结果列表样式 */
.result-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 通用卡片样式 */
:deep(.card) {
  display: flex;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

:deep(.card:hover) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

:deep(.card-img) {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  margin-right: 15px;
}

:deep(.card-img-small) {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
}

:deep(.card-info) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

:deep(.type-tag) {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 5px;
}

:deep(.type-tag.product) { background: #e6f7ff; color: #1890ff; }
:deep(.type-tag.merchant) { background: #f6ffed; color: #52c41a; }
:deep(.type-tag.category) { background: #fff7e6; color: #fa8c16; }

:deep(.name) {
  margin: 0 0 5px;
  font-size: 16px;
  color: #333;
}

:deep(.price) {
  color: #ea580c;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

:deep(.meta) {
  font-size: 12px;
  color: #909399;
}

:deep(.image-slot) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
</style>
