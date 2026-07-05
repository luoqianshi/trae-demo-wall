<template>
  <div class="collections-container container">
    <Header />
    
    <div class="content">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>我的收藏</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="page-header">
        <h2>我的收藏</h2>
        <p class="subtitle">管理您收藏的所有宝贝</p>
      </div>

      <el-skeleton :loading="loading" animated :count="4">
        <template #template>
          <div style="padding: 14px; display: flex; gap: 20px;">
            <el-skeleton-item variant="image" style="width: 200px; height: 200px" />
            <div style="flex: 1; padding: 14px">
              <el-skeleton-item variant="h1" style="width: 50%" />
              <el-skeleton-item variant="text" style="margin-top: 10px" />
              <el-skeleton-item variant="text" style="width: 30%; margin-top: 10px" />
            </div>
          </div>
        </template>
        
        <template #default>
          <div v-if="collections.length > 0" class="product-list">
            <div v-for="item in collections" :key="item.id" class="product-item">
              <el-card shadow="hover" :body-style="{ padding: '0px', display: 'flex' }">
                <div class="product-image" @click="goToDetail(item.product.id)">
                  <el-image :src="item.product.image" fit="cover">
                    <template #error>
                      <div class="image-slot">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="product-info">
                  <div class="info-top" @click="goToDetail(item.product.id)">
                    <h3 class="name">{{ item.product.name }}</h3>
                    <div class="merchant" @click.stop="goToShop(item.product.merchant_id)">
                      <el-icon><Shop /></el-icon>
                      {{ item.product.merchant_name }}
                    </div>
                    <div class="tags">
                      <el-tag 
                        v-for="tag in item.product.tags" 
                        :key="tag.text" 
                        :type="tag.type" 
                        size="small"
                        effect="plain"
                      >
                        {{ tag.text }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="info-bottom">
                    <div class="price-box">
                      <span class="price">¥{{ item.product.price }}</span>
                      <span v-if="item.product.originalPrice" class="original-price">¥{{ item.product.originalPrice }}</span>
                    </div>
                    <div class="actions">
                      <el-button type="danger" link @click="removeCollection(item.product.id)">取消收藏</el-button>
                      <el-button type="primary" size="small" @click="goToDetail(item.product.id)">查看详情</el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-empty description="您的收藏夹还是空的哦">
              <el-button type="primary" @click="router.push('/')">去首页逛逛</el-button>
            </el-empty>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Header from '@/components/Header.vue'
import { Picture, Shop } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const collections = ref([])
const loading = ref(true)

const fetchCollections = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/product/collection/')
    if (response.data.code === 200) {
      collections.value = response.data.data
    }
  } catch (error) {
    console.error('获取收藏失败:', error)
  } finally {
    loading.value = false
  }
}

const removeCollection = async (productId) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await axios.delete(`/api/product/collection/?product_id=${productId}`)
    if (response.data.code === 200) {
      ElMessage.success('已取消收藏')
      fetchCollections() // 刷新列表
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

const goToShop = (id) => {
  router.push(`/shop/${id}`)
}

onMounted(() => {
  fetchCollections()
})
</script>

<style scoped>
.collections-container {
  padding-bottom: 40px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff7ed;
  min-height: 100vh;
}

.content {
  margin-top: 20px;
  padding: 0 20px;
}

.page-header {
  margin: 30px 0;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.page-header .subtitle {
  color: #909399;
  font-size: 14px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-item .el-card {
  height: 180px;
}

.product-image {
  width: 180px;
  height: 180px;
  cursor: pointer;
  flex-shrink: 0;
}

.product-image .el-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.product-info {
  flex: 1;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.info-top {
  cursor: pointer;
}

.info-top .name {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-top .merchant {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.info-top .merchant:hover {
  color: #409eff;
}

.tags {
  display: flex;
  gap: 8px;
}

.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.price {
  font-size: 22px;
  color: #ea580c;
  font-weight: bold;
}

.original-price {
  font-size: 14px;
  color: #909399;
  text-decoration: line-through;
}

.actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.empty-state {
  padding: 80px 0;
}
</style>
