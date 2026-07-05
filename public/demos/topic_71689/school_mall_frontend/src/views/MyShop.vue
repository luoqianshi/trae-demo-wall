<template>
  <div class="my-shop-container container">
    <Header />
    
    <div class="content">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>我的商城</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="page-header">
        <h2>我的商城</h2>
        <p class="subtitle">显示您收藏或购买过商品的商家</p>
      </div>

      <el-skeleton :loading="loading" animated :count="3">
        <template #template>
          <div style="padding: 14px">
            <el-skeleton-item variant="image" style="width: 100px; height: 100px" />
            <div style="padding: 14px">
              <el-skeleton-item variant="p" style="width: 50%" />
              <el-skeleton-item variant="text" />
            </div>
          </div>
        </template>
        
        <template #default>
          <div v-if="merchants.length > 0" class="merchant-list">
            <el-row :gutter="20">
              <el-col v-for="merchant in merchants" :key="merchant.id" :xs="24" :sm="12" :md="8" :lg="6">
                <el-card class="merchant-card" shadow="hover" @click="goToShop(merchant.id)">
                  <div class="merchant-info">
                    <el-avatar :size="64" :src="merchant.merchant_logo">
                      <el-icon><Shop /></el-icon>
                    </el-avatar>
                    <div class="details">
                      <h3 class="name">{{ merchant.merchant_name }}</h3>
                      <p class="address">
                        <el-icon><Location /></el-icon>
                        {{ merchant.merchant_address }}
                      </p>
                      <p class="phone">
                        <el-icon><Phone /></el-icon>
                        {{ merchant.contact_phone }}
                      </p>
                    </div>
                  </div>
                  <div class="card-footer">
                    <el-button type="primary" link @click.stop="goToShop(merchant.id)">进入店铺</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          <div v-else class="empty-state">
            <el-empty description="暂无相关商家">
              <el-button type="primary" @click="router.push('/')">去逛逛</el-button>
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
import { Shop, Location, Phone } from '@element-plus/icons-vue'

const router = useRouter()
const merchants = ref([])
const loading = ref(true)

const fetchMyMerchants = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/merchant/my-merchants/')
    if (response.data.code === 200) {
      merchants.value = response.data.data
    }
  } catch (error) {
    console.error('获取我的商城失败:', error)
  } finally {
    loading.value = false
  }
}

const goToShop = (id) => {
  router.push(`/shop/${id}`)
}

onMounted(() => {
  fetchMyMerchants()
})
</script>

<style scoped>
.my-shop-container {
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

.merchant-list {
  margin-top: 20px;
}

.merchant-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.merchant-card:hover {
  transform: translateY(-5px);
}

.merchant-info {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.merchant-info .details {
  margin-left: 15px;
  flex: 1;
  overflow: hidden;
}

.details .name {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.details .address, .details .phone {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
  margin-top: 10px;
  text-align: right;
}

.empty-state {
  padding: 80px 0;
}
</style>
