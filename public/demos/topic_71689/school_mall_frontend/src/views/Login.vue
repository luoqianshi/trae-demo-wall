<template>
  <div class="login-page">
    <div class="login-background">
      <div class="login-container">
        <el-card class="login-card">
          <template #header>
            <h2>用户登录</h2>
          </template>
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="loginForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%; border-radius: 20px;">登录</el-button>
            </el-form-item>
          </el-form>
          <div class="register-link">
            还没有账号？<router-link to="/register">立即注册</router-link>
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
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await axios.post('/api/user/login/', {
          email: loginForm.email,
          password: loginForm.password
        })
        
        if (response.data.code === 200) {
          const { user, tokens } = response.data.data
          localStorage.setItem('token', tokens.access)
          localStorage.setItem('userInfo', JSON.stringify(user))
          
          ElMessage.success('登录成功')
          
          if (user.user_type === 3) {
            router.push('/admin/dashboard')
          } else if (user.user_type === 2) {
            if (user.merchant_info && user.merchant_info.status === 1) {
              router.push('/merchant/dashboard')
            } else {
              ElMessage.warning('您的商家账号还未认证通过，无法进入后台，已为您跳转至首页')
              router.push('/home')
            }
          } else {
            router.push('/home')
          }
        } else {
          ElMessage.error(response.data.message || '登录失败')
        }
      } catch (error) {
        console.error('登录错误:', error)
        const msg = error.response?.data?.message || '登录失败，请检查邮箱和密码'
        ElMessage.error(msg)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style>
.login-page {
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

.login-background {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.login-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(234, 88, 12, 0.15);
  padding: 32px;
  border: none;
}

.login-card h2 {
  text-align: center;
  margin: 0 0 24px 0;
  color: #374151;
  font-size: 24px;
  font-weight: bold;
}

.login-card :deep(.el-card__header) {
  border-bottom: 1px solid #fed7aa;
  padding-bottom: 20px;
}

.login-card :deep(.el-button--primary) {
  background-color: #ea580c;
  border-color: #ea580c;
  border-radius: 20px;
  font-weight: 600;
  padding: 12px 24px;
}

.login-card :deep(.el-button--primary:hover) {
  background-color: #c2410c;
  border-color: #c2410c;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.register-link a {
  color: #ea580c;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
