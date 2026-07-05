<template>
  <div class="admin-dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-info">
            <div class="stat-title">总用户数</div>
            <div class="stat-value">{{ stats.base_stats.total_users }}</div>
          </div>
          <el-icon class="stat-icon user-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-info">
            <div class="stat-title">总商户数</div>
            <div class="stat-value">{{ stats.base_stats.total_merchants }}</div>
          </div>
          <el-icon class="stat-icon merchant-icon"><Shop /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-info">
            <div class="stat-title">总订单数</div>
            <div class="stat-value">{{ stats.base_stats.total_orders }}</div>
          </div>
          <el-icon class="stat-icon order-icon"><List /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-info">
            <div class="stat-title">总销售额</div>
            <div class="stat-value">¥{{ stats.base_stats.total_sales.toFixed(2) }}</div>
          </div>
          <el-icon class="stat-icon sales-icon"><Money /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <el-card shadow="hover" header="销售趋势 (近7天)">
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" header="待处理事项">
          <div class="todo-list">
            <div class="todo-item" @click="router.push('/admin/merchants')">
              <span class="todo-label">商家审核申请</span>
              <el-badge :value="stats.pending_stats.merchants" :hidden="stats.pending_stats.merchants === 0">
                <el-button link type="primary">去审核</el-button>
              </el-badge>
            </div>
            <div class="todo-item">
              <span class="todo-label">今日新增用户</span>
              <span class="todo-count">{{ stats.today_stats.new_users }}</span>
            </div>
            <div class="todo-item">
              <span class="todo-label">今日订单量</span>
              <span class="todo-count">{{ stats.today_stats.orders }}</span>
            </div>
            <div class="todo-item">
              <span class="todo-label">今日销售额</span>
              <span class="todo-count">¥{{ stats.today_stats.sales.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { User, Shop, List, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()
const chartRef = ref(null)
let myChart = null

const stats = ref({
  base_stats: { total_users: 0, total_merchants: 0, total_products: 0, total_orders: 0, total_sales: 0 },
  today_stats: { orders: 0, sales: 0, new_users: 0 },
  pending_stats: { merchants: 0 },
  sales_trend: []
})

const initChart = () => {
  if (!chartRef.value) return
  
  if (!myChart) {
    myChart = echarts.init(chartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b} <br/>销售额: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats.value.sales_trend.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: stats.value.sales_trend.map(item => item.value),
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 4,
          color: '#409EFF'
        }
      }
    ]
  }

  myChart.setOption(option, true)
}

const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/stats/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      stats.value = response.data.data
      initChart()
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

onMounted(() => {
  fetchStats()
  window.addEventListener('resize', () => myChart && myChart.resize())
})

watch(() => stats.value.sales_trend, () => {
  initChart()
}, { deep: true })
</script>

<style scoped>
.mt-20 { margin-top: 20px; }

.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.2;
}

.user-icon { color: #409EFF; }
.merchant-icon { color: #67C23A; }
.order-icon { color: #E6A23C; }
.sales-icon { color: #F56C6C; }

.chart-container {
  height: 300px;
  width: 100%;
}

.todo-list {
  display: flex;
  flex-direction: column;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.todo-item:last-child { border-bottom: none; }

.todo-label { font-size: 14px; color: #606266; }
.todo-count { font-size: 16px; font-weight: bold; color: #303133; }
</style>
