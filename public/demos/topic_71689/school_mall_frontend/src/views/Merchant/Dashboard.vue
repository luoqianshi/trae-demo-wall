<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总销售额</span>
              <el-tag type="success">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <span class="value">¥{{ stats.total_sales || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总订单数</span>
              <el-tag type="primary">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <span class="value">{{ stats.total_orders || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>商品总数</span>
              <el-tag type="warning">已上架</el-tag>
            </div>
          </template>
          <div class="card-body">
            <span class="value">{{ stats.total_products || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总浏览量</span>
              <el-tag type="info">累计</el-tag>
            </div>
          </template>
          <div class="card-body">
            <span class="value">{{ stats.total_views || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="router.push('/merchant/orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" stripe style="width: 100%">
            <el-table-column prop="order_sn" label="订单号" width="180" />
            <el-table-column prop="total_amount" label="金额" width="100">
              <template #default="scope">¥{{ scope.row.total_amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getOrderStatusType(scope.row.status)">
                  {{ getOrderStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="下单时间" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门商品</span>
              <el-button type="primary" link @click="router.push('/merchant/products')">管理商品</el-button>
            </div>
          </template>
          <el-table :data="hotProducts" stripe style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="sales_count" label="销量" width="100" sortable />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="scope">¥{{ scope.row.price }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const stats = ref({})
const recentOrders = ref([])
const hotProducts = ref([])

const fetchDashboardData = async () => {
  try {
    // 这里需要后端提供一个商家统计接口
    // 暂时模拟数据或调用现有接口
    const response = await axios.get('/api/merchant/dashboard-stats/')
    if (response.data.code === 200) {
      stats.value = response.data.data.stats
      recentOrders.value = response.data.data.recent_orders
      hotProducts.value = response.data.data.hot_products
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const getOrderStatusType = (status) => {
  const types = { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }
  return types[status] || 'info'
}

const getOrderStatusText = (status) => {
  const texts = { 0: '待付款', 1: '待发货', 2: '已发货', 3: '已取消' }
  return texts[status] || '未知'
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 10px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card .card-body {
  padding: 10px 0;
}

.stat-card .value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}
</style>
