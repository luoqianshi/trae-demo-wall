<template>
  <div class="metric-detail-page">
    <div class="page-card">
      <div class="page-header">
        <el-button link type="primary" @click="goBack">← 返回看板</el-button>
        <h2 class="page-title">
          {{ metric?.name || '指标详情' }}
          <el-tag
            v-if="metric"
            :type="alertTagType(metric.alertLevel)"
            size="small"
            class="level-tag"
          >
            {{ alertText(metric.alertLevel) }}
          </el-tag>
        </h2>
      </div>

      <!-- 当前值与正常范围 -->
      <div v-if="metric" class="metric-overview">
        <div class="overview-item">
          <span class="overview-label">当前值</span>
          <span class="overview-value" :class="alertClass(metric.alertLevel)">
            {{ metric.value }} {{ metric.unit }}
          </span>
        </div>
        <div class="overview-item">
          <span class="overview-label">正常范围</span>
          <span class="overview-value">{{ metric.normalRange }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">最近采集</span>
          <span class="overview-value">{{ formatTime(metric.recordedAt) }}</span>
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="chart-section">
        <h3 class="section-title">近 7 天趋势</h3>
        <div v-loading="loading" class="chart-container">
          <div ref="chartRef" class="chart-box"></div>
          <el-empty v-if="!loading && trendRecords.length === 0" description="暂无趋势数据" />
        </div>
      </div>

      <!-- 手动上报数据 -->
      <div class="report-section">
        <h3 class="section-title">手动上报数据</h3>
        <el-form :model="reportForm" inline>
          <el-form-item label="指标值">
            <el-input
              v-model="reportForm.value"
              placeholder="请输入指标值"
              clearable
              class="value-input"
            />
          </el-form-item>
          <el-form-item label="采集时间">
            <el-date-picker
              v-model="reportForm.recordedAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="留空则为当前时间"
              class="time-picker"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="reporting" @click="handleReport">
              提交上报
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 历史记录列表 -->
      <div class="history-section">
        <h3 class="section-title">历史记录</h3>
        <el-table v-loading="loading" :data="trendRecords" stripe>
          <el-table-column label="采集时间" prop="recordedAt" min-width="180">
            <template #default="{ row }">
              {{ formatTime(row.recordedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="指标值" min-width="120">
            <template #default="{ row }">
              {{ row.value }} {{ row.unit }}
            </template>
          </el-table-column>
          <el-table-column label="数据来源" prop="source" min-width="120">
            <template #default="{ row }">
              {{ sourceText(row.source) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  getDashboard,
  getTrend,
  reportMetric,
  type MetricVO,
  type HealthRecord,
  type AlertLevel
} from '@/api/health'
import logger from '@/utils/logger'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const reporting = ref(false)
// 指标元数据（含当前值、正常范围、告警等级），null 表示尚未加载
const metric = ref<MetricVO | null>(null)
const trendRecords = ref<HealthRecord[]>([])

// ECharts 图表容器引用
const chartRef = ref<HTMLDivElement>()
// ECharts 实例，null 表示未初始化
let chartInstance: echarts.ECharts | null = null

// 手动上报表单
const reportForm = reactive({
  value: '',
  // 采集时间，留空则由后端默认为当前时间
  recordedAt: ''
})

// 从路由参数获取指标ID；预期为数字字符串
const metricId = ref<number>(Number(route.params.id))

// 告警等级对应的样式类名
const alertClass = (level: AlertLevel): string => {
  const classMap: Record<AlertLevel, string> = {
    NORMAL: 'value-normal',
    WARNING: 'value-warning',
    DANGER: 'value-danger'
  }
  return classMap[level]
}

// 告警等级对应的 el-tag 类型
const alertTagType = (level: AlertLevel): 'success' | 'warning' | 'danger' => {
  const typeMap: Record<AlertLevel, 'success' | 'warning' | 'danger'> = {
    NORMAL: 'success',
    WARNING: 'warning',
    DANGER: 'danger'
  }
  return typeMap[level]
}

// 告警等级文案
const alertText = (level: AlertLevel): string => {
  const textMap: Record<AlertLevel, string> = {
    NORMAL: '正常',
    WARNING: '预警',
    DANGER: '危险'
  }
  return textMap[level]
}

// 数据来源文案
const sourceText = (source: string): string => {
  const textMap: Record<string, string> = {
    MANUAL: '手动录入',
    DEVICE: '设备上报',
    IMPORT: '体检导入'
  }
  return textMap[source] ?? source
}

// 格式化时间显示（截取到分钟）
const formatTime = (iso: string): string => {
  if (!iso) {
    return '-'
  }
  // 后端返回 ISO 字符串或带 T 的格式，截取到分钟
  return iso.replace('T', ' ').substring(0, 16)
}

// 返回看板
const goBack = (): void => {
  router.push('/')
}

// 初始化 ECharts 实例
const initChart = (): void => {
  if (!chartRef.value) {
    return
  }
  chartInstance = echarts.init(chartRef.value)
}

// 渲染趋势折线图
const renderChart = (): void => {
  if (!chartInstance || trendRecords.value.length === 0) {
    return
  }

  // 按采集时间正序排列，便于折线图展示
  const sorted = [...trendRecords.value].sort((a, b) => {
    return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  })

  const xData = sorted.map((item) => formatTime(item.recordedAt))
  const yData = sorted.map((item) => {
    // 数值型指标转 number，文本型保持原值
    const num = Number(item.value)
    return Number.isNaN(num) ? item.value : num
  })
  const unit = sorted[0]?.unit ?? ''

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: unit
    },
    series: [
      {
        name: metric.value?.name ?? '指标值',
        type: 'line',
        smooth: true,
        data: yData,
        itemStyle: {
          color: '#667eea'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        }
      }
    ]
  })
}

// 加载指标元数据（从看板数据中查找）
const loadMetricInfo = async (): Promise<void> => {
  try {
    const dashboard = await getDashboard()
    for (const category of dashboard.categories) {
      for (const item of category.metrics) {
        if (item.id === metricId.value) {
          metric.value = item
          return
        }
      }
    }
  } catch (e) {
    logger.error('加载指标元数据失败', e)
  }
}

// 加载趋势数据
const loadTrend = async (): Promise<void> => {
  loading.value = true
  try {
    trendRecords.value = await getTrend(metricId.value, 7)
    await nextTick()
    renderChart()
  } catch (e) {
    logger.error('加载趋势数据失败', e)
  } finally {
    loading.value = false
  }
}

// 提交手动上报
const handleReport = async (): Promise<void> => {
  if (!reportForm.value) {
    ElMessage.error('请输入指标值')
    return
  }
  reporting.value = true
  try {
    const result = await reportMetric({
      metricId: metricId.value,
      value: reportForm.value,
      recordedAt: reportForm.recordedAt || undefined,
      source: 'MANUAL'
    })
    ElMessage.success(`上报成功，当前告警等级：${alertText(result.alertLevel)}`)
    reportForm.value = ''
    reportForm.recordedAt = ''
    // 上报后刷新趋势数据与元数据
    await Promise.all([loadTrend(), loadMetricInfo()])
  } catch (e) {
    logger.error('上报指标数据失败', e)
  } finally {
    reporting.value = false
  }
}

// 监听窗口尺寸变化，重绘图表
const handleResize = (): void => {
  chartInstance?.resize()
}

onMounted(async () => {
  await nextTick()
  initChart()
  window.addEventListener('resize', handleResize)
  // 并行加载指标元数据与趋势数据
  await Promise.all([loadMetricInfo(), loadTrend()])
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})

// 监听路由参数变化（同一组件复用时重新加载）
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      metricId.value = Number(newId)
      metric.value = null
      trendRecords.value = []
      Promise.all([loadMetricInfo(), loadTrend()])
    }
  }
)
</script>

<style scoped lang="scss">
.metric-detail-page {
  max-width: 1100px;
  padding: 24px 32px 48px;
  margin: 0 auto;
}

.page-card {
  padding: 24px 28px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.level-tag {
  margin-left: 4px;
}

.metric-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.overview-label {
  font-size: 13px;
  color: #909399;
}

.overview-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.value-normal {
  color: #28a745;
}

.value-warning {
  color: #ffc107;
}

.value-danger {
  color: #dc3545;
}

.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-section {
  margin-bottom: 28px;
}

.chart-container {
  min-height: 320px;
}

.chart-box {
  width: 100%;
  height: 320px;
}

.report-section {
  margin-bottom: 28px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.value-input {
  width: 200px;
}

.time-picker {
  width: 240px;
}

.history-section {
  margin-bottom: 12px;
}
</style>
