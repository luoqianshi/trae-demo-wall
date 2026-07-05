<template>
  <div class="home-page">
    <div class="header-container">
      <Header />
    </div>
    
    <div class="search-section">
      <div class="container">
        <div class="logo-section">
          <h1 class="logo">
            <span>校园</span>
            <span>商城</span>
          </h1>
          <span class="sub-title">CampusMall</span>
        </div>
        
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入搜索内容"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
          <div class="hot-keywords">
            <span v-for="keyword in hotKeywords" :key="keyword" @click="handleKeywordClick(keyword)">
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="container">
        <div class="content-grid">
          <div class="category-section">
            <ul class="category-list">
              <li 
                v-for="category in categories" 
                :key="category.id" 
                @mouseenter="activeCategory = category"
                @mouseleave="activeCategory = null"
                @click="handleCategoryClick(category)"
              >
                <span class="name">{{ category.category_name }}</span>
                <el-icon><ArrowRight /></el-icon>
                
                <div v-if="activeCategory && activeCategory.id === category.id" class="sub-category-panel">
                  <div class="sub-category-content">
                    <h4>{{ category.category_name }}</h4>
                    <div class="sub-category-grid">
                      <span 
                        v-for="child in category.children" 
                        :key="child.id"
                        @click.stop="handleCategoryClick(child)"
                      >
                        {{ child.category_name }}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div class="carousel-section">
            <el-carousel :interval="4000" height="400px">
              <el-carousel-item v-for="item in carouselItems" :key="item.id">
                <div class="carousel-item" :style="{ backgroundImage: `url(${item.image})` }">
                  <div class="carousel-content">
                    <h2>{{ item.title }}</h2>
                    <p>{{ item.subtitle }}</p>
                  </div>
                </div>
              </el-carousel-item>
            </el-carousel>
          </div>

          <div class="feature-section">
            <div v-for="feature in features" :key="feature.id" class="feature-card" :class="feature.type">
              <div class="feature-info">
                <p class="feature-title">{{ feature.title }}</p>
                <p class="feature-desc">{{ feature.desc }}</p>
              </div>
              <div class="feature-icon">
                <img :src="feature.icon" :alt="feature.title">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="recommend-section">
      <div class="container">
        <div class="section-header">
          <span class="fire-icon">🔥</span>
          <h2>为你推荐</h2>
        </div>
        
        <div class="product-grid">
          <div v-for="product in recommendProducts" :key="product.id" class="product-card" @click="goToProductDetail(product.id)">
            <div class="product-image">
              <img :src="product.image" :alt="product.name">
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="price-section">
                <span class="current-price">￥{{ product.price }}</span>
                <span v-if="product.originalPrice" class="original-price">￥{{ product.originalPrice }}</span>
              </div>
              <div v-if="product.tags && product.tags.length > 0" class="product-tags">
                <span v-for="tag in product.tags" :key="tag.text" class="tag" :class="tag.type">
                  {{ tag.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import axios from 'axios'
import Header from '@/components/Header.vue'

const router = useRouter()

const searchKeyword = ref('')
const hotKeywords = ref(['笔记本电脑', '手机', '耳机', '书籍', '文具', '零食', '运动鞋', '背包'])

const categories = ref([])
const activeCategory = ref(null)
const recommendProducts = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/product/category/list/')
    if (response.data.code === 200) {
      categories.value = response.data.data
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchRecommendProducts = async () => {
  try {
    const response = await axios.get('/api/product/recommend/', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        random: true
      }
    })
    if (response.data.code === 200) {
      recommendProducts.value = response.data.data.results
      total.value = response.data.data.total
    }
  } catch (error) {
    console.error('获取推荐商品失败:', error)
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchRecommendProducts()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchRecommendProducts()
}

const goToProductDetail = (productId) => {
  router.push(`/product/${productId}`)
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

const handleKeywordClick = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

const handleCategoryClick = (category) => {
  router.push({
    path: '/search',
    query: { category_id: category.id }
  })
}

const carouselItems = ref([
  {
    id: 1,
    title: '开学季特惠',
    subtitle: '全场商品8折起',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop'
  },
  {
    id: 2,
    title: '学习用品',
    subtitle: '文具用品满100减30',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=400&fit=crop'
  },
  {
    id: 3,
    title: '时尚穿搭',
    subtitle: '潮流服饰限时特惠',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop'
  },
  {
    id: 4,
    title: '美食盛宴',
    subtitle: '零食饮料买二送一',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&h=400&fit=crop'
  }
])

const features = ref([
  {
    id: 1,
    title: '学生优惠',
    desc: '专享折扣',
    type: 'green',
    icon: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    title: '品质保证',
    desc: '正品保障',
    type: 'pink',
    icon: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop'
  },
  {
    id: 3,
    title: '快速配送',
    desc: '校园直达',
    type: 'blue',
    icon: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop'
  },
  {
    id: 4,
    title: '售后服务',
    desc: '无忧退换',
    type: 'orange',
    icon: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop'
  }
])

onMounted(() => {
  fetchCategories()
  fetchRecommendProducts()
})
</script>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  background-color: #fff7ed;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header-container {
  width: 100%;
  background-color: #fff;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
}

.search-section {
  padding: 20px 0;
  width: 100%;
  background-color: #fff;
}

.search-section .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 200px;
}

.logo {
  font-size: 26px;
  font-weight: bold;
  color: #ea580c;
  margin: 0;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo span {
  display: block;
}

.sub-title {
  color: #9ca3af;
  font-size: 11px;
  margin-bottom: 4px;
}

.search-box {
  flex: 1;
  max-width: 850px;
  margin-left: 40px;
}

.search-input {
  font-size: 14px;
}

.search-input :deep(.el-input-group__append) {
  background-color: #ea580c;
  border-color: #ea580c;
  color: white;
  padding: 0 24px;
  border-radius: 0 20px 20px 0;
}

.hot-keywords {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.hot-keywords span {
  cursor: pointer;
  transition: color 0.3s;
}

.hot-keywords span:hover {
  color: #ea580c;
}

.main-content {
  margin-top: 20px;
  width: 100%;
}

.content-grid {
  display: flex;
  gap: 12px;
  min-height: 400px;
}

.category-section {
  width: 240px;
  background-color: white;
  padding: 5px 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(234, 88, 12, 0.1);
  display: flex;
  flex-direction: column;
  height: 400px;
  position: relative;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.category-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  height: 39px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-list li:hover {
  background-color: #fff7ed;
  color: #ea580c;
}

.sub-category-panel {
  position: absolute;
  left: 100%;
  top: 0;
  width: 600px;
  min-height: 400px;
  background: white;
  box-shadow: 4px 0 16px rgba(234, 88, 12, 0.1);
  z-index: 100;
  padding: 20px;
  border-left: 1px solid #fed7aa;
  border-radius: 0 12px 12px 0;
}

.sub-category-content h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 10px;
}

.sub-category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.sub-category-grid span {
  font-size: 14px;
  color: #6b7280;
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.sub-category-grid span:hover {
  background-color: #ea580c;
  color: white;
  cursor: pointer;
}

.category-list .name {
  font-size: 14px;
  color: #374151;
}

.carousel-section {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
}

.carousel-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.carousel-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
}

.carousel-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  padding: 20px;
}

.carousel-content h2 {
  font-size: 40px;
  font-weight: bold;
  margin: 0 0 12px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.carousel-content p {
  font-size: 20px;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.feature-section {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 400px;
}

.feature-card {
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  background-color: white;
}

.feature-card:hover {
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15);
}

.feature-info {
  flex: 1;
  text-align: left;
}

.feature-title {
  font-size: 13px;
  font-weight: bold;
  margin: 0 0 2px 0;
}

.feature-desc {
  font-size: 11px;
  margin: 0;
}

.feature-card.green {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.feature-card.green .feature-title {
  color: #16a34a;
}

.feature-card.green .feature-desc {
  color: #15803d;
}

.feature-card.pink {
  background-color: #fdf2f8;
  border-color: #fbcfe8;
}

.feature-card.pink .feature-title {
  color: #db2777;
}

.feature-card.pink .feature-desc {
  color: #be185d;
}

.feature-card.blue {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.feature-card.blue .feature-title {
  color: #2563eb;
}

.feature-card.blue .feature-desc {
  color: #1d4ed8;
}

.feature-card.orange {
  background-color: #fff7ed;
  border-color: #fed7aa;
}

.feature-card.orange .feature-title {
  color: #ea580c;
}

.feature-card.orange .feature-desc {
  color: #c2410c;
}

.feature-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  margin-left: 8px;
}

.feature-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-section {
  margin-top: 32px;
  padding-bottom: 80px;
  width: 100%;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.fire-icon {
  font-size: 24px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  color: #374151;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  width: 100%;
}

.product-card {
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(234, 88, 12, 0.1);
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.3s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15);
  transform: translateY(-4px);
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  background-color: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  font-size: 12px;
  font-weight: normal;
  margin: 0;
  color: #374151;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  height: 36px;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 18px;
  font-weight: bold;
  color: #ea580c;
}

.original-price {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: line-through;
}

.product-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid;
  border-radius: 4px;
}

.tag.red {
  color: #dc2626;
  border-color: #dc2626;
}

.tag.green {
  color: #16a34a;
  border-color: #16a34a;
}

.tag.blue {
  color: #2563eb;
  border-color: #2563eb;
}

.tag.purple {
  color: #9333ea;
  border-color: #9333ea;
}

.tag.orange {
  color: #ea580c;
  border-color: #ea580c;
}

.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>
