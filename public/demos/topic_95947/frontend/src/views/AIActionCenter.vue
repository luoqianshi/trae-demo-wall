<template>
  <div class="ai-action-center">
    <div class="page-intro ds-card">
      <div>
        <p class="ds-eyebrow">AI 任务中心</p>
        <h1 class="ds-page-title">行动卡轻量看板</h1>
        <p class="ds-page-desc">聚焦待执行、执行中、待复盘、已完成，让 AI 建议真正落地。</p>
      </div>
      <div class="intro-actions">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="loadCards">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="loadCards">刷新</el-button>
      </div>
    </div>

    <div class="status-summary">
      <button
        v-for="item in summaryCards"
        :key="item.status"
        :class="['summary-card', { active: statusFilter === item.status }]"
        @click="toggleStatus(item.status)"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.count }}</strong>
        <small>{{ item.hint }}</small>
      </button>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />
    <EmptyGuide
      v-else-if="cards.length === 0"
      guide-id="ai-action-center-empty"
      guide-label="AI 行动卡空态引导"
      title="暂无 AI 行动卡"
      description="先在经营首页生成 AI 诊断，再把高优先级建议转成任务卡。"
      :steps="['进入经营首页', '生成今日经营诊断', '将建议生成任务并分配负责人']"
      icon="fas fa-list-check"
    >
      <template #actions>
        <el-button type="primary" @click="router.push('/dashboard')">去经营首页</el-button>
        <el-button @click="router.push('/data-input')">先补充数据</el-button>
      </template>
    </EmptyGuide>

    <div v-else class="kanban-list">
      <section v-for="group in boardGroups" :key="group.value" class="kanban-column ds-card">
        <div class="column-header">
          <div>
            <h3>{{ group.label }}</h3>
            <p>{{ group.desc }}</p>
          </div>
          <span class="ds-tag" :class="group.tagClass">{{ group.cards.length }}</span>
        </div>

        <div v-if="group.cards.length" class="column-cards">
          <article v-for="card in group.cards" :key="card.id" class="action-card">
            <div class="card-title-row">
              <div>
                <div class="tags">
                  <el-tag :type="priorityType(card.priority)" effect="light">{{ priorityText(card.priority) }}</el-tag>
                  <el-tag :type="statusType(card.status)" effect="plain">{{ statusText(card.status) }}</el-tag>
                </div>
                <h4>{{ card.title }}</h4>
              </div>
            </div>

            <p class="problem">{{ card.problem || '来自 AI 结构化诊断的经营建议。' }}</p>
            <p v-if="card.expected_impact || card.suggested_action?.expected_impact" class="impact">
              {{ card.expected_impact || card.suggested_action?.expected_impact }}
            </p>

            <div v-if="card.suggested_action?.steps?.length" class="steps">
              <div v-for="(step, index) in card.suggested_action.steps.slice(0, 3)" :key="`${card.id}-${index}`" class="step">
                <span>{{ index + 1 }}</span>
                <p>{{ step }}</p>
              </div>
            </div>

            <div class="card-meta-grid">
              <label>
                <span>负责人</span>
                <el-input v-model="card.assignee" size="small" placeholder="未分配" @blur="saveCardMeta(card)" />
              </label>
              <label>
                <span>截止</span>
                <el-date-picker v-model="card.due_date" type="date" size="small" value-format="YYYY-MM-DD" placeholder="选择日期" @change="saveCardMeta(card)" />
              </label>
            </div>

            <div class="card-actions">
              <el-select v-model="card.status" size="small" @change="status => updateStatus(card, status)">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-select v-model="materialTypeMap[card.id]" size="small">
                <el-option label="营销文案" value="marketing_copy" />
                <el-option label="会员短信" value="member_sms" />
                <el-option label="员工话术" value="staff_script" />
                <el-option label="短视频脚本" value="short_video_script" />
              </el-select>
              <el-button type="primary" size="small" :loading="workingId === card.id" @click="generateMaterial(card)">生成素材</el-button>
              <el-button size="small" :loading="workingId === card.id" @click="reviewCard(card)">触发复盘</el-button>
              <el-button size="small" :loading="workingId === card.id" @click="closeWithReason(card, 'revoked')">撤回</el-button>
              <el-button size="small" :loading="workingId === card.id" @click="closeWithReason(card, 'rejected')">驳回</el-button>
              <el-button size="small" :loading="workingId === card.id" @click="closeWithReason(card, 'ignored')">不采纳</el-button>
            </div>

            <div v-if="Object.keys(card.material || {}).length" class="material-box">
              <h5>执行素材</h5>
              <div v-for="(material, type) in card.material" :key="type" class="material-item">
                <div>
                  <strong>{{ material.title }}</strong>
                  <p>{{ material.content }}</p>
                  <small>{{ material.usage }}</small>
                </div>
                <el-button size="small" @click="copyText(material.content)">复制</el-button>
              </div>
            </div>

            <div v-if="card.review_result?.analysis" class="review-box">
              <h5>AI 复盘</h5>
              <p>{{ card.review_result.analysis }}</p>
            </div>

            <div v-if="card.review_result?.reason" class="review-box">        
              <h5>{{ statusText(card.review_result.decision || card.status) }}原因</h5>
              <p>{{ card.review_result.reason }}</p>
            </div>
          </article>
        </div>

        <div v-else class="column-empty">暂无{{ group.label }}任务</div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { aiApi } from '@/api'
import EmptyGuide from '@/components/EmptyGuide.vue'

const router = useRouter()
const cards = ref([])
const loading = ref(false)
const workingId = ref('')
const statusFilter = ref('')
const materialTypeMap = reactive({})

const statusOptions = [
  { label: '草稿', value: 'draft', type: 'info', hint: '待确认' },
  { label: '待执行', value: 'todo', type: 'warning', hint: '需跟进' },
  { label: '执行中', value: 'doing', type: 'primary', hint: '进行中' },
  { label: '待复盘', value: 'done', type: 'success', hint: '看效果' },
  { label: '已完成', value: 'reviewed', type: 'success', hint: '已闭环' },
  { label: '已忽略', value: 'ignored', type: 'info', hint: '不处理' },
  { label: '已撤回', value: 'revoked', type: 'info', hint: '已撤回' },
  { label: '已驳回', value: 'rejected', type: 'danger', hint: '不采纳' }
]

const priorityMap = {
  high: { label: '高优先级', type: 'danger' },
  medium: { label: '中优先级', type: 'warning' },
  low: { label: '低优先级', type: 'info' }
}

const boardMeta = [
  { label: '待执行', value: 'todo', desc: '已确认但还未开始', tagClass: 'ds-tag--warning' },
  { label: '执行中', value: 'doing', desc: '需要持续推进', tagClass: 'ds-tag--primary' },
  { label: '待复盘', value: 'done', desc: '已执行，等待效果复盘', tagClass: 'ds-tag--food' },
  { label: '已完成', value: 'reviewed', desc: '已复盘并闭环', tagClass: 'ds-tag--success' },
  { label: '已终止', value: 'closed', desc: '撤回、驳回或不采纳', tagClass: 'ds-tag--default' }
]

const summaryCards = computed(() => statusOptions.map(option => ({
  status: option.value,
  label: option.label,
  hint: option.hint,
  count: cards.value.filter(card => card.status === option.value).length
})))

const boardGroups = computed(() => boardMeta.map(group => ({
  ...group,
  cards: cards.value.filter(card => group.value === 'closed'
    ? ['ignored', 'revoked', 'rejected'].includes(card.status)
    : card.status === group.value)
})))

function statusText(status) {
  return statusOptions.find(item => item.value === status)?.label || status
}

function statusType(status) {
  return statusOptions.find(item => item.value === status)?.type || 'info'
}

function priorityText(priority) {
  return priorityMap[priority]?.label || '中优先级'
}

function priorityType(priority) {
  return priorityMap[priority]?.type || 'warning'
}

function toggleStatus(status) {
  statusFilter.value = statusFilter.value === status ? '' : status
  loadCards()
}

async function loadCards() {
  loading.value = true
  try {
    cards.value = await aiApi.getActionCards(statusFilter.value ? { status: statusFilter.value } : {})
    cards.value.forEach(card => {
      materialTypeMap[card.id] = materialTypeMap[card.id] || 'marketing_copy'
    })
  } catch (error) {
    console.error('Failed to load action cards:', error)
    ElMessage.error('行动卡加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function saveCardMeta(card) {
  try {
    const updated = await aiApi.updateActionCard(card.id, { assignee: card.assignee, due_date: card.due_date })
    Object.assign(card, updated)
    ElMessage.success('任务信息已保存')
  } catch (error) {
    console.error('Failed to save action card:', error)
    ElMessage.error('任务信息保存失败')
  }
}

async function updateStatus(card, status) {
  try {
    if (['ignored', 'revoked', 'rejected'].includes(status)) {
      await closeWithReason(card, status)
      return
    }
    const updated = await aiApi.updateActionCardStatus(card.id, status, {
      audit: { source: 'ai_action_center_status_select' }
    })
    Object.assign(card, updated)
    ElMessage.success('行动卡状态已更新')
  } catch (error) {
    console.error('Failed to update action card status:', error)
    ElMessage.error('状态更新失败')
    await loadCards()
  }
}

async function closeWithReason(card, status) {
  const label = statusText(status)
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `请输入${label}原因，便于后续审计和复盘。`,
      `${label}行动卡`,
      {
        confirmButtonText: '提交',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '例如：风险过高、条件不满足、当前不采纳该建议',
        inputValidator: value => Boolean(value && value.trim()) || '原因不能为空'
      }
    )
    workingId.value = card.id
    const updated = await aiApi.updateActionCardStatus(card.id, status, {
      reason: reason.trim(),
      review_result: { reason: reason.trim(), decision: status },
      audit: { source: 'ai_action_center_reason_dialog' }
    })
    Object.assign(card, updated)
    ElMessage.success(`行动卡状态已更新为${label}`)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('Failed to close action card:', error)
      ElMessage.error(`${label}失败`)
      await loadCards()
    } else {
      await loadCards()
    }
  } finally {
    workingId.value = ''
  }
}

async function generateMaterial(card) {
  workingId.value = card.id
  try {
    const updated = await aiApi.generateActionMaterial(card.id, materialTypeMap[card.id])
    Object.assign(card, updated)
    ElMessage.success('执行素材已生成')
  } catch (error) {
    console.error('Failed to generate material:', error)
    ElMessage.error('素材生成失败')
  } finally {
    workingId.value = ''
  }
}

async function reviewCard(card) {
  workingId.value = card.id
  try {
    await aiApi.reviewActionCard(card.id)
    await loadCards()
    ElMessage.success('AI 复盘已生成')
  } catch (error) {
    console.error('Failed to review action card:', error)
    ElMessage.error('复盘生成失败，请确认任务已执行')
  } finally {
    workingId.value = ''
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch (error) {
    console.error('Failed to copy:', error)
    ElMessage.warning('当前浏览器不支持自动复制，请手动选择文本')
  }
}

onMounted(loadCards)
</script>

<style scoped>
.ai-action-center {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-intro {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.intro-actions {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.intro-actions :deep(.el-select) {
  width: 140px;
}

.status-summary {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  text-align: left;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 16px;
  background: white;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  cursor: pointer;
}

.summary-card.active {
  border-color: var(--ds-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.summary-card span,
.summary-card small {
  display: block;
  color: var(--ds-muted);
}

.summary-card strong {
  display: block;
  margin: 6px 0;
  color: var(--ds-text);
  font-size: 28px;
}

.kanban-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 16px;
  align-items: flex-start;
}

.kanban-column {
  padding: 16px;
  min-height: 280px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.column-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--ds-text);
}

.column-header p {
  margin: 4px 0 0;
  color: var(--ds-muted);
  font-size: 13px;
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.action-card h4 {
  margin: 0;
  color: var(--ds-text);
  line-height: 1.45;
}

.problem,
.impact {
  color: #475569;
  line-height: 1.7;
  margin: 10px 0 0;
}

.impact {
  color: #9a3412;
  background: var(--ds-food-soft);
  border-radius: 12px;
  padding: 10px;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.step span {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.step p {
  margin: 1px 0 0;
  color: #334155;
}

.card-meta-grid,
.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.card-meta-grid label span {
  display: block;
  margin-bottom: 6px;
  color: var(--ds-muted);
  font-size: 12px;
}

.card-actions {
  grid-template-columns: 1fr 1fr;
}

.material-box,
.review-box {
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid var(--ds-border);
}

.material-box h5,
.review-box h5 {
  margin: 0 0 10px;
  color: var(--ds-text);
}

.material-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--ds-border);
}

.material-item p,
.review-box p {
  color: #475569;
  line-height: 1.7;
  margin: 6px 0;
}

.material-item small {
  color: var(--ds-muted);
}

.column-empty {
  border: 1px dashed var(--ds-border);
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  color: var(--ds-muted);
  background: #f8fafc;
}

@media (max-width: 1280px) {
  .kanban-list {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }

  .status-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-intro,
  .intro-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .status-summary,
  .kanban-list,
  .card-meta-grid,
  .card-actions {
    grid-template-columns: 1fr;
  }
}
</style>
