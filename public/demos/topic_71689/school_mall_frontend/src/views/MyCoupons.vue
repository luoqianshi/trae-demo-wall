<template>
  <div class="my-coupons-page">
    <Header />
    <div class="container">
      <div class="page-header">
        <h2>我的优惠券</h2>
        <div class="tabs">
          <el-radio-group v-model="currentStatus" @change="fetchCoupons">
            <el-radio-button :label="1">未使用</el-radio-button>
            <el-radio-button :label="2">已使用</el-radio-button>
            <el-radio-button :label="3">已过期</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-loading="loading" class="coupon-list">
        <el-row :gutter="20">
          <el-col v-for="item in coupons" :key="item.id" :span="8" :xs="24" :sm="12" :md="8">
            <div class="coupon-card" :class="{ 'is-used': item.status === 2, 'is-expired': item.status === 3 }">
              <div class="coupon-left">
                <div class="value">
                  <span v-if="item.coupon_type === 2">{{ parseFloat(item.coupon_value) }}折</span>
                  <span v-else>¥{{ parseFloat(item.coupon_value) }}</span>
                </div>
                <div class="condition">
                  {{ item.coupon_condition > 0 ? `满${parseFloat(item.coupon_condition)}可用` : '无门槛' }}
                </div>
              </div>
              <div class="coupon-right">
                <div class="name">{{ item.coupon_name }}</div>
                <div class="time">有效期至：{{ formatDate(item.coupon_end_time) }}</div>
                <div class="status-tag">
                  <el-tag v-if="item.status === 1" type="success" effect="plain">未使用</el-tag>
                  <el-tag v-else-if="item.status === 2" type="info" effect="plain">已使用</el-tag>
                  <el-tag v-else type="danger" effect="plain">已过期</el-tag>
                </div>
              </div>
              <div class="coupon-corner">
                <div v-if="item.status === 1" class="corner-text" @click="goToShop">去使用</div>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <el-empty v-if="!loading && coupons.length === 0" description="暂无优惠券" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const coupons = ref([])
const currentStatus = ref(1)

const fetchCoupons = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/coupon/user/list/', {
      params: { status: currentStatus.value }
    })
    if (response.data.code === 200) {
      coupons.value = response.data.data
    }
  } catch (error) {
    console.error('获取优惠券失败:', error)
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const goToShop = () => {
  router.push('/')
}

onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.my-coupons-page {
  min-height: 100vh;
  background-color: #fff7ed;
}

.container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.coupon-list {
  min-height: 400px;
}

.coupon-card {
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  position: relative;
  transition: transform 0.3s;
}

.coupon-card:hover {
  transform: translateY(-5px);
}

.coupon-left {
  width: 120px;
  background: linear-gradient(135deg, #ea580c, #c2410c);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-shrink: 0;
}

.coupon-card.is-used .coupon-left,
.coupon-card.is-expired .coupon-left {
  background: #c0c4cc;
}

.coupon-left .value {
  font-size: 24px;
  font-weight: bold;
}

.coupon-left .condition {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-right .name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.coupon-right .time {
  font-size: 12px;
  color: #909399;
}

.coupon-right .status-tag {
  margin-top: 10px;
}

.coupon-corner {
  position: absolute;
  right: 0;
  bottom: 0;
}

.corner-text {
  background-color: #ea580c;
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-top-left-radius: 8px;
  cursor: pointer;
}

.coupon-card.is-used .corner-text,
.coupon-card.is-expired .corner-text {
  display: none;
}
</style>
