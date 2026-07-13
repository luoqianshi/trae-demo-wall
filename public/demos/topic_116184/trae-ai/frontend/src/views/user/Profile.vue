<template>
  <div class="profile-page">
    <div class="page-card">
      <h2 class="page-title">个人档案</h2>

      <div v-loading="loading" class="profile-content">
        <!-- 基本信息展示（只读） -->
        <div class="info-section">
          <h3 class="section-title">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ profile?.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ profile?.phone }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderText(profile?.gender) }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">{{ profile?.birthDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="身高">{{ profile?.height ? `${profile.height} cm` : '-' }}</el-descriptions-item>
            <el-descriptions-item label="体重">{{ profile?.weight ? `${profile.weight} kg` : '-' }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ roleText(profile?.role) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 健康档案编辑 -->
        <div class="info-section">
          <h3 class="section-title">健康档案</h3>
          <el-form ref="formRef" :model="form" label-position="top">
            <el-form-item label="既往病史">
              <el-input
                v-model="form.medicalHistory"
                type="textarea"
                :rows="3"
                placeholder="请填写既往病史"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="过敏史">
              <el-input
                v-model="form.allergy"
                type="textarea"
                :rows="2"
                placeholder="请填写过敏史"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="用药情况">
              <el-input
                v-model="form.medication"
                type="textarea"
                :rows="2"
                placeholder="请填写当前用药情况"
                maxlength="300"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="紧急联系人及电话">
              <el-input
                v-model="form.emergencyContact"
                placeholder="如：张三 13800000000"
                maxlength="50"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleSave">保存档案</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getProfile, updateProfile, type UserProfile } from '@/api/auth'
import logger from '@/utils/logger'

const loading = ref(false)
const submitting = ref(false)
const profile = ref<UserProfile | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  medicalHistory: '',
  allergy: '',
  medication: '',
  emergencyContact: ''
})

// 性别文案
const genderText = (gender?: string): string => {
  if (!gender) {
    return '-'
  }
  const textMap: Record<string, string> = {
    MALE: '男',
    FEMALE: '女'
  }
  return textMap[gender] ?? gender
}

// 角色文案
const roleText = (role?: string): string => {
  if (!role) {
    return '-'
  }
  const textMap: Record<string, string> = {
    USER: '普通用户',
    DOCTOR: '医生',
    ADMIN: '管理员'
  }
  return textMap[role] ?? role
}

// 加载档案
const loadProfile = async (): Promise<void> => {
  loading.value = true
  try {
    profile.value = await getProfile()
    // 回填健康档案可编辑字段
    form.medicalHistory = profile.value?.medicalHistory ?? ''
    form.allergy = profile.value?.allergy ?? ''
    form.medication = profile.value?.medication ?? ''
    form.emergencyContact = profile.value?.emergencyContact ?? ''
  } catch (e) {
    logger.error('加载用户档案失败', e)
  } finally {
    loading.value = false
  }
}

// 保存健康档案
const handleSave = async (): Promise<void> => {
  submitting.value = true
  try {
    await updateProfile({
      medicalHistory: form.medicalHistory || undefined,
      allergy: form.allergy || undefined,
      medication: form.medication || undefined,
      emergencyContact: form.emergencyContact || undefined
    })
    ElMessage.success('档案已保存')
    await loadProfile()
  } catch (e) {
    logger.error('保存用户档案失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
.profile-page {
  max-width: 900px;
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
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.info-section {
  margin-bottom: 28px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>
