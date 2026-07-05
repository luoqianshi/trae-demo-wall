<template>
  <div class="register-page">
    <div class="register-background">
      <div class="register-container">
        <el-card class="register-card">
          <template #header>
            <h2>用户注册</h2>
          </template>
          <el-form :model="registerForm" :rules="rules" ref="registerFormRef" label-width="100px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="registerForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" />
            </el-form-item>
            <el-form-item label="用户类型" prop="user_type">
              <el-radio-group v-model="registerForm.user_type">
                <el-radio :label="1">学生</el-radio>
                <el-radio :label="2">商户</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleRegister" style="width: 100%; border-radius: 20px;">注册</el-button>
            </el-form-item>
          </el-form>
          <div class="login-link">
            已有账号？<router-link to="/login">立即登录</router-link>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  user_type: 1
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await axios.post('/api/user/register/', {
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          user_type: registerForm.user_type
        })
        
        if (response.data.code === 201) {
          ElMessage.success('注册成功，请登录')
          router.push('/login')
        } else {
          ElMessage.error(response.data.message || '注册失败')
        }
      } catch (error) {
        console.error('注册错误:', error)
        const msg = error.response?.data?.message || error.response?.data?.errors?.email?.[0] || '注册失败，请稍后重试'
        ElMessage.error(msg)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style>
.register-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.register-background {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.register-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(234, 88, 12, 0.15);
  padding: 32px;
  border: none;
}

.register-card h2 {
  text-align: center;
  margin: 0 0 24px 0;
  color: #374151;
  font-size: 24px;
  font-weight: bold;
}

.register-card :deep(.el-card__header) {
  border-bottom: 1px solid #fed7aa;
  padding-bottom: 20px;
}

.register-card :deep(.el-button--primary) {
  background-color: #ea580c;
  border-color: #ea580c;
  border-radius: 20px;
  font-weight: 600;
  padding: 12px 24px;
}

.register-card :deep(.el-button--primary:hover) {
  background-color: #c2410c;
  border-color: #c2410c;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.login-link a {
  color: #ea580c;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
