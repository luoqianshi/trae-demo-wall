<template>
  <div class="doctor-list-page">
    <div class="page-card">
      <h2 class="page-title">👨‍⚕️ 在线医生</h2>
      <p class="page-subtitle">选择医生发起问诊，获取专业健康指导</p>

      <div v-loading="loading" class="doctor-grid">
        <div
          v-for="doctor in doctors"
          :key="doctor.id"
          class="doctor-card"
        >
          <div class="doctor-avatar">
            <span class="avatar-text">{{ doctor.name?.charAt(0) ?? '医' }}</span>
            <span class="online-dot" :class="{ online: doctor.online, offline: !doctor.online }"></span>
          </div>

          <div class="doctor-info">
            <div class="doctor-name-row">
              <span class="doctor-name">{{ doctor.name }}</span>
              <el-tag size="small" type="info" effect="plain">{{ doctor.title }}</el-tag>
            </div>
            <div class="doctor-meta">{{ doctor.department }}</div>
            <div class="doctor-specialties">擅长：{{ doctor.specialties }}</div>
            <div class="doctor-rating">
              <span class="rating-label">评分</span>
              <span class="rating-value">{{ doctor.rating ?? '-' }}</span>
            </div>
          </div>

          <div class="doctor-actions">
            <el-button
              type="primary"
              round
              :disabled="!doctor.online"
              @click="openStartDialog(doctor)"
            >
              {{ doctor.online ? '实时问诊' : '离线' }}
            </el-button>
            <el-button round @click="openAsyncDialog(doctor)">异步问诊</el-button>
          </div>
        </div>

        <div v-if="!loading && doctors.length === 0" class="empty-tip">
          暂无在线医生
        </div>
      </div>
    </div>

    <!-- 发起问诊弹窗 -->
    <el-dialog
      v-model="startDialogVisible"
      :title="startDialogTitle"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item v-if="form.type === 'ASYNC'" label="主诉" prop="chiefComplaint">
          <el-input
            v-model="form.chiefComplaint"
            placeholder="请简要描述主要症状或诉求"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="症状描述" prop="symptomDesc">
          <el-input
            v-model="form.symptomDesc"
            type="textarea"
            :rows="3"
            placeholder="请详细描述症状"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="持续时间" prop="duration">
          <el-input v-model="form.duration" placeholder="如：3天、1周" />
        </el-form-item>

        <el-form-item label="伴随症状" prop="accompanying">
          <el-input v-model="form.accompanying" placeholder="如：头晕、乏力等" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleStart">确认发起</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  getOnlineDoctors,
  startConsultation,
  type DoctorVO,
  type ConsultationType
} from '@/api/consultation'
import logger from '@/utils/logger'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const doctors = ref<DoctorVO[]>([])

const formRef = ref<FormInstance>()
const startDialogVisible = ref(false)
// 当前选中的医生，null 表示未选择
const selectedDoctor = ref<DoctorVO | null>(null)

const form = reactive({
  type: 'REALTIME' as ConsultationType,
  chiefComplaint: '',
  symptomDesc: '',
  duration: '',
  accompanying: ''
})

const rules: FormRules = {
  chiefComplaint: [
    { required: true, message: '请输入主诉', trigger: 'blur' }
  ]
}

// 弹窗标题
const startDialogTitle = computed(() => {
  const doctorName = selectedDoctor.value?.name ?? ''
  const typeText = form.type === 'REALTIME' ? '实时问诊' : '异步问诊'
  return `${typeText} - ${doctorName}`
})

// 加载在线医生列表
const loadDoctors = async (): Promise<void> => {
  loading.value = true
  try {
    doctors.value = await getOnlineDoctors()
  } catch (e) {
    logger.error('加载在线医生失败', e)
  } finally {
    loading.value = false
  }
}

// 打开实时问诊弹窗
const openStartDialog = (doctor: DoctorVO): void => {
  selectedDoctor.value = doctor
  form.type = 'REALTIME'
  resetForm()
  startDialogVisible.value = true
}

// 打开异步问诊弹窗
const openAsyncDialog = (doctor: DoctorVO): void => {
  selectedDoctor.value = doctor
  form.type = 'ASYNC'
  resetForm()
  // 从看板跳转携带的指标名称预填到主诉
  const metricName = route.query.metric as string
  if (metricName) {
    form.chiefComplaint = `${metricName}指标异常咨询`
    form.symptomDesc = `我的${metricName}指标出现异常，希望咨询医生建议。`
  }
  startDialogVisible.value = true
}

// 重置表单
const resetForm = (): void => {
  form.chiefComplaint = ''
  form.symptomDesc = ''
  form.duration = ''
  form.accompanying = ''
}

// 发起问诊
const handleStart = async (): Promise<void> => {
  if (!selectedDoctor.value) {
    return
  }
  if (!formRef.value) {
    return
  }

  // 异步问诊必须校验主诉；实时问诊无必填项
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const consultationId = await startConsultation({
      doctorId: selectedDoctor.value.id,
      type: form.type,
      chiefComplaint: form.chiefComplaint || undefined,
      symptomDesc: form.symptomDesc || undefined,
      duration: form.duration || undefined,
      accompanying: form.accompanying || undefined
    })

    ElMessage.success('问诊已发起')
    startDialogVisible.value = false

    // 实时问诊跳转聊天页；异步问诊跳转到异步问诊列表
    if (form.type === 'REALTIME') {
      router.push(`/consultation/chat/${consultationId}`)
    } else {
      router.push('/consultation/async')
    }
  } catch (e) {
    logger.error('发起问诊失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDoctors()
})
</script>

<style scoped lang="scss">
.doctor-list-page {
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

.page-title {
  margin-bottom: 4px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin-bottom: 20px;
  font-size: 13px;
  color: #909399;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  min-height: 120px;
}

.doctor-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.doctor-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.doctor-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.avatar-text {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.online-dot {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.online-dot.online {
  background: #28a745;
}

.online-dot.offline {
  background: #c0c4cc;
}

.doctor-info {
  flex: 1;
  margin-bottom: 12px;
}

.doctor-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.doctor-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.doctor-meta {
  margin-bottom: 4px;
  font-size: 13px;
  color: #606266;
}

.doctor-specialties {
  margin-bottom: 6px;
  font-size: 13px;
  color: #909399;
}

.doctor-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.rating-label {
  color: #909399;
}

.rating-value {
  font-weight: 600;
  color: #ffc107;
}

.doctor-actions {
  display: flex;
  gap: 8px;
}

.empty-tip {
  grid-column: 1 / -1;
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
