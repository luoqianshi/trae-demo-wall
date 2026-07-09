<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="header-bg"></div>
      <div class="profile-avatar">
        <div class="avatar-circle">
          <i class="fas fa-store"></i>
        </div>
        <div class="avatar-info">
          <h1>{{ form.name }}</h1>
          <p class="industry-tag">{{ form.industry }} · {{ form.type }}</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="toggleEdit" v-if="!isEditing">
          <i class="fas fa-edit"></i>
          <span>编辑资料</span>
        </el-button>
        <template v-else>
          <el-button type="success" @click="saveProfile">
            <i class="fas fa-check"></i>
            <span>保存</span>
          </el-button>
          <el-button @click="cancelEdit">
            <i class="fas fa-times"></i>
            <span>取消</span>
          </el-button>
        </template>
      </div>
    </div>

    <div class="profile-content">
      <div class="info-card">
        <div class="card-header">
          <i class="fas fa-user-circle"></i>
          <h2>基本信息</h2>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">
              <i class="fas fa-envelope"></i>
              <span>邮箱</span>
            </div>
            <el-input v-model="form.email" disabled class="info-value" />
          </div>
          <div class="info-item">
            <div class="info-label">
              <i class="fas fa-phone"></i>
              <span>联系电话</span>
            </div>
            <el-input v-model="form.phone" :disabled="!isEditing" class="info-value" />
          </div>
          <div class="info-item">
            <div class="info-label">
              <i class="fas fa-map-marker-alt"></i>
              <span>所在地区</span>
            </div>
            <el-input v-model="form.region" :disabled="!isEditing" class="info-value" />
          </div>
          <div class="info-item">
            <div class="info-label">
              <i class="fas fa-store-alt"></i>
              <span>业态类型</span>
            </div>
            <el-select v-model="form.type" :disabled="!isEditing" class="info-value">
              <el-option label="正餐" value="正餐" />
              <el-option label="快餐" value="快餐" />
              <el-option label="小吃" value="小吃" />
              <el-option label="饮品" value="饮品" />
              <el-option label="火锅" value="火锅" />
              <el-option label="烧烤" value="烧烤" />
              <el-option label="其他" value="其他" />
            </el-select>
          </div>
          <div class="info-item">
            <div class="info-label">
              <i class="fas fa-industry"></i>
              <span>行业分类</span>
            </div>
            <el-select v-model="form.industry" :disabled="!isEditing" class="info-value">
              <el-option label="餐饮" value="餐饮" />
              <el-option label="零售" value="零售" />
              <el-option label="服务" value="服务" />
              <el-option label="娱乐" value="娱乐" />
            </el-select>
          </div>
          <div class="info-item full-width">
            <div class="info-label">
              <i class="fas fa-file-alt"></i>
              <span>商家描述</span>
            </div>
            <el-input v-model="form.description" type="textarea" :disabled="!isEditing" rows="3"
              class="info-value textarea" />
          </div>
        </div>
      </div>

      <div class="stats-card">
        <div class="card-header">
          <i class="fas fa-clock"></i>
          <h2>时间信息</h2>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-calendar-plus"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">创建时间</div>
              <div class="stat-value">{{ form.created_at }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">更新时间</div>
              <div class="stat-value">{{ form.updated_at }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { merchantApi } from '@/api'
import { ElMessage } from 'element-plus'

const isEditing = ref(false)
const form = reactive({
  id: '',
  name: '',
  email: '',
  type: '',
  industry: '',
  region: '',
  phone: '',
  description: '',
  created_at: '',
  updated_at: ''
})

const originalForm = {}

async function fetchProfile() {
  const result = await merchantApi.getProfile()
  Object.assign(form, result)
  Object.assign(originalForm, result)

  if (form.created_at) {
    form.created_at = new Date(form.created_at).toLocaleString()
  }
  if (form.updated_at) {
    form.updated_at = new Date(form.updated_at).toLocaleString()
  }
}

function toggleEdit() {
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  Object.assign(form, originalForm)
}

async function saveProfile() {
  const updateData = {
    name: form.name,
    type: form.type,
    industry: form.industry,
    region: form.region,
    phone: form.phone,
    description: form.description
  }

  await merchantApi.updateProfile(updateData)
  ElMessage.success('更新成功')
  isEditing.value = false
  Object.assign(originalForm, form)
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--ds-bg);
}

.profile-header {
  position: relative;
  padding: 28px 24px;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.18), transparent 34%),
    linear-gradient(135deg, #0f2f33 0%, #1f4f46 58%, #92400e 100%);
  opacity: 0.96;
  border-radius: 18px;
}

.profile-avatar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.avatar-circle i {
  font-size: 48px;
  color: white;
}

.avatar-info {
  color: white;
}

.avatar-info h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.industry-tag {
  margin: 8px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

.header-actions {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
}

.header-actions .el-button {
  margin-left: 12px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
}

.header-actions .el-button i {
  margin-right: 6px;
}

.profile-content {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
  margin-top: -40px;
  position: relative;
  z-index: 1;
}

.info-card,
.stats-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--ds-shadow-card);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header i {
  font-size: 20px;
  color: var(--ds-primary);
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.info-label i {
  font-size: 14px;
}

.info-value {
  width: 100%;
}

.info-value.textarea {
  resize: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 247, 237, 0.48);
  border: 1px solid rgba(180, 83, 9, 0.1);
  border-radius: 12px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 24px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

@media (max-width: 768px) {
  .profile-header {
    padding: 30px 20px;
    text-align: center;
  }

  .profile-avatar {
    flex-direction: column;
  }

  .header-actions {
    position: static;
    transform: none;
    margin-top: 20px;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: span 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
