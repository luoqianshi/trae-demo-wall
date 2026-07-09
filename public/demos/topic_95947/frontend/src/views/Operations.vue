<template>
  <div class="operations">
    <ModuleAIPanel module="运营方案" title="AI 营销方案诊断" />
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="header-title">
          <h1>运营方案</h1>
          <p>管理营销活动、菜单优化等运营方案</p>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="statusFilter" placeholder="状态筛选" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="待执行" :value="0" />
          <el-option label="执行中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
        <el-button type="primary" class="btn-primary" @click="openCreateDialog">
          <i class="fas fa-plus"></i> 创建方案
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.total }}</p>
          <p class="stat-label">方案总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="fas fa-play-circle"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.executing }}</p>
          <p class="stat-label">执行中</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="fas fa-star"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.avgScore }}</p>
          <p class="stat-label">平均评分</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.completed }}</p>
          <p class="stat-label">已完成</p>
        </div>
      </div>
    </div>

    <div class="plan-grid">
      <div v-for="plan in filteredPlans" :key="plan.id" class="plan-card">
        <div class="plan-header">
          <div class="plan-icon" :style="{ background: getTypeColor(plan.type) }">
            <i :class="getTypeIcon(plan.type)"></i>
          </div>
          <div class="plan-badges">
            <span :class="['status-tag', getStatusClass(plan.status)]">{{ getStatusText(plan.status) }}</span>
            <span class="type-tag">{{ plan.type }}</span>
          </div>
        </div>
        <div class="plan-content">
          <h3 class="plan-title">{{ plan.title }}</h3>
          <p class="plan-desc">{{ plan.description || '暂无描述' }}</p>
          <div class="plan-meta">
            <span class="meta-item"><i class="fas fa-calendar"></i> {{ formatDate(plan.created_at) }}</span>
            <span class="meta-item"><i class="fas fa-star"></i> {{ plan.effect_score ? plan.effect_score.toFixed(1) :
              '-' }}</span>
          </div>
        </div>
        <div class="plan-actions">
          <button class="action-btn view" @click="viewPlan(plan)">
            <i class="fas fa-eye"></i> 查看
          </button>
          <button class="action-btn edit" @click="editPlan(plan)">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button class="action-btn delete" @click="deletePlan(plan)">
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredPlans.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <h3>暂无运营方案</h3>
      <p>点击上方按钮创建您的第一个运营方案</p>
    </div>

    <el-dialog :title="isEditing ? '编辑方案' : '创建方案'" v-model="dialogVisible" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="方案名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="方案类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择方案类型">
            <el-option label="营销活动" value="营销活动" />
            <el-option label="菜单优化" value="菜单优化" />
            <el-option label="会员运营" value="会员运营" />
            <el-option label="价格调整" value="价格调整" />
            <el-option label="新店开业" value="新店开业" />
            <el-option label="节日促销" value="节日促销" />
          </el-select>
        </el-form-item>
        <el-form-item label="方案描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入方案描述，帮助AI生成更精准的建议" />
        </el-form-item>
        <el-form-item label="AI建议">
          <div class="ai-suggestion-wrapper">
            <el-input v-model="form.ai_suggestion" type="textarea" :rows="6" />
            <el-button type="primary" class="ai-btn" @click="generateAIAdvice" :loading="aiLoading">
              <i class="fas fa-lightbulb"></i> AI生成建议
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="方案详情" v-model="detailVisible" width="800px">
      <div v-if="selectedPlan" class="plan-detail">
        <div class="detail-header">
          <div class="detail-icon" :style="{ background: getTypeColor(selectedPlan.type) }">
            <i :class="getTypeIcon(selectedPlan.type)"></i>
          </div>
          <div class="detail-info">
            <h3>{{ selectedPlan.title }}</h3>
            <div class="detail-badges">
              <span :class="['status-tag', getStatusClass(selectedPlan.status)]">{{ getStatusText(selectedPlan.status)
                }}</span>
              <span class="type-tag">{{ selectedPlan.type }}</span>
            </div>
          </div>
        </div>
        <div class="detail-content">
          <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> 方案描述</h4>
            <p>{{ selectedPlan.description || '暂无描述' }}</p>
          </div>
          <div class="detail-section">
            <h4><i class="fas fa-star"></i> 效果评分</h4>
            <div class="score-display">
              <span class="score-value">{{ selectedPlan.effect_score ? selectedPlan.effect_score.toFixed(1) : '-'
                }}</span>
              <span class="score-label">/ 10分</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4><i class="fas fa-robot"></i> AI建议</h4>
          <div class="ai-suggestion-content">{{ selectedPlan.ai_suggestion || '暂无AI建议' }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { operationApi, aiApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import ModuleAIPanel from '@/components/ModuleAIPanel.vue'
import { authFetch } from '@/utils/request'

const plans = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const editingId = ref(null)
const selectedPlan = ref(null)
const aiLoading = ref(false)
const statusFilter = ref('')

const form = reactive({
  title: '',
  type: '',
  description: '',
  ai_suggestion: ''
})

const rules = {
  title: [
    { required: true, message: '请输入方案名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择方案类型', trigger: 'change' }
  ]
}

const stats = computed(() => {
  const total = plans.value.length
  const executing = plans.value.filter(p => p.status === 1).length
  const completed = plans.value.filter(p => p.status === 2).length
  const scores = plans.value.filter(p => p.effect_score).map(p => p.effect_score)
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-'
  return { total, executing, completed, avgScore }
})

const filteredPlans = computed(() => {
  if (!statusFilter.value) return plans.value
  return plans.value.filter(p => p.status === parseInt(statusFilter.value))
})

function getTypeColor(type) {
  const colors = {
    '营销活动': 'linear-gradient(135deg, #b45309, #f97316)',
    '菜单优化': 'linear-gradient(135deg, #10b981, #059669)',
    '会员运营': 'linear-gradient(135deg, #f59e0b, #d97706)',
    '价格调整': 'linear-gradient(135deg, #7c2d12, #b45309)',
    '新店开业': 'linear-gradient(135deg, #ec4899, #be185d)',
    '节日促销': 'linear-gradient(135deg, #ef4444, #dc2626)'
  }
  return colors[type] || colors['营销活动']
}

function getTypeIcon(type) {
  const icons = {
    '营销活动': 'fas fa-bullhorn',
    '菜单优化': 'fas fa-utensils',
    '会员运营': 'fas fa-users',
    '价格调整': 'fas fa-tag',
    '新店开业': 'fas fa-store',
    '节日促销': 'fas fa-gift'
  }
  return icons[type] || 'fas fa-file-alt'
}

function getStatusClass(status) {
  const classes = {
    0: 'pending',
    1: 'executing',
    2: 'completed'
  }
  return classes[status] || 'pending'
}

function getStatusText(status) {
  const texts = {
    0: '待执行',
    1: '执行中',
    2: '已完成'
  }
  return texts[status] || '待执行'
}

function formatDate(date) {
  if (!date) return '-'
  if (typeof date === 'string') {
    return date.split('T')[0] || date
  }
  return date.toLocaleDateString('zh-CN')
}

async function fetchPlans() {
  try {
    const response = await operationApi.getPlans()
    plans.value = response.data || response || []
  } catch (error) {
    console.error('获取方案失败:', error)
    plans.value = []
  }
}

function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  form.title = ''
  form.type = ''
  form.description = ''
  form.ai_suggestion = ''
  dialogVisible.value = true
}

function editPlan(plan) {
  isEditing.value = true
  editingId.value = plan.id
  form.title = plan.title
  form.type = plan.type
  form.description = plan.description || ''
  form.ai_suggestion = plan.ai_suggestion || ''
  dialogVisible.value = true
}

function viewPlan(plan) {
  selectedPlan.value = plan
  detailVisible.value = true
}

async function savePlan() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditing.value) {
          await operationApi.updatePlan(editingId.value, form)
          ElMessage.success('更新成功')
        } else {
          await operationApi.createPlan(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        await fetchPlans()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

async function generateAIAdvice() {
  if (!form.title || !form.type) {
    ElMessage.warning('请先填写方案名称和方案类型')
    return
  }

  aiLoading.value = true
  form.ai_suggestion = ''

  try {
    const response = await authFetch('/api/ai/generate-plan-advice/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        description: form.description
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          form.ai_suggestion += data
        }
      }
    }
  } catch (error) {
    console.error('AI advice error:', error)
    ElMessage.error('AI生成建议失败，请稍后重试')
  } finally {
    aiLoading.value = false
  }
}

async function deletePlan(plan) {
  await ElMessageBox.confirm(`确定删除方案「${plan.title}」？`, '提示', {
    type: 'warning'
  })
  await operationApi.deletePlan(plan.id)
  ElMessage.success('删除成功')
  await fetchPlans()
}

onMounted(() => {
  fetchPlans()
})

onActivated(() => {
  fetchPlans()
})
</script>

<style scoped>
.operations {
  padding: 18px;
  background: var(--ds-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px 20px;
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
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
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

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  width: 140px;
  border-radius: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-primary-700)) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.22) !important;
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180, 83, 9, 0.26) !important;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--ds-shadow-card);
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
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-primary-700));
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #2f6f5e, #0f4c5c);
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

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.plan-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.plan-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.plan-badges {
  display: flex;
  gap: 8px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.pending {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.status-tag.executing {
  background: #dcfce7;
  color: #10b981;
}

.status-tag.completed {
  background: #f1f5f9;
  color: #64748b;
}

.type-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: #fef3c7;
  color: #b45309;
}

.plan-content {
  padding: 20px;
}

.plan-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.plan-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 14px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

.plan-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #94a3b8;
}

.meta-item i {
  font-size: 12px;
}

.plan-actions {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.plan-actions .action-btn {
  flex: 1;
  height: 38px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.action-btn.view {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.action-btn.view:hover {
  background: #fff7ed;
}

.action-btn.edit {
  background: #fef3c7;
  color: #f59e0b;
}

.action-btn.edit:hover {
  background: #fde68a;
}

.action-btn.delete {
  background: #fee2e2;
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #94a3b8;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #cbd5e1;
  font-size: 36px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.ai-suggestion-wrapper {
  position: relative;
}

.ai-suggestion-wrapper :deep(.el-textarea) {
  border-radius: 12px;
}

.ai-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  border-radius: 8px !important;
  padding: 6px 16px !important;
  font-size: 13px !important;
}

.plan-detail {
  padding: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.detail-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.detail-info h3 {
  font-size: 20px;
  font-weight: bold;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.detail-badges {
  display: flex;
  gap: 8px;
}

.detail-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.detail-section {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-section p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.score-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--ds-primary);
}

.score-label {
  font-size: 14px;
  color: #64748b;
}

.ai-suggestion-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  line-height: 1.8;
  border: 1px solid #e2e8f0;
}
</style>
