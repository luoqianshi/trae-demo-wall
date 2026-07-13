<template>
  <div class="dashboard">
    <h2 class="page-title">数据看板</h2>
    
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总鉴别数</div>
            <div class="stat-value">{{ stats.total_identifies }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">今日鉴别</div>
            <div class="stat-value">{{ stats.today_identifies }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">注册用户</div>
            <div class="stat-value">{{ stats.total_users }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">AI 准确率</div>
            <div class="stat-value">{{ (stats.ai_accuracy * 100).toFixed(1) }}%</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>鉴别趋势</span>
        </div>
      </template>
      <div ref="chartRef" class="chart"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { getStats, type StatsData } from '@/api/identify'

const stats = ref<StatsData>({
  total_identifies: 0,
  today_identifies: 0,
  total_users: 0,
  ai_accuracy: 0
})

const chartRef = ref<HTMLElement>()

const initChart = () => {
  if (!chartRef.value) return
  
  const chart = echarts.init(chartRef.value)
  
  // 模拟数据
  const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07']
  const values = [12, 19, 15, 25, 22, 30, 28]
  
  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '鉴别次数',
        type: 'line',
        data: values,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      }
    ]
  })
}

onMounted(async () => {
  try {
    stats.value = await getStats()
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
  
  initChart()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-title {
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
}

.chart {
  height: 300px;
}
</style>
