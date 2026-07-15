<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :md="8">
        <el-card class="profile-card" shadow="hover">
          <div class="profile-header">
            <el-avatar :size="100" :src="userInfo.avatar || ''">
              {{ userInfo.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <h3 class="profile-name">{{ userInfo.nickname || userInfo.username }}</h3>
            <p class="profile-role">
              <el-tag v-for="role in userInfo.roles" :key="role.id" type="info" style="margin-right: 5px;">
                {{ role.name }}
              </el-tag>
            </p>
          </div>
          <el-divider />
          <div class="profile-info">
            <div class="info-item">
              <span class="info-label">用户名：</span>
              <span class="info-value">{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">邮箱：</span>
              <span class="info-value">{{ userInfo.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号：</span>
              <span class="info-value">{{ userInfo.phone || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">注册时间：</span>
              <span class="info-value">{{ formatTime(userInfo.createTime) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :md="16">
        <el-card class="edit-card" shadow="hover">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="头像">
              <UploadImg v-model="form.avatar" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSubmit">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import UploadImg from '@/components/UploadImg.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const userInfo = ref({
  ...userStore.userInfo
})

const form = reactive({
  nickname: '',
  email: '',
  phone: '',
  avatar: ''
})

const formRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        userStore.updateUserInfo(form)
        ElMessage.success('修改成功')
        userInfo.value = { ...userStore.userInfo }
      } catch (error) {
        console.error('Update profile error:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  Object.assign(form, userInfo.value)
})
</script>

<style scoped lang="scss">
.profile-container {
  .profile-card {
    text-align: center;
    border: none;
    border-radius: 8px;
  }

  .profile-header {
    padding: 20px 0;

    .profile-name {
      margin: 15px 0 10px;
      font-size: 20px;
      color: #303133;
    }

    .profile-role {
      margin: 0;
    }
  }

  .profile-info {
    text-align: left;

    .info-item {
      padding: 8px 0;
      font-size: 14px;

      .info-label {
        color: #909399;
        margin-right: 10px;
      }

      .info-value {
        color: #303133;
      }
    }
  }

  .edit-card {
    border: none;
    border-radius: 8px;
  }
}
</style>
