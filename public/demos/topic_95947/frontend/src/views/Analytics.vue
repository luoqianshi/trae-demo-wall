<template>
  <div class="analytics">
    <div class="page-header">
      <h2 style="width: 200px;">数据分析</h2>
      <el-select v-model="timeRange" placeholder="选择时间范围">
        <el-option label="本周" value="week" />
        <el-option label="本月" value="month" />
        <el-option label="本季度" value="quarter" />
        <el-option label="本年" value="year" />
      </el-select>
    </div>

    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>销售分析</span>
        </template>
        <div class="chart-container">
          <v-chart :option="salesChartOption" autoresize />
        </div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>订单来源</span>
        </template>
        <div class="chart-container">
          <v-chart :option="sourceChartOption" autoresize />
        </div>
      </el-card>
    </div>

    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>客户画像</span>
        </template>
        <div class="customer-profile">
          <div class="profile-item">
            <div class="profile-label">年龄分布</div>
            <div class="profile-chart">
              <v-chart :option="ageChartOption" autoresize />
            </div>
          </div>
          <div class="profile-item">
            <div class="profile-label">消费频次</div>
            <div class="profile-chart">
              <v-chart :option="frequencyChartOption" autoresize />
            </div>
          </div>
        </div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>菜品销量排行</span>
        </template>
        <div class="dish-ranking">
          <div v-for="(item, index) in dishRankings" :key="index" :class="['ranking-item', { 'top-item': index < 3 }]">
            <span :class="['rank', index < 3 ? `top-${index + 1}` : '']">{{ index + 1 }}</span>
            <div class="ranking-info">
              <p class="dish-name">{{ item.name }}</p>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (item.sales / dishRankings[0].sales * 100) + '%' }"></div>
              </div>
            </div>
            <div class="ranking-stats">
              <span class="sales-count">销量 {{ item.sales }}</span>
              <span class="revenue-count">¥{{ item.revenue.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="report-card">
      <template #header>
        <div class="report-header">
          <span>AI分析报告</span>
          <div class="report-actions" style="margin-top: 12px;">
            <el-button type="primary" @click="generateReport" :loading="reportLoading">AI生成报告</el-button>
            <el-button @click="fetchHotDishes" :loading="rankingLoading">获取爆款数据</el-button>
          </div>
        </div>
      </template>
      <div v-if="reportLoading" class="report-loading">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        <span>AI正在分析中，请稍候...</span>
      </div>
      <div v-else-if="reportContent" class="report-content">
        {{ reportContent }}
      </div>
      <div v-else class="report-placeholder">
        <el-icon class="report-icon">
          <Files />
        </el-icon>
        <p>点击上方按钮生成AI分析报告</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import VChart from 'vue-echarts'
import { Files, Loading } from '@element-plus/icons-vue'
import { aiApi, dataInputApi } from '@/api'
import { ElMessage } from 'element-plus'
import { authFetch } from '@/utils/request'

const timeRange = ref('week')
const reportContent = ref('')
const reportLoading = ref(false)
const dishRankings = ref([])

const salesChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['销售额', '订单数']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: [
    {
      type: 'value',
      name: '销售额(元)'
    },
    {
      type: 'value',
      name: '订单数'
    }
  ],
  series: [
    {
      name: '销售额',
      type: 'bar',
      data: [3200, 4500, 3800, 5200, 6800, 8900, 7500],
      itemStyle: {
        color: '#4299e1'
      }
    },
    {
      name: '订单数',
      type: 'line',
      yAxisIndex: 1,
      data: [85, 120, 95, 135, 175, 220, 190],
      itemStyle: {
        color: '#68d391'
      }
    }
  ]
}))

const sourceChartOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  series: [
    {
      name: '订单来源',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 45, name: '堂食', itemStyle: { color: '#4299e1' } },
        { value: 30, name: '外卖', itemStyle: { color: '#68d391' } },
        { value: 15, name: '线上团购', itemStyle: { color: '#ed8936' } },
        { value: 10, name: '会员充值', itemStyle: { color: '#9f7aea' } }
      ]
    }
  ]
}))

const ageChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['18-25', '26-35', '36-45', '46-55', '55+']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      type: 'bar',
      data: [25, 35, 22, 12, 6],
      itemStyle: {
        color: '#4299e1',
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
}))

const frequencyChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['每周1次', '每周2-3次', '每周4-5次', '每天']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      type: 'bar',
      data: [45, 30, 18, 7],
      itemStyle: {
        color: '#68d391',
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
}))

onMounted(async () => {
  await loadSavedAnalysisResult()
})

onActivated(async () => {
  await loadSavedAnalysisResult()
})

async function loadSavedAnalysisResult() {
  try {
    const response = await authFetch(`/api/ai/analysis-result?analysis_type=dish_ranking&time_range=${timeRange.value}`)
    const data = await response.json()
    if (data.success && data.result_data?.rankings) {
      dishRankings.value = data.result_data.rankings
    }
  } catch (error) {
    console.error('Failed to load saved analysis:', error)
  }
}

async function saveAnalysisResult(resultType, data) {
  try {
    await authFetch('/api/ai/analysis-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        analysis_type: resultType,
        time_range: timeRange.value,
        result_data: data
      })
    })
  } catch (error) {
    console.error('Failed to save analysis result:', error)
  }
}

async function generateReport() {
  reportLoading.value = true

  try {
    const response = await authFetch('/api/ai/generate-report/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trend_data: {
          time_range: timeRange.value,
          sales: [3200, 4500, 3800, 5200, 6800, 8900, 7500],
          orders: [85, 120, 95, 135, 175, 220, 190],
          sources: { '堂食': 45, '外卖': 30, '线上团购': 15, '会员充值': 10 }
        }
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullReport = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            await saveAnalysisResult('report', { content: fullReport })
            return
          }
          reportContent.value += data
          fullReport += data
        }
      }
    }
  } catch (error) {
    console.error('Report generation error:', error)
    ElMessage.error('AI生成报告失败，请稍后重试')
  } finally {
    reportLoading.value = false
  }
}

const rankingLoading = ref(false)

async function fetchHotDishes() {
  rankingLoading.value = true

  try {
    const response = await authFetch('/api/ai/dish-ranking/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        time_range: timeRange.value
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            try {
              let cleanResponse = fullResponse.trim()
              if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.substring(7)
              }
              if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.substring(3)
              }
              if (cleanResponse.endsWith('```')) {
                cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3)
              }
              cleanResponse = cleanResponse.trim()

              const parsed = JSON.parse(cleanResponse)
              if (parsed.error) {
                console.error('AI error:', parsed.error)
                ElMessage.error(parsed.error)
              } else if (parsed.rankings) {
                dishRankings.value = parsed.rankings
                await saveAnalysisResult('dish_ranking', { rankings: parsed.rankings })
                ElMessage.success('菜品销量排行已更新')
              } else {
                ElMessage.error('获取菜品销量排行失败')
              }
            } catch (e) {
              console.error('JSON parse error:', e)
              console.error('Raw response:', fullResponse)
              ElMessage.error('获取菜品销量排行失败')
            }
            return
          }
          fullResponse += data
        }
      }
    }
  } catch (error) {
    console.error('Dish ranking error:', error)
    ElMessage.error('获取菜品销量排行失败')
  } finally {
    rankingLoading.value = false
  }
}
</script>

<style scoped>
.analytics {
  padding: 0;
  background: var(--ds-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  box-shadow: var(--ds-shadow-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-title p {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.time-select {
  width: 140px;
  border-radius: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-food));
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #7c2d12, var(--ds-primary));
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chart-container {
  height: 300px;
}

.customer-profile {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.profile-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.profile-header {
  margin-bottom: 12px;
}

.profile-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.profile-chart {
  height: 200px;
}

.dish-ranking {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0px 20px;
  background: #f8fafc;
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.ranking-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
  border-color: #e2e8f0;
}

.ranking-item.top-item {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-color: #fde68a;
}

.rank {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  background: #e2e8f0;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.rank.top-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  animation: pulse-gold 2s infinite;
}

.rank.top-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  color: white;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.4);
}

.rank.top-3 {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
}

@keyframes pulse-gold {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.ranking-info {
  flex: 1;
  min-width: 0;
}

.dish-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ds-primary), var(--ds-food));
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(180, 83, 9, 0.2);
}

.ranking-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.sales-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.revenue-count {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}

.report-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-food) 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.22) !important;
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180, 83, 9, 0.28) !important;
}

.report-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 0;
  color: #94a3b8;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--ds-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 24px;
  color: var(--ds-primary);
}

.report-content {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  min-height: 200px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.04);
}

.report-content :deep(p) {
  font-size: 15px;
  color: #374151;
  line-height: 1.9;
  margin: 0 0 16px 0;
}

.report-content :deep(h3) {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 24px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--ds-primary);
}

.report-content :deep(h4) {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 16px 0 8px 0;
}

.report-content :deep(ul) {
  margin: 0;
  padding-left: 24px;
}

.report-content :deep(li) {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  margin: 8px 0;
  padding-left: 8px;
  position: relative;
}

.report-content :deep(li)::before {
  content: '•';
  position: absolute;
  left: -16px;
  color: var(--ds-primary);
  font-weight: bold;
}

.report-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 0;
  color: #94a3b8;
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #cbd5e1;
  font-size: 28px;
}

.report-placeholder h4 {
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 8px 0;
}

.report-placeholder p {
  font-size: 14px;
  margin: 0;
}
</style>
