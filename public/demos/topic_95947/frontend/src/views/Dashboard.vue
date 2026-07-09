<template>
  <div class="dashboard">
    <div class="page-hero ds-card" data-guide="dashboard-hero">
      <div>
        <p class="ds-eyebrow">AI 经营驾驶舱</p>
        <h1 class="ds-page-title">今日经营简报</h1>
        <p class="ds-page-desc">先看结论、风险和行动，再进入报表细节。</p>
      </div>
      <div class="hero-actions">
        <el-select v-model="timeRange" placeholder="选择时间" data-guide="dashboard-time-range">
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
        </el-select>
        <el-button data-guide="dashboard-diagnosis-button" type="primary" :loading="diagnosisLoading"
          @click="loadDiagnosis">重新诊断</el-button>
        <el-button @click="startDashboardGuide(true)">剧情引导</el-button>
      </div>
    </div>

    <section class="decision-grid">
      <article class="decision-card conclusion" data-guide="dashboard-conclusion">
        <span class="ds-tag ds-tag--primary"><i class="fas fa-brain"></i> 今日经营结论</span>
        <h2>{{ diagnosisSummary }}</h2>
        <p>{{ diagnosisHint }}</p>
      </article>
      <article class="decision-card risk" data-guide="dashboard-risk">
        <span class="ds-tag ds-tag--danger"><i class="fas fa-triangle-exclamation"></i> 最大风险</span>
        <h3>{{ topRisk }}</h3>
        <p>优先处理会影响营收、库存或复购的问题。</p>
      </article>
      <article class="decision-card action" data-guide="dashboard-primary-action">
        <span class="ds-tag ds-tag--food"><i class="fas fa-bolt"></i> 下一步行动</span>
        <h3>{{ primaryNextStep }}</h3>
        <div class="decision-actions">
          <el-button data-guide="dashboard-create-task" type="primary"
            :loading="savingActionTitle === primaryAction?.title" @click="createPrimaryTask">生成任务</el-button>
          <el-button data-guide="dashboard-data-input" @click="goDataInput">补充数据</el-button>
        </div>
      </article>
    </section>

    <div class="stats-grid">
      <div v-for="item in statCards" :key="item.label" class="stat-card ds-card">
        <div>
          <p class="stat-label">{{ item.label }}</p>
          <p class="stat-value">{{ item.value }}</p>
          <p class="stat-desc">{{ item.desc }}</p>
        </div>
        <div class="stat-icon" :style="{ backgroundColor: item.bg }">
          <i :class="item.icon" :style="{ color: item.color }"></i>
        </div>
      </div>
    </div>

    <section v-if="showInitializationGuide" class="guide-wrap">
      <EmptyGuide guide-id="dashboard-initialization" guide-label="经营初始化引导" title="先完成经营初始化，AI 结论会更可靠"
        description="当前缺少足够的真实经营数据。建议从门店、菜品、订单/销售、营业时间开始补齐。" :steps="initializationSteps" icon="fas fa-utensils"
        tone="food">
        <template #actions>
          <el-button type="primary" @click="goDataInput">录入经营数据</el-button>
          <el-button @click="startDashboardGuide(true)">开始剧情引导</el-button>
          <el-button @click="router.push('/stores')">维护门店</el-button>
          <el-button @click="router.push('/menu')">管理菜品</el-button>
        </template>
      </EmptyGuide>
    </section>

    <div class="risk-opportunity-grid">
      <section class="panel ds-card" data-guide="dashboard-evidence">
        <div class="panel-header">
          <div>
            <h3>经营风险</h3>
            <p>AI 根据当前数据识别出的优先风险。</p>
          </div>
        </div>
        <div v-if="riskList.length" class="compact-list">
          <div v-for="risk in riskList" :key="risk" class="compact-item danger">
            <i class="fas fa-triangle-exclamation"></i>
            <span>{{ risk }}</span>
          </div>
        </div>
        <EmptyGuide v-else guide-id="dashboard-risk-empty" guide-label="经营风险空态引导" title="暂未发现明确风险"
          description="补齐订单、库存和菜品数据后，系统会识别库存、客单价、复购等风险。" :steps="['录入今日订单', '补充菜品成本', '维护库存或热销菜品']" />
      </section>

      <section class="panel ds-card">
        <div class="panel-header">
          <div>
            <h3>经营机会</h3>
            <p>AI 建议优先放大的机会点。</p>
          </div>
        </div>
        <div v-if="opportunityList.length" class="compact-list">
          <div v-for="opportunity in opportunityList" :key="opportunity" class="compact-item success">
            <i class="fas fa-lightbulb"></i>
            <span>{{ opportunity }}</span>
          </div>
        </div>
        <EmptyGuide v-else guide-id="dashboard-opportunity-empty" guide-label="经营机会空态引导" title="暂无可量化机会"
          description="接入更多经营记录后，AI 会给出促销、菜品组合和会员触达机会。" :steps="['补充销售趋势', '补充会员数据', '运行 AI 诊断']" />
      </section>
    </div>

    <div class="ai-grid">
      <section class="panel ds-card">
        <div class="panel-header">
          <div>
            <h3>诊断依据</h3>
            <p>本次判断使用的核心经营指标。</p>
          </div>
        </div>
        <el-skeleton v-if="diagnosisLoading" :rows="4" animated />
        <div v-else-if="evidenceList.length" class="evidence-list">
          <div v-for="item in evidenceList" :key="item.metric" class="evidence-item">
            <span>{{ formatMetricName(item.metric) }}</span>
            <strong>{{ formatEvidenceValue(item.value) }}</strong>
            <small>{{ item.insight || item.compare_to }}</small>
          </div>
        </div>
        <EmptyGuide v-else guide-id="dashboard-evidence-empty" guide-label="诊断依据空态引导" title="暂无诊断依据"
          description="先补充门店、订单或库存数据，AI 会在这里解释每条结论的依据。" :steps="['维护门店信息', '录入订单销售', '重新生成诊断']" />
      </section>

      <section class="panel ds-card next-step-panel" data-guide="dashboard-next-steps">
        <div class="panel-header">
          <div>
            <h3>行动清单</h3>
            <p>把 AI 建议转成可执行动作。</p>
          </div>
        </div>
        <div class="next-step-list">
          <div v-for="(step, index) in nextSteps" :key="`${step}-${index}`" class="next-step">
            <span>{{ index + 1 }}</span>
            <p>{{ step }}</p>
          </div>
        </div>
      </section>
    </div>

    <section class="panel ds-card action-panel" data-guide="dashboard-action-panel">
      <div class="panel-header">
        <div>
          <h3>AI 推荐行动</h3>
          <p>优先处理这些事项，后续可进入 AI 任务中心跟进和复盘。</p>
        </div>
        <el-button data-guide="dashboard-action-center" @click="router.push('/ai-actions')">查看任务中心</el-button>
      </div>
      <el-skeleton v-if="diagnosisLoading" :rows="5" animated />
      <div v-else-if="actionList.length" class="action-grid">
        <AIActionCard v-for="action in actionList" :key="action.title" :action="action"
          :saving="savingActionTitle === action.title" @create-task="handleCreateTask"
          @generate-material="handleGenerateMaterial" @ignore="handleIgnoreAction" />
      </div>
      <EmptyGuide v-else guide-id="dashboard-action-empty" guide-label="AI 推荐行动空态引导" title="暂无行动建议"
        description="当经营数据足够时，AI 会生成可执行行动卡，例如促销方案、会员触达和库存预警。" :steps="['录入今日经营数据', '点击重新诊断', '将高优先级建议生成任务']" />
    </section>

    <div class="charts-row">
      <div class="panel ds-card chart-card">
        <h3>收入趋势</h3>
        <div class="chart-container"><v-chart :option="revenueChartOption" autoresize /></div>
      </div>
      <div class="panel ds-card chart-card">
        <h3>订单来源</h3>
        <div class="chart-container"><v-chart :option="sourceChartOption" autoresize /></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { aiApi } from '@/api'
import AIActionCard from '@/components/AIActionCard.vue'
import EmptyGuide from '@/components/EmptyGuide.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useSpotlightGuide } from '@/composables/useSpotlightGuide'

const router = useRouter()
const dashboardStore = useDashboardStore()
const { startGuide } = useSpotlightGuide()

const timeRange = ref('today')
const diagnosis = ref(null)
const diagnosisLoading = ref(false)
const savingActionTitle = ref('')
const diagnosisErrorNotified = ref(false)

const salesSummary = computed(() => dashboardStore.salesSummary || {})
const revenueTrend = computed(() => dashboardStore.revenueTrend || [])
const customerAnalysis = computed(() => dashboardStore.customerAnalysis || {})

const diagnosisSummary = computed(() => diagnosis.value?.summary || 'AI 正在等待真实经营数据，用来生成今日简报和行动建议。')
const diagnosisHint = computed(() => {
  if (!diagnosis.value) return '点击“重新诊断”，AI 会基于门店、订单、菜品、会员和库存生成结构化诊断。'
  if (diagnosis.value.confidence === 'low') return '当前数据不足，建议先补齐基础经营数据，避免 AI 给出误导性结论。'
  return '建议从高优先级行动开始执行，并在完成后复盘效果。'
})

const evidenceList = computed(() => diagnosis.value?.evidence || [])
const actionList = computed(() => diagnosis.value?.actions || [])
const riskList = computed(() => diagnosis.value?.risks || [])
const opportunityList = computed(() => diagnosis.value?.opportunities || [])
const primaryAction = computed(() => actionList.value[0] || null)
const topRisk = computed(() => riskList.value[0] || '暂无明确高风险，请先补齐经营数据')
const primaryNextStep = computed(() => primaryAction.value?.title || nextSteps.value[0])
const showInitializationGuide = computed(() => !diagnosis.value || diagnosis.value.confidence === 'low')
const initializationSteps = ['维护门店与营业时间', '补齐菜单和热销菜品', '录入订单、会员或库存数据']

const nextSteps = computed(() => diagnosis.value?.next_steps?.length
  ? diagnosis.value.next_steps
  : ['补充门店和订单数据', '运行 AI 经营诊断', '把高优先级建议转成任务'])

const statCards = computed(() => [
  { label: '今日销售额', value: formatCurrency(salesSummary.value.today_sales), desc: '来自今日订单聚合', icon: 'fas fa-yen-sign', color: '#16a34a', bg: '#dcfce7' },
  { label: '今日订单', value: salesSummary.value.today_orders || 0, desc: '今日已记录订单数', icon: 'fas fa-shopping-cart', color: '#b45309', bg: '#f8ead7' },
  { label: '客单价', value: formatCurrency(salesSummary.value.avg_order_value), desc: '销售额 / 订单数', icon: 'fas fa-receipt', color: '#7c2d12', bg: '#ffedd5' },
  { label: '新增会员', value: customerAnalysis.value.new_customers || 0, desc: '今日新增会员线索', icon: 'fas fa-user-plus', color: '#f97316', bg: '#ffedd5' }
])

const revenueChartOption = computed(() => {
  const trend = revenueTrend.value.length ? revenueTrend.value : [
    { date: '周一', sales: 0 }, { date: '周二', sales: 0 }, { date: '周三', sales: 0 },
    { date: '周四', sales: 0 }, { date: '周五', sales: 0 }, { date: '周六', sales: 0 }, { date: '周日', sales: 0 }
  ]
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trend.map(item => item.date) },
    yAxis: { type: 'value', name: '销售额' },
    series: [{ name: '销售额', type: 'line', smooth: true, data: trend.map(item => item.sales || 0), areaStyle: { color: 'rgba(180,83,9,0.12)' }, lineStyle: { color: '#b45309', width: 3 }, itemStyle: { color: '#b45309' } }]
  }
})

const sourceChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', right: '5%', top: 'center' },
  series: [{
    name: '订单来源',
    type: 'pie',
    radius: ['42%', '70%'],
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    data: [
      { value: 45, name: '堂食', itemStyle: { color: '#b45309' } },
      { value: 30, name: '外卖', itemStyle: { color: '#16a34a' } },
      { value: 15, name: '团购', itemStyle: { color: '#f97316' } },
      { value: 10, name: '会员', itemStyle: { color: '#7c2d12' } }
    ]
  }]
}))

function formatCurrency(value) {
  const amount = Number(value || 0)
  return `¥${amount.toFixed(2)}`
}

function formatMetricName(metric) {
  const map = { today_orders: '今日订单', today_sales: '今日销售额', average_order_value: '客单价', low_stock_items: '低库存项' }
  return map[metric] || metric
}

function formatEvidenceValue(value) {
  if (typeof value === 'number') return value.toLocaleString()
  return value ?? '-'
}

async function loadDashboardData() {
  try {
    await dashboardStore.fetchDashboard()
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
}

async function loadDiagnosis() {
  diagnosisLoading.value = true
  try {
    if (timeRange.value === 'today') {
      const brief = await aiApi.getDailyBrief()
      diagnosis.value = {
        ...brief,
        actions: brief.recommended_actions || [],
        evidence: brief.evidence || []
      }
    } else {
      diagnosis.value = await aiApi.structuredDiagnosis(
        { time_range: timeRange.value, include_actions: true },
        { silentError: true }
      )
    }
    diagnosisErrorNotified.value = false
  } catch (error) {
    console.error('Failed to load AI diagnosis:', error)
    if (!diagnosisErrorNotified.value) {
      ElMessage.warning('AI 诊断暂不可用，可先补充经营数据')
      diagnosisErrorNotified.value = true
    }
  } finally {
    diagnosisLoading.value = false
  }
}

function goDataInput() {
  router.push('/data-input')
}

async function createPrimaryTask() {
  if (!primaryAction.value) {
    goDataInput()
    return
  }
  await handleCreateTask(primaryAction.value)
}

async function handleCreateTask(action) {
  savingActionTitle.value = action.title
  try {
    await aiApi.createActionCard({
      title: action.title,
      problem: diagnosisSummary.value,
      evidence: evidenceList.value,
      suggested_action: action,
      priority: action.priority || 'medium',
      data_range: diagnosis.value?.data_range,
      expected_impact: action.expected_impact,
      source: 'dashboard_structured_diagnosis',
      confirmed: true
    })
    ElMessage.success(`已生成行动卡：${action.title}`)
  } catch (error) {
    console.error('Failed to create action card:', error)
    ElMessage.error('行动卡生成失败')
  } finally {
    savingActionTitle.value = ''
  }
}

async function handleGenerateMaterial(action) {
  savingActionTitle.value = action.title
  try {
    const card = await aiApi.createActionCard({
      title: action.title,
      problem: diagnosisSummary.value,
      evidence: evidenceList.value,
      suggested_action: action,
      priority: action.priority || 'medium',
      data_range: diagnosis.value?.data_range,
      expected_impact: action.expected_impact,
      source: 'dashboard_material_generation',
      confirmed: true
    })
    await aiApi.generateActionMaterial(card.id, 'marketing_copy')
    ElMessage.success(`已生成执行素材：${action.title}`)
    router.push('/ai-actions')
  } catch (error) {
    console.error('Failed to generate action material:', error)
    ElMessage.error('执行素材生成失败')
  } finally {
    savingActionTitle.value = ''
  }
}

function handleIgnoreAction(action) {
  ElMessage.success(`已暂不处理：${action.title}`)
}

function startDashboardGuide(force = false) {
  return startGuide({
    guideId: 'dashboard-spotlight-onboarding',
    force,
    meta: { page: 'dashboard' },
    steps: [
      {
        element: '[data-guide="dashboard-hero"]',
        popover: {
          title: '先看今日经营简报',
          description: '这里是经营首页的总入口。新用户先从今日结论、风险和下一步行动看起，不需要一上来钻报表。',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-guide="dashboard-conclusion"]',
        popover: {
          title: '第一步：读 AI 结论',
          description: 'AI 会把订单、菜品、会员、库存等数据压缩成一句经营判断。数据不足时，它会明确提醒你先补数据。',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-guide="dashboard-risk"]',
        popover: {
          title: '第二步：先处理最大风险',
          description: '这里会突出最该优先处理的问题，比如库存、营收波动、复购下降。先处理风险，再看机会。',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-guide="dashboard-primary-action"]',
        popover: {
          title: '第三步：执行下一步行动',
          description: '系统会把建议落到一个明确动作。你可以生成任务，也可以先补充数据，让 AI 判断更稳。',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '[data-guide="dashboard-data-input"]',
        popover: {
          title: '数据不够就先补齐',
          description: '如果当前没有足够真实经营记录，先点这里录入门店、订单、菜品或会员数据。',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '[data-guide="dashboard-action-panel"]',
        popover: {
          title: '把建议变成行动卡',
          description: 'AI 推荐行动会在这里展开。每张卡都可以生成任务、生成素材、后续进入复盘。',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-guide="dashboard-action-center"]',
        popover: {
          title: '最后进入 AI 任务中心',
          description: '任务中心负责跟进执行状态、负责人、截止时间和复盘结果。到这里，新手流程就跑通了。',
          side: 'left',
          align: 'center'
        }
      }
    ]
  })
}

onMounted(async () => {
  await loadDashboardData()
  await loadDiagnosis()
  if (showInitializationGuide.value) {
    startDashboardGuide(false)
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-hero,
.decision-grid,
.stats-grid,
.risk-opportunity-grid,
.ai-grid,
.charts-row,
.action-grid {
  display: grid;
  gap: 18px;
}

.page-hero {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 24px;
}

.hero-actions,
.decision-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.hero-actions :deep(.el-select) {
  width: 128px;
}

.decision-grid {
  grid-template-columns: minmax(0, 1.5fr) minmax(240px, 0.8fr) minmax(260px, 0.9fr);
}

.decision-card {
  min-height: 190px;
  border-radius: 22px;
  padding: 24px;
  color: white;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.decision-card h2,
.decision-card h3,
.decision-card p {
  margin-left: 0;
  margin-right: 0;
}

.decision-card h2 {
  margin-top: 18px;
  margin-bottom: 10px;
  font-size: 24px;
  line-height: 1.4;
}

.decision-card h3 {
  margin-top: 18px;
  margin-bottom: 10px;
  font-size: 20px;
  line-height: 1.45;
}

.decision-card p {
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.conclusion {
  background: linear-gradient(135deg, #0f172a 0%, #7c2d12 64%, #b45309 100%);
}

.risk {
  background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%);
}

.action {
  background: linear-gradient(135deg, #9a3412 0%, #f97316 100%);
}

.stats-grid {
  grid-template-columns: repeat(4, 1fr);
}

.stat-card {
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label,
.stat-value,
.stat-desc {
  margin: 0;
}

.stat-label {
  color: var(--ds-muted);
  font-size: 14px;
}

.stat-value {
  color: var(--ds-text);
  font-size: 28px;
  font-weight: 850;
  margin-top: 8px;
}

.stat-desc {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 6px;
}

.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 24px;
}

.risk-opportunity-grid,
.charts-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ai-grid {
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
}

.panel {
  padding: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-header h3,
.chart-card h3 {
  margin: 0;
  color: var(--ds-text);
  font-size: 18px;
  font-weight: 850;
}

.panel-header p {
  margin: 6px 0 0;
  color: var(--ds-muted);
}

.evidence-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.evidence-item {
  border: 1px solid var(--ds-border);
  border-radius: 14px;
  padding: 14px;
  background: #f8fafc;
}

.evidence-item span,
.evidence-item small {
  display: block;
  color: var(--ds-muted);
}

.evidence-item strong {
  display: block;
  color: var(--ds-text);
  font-size: 24px;
  margin: 8px 0;
}

.next-step-list,
.compact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.next-step,
.compact-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-radius: 14px;
  padding: 12px;
  line-height: 1.6;
}

.next-step {
  background: #f8fafc;
}

.next-step span {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--ds-primary);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.next-step p {
  margin: 0;
  color: #334155;
}

.compact-item.danger {
  color: #991b1b;
  background: var(--ds-danger-soft);
}

.compact-item.success {
  color: #166534;
  background: var(--ds-success-soft);
}

.action-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chart-container {
  height: 300px;
  min-height: 0;
}

@media (max-width: 1200px) {

  .decision-grid,
  .stats-grid,
  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ai-grid,
  .risk-opportunity-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {

  .page-hero,
  .decision-grid,
  .stats-grid,
  .charts-row,
  .action-grid,
  .evidence-list {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .decision-actions,
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
