<template>
  <div class="plan-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">健康计划</h2>
        <div class="header-actions">
          <el-button type="success" @click="handleRecommend">智能推荐</el-button>
          <el-button type="primary" @click="openCreateDialog">创建计划</el-button>
        </div>
      </div>

      <div v-loading="loading" class="plan-list">
        <div v-for="plan in plans" :key="plan.id" class="plan-card">
          <div class="plan-header">
            <span class="plan-type">{{ typeText(plan.type) }}</span>
            <el-tag :type="statusTagType(plan.status)" size="small">
              {{ statusText(plan.status) }}
            </el-tag>
          </div>

          <div class="plan-goal">{{ plan.goal }}</div>

          <div class="plan-progress">
            <span class="progress-label">进度</span>
            <el-progress :percentage="plan.progress" :stroke-width="10" />
          </div>

          <div class="plan-period">
            {{ plan.periodStart }} ~ {{ plan.periodEnd }}
          </div>

          <div class="plan-tasks">
            <div v-for="(task, index) in plan.tasks" :key="index" class="task-item">
              · {{ task }}
            </div>
          </div>

          <div class="plan-actions">
            <el-button
              v-if="plan.status === 'ACTIVE'"
              type="primary"
              size="small"
              @click="openCheckinDialog(plan)"
            >
              今日打卡
            </el-button>
          </div>
        </div>

        <div v-if="!loading && plans.length === 0" class="empty-tip">
          暂无健康计划，点击「创建计划」或「智能推荐」开始
        </div>
      </div>
    </div>

    <!-- 创建计划弹窗 -->
    <el-dialog v-model="createVisible" title="创建健康计划" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="计划类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择计划类型" class="full-width">
            <el-option label="减重计划" value="WEIGHT_LOSS" />
            <el-option label="血压管理" value="BLOOD_PRESSURE" />
            <el-option label="血糖管理" value="BLOOD_SUGAR" />
            <el-option label="运动健身" value="EXERCISE" />
            <el-option label="饮食调整" value="DIET" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标描述" prop="goal">
          <el-input v-model="form.goal" placeholder="请输入目标描述" maxlength="100" />
        </el-form-item>
        <el-form-item label="每日任务（每行一条）" prop="tasksText">
          <el-input
            v-model="form.tasksText"
            type="textarea"
            :rows="4"
            placeholder="如：&#10;步行8000步&#10;控制饮食热量"
          />
        </el-form-item>
        <el-form-item label="周期开始" prop="periodStart">
          <el-date-picker
            v-model="form.periodStart"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择开始日期"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="周期结束" prop="periodEnd">
          <el-date-picker
            v-model="form.periodEnd"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择结束日期"
            class="full-width"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 打卡弹窗 -->
    <el-dialog v-model="checkinVisible" title="计划打卡" width="420px">
      <el-form label-position="top">
        <el-form-item label="打卡日期">
          <el-date-picker
            v-model="checkinDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择打卡日期"
            class="full-width"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkinVisible = false">取消</el-button>
        <el-button type="primary" :loading="checking" @click="handleCheckin">确认打卡</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getMyPlans,
  createPlan,
  checkinPlan,
  recommendPlan,
  type PlanVO,
  type PlanStatus
} from '@/api/plan'
import logger from '@/utils/logger'

const loading = ref(false)
const creating = ref(false)
const checking = ref(false)

const plans = ref<PlanVO[]>([])

const formRef = ref<FormInstance>()
const createVisible = ref(false)

// 当前打卡的计划，null 表示未选择
const currentPlan = ref<PlanVO | null>(null)
const checkinVisible = ref(false)
const checkinDate = ref('')

const form = reactive({
  type: '',
  goal: '',
  // 任务文本（每行一条），提交时拆分为数组
  tasksText: '',
  periodStart: '',
  periodEnd: ''
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择计划类型', trigger: 'change' }],
  goal: [{ required: true, message: '请输入目标描述', trigger: 'blur' }],
  tasksText: [{ required: true, message: '请输入每日任务', trigger: 'blur' }],
  periodStart: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  periodEnd: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

// 计划类型文案
const typeText = (type: string): string => {
  const textMap: Record<string, string> = {
    WEIGHT_LOSS: '减重计划',
    BLOOD_PRESSURE: '血压管理',
    BLOOD_SUGAR: '血糖管理',
    EXERCISE: '运动健身',
    DIET: '饮食调整'
  }
  return textMap[type] ?? type
}

// 状态文案
const statusText = (status: PlanStatus): string => {
  const textMap: Record<PlanStatus, string> = {
    ACTIVE: '进行中',
    COMPLETED: '已完成',
    ABANDONED: '已放弃'
  }
  return textMap[status]
}

// 状态标签类型
const statusTagType = (status: PlanStatus): 'success' | 'info' | 'warning' => {
  const typeMap: Record<PlanStatus, 'success' | 'info' | 'warning'> = {
    ACTIVE: 'success',
    COMPLETED: 'info',
    ABANDONED: 'warning'
  }
  return typeMap[status]
}

// 加载计划列表
const loadPlans = async (): Promise<void> => {
  loading.value = true
  try {
    plans.value = await getMyPlans()
  } catch (e) {
    logger.error('加载计划列表失败', e)
  } finally {
    loading.value = false
  }
}

// 打开创建弹窗
const openCreateDialog = (): void => {
  form.type = ''
  form.goal = ''
  form.tasksText = ''
  form.periodStart = ''
  form.periodEnd = ''
  createVisible.value = true
}

// 确认创建
const handleCreate = async (): Promise<void> => {
  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 将文本按行拆分为任务数组，过滤空行
  const tasks = form.tasksText
    .split('\n')
    .map((task) => task.trim())
    .filter((task) => task.length > 0)

  if (tasks.length === 0) {
    ElMessage.error('请至少输入一条任务')
    return
  }

  creating.value = true
  try {
    await createPlan({
      type: form.type,
      goal: form.goal,
      tasks,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd
    })
    ElMessage.success('计划创建成功')
    createVisible.value = false
    await loadPlans()
  } catch (e) {
    logger.error('创建计划失败', e)
  } finally {
    creating.value = false
  }
}

// 智能推荐
const handleRecommend = async (): Promise<void> => {
  loading.value = true
  try {
    const recommended = await recommendPlan()
    if (recommended.length === 0) {
      ElMessage.info('暂无推荐计划，请先完善健康数据')
      return
    }
    // 追加到列表展示（后端推荐接口仅返回建议，未持久化）
    plans.value = [...recommended, ...plans.value]
    ElMessage.success('已为您推荐计划')
  } catch (e) {
    logger.error('获取推荐计划失败', e)
  } finally {
    loading.value = false
  }
}

// 打开打卡弹窗
const openCheckinDialog = (plan: PlanVO): void => {
  currentPlan.value = plan
  // 默认今日
  checkinDate.value = new Date().toISOString().substring(0, 10)
  checkinVisible.value = true
}

// 确认打卡
const handleCheckin = async (): Promise<void> => {
  if (!currentPlan.value) {
    return
  }
  if (!checkinDate.value) {
    ElMessage.error('请选择打卡日期')
    return
  }

  checking.value = true
  try {
    await checkinPlan(currentPlan.value.id, checkinDate.value)
    ElMessage.success('打卡成功')
    checkinVisible.value = false
    await loadPlans()
  } catch (e) {
    logger.error('打卡失败', e)
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  loadPlans()
})
</script>

<style scoped lang="scss">
.plan-page {
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.plan-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 120px;
}

.plan-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.plan-type {
  font-size: 15px;
  font-weight: 600;
  color: #667eea;
}

.plan-goal {
  margin-bottom: 12px;
  font-size: 14px;
  color: #303133;
}

.plan-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  color: #909399;
}

.plan-progress :deep(.el-progress) {
  flex: 1;
}

.plan-period {
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.plan-tasks {
  flex: 1;
  margin-bottom: 12px;
}

.task-item {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.full-width {
  width: 100%;
}

.empty-tip {
  grid-column: 1 / -1;
  padding: 32px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
