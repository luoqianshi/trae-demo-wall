<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <h1 class="dashboard-title">🏥 个人身体状况监控</h1>
      <p class="dashboard-greeting">实时监控您的健康指标，及时获取专业建议</p>
    </header>

    <!-- 状态概览：正常 / 预警 / 危险 计数 -->
    <section class="summary-section">
      <div class="summary-card summary-normal">
        <span class="summary-count">{{ summary.normal }}</span>
        <span class="summary-label">正常指标</span>
      </div>
      <div class="summary-card summary-warning">
        <span class="summary-count">{{ summary.warning }}</span>
        <span class="summary-label">预警指标</span>
      </div>
      <div class="summary-card summary-danger">
        <span class="summary-count">{{ summary.danger }}</span>
        <span class="summary-label">危险指标</span>
      </div>
    </section>

    <!-- 大类卡片网格 -->
    <section v-loading="loading" class="category-section">
      <div class="category-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
        >
          <div class="category-header">
            <div
              class="category-icon"
              :style="iconStyle(category)"
            >
              {{ category.icon || '🩺' }}
            </div>
            <div class="category-title">{{ category.name }}</div>
          </div>

          <!-- 该大类下的所有指标 -->
          <div
            v-for="metric in category.metrics"
            :key="metric.id"
            class="metric-item"
          >
            <div class="metric-info">
              <span class="metric-name">{{ metric.name }}</span>
              <!-- 异常指标显示告警标签 -->
              <el-tag
                v-if="metric.alertLevel === 'WARNING'"
                size="small"
                type="warning"
                effect="light"
                class="alert-badge"
              >
                ⚠️ 预警
              </el-tag>
              <el-tag
                v-else-if="metric.alertLevel === 'DANGER'"
                size="small"
                type="danger"
                effect="light"
                class="alert-badge"
              >
                🚨 危险
              </el-tag>
            </div>

            <div class="metric-value-wrap">
              <span class="metric-value" :class="alertClass(metric.alertLevel)">
                {{ metric.value }} {{ metric.unit }}
              </span>
              <span class="metric-range">正常: {{ metric.normalRange }}</span>
            </div>

            <!-- 异常指标行显示操作按钮 -->
            <div
              v-if="metric.alertLevel === 'WARNING' || metric.alertLevel === 'DANGER'"
              class="action-buttons"
            >
              <el-button
                size="small"
                type="primary"
                round
                @click="openAdvice(metric.id)"
              >
                💡 健康建议
              </el-button>
              <el-button
                size="small"
                type="danger"
                round
                @click="goConsult(metric.name)"
              >
                👨‍⚕️ 医生解答
              </el-button>
            </div>
          </div>

          <!-- 点击指标项跳转详情 -->
          <div class="category-footer">
            <el-button
              v-for="metric in category.metrics"
              :key="`link-${metric.id}`"
              link
              type="primary"
              size="small"
              class="detail-link"
              @click="goMetricDetail(metric.id)"
            >
              {{ metric.name }}详情
            </el-button>
          </div>
        </div>

        <!-- 接口返回空数据时的占位提示 -->
        <div v-if="!loading && categories.length === 0" class="empty-tip">
          暂无指标数据，请先绑定设备或上报数据
        </div>
      </div>
    </section>

    <!-- 健康建议弹窗 -->
    <HealthAdviceDialog v-model="adviceVisible" :metric-id="adviceMetricId" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getDashboard,
  type CategoryVO,
  type AlertLevel,
  type HealthSummary
} from '@/api/health'
import HealthAdviceDialog from '@/components/HealthAdviceDialog.vue'
import logger from '@/utils/logger'

const router = useRouter()

const loading = ref(false)
const categories = ref<CategoryVO[]>([])
const summary = ref<HealthSummary>({ normal: 0, warning: 0, danger: 0 })

// 健康建议弹窗状态
const adviceVisible = ref(false)
// 当前查看建议的指标ID，null 表示未选择
const adviceMetricId = ref<number | null>(null)

// 告警等级对应的样式类名
const alertClass = (level: AlertLevel): string => {
  const classMap: Record<AlertLevel, string> = {
    NORMAL: 'value-normal',
    WARNING: 'value-warning',
    DANGER: 'value-danger'
  }
  return classMap[level]
}

// 大类图标样式（背景色淡化 + 文字色）
const iconStyle = (category: CategoryVO): Record<string, string> => {
  const color = category.color || '#667eea'
  return {
    background: `${color}20`,
    color
  }
}

// 打开健康建议弹窗
const openAdvice = (metricId: number): void => {
  adviceMetricId.value = metricId
  adviceVisible.value = true
}

// 跳转到问诊页面（携带指标名称作为主诉）
const goConsult = (metricName: string): void => {
  router.push({ path: '/consultation/doctors', query: { metric: metricName } })
}

// 跳转指标详情页
const goMetricDetail = (metricId: number): void => {
  router.push(`/metric/${metricId}`)
}

// 加载看板数据
const loadData = async (): Promise<void> => {
  loading.value = true
  try {
    const dashboard = await getDashboard()
    categories.value = dashboard.categories || []
    summary.value = dashboard.summary || { normal: 0, warning: 0, danger: 0 }
  } catch (e) {
    logger.error('加载健康看板数据失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  max-width: 1200px;
  min-height: 100vh;
  padding: 24px 32px 48px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 24px;
  text-align: center;
  color: #ffffff;
}

.dashboard-title {
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.dashboard-greeting {
  font-size: 14px;
  opacity: 0.9;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.summary-count {
  font-size: 32px;
  font-weight: 700;
}

.summary-label {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}

.summary-normal .summary-count {
  color: #28a745;
}

.summary-warning .summary-count {
  color: #ffc107;
}

.summary-danger .summary-count {
  color: #dc3545;
}

.category-section {
  min-height: 200px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.category-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: 12px;
  font-size: 22px;
  border-radius: 50%;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.metric-item {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.metric-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-name {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.alert-badge {
  margin-left: 4px;
}

.metric-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
}

/* 正常：绿色 */
.value-normal {
  color: #28a745;
}

/* 预警：黄色 + 慢速脉冲动画 */
.value-warning {
  color: #ffc107;
  animation: pulse 2s infinite;
}

/* 危险：红色 + 快速脉冲动画 */
.value-danger {
  color: #dc3545;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.metric-range {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.category-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.detail-link {
  font-size: 12px;
}

.empty-tip {
  grid-column: 1 / -1;
  padding: 48px 0;
  font-size: 15px;
  color: #ffffff;
  text-align: center;
  opacity: 0.85;
}
</style>
